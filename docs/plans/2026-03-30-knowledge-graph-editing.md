# Knowledge Graph Editing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add supplier creation, node editing, recursive product subtree deletion, and current graph JSON export to the live knowledge graph page backed by the shared workspace model.

**Architecture:** Keep the existing three-column knowledge-graph page and 3D canvas intact, but route all data mutations through a new pure service module so supplier creation, node updates, recursive deletion, and JSON export are testable outside the UI. The page should own only transient form state, modal visibility, node selection fallback, and download triggering, while the shared `WorkspaceModel` remains the single source of truth for both product and supply-chain entities.

**Tech Stack:** React 19, TypeScript, Vitest, Testing Library, shared `WorkspaceProvider`, existing knowledge-graph view services.

---

## Pre-flight

Before editing, inspect and preserve the existing unstaged diffs in:

- `src/features/knowledge-graph/KnowledgeGraphPage.tsx`
- `src/features/knowledge-graph/KnowledgeGraphSidebar.tsx`
- `src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

These files already contain local changes and must be merged forward rather than overwritten.

### Task 1: Extend the workspace model and add the first editing service behaviors

**Files:**
- Create: `src/services/knowledgeGraphEditing.ts`
- Test: `src/services/knowledgeGraphEditing.test.ts`
- Modify: `src/domain/workspace.ts`
- Modify: `src/data/demoWorkspace.ts`

**Step 1: Write the failing test**

Add a new service test file with a focused fixture workspace and two failing tests:

```ts
import { describe, expect, test } from 'vitest';
import { WorkspaceModel } from '../domain/workspace';
import {
  addSupplierNode,
  exportKnowledgeGraphSnapshot,
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
      parameters: [],
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
      sourceParameterId: null,
      changeType: 'spec-change',
      changeMagnitude: 'medium',
      rationale: 'Fixture',
      createdAt: '2026-03-30T00:00:00.000Z',
    },
    analysis: null,
  };
}

test('addSupplierNode appends a supplier with supply edges for selected components', () => {
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
      nodes: [{ id: 'comp_cpu', name: 'CPU Module', renderLabel: 'CPU Module', kind: 'component', domain: 'product', category: 'component', stage: 'baseline' }],
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
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/services/knowledgeGraphEditing.test.ts`
Expected: FAIL because `knowledgeGraphEditing.ts` and the exported functions do not exist yet.

**Step 3: Write minimal implementation**

Implement the smallest production changes needed:

```ts
// src/domain/workspace.ts
export type SupplyPartner = {
  id: string;
  name: string;
  location: string;
  role: 'supplier' | 'assembler' | 'logistics';
  specialties: string[];
  riskProfile: 'low' | 'medium' | 'high';
  productionCapacity: number;
  unitPrice: number;
  supplies: SupplyAllocation[];
  services: SupplyService[];
};
```

```ts
// src/services/knowledgeGraphEditing.ts
import { WorkspaceModel, SupplyPartner } from '../domain/workspace';
import { GraphEdge, GraphView } from './knowledgeGraph.service';

export type SupplierRelationType = 'supply' | 'service';

export function addSupplierNode(workspace: WorkspaceModel, input: {
  name: string;
  productionCapacity: number;
  unitPrice: number;
  componentIds: string[];
  relationType: SupplierRelationType;
}): WorkspaceModel {
  const nextId = `partner_custom_${workspace.supplyChain.partners.length + 1}`;
  const partner: SupplyPartner = {
    id: nextId,
    name: input.name,
    location: 'Custom Supplier Node',
    role: 'supplier',
    specialties: [],
    riskProfile: 'medium',
    productionCapacity: input.productionCapacity,
    unitPrice: input.unitPrice,
    supplies: input.relationType === 'supply'
      ? input.componentIds.map((componentId) => ({ componentId, quantityPerWeek: input.productionCapacity, leadTimeDays: 7 }))
      : [],
    services: input.relationType === 'service'
      ? input.componentIds.map((componentId) => ({ componentId, serviceName: '配套服务', leadTimeDays: 7 }))
      : [],
  };

  return {
    ...workspace,
    supplyChain: {
      ...workspace.supplyChain,
      partners: [...workspace.supplyChain.partners, partner],
    },
  };
}

export function exportKnowledgeGraphSnapshot(input: {
  filters: GraphEdge['type'][];
  focusNodeId: string | null;
  selectedNodeId: string | null;
  graph: GraphView;
  exportedAt: string;
}): string {
  return JSON.stringify({
    exportedAt: input.exportedAt,
    filters: input.filters,
    focusNodeId: input.focusNodeId,
    selectedNodeId: input.selectedNodeId,
    nodes: input.graph.nodes,
    edges: input.graph.edges,
  }, null, 2);
}
```

Also update all seed and generated partners in `src/data/demoWorkspace.ts` to include `productionCapacity` and `unitPrice` so the app still boots.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/services/knowledgeGraphEditing.test.ts`
Expected: PASS for the two new tests.

**Step 5: Commit**

```bash
git add src/domain/workspace.ts src/data/demoWorkspace.ts src/services/knowledgeGraphEditing.ts src/services/knowledgeGraphEditing.test.ts
git commit -m "feat: add knowledge graph editing service scaffold"
```

### Task 2: Add failing tests and minimal implementation for node updates and recursive deletion

**Files:**
- Modify: `src/services/knowledgeGraphEditing.test.ts`
- Modify: `src/services/knowledgeGraphEditing.ts`

**Step 1: Write the failing test**

Append focused tests for the destructive and update paths:

```ts
import {
  deleteComponentSubtree,
  deleteSupplierNode,
  updateComponentNode,
  updateSupplierNode,
} from './knowledgeGraphEditing';

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
  const supplierId = withSupplier.supplyChain.partners.at(-1)!.id;

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
  const workspace = {
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
          targetComponentId: 'comp_cpu',
          targetParameterId: 'param_die_temp',
          relation: 'constraint',
          expression: 'target <= source',
          impactWeight: 0.4,
        },
      ],
    },
  } satisfies WorkspaceModel;

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
  expect(updated.product.parameters).toEqual([]);
  expect(updated.product.parameterLinks).toEqual([]);
  expect(updated.supplyChain.partners.at(-1)?.supplies).toEqual([]);
  expect(updated.changeScenario.sourceComponentId).toBeNull();
  expect(updated.changeScenario.sourceParameterId).toBeNull();
});

test('deleteSupplierNode removes the supplier and any connected routes', () => {
  const withSupplier = addSupplierNode(createWorkspaceFixture(), {
    name: 'Nova Circuits',
    productionCapacity: 4200,
    unitPrice: 380,
    componentIds: ['comp_cpu'],
    relationType: 'supply',
  });
  const supplierId = withSupplier.supplyChain.partners.at(-1)!.id;
  withSupplier.supplyChain.routes.push({
    id: 'route_fixture',
    sourcePartnerId: supplierId,
    targetPartnerId: supplierId,
    mode: 'land',
    transitDays: 2,
    reliability: 0.9,
  });

  const updated = deleteSupplierNode(withSupplier, supplierId);

  expect(updated.supplyChain.partners.find((partner) => partner.id === supplierId)).toBeUndefined();
  expect(updated.supplyChain.routes).toEqual([]);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/services/knowledgeGraphEditing.test.ts`
Expected: FAIL because the four new functions are missing or incomplete.

**Step 3: Write minimal implementation**

Add the service functions with focused helpers:

```ts
function collectComponentSubtreeIds(components: WorkspaceModel['product']['components'], rootId: string): Set<string> {
  const ids = new Set([rootId]);
  let changed = true;

  while (changed) {
    changed = false;
    for (const component of components) {
      if (component.parentId && ids.has(component.parentId) && !ids.has(component.id)) {
        ids.add(component.id);
        changed = true;
      }
    }
  }

  return ids;
}

export function updateComponentNode(workspace: WorkspaceModel, input: {
  id: string;
  name: string;
  category: WorkspaceModel['product']['components'][number]['category'];
  stage: WorkspaceModel['product']['components'][number]['stage'];
  description?: string;
  tags: string[];
}): WorkspaceModel {
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
              description: input.description,
              tags: input.tags,
            }
          : component,
      ),
    },
  };
}

export function updateSupplierNode(/* ... */): WorkspaceModel {
  // rewrite name, productionCapacity, unitPrice, then rebuild supplies/services from componentIds + relationType
}

export function deleteSupplierNode(/* ... */): WorkspaceModel {
  // drop partner and filter routes where source or target equals supplier id
}

export function deleteComponentSubtree(/* ... */): WorkspaceModel {
  // remove subtree components, parameters, parameter links, and prune supplies/services referencing removed components
}
```

Keep the implementation intentionally small and pure; do not touch the UI yet.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/services/knowledgeGraphEditing.test.ts`
Expected: PASS for all service behaviors.

**Step 5: Commit**

```bash
git add src/services/knowledgeGraphEditing.ts src/services/knowledgeGraphEditing.test.ts
git commit -m "feat: add knowledge graph node mutation rules"
```

### Task 3: Add the sidebar actions and supplier-creation modal on the page

**Files:**
- Modify: `src/features/knowledge-graph/KnowledgeGraphSidebar.tsx`
- Modify: `src/features/knowledge-graph/KnowledgeGraphPage.tsx`
- Modify: `src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

**Step 1: Write the failing test**

Add a page test that proves the live page can create a supplier and export JSON:

```ts
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

beforeEach(() => {
  global.URL.createObjectURL = vi.fn(() => 'blob:knowledge-graph');
  global.URL.revokeObjectURL = vi.fn();
});

test('creates a supplier node from the live page modal', async () => {
  render(
    <WorkspaceProvider>
      <KnowledgeGraphPage />
    </WorkspaceProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: /新增供应商/i }));
  fireEvent.change(screen.getByLabelText(/供应商名称/i), { target: { value: 'Nova Circuits' } });
  fireEvent.change(screen.getByLabelText(/生产能力/i), { target: { value: '4200' } });
  fireEvent.change(screen.getByLabelText(/产品价格/i), { target: { value: '380' } });
  fireEvent.click(screen.getByLabelText(/CPU Module/i));
  fireEvent.click(screen.getByRole('button', { name: /保存供应商/i }));

  expect(await screen.findByDisplayValue('Nova Circuits')).toBeInTheDocument();
});

test('exports the current visible graph as json', () => {
  const click = vi.fn();
  vi.spyOn(document, 'createElement').mockReturnValue({
    click,
    set href(_: string) {},
    set download(_: string) {},
  } as unknown as HTMLAnchorElement);

  render(
    <WorkspaceProvider>
      <KnowledgeGraphPage />
    </WorkspaceProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: /导出当前图谱/i }));

  expect(global.URL.createObjectURL).toHaveBeenCalled();
  expect(click).toHaveBeenCalled();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`
Expected: FAIL because the sidebar buttons, modal fields, and export wiring do not exist yet.

**Step 3: Write minimal implementation**

Modify the live page and sidebar only enough to satisfy the new UI tests:

```ts
// KnowledgeGraphSidebar.tsx
export default function KnowledgeGraphSidebar({
  /* existing props */,
  onAddSupplier,
  onExportGraph,
}: KnowledgeGraphSidebarProps) {
  return (
    <PanelCard /* existing props */>
      <div className="space-y-4">
        <div className="rounded-[24px] border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">图谱操作</p>
          <div className="mt-4 flex flex-col gap-2">
            <button type="button" onClick={onAddSupplier}>新增供应商</button>
            <button type="button" onClick={onExportGraph}>导出当前图谱</button>
          </div>
        </div>
        {/* keep existing metrics + filters */}
      </div>
    </PanelCard>
  );
}
```

```ts
// KnowledgeGraphPage.tsx
const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
const [supplierDraft, setSupplierDraft] = useState({
  name: '',
  productionCapacity: '0',
  unitPrice: '0',
  componentIds: [] as string[],
  relationType: 'supply' as const,
});

const handleCreateSupplier = () => {
  setState((current) =>
    addSupplierNode(current, {
      name: supplierDraft.name.trim(),
      productionCapacity: Number(supplierDraft.productionCapacity),
      unitPrice: Number(supplierDraft.unitPrice),
      componentIds: supplierDraft.componentIds,
      relationType: supplierDraft.relationType,
    }),
  );
  setIsAddSupplierModalOpen(false);
};

const handleExportGraph = () => {
  const data = exportKnowledgeGraphSnapshot({
    graph: localGraph,
    filters: selectedRelationTypes,
    focusNodeId: resolvedFocusNodeId,
    selectedNodeId: resolvedSelectedNodeId,
    exportedAt: new Date().toISOString(),
  });
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `knowledge-graph-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
};
```

Wire the new callbacks through `KnowledgeGraphSidebar` and render the supplier modal in the page.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`
Expected: PASS for supplier creation and export, while preserving existing page tests.

**Step 5: Commit**

```bash
git add src/features/knowledge-graph/KnowledgeGraphSidebar.tsx src/features/knowledge-graph/KnowledgeGraphPage.tsx src/features/knowledge-graph/KnowledgeGraphPage.test.tsx
git commit -m "feat: add knowledge graph supplier creation and export"
```

### Task 4: Add detail-panel editing and deletion for product and supplier nodes

**Files:**
- Modify: `src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`
- Modify: `src/features/knowledge-graph/KnowledgeGraphPage.tsx`
- Modify: `src/services/knowledgeGraphEditing.ts`

**Step 1: Write the failing test**

Extend the page test file with one product-edit test and one destructive delete test:

```ts
test('updates the selected product component from the detail panel', async () => {
  render(
    <WorkspaceProvider>
      <KnowledgeGraphPage />
    </WorkspaceProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: /^CPU Module$/i }));
  fireEvent.change(screen.getByLabelText(/节点名称/i), { target: { value: 'CPU Module X' } });
  fireEvent.change(screen.getByLabelText(/类别/i), { target: { value: 'module' } });
  fireEvent.change(screen.getByLabelText(/阶段/i), { target: { value: 'prototype' } });
  fireEvent.change(screen.getByLabelText(/描述/i), { target: { value: 'Updated description' } });
  fireEvent.change(screen.getByLabelText(/标签/i), { target: { value: 'compute, critical' } });
  fireEvent.click(screen.getByRole('button', { name: /保存更新/i }));

  expect(await screen.findByDisplayValue('CPU Module X')).toBeInTheDocument();
});

test('recursively deletes a selected component subtree from the page', async () => {
  render(
    <WorkspaceProvider>
      <KnowledgeGraphPage />
    </WorkspaceProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: /^CPU Module$/i }));
  fireEvent.click(screen.getByRole('button', { name: /删除节点/i }));

  await waitFor(() => {
    expect(screen.queryByRole('button', { name: /^CPU Module$/i })).not.toBeInTheDocument();
  });
});
```

Also add a supplier-edit test that changes the relation type from `supply` to `service` after creating a custom supplier.

**Step 2: Run test to verify it fails**

Run: `npm test -- src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`
Expected: FAIL because the detail panel is read-only and has no destructive actions yet.

**Step 3: Write minimal implementation**

Add editable drafts driven by the selected node type and dispatch the already-tested service helpers:

```ts
const selectedComponent = state.product.components.find((component) => component.id === resolvedSelectedNodeId);
const selectedPartner = state.supplyChain.partners.find((partner) => partner.id === resolvedSelectedNodeId);

const [componentDraft, setComponentDraft] = useState({
  name: '',
  category: 'component',
  stage: 'baseline',
  description: '',
  tags: '',
});
const [partnerDraft, setPartnerDraft] = useState({
  name: '',
  productionCapacity: '0',
  unitPrice: '0',
  componentIds: [] as string[],
  relationType: 'supply' as const,
});

useEffect(() => {
  if (selectedComponent) {
    setComponentDraft({
      name: selectedComponent.name,
      category: selectedComponent.category,
      stage: selectedComponent.stage,
      description: selectedComponent.description ?? '',
      tags: (selectedComponent.tags ?? []).join(', '),
    });
  }
  if (selectedPartner) {
    setPartnerDraft({
      name: selectedPartner.name,
      productionCapacity: String(selectedPartner.productionCapacity),
      unitPrice: String(selectedPartner.unitPrice),
      componentIds: [...selectedPartner.supplies.map((item) => item.componentId), ...selectedPartner.services.map((item) => item.componentId)],
      relationType: selectedPartner.services.length > 0 ? 'service' : 'supply',
    });
  }
}, [selectedComponent, selectedPartner]);
```

Then add `handleSaveSelectedNode` and `handleDeleteSelectedNode` that call `updateComponentNode`, `updateSupplierNode`, `deleteComponentSubtree`, and `deleteSupplierNode`.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`
Expected: PASS for editing and deletion without regressing the earlier tests.

**Step 5: Commit**

```bash
git add src/features/knowledge-graph/KnowledgeGraphPage.tsx src/features/knowledge-graph/KnowledgeGraphPage.test.tsx src/services/knowledgeGraphEditing.ts
git commit -m "feat: add knowledge graph node editing and deletion"
```

### Task 5: Add selection fallback coverage and run regression verification

**Files:**
- Modify: `src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`
- Modify: `src/features/knowledge-graph/KnowledgeGraphPage.tsx`

**Step 1: Write the failing test**

Add one final regression test for selection fallback after destructive edits:

```ts
test('falls back to another visible node after deleting the selected node', async () => {
  render(
    <WorkspaceProvider>
      <KnowledgeGraphPage />
    </WorkspaceProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: /^CPU Module$/i }));
  fireEvent.click(screen.getByRole('button', { name: /删除节点/i }));

  await waitFor(() => {
    expect(screen.queryByDisplayValue('CPU Module')).not.toBeInTheDocument();
  });
  expect(screen.getAllByRole('region')[2]).toHaveTextContent(/节点详情|当前筛选下无可见节点|Battery Pack|Crystal Shadow Technologies/);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`
Expected: FAIL if selection state still points at a deleted node.

**Step 3: Write minimal implementation**

Tighten the selection fallback after state mutations:

```ts
useEffect(() => {
  if (resolvedSelectedNodeId && localGraph.nodes.some((node) => node.id === resolvedSelectedNodeId)) {
    return;
  }

  setSelectedNodeId(localGraph.nodes[0]?.id ?? null);
}, [localGraph.nodes, resolvedSelectedNodeId]);
```

If this effect is too eager, keep the existing resolver logic and only apply a fallback right after successful delete handlers.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`
Expected: PASS with all page interactions green.

**Step 5: Commit**

```bash
git add src/features/knowledge-graph/KnowledgeGraphPage.tsx src/features/knowledge-graph/KnowledgeGraphPage.test.tsx
git commit -m "test: cover knowledge graph selection fallback"
```

## Final Verification

Run the focused regression suite first:

```bash
npm test -- src/services/knowledgeGraphEditing.test.ts src/features/knowledge-graph/KnowledgeGraphPage.test.tsx
```

Expected: all knowledge-graph service and page tests PASS.

Then run repo-wide guardrails that cover typing and build integration:

```bash
npm run lint
npm run build
```

Expected: both commands complete successfully with no new TypeScript or build errors.
