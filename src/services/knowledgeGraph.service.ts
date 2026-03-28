import {
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

export type BomEdge = {
  id: string;
  source: string;
  target: string;
  type: 'bom';
  domain: GraphEdgeDomain;
  label: 'BOM';
  renderLabel: 'BOM';
};

export type SourcingEdge = {
  id: string;
  source: string;
  target: string;
  type: 'sourcing';
  domain: GraphEdgeDomain;
  label: 'Sourcing Link';
  renderLabel: 'Sourcing Link';
  allocation: {
    quantityPerWeek: number;
    leadTimeDays: number;
  };
};

export type RouteEdge = {
  id: string;
  source: string;
  target: string;
  type: 'route';
  domain: GraphEdgeDomain;
  label: SupplyRoute['mode'];
  renderLabel: string;
  route: {
    mode: SupplyRoute['mode'];
    transitDays: number;
    reliability: number;
  };
};

export type GraphEdge = BomEdge | SourcingEdge | RouteEdge;

export type GraphView = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

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

  const bomEdges: BomEdge[] = product.components
    .filter((component) => component.parentId !== null)
    .map((component) => ({
      id: `bom_${component.id}`,
      source: component.parentId!,
      target: component.id,
      type: 'bom',
      domain: 'product',
      label: 'BOM',
      renderLabel: 'BOM',
    }));

  const sourcingEdges: SourcingEdge[] = supplyChain.partners.flatMap((partner) =>
    partner.supplies.map((allocation) => ({
      id: `sourcing_${partner.id}_${allocation.componentId}`,
      source: allocation.componentId,
      target: partner.id,
      type: 'sourcing',
      domain: 'cross-domain',
      label: 'Sourcing Link',
      renderLabel: 'Sourcing Link',
      allocation: {
        quantityPerWeek: allocation.quantityPerWeek,
        leadTimeDays: allocation.leadTimeDays,
      },
    }))
  );

  const routeEdges: RouteEdge[] = supplyChain.routes.map((route) => ({
    id: `route_${route.id}`,
    source: route.sourcePartnerId,
    target: route.targetPartnerId,
    type: 'route',
    domain: 'supply',
    label: route.mode,
    renderLabel: route.mode.toUpperCase(),
    route: {
      mode: route.mode,
      transitDays: route.transitDays,
      reliability: route.reliability,
    },
  }));

  return {
    nodes: [...componentNodes, ...partnerNodes],
    edges: [...bomEdges, ...sourcingEdges, ...routeEdges],
  };
}
