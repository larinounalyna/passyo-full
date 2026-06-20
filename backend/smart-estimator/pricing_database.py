"""
Pricing Database - Configurable regional pricing profiles for construction cost estimation
Provides material prices, labor rates, equipment costs, and waste factors by region
"""

from decimal import Decimal
from typing import Dict, Any, Optional
import json
import logging

logger = logging.getLogger(__name__)


# ============================================================================
# WASTE FACTORS BY MATERIAL TYPE (percentage added to quantity)
# ============================================================================

WASTE_FACTORS = {
    "concrete": Decimal("0.05"),      # 5% waste
    "steel": Decimal("0.03"),         # 3% waste
    "rebar": Decimal("0.03"),         # 3% waste
    "masonry": Decimal("0.10"),       # 10% waste
    "timber": Decimal("0.08"),        # 8% waste
    "glass": Decimal("0.05"),         # 5% waste
    "aluminum": Decimal("0.04"),      # 4% waste
    "excavation": Decimal("0.00"),    # no waste
    "general": Decimal("0.07"),       # 7% default
}


# ============================================================================
# TRANSPORT COST MODEL
# ============================================================================

TRANSPORT_RATES = {
    "base_fee_per_trip": Decimal("50"),         # Base delivery fee per trip
    "per_km_rate": Decimal("1.50"),              # Cost per km per trip
    "heavy_material_surcharge": Decimal("0.20"), # 20% surcharge for heavy materials
    # Truck capacities for calculating number of trips
    "truck_capacity_m3": Decimal("8"),           # 8 m3 per truck (concrete mixer / flatbed)
    "truck_capacity_kg": Decimal("10000"),       # 10 tonnes per truck
    "truck_capacity_m2": Decimal("50"),          # 50 m2 of sheet material per truck
    "truck_capacity_each": Decimal("20"),        # 20 units per truck
}


# ============================================================================
# EQUIPMENT CATALOG (daily rates)
# ============================================================================

EQUIPMENT_CATALOG = {
    "excavator": {
        "name": "Excavator",
        "daily_rental_rate": Decimal("500"),
        "transport_fee": Decimal("800"),
        "hourly_fuel_liters": Decimal("15"),
        "fuel_price_per_liter": Decimal("1.50"),
        "daily_maintenance": Decimal("100"),
        "operator_daily_wage": Decimal("200"),
        "daily_hours": Decimal("8"),
        "applies_to": ["IfcFooting", "IfcPile", "IfcFoundation"],
    },
    "crane": {
        "name": "Crane",
        "daily_rental_rate": Decimal("800"),
        "transport_fee": Decimal("1200"),
        "hourly_fuel_liters": Decimal("20"),
        "fuel_price_per_liter": Decimal("1.50"),
        "daily_maintenance": Decimal("150"),
        "operator_daily_wage": Decimal("250"),
        "daily_hours": Decimal("8"),
        "applies_to": ["IfcColumn", "IfcBeam", "IfcSlab", "IfcRoof"],
    },
    "concrete_pump": {
        "name": "Concrete Pump",
        "daily_rental_rate": Decimal("600"),
        "transport_fee": Decimal("500"),
        "hourly_fuel_liters": Decimal("12"),
        "fuel_price_per_liter": Decimal("1.50"),
        "daily_maintenance": Decimal("80"),
        "operator_daily_wage": Decimal("180"),
        "daily_hours": Decimal("8"),
        "applies_to": ["concrete"],
    },
    "mixer": {
        "name": "Concrete Mixer",
        "daily_rental_rate": Decimal("150"),
        "transport_fee": Decimal("300"),
        "hourly_fuel_liters": Decimal("5"),
        "fuel_price_per_liter": Decimal("1.50"),
        "daily_maintenance": Decimal("40"),
        "operator_daily_wage": Decimal("120"),
        "daily_hours": Decimal("8"),
        "applies_to": ["on_site_mixing"],
    },
}


# ============================================================================
# PRICING PROFILES BY REGION
# ============================================================================

PRICING_PROFILES = {
    "default": {
        "name": "Default (International Average)",
        "currency": "USD",
        "materials": {
            "concrete_per_m3": Decimal("150"),
            "ready_mix_transport_per_m3": Decimal("10"),
            "cement_per_bag_50kg": Decimal("8"),
            "cement_bags_per_m3": Decimal("7.2"),
            "sand_per_m3": Decimal("35"),
            "gravel_per_m3": Decimal("40"),
            "rebar_per_kg": Decimal("0.85"),
            "structural_steel_per_kg": Decimal("1.20"),
            "brick_per_unit": Decimal("0.50"),
            "block_per_unit": Decimal("1.80"),
            "timber_per_m3": Decimal("300"),
            "plywood_per_m2": Decimal("15"),
            "glass_per_m2": Decimal("45"),
            "aluminum_per_kg": Decimal("3.50"),
            "waterproofing_per_m2": Decimal("12"),
            "insulation_per_m2": Decimal("8"),
            "paint_per_m2": Decimal("4"),
            "tile_per_m2": Decimal("25"),
            "excavation_per_m3": Decimal("25"),
            "backfill_per_m3": Decimal("15"),
            "formwork_per_m2": Decimal("20"),
        },
        "labor_rates": {
            "general_laborer": Decimal("25"),
            "skilled_mason": Decimal("35"),
            "carpenter": Decimal("32"),
            "steel_worker": Decimal("38"),
            "concrete_worker": Decimal("30"),
            "excavation_operator": Decimal("40"),
            "electrician": Decimal("42"),
            "plumber": Decimal("40"),
            "painter": Decimal("28"),
            "roofer": Decimal("35"),
            "welder": Decimal("45"),
            "foreman": Decimal("50"),
        },
        "indirect_costs": {
            "project_management_daily": Decimal("300"),
            "site_security_daily": Decimal("200"),
            "water_usage_daily": Decimal("100"),
            "electricity_daily": Decimal("150"),
            "site_cleanup": Decimal("5000"),
            "worker_accommodation_daily_per_person": Decimal("30"),
        },
        "contingency_percent": Decimal("10"),
    },

    "north_africa": {
        "name": "North Africa (Morocco, Tunisia, Algeria, Egypt)",
        "currency": "USD",
        "materials": {
            "concrete_per_m3": Decimal("85"),
            "ready_mix_transport_per_m3": Decimal("8"),
            "cement_per_bag_50kg": Decimal("5"),
            "cement_bags_per_m3": Decimal("7.2"),
            "sand_per_m3": Decimal("20"),
            "gravel_per_m3": Decimal("25"),
            "rebar_per_kg": Decimal("0.70"),
            "structural_steel_per_kg": Decimal("0.95"),
            "brick_per_unit": Decimal("0.25"),
            "block_per_unit": Decimal("1.00"),
            "timber_per_m3": Decimal("250"),
            "plywood_per_m2": Decimal("10"),
            "glass_per_m2": Decimal("35"),
            "aluminum_per_kg": Decimal("3.00"),
            "waterproofing_per_m2": Decimal("8"),
            "insulation_per_m2": Decimal("6"),
            "paint_per_m2": Decimal("3"),
            "tile_per_m2": Decimal("15"),
            "excavation_per_m3": Decimal("12"),
            "backfill_per_m3": Decimal("8"),
            "formwork_per_m2": Decimal("12"),
        },
        "labor_rates": {
            "general_laborer": Decimal("12"),
            "skilled_mason": Decimal("20"),
            "carpenter": Decimal("18"),
            "steel_worker": Decimal("22"),
            "concrete_worker": Decimal("15"),
            "excavation_operator": Decimal("25"),
            "electrician": Decimal("25"),
            "plumber": Decimal("22"),
            "painter": Decimal("14"),
            "roofer": Decimal("20"),
            "welder": Decimal("28"),
            "foreman": Decimal("35"),
        },
        "indirect_costs": {
            "project_management_daily": Decimal("150"),
            "site_security_daily": Decimal("80"),
            "water_usage_daily": Decimal("50"),
            "electricity_daily": Decimal("70"),
            "site_cleanup": Decimal("2000"),
            "worker_accommodation_daily_per_person": Decimal("15"),
        },
        "contingency_percent": Decimal("10"),
    },

    "middle_east": {
        "name": "Middle East (UAE, Saudi Arabia, Qatar)",
        "currency": "USD",
        "materials": {
            "concrete_per_m3": Decimal("120"),
            "ready_mix_transport_per_m3": Decimal("12"),
            "cement_per_bag_50kg": Decimal("6"),
            "cement_bags_per_m3": Decimal("7.2"),
            "sand_per_m3": Decimal("15"),
            "gravel_per_m3": Decimal("30"),
            "rebar_per_kg": Decimal("0.75"),
            "structural_steel_per_kg": Decimal("1.10"),
            "brick_per_unit": Decimal("0.40"),
            "block_per_unit": Decimal("1.50"),
            "timber_per_m3": Decimal("350"),
            "plywood_per_m2": Decimal("18"),
            "glass_per_m2": Decimal("50"),
            "aluminum_per_kg": Decimal("4.00"),
            "waterproofing_per_m2": Decimal("15"),
            "insulation_per_m2": Decimal("10"),
            "paint_per_m2": Decimal("5"),
            "tile_per_m2": Decimal("30"),
            "excavation_per_m3": Decimal("20"),
            "backfill_per_m3": Decimal("12"),
            "formwork_per_m2": Decimal("18"),
        },
        "labor_rates": {
            "general_laborer": Decimal("15"),
            "skilled_mason": Decimal("25"),
            "carpenter": Decimal("22"),
            "steel_worker": Decimal("28"),
            "concrete_worker": Decimal("20"),
            "excavation_operator": Decimal("30"),
            "electrician": Decimal("32"),
            "plumber": Decimal("30"),
            "painter": Decimal("18"),
            "roofer": Decimal("25"),
            "welder": Decimal("35"),
            "foreman": Decimal("45"),
        },
        "indirect_costs": {
            "project_management_daily": Decimal("250"),
            "site_security_daily": Decimal("150"),
            "water_usage_daily": Decimal("120"),
            "electricity_daily": Decimal("130"),
            "site_cleanup": Decimal("4000"),
            "worker_accommodation_daily_per_person": Decimal("25"),
        },
        "contingency_percent": Decimal("10"),
    },

    "europe": {
        "name": "Europe (Western Average)",
        "currency": "USD",
        "materials": {
            "concrete_per_m3": Decimal("200"),
            "ready_mix_transport_per_m3": Decimal("15"),
            "cement_per_bag_50kg": Decimal("12"),
            "cement_bags_per_m3": Decimal("7.2"),
            "sand_per_m3": Decimal("50"),
            "gravel_per_m3": Decimal("55"),
            "rebar_per_kg": Decimal("1.10"),
            "structural_steel_per_kg": Decimal("1.60"),
            "brick_per_unit": Decimal("0.80"),
            "block_per_unit": Decimal("2.50"),
            "timber_per_m3": Decimal("400"),
            "plywood_per_m2": Decimal("22"),
            "glass_per_m2": Decimal("60"),
            "aluminum_per_kg": Decimal("4.50"),
            "waterproofing_per_m2": Decimal("18"),
            "insulation_per_m2": Decimal("12"),
            "paint_per_m2": Decimal("6"),
            "tile_per_m2": Decimal("35"),
            "excavation_per_m3": Decimal("40"),
            "backfill_per_m3": Decimal("22"),
            "formwork_per_m2": Decimal("30"),
        },
        "labor_rates": {
            "general_laborer": Decimal("35"),
            "skilled_mason": Decimal("50"),
            "carpenter": Decimal("48"),
            "steel_worker": Decimal("55"),
            "concrete_worker": Decimal("45"),
            "excavation_operator": Decimal("55"),
            "electrician": Decimal("60"),
            "plumber": Decimal("58"),
            "painter": Decimal("40"),
            "roofer": Decimal("50"),
            "welder": Decimal("62"),
            "foreman": Decimal("70"),
        },
        "indirect_costs": {
            "project_management_daily": Decimal("500"),
            "site_security_daily": Decimal("350"),
            "water_usage_daily": Decimal("150"),
            "electricity_daily": Decimal("200"),
            "site_cleanup": Decimal("8000"),
            "worker_accommodation_daily_per_person": Decimal("50"),
        },
        "contingency_percent": Decimal("10"),
    },
}


# ============================================================================
# IFC TYPE TO TRADE / MATERIAL MAPPING
# ============================================================================

IFC_TYPE_MAPPING = {
    # Earthwork / Foundation
    "IfcFooting": {"trade": "concrete_worker", "material_key": "concrete_per_m3", "category": "foundation", "needs_excavation": True},
    "IfcPile": {"trade": "concrete_worker", "material_key": "concrete_per_m3", "category": "foundation", "needs_excavation": True},
    "IfcFoundation": {"trade": "concrete_worker", "material_key": "concrete_per_m3", "category": "foundation", "needs_excavation": True},

    # Structural concrete
    "IfcColumn": {"trade": "concrete_worker", "material_key": "concrete_per_m3", "category": "structural"},
    "IfcBeam": {"trade": "concrete_worker", "material_key": "concrete_per_m3", "category": "structural"},
    "IfcSlab": {"trade": "concrete_worker", "material_key": "concrete_per_m3", "category": "structural"},
    "IfcSlabStandardCase": {"trade": "concrete_worker", "material_key": "concrete_per_m3", "category": "structural"},

    # Walls
    "IfcWall": {"trade": "skilled_mason", "material_key": "block_per_unit", "category": "masonry"},
    "IfcWallStandardCase": {"trade": "skilled_mason", "material_key": "block_per_unit", "category": "masonry"},
    "IfcCurtainWall": {"trade": "steel_worker", "material_key": "glass_per_m2", "category": "facade"},

    # Roof
    "IfcRoof": {"trade": "roofer", "material_key": "timber_per_m3", "category": "roofing"},

    # Openings
    "IfcDoor": {"trade": "carpenter", "material_key": "timber_per_m3", "category": "openings"},
    "IfcWindow": {"trade": "carpenter", "material_key": "glass_per_m2", "category": "openings"},

    # Steel
    "IfcMember": {"trade": "steel_worker", "material_key": "structural_steel_per_kg", "category": "steel"},
    "IfcPlate": {"trade": "steel_worker", "material_key": "structural_steel_per_kg", "category": "steel"},

    # Stairs / Ramps
    "IfcStair": {"trade": "concrete_worker", "material_key": "concrete_per_m3", "category": "structural"},
    "IfcStaircase": {"trade": "concrete_worker", "material_key": "concrete_per_m3", "category": "structural"},
    "IfcRamp": {"trade": "concrete_worker", "material_key": "concrete_per_m3", "category": "structural"},

    # Coverings
    "IfcCovering": {"trade": "painter", "material_key": "paint_per_m2", "category": "finishing"},
    "IfcRailing": {"trade": "steel_worker", "material_key": "structural_steel_per_kg", "category": "steel"},

    # Stairs (flights)
    "IfcStairFlight": {"trade": "concrete_worker", "material_key": "concrete_per_m3", "category": "structural"},

    # Furnishings
    "IfcFurnishingElement": {"trade": "carpenter", "material_key": "timber_per_m3", "category": "finishing"},
    "IfcFurniture": {"trade": "carpenter", "material_key": "timber_per_m3", "category": "finishing"},
}


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_profile(profile_name: str = "default") -> Dict[str, Any]:
    """Get a pricing profile by name"""
    return PRICING_PROFILES.get(profile_name, PRICING_PROFILES["default"])


def get_material_price(profile_name: str, material_key: str) -> Decimal:
    """Get material price from a profile"""
    profile = get_profile(profile_name)
    return profile["materials"].get(material_key, Decimal("0"))


def get_labor_rate(profile_name: str, trade: str) -> Decimal:
    """Get labor rate for a trade from a profile"""
    profile = get_profile(profile_name)
    return profile["labor_rates"].get(trade, profile["labor_rates"]["general_laborer"])


def get_waste_factor(material_category: str) -> Decimal:
    """Get waste factor for a material category"""
    return WASTE_FACTORS.get(material_category, WASTE_FACTORS["general"])


def get_ifc_mapping(ifc_type: str) -> Dict[str, Any]:
    """Get trade/material mapping for an IFC type"""
    return IFC_TYPE_MAPPING.get(ifc_type, {
        "trade": "general_laborer",
        "material_key": "concrete_per_m3",
        "category": "general",
        "needs_excavation": False,
    })


def get_transport_cost(distance_km: Decimal, quantity: Decimal, unit: str = "m3", is_heavy: bool = False) -> Decimal:
    """Calculate transport cost based on distance and number of truck trips needed"""
    # Determine truck capacity based on unit
    unit_lower = unit.lower().replace("³", "3").replace("²", "2")
    if unit_lower in ("kg", "t", "ton"):
        capacity = TRANSPORT_RATES["truck_capacity_kg"]
    elif unit_lower in ("m2", "sqm"):
        capacity = TRANSPORT_RATES["truck_capacity_m2"]
    elif unit_lower in ("each", "unit", "pcs"):
        capacity = TRANSPORT_RATES["truck_capacity_each"]
    else:  # m3 and default
        capacity = TRANSPORT_RATES["truck_capacity_m3"]

    # Number of trips (round up)
    num_trips = max(Decimal("1"), (quantity / capacity).to_integral_value(rounding="ROUND_CEILING"))

    # Cost per trip
    trip_cost = TRANSPORT_RATES["base_fee_per_trip"] + (distance_km * TRANSPORT_RATES["per_km_rate"])
    total = trip_cost * num_trips

    if is_heavy:
        total *= (1 + TRANSPORT_RATES["heavy_material_surcharge"])
    return total


def list_profiles() -> list:
    """List available pricing profiles"""
    return [
        {"id": key, "name": profile["name"], "currency": profile["currency"]}
        for key, profile in PRICING_PROFILES.items()
    ]


def auto_price_components(components: list, profile_name: str = "default") -> list:
    """
    Auto-fill prices for components that have base_material_price == 0.
    Uses IFC_TYPE_MAPPING to determine the right material price and labor trade,
    then looks up prices from the selected pricing profile.
    Components that already have a price > 0 are left unchanged.
    """
    profile = get_profile(profile_name)
    materials = profile["materials"]
    labor_rates = profile["labor_rates"]

    # Keyword-based fallback mapping for material_code strings
    material_code_to_key = {
        "concrete": "concrete_per_m3",
        "cement": "concrete_per_m3",
        "rebar": "rebar_per_kg",
        "steel": "structural_steel_per_kg",
        "masonry": "block_per_unit",
        "brick": "brick_per_unit",
        "block": "block_per_unit",
        "timber": "timber_per_m3",
        "wood": "timber_per_m3",
        "glass": "glass_per_m2",
        "aluminum": "aluminum_per_kg",
        "aluminium": "aluminum_per_kg",
        "excavation": "excavation_per_m3",
        "soil": "excavation_per_m3",
        "foundation": "concrete_per_m3",
        "waterproof": "waterproofing_per_m2",
        "insulation": "insulation_per_m2",
        "paint": "paint_per_m2",
        "tile": "tile_per_m2",
        "plywood": "plywood_per_m2",
        "formwork": "formwork_per_m2",
    }

    for comp in components:
        price = comp.get("base_material_price", 0)
        if isinstance(price, str):
            try:
                price = float(price)
            except (ValueError, TypeError):
                price = 0
        if price > 0:
            continue

        ifc_type = comp.get("ifc_type", "Unknown")
        mapping = IFC_TYPE_MAPPING.get(ifc_type)

        if mapping:
            # Use IFC type mapping
            mat_key = mapping.get("material_key", "concrete_per_m3")
            trade = mapping.get("trade", "general_laborer")
            comp["base_material_price"] = float(materials.get(mat_key, Decimal("0")))
            comp["labor_rate_per_hour"] = float(labor_rates.get(trade, labor_rates["general_laborer"]))
        else:
            # Fallback: check material_code and description for keywords
            search_text = (
                str(comp.get("material_code", "")) + " " +
                str(comp.get("description", ""))
            ).lower()

            matched_key = None
            matched_trade = "general_laborer"
            for keyword, mat_key in material_code_to_key.items():
                if keyword in search_text:
                    matched_key = mat_key
                    # Guess trade from material
                    if "concrete" in keyword or "cement" in keyword or "foundation" in keyword:
                        matched_trade = "concrete_worker"
                    elif "steel" in keyword or "rebar" in keyword:
                        matched_trade = "steel_worker"
                    elif "masonry" in keyword or "brick" in keyword or "block" in keyword:
                        matched_trade = "skilled_mason"
                    elif "timber" in keyword or "wood" in keyword:
                        matched_trade = "carpenter"
                    elif "glass" in keyword:
                        matched_trade = "carpenter"
                    elif "excavation" in keyword or "soil" in keyword:
                        matched_trade = "excavation_operator"
                    break

            if matched_key:
                comp["base_material_price"] = float(materials.get(matched_key, Decimal("0")))
                comp["labor_rate_per_hour"] = float(labor_rates.get(matched_trade, labor_rates["general_laborer"]))

    logger.info(f"Auto-priced {len(components)} components using profile '{profile_name}'")
    return components


def create_custom_profile(base_profile: str, overrides: Dict[str, Any]) -> Dict[str, Any]:
    """Create a custom profile by overriding values from a base profile"""
    import copy
    profile = copy.deepcopy(get_profile(base_profile))
    profile["name"] = overrides.get("name", "Custom Profile")

    for section in ["materials", "labor_rates", "indirect_costs"]:
        if section in overrides:
            for key, value in overrides[section].items():
                if key in profile[section]:
                    profile[section][key] = Decimal(str(value))

    if "contingency_percent" in overrides:
        profile["contingency_percent"] = Decimal(str(overrides["contingency_percent"]))

    return profile
