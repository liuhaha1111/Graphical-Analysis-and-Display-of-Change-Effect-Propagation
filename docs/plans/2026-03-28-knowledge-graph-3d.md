# Knowledge Graph 3D Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the knowledge-graph page's 2D main canvas with a true 3D graph scene that defaults to a filtered local subgraph and lets the user progressively expand neighbors.

**Architecture:** Keep the full 3012-entity graph in the shared workspace and existing graph services, derive a filtered candidate graph from relationship toggles, derive a local subgraph from the current focus node plus expanded nodes, map the stable topology coordinates into deterministic 3D coordinates, and render that local subgraph through a React Three Fiber scene with page-level focus and expansion state.

**Tech Stack:** React 19, TypeScript, Vitest, React Testing Library, Three.js, @react-three/fiber, @react-three/drei, Tailwind CSS

---

### Task 1: Add Failing Tests For Local Subgraph Derivation

**Files:**
- Create: `src/services/knowledgeGraphSubgraph.test.ts`
- Modify: `src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

**Step 1: Write the failing test**

Create `src/services/knowledgeGraphSubgraph.test.ts` with tests that lock the desired local-view behavior:

```ts
import { demoWorkspace } from '../data/demoWorkspace';
import { buildKnowledgeGraphView } from './knowledgeGraph.service';
import { filterKnowledgeGraphByRelationTypes } from './knowledgeGraphFilters';
import { buildKnowledgeGraphSubgraph } from './knowledgeGraphSubgraph';

test('defaults to the focus node plus one-hop neighbors', () => {
  const graph = filterKnowledgeGraphByRelationTypes(
    buildKnowledgeGraphView(demoWorkspace),
    ['supply', 'transaction'],
  );

  const subgraph = buildKnowledgeGraphSubgraph(graph, {
    focusNodeId: 'partner_chipmaker',
    expandedNodeIds: [],
  });

  expect(subgraph.nodes.some((node) => node.id === 'partner_chipmaker')).toBe(true);
  expect(subgraph.edges.every(
    (edge) => edge.source === 'partner_chipmaker' || edge.target === 'partner_chipmaker',
  )).toBe(true);
});
```

Add a page-level failing test in `src/features/knowledge-graph/KnowledgeGraphPage.test.tsx` that asserts the initial scene does not render every visible node from the filtered graph.

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/services/knowledgeGraphSubgraph.test.ts src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

Expected: FAIL because the local-subgraph service does not exist and the page still assumes a full visible graph.

**Step 3: Write minimal implementation**

Do not implement the page yet. Add only the smallest new API surface needed for the failing service test to compile if required.

Implementation target:

```ts
export function buildKnowledgeGraphSubgraph(graph: GraphView, options: {
  focusNodeId: string | null;
  expandedNodeIds: string[];
}): GraphView
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/services/knowledgeGraphSubgraph.test.ts src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

Expected: The service test can pass later in Task 2; the page test should remain red until the page is wired.

**Step 5: Commit**

```bash
git add src/services/knowledgeGraphSubgraph.test.ts src/features/knowledge-graph/KnowledgeGraphPage.test.tsx
git commit -m "test: define local subgraph behavior for 3d knowledge graph"
```

### Task 2: Implement The Local Subgraph Service

**Files:**
- Create: `src/services/knowledgeGraphSubgraph.ts`
- Modify: `src/services/knowledgeGraphSubgraph.test.ts`

**Step 1: Write the failing test**

Extend `src/services/knowledgeGraphSubgraph.test.ts` with a second test:

```ts
test('expands additional one-hop neighbors from explicitly expanded nodes', () => {
  const graph = buildKnowledgeGraphView(demoWorkspace);
  const subgraph = buildKnowledgeGraphSubgraph(graph, {
    focusNodeId: 'partner_boarder',
    expandedNodeIds: ['partner_distributor'],
  });

  expect(subgraph.nodes.some((node) => node.id === 'partner_logistics')).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/services/knowledgeGraphSubgraph.test.ts`

Expected: FAIL because expansion behavior is not implemented yet.

**Step 3: Write minimal implementation**

- Build a one-hop neighborhood from the focus node.
- Add one-hop neighborhoods for each expanded node.
- Keep only nodes and edges that belong to those neighborhoods.
- Return an empty graph when `focusNodeId` is `null` or absent from the candidate graph.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/services/knowledgeGraphSubgraph.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/services/knowledgeGraphSubgraph.ts src/services/knowledgeGraphSubgraph.test.ts
git commit -m "feat: derive local subgraphs for the 3d knowledge graph view"
```

### Task 3: Add Deterministic 3D Coordinate Mapping

**Files:**
- Create: `src/services/topology3DLayout.service.ts`
- Create: `src/services/topology3DLayout.service.test.ts`
- Modify: `src/services/topologyLayout.service.ts`

**Step 1: Write the failing test**

Create `src/services/topology3DLayout.service.test.ts`:

```ts
import { demoWorkspace } from '../data/demoWorkspace';
import { buildKnowledgeGraphView } from './knowledgeGraph.service';
import { buildKnowledgeGraphSubgraph } from './knowledgeGraphSubgraph';
import { buildTopologyLayout } from './topologyLayout.service';
import { buildTopology3DLayout } from './topology3DLayout.service';

test('maps the local graph into stable 3d coordinates', () => {
  const graph = buildKnowledgeGraphView(demoWorkspace);
  const subgraph = buildKnowledgeGraphSubgraph(graph, {
    focusNodeId: 'comp_cpu',
    expandedNodeIds: [],
  });
  const layout2d = buildTopologyLayout(subgraph, { sourceNodeId: 'comp_cpu' });
  const layout3d = buildTopology3DLayout(layout2d);

  expect(layout3d.nodes.every((node) => typeof node.z === 'number')).toBe(true);
  expect(layout3d.nodes.find((node) => node.id === 'comp_cpu')?.z).toBe(0);
  expect(layout3d.nodes.find((node) => node.id === 'partner_chipmaker')?.z).toBeGreaterThan(0);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/services/topology3DLayout.service.test.ts`

Expected: FAIL because the 3D layout service does not exist.

**Step 3: Write minimal implementation**

- Reuse stable `x / y` from the 2D topology layout.
- Add a deterministic `z` per node based on domain or layer.
- Keep the output pure and serializable.

Implementation target:

```ts
export type Topology3DNode = TopologyLayout['nodes'][number] & { z: number };
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/services/topology3DLayout.service.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/services/topology3DLayout.service.ts src/services/topology3DLayout.service.test.ts src/services/topologyLayout.service.ts
git commit -m "feat: add deterministic 3d layout mapping for knowledge graph"
```

### Task 4: Add Three.js Dependencies And A Failing 3D Scene Test

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/components/graph/TopologyScene3D.tsx`
- Create: `src/components/graph/TopologyScene3D.test.tsx`

**Step 1: Write the failing test**

Create `src/components/graph/TopologyScene3D.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import TopologyScene3D from './TopologyScene3D';

test('renders a 3d topology scene container with scene controls', () => {
  render(
    <TopologyScene3D
      layout={{ nodes: [], edges: [], width: 800, height: 600 }}
      selectedNodeId={null}
      onSelect={() => {}}
      onExpand={() => {}}
    />,
  );

  expect(screen.getByTestId('knowledge-graph-3d-scene')).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/components/graph/TopologyScene3D.test.tsx`

Expected: FAIL because the component and 3D dependencies do not exist.

**Step 3: Write minimal implementation**

Install dependencies:

```bash
npm install three @react-three/fiber @react-three/drei
```

Then add a placeholder `TopologyScene3D` component that mounts a scene container and exposes the target test id.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/components/graph/TopologyScene3D.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add package.json package-lock.json src/components/graph/TopologyScene3D.tsx src/components/graph/TopologyScene3D.test.tsx
git commit -m "feat: scaffold react-three-fiber scene for knowledge graph"
```

### Task 5: Implement Node Meshes, Edge Lines, And 3D Controls

**Files:**
- Create: `src/components/graph/NodeMesh.tsx`
- Create: `src/components/graph/EdgeLine3D.tsx`
- Modify: `src/components/graph/TopologyScene3D.tsx`
- Modify: `src/components/graph/TopologyScene3D.test.tsx`

**Step 1: Write the failing test**

Extend `src/components/graph/TopologyScene3D.test.tsx` with assertions for control buttons and interaction hooks:

```tsx
test('exposes reset-view and expand interaction hooks around the 3d scene', () => {
  render(/* scene props */);

  expect(screen.getByRole('button', { name: /重置视角/i })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/components/graph/TopologyScene3D.test.tsx`

Expected: FAIL because the 3D scene wrapper does not yet provide the UI affordances.

**Step 3: Write minimal implementation**

- Render a `Canvas` scene with lights and orbit controls.
- Render product nodes as box meshes and supplier nodes as sphere meshes.
- Render edges as colored lines.
- Expose `onSelect`, `onExpand`, and `onResetView` hooks through scene-adjacent controls.
- Keep labels minimal: selected, hovered, and focus nodes only.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/components/graph/TopologyScene3D.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/graph/NodeMesh.tsx src/components/graph/EdgeLine3D.tsx src/components/graph/TopologyScene3D.tsx src/components/graph/TopologyScene3D.test.tsx
git commit -m "feat: render interactive node and edge primitives in 3d scene"
```

### Task 6: Refactor The Knowledge Graph Page To Use Filtered Local 3D Subgraphs

**Files:**
- Modify: `src/features/knowledge-graph/KnowledgeGraphPage.tsx`
- Modify: `src/features/knowledge-graph/KnowledgeGraphCanvas.tsx`
- Modify: `src/features/knowledge-graph/KnowledgeGraphSidebar.tsx`
- Modify: `src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

**Step 1: Write the failing test**

Add or extend page tests to assert:

```tsx
test('renders a 3d local subgraph instead of the full filtered graph by default', () => {
  render(
    <WorkspaceProvider>
      <KnowledgeGraphPage />
    </WorkspaceProvider>,
  );

  expect(screen.getByTestId('knowledge-graph-3d-scene')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /展开一跳/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /收起到当前焦点/i })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

Expected: FAIL because the page still assumes the old full visible graph canvas.

**Step 3: Write minimal implementation**

- Keep relationship filters in the sidebar.
- Derive `visibleGraph` from filter state.
- Derive `focusNodeId` and `expandedNodeIds` in the page.
- Build `localSubgraph` from those values.
- Convert the local subgraph into 2D layout and then 3D layout.
- Replace the center panel with the new 3D scene container.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/features/knowledge-graph/KnowledgeGraphPage.tsx src/features/knowledge-graph/KnowledgeGraphCanvas.tsx src/features/knowledge-graph/KnowledgeGraphSidebar.tsx src/features/knowledge-graph/KnowledgeGraphPage.test.tsx
git commit -m "feat: switch knowledge graph page to a local 3d subgraph view"
```

### Task 7: Wire Expand-One-Hop, Collapse, And Focus Fallback Behavior

**Files:**
- Modify: `src/features/knowledge-graph/KnowledgeGraphPage.tsx`
- Modify: `src/services/knowledgeGraphSubgraph.ts`
- Modify: `src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

**Step 1: Write the failing test**

Add page tests:

```tsx
test('double-clicking a node expands one-hop neighbors', () => {
  // render page
  // double-click a visible node in the 3d scene wrapper
  // assert that the rendered local node count increases or that a known neighbor appears
});

test('falls back to the first visible node when the focus node is filtered out', () => {
  // toggle filters to exclude the current focus node
  // assert the detail panel retargets to a visible node
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

Expected: FAIL until expansion and fallback logic are wired.

**Step 3: Write minimal implementation**

- Track `expandedNodeIds` in page state.
- Double-click or explicit action should add the selected node to the expanded set.
- Collapse action should clear expanded nodes while keeping the focus node.
- If filters invalidate the current focus, fall back to the first visible node and clear invalid expansions.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/features/knowledge-graph/KnowledgeGraphPage.tsx src/services/knowledgeGraphSubgraph.ts src/features/knowledge-graph/KnowledgeGraphPage.test.tsx
git commit -m "feat: add progressive expansion and focus fallback to 3d knowledge graph"
```

### Task 8: Add Empty-State And WebGL-Failure Coverage

**Files:**
- Modify: `src/components/graph/TopologyScene3D.tsx`
- Modify: `src/components/graph/TopologyScene3D.test.tsx`
- Modify: `src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

**Step 1: Write the failing test**

Add tests for:

```tsx
test('shows an empty state when filters produce no visible nodes', () => {
  // disable all relationship filters
  // assert empty-state copy is visible
});

test('shows a 3d unavailable message when the scene cannot initialize', () => {
  // inject a scene failure condition or render fallback mode
  // assert fallback copy
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/components/graph/TopologyScene3D.test.tsx src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

Expected: FAIL until both fallback states exist.

**Step 3: Write minimal implementation**

- Render a scene-level empty state when the local subgraph is empty.
- Add a WebGL / scene init fallback boundary that displays a readable message.
- Keep the rest of the page interactive even when the 3D scene is unavailable.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/components/graph/TopologyScene3D.test.tsx src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/graph/TopologyScene3D.tsx src/components/graph/TopologyScene3D.test.tsx src/features/knowledge-graph/KnowledgeGraphPage.test.tsx
git commit -m "test: cover 3d scene empty and unavailable states"
```

### Task 9: Run Verification And Clean Up The Superseded 2D Path

**Files:**
- Modify: `src/components/graph/TopologyCanvas.tsx`
- Modify: `src/components/graph/TopologyCanvas.test.tsx`
- Optional Modify: `README.md`
- Optional Modify: `docs/feature-overview.md`
- Optional Modify: `docs/user-manual.md`

**Step 1: Treat verification failures as the failing state**

The failing state is any red test, type error, build failure, or obsolete 2D-only code path left behind after the 3D refactor.

**Step 2: Run verification**

Run: `npm test -- --run`

Expected: PASS

Run: `npm run build`

Expected: PASS

Run: `npm run lint`

Expected: PASS

**Step 3: Write minimal implementation**

- Remove or simplify superseded knowledge-graph-specific 2D code if no longer used.
- Update docs only if the 3D local-subgraph workflow needs explanation.

Suggested doc note:

```md
产品设计知识图谱现支持真 3D 主视图：
- 默认展示当前焦点节点的局部子图
- 支持关系筛选
- 支持逐步展开一跳邻居
```

**Step 4: Re-run verification**

Run: `npm test -- --run`

Expected: PASS

Run: `npm run build`

Expected: PASS

Run: `npm run lint`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/graph/TopologyCanvas.tsx src/components/graph/TopologyCanvas.test.tsx README.md docs/feature-overview.md docs/user-manual.md
git commit -m "docs: describe the 3d local-subgraph knowledge graph workflow"
```
