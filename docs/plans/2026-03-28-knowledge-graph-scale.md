# Knowledge Graph Scale Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand the knowledge graph to 3012 real entities, replace the legacy edge model with five business relationship types, and add relationship-type filtering that drives the actual graph view.

**Architecture:** Keep `WorkspaceModel` as the single source of truth, generate deterministic large-scale demo data inside `src/data/demoWorkspace.ts`, derive a five-type graph in `src/services/knowledgeGraph.service.ts`, then filter and render that graph through the existing knowledge-graph page with a denser canvas mode for scale.

**Tech Stack:** React 19, TypeScript, Vitest, React Testing Library, Tailwind CSS, existing workspace store and graph services

---

### Task 1: Replace Legacy Demo Graph Data With A Deterministic 3012-Entity Workspace

**Files:**
- Modify: `src/data/demoWorkspace.ts`
- Modify: `src/domain/workspace.ts`
- Test: `src/services/knowledgeGraph.service.test.ts`

**Step 1: Write the failing test**

Add or update a service test in `src/services/knowledgeGraph.service.test.ts`:

```ts
test('buildKnowledgeGraphView exposes 3012 real entities from the shared workspace', () => {
  const graph = buildKnowledgeGraphView(demoWorkspace);

  expect(graph.nodes).toHaveLength(3012);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/services/knowledgeGraph.service.test.ts`

Expected: FAIL because the current demo workspace only creates a small sample graph.

**Step 3: Write minimal implementation**

- Expand `src/data/demoWorkspace.ts` from hand-written sample records to deterministic generator functions.
- Keep the workspace shape stable, but generate:
  - `2412` product nodes
  - `600` supplier nodes
- Preserve meaningful product categories and supplier roles.
- Do not add random data generation.

Implementation target:

```ts
const PRODUCT_NODE_COUNT = 2412;
const SUPPLIER_NODE_COUNT = 600;
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/services/knowledgeGraph.service.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/data/demoWorkspace.ts src/domain/workspace.ts src/services/knowledgeGraph.service.test.ts
git commit -m "feat: generate deterministic 3012-entity knowledge graph workspace"
```

### Task 2: Upgrade The Graph Service To The New Five-Relationship Model

**Files:**
- Modify: `src/services/knowledgeGraph.service.ts`
- Modify: `src/services/knowledgeGraph.service.test.ts`

**Step 1: Write the failing test**

Extend `src/services/knowledgeGraph.service.test.ts`:

```ts
test('buildKnowledgeGraphView exposes all five relationship types with correct directions', () => {
  const graph = buildKnowledgeGraphView(demoWorkspace);

  expect(graph.edges.some((edge) => edge.type === 'assembly')).toBe(true);
  expect(graph.edges.some((edge) => edge.type === 'configuration')).toBe(true);
  expect(graph.edges.some((edge) => edge.type === 'supply')).toBe(true);
  expect(graph.edges.some((edge) => edge.type === 'service')).toBe(true);
  expect(graph.edges.some((edge) => edge.type === 'transaction')).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/services/knowledgeGraph.service.test.ts`

Expected: FAIL because the current graph service only emits `bom`, `sourcing`, and `route`.

**Step 3: Write minimal implementation**

- Replace legacy edge unions with five explicit edge types:
  - `assembly`
  - `configuration`
  - `supply`
  - `service`
  - `transaction`
- Keep node typing stable.
- Ensure edge direction matches the business definition exactly.

Implementation target:

```ts
export type GraphEdge =
  | AssemblyEdge
  | ConfigurationEdge
  | SupplyEdge
  | ServiceEdge
  | TransactionEdge;
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/services/knowledgeGraph.service.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/services/knowledgeGraph.service.ts src/services/knowledgeGraph.service.test.ts
git commit -m "feat: adopt five relationship types in knowledge graph service"
```

### Task 3: Add A Filtering Layer For Visible Edges And Nodes

**Files:**
- Create: `src/services/knowledgeGraphFilters.ts`
- Create: `src/services/knowledgeGraphFilters.test.ts`
- Modify: `src/services/knowledgeGraph.service.ts`

**Step 1: Write the failing test**

Create `src/services/knowledgeGraphFilters.test.ts`:

```ts
import { demoWorkspace } from '../data/demoWorkspace';
import { buildKnowledgeGraphView } from './knowledgeGraph.service';
import { filterKnowledgeGraphByRelationTypes } from './knowledgeGraphFilters';

test('filters visible graph by selected relationship types', () => {
  const graph = buildKnowledgeGraphView(demoWorkspace);
  const filtered = filterKnowledgeGraphByRelationTypes(graph, ['transaction']);

  expect(filtered.edges.every((edge) => edge.type === 'transaction')).toBe(true);
  expect(filtered.nodes.every((node) => node.kind === 'supplier')).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/services/knowledgeGraphFilters.test.ts`

Expected: FAIL because the filtering service does not exist.

**Step 3: Write minimal implementation**

- Create a pure filter function that:
  - keeps edges whose `type` is selected
  - keeps only nodes referenced by remaining edges
- Return a valid `GraphView`.
- Treat an empty relation-type selection as an empty visible graph.

Implementation target:

```ts
export function filterKnowledgeGraphByRelationTypes(
  graph: GraphView,
  relationTypes: GraphEdge['type'][],
): GraphView
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/services/knowledgeGraphFilters.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/services/knowledgeGraphFilters.ts src/services/knowledgeGraphFilters.test.ts src/services/knowledgeGraph.service.ts
git commit -m "feat: add visible graph filtering by relationship type"
```

### Task 4: Update Sidebar Metrics And Add Five-Type Relationship Filters

**Files:**
- Modify: `src/features/knowledge-graph/KnowledgeGraphSidebar.tsx`
- Modify: `src/features/knowledge-graph/KnowledgeGraphPage.tsx`
- Modify: `src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

**Step 1: Write the failing test**

Add page tests:

```tsx
test('shows 3012 entities and exposes five relationship filters', () => {
  render(
    <WorkspaceProvider>
      <KnowledgeGraphPage />
    </WorkspaceProvider>,
  );

  expect(screen.getByText('3012')).toBeInTheDocument();
  expect(screen.getByLabelText(/装配关系/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/配置关系/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/供应关系/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/配置服务/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/交易关系/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

Expected: FAIL because the page does not yet show the new scale or filter controls.

**Step 3: Write minimal implementation**

- Add page state for selected relation types.
- Pass full graph counts and filtered graph counts into the sidebar.
- Render five default-on filter controls.
- Show:
  - entity total as `3012`
  - relationship count as `visible / total`

Implementation target:

```tsx
const [visibleRelationTypes, setVisibleRelationTypes] = useState<GraphEdge['type'][]>([
  'assembly',
  'configuration',
  'supply',
  'service',
  'transaction',
]);
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/features/knowledge-graph/KnowledgeGraphSidebar.tsx src/features/knowledge-graph/KnowledgeGraphPage.tsx src/features/knowledge-graph/KnowledgeGraphPage.test.tsx
git commit -m "feat: add five-type relationship filters to knowledge graph page"
```

### Task 5: Make Selection And Detail State Respect Filtered Visibility

**Files:**
- Modify: `src/features/knowledge-graph/KnowledgeGraphPage.tsx`
- Modify: `src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

**Step 1: Write the failing test**

Add a page test:

```tsx
test('falls back to the first visible node when the current selection is filtered out', () => {
  render(
    <WorkspaceProvider>
      <KnowledgeGraphPage />
    </WorkspaceProvider>,
  );

  // select a product node that disappears when only transaction is enabled
  // toggle filters to leave only transaction visible
  // assert the detail panel now shows a visible supplier node instead
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

Expected: FAIL because the current selection logic still assumes the unfiltered graph.

**Step 3: Write minimal implementation**

- Resolve selection against the filtered graph instead of the full graph.
- If the current selection is not visible, fall back to the first visible node.
- If no visible nodes remain, render an explicit no-selection state.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/features/knowledge-graph/KnowledgeGraphPage.tsx src/features/knowledge-graph/KnowledgeGraphPage.test.tsx
git commit -m "feat: keep knowledge graph selection aligned with filters"
```

### Task 6: Adapt The Topology Layout And Canvas For Large-Scale Rendering

**Files:**
- Modify: `src/services/topologyLayout.service.ts`
- Modify: `src/components/graph/TopologyCanvas.tsx`
- Modify: `src/components/graph/TopologyCanvas.test.tsx`
- Modify: `src/features/knowledge-graph/KnowledgeGraphCanvas.tsx`

**Step 1: Write the failing test**

Add a canvas test:

```tsx
test('renders a dense knowledge graph mode without requiring full labels on every node', () => {
  // render the canvas with a large filtered layout
  // assert nodes remain clickable and the canvas still exposes a region label
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/components/graph/TopologyCanvas.test.tsx`

Expected: FAIL once the test expects dense rendering behavior not supported by the current large-card node style.

**Step 3: Write minimal implementation**

- Keep the stable layer-based layout.
- Add a denser node rendering mode for the knowledge graph page.
- Shrink node footprint and reduce always-visible labels.
- Recolor edges for the five new relationship types.

Implementation target:

```tsx
type TopologyCanvasProps = {
  ...
  density?: 'default' | 'dense';
};
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/components/graph/TopologyCanvas.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/services/topologyLayout.service.ts src/components/graph/TopologyCanvas.tsx src/components/graph/TopologyCanvas.test.tsx src/features/knowledge-graph/KnowledgeGraphCanvas.tsx
git commit -m "feat: add dense canvas rendering for large knowledge graphs"
```

### Task 7: Cover Empty Filter Results And Count Synchronization

**Files:**
- Modify: `src/features/knowledge-graph/KnowledgeGraphPage.tsx`
- Modify: `src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`
- Optional Modify: `src/components/graph/TopologyCanvas.tsx`

**Step 1: Write the failing test**

Add page tests:

```tsx
test('shows an empty state when all relationship filters are disabled', () => {
  render(
    <WorkspaceProvider>
      <KnowledgeGraphPage />
    </WorkspaceProvider>,
  );

  // disable all five filters
  // assert empty-state copy is shown
});

test('shows visible and total relationship counts together', () => {
  render(
    <WorkspaceProvider>
      <KnowledgeGraphPage />
    </WorkspaceProvider>,
  );

  expect(screen.getByText(/\d+\s*\/\s*\d+/)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

Expected: FAIL because the page does not yet render the empty filter state or split relationship counts.

**Step 3: Write minimal implementation**

- Render an empty-state message when no visible nodes remain.
- Show visible and total relationship counts together.
- Keep the filter controls mounted in the empty state.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/features/knowledge-graph/KnowledgeGraphPage.tsx src/features/knowledge-graph/KnowledgeGraphPage.test.tsx src/components/graph/TopologyCanvas.tsx
git commit -m "test: cover empty filter results and relationship counts"
```

### Task 8: Run Full Verification And Update Supporting Docs If Needed

**Files:**
- Optional Modify: `README.md`
- Optional Modify: `docs/feature-overview.md`
- Optional Modify: `docs/user-manual.md`

**Step 1: Treat incomplete verification as the failing state**

No new unit test is required here. The failing state is any red test, type error, or broken build after the graph refactor.

**Step 2: Run verification**

Run: `npm test -- --run`

Expected: PASS

Run: `npm run build`

Expected: PASS

**Step 3: Write minimal implementation**

- Fix any remaining failures.
- Update docs only if the new five-type relationship filters or 3012-entity scale need explicit user-facing explanation.

Suggested doc note:

```md
产品设计知识图谱支持 3012 个真实实体和五类关系筛选：
- 装配关系
- 配置关系
- 供应关系
- 配置服务
- 交易关系
```

**Step 4: Re-run verification**

Run: `npm test -- --run`

Expected: PASS

Run: `npm run build`

Expected: PASS

**Step 5: Commit**

```bash
git add README.md docs/feature-overview.md docs/user-manual.md
git commit -m "docs: describe scaled knowledge graph and relationship filters"
```
