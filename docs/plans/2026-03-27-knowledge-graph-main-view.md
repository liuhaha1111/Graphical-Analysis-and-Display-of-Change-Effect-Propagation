# Knowledge Graph Main View Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the knowledge-graph page into a real topology canvas and make the propagation-analysis page use the same knowledge graph as its main visualization surface.

**Architecture:** Extend the existing graph service into a unified topology model, add a deterministic layout service that assigns stable layers and coordinates, then render both pages through one shared `TopologyCanvas` component with page-specific overlays and controls.

**Tech Stack:** React 19, TypeScript, Vitest, React Testing Library, existing Tailwind utility styling

---

> Note: the current workspace is not inside a git repository. Include commit steps in execution only if the project is later initialized as a git repo or moved into one.

### Task 1: Extend The Graph View Model For Main-Canvas Rendering

**Files:**
- Modify: `src/services/knowledgeGraph.service.ts`
- Modify: `src/services/knowledgeGraph.service.test.ts`
- Optional Modify: `src/domain/analysis.ts`

**Step 1: Write the failing test**

Add a test to `src/services/knowledgeGraph.service.test.ts` that asserts the graph view exposes enough metadata for a shared canvas:

```ts
test('buildKnowledgeGraphView returns typed nodes and edges for topology rendering', () => {
  const graph = buildKnowledgeGraphView(demoWorkspace);

  expect(graph.nodes.some((node) => node.kind === 'component')).toBe(true);
  expect(graph.nodes.some((node) => node.kind === 'supplier')).toBe(true);
  expect(graph.edges.some((edge) => edge.type === 'bom')).toBe(true);
  expect(graph.edges.some((edge) => edge.type === 'sourcing')).toBe(true);
  expect(graph.edges.some((edge) => edge.type === 'route')).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/services/knowledgeGraph.service.test.ts`

Expected: FAIL once you add assertions for any new metadata required by the canvas, such as `domain`, `riskProfile`, `hasSupplyMapping`, or display label normalization.

**Step 3: Write minimal implementation**

- Normalize graph node metadata for rendering.
- Ensure every node and edge carries stable, display-ready labels and typed domain information.
- Keep the output pure and deterministic.

Implementation target:

```ts
export type GraphNode = {
  id: string;
  name: string;
  kind: 'component' | 'supplier';
  domain: 'product' | 'supply';
};
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/services/knowledgeGraph.service.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/services/knowledgeGraph.service.ts src/services/knowledgeGraph.service.test.ts src/domain/analysis.ts
git commit -m "feat: enrich graph view metadata for shared topology canvas"
```

### Task 2: Add A Stable Topology Layout Service

**Files:**
- Create: `src/services/topologyLayout.service.ts`
- Create: `src/services/topologyLayout.service.test.ts`

**Step 1: Write the failing test**

Create `src/services/topologyLayout.service.test.ts`:

```ts
import { buildKnowledgeGraphView } from './knowledgeGraph.service';
import { buildTopologyLayout } from './topologyLayout.service';
import { demoWorkspace } from '../data/demoWorkspace';

test('buildTopologyLayout assigns stable layers and coordinates', () => {
  const graph = buildKnowledgeGraphView(demoWorkspace);
  const layout = buildTopologyLayout(graph, {
    sourceNodeId: 'comp_cpu',
  });

  expect(layout.nodes.every((node) => typeof node.x === 'number')).toBe(true);
  expect(layout.nodes.every((node) => typeof node.y === 'number')).toBe(true);
  expect(layout.nodes.some((node) => node.layer === 'source')).toBe(true);
  expect(layout.nodes.some((node) => node.layer === 'supply')).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/services/topologyLayout.service.test.ts`

Expected: FAIL because the layout service does not exist.

**Step 3: Write minimal implementation**

- Add a pure layout builder that maps graph nodes into stable layers.
- Use deterministic ordering by node kind, relation role, and id.
- Keep layout logic simple and explicit.

Implementation target:

```ts
export function buildTopologyLayout(graph: GraphView, options?: { sourceNodeId?: string }) {
  return {
    nodes: graph.nodes.map((node) => ({
      ...node,
      layer: resolveLayer(node, options),
      x: 0,
      y: 0,
    })),
    edges: graph.edges,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/services/topologyLayout.service.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/services/topologyLayout.service.ts src/services/topologyLayout.service.test.ts
git commit -m "feat: add deterministic topology layout service"
```

### Task 3: Build Shared Graph Rendering Components

**Files:**
- Create: `src/components/graph/TopologyCanvas.tsx`
- Create: `src/components/graph/GraphLegend.tsx`
- Create: `src/components/graph/GraphToolbar.tsx`
- Create: `src/components/graph/TopologyCanvas.test.tsx`

**Step 1: Write the failing test**

Create `src/components/graph/TopologyCanvas.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { buildKnowledgeGraphView } from '../../services/knowledgeGraph.service';
import { buildTopologyLayout } from '../../services/topologyLayout.service';
import { demoWorkspace } from '../../data/demoWorkspace';
import TopologyCanvas from './TopologyCanvas';

test('renders topology nodes and supports selection affordances', () => {
  const graph = buildKnowledgeGraphView(demoWorkspace);
  const layout = buildTopologyLayout(graph, { sourceNodeId: 'comp_cpu' });

  render(
    <TopologyCanvas
      layout={layout}
      selectedNodeId="comp_cpu"
      onSelect={() => {}}
      mode="explore"
    />,
  );

  expect(screen.getByRole('button', { name: /CPU Module/i })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/components/graph/TopologyCanvas.test.tsx`

Expected: FAIL because the shared graph components do not exist.

**Step 3: Write minimal implementation**

- Implement `TopologyCanvas` as the reusable graph surface.
- Render nodes and edges from layout data.
- Support node selection, aria labels, and visual modes.
- Add a small legend and toolbar for consistent controls.

Minimal API:

```tsx
type TopologyCanvasProps = {
  layout: TopologyLayout;
  selectedNodeId: string | null;
  onSelect: (nodeId: string) => void;
  mode: 'explore' | 'propagation';
  highlightedPathIds?: string[];
  impactedNodeIds?: string[];
};
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/components/graph/TopologyCanvas.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/graph/TopologyCanvas.tsx src/components/graph/GraphLegend.tsx src/components/graph/GraphToolbar.tsx src/components/graph/TopologyCanvas.test.tsx
git commit -m "feat: add shared topology canvas components"
```

### Task 4: Refactor The Knowledge Graph Page To Use The Shared Main View

**Files:**
- Modify: `src/features/knowledge-graph/KnowledgeGraphPage.tsx`
- Modify: `src/features/knowledge-graph/KnowledgeGraphCanvas.tsx`
- Modify: `src/features/knowledge-graph/KnowledgeGraphSidebar.tsx`
- Modify: `src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

**Step 1: Write the failing test**

Add a new page test in `src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`:

```tsx
test('renders topology canvas as the primary graph view', () => {
  render(
    <WorkspaceProvider>
      <KnowledgeGraphPage />
    </WorkspaceProvider>,
  );

  expect(screen.getByRole('region', { name: /topology canvas/i })).toBeInTheDocument();
  expect(screen.getByText(/节点总数/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

Expected: FAIL because the page still renders list-style panels rather than a main graph surface.

**Step 3: Write minimal implementation**

- Build the graph with `buildKnowledgeGraphView(state)`.
- Build layout with `buildTopologyLayout(graph)`.
- Use `TopologyCanvas` as the center panel.
- Keep `KnowledgeGraphSidebar` for filters and node list.
- Preserve node detail rendering on the right side.

Implementation sketch:

```tsx
const graph = buildKnowledgeGraphView(state);
const layout = buildTopologyLayout(graph, { sourceNodeId: selectedNodeId ?? undefined });
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/features/knowledge-graph/KnowledgeGraphPage.tsx src/features/knowledge-graph/KnowledgeGraphCanvas.tsx src/features/knowledge-graph/KnowledgeGraphSidebar.tsx src/features/knowledge-graph/KnowledgeGraphPage.test.tsx
git commit -m "feat: convert knowledge graph page into topology main view"
```

### Task 5: Refactor Propagation Canvas Into A Graph-First Analysis Surface

**Files:**
- Modify: `src/features/propagation-analysis/PropagationCanvas.tsx`
- Modify: `src/features/propagation-analysis/PropagationAnalysisPage.tsx`
- Modify: `src/features/propagation-analysis/ImpactDetailList.tsx`
- Modify: `src/features/propagation-analysis/ImpactSummary.tsx`
- Modify: `src/features/propagation-analysis/PropagationAnalysisPage.test.tsx`

**Step 1: Write the failing test**

Add a test to `src/features/propagation-analysis/PropagationAnalysisPage.test.tsx`:

```tsx
test('uses the shared knowledge graph as the main propagation view after analysis', () => {
  render(
    <WorkspaceProvider>
      <PropagationAnalysisPage />
    </WorkspaceProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: /执行传播分析/i }));

  expect(screen.getByRole('region', { name: /propagation topology/i })).toBeInTheDocument();
  expect(screen.getByText(/综合影响评分/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/propagation-analysis/PropagationAnalysisPage.test.tsx`

Expected: FAIL because the current page still treats the center panel as a path list rather than a graph-first view.

**Step 3: Write minimal implementation**

- Build graph and layout from shared workspace data.
- Map `analysis.propagationPaths` into highlight sets for nodes and edges.
- Pass highlight state into `TopologyCanvas`.
- Keep path cards in the right panel as navigation, not as the main view.
- Default to highest-risk path after analysis if no explicit path is selected.

Implementation sketch:

```tsx
const graph = buildKnowledgeGraphView(state);
const layout = buildTopologyLayout(graph, {
  sourceNodeId: state.changeScenario.sourceComponentId,
});

const highlighted = derivePropagationOverlay(state.analysis, selectedPathId);
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/features/propagation-analysis/PropagationAnalysisPage.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/features/propagation-analysis/PropagationCanvas.tsx src/features/propagation-analysis/PropagationAnalysisPage.tsx src/features/propagation-analysis/ImpactDetailList.tsx src/features/propagation-analysis/ImpactSummary.tsx src/features/propagation-analysis/PropagationAnalysisPage.test.tsx
git commit -m "feat: make propagation analysis graph-first"
```

### Task 6: Add Overlay Mapping For Impact Heat And Path Highlight

**Files:**
- Create or Modify: `src/store/workspaceSelectors.ts`
- Create: `src/services/propagationOverlay.service.ts`
- Create: `src/services/propagationOverlay.service.test.ts`

**Step 1: Write the failing test**

Create `src/services/propagationOverlay.service.test.ts`:

```ts
import { analyzePropagation } from './propagationAnalysis.service';
import { buildPropagationOverlay } from './propagationOverlay.service';
import { demoWorkspace } from '../data/demoWorkspace';

test('buildPropagationOverlay maps analysis results to node and edge highlight state', () => {
  const analysis = analyzePropagation(demoWorkspace, demoWorkspace.changeScenario);
  const overlay = buildPropagationOverlay(analysis, analysis.propagationPaths[0]?.id ?? null);

  expect(overlay.impactedNodeIds.length).toBeGreaterThan(0);
  expect(overlay.highlightedEdgeIds.length).toBeGreaterThan(0);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/services/propagationOverlay.service.test.ts`

Expected: FAIL because the overlay mapping service does not exist.

**Step 3: Write minimal implementation**

- Convert path stages into reusable node and edge highlight sets.
- Return stable arrays or sets for:
  - impacted nodes
  - highlighted path nodes
  - highlighted edges
  - max impact value per node if needed for heat mapping

Implementation target:

```ts
export function buildPropagationOverlay(
  analysis: PropagationAnalysisResult | null,
  selectedPathId: string | null,
) {
  return {
    impactedNodeIds: [],
    highlightedNodeIds: [],
    highlightedEdgeIds: [],
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/services/propagationOverlay.service.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/store/workspaceSelectors.ts src/services/propagationOverlay.service.ts src/services/propagationOverlay.service.test.ts
git commit -m "feat: add propagation overlay mapping for graph highlights"
```

### Task 7: Verify Empty States, Filters, And Accessibility Hooks

**Files:**
- Modify: `src/components/graph/TopologyCanvas.tsx`
- Modify: `src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`
- Modify: `src/features/propagation-analysis/PropagationAnalysisPage.test.tsx`

**Step 1: Write the failing test**

Add targeted tests:

```tsx
test('shows an empty state when graph filters hide all nodes', () => {
  // render page with a filter combination that removes all nodes
  // assert empty-state message and reset action
});

test('shows waiting state before propagation analysis runs', () => {
  render(
    <WorkspaceProvider>
      <PropagationAnalysisPage />
    </WorkspaceProvider>,
  );

  expect(screen.getByText(/等待执行分析/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/knowledge-graph/KnowledgeGraphPage.test.tsx src/features/propagation-analysis/PropagationAnalysisPage.test.tsx`

Expected: FAIL until the new empty-state and waiting-state behavior exists.

**Step 3: Write minimal implementation**

- Add empty-state overlays for filtered-out graphs.
- Add waiting-state messaging in the propagation main view before analysis.
- Make sure the canvas region exposes stable accessible labels for test selection.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/features/knowledge-graph/KnowledgeGraphPage.test.tsx src/features/propagation-analysis/PropagationAnalysisPage.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/graph/TopologyCanvas.tsx src/features/knowledge-graph/KnowledgeGraphPage.test.tsx src/features/propagation-analysis/PropagationAnalysisPage.test.tsx
git commit -m "test: cover graph empty states and waiting states"
```

### Task 8: Run Full Verification

**Files:**
- Optional Modify: `README.md`

**Step 1: Treat incomplete verification as the failing state**

No new unit test is required here. The failing state is any red test, type error, or broken build after the refactor.

**Step 2: Run verification**

Run: `npm test -- --run`

Expected: PASS

Run: `npm run lint`

Expected: PASS

Run: `npm run build`

Expected: PASS

**Step 3: Write minimal implementation**

- Fix any failing tests or type errors.
- Update `README.md` only if the graph-first workflow needs documenting.

Suggested README note:

```md
## Visualization Modes

- 产品设计知识图谱：全局拓扑探索
- 变更效应传播可视化：传播结果叠加在同一知识图谱上
```

**Step 4: Re-run verification**

Run: `npm test -- --run`

Expected: PASS

Run: `npm run lint`

Expected: PASS

Run: `npm run build`

Expected: PASS

**Step 5: Commit**

```bash
git add README.md
git commit -m "docs: describe graph-first visualization workflow"
```
