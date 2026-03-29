import {
  ParameterLink,
  ProductComponent,
  SupplyPartner,
  SupplyRoute,
  WorkspaceModel,
} from '../domain/workspace';

export type GraphNodeDomain = 'product' | 'supply';
export type GraphEdgeDomain = 'product' | 'cross-domain' | 'supply';

export type ComponentGraphNode = {
  id: string;
  name: string;
  renderLabel: string;
  kind: 'component';
  domain: GraphNodeDomain;
  category: ProductComponent['category'];
  stage: ProductComponent['stage'];
};

export type SupplierGraphNode = {
  id: string;
  name: string;
  renderLabel: string;
  kind: 'supplier';
  domain: GraphNodeDomain;
  role: SupplyPartner['role'];
  riskProfile: SupplyPartner['riskProfile'];
};

export type GraphNode = ComponentGraphNode | SupplierGraphNode;

export type AssemblyEdge = {
  id: string;
  source: string;
  target: string;
  type: 'assembly';
  domain: GraphEdgeDomain;
  label: '装配关系';
  renderLabel: '装配';
};

export type ConfigurationEdge = {
  id: string;
  source: string;
  target: string;
  type: 'configuration';
  domain: GraphEdgeDomain;
  label: '配置关系';
  renderLabel: '配置';
  linkId: string;
};

export type SupplyEdge = {
  id: string;
  source: string;
  target: string;
  type: 'supply';
  domain: GraphEdgeDomain;
  label: '供应关系';
  renderLabel: '供应';
  allocation: {
    quantityPerWeek: number;
    leadTimeDays: number;
  };
};

export type ServiceEdge = {
  id: string;
  source: string;
  target: string;
  type: 'service';
  domain: GraphEdgeDomain;
  label: '配置服务';
  renderLabel: '服务';
  service: {
    serviceName: string;
    leadTimeDays: number;
  };
};

export type TransactionEdge = {
  id: string;
  source: string;
  target: string;
  type: 'transaction';
  domain: GraphEdgeDomain;
  label: '交易关系';
  renderLabel: '交易';
  route: {
    mode: SupplyRoute['mode'];
    transitDays: number;
    reliability: number;
  };
};

export type GraphEdge =
  | AssemblyEdge
  | ConfigurationEdge
  | SupplyEdge
  | ServiceEdge
  | TransactionEdge;

export type GraphView = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

function buildConfigurationEdges(parameterLinks: ParameterLink[]): ConfigurationEdge[] {
  const edgeByPair = new Map<string, ConfigurationEdge>();

  for (const link of [...parameterLinks].sort((a, b) => a.id.localeCompare(b.id))) {
    if (link.sourceComponentId === link.targetComponentId) {
      continue;
    }

    const key = `${link.sourceComponentId}->${link.targetComponentId}`;
    if (!edgeByPair.has(key)) {
      edgeByPair.set(key, {
        id: `configuration_${link.sourceComponentId}_${link.targetComponentId}`,
        source: link.sourceComponentId,
        target: link.targetComponentId,
        type: 'configuration',
        domain: 'product',
        label: '配置关系',
        renderLabel: '配置',
        linkId: link.id,
      });
    }
  }

  return [...edgeByPair.values()];
}

export function buildKnowledgeGraphView(workspace: WorkspaceModel): GraphView {
  const { product, supplyChain } = workspace;

  const componentNodes: ComponentGraphNode[] = product.components.map((component) => ({
    id: component.id,
    name: component.name,
    renderLabel: component.name,
    kind: 'component',
    domain: 'product',
    category: component.category,
    stage: component.stage,
  }));

  const partnerNodes: SupplierGraphNode[] = supplyChain.partners.map((partner) => ({
    id: partner.id,
    name: partner.name,
    renderLabel: partner.name,
    kind: 'supplier',
    domain: 'supply',
    role: partner.role,
    riskProfile: partner.riskProfile,
  }));

  const assemblyEdges: AssemblyEdge[] = product.components
    .filter((component) => component.parentId !== null)
    .map((component) => ({
      id: `assembly_${component.id}`,
      source: component.parentId!,
      target: component.id,
      type: 'assembly',
      domain: 'product',
      label: '装配关系',
      renderLabel: '装配',
    }));

  const configurationEdges = buildConfigurationEdges(product.parameterLinks);

  const supplyEdges: SupplyEdge[] = supplyChain.partners.flatMap((partner) =>
    partner.supplies.map((allocation) => ({
      id: `supply_${allocation.componentId}_${partner.id}`,
      source: allocation.componentId,
      target: partner.id,
      type: 'supply',
      domain: 'cross-domain',
      label: '供应关系',
      renderLabel: '供应',
      allocation: {
        quantityPerWeek: allocation.quantityPerWeek,
        leadTimeDays: allocation.leadTimeDays,
      },
    })),
  );

  const serviceEdges: ServiceEdge[] = supplyChain.partners.flatMap((partner) =>
    partner.services.map((service) => ({
      id: `service_${service.componentId}_${partner.id}`,
      source: service.componentId,
      target: partner.id,
      type: 'service',
      domain: 'cross-domain',
      label: '配置服务',
      renderLabel: '服务',
      service: {
        serviceName: service.serviceName,
        leadTimeDays: service.leadTimeDays,
      },
    })),
  );

  const transactionEdges: TransactionEdge[] = supplyChain.routes.map((route) => ({
    id: `transaction_${route.id}`,
    source: route.sourcePartnerId,
    target: route.targetPartnerId,
    type: 'transaction',
    domain: 'supply',
    label: '交易关系',
    renderLabel: '交易',
    route: {
      mode: route.mode,
      transitDays: route.transitDays,
      reliability: route.reliability,
    },
  }));

  return {
    nodes: [...componentNodes, ...partnerNodes],
    edges: [
      ...assemblyEdges,
      ...configurationEdges,
      ...supplyEdges,
      ...serviceEdges,
      ...transactionEdges,
    ],
  };
}
