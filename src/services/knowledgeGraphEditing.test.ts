import { expect, test } from 'vitest';
import { WorkspaceModel } from '../domain/workspace';
import {
  addSupplierNode,
  deleteComponentSubtree,
  deleteSupplierNode,
  exportKnowledgeGraphSnapshot,
  updateComponentNode,
  updateSupplierNode,
} from './knowledgeGraphEditing';

function createWorkspaceFixture(): WorkspaceModel {
  return {
    product: {
      components: [
        {
          id: 'comp_root',
          name: 'Root Platform',
          parentId: null,
          category: 'system',
          stage: 'baseline',
          description: 'Fixture root',
          tags: ['fixture'],
        },
        {
          id: 'comp_cpu',
          name: 'CPU Module',
          parentId: 'comp_root',
          category: 'component',
          stage: 'baseline',
          description: 'Fixture component',
          tags: ['compute'],
        },
      ],
      parameters: [
        {
          id: 'param_root_budget',
          componentId: 'comp_root',
          name: 'Root Budget',
          unit: 'idx',
          baselineValue: 10,
          changeable: true,
        },
      ],
      parameterLinks: [],
    },
    supplyChain: {
      partners: [],
      routes: [],
    },
    changeScenario: {
      id: 'scenario_fixture',
      name: 'Fixture Scenario',
      description: 'Fixture',
      sourceComponentId: 'comp_cpu',
      sourceParameterId: 'param_root_budget',
      changeType: 'spec-change',
      changeMagnitude: 'medium',
      rationale: 'Fixture',
      createdAt: '2026-03-30T00:00:00.000Z',
    },
    analysis: null,
  };
}

test('addSupplierNode appends a supplier with supply relationships for selected components', () => {
  const updated = addSupplierNode(createWorkspaceFixture(), {
    name: 'Nova Circuits',
    productionCapacity: 4200,
    unitPrice: 380,
    componentIds: ['comp_cpu'],
    relationType: 'supply',
  });

  expect(updated.supplyChain.partners.at(-1)).toMatchObject({
    name: 'Nova Circuits',
    productionCapacity: 4200,
    unitPrice: 380,
  });
  expect(updated.supplyChain.partners.at(-1)?.supplies).toEqual([
    expect.objectContaining({ componentId: 'comp_cpu' }),
  ]);
  expect(updated.supplyChain.partners.at(-1)?.services).toEqual([]);
});

test('exportKnowledgeGraphSnapshot serializes the current visible graph context', () => {
  const json = exportKnowledgeGraphSnapshot({
    filters: ['assembly', 'supply'],
    focusNodeId: 'comp_cpu',
    selectedNodeId: 'partner_new',
    graph: {
      nodes: [
        {
          id: 'comp_cpu',
          name: 'CPU Module',
          renderLabel: 'CPU Module',
          kind: 'component',
          domain: 'product',
          category: 'component',
          stage: 'baseline',
        },
      ],
      edges: [],
    },
    exportedAt: '2026-03-30T08:00:00.000Z',
  });

  expect(JSON.parse(json)).toEqual({
    exportedAt: '2026-03-30T08:00:00.000Z',
    filters: ['assembly', 'supply'],
    focusNodeId: 'comp_cpu',
    selectedNodeId: 'partner_new',
    nodes: expect.any(Array),
    edges: expect.any(Array),
  });
});

test('updateComponentNode persists category, stage, description, and tags', () => {
  const updated = updateComponentNode(createWorkspaceFixture(), {
    id: 'comp_cpu',
    name: 'CPU Module X',
    category: 'module',
    stage: 'prototype',
    description: 'Updated description',
    tags: ['compute', 'critical'],
  });

  expect(updated.product.components.find((component) => component.id === 'comp_cpu')).toMatchObject({
    name: 'CPU Module X',
    category: 'module',
    stage: 'prototype',
    description: 'Updated description',
    tags: ['compute', 'critical'],
  });
});

test('updateSupplierNode replaces old supply relationships with service relationships', () => {
  const withSupplier = addSupplierNode(createWorkspaceFixture(), {
    name: 'Nova Circuits',
    productionCapacity: 4200,
    unitPrice: 380,
    componentIds: ['comp_cpu'],
    relationType: 'supply',
  });
  const supplierId = withSupplier.supplyChain.partners.at(-1)?.id;

  if (!supplierId) {
    throw new Error('Expected supplier id');
  }

  const updated = updateSupplierNode(withSupplier, {
    id: supplierId,
    name: 'Nova Circuits Service Hub',
    productionCapacity: 5000,
    unitPrice: 450,
    componentIds: ['comp_root'],
    relationType: 'service',
  });

  expect(updated.supplyChain.partners.find((partner) => partner.id === supplierId)).toMatchObject({
    name: 'Nova Circuits Service Hub',
    productionCapacity: 5000,
    unitPrice: 450,
    supplies: [],
    services: [expect.objectContaining({ componentId: 'comp_root' })],
  });
});

test('deleteComponentSubtree removes descendants, parameter links, supply edges, and invalid changeScenario references', () => {
  const workspace: WorkspaceModel = {
    ...createWorkspaceFixture(),
    product: {
      components: [
        ...createWorkspaceFixture().product.components,
        {
          id: 'comp_die',
          name: 'CPU Die',
          parentId: 'comp_cpu',
          category: 'component',
          stage: 'baseline',
          description: 'Child node',
          tags: ['child'],
        },
      ],
      parameters: [
        {
          id: 'param_root_budget',
          componentId: 'comp_root',
          name: 'Root Budget',
          unit: 'idx',
          baselineValue: 10,
          changeable: true,
        },
        {
          id: 'param_die_temp',
          componentId: 'comp_die',
          name: 'Die Temp',
          unit: 'C',
          baselineValue: 85,
          changeable: true,
        },
      ],
      parameterLinks: [
        {
          id: 'link_die_cpu',
          sourceComponentId: 'comp_die',
          sourceParameterId: 'param_die_temp',
          targetComponentId: 'comp_root',
          targetParameterId: 'param_root_budget',
          relation: 'constraint',
          expression: 'target <= source',
          impactWeight: 0.4,
        },
      ],
    },
    changeScenario: {
      ...createWorkspaceFixture().changeScenario,
      sourceComponentId: 'comp_cpu',
      sourceParameterId: 'param_die_temp',
    },
  };

  const withSupplier = addSupplierNode(workspace, {
    name: 'Nova Circuits',
    productionCapacity: 4200,
    unitPrice: 380,
    componentIds: ['comp_cpu', 'comp_die'],
    relationType: 'supply',
  });

  const updated = deleteComponentSubtree(withSupplier, 'comp_cpu');

  expect(updated.product.components.map((component) => component.id)).not.toContain('comp_cpu');
  expect(updated.product.components.map((component) => component.id)).not.toContain('comp_die');
  expect(updated.product.parameters).toEqual([
    expect.objectContaining({ id: 'param_root_budget' }),
  ]);
  expect(updated.product.parameterLinks).toEqual([]);
  expect(updated.supplyChain.partners.at(-1)?.supplies).toEqual([]);
  expect(updated.changeScenario.sourceComponentId).toBe('');
  expect(updated.changeScenario.sourceParameterId).toBe('');
});

test('deleteSupplierNode removes the supplier and any connected routes', () => {
  const withSupplier = addSupplierNode(createWorkspaceFixture(), {
    name: 'Nova Circuits',
    productionCapacity: 4200,
    unitPrice: 380,
    componentIds: ['comp_cpu'],
    relationType: 'supply',
  });
  const supplierId = withSupplier.supplyChain.partners.at(-1)?.id;

  if (!supplierId) {
    throw new Error('Expected supplier id');
  }

  const workspaceWithRoute: WorkspaceModel = {
    ...withSupplier,
    supplyChain: {
      ...withSupplier.supplyChain,
      routes: [
        {
          id: 'route_fixture',
          sourcePartnerId: supplierId,
          targetPartnerId: supplierId,
          mode: 'land',
          transitDays: 2,
          reliability: 0.9,
        },
      ],
    },
  };

  const updated = deleteSupplierNode(workspaceWithRoute, supplierId);

  expect(updated.supplyChain.partners.find((partner) => partner.id === supplierId)).toBeUndefined();
  expect(updated.supplyChain.routes).toEqual([]);
});
