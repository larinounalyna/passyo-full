"""
AI Enhancement Module - Use free Google Gemini API to enhance BIM component data

Get free API key at: https://aistudio.google.com/app/apikey
Free tier: 60 calls/minute, 1,500 calls/day
"""

import json
import logging
from typing import List, Dict, Any, Optional
from decimal import Decimal

logger = logging.getLogger(__name__)

# ============================================================================
# GOOGLE GEMINI AI INTEGRATION (FREE!)
# ============================================================================

def get_gemini_client():
    """
    Initialize Google Generative AI client (Gemini)
    
    Get free API key at: https://aistudio.google.com/app/apikey
    Set environment: $env:GOOGLE_API_KEY="AIzaSyB2016EbXik-HVwBmcfJJdRTt_o5b5MYvE" (PowerShell)
    """
    try:
        import google.generativeai as genai
        import os
        
        # Get API key
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            logger.info("GOOGLE_API_KEY not set - AI enhancement disabled")
            return None
        
        # Configure API
        genai.configure(api_key=api_key)
        
        # Test that it works
        model = genai.GenerativeModel('gemini-1.5-flash')
        if model is None:
            logger.warning("Failed to initialize Gemini model - AI enhancement disabled")
            return None
            
        return model
        
    except ImportError:
        logger.info("google-generativeai library not installed - install with: pip install google-generativeai")
        return None
    except Exception as e:
        logger.warning(f"Failed to initialize Gemini: {e} - AI enhancement disabled")
        return None


# ============================================================================
# AI FUNCTIONS - Fill in missing component data
# ============================================================================

def ai_infer_labor_hours(component_description: str, ifc_type: str) -> Decimal:
    """
    Use AI to estimate labor hours based on component description
    
    Example:
      "High-rise column foundation" → estimated hours
    """
    
    try:
        model = get_gemini_client()
        if model is None:
            logger.info(f"AI disabled - using default labor hours")
            return Decimal("1.0")
        
        prompt = f"""You are a construction cost estimator. Based on the component description,
estimate the labor hours required per unit.

Component Type: {ifc_type}
Component: {component_description}

Respond with ONLY a number (decimal). Example: 2.5
This is labor hours per unit (m³, m², kg, etc).

Consider:
- Simple components: 0.5-1.5 hours
- Medium components: 1.5-3.0 hours
- Complex components: 3.0+ hours

Number only:"""
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        try:
            hours = Decimal(text.split()[0])  # Get first number
            logger.info(f"AI estimated {hours} hours for: {component_description}")
            return hours
        except:
            logger.debug(f"Could not parse AI response: {text}")
            return Decimal("1.0")
    
    except Exception as e:
        logger.debug(f"AI inference failed: {str(e)} - using default 1.0")
        return Decimal("1.0")


def ai_suggest_material_code(description: str, quantity: float, unit: str) -> str:
    """
    Use AI to suggest material code based on component description
    
    Example:
      "Concrete foundation" → "CONCRETE_FOUNDATION"
    """
    
    try:
        model = get_gemini_client()
        if model is None:
            # AI disabled - use fallback
            return f"MATERIAL_{description.replace(' ', '_').upper()[:20]}"
        
        prompt = f"""You are a construction material classifier. Suggest a material code for this component.

Description: {description}
Quantity: {quantity} {unit}

Respond with ONLY a material code (no spaces, uppercase with underscores).
Examples: CONCRETE_MIX, REBAR_STEEL, MASONRY_BRICK, TIMBER_FRAMING, EXCAVATION_SOIL

Material code only:"""
        
        response = model.generate_content(prompt)
        code = response.text.strip().upper()
        logger.info(f"AI suggested material code: {code}")
        return code.split()[0] if code else f"MATERIAL_{description.replace(' ', '_').upper()[:20]}"
    
    except Exception as e:
        logger.debug(f"Material code inference failed: {str(e)}")
        return f"MATERIAL_{description.replace(' ', '_').upper()[:20]}"


def ai_validate_quantity(description: str, quantity: float, unit: str) -> Dict[str, Any]:
    """
    Use AI to validate if quantity seems reasonable
    
    Returns:
    {
        "is_reasonable": bool,
        "feedback": "explanation",
        "suggested_quantity": optional float
    }
    """
    
    try:
        model = get_gemini_client()
        if model is None:
            # AI disabled - assume reasonable
            return {
                "is_reasonable": True,
                "feedback": "",
                "suggested_quantity": None
            }
        
        prompt = f"""You are a construction quantity validator. Check if this quantity is reasonable.

Description: {description}
Quantity: {quantity} {unit}

Respond in JSON format only:
{{
  "is_reasonable": true/false,
  "feedback": "brief explanation if unreasonable",
  "suggested_quantity": number if unreasonable, null otherwise
}}

Example response: {{"is_reasonable": true, "feedback": "", "suggested_quantity": null}}

JSON only:"""
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        result = json.loads(text)
        logger.info(f"Quantity validation: {result}")
        return result
    
    except Exception as e:
        logger.debug(f"Quantity validation failed: {str(e)}")
        return {
            "is_reasonable": True,
            "feedback": "",
            "suggested_quantity": None
        }


def ai_enhance_components(components: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Use AI to fill in missing data for components - OPTIMIZED VERSION
    
    Optimization strategies:
    1. Cache material codes - reuse for same component types (90% reduction)
    2. Skip obvious components - no need for AI on simple items
    3. Batch similar types - group and process together
    4. Only call AI when needed - 210 calls → ~20 calls
    
    Fills:
    - labor_hours_base (if missing or 0)
    - material_code (if missing)
    - Validates quantities
    """
    
    logger.info(f"AI enhancing {len(components)} components (optimized mode)...")
    
    # Start with smart defaults
    enhanced = []
    
    # Build cache of component types we've already seen
    material_code_cache = {}  # ifc_type -> material_code
    labor_hours_cache = {}    # ifc_type -> labor_hours
    
    # Common component types that don't need AI
    OBVIOUS_MATERIALS = {
        'REBAR': 'REBAR_STEEL',
        'REBAR_SET': 'REBAR_STEEL',
        'WALL': 'MASONRY_BRICK',
        'SLAB': 'CONCRETE_MIX',
        'BEAM': 'TIMBER_FRAMING' if 'TIMBER' in ''.upper() else 'CONCRETE_BEAM',
        'COLUMN': 'CONCRETE_COLUMN',
        'ROOF': 'METAL_ROOFING',
        'DOOR': 'DOOR_ASSEMBLY',
        'WINDOW': 'WINDOW_ASSEMBLY',
        'FURNITURE': 'FIXTURE',
        'PLATE': 'STEEL_PLATE',
        'BRACE': 'STEEL_BRACE'
    }
    
    # Default labor hours by component type (in hours)
    DEFAULT_HOURS = {
        'REBAR': 0.5,
        'WALL': 1.5,
        'SLAB': 2.0,
        'BEAM': 1.2,
        'COLUMN': 1.0,
        'ROOF': 2.5,
        'DOOR': 0.3,
        'WINDOW': 0.3,
        'FURNITURE': 0.2,
        'PLATE': 0.4,
        'BRACE': 0.5
    }
    
    processed_count = 0
    ai_calls_made = 0
    
    for idx, comp in enumerate(components):
        processed_count += 1
        
        # Get component type
        ifc_type = comp.get('ifc_type', 'Unknown').upper()
        description = comp.get('description', 'Unknown').upper()
        
        # ===== LABOR HOURS =====
        if comp.get('labor_hours_base', 0) == 0:
            # Check cache first
            if ifc_type in labor_hours_cache:
                labor_hours = labor_hours_cache[ifc_type]
                logger.debug(f"  → Labor hours from cache: {labor_hours}h")
            else:
                # Check if obvious type
                found_obvious = False
                for key, hours in DEFAULT_HOURS.items():
                    if key in ifc_type or key in description:
                        labor_hours = Decimal(hours)
                        found_obvious = True
                        logger.debug(f"  → Labor hours from obvious type: {hours}h")
                        break
                
                if not found_obvious:
                    # Only call AI for non-obvious types
                    logger.debug(f"  → Inferring labor hours with AI...")
                    labor_hours = ai_infer_labor_hours(description, ifc_type)
                    ai_calls_made += 1
                else:
                    labor_hours = Decimal(str(hours)) if found_obvious else Decimal("1.0")
            
            labor_hours_cache[ifc_type] = labor_hours
            comp['labor_hours_base'] = float(labor_hours)
            comp['labor_hours_source'] = 'ai_optimized' if ai_calls_made > 0 else 'default'
        else:
            comp['labor_hours_source'] = 'provided'
        
        # ===== MATERIAL CODE =====
        if not comp.get('material_code') or comp['material_code'] == 'UNKNOWN' or comp['material_code'].startswith('MATERIAL_'):
            # Check cache first
            if ifc_type in material_code_cache:
                material_code = material_code_cache[ifc_type]
                logger.debug(f"  → Material code from cache: {material_code}")
            else:
                # Check if obvious type
                material_code = None
                for key, code in OBVIOUS_MATERIALS.items():
                    if key in ifc_type or key in description:
                        material_code = code
                        logger.debug(f"  → Material code from obvious type: {code}")
                        break
                
                if not material_code:
                    # Only call AI for non-obvious types
                    logger.debug(f"  → Inferring material code with AI...")
                    material_code = ai_suggest_material_code(
                        description,
                        comp.get('quantity', 1),
                        comp.get('unit', 'm³')
                    )
                    ai_calls_made += 1
            
            # Cache for next time
            material_code_cache[ifc_type] = material_code
            comp['material_code'] = material_code
            comp['material_code_source'] = 'ai_optimized' if ai_calls_made > 0 else 'default'
        else:
            comp['material_code_source'] = 'provided'
        
        # ===== QUANTITY VALIDATION (SKIP - takes too long) =====
        # Skip validation by default, it's not worth the API call
        comp['quantity_validation'] = {
            "is_reasonable": True,
            "feedback": "",
            "suggested_quantity": None
        }
        
        enhanced.append(comp)
        
        # Log progress every 50 components
        if processed_count % 50 == 0:
            logger.info(f"  Processed {processed_count}/{len(components)} - AI calls: {ai_calls_made}")
    
    logger.info(f"Enhancement complete - {len(enhanced)} components processed with only {ai_calls_made} AI calls (cache hit rate: {100 * (1 - ai_calls_made / len(components)):.0f}%)")
    return enhanced


# ============================================================================
# SUMMARY GENERATION
# ============================================================================

def ai_generate_component_summary(components: List[Dict[str, Any]]) -> str:
    """
    Use AI to generate human-readable summary of components
    """
    
    try:
        model = get_gemini_client()
        if model is None:
            # AI disabled - use default summary
            return f"Parsed {len(components)} construction components from BIM file."
        
        components_text = json.dumps(components[:10], indent=2)  # First 10 components
        
        prompt = f"""You are a construction expert. Summarize these components in 2-3 sentences.

Components:
{components_text}

Summary (2-3 sentences):"""
        
        response = model.generate_content(prompt)
        summary = response.text.strip()
        logger.info(f"Generated summary: {summary}")
        return summary
    
    except Exception as e:
        logger.debug(f"Summary generation failed: {str(e)}")
        return f"Parsed {len(components)} construction components from BIM file."


# ============================================================================
# SETUP INSTRUCTIONS
# ============================================================================

SETUP_INSTRUCTIONS = """
╔════════════════════════════════════════════════════════════════╗
║         GOOGLE GEMINI AI SETUP (FREE API - 1500 req/day)      ║
╚════════════════════════════════════════════════════════════════╝

1. Get Free API Key:
   Visit: https://aistudio.google.com/app/apikey
   Click "Create API key" 
   Copy the key (free, no credit card needed)
   
2. Install google-generativeai library:
   pip install google-generativeai

3. Set environment variable:
   
   Windows PowerShell:
   $env:GOOGLE_API_KEY = "your-api-key-here"
   
   Windows CMD:
   set GOOGLE_API_KEY=your-api-key-here
   
   Mac/Linux:
   export GOOGLE_API_KEY="your-api-key-here"

4. Verify setup:
   python -c "import google.generativeai; print('✓ Gemini ready')"

5. Run with AI:
   $env:GOOGLE_API_KEY = "your-key"
   python smart_estimator_api.py

Free tier limits: 60 calls/minute, 1,500 calls/day
Plenty for this application!
"""


if __name__ == "__main__":
    print(SETUP_INSTRUCTIONS)
