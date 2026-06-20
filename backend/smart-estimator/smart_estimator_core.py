"""
Smart Estimator - Intelligent 5D Cost Estimation Engine
Implements contextual decision trees and dynamic pricing based on project conditions
"""

from enum import Enum
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any
from decimal import Decimal
from datetime import datetime
import logging

from pricing_database import (
    get_profile,
    get_material_price,
    get_labor_rate,
    get_waste_factor,
    get_ifc_mapping,
    get_transport_cost,
    EQUIPMENT_CATALOG,
    TRANSPORT_RATES,
)

logger = logging.getLogger(__name__)

# ============================================================================
# ENUMS FOR CONTEXTUAL DECISIONS
# ============================================================================

class EquipmentOwnership(Enum):
    OWNED = "owned"
    RENTED = "rented"
    HYBRID = "hybrid"


class ConcreteMethod(Enum):
    READY_MIX = "ready_mix"
    ON_SITE_MIXING = "on_site_mixing"


class SiteAccess(Enum):
    URBAN = "urban"
    REMOTE = "remote"
    EXTREMELY_REMOTE = "extremely_remote"


class SoilType(Enum):
    SANDY = "sandy"
    CLAY = "clay"
    ROCKY = "rocky"
    MIXED = "mixed"


class UtilityAccess(Enum):
    FULL = "full"
    PARTIAL = "partial"
    NONE = "none"


# ============================================================================
# CONTEXTUAL SITE SURVEY - THE "SMART WIZARD"
# ============================================================================

@dataclass
class SiteSurveyContext:
    """User answers to the contextual wizard questions"""

    equipment_ownership: EquipmentOwnership = EquipmentOwnership.RENTED
    concrete_method: ConcreteMethod = ConcreteMethod.READY_MIX
    site_access: SiteAccess = SiteAccess.URBAN
    soil_type: SoilType = SoilType.MIXED
    utility_access: UtilityAccess = UtilityAccess.FULL

    site_distance_km: Decimal = Decimal('10')
    site_narrowness: float = 0.5
    worker_accommodation_available: bool = False

    total_project_days: Decimal = Decimal('120')
    daily_worker_count: Decimal = Decimal('20')

    # Pricing profile
    pricing_profile: str = "default"

    # Calculated adjustments
    context_adjustments: Dict[str, Decimal] = field(default_factory=dict)

    def __post_init__(self):
        self.calculate_adjustments()

    def calculate_adjustments(self):
        profile = get_profile(self.pricing_profile)

        # Site Access Multipliers
        access_multiplier = {
            SiteAccess.URBAN: Decimal('1.0'),
            SiteAccess.REMOTE: Decimal('1.35'),
            SiteAccess.EXTREMELY_REMOTE: Decimal('1.75'),
        }
        self.context_adjustments['site_access'] = access_multiplier[self.site_access]

        # Utility Access
        utility_costs = {
            UtilityAccess.FULL: Decimal('0'),
            UtilityAccess.PARTIAL: Decimal('5000'),
            UtilityAccess.NONE: Decimal('12000'),
        }
        self.context_adjustments['utility_cost'] = utility_costs[self.utility_access]

        # Soil Type
        soil_factor = {
            SoilType.SANDY: Decimal('1.0'),
            SoilType.CLAY: Decimal('1.2'),
            SoilType.ROCKY: Decimal('1.5'),
            SoilType.MIXED: Decimal('1.3'),
        }
        self.context_adjustments['soil_factor'] = soil_factor[self.soil_type]

        # Worker Accommodation
        accommodation_cost = Decimal('0')
        if not self.worker_accommodation_available:
            daily_rate = profile["indirect_costs"]["worker_accommodation_daily_per_person"]
            daily_housing = daily_rate * self.daily_worker_count
            accommodation_cost = daily_housing * self.total_project_days
        self.context_adjustments['accommodation_cost'] = accommodation_cost

        # Site Narrowness: 0.0 (spacious, 1.0x) to 1.0 (very narrow, 1.35x)
        narrowness_factor = Decimal('1.0') + (Decimal('0.35') * Decimal(str(self.site_narrowness)))
        self.context_adjustments['narrowness_factor'] = narrowness_factor

        # Transport distance factor
        self.context_adjustments['distance_km'] = self.site_distance_km

        # Contingency
        self.context_adjustments['contingency_percent'] = profile["contingency_percent"]


# ============================================================================
# EQUIPMENT COST MODEL
# ============================================================================

@dataclass
class EquipmentCostModel:
    """Dynamic equipment cost calculation based on ownership"""

    equipment_code: str
    name: str
    quantity: Decimal

    daily_rental_rate: Decimal
    transport_fee: Decimal = Decimal('500')

    hourly_fuel_consumption_liters: Decimal = Decimal('10')
    fuel_price_per_liter: Decimal = Decimal('1.50')
    daily_maintenance_cost: Decimal = Decimal('150')
    operator_daily_wage: Decimal = Decimal('200')

    estimated_days: Decimal = Decimal('30')
    daily_hours: Decimal = Decimal('8')

    def calculate_owned_cost(self) -> Decimal:
        hourly_fuel_cost = self.hourly_fuel_consumption_liters * self.fuel_price_per_liter
        daily_fuel_cost = hourly_fuel_cost * self.daily_hours
        daily_equipment_cost = daily_fuel_cost + self.daily_maintenance_cost + self.operator_daily_wage
        return daily_equipment_cost * self.estimated_days * self.quantity

    def calculate_rented_cost(self) -> Decimal:
        daily_cost = self.daily_rental_rate * self.quantity
        total_daily = daily_cost * self.estimated_days
        transport_total = self.transport_fee * self.quantity
        return total_daily + transport_total

    def calculate_cost(self, ownership: EquipmentOwnership) -> Decimal:
        if ownership == EquipmentOwnership.OWNED:
            return self.calculate_owned_cost()
        elif ownership == EquipmentOwnership.RENTED:
            return self.calculate_rented_cost()
        else:  # HYBRID
            return (self.calculate_owned_cost() + self.calculate_rented_cost()) / 2


# ============================================================================
# CONCRETE COST MODEL
# ============================================================================

@dataclass
class ConcreteCostModel:
    """Dynamic concrete cost calculation based on procurement method"""

    volume_m3: Decimal
    pricing_profile: str = "default"

    def _get_prices(self):
        profile = get_profile(self.pricing_profile)
        return profile["materials"]

    def calculate_ready_mix_cost(self) -> Tuple[Decimal, Dict[str, Any]]:
        prices = self._get_prices()
        material_cost = prices["concrete_per_m3"] * self.volume_m3
        transport_cost = prices["ready_mix_transport_per_m3"] * self.volume_m3
        total = material_cost + transport_cost

        breakdown = {
            'material': str(material_cost),
            'transport': str(transport_cost),
            'total': str(total)
        }
        return total, breakdown

    def calculate_on_site_mixing_cost(self, labor_rate: Decimal = Decimal('25')) -> Tuple[Decimal, Dict[str, Any]]:
        prices = self._get_prices()

        cement_cost = self.volume_m3 * prices["cement_bags_per_m3"] * prices["cement_per_bag_50kg"]
        sand_cost = prices["sand_per_m3"] * self.volume_m3
        gravel_cost = prices["gravel_per_m3"] * self.volume_m3
        material_total = cement_cost + sand_cost + gravel_cost

        # Mixer rental from equipment catalog
        mixer = EQUIPMENT_CATALOG["mixer"]
        mixer_days = max(Decimal('1'), self.volume_m3 / Decimal('5'))  # ~5m3 per day
        equipment_cost = mixer["daily_rental_rate"] * mixer_days

        # Mixing labor: ~1.5 hours per m3
        labor_hours = self.volume_m3 * Decimal('1.5')
        labor_cost = labor_hours * labor_rate

        total = material_total + equipment_cost + labor_cost

        breakdown = {
            'cement': str(cement_cost),
            'sand': str(sand_cost),
            'gravel': str(gravel_cost),
            'equipment': str(equipment_cost),
            'labor': str(labor_cost),
            'total': str(total)
        }
        return total, breakdown

    def calculate_cost(self, method: ConcreteMethod, labor_rate: Decimal = Decimal('25')) -> Tuple[Decimal, Dict[str, Any]]:
        if method == ConcreteMethod.READY_MIX:
            return self.calculate_ready_mix_cost()
        else:
            return self.calculate_on_site_mixing_cost(labor_rate)


# ============================================================================
# BIM COMPONENT WITH DYNAMIC COST CALCULATION
# ============================================================================

# IFC types that need excavation (soil factor applies)
FOUNDATION_IFC_TYPES = {
    'IfcFooting', 'IfcPile', 'IfcFoundation',
}

# IFC types that typically need heavy equipment
HEAVY_EQUIPMENT_IFC_TYPES = {
    'IfcFooting', 'IfcPile', 'IfcFoundation',
    'IfcColumn', 'IfcBeam', 'IfcSlab', 'IfcSlabStandardCase',
    'IfcRoof',
}

# Heavy materials for transport surcharge
HEAVY_MATERIAL_CATEGORIES = {'concrete', 'steel', 'structural', 'foundation'}


@dataclass
class DynamicBIMComponent:
    """BIM Component with context-aware cost calculation"""

    id: str
    ifc_type: str
    description: str
    quantity: Decimal
    unit: str

    material_code: str
    base_material_price: Decimal

    labor_hours_base: Decimal
    labor_rate_per_hour: Decimal

    site_context: SiteSurveyContext = None
    concrete_volume_m3: Optional[Decimal] = None

    def _get_ifc_mapping(self) -> Dict[str, Any]:
        return get_ifc_mapping(self.ifc_type)

    def _get_waste_factor(self) -> Decimal:
        mapping = self._get_ifc_mapping()
        category = mapping.get("category", "general")
        return get_waste_factor(category)

    def calculate_material_cost(self) -> Decimal:
        base_cost = self.base_material_price * self.quantity

        # Apply waste factor
        waste = self._get_waste_factor()
        base_cost = base_cost * (1 + waste)

        if self.site_context:
            # Apply site access multiplier to materials
            site_multiplier = self.site_context.context_adjustments.get('site_access', Decimal('1'))
            base_cost = base_cost * site_multiplier

        return base_cost

    def calculate_labor_cost(self) -> Decimal:
        total_hours = self.labor_hours_base * self.quantity
        base_cost = total_hours * self.labor_rate_per_hour

        if self.site_context:
            # Narrowness factor affects all labor
            narrowness_factor = self.site_context.context_adjustments.get('narrowness_factor', Decimal('1'))
            base_cost = base_cost * narrowness_factor

            # Soil difficulty factor for foundation/excavation types
            if self.ifc_type in FOUNDATION_IFC_TYPES:
                soil_factor = self.site_context.context_adjustments.get('soil_factor', Decimal('1'))
                base_cost = base_cost * soil_factor

        return base_cost

    def calculate_equipment_cost(self) -> Decimal:
        """Calculate equipment cost based on component type and ownership strategy"""
        if not self.site_context:
            return Decimal('0')

        if self.ifc_type not in HEAVY_EQUIPMENT_IFC_TYPES:
            return Decimal('0')

        ownership = self.site_context.equipment_ownership

        # Find matching equipment from catalog
        for eq_code, eq_data in EQUIPMENT_CATALOG.items():
            applies_to = eq_data.get("applies_to", [])
            if self.ifc_type in applies_to:
                # Estimate equipment days based on labor hours
                total_labor_hours = self.labor_hours_base * self.quantity
                estimated_days = max(Decimal('1'), total_labor_hours / eq_data["daily_hours"])

                model = EquipmentCostModel(
                    equipment_code=eq_code,
                    name=eq_data["name"],
                    quantity=Decimal('1'),
                    daily_rental_rate=eq_data["daily_rental_rate"],
                    transport_fee=eq_data["transport_fee"],
                    hourly_fuel_consumption_liters=eq_data["hourly_fuel_liters"],
                    fuel_price_per_liter=eq_data["fuel_price_per_liter"],
                    daily_maintenance_cost=eq_data["daily_maintenance"],
                    operator_daily_wage=eq_data["operator_daily_wage"],
                    estimated_days=estimated_days,
                    daily_hours=eq_data["daily_hours"],
                )
                return model.calculate_cost(ownership)

        return Decimal('0')

    def calculate_concrete_cost(self) -> Decimal:
        """Calculate concrete cost if this component uses concrete"""
        if not self.concrete_volume_m3 or not self.site_context:
            return Decimal('0')

        profile_name = self.site_context.pricing_profile if self.site_context else "default"
        concrete_model = ConcreteCostModel(
            volume_m3=self.concrete_volume_m3,
            pricing_profile=profile_name,
        )
        cost, _ = concrete_model.calculate_cost(
            self.site_context.concrete_method,
            self.labor_rate_per_hour,
        )
        return cost

    def calculate_transport_cost(self) -> Decimal:
        """Calculate transport cost based on distance"""
        if not self.site_context:
            return Decimal('0')

        distance = self.site_context.context_adjustments.get('distance_km', Decimal('10'))
        mapping = self._get_ifc_mapping()
        is_heavy = mapping.get("category", "") in HEAVY_MATERIAL_CATEGORIES

        return get_transport_cost(distance, self.quantity, self.unit, is_heavy)

    def calculate_total_direct_cost(self) -> Decimal:
        material = self.calculate_material_cost()
        labor = self.calculate_labor_cost()
        equipment = self.calculate_equipment_cost()
        concrete = self.calculate_concrete_cost()
        transport = self.calculate_transport_cost()
        return material + labor + equipment + concrete + transport

    def get_cost_breakdown(self) -> Dict[str, Decimal]:
        return {
            'material': self.calculate_material_cost(),
            'labor': self.calculate_labor_cost(),
            'equipment': self.calculate_equipment_cost(),
            'concrete': self.calculate_concrete_cost(),
            'transport': self.calculate_transport_cost(),
            'total': self.calculate_total_direct_cost(),
        }


# ============================================================================
# STAGE 4: AGGREGATION ENGINE WITH INDIRECT COSTS
# ============================================================================

@dataclass
class ProjectAggregation:
    """Aggregates all direct and indirect costs"""

    components: List[DynamicBIMComponent]
    site_context: SiteSurveyContext

    profit_margin_percent: Decimal = Decimal('15')
    contingency_percent: Decimal = Decimal('10')

    # Calculated aggregates
    total_material_cost: Decimal = Decimal('0')
    total_labor_cost: Decimal = Decimal('0')
    total_equipment_cost: Decimal = Decimal('0')
    total_concrete_cost: Decimal = Decimal('0')
    total_transport_cost: Decimal = Decimal('0')
    direct_costs: Decimal = Decimal('0')
    indirect_costs: Decimal = Decimal('0')
    contingency_amount: Decimal = Decimal('0')
    base_cost: Decimal = Decimal('0')
    profit_amount: Decimal = Decimal('0')
    final_bid_price: Decimal = Decimal('0')

    def calculate_direct_costs(self) -> Decimal:
        self.total_material_cost = sum(c.calculate_material_cost() for c in self.components)
        self.total_labor_cost = sum(c.calculate_labor_cost() for c in self.components)
        self.total_equipment_cost = sum(c.calculate_equipment_cost() for c in self.components)
        self.total_concrete_cost = sum(c.calculate_concrete_cost() for c in self.components)
        self.total_transport_cost = sum(c.calculate_transport_cost() for c in self.components)

        self.direct_costs = (
            self.total_material_cost +
            self.total_labor_cost +
            self.total_equipment_cost +
            self.total_concrete_cost +
            self.total_transport_cost
        )
        return self.direct_costs

    def calculate_indirect_costs(self) -> Decimal:
        profile = get_profile(self.site_context.pricing_profile)
        indirect = profile["indirect_costs"]

        daily_overhead = (
            indirect["project_management_daily"] +
            indirect["site_security_daily"] +
            indirect["water_usage_daily"] +
            indirect["electricity_daily"]
        )

        daily_overhead_total = daily_overhead * self.site_context.total_project_days
        accommodation = self.site_context.context_adjustments.get('accommodation_cost', Decimal('0'))
        utility_setup = self.site_context.context_adjustments.get('utility_cost', Decimal('0'))
        cleanup = indirect["site_cleanup"]

        self.indirect_costs = daily_overhead_total + accommodation + utility_setup + cleanup
        return self.indirect_costs

    def calculate_totals(self):
        self.calculate_direct_costs()
        self.calculate_indirect_costs()

        subtotal = self.direct_costs + self.indirect_costs

        # Contingency
        self.contingency_percent = self.site_context.context_adjustments.get(
            'contingency_percent', Decimal('10')
        )
        self.contingency_amount = subtotal * (self.contingency_percent / Decimal('100'))

        self.base_cost = subtotal + self.contingency_amount
        self.profit_amount = self.base_cost * (self.profit_margin_percent / Decimal('100'))
        self.final_bid_price = self.base_cost + self.profit_amount


# ============================================================================
# STAGE 5: REPORTING - THREE DISTINCT VIEWS
# ============================================================================

@dataclass
class BidReport:
    """Final report with three distinct views for different stakeholders"""

    bid_id: str
    aggregation: ProjectAggregation
    site_context: SiteSurveyContext
    created_at: datetime = field(default_factory=datetime.now)

    def generate_buyers_list(self) -> Dict[str, Any]:
        """Materials to order from suppliers"""
        materials_by_supplier: Dict[str, List[Dict]] = {}

        for component in self.aggregation.components:
            supplier_code = component.material_code.split('_')[0] if '_' in component.material_code else 'GENERAL'

            if supplier_code not in materials_by_supplier:
                materials_by_supplier[supplier_code] = []

            material_cost = component.calculate_material_cost()

            materials_by_supplier[supplier_code].append({
                'component': component.description,
                'ifc_type': component.ifc_type,
                'quantity': str(component.quantity),
                'unit': component.unit,
                'unit_price': str(component.base_material_price),
                'waste_factor': str(component._get_waste_factor()),
                'total_cost': str(material_cost),
            })

        return {
            'view_type': 'BUYERS_LIST',
            'description': 'Materials to order from suppliers',
            'total_material_cost': str(self.aggregation.total_material_cost),
            'suppliers': materials_by_supplier,
        }

    def generate_payroll_list(self) -> Dict[str, Any]:
        """Budget for workers and laborers"""
        total_labor_hours = Decimal('0')
        total_labor_cost = Decimal('0')

        labor_by_trade: Dict[str, Dict[str, Decimal]] = {}

        for component in self.aggregation.components:
            hours = component.labor_hours_base * component.quantity
            cost = component.calculate_labor_cost()

            total_labor_hours += hours
            total_labor_cost += cost

            trade = self._get_trade_from_component(component)
            if trade not in labor_by_trade:
                labor_by_trade[trade] = {'hours': Decimal('0'), 'cost': Decimal('0')}
            labor_by_trade[trade]['hours'] += hours
            labor_by_trade[trade]['cost'] += cost

        return {
            'view_type': 'PAYROLL_LIST',
            'description': 'Budget for wages and labor',
            'total_hours': str(total_labor_hours),
            'average_hourly_rate': str(total_labor_cost / total_labor_hours if total_labor_hours > 0 else 0),
            'total_labor_cost': str(total_labor_cost),
            'by_trade': {
                trade: {'hours': str(data['hours']), 'cost': str(data['cost'])}
                for trade, data in labor_by_trade.items()
            },
        }

    def generate_logistics_list(self) -> Dict[str, Any]:
        """Equipment rental and logistics requirements"""
        return {
            'view_type': 'LOGISTICS_LIST',
            'description': 'Equipment rental and logistics requirements',
            'site_conditions': {
                'access': self.site_context.site_access.value,
                'distance_km': str(self.site_context.site_distance_km),
                'soil_type': self.site_context.soil_type.value,
                'project_duration_days': str(self.site_context.total_project_days),
            },
            'daily_worker_count': str(self.site_context.daily_worker_count),
            'accommodation_required': not self.site_context.worker_accommodation_available,
            'accommodation_cost': str(
                self.site_context.context_adjustments.get('accommodation_cost', Decimal('0'))
            ),
            'utility_setup_cost': str(
                self.site_context.context_adjustments.get('utility_cost', Decimal('0'))
            ),
            'equipment_cost': str(self.aggregation.total_equipment_cost),
            'transport_cost': str(self.aggregation.total_transport_cost),
            'total_indirect_costs': str(self.aggregation.indirect_costs),
        }

    def _get_trade_from_component(self, component: DynamicBIMComponent) -> str:
        mapping = get_ifc_mapping(component.ifc_type)
        trade = mapping.get("trade", "general_laborer")
        # Make human-readable
        return trade.replace('_', ' ').title()

    def generate_full_report(self) -> Dict[str, Any]:
        self.aggregation.calculate_totals()

        return {
            'bid_id': self.bid_id,
            'created_at': self.created_at.isoformat(),
            'summary': {
                'total_material_cost': str(self.aggregation.total_material_cost),
                'total_labor_cost': str(self.aggregation.total_labor_cost),
                'total_equipment_cost': str(self.aggregation.total_equipment_cost),
                'total_concrete_cost': str(self.aggregation.total_concrete_cost),
                'total_transport_cost': str(self.aggregation.total_transport_cost),
                'direct_costs': str(self.aggregation.direct_costs),
                'indirect_costs': str(self.aggregation.indirect_costs),
                'contingency_percent': str(self.aggregation.contingency_percent),
                'contingency_amount': str(self.aggregation.contingency_amount),
                'base_cost': str(self.aggregation.base_cost),
                'profit_margin': f"{self.aggregation.profit_margin_percent}%",
                'profit_amount': str(self.aggregation.profit_amount),
                'final_bid_price': str(self.aggregation.final_bid_price),
            },
            'buyers_list': self.generate_buyers_list(),
            'payroll_list': self.generate_payroll_list(),
            'logistics_list': self.generate_logistics_list(),
        }


# ============================================================================
# ORCHESTRATOR - MAIN ESTIMATOR SERVICE
# ============================================================================

class SmartEstimatorService:
    """Main orchestrator for the 5-stage calculation pipeline"""

    def __init__(self):
        self.components: List[DynamicBIMComponent] = []
        self.site_context: Optional[SiteSurveyContext] = None

    def add_component(self, component: DynamicBIMComponent):
        self.components.append(component)

    def set_site_context(self, context: SiteSurveyContext):
        self.site_context = context
        for component in self.components:
            component.site_context = context

    def generate_estimate(self, profit_margin: Decimal = Decimal('15')) -> BidReport:
        if not self.site_context:
            raise ValueError("Site context must be set before generating estimate")
        if not self.components:
            raise ValueError("At least one component must be added")

        aggregation = ProjectAggregation(
            components=self.components,
            site_context=self.site_context,
            profit_margin_percent=profit_margin,
        )

        bid_id = f"BID_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        report = BidReport(
            bid_id=bid_id,
            aggregation=aggregation,
            site_context=self.site_context,
        )

        return report


if __name__ == "__main__":
    logger.info("Smart Estimator initialized")
