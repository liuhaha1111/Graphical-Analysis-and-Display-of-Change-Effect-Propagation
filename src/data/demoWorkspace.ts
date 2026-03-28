import {
  ProductComponent,
  ProductParameter,
  ParameterLink,
  SupplyPartner,
  SupplyRoute,
  WorkspaceModel,
} from '../domain/workspace';

const buildComponents = (): ProductComponent[] => [
  {
    id: 'comp_laptop',
    name: 'Apex Ultrabook',
    parentId: null,
    category: 'system',
    stage: 'baseline',
    description: 'Thin-and-light platform tuned for creative AI workloads.',
    tags: ['laptop', 'ultrabook', 'connected'],
  },
  {
    id: 'comp_chassis',
    name: 'Chassis & Cooling',
    parentId: 'comp_laptop',
    category: 'assembly',
    stage: 'baseline',
    description: 'Aluminum unibody with vapor chamber heat management.',
  },
  {
    id: 'comp_motherboard',
    name: 'Mainboard Assembly',
    parentId: 'comp_laptop',
    category: 'assembly',
    stage: 'baseline',
    tags: ['pcb', 'backplane'],
  },
  {
    id: 'comp_cpu',
    name: 'CPU Module',
    parentId: 'comp_motherboard',
    category: 'component',
    stage: 'baseline',
    description: '8-core silicon tuned for 45W sustained boost.',
  },
  {
    id: 'comp_gpu',
    name: 'Discrete GPU',
    parentId: 'comp_motherboard',
    category: 'component',
    stage: 'prototype',
    description: 'External graphics die for burst performance.',
  },
  {
    id: 'comp_memory',
    name: 'Memory Module',
    parentId: 'comp_motherboard',
    category: 'module',
    stage: 'baseline',
    description: 'LPDDR5 with bonded cooling spreader.',
  },
  {
    id: 'comp_storage',
    name: 'Storage SSD',
    parentId: 'comp_motherboard',
    category: 'module',
    stage: 'baseline',
  },
  {
    id: 'comp_display',
    name: 'Display Module',
    parentId: 'comp_laptop',
    category: 'module',
    stage: 'baseline',
  },
  {
    id: 'comp_battery',
    name: 'Battery Pack',
    parentId: 'comp_laptop',
    category: 'module',
    stage: 'baseline',
    description: 'Dual-cell 62Wh pack tuned for fast charging.',
  },
];

const buildParameters = (): ProductParameter[] => [
  {
    id: 'param_cpu_frequency',
    componentId: 'comp_cpu',
    name: 'CPU Frequency',
    unit: 'GHz',
    baselineValue: 3.2,
    minValue: 2.4,
    maxValue: 4.5,
    changeable: true,
    notes: 'Raise frequency for higher throughput at the cost of heat.',
  },
  {
    id: 'param_cpu_power',
    componentId: 'comp_cpu',
    name: 'CPU Power Limit',
    unit: 'W',
    baselineValue: 45,
    minValue: 25,
    maxValue: 65,
    changeable: true,
  },
  {
    id: 'param_memory_capacity',
    componentId: 'comp_memory',
    name: 'Memory Capacity',
    unit: 'GB',
    baselineValue: 16,
    minValue: 8,
    maxValue: 64,
    changeable: true,
  },
  {
    id: 'param_storage_type',
    componentId: 'comp_storage',
    name: 'Storage Type',
    unit: 'Gen',
    baselineValue: 4,
    changeable: false,
    notes: 'PCIe Gen4 NVMe module.',
  },
  {
    id: 'param_display_brightness',
    componentId: 'comp_display',
    name: 'Brightness',
    unit: 'nits',
    baselineValue: 450,
    minValue: 300,
    maxValue: 600,
    changeable: true,
    notes: 'Higher brightness increases power draw.',
  },
  {
    id: 'param_battery_capacity',
    componentId: 'comp_battery',
    name: 'Battery Capacity',
    unit: 'Wh',
    baselineValue: 62,
    minValue: 55,
    maxValue: 70,
    changeable: true,
    notes: 'Constrained by chassis volume.',
  },
  {
    id: 'param_chassis_weight',
    componentId: 'comp_chassis',
    name: 'Chassis Weight',
    unit: 'g',
    baselineValue: 1200,
    changeable: false,
  },
];

const buildParameterLinks = (): ParameterLink[] => [
  {
    id: 'link_cpu_freq_battery',
    sourceComponentId: 'comp_cpu',
    sourceParameterId: 'param_cpu_frequency',
    targetComponentId: 'comp_battery',
    targetParameterId: 'param_battery_capacity',
    relation: 'functional',
    expression: 'target >= 62 + (source - 3.2) * 5',
    impactWeight: 0.75,
  },
  {
    id: 'link_memory_capacity_chassis',
    sourceComponentId: 'comp_memory',
    sourceParameterId: 'param_memory_capacity',
    targetComponentId: 'comp_chassis',
    targetParameterId: 'param_chassis_weight',
    relation: 'cost',
    expression: 'target >= 1200 + (source - 16) * 10',
    impactWeight: 0.45,
  },
  {
    id: 'link_display_brightness_battery',
    sourceComponentId: 'comp_display',
    sourceParameterId: 'param_display_brightness',
    targetComponentId: 'comp_battery',
    targetParameterId: 'param_battery_capacity',
    relation: 'constraint',
    expression: 'target >= 60 + (source - 400) * 0.05',
    impactWeight: 0.34,
  },
];

const buildSupplyPartners = (): SupplyPartner[] => [
  {
    id: 'partner_chipmaker',
    name: 'Crystal Shadow Technologies',
    location: 'TSMC Taoyuan Plant',
    role: 'supplier',
    specialties: ['CPU packaging', 'high power tuning'],
    riskProfile: 'medium',
    supplies: [
      {
        componentId: 'comp_cpu',
        quantityPerWeek: 1200,
        leadTimeDays: 28,
        notes: 'Requires early silicon reservations for next-generation dies.',
      },
    ],
  },
  {
    id: 'partner_boarder',
    name: 'Harmony Boards Co.',
    location: 'Suzhou Smart Factory',
    role: 'assembler',
    specialties: ['Mainboard assembly', 'PCB co-packaging'],
    riskProfile: 'medium',
    supplies: [
      {
        componentId: 'comp_motherboard',
        quantityPerWeek: 1200,
        leadTimeDays: 18,
      },
      {
        componentId: 'comp_memory',
        quantityPerWeek: 2400,
        leadTimeDays: 10,
      },
    ],
  },
  {
    id: 'partner_battery',
    name: 'GreenCore Energy',
    location: 'Huizhou Energy Campus',
    role: 'supplier',
    specialties: ['High-density cells', 'thermal management'],
    riskProfile: 'high',
    supplies: [
      {
        componentId: 'comp_battery',
        quantityPerWeek: 1300,
        leadTimeDays: 20,
      },
    ],
  },
  {
    id: 'partner_distributor',
    name: 'Blue Harbor Storage',
    location: 'Shanghai Free Trade Zone',
    role: 'logistics',
    specialties: ['International warehousing', 'container consolidation'],
    riskProfile: 'low',
    supplies: [],
  },
  {
    id: 'partner_logistics',
    name: 'SwiftWind Logistics',
    location: 'Shenzhen Logistics Hub',
    role: 'logistics',
    specialties: ['Port coordination', 'order kitting'],
    riskProfile: 'low',
    supplies: [
      {
        componentId: 'comp_display',
        quantityPerWeek: 1500,
        leadTimeDays: 5,
      },
    ],
  },
];

const buildSupplyRoutes = (): SupplyRoute[] => [
  {
    id: 'route_chip_to_board',
    sourcePartnerId: 'partner_chipmaker',
    targetPartnerId: 'partner_boarder',
    mode: 'air',
    transitDays: 6,
    reliability: 0.92,
    constraints: 'High-value chips require expedited air clearance.',
  },
  {
    id: 'route_board_to_distributor',
    sourcePartnerId: 'partner_boarder',
    targetPartnerId: 'partner_distributor',
    mode: 'sea',
    transitDays: 12,
    reliability: 0.88,
    constraints: 'Full-assembly pallets must pass moisture-controlled bundling.',
  },
  {
    id: 'route_distributor_to_logistics',
    sourcePartnerId: 'partner_distributor',
    targetPartnerId: 'partner_logistics',
    mode: 'land',
    transitDays: 4,
    reliability: 0.94,
  },
];

export function createDemoWorkspace(): WorkspaceModel {
  const components = buildComponents();
  const parameters = buildParameters();
  const parameterLinks = buildParameterLinks();
  const partners = buildSupplyPartners();
  const routes = buildSupplyRoutes();

  return {
    product: {
      components,
      parameters,
      parameterLinks,
    },
    supplyChain: {
      partners,
      routes,
    },
    changeScenario: {
      id: 'scenario_cpu_freq_boost',
      name: 'CPU Frequency Increase',
      description: 'Increase CPU base frequency to satisfy creator performance targets.',
      sourceComponentId: 'comp_cpu',
      sourceParameterId: 'param_cpu_frequency',
      changeType: 'spec-change',
      changeMagnitude: 'high',
      rationale: 'Customers expect higher framerates in AI rendering workloads.',
      createdAt: '2026-03-25T10:00:00.000Z',
    },
    analysis: null,
  };
}

export const demoWorkspace = createDemoWorkspace();
