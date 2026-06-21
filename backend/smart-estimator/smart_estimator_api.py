"""
Smart Estimator REST API
FastAPI endpoints for the Intelligent 5D cost estimation system with contextual wizard
"""

from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from decimal import Decimal
from datetime import datetime
import json
import logging
import tempfile
import os

from smart_estimator_core import (
    SmartEstimatorService,
    SiteSurveyContext,
    DynamicBIMComponent,
    EquipmentOwnership,
    ConcreteMethod,
    SiteAccess,
    SoilType,
    UtilityAccess,
)

from pricing_database import (
    PRICING_PROFILES,
    list_profiles,
    get_profile,
    create_custom_profile,
    auto_price_components,
)

# Try to import BIM parser and AI enhancement (optional)
try:
    from bim_parser import parse_bim_file, validate_components
    BIM_PARSER_AVAILABLE = True
except Exception:
    BIM_PARSER_AVAILABLE = False

try:
    from ai_enhancement import ai_enhance_components, ai_generate_component_summary
    AI_ENHANCEMENT_AVAILABLE = True
except Exception:
    AI_ENHANCEMENT_AVAILABLE = False

# Try to import PDF parser (in parent directory)
try:
    import sys
    _parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if _parent_dir not in sys.path:
        sys.path.insert(0, _parent_dir)
    from pdf_parser import parse_pdf_file
    PDF_PARSER_AVAILABLE = True
except Exception:
    PDF_PARSER_AVAILABLE = False

# ============================================================================
# SETUP
# ============================================================================

app = FastAPI(
    title="Smart Estimator API",
    description="Intelligent 5D construction cost estimation with contextual decision trees",
    version="3.0.0"
)

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger = logging.getLogger(__name__)

# ============================================================================
# GLOBAL EXCEPTION HANDLER
# ============================================================================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    error_details = []
    for error in exc.errors():
        error_details.append({
            "field": " -> ".join(str(x) for x in error["loc"]),
            "type": error["type"],
            "message": error["msg"],
            "value": str(error.get("input", ""))[:100]
        })

    logger.error(f"Validation error in request: {json.dumps(error_details, indent=2)}")

    return JSONResponse(
        status_code=422,
        content={
            "detail": "Request validation failed",
            "error_count": len(error_details),
            "errors": error_details
        }
    )


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class ContextualWizardInput(BaseModel):
    equipment_ownership: str = Field("rented", description="OWNED | RENTED | HYBRID")
    concrete_method: str = Field("ready_mix", description="READY_MIX | ON_SITE_MIXING")
    site_access: str = Field("urban", description="URBAN | REMOTE | EXTREMELY_REMOTE")
    soil_type: str = Field("mixed", description="SANDY | CLAY | ROCKY | MIXED")
    utility_access: str = Field("full", description="FULL | PARTIAL | NONE")
    site_distance_km: float = Field(10.0, description="Distance from material supplier in km")
    site_narrowness: float = Field(0.5, description="0.0-1.0 scale of space constraints")
    worker_accommodation_available: bool = Field(False, description="Is worker accommodation available?")
    total_project_days: float = Field(120.0, description="Estimated project duration in days")
    daily_worker_count: float = Field(20.0, description="Average daily worker count")
    pricing_profile: str = Field("default", description="Pricing profile to use")


class BIMComponentInput(BaseModel):
    id: str
    ifc_type: str
    description: str
    quantity: float
    unit: str
    material_code: str
    base_material_price: float
    labor_hours_base: float
    labor_rate_per_hour: float = 25.0
    concrete_volume_m3: Optional[float] = None


class EstimationRequestPayload(BaseModel):
    project_name: str
    components: List[BIMComponentInput]
    contextual_wizard: ContextualWizardInput
    profit_margin_percent: float = Field(15.0, ge=5.0, le=50.0, description="Profit margin (5-50%)")


class EstimationResponse(BaseModel):
    bid_id: str
    created_at: str
    project_name: str
    summary: Dict[str, str]
    buyers_list: Dict[str, Any]
    payroll_list: Dict[str, Any]
    logistics_list: Dict[str, Any]


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/health")
async def health():
    return {
        "status": "operational",
        "version": "3.0.0",
        "service": "Smart Estimator API",
        "bim_parser": BIM_PARSER_AVAILABLE,
        "ai_enhancement": AI_ENHANCEMENT_AVAILABLE,
    }


@app.get("/stages")
async def get_workflow_stages():
    return {
        "stages": [
            {"stage": 1, "name": "Data Extraction (The What)", "description": "BIM file is parsed to extract physical objects and quantities"},
            {"stage": 2, "name": "Contextual Wizard (The How)", "description": "User answers questions about equipment, concrete, site conditions"},
            {"stage": 3, "name": "Library Merge (The Price)", "description": "Components matched to pricing library with context-based formulas"},
            {"stage": 4, "name": "Aggregation & Margin (The Total)", "description": "Direct + Indirect + Contingency + Profit = Final Bid"},
            {"stage": 5, "name": "Reporting (The Deliverables)", "description": "Three distinct views for different stakeholders"},
        ]
    }


@app.post("/api/v2/estimate", response_model=EstimationResponse)
async def generate_estimate(payload: EstimationRequestPayload):
    """Generate complete 5D estimate with all three views"""
    try:
        logger.info(f"Received estimate request for project: {payload.project_name}")
        logger.info(f"  Components: {len(payload.components)}")

        estimator = SmartEstimatorService()

        # Set the contextual wizard (Stage 2)
        context = SiteSurveyContext(
            equipment_ownership=EquipmentOwnership[payload.contextual_wizard.equipment_ownership.upper()],
            concrete_method=ConcreteMethod[payload.contextual_wizard.concrete_method.upper()],
            site_access=SiteAccess[payload.contextual_wizard.site_access.upper()],
            soil_type=SoilType[payload.contextual_wizard.soil_type.upper()],
            utility_access=UtilityAccess[payload.contextual_wizard.utility_access.upper()],
            site_distance_km=Decimal(str(payload.contextual_wizard.site_distance_km)),
            site_narrowness=payload.contextual_wizard.site_narrowness,
            worker_accommodation_available=payload.contextual_wizard.worker_accommodation_available,
            total_project_days=Decimal(str(payload.contextual_wizard.total_project_days)),
            daily_worker_count=Decimal(str(payload.contextual_wizard.daily_worker_count)),
            pricing_profile=payload.contextual_wizard.pricing_profile,
        )

        estimator.set_site_context(context)

        # Add components (Stage 1)
        for idx, comp_data in enumerate(payload.components):
            try:
                component = DynamicBIMComponent(
                    id=comp_data.id,
                    ifc_type=comp_data.ifc_type,
                    description=comp_data.description,
                    quantity=Decimal(str(comp_data.quantity)),
                    unit=comp_data.unit,
                    material_code=comp_data.material_code,
                    base_material_price=Decimal(str(comp_data.base_material_price)),
                    labor_hours_base=Decimal(str(comp_data.labor_hours_base)),
                    labor_rate_per_hour=Decimal(str(comp_data.labor_rate_per_hour)),
                    site_context=context,
                    concrete_volume_m3=Decimal(str(comp_data.concrete_volume_m3)) if comp_data.concrete_volume_m3 else None,
                )
                estimator.add_component(component)
            except Exception as e:
                logger.error(f"Error processing component {idx}: {e}")
                raise

        # Generate estimate (Stages 3, 4, 5)
        report = estimator.generate_estimate(
            profit_margin=Decimal(str(payload.profit_margin_percent))
        )

        full_report = report.generate_full_report()

        return EstimationResponse(
            bid_id=full_report['bid_id'],
            created_at=full_report['created_at'],
            project_name=payload.project_name,
            summary=full_report['summary'],
            buyers_list=full_report['buyers_list'],
            payroll_list=full_report['payroll_list'],
            logistics_list=full_report['logistics_list'],
        )

    except Exception as e:
        logger.error(f"Estimation error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/v2/wizard/preview")
async def preview_context_impact(payload: ContextualWizardInput):
    """Preview how contextual wizard answers impact costs"""
    try:
        context = SiteSurveyContext(
            equipment_ownership=EquipmentOwnership[payload.equipment_ownership.upper()],
            concrete_method=ConcreteMethod[payload.concrete_method.upper()],
            site_access=SiteAccess[payload.site_access.upper()],
            soil_type=SoilType[payload.soil_type.upper()],
            utility_access=UtilityAccess[payload.utility_access.upper()],
            site_distance_km=Decimal(str(payload.site_distance_km)),
            site_narrowness=payload.site_narrowness,
            worker_accommodation_available=payload.worker_accommodation_available,
            total_project_days=Decimal(str(payload.total_project_days)),
            daily_worker_count=Decimal(str(payload.daily_worker_count)),
            pricing_profile=payload.pricing_profile,
        )

        return {
            "context_summary": {
                "equipment_ownership": payload.equipment_ownership,
                "concrete_method": payload.concrete_method,
                "site_access": payload.site_access,
                "soil_type": payload.soil_type,
                "utilities": payload.utility_access,
                "pricing_profile": payload.pricing_profile,
            },
            "cost_multipliers": {
                "site_access_multiplier": str(context.context_adjustments.get('site_access', Decimal('1'))),
                "soil_difficulty_factor": str(context.context_adjustments.get('soil_factor', Decimal('1'))),
                "site_narrowness_factor": str(context.context_adjustments.get('narrowness_factor', Decimal('1'))),
            },
            "fixed_costs": {
                "accommodation_cost": str(context.context_adjustments.get('accommodation_cost', Decimal('0'))),
                "utility_setup_cost": str(context.context_adjustments.get('utility_cost', Decimal('0'))),
            },
            "impact_explanation": {
                "equipment": f"Equipment strategy: {payload.equipment_ownership}",
                "concrete": f"Concrete sourcing: {payload.concrete_method}",
                "site": f"Site access multiplier: {context.context_adjustments.get('site_access', Decimal('1'))}x",
                "labor": f"Labor difficulty: {context.context_adjustments.get('soil_factor', Decimal('1'))}x (soil) x {context.context_adjustments.get('narrowness_factor', Decimal('1'))}x (narrowness)",
                "transport": f"Transport distance: {payload.site_distance_km} km",
                "contingency": f"Contingency: {context.context_adjustments.get('contingency_percent', Decimal('10'))}%",
            }
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/v2/example/estimate")
async def example_estimate():
    """Generate example estimate with sample data"""
    example_payload = EstimationRequestPayload(
        project_name="Sample Construction Project - Building A",
        components=[
            BIMComponentInput(
                id="comp_001", ifc_type="IfcFooting",
                description="Isolated Footing - Excavation",
                quantity=10.0, unit="m3",
                material_code="SUP_001_SOIL_EXCAVATION",
                base_material_price=25.0, labor_hours_base=2.5, labor_rate_per_hour=30.0,
            ),
            BIMComponentInput(
                id="comp_002", ifc_type="IfcFooting",
                description="Isolated Footing - Concrete",
                quantity=10.0, unit="m3",
                material_code="SUP_002_CONCRETE",
                base_material_price=150.0, labor_hours_base=3.0, labor_rate_per_hour=35.0,
                concrete_volume_m3=10.0,
            ),
            BIMComponentInput(
                id="comp_003", ifc_type="IfcColumn",
                description="Reinforcement - Steel Rebar",
                quantity=5000.0, unit="kg",
                material_code="SUP_003_REBAR",
                base_material_price=0.85, labor_hours_base=0.5, labor_rate_per_hour=32.0,
            ),
        ],
        contextual_wizard=ContextualWizardInput(
            equipment_ownership="owned",
            concrete_method="on_site_mixing",
            site_access="remote",
            soil_type="clay",
            utility_access="partial",
            site_distance_km=35.0,
            site_narrowness=0.6,
            worker_accommodation_available=False,
            total_project_days=120.0,
            daily_worker_count=25.0,
            pricing_profile="default",
        ),
        profit_margin_percent=20.0,
    )

    return await generate_estimate(example_payload)


@app.get("/api/v2/contextual-wizard")
async def get_contextual_wizard_spec():
    """Get specifications for the Contextual Wizard"""
    return {
        "wizard_title": "Smart Site Survey - Tell us about your project",
        "questions": [
            {
                "id": "equipment_ownership",
                "title": "Equipment Strategy",
                "description": "How will you handle heavy machinery?",
                "type": "select",
                "options": [
                    {"value": "owned", "label": "Owned", "description": "I own the machinery (fuel + maintenance + operator)"},
                    {"value": "rented", "label": "Rented", "description": "Rent from suppliers (daily rates)"},
                    {"value": "hybrid", "label": "Hybrid", "description": "Mix of owned and rented (50/50)"},
                ],
            },
            {
                "id": "concrete_method",
                "title": "Concrete Procurement",
                "description": "How will you source concrete?",
                "type": "select",
                "options": [
                    {"value": "ready_mix", "label": "Ready-Mix", "description": "Order from concrete suppliers"},
                    {"value": "on_site_mixing", "label": "On-Site Mixing", "description": "Mix on-site (raw materials + mixer)"},
                ],
            },
            {
                "id": "site_access",
                "title": "Site Accessibility",
                "description": "How remote is your site?",
                "type": "select",
                "options": [
                    {"value": "urban", "label": "Urban", "description": "City/town - easy access (1.0x)"},
                    {"value": "remote", "label": "Remote", "description": "Outside city - longer travel (1.35x)"},
                    {"value": "extremely_remote", "label": "Extremely Remote", "description": "Very isolated location (1.75x)"},
                ],
            },
            {
                "id": "soil_type",
                "title": "Soil Type",
                "description": "What's the soil like? Affects excavation difficulty",
                "type": "select",
                "options": [
                    {"value": "sandy", "label": "Sandy", "description": "Easy (1.0x)"},
                    {"value": "clay", "label": "Clay", "description": "Moderate (1.2x)"},
                    {"value": "rocky", "label": "Rocky", "description": "Hard (1.5x)"},
                    {"value": "mixed", "label": "Mixed", "description": "Average (1.3x)"},
                ],
            },
            {
                "id": "utility_access",
                "title": "Utilities",
                "description": "Water and electricity availability",
                "type": "select",
                "options": [
                    {"value": "full", "label": "Both Available", "description": "No setup needed ($0)"},
                    {"value": "partial", "label": "One Available", "description": "$5,000 to install missing"},
                    {"value": "none", "label": "None Available", "description": "$12,000 to install both"},
                ],
            },
            {
                "id": "site_distance_km",
                "title": "Distance to Suppliers",
                "description": "Distance from material suppliers in km",
                "type": "number",
                "default": 10, "min": 1, "max": 500,
            },
            {
                "id": "site_narrowness",
                "title": "Site Narrowness",
                "description": "Space constraints (0 = spacious, 1 = very narrow)",
                "type": "range",
                "default": 0.5, "min": 0, "max": 1, "step": 0.1,
            },
            {
                "id": "worker_accommodation_available",
                "title": "Worker Accommodation",
                "description": "Is worker accommodation already available on-site?",
                "type": "boolean",
                "default": False,
            },
            {
                "id": "total_project_days",
                "title": "Project Duration",
                "description": "Estimated project duration in days",
                "type": "number",
                "default": 120, "min": 7, "max": 1825,
            },
            {
                "id": "daily_worker_count",
                "title": "Daily Worker Count",
                "description": "Average number of workers on site per day",
                "type": "number",
                "default": 20, "min": 1, "max": 500,
            },
        ],
    }


# ============================================================================
# PRICING PROFILES
# ============================================================================

@app.get("/api/v2/pricing-profiles")
async def get_pricing_profiles():
    """List available pricing profiles"""
    profiles = list_profiles()
    return {
        "profiles": profiles,
        "default": "default",
    }


@app.get("/api/v2/pricing-profiles/{profile_id}")
async def get_pricing_profile_detail(profile_id: str):
    """Get detailed pricing for a specific profile"""
    if profile_id not in PRICING_PROFILES:
        raise HTTPException(status_code=404, detail=f"Profile '{profile_id}' not found")

    profile = get_profile(profile_id)
    # Convert Decimals to strings for JSON
    return json.loads(json.dumps(profile, default=str))


class CustomProfileRequest(BaseModel):
    name: str = "Custom Profile"
    base_profile: str = "default"
    materials: Optional[Dict[str, float]] = None
    labor_rates: Optional[Dict[str, float]] = None
    indirect_costs: Optional[Dict[str, float]] = None
    contingency_percent: Optional[float] = None


@app.post("/api/v2/pricing-profiles/custom")
async def create_custom_pricing_profile(request: CustomProfileRequest):
    """Create a custom pricing profile based on an existing one"""
    try:
        overrides = {"name": request.name}
        if request.materials:
            overrides["materials"] = request.materials
        if request.labor_rates:
            overrides["labor_rates"] = request.labor_rates
        if request.indirect_costs:
            overrides["indirect_costs"] = request.indirect_costs
        if request.contingency_percent is not None:
            overrides["contingency_percent"] = request.contingency_percent

        profile = create_custom_profile(request.base_profile, overrides)

        # Store temporarily (in-memory for this session)
        profile_id = f"custom_{datetime.now().strftime('%H%M%S')}"
        PRICING_PROFILES[profile_id] = profile

        return {
            "status": "success",
            "profile_id": profile_id,
            "profile": json.loads(json.dumps(profile, default=str)),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# BIM FILE UPLOAD & AI ANALYSIS
# ============================================================================

@app.post("/api/v2/upload/bim-file")
async def upload_bim_file(file: UploadFile = File(...)):
    """Upload BIM file and extract components"""
    if not BIM_PARSER_AVAILABLE:
        raise HTTPException(
            status_code=400,
            detail="BIM parser not available. Install required packages: pip install pandas openpyxl ifcopenshell"
        )

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
            contents = await file.read()
            tmp.write(contents)
            tmp_path = tmp.name

        logger.info(f"Parsing BIM file: {file.filename} (temp: {tmp_path})")
        components = parse_bim_file(tmp_path)
        logger.info(f"Successfully parsed {len(components)} components")
        
        # Auto-fill prices from pricing database for components with price == 0
        components = auto_price_components(components, "default")
        validation = validate_components(components)

        needs_ai = bool(
            validation['missing_prices'] or
            validation['missing_labor_hours']
        )

        return {
            "status": "success",
            "filename": file.filename,
            "total_components": len(components),
            "components": components,
            "validation": validation,
            "needs_ai_enhancement": needs_ai,
            "ai_available": AI_ENHANCEMENT_AVAILABLE,
            "next_step": (
                "POST /api/v2/bim/enhance-with-ai" if needs_ai and AI_ENHANCEMENT_AVAILABLE
                else "POST /api/v2/estimate with components and contextual_wizard"
            ),
        }

    except Exception as e:
        logger.error(f"BIM upload error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"BIM parsing failed: {str(e)}")

    finally:
        if tmp_path:
            try:
                os.remove(tmp_path)
            except Exception:
                pass


@app.post("/api/v2/upload/pdf-file")
async def upload_pdf_file(file: UploadFile = File(...)):
    """Upload PDF floor plan and extract components (doors, windows, rooms, etc.)"""
    if not PDF_PARSER_AVAILABLE:
        raise HTTPException(
            status_code=400,
            detail="PDF parser not available. Install: pip install pdfplumber pytesseract pillow"
        )

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            contents = await file.read()
            tmp.write(contents)
            tmp_path = tmp.name

        components = parse_pdf_file(tmp_path)

        # Auto-fill prices from pricing database
        components = auto_price_components(components, "default")

        return {
            "status": "success",
            "filename": file.filename,
            "total_components": len(components),
            "components": components,
            "validation": {
                "total": len(components),
                "missing_prices": sum(1 for c in components if not c.get('unit_price')),
                "missing_labor_hours": sum(1 for c in components if not c.get('labor_hours_base')),
            },
            "needs_ai_enhancement": False,
            "ai_available": AI_ENHANCEMENT_AVAILABLE,
        }

    except Exception as e:
        logger.error(f"PDF upload error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

    finally:
        if tmp_path:
            try:
                os.remove(tmp_path)
            except Exception:
                pass


@app.post("/api/v2/bim/enhance-with-ai")
async def enhance_components_with_ai(
    components: List[BIMComponentInput],
    use_ai: bool = True
):
    """Use AI to enhance/fill missing component data"""
    if not AI_ENHANCEMENT_AVAILABLE:
        raise HTTPException(
            status_code=400,
            detail=(
                "AI enhancement not available. "
                "Install: pip install google-generativeai\n"
                "Get free API key at: https://aistudio.google.com/app/apikey\n"
                "Set: export GOOGLE_API_KEY=your-key-here"
            )
        )

    try:
        components_dict = [comp.dict() for comp in components]
        enhanced = ai_enhance_components(components_dict)
        summary = ai_generate_component_summary(enhanced)

        return {
            "status": "success",
            "enhanced_components": enhanced,
            "summary": summary,
            "total_components": len(enhanced),
            "missing_prices": [c['id'] for c in enhanced if c.get('base_material_price', 0) == 0],
            "next_step": "POST /api/v2/estimate with enhanced components",
        }
    except Exception as e:
        logger.error(f"AI enhancement error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/v2/bim/setup-ai")
async def get_ai_setup_instructions():
    """Get setup instructions for AI enhancement (Google Gemini)"""
    return {
        "ai_available": AI_ENHANCEMENT_AVAILABLE,
        "instructions": {
            "step_1": "Visit https://aistudio.google.com/app/apikey",
            "step_2": "Sign up (free, no credit card needed)",
            "step_3": "Copy your API key",
            "step_4": "Set environment variable: export GOOGLE_API_KEY='your-key-here'",
            "step_5": "Install: pip install google-generativeai",
            "step_6": "Restart API: python run_api.py",
        },
        "free_tier": {
            "requests_per_minute": 60,
            "requests_per_day": 1500,
            "cost": "$0.00",
            "model": "Gemini 1.5 Flash",
        },
    }


# ============================================================================
# ERROR HANDLING
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "timestamp": datetime.now().isoformat()
        }
    )


# ============================================================================
# MOUNT STATIC FILES (after all API routes)
# ============================================================================

try:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    app.mount("/", StaticFiles(directory=os.path.join(current_dir, "static"), html=True), name="static")
except Exception as e:
    print(f"Warning: Could not mount static files: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "smart_estimator_api:app",
        host="0.0.0.0",
        port=8002,
        reload=True
    )
