import {
  ProductComponent,
  SupplyAllocation,
  SupplyPartner,
  SupplyService,
  WorkspaceModel,
} from '../domain/workspace';
import { GraphEdge, GraphView } from './knowledgeGraph.service';

export type SupplierRelationType = 'supply' | 'service';

export type AddSupplierNodeInput = {
  name: string;
  productionCapacity: number;
  unitPrice: number;
  componentIds: string[];
  relationType: SupplierRelationType;
};

export type UpdateComponentNodeInput = {
  id: string;
  name: string;
  category: ProductComponent['category'];
  stage: ProductComponent['stage'];
  description?: string;
  tags: string[];
};

export type UpdateSupplierNodeInput = AddSupplierNodeInput & {
  id: string;
};

export type KnowledgeGraphSnapshotInput = {
  filters: GraphEdge['type'][];
  focusNodeId: string | null;
  selectedNodeId: string | null;
  graph: GraphView;
  exportedAt: string;
};

function createPartnerId(workspace: WorkspaceModel) {
  let index = workspace.supplyChain.partners.length + 1;
  let nextId = `partner_custom_${index}`;
  const existingIds = new Set(workspace.supplyChain.partners.map((partner) => partner.id));

  while (existingIds.has(nextId)) {
    index += 1;
    nextId = `partner_custom_${index}`;
  }

  return nextId;
}

function buildPartnerRelationships(input: AddSupplierNodeInput): {
  supplies: SupplyAllocation[];
  services: SupplyService[];
} {
  return {
    supplies:
      input.relationType === 'supply'
        ? input.componentIds.map((componentId) => ({
            componentId,
            quantityPerWeek: input.productionCapacity,
            leadTimeDays: 7,
          }))
        : [],
    services:
      input.relationType === 'service'
        ? input.componentIds.map((componentId) => ({
            componentId,
            serviceName: '配套服务',
            leadTimeDays: 7,
          }))
        : [],
  };
}

function collectComponentSubtreeIds(
  components: WorkspaceModel['product']['components'],
  rootId: string,
): Set<string> {
  const subtreeIds = new Set<string>();
  const queue = [rootId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId || subtreeIds.has(currentId)) {
      continue;
    }

    subtreeIds.add(currentId);
    components.forEach((component) => {
      if (component.parentId === currentId) {
        queue.push(component.id);
      }
    });
  }

  return subtreeIds;
}

export function addSupplierNode(
  workspace: WorkspaceModel,
  input: AddSupplierNodeInput,
): WorkspaceModel {
  const relationships = buildPartnerRelationships(input);
  const partner: SupplyPartner = {
    id: createPartnerId(workspace),
    name: input.name,
    location: 'Custom Supplier Node',
    role: 'supplier',
    specialties: [],
    riskProfile: 'medium',
    productionCapacity: input.productionCapacity,
    unitPrice: input.unitPrice,
    supplies: relationships.supplies,
    services: relationships.services,
  };

  return {
    ...workspace,
    supplyChain: {
      ...workspace.supplyChain,
      partners: [...workspace.supplyChain.partners, partner],
    },
  };
}

export function updateComponentNode(
  workspace: WorkspaceModel,
  input: UpdateComponentNodeInput,
): WorkspaceModel {
  return {
    ...workspace,
    product: {
      ...workspace.product,
      components: workspace.product.components.map((component) =>
        component.id === input.id
          ? {
              ...component,
              name: input.name,
              category: input.category,
              stage: input.stage,
              description: input.description || undefined,
              tags: input.tags,
            }
          : component,
      ),
    },
  };
}

export function updateSupplierNode(
  workspace: WorkspaceModel,
  input: UpdateSupplierNodeInput,
): WorkspaceModel {
  const relationships = buildPartnerRelationships(input);

  return {
    ...workspace,
    supplyChain: {
      ...workspace.supplyChain,
      partners: workspace.supplyChain.partners.map((partner) =>
        partner.id === input.id
          ? {
              ...partner,
              name: input.name,
              productionCapacity: input.productionCapacity,
              unitPrice: input.unitPrice,
              supplies: relationships.supplies,
              services: relationships.services,
            }
          : partner,
      ),
    },
  };
}

export function deleteSupplierNode(
  workspace: WorkspaceModel,
  supplierId: string,
): WorkspaceModel {
  return {
    ...workspace,
    supplyChain: {
      partners: workspace.supplyChain.partners.filter((partner) => partner.id !== supplierId),
      routes: workspace.supplyChain.routes.filter(
        (route) => route.sourcePartnerId !== supplierId && route.targetPartnerId !== supplierId,
      ),
    },
  };
}

export function deleteComponentSubtree(
  workspace: WorkspaceModel,
  rootComponentId: string,
): WorkspaceModel {
  const removedComponentIds = collectComponentSubtreeIds(
    workspace.product.components,
    rootComponentId,
  );

  if (removedComponentIds.size === 0) {
    return workspace;
  }

  const removedParameterIds = new Set(
    workspace.product.parameters
      .filter((parameter) => removedComponentIds.has(parameter.componentId))
      .map((parameter) => parameter.id),
  );

  return {
    ...workspace,
    product: {
      ...workspace.product,
      components: workspace.product.components.filter(
        (component) => !removedComponentIds.has(component.id),
      ),
      parameters: workspace.product.parameters.filter(
        (parameter) => !removedParameterIds.has(parameter.id),
      ),
      parameterLinks: workspace.product.parameterLinks.filter(
        (link) =>
          !removedComponentIds.has(link.sourceComponentId) &&
          !removedComponentIds.has(link.targetComponentId) &&
          !removedParameterIds.has(link.sourceParameterId) &&
          !removedParameterIds.has(link.targetParameterId),
      ),
    },
    supplyChain: {
      ...workspace.supplyChain,
      partners: workspace.supplyChain.partners.map((partner) => ({
        ...partner,
        supplies: partner.supplies.filter(
          (supply) => !removedComponentIds.has(supply.componentId),
        ),
        services: partner.services.filter(
          (service) => !removedComponentIds.has(service.componentId),
        ),
      })),
    },
    changeScenario: {
      ...workspace.changeScenario,
      sourceComponentId: removedComponentIds.has(workspace.changeScenario.sourceComponentId)
        ? ''
        : workspace.changeScenario.sourceComponentId,
      sourceParameterId: removedParameterIds.has(workspace.changeScenario.sourceParameterId)
        ? ''
        : workspace.changeScenario.sourceParameterId,
    },
  };
}

export function exportKnowledgeGraphSnapshot(input: KnowledgeGraphSnapshotInput): string {
  return JSON.stringify(
    {
      exportedAt: input.exportedAt,
      filters: input.filters,
      focusNodeId: input.focusNodeId,
      selectedNodeId: input.selectedNodeId,
      nodes: input.graph.nodes,
      edges: input.graph.edges,
    },
    null,
    2,
  );
}
