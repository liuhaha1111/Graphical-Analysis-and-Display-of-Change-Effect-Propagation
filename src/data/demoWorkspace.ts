import {
  ParameterLink,
  ProductComponent,
  ProductParameter,
  SupplyPartner,
  SupplyRoute,
  WorkspaceModel,
} from '../domain/workspace';

const GENERATED_PRODUCT_GROUP_COUNT = 267;
const GENERATED_SUPPLIER_CLUSTER_COUNT = 119;
const TARGET_PRODUCT_COMPONENT_COUNT = 2412;
const TARGET_SUPPLY_PARTNER_COUNT = 600;

const formatIndex = (value: number, width = 3) => value.toString().padStart(width, '0');
const parameterIdForComponent = (componentId: string) => `param_${componentId}_spec`;

type GeneratedGroupIds = {
  systemId: string;
  assemblyAlphaId: string;
  assemblyBetaId: string;
  moduleAlphaId: string;
  moduleBetaId: string;
  componentAlpha1Id: string;
  componentAlpha2Id: string;
  componentBeta1Id: string;
  componentBeta2Id: string;
};

type GeneratedPartnerCluster = {
  clusterId: string;
  materialSupplier: SupplyPartner;
  electronicsSupplier: SupplyPartner;
  assembler: SupplyPartner;
  logistics: SupplyPartner;
  serviceProvider: SupplyPartner;
};

const GENERATED_PARAMETER_NAMES = [
  'Platform Index',
  'Assembly Balance',
  'Assembly Flex',
  'Module Efficiency',
  'Module Tolerance',
  'Part Fit',
  'Part Heat',
  'Part Signal',
  'Part Durability',
] as const;

function createGeneratedGroupIds(groupIndex: number): GeneratedGroupIds {
  const suffix = formatIndex(groupIndex);
  return {
    systemId: `comp_g${suffix}_sys`,
    assemblyAlphaId: `comp_g${suffix}_asm_a`,
    assemblyBetaId: `comp_g${suffix}_asm_b`,
    moduleAlphaId: `comp_g${suffix}_mod_a`,
    moduleBetaId: `comp_g${suffix}_mod_b`,
    componentAlpha1Id: `comp_g${suffix}_part_a1`,
    componentAlpha2Id: `comp_g${suffix}_part_a2`,
    componentBeta1Id: `comp_g${suffix}_part_b1`,
    componentBeta2Id: `comp_g${suffix}_part_b2`,
  };
}

function generatedStage(groupIndex: number, offset: number): ProductComponent['stage'] {
  const value = (groupIndex + offset) % 9;
  if (value === 0) return 'released';
  if (value % 4 === 0) return 'prototype';
  return 'baseline';
}

function generatedRiskProfile(index: number, offset: number): SupplyPartner['riskProfile'] {
  const value = (index + offset) % 6;
  if (value === 0) return 'high';
  if (value % 2 === 0) return 'medium';
  return 'low';
}

const buildSeedComponents = (): ProductComponent[] => [
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

const buildGeneratedComponents = (): ProductComponent[] => {
  const components: ProductComponent[] = [];

  for (let groupIndex = 1; groupIndex <= GENERATED_PRODUCT_GROUP_COUNT; groupIndex += 1) {
    const suffix = formatIndex(groupIndex);
    const ids = createGeneratedGroupIds(groupIndex);

    components.push(
      {
        id: ids.systemId,
        name: `Platform ${suffix}`,
        parentId: null,
        category: 'system',
        stage: generatedStage(groupIndex, 0),
        description: `Generated platform group ${suffix}.`,
        tags: ['generated', 'platform'],
      },
      {
        id: ids.assemblyAlphaId,
        name: `Assembly ${suffix}-A`,
        parentId: ids.systemId,
        category: 'assembly',
        stage: generatedStage(groupIndex, 1),
        description: `Primary integration assembly for platform ${suffix}.`,
      },
      {
        id: ids.assemblyBetaId,
        name: `Assembly ${suffix}-B`,
        parentId: ids.systemId,
        category: 'assembly',
        stage: generatedStage(groupIndex, 2),
        description: `Secondary integration assembly for platform ${suffix}.`,
      },
      {
        id: ids.moduleAlphaId,
        name: `Module ${suffix}-A`,
        parentId: ids.assemblyAlphaId,
        category: 'module',
        stage: generatedStage(groupIndex, 3),
      },
      {
        id: ids.moduleBetaId,
        name: `Module ${suffix}-B`,
        parentId: ids.assemblyAlphaId,
        category: 'module',
        stage: generatedStage(groupIndex, 4),
      },
      {
        id: ids.componentAlpha1Id,
        name: `Part ${suffix}-A1`,
        parentId: ids.moduleAlphaId,
        category: 'component',
        stage: generatedStage(groupIndex, 5),
      },
      {
        id: ids.componentAlpha2Id,
        name: `Part ${suffix}-A2`,
        parentId: ids.moduleAlphaId,
        category: 'component',
        stage: generatedStage(groupIndex, 6),
      },
      {
        id: ids.componentBeta1Id,
        name: `Part ${suffix}-B1`,
        parentId: ids.moduleBetaId,
        category: 'component',
        stage: generatedStage(groupIndex, 7),
      },
      {
        id: ids.componentBeta2Id,
        name: `Part ${suffix}-B2`,
        parentId: ids.moduleBetaId,
        category: 'component',
        stage: generatedStage(groupIndex, 8),
      },
    );
  }

  return components;
};

const buildSeedParameters = (): ProductParameter[] => [
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

const buildGeneratedParameters = (): ProductParameter[] => {
  const parameters: ProductParameter[] = [];

  for (let groupIndex = 1; groupIndex <= GENERATED_PRODUCT_GROUP_COUNT; groupIndex += 1) {
    const ids = createGeneratedGroupIds(groupIndex);
    const componentIds = [
      ids.systemId,
      ids.assemblyAlphaId,
      ids.assemblyBetaId,
      ids.moduleAlphaId,
      ids.moduleBetaId,
      ids.componentAlpha1Id,
      ids.componentAlpha2Id,
      ids.componentBeta1Id,
      ids.componentBeta2Id,
    ];

    componentIds.forEach((componentId, index) => {
      parameters.push({
        id: parameterIdForComponent(componentId),
        componentId,
        name: GENERATED_PARAMETER_NAMES[index],
        unit: 'idx',
        baselineValue: 40 + ((groupIndex + index) % 50),
        minValue: 10,
        maxValue: 100,
        changeable: index !== 0,
        notes: `Generated parameter ${index + 1} for group ${formatIndex(groupIndex)}.`,
      });
    });
  }

  return parameters;
};

const buildSeedParameterLinks = (): ParameterLink[] => [
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

const buildGeneratedParameterLinks = (): ParameterLink[] => {
  const links: ParameterLink[] = [];

  for (let groupIndex = 1; groupIndex <= GENERATED_PRODUCT_GROUP_COUNT; groupIndex += 1) {
    const suffix = formatIndex(groupIndex);
    const ids = createGeneratedGroupIds(groupIndex);

    links.push(
      {
        id: `link_g${suffix}_sys_to_mod_b`,
        sourceComponentId: ids.systemId,
        sourceParameterId: parameterIdForComponent(ids.systemId),
        targetComponentId: ids.moduleBetaId,
        targetParameterId: parameterIdForComponent(ids.moduleBetaId),
        relation: 'functional',
        expression: 'target = source * 0.91',
        impactWeight: 0.58,
      },
      {
        id: `link_g${suffix}_asm_a_to_part_b1`,
        sourceComponentId: ids.assemblyAlphaId,
        sourceParameterId: parameterIdForComponent(ids.assemblyAlphaId),
        targetComponentId: ids.componentBeta1Id,
        targetParameterId: parameterIdForComponent(ids.componentBeta1Id),
        relation: 'constraint',
        expression: 'target = source * 0.84',
        impactWeight: 0.49,
      },
      {
        id: `link_g${suffix}_part_a1_to_asm_b`,
        sourceComponentId: ids.componentAlpha1Id,
        sourceParameterId: parameterIdForComponent(ids.componentAlpha1Id),
        targetComponentId: ids.assemblyBetaId,
        targetParameterId: parameterIdForComponent(ids.assemblyBetaId),
        relation: 'cost',
        expression: 'target = source * 0.77',
        impactWeight: 0.42,
      },
    );
  }

  return links;
};

const buildSeedPartners = (): SupplyPartner[] => [
  {
    id: 'partner_chipmaker',
    name: 'Crystal Shadow Technologies',
    location: 'TSMC Taoyuan Plant',
    role: 'supplier',
    specialties: ['CPU packaging', 'high power tuning'],
    riskProfile: 'medium',
    productionCapacity: 120000,
    unitPrice: 1250,
    supplies: [
      {
        componentId: 'comp_cpu',
        quantityPerWeek: 1200,
        leadTimeDays: 28,
        notes: 'Requires early silicon reservations for next-generation dies.',
      },
    ],
    services: [
      {
        componentId: 'comp_cpu',
        serviceName: 'Silicon tuning service',
        leadTimeDays: 9,
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
    productionCapacity: 180000,
    unitPrice: 680,
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
    services: [
      {
        componentId: 'comp_laptop',
        serviceName: 'System integration service',
        leadTimeDays: 14,
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
    productionCapacity: 96000,
    unitPrice: 540,
    supplies: [
      {
        componentId: 'comp_battery',
        quantityPerWeek: 1300,
        leadTimeDays: 20,
      },
    ],
    services: [
      {
        componentId: 'comp_battery',
        serviceName: 'Battery pack certification',
        leadTimeDays: 11,
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
    productionCapacity: 70000,
    unitPrice: 160,
    supplies: [],
    services: [
      {
        componentId: 'comp_storage',
        serviceName: 'Storage routing service',
        leadTimeDays: 6,
      },
    ],
  },
  {
    id: 'partner_logistics',
    name: 'SwiftWind Logistics',
    location: 'Shenzhen Logistics Hub',
    role: 'logistics',
    specialties: ['Port coordination', 'order kitting'],
    riskProfile: 'low',
    productionCapacity: 88000,
    unitPrice: 190,
    supplies: [
      {
        componentId: 'comp_display',
        quantityPerWeek: 1500,
        leadTimeDays: 5,
      },
    ],
    services: [
      {
        componentId: 'comp_display',
        serviceName: 'Display delivery orchestration',
        leadTimeDays: 5,
      },
    ],
  },
];

function createGeneratedPartnerCluster(clusterIndex: number): GeneratedPartnerCluster {
  const suffix = formatIndex(clusterIndex);

  return {
    clusterId: suffix,
    materialSupplier: {
      id: `partner_g${suffix}_material`,
      name: `Atlas Materials ${suffix}`,
      location: `Material Hub ${suffix}`,
      role: 'supplier',
      specialties: ['substrate kits', 'precision metal'],
      riskProfile: generatedRiskProfile(clusterIndex, 0),
      productionCapacity: 6000 + clusterIndex * 20,
      unitPrice: 180 + (clusterIndex % 45),
      supplies: [],
      services: [],
    },
    electronicsSupplier: {
      id: `partner_g${suffix}_electronics`,
      name: `Helix Electronics ${suffix}`,
      location: `Electronics Park ${suffix}`,
      role: 'supplier',
      specialties: ['signal boards', 'embedded controls'],
      riskProfile: generatedRiskProfile(clusterIndex, 1),
      productionCapacity: 5400 + clusterIndex * 18,
      unitPrice: 240 + (clusterIndex % 55),
      supplies: [],
      services: [],
    },
    assembler: {
      id: `partner_g${suffix}_assembler`,
      name: `Forge Assembly ${suffix}`,
      location: `Assembly Line ${suffix}`,
      role: 'assembler',
      specialties: ['module integration', 'calibration'],
      riskProfile: generatedRiskProfile(clusterIndex, 2),
      productionCapacity: 4800 + clusterIndex * 16,
      unitPrice: 320 + (clusterIndex % 60),
      supplies: [],
      services: [],
    },
    logistics: {
      id: `partner_g${suffix}_logistics`,
      name: `Northwind Logistics ${suffix}`,
      location: `Logistics Terminal ${suffix}`,
      role: 'logistics',
      specialties: ['cross-dock scheduling', 'bonded transit'],
      riskProfile: generatedRiskProfile(clusterIndex, 3),
      productionCapacity: 3600 + clusterIndex * 12,
      unitPrice: 90 + (clusterIndex % 25),
      supplies: [],
      services: [],
    },
    serviceProvider: {
      id: `partner_g${suffix}_service`,
      name: `Signal Services ${suffix}`,
      location: `Service Campus ${suffix}`,
      role: 'supplier',
      specialties: ['configuration tuning', 'acceptance test'],
      riskProfile: generatedRiskProfile(clusterIndex, 4),
      productionCapacity: 4200 + clusterIndex * 14,
      unitPrice: 210 + (clusterIndex % 40),
      supplies: [],
      services: [],
    },
  };
}

function buildGeneratedSupplyData(): { partners: SupplyPartner[]; routes: SupplyRoute[] } {
  const clusters = Array.from({ length: GENERATED_SUPPLIER_CLUSTER_COUNT }, (_, index) =>
    createGeneratedPartnerCluster(index + 1),
  );

  for (let groupIndex = 1; groupIndex <= GENERATED_PRODUCT_GROUP_COUNT; groupIndex += 1) {
    const ids = createGeneratedGroupIds(groupIndex);
    const cluster = clusters[(groupIndex - 1) % clusters.length];

    cluster.materialSupplier.supplies.push(
      {
        componentId: ids.moduleAlphaId,
        quantityPerWeek: 420 + groupIndex,
        leadTimeDays: 12 + (groupIndex % 6),
      },
      {
        componentId: ids.componentAlpha1Id,
        quantityPerWeek: 610 + groupIndex,
        leadTimeDays: 9 + (groupIndex % 5),
      },
    );

    cluster.electronicsSupplier.supplies.push({
      componentId: ids.moduleBetaId,
      quantityPerWeek: 390 + groupIndex,
      leadTimeDays: 11 + (groupIndex % 4),
    });

    cluster.assembler.supplies.push(
      {
        componentId: ids.assemblyAlphaId,
        quantityPerWeek: 300 + groupIndex,
        leadTimeDays: 7 + (groupIndex % 3),
      },
      {
        componentId: ids.assemblyBetaId,
        quantityPerWeek: 280 + groupIndex,
        leadTimeDays: 8 + (groupIndex % 3),
      },
    );

    cluster.serviceProvider.supplies.push({
      componentId: ids.componentBeta1Id,
      quantityPerWeek: 460 + groupIndex,
      leadTimeDays: 10 + (groupIndex % 4),
    });

    cluster.assembler.services.push({
      componentId: ids.systemId,
      serviceName: 'Platform integration service',
      leadTimeDays: 6 + (groupIndex % 4),
    });

    cluster.logistics.services.push({
      componentId: ids.componentBeta2Id,
      serviceName: 'Delivery scheduling service',
      leadTimeDays: 4 + (groupIndex % 3),
    });
  }

  const routes: SupplyRoute[] = clusters.flatMap((cluster, index) => {
    const suffix = formatIndex(index + 1);
    return [
      {
        id: `route_g${suffix}_material_to_assembler`,
        sourcePartnerId: cluster.materialSupplier.id,
        targetPartnerId: cluster.assembler.id,
        mode: 'air',
        transitDays: 4 + ((index + 1) % 3),
        reliability: 0.92,
      },
      {
        id: `route_g${suffix}_electronics_to_assembler`,
        sourcePartnerId: cluster.electronicsSupplier.id,
        targetPartnerId: cluster.assembler.id,
        mode: 'sea',
        transitDays: 8 + ((index + 1) % 4),
        reliability: 0.88,
      },
      {
        id: `route_g${suffix}_assembler_to_logistics`,
        sourcePartnerId: cluster.assembler.id,
        targetPartnerId: cluster.logistics.id,
        mode: 'land',
        transitDays: 3 + ((index + 1) % 2),
        reliability: 0.95,
      },
      {
        id: `route_g${suffix}_logistics_to_service`,
        sourcePartnerId: cluster.logistics.id,
        targetPartnerId: cluster.serviceProvider.id,
        mode: 'land',
        transitDays: 2,
        reliability: 0.97,
      },
    ];
  });

  const partners = clusters.flatMap((cluster) => [
    cluster.materialSupplier,
    cluster.electronicsSupplier,
    cluster.assembler,
    cluster.logistics,
    cluster.serviceProvider,
  ]);

  return { partners, routes };
}

const buildSeedRoutes = (): SupplyRoute[] => [
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
  const components = [...buildSeedComponents(), ...buildGeneratedComponents()];
  const parameters = [...buildSeedParameters(), ...buildGeneratedParameters()];
  const parameterLinks = [...buildSeedParameterLinks(), ...buildGeneratedParameterLinks()];
  const generatedSupply = buildGeneratedSupplyData();
  const partners = [...buildSeedPartners(), ...generatedSupply.partners];
  const routes = [...buildSeedRoutes(), ...generatedSupply.routes];

  if (components.length !== TARGET_PRODUCT_COMPONENT_COUNT) {
    throw new Error(`Expected ${TARGET_PRODUCT_COMPONENT_COUNT} product components, received ${components.length}`);
  }

  if (partners.length !== TARGET_SUPPLY_PARTNER_COUNT) {
    throw new Error(`Expected ${TARGET_SUPPLY_PARTNER_COUNT} supply partners, received ${partners.length}`);
  }

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

