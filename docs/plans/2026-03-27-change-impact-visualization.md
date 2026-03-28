# Change Impact Visualization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the frontend into a stable prototype where product modeling, supply-chain knowledge graph, and change propagation analysis share one domain model and produce deterministic impact results.

**Architecture:** Replace the current page-local demo states with a single `WorkspaceModel`, derive all graph/tree views through pure services, and keep change propagation analysis in a testable service layer. UI pages become thin feature views over shared state and derived selectors.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Vitest, React Testing Library

---

> Note: the current workspace snapshot is not inside a git repository. Commit steps below assume the project is later moved into a git-tracked workspace or initialized as one.

### Task 1: Set Up Test Harness And Clean App Entry

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Modify: `vite.config.ts`
- Modify: `src/App.tsx`
- Create: `src/test/setup.ts`
- Create: `src/App.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders three module tabs', () => {
  render(<App />);

  expect(screen.getByRole('button', { name: '产品结构建模' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '产品设计知识图谱' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '变更效应传播可视化' })).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/App.test.tsx`

Expected: FAIL because there is no configured test runner and the current `App.tsx` content is corrupted.

**Step 3: Write minimal implementation**

- Add scripts:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

- Add basic Vitest config in `vite.config.ts`:

```ts
test: {
  environment: 'jsdom',
  setupFiles: './src/test/setup.ts',
}
```

- Add setup file:

```ts
import '@testing-library/jest-dom';
```

- Replace `src/App.tsx` with a minimal clean shell that renders the three tabs using UTF-8-safe strings.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/App.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add package.json tsconfig.json vite.config.ts src/App.tsx src/test/setup.ts src/App.test.tsx
git commit -m "test: add frontend test harness and clean app shell"
```

### Task 2: Define Shared Domain Types And Demo Workspace

**Files:**
- Delete: `src/types.ts`
- Create: `src/domain/workspace.ts`
- Create: `src/domain/analysis.ts`
- Create: `src/data/demoWorkspace.ts`
- Create: `src/store/workspaceStore.tsx`
- Create: `src/store/workspaceStore.test.tsx`

**Step 1: Write the failing test**

```tsx
import { renderHook } from '@testing-library/react';
import { WorkspaceProvider, useWorkspace } from './workspaceStore';

test('provides a shared workspace seeded from demo data', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <WorkspaceProvider>{children}</WorkspaceProvider>
  );

  const { result } = renderHook(() => useWorkspace(), { wrapper });

  expect(result.current.state.product.components.length).toBeGreaterThan(0);
  expect(result.current.state.supplyChain.partners.length).toBeGreaterThan(0);
  expect(result.current.state.analysis).toBeNull();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/store/workspaceStore.test.tsx`

Expected: FAIL because the store and domain model do not exist.

**Step 3: Write minimal implementation**

- Define types in `src/domain/workspace.ts`:

```ts
export type WorkspaceModel = {
  product: ProductDomain;
  supplyChain: SupplyChainDomain;
  changeScenario: ChangeScenario;
  analysis: PropagationAnalysisResult | null;
};
```

- Seed `src/data/demoWorkspace.ts` with one laptop-style product tree, component parameters, parameter links, supplier nodes, and routing edges.
- Implement `WorkspaceProvider` with `useReducer` or `useState`.

```tsx
const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<WorkspaceModel>(demoWorkspace);
  return <WorkspaceContext.Provider value={{ state, setState }}>{children}</WorkspaceContext.Provider>;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/store/workspaceStore.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/domain/workspace.ts src/domain/analysis.ts src/data/demoWorkspace.ts src/store/workspaceStore.tsx src/store/workspaceStore.test.tsx
git commit -m "feat: add shared workspace domain and store"
```

### Task 3: Add Selectors For Product Tree And Knowledge Graph Views

**Files:**
- Create: `src/store/workspaceSelectors.ts`
- Create: `src/services/productModel.service.ts`
- Create: `src/services/knowledgeGraph.service.ts`
- Create: `src/services/productModel.service.test.ts`
- Create: `src/services/knowledgeGraph.service.test.ts`

**Step 1: Write the failing test**

```ts
import { buildProductTree } from './productModel.service';
import { buildKnowledgeGraphView } from './knowledgeGraph.service';
import { demoWorkspace } from '../data/demoWorkspace';

test('buildProductTree nests components by bom edges', () => {
  const tree = buildProductTree(demoWorkspace.product);
  expect(tree[0].children.map((child) => child.name)).toContain('主板总成');
});

test('buildKnowledgeGraphView joins components and supply partners', () => {
  const graph = buildKnowledgeGraphView(demoWorkspace);
  expect(graph.nodes.some((node) => node.kind === 'component')).toBe(true);
  expect(graph.nodes.some((node) => node.kind === 'supplier')).toBe(true);
  expect(graph.edges.some((edge) => edge.type === 'sourcing')).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/services/productModel.service.test.ts src/services/knowledgeGraph.service.test.ts`

Expected: FAIL because the selector services do not exist.

**Step 3: Write minimal implementation**

`src/services/productModel.service.ts`

```ts
export function buildProductTree(product: ProductDomain): ProductTreeNode[] {
  const byParent = new Map<string | null, ProductTreeNode[]>();
  for (const component of product.components) {
    byParent.set(component.parentId, [...(byParent.get(component.parentId) ?? []), { ...component, children: [] }]);
  }

  const attach = (parentId: string | null): ProductTreeNode[] =>
    (byParent.get(parentId) ?? []).map((node) => ({ ...node, children: attach(node.id) }));

  return attach(null);
}
```

`src/services/knowledgeGraph.service.ts`

```ts
export function buildKnowledgeGraphView(workspace: WorkspaceModel): GraphView {
  return {
    nodes: [...componentNodes, ...partnerNodes],
    edges: [...bomEdges, ...sourcingEdges, ...routeEdges],
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/services/productModel.service.test.ts src/services/knowledgeGraph.service.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/store/workspaceSelectors.ts src/services/productModel.service.ts src/services/knowledgeGraph.service.ts src/services/productModel.service.test.ts src/services/knowledgeGraph.service.test.ts
git commit -m "feat: add shared tree and graph selectors"
```

### Task 4: Implement Deterministic Propagation Analysis Service

**Files:**
- Create: `src/services/propagationAnalysis.service.ts`
- Create: `src/services/propagationAnalysis.service.test.ts`
- Modify: `src/domain/analysis.ts`

**Step 1: Write the failing test**

```ts
import { analyzePropagation } from './propagationAnalysis.service';
import { demoWorkspace } from '../data/demoWorkspace';

test('analyzePropagation returns affected nodes, paths, and score', () => {
  const result = analyzePropagation(demoWorkspace, {
    sourceComponentId: 'comp_cpu',
    sourceParameterId: 'param_cpu_frequency',
    changeType: 'spec-change',
    changeMagnitude: 'high',
  });

  expect(result.affectedNodeCount).toBeGreaterThan(1);
  expect(result.propagationPaths.length).toBeGreaterThan(0);
  expect(result.overallScore).toBeGreaterThan(0);
  expect(result.riskLevel).toMatch(/低|中|高|极高/);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/services/propagationAnalysis.service.test.ts`

Expected: FAIL because the analysis service does not exist.

**Step 3: Write minimal implementation**

```ts
export function analyzePropagation(
  workspace: WorkspaceModel,
  scenario: ChangeScenario,
): PropagationAnalysisResult {
  const queue = [{ nodeId: scenario.sourceComponentId, impact: magnitudeToFactor(scenario.changeMagnitude) * 100, depth: 0 }];
  const visited = new Map<string, number>();
  const paths: PropagationPath[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if ((visited.get(current.nodeId) ?? 0) >= current.impact) continue;
    visited.set(current.nodeId, current.impact);
    // enqueue linked product nodes and supply-chain nodes with weighted impact
  }

  return buildResultFromVisited(visited, paths, workspace);
}
```

Include:

- relation weights
- magnitude factor mapping
- cost risk aggregation
- schedule risk aggregation
- `riskLevel` segmentation

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/services/propagationAnalysis.service.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add src/domain/analysis.ts src/services/propagationAnalysis.service.ts src/services/propagationAnalysis.service.test.ts
git commit -m "feat: add deterministic propagation analysis service"
```

### Task 5: Rebuild The Product Modeling Page On Shared State

**Files:**
- Delete: `src/components/ProductModeling.tsx`
- Create: `src/features/product-modeling/ProductModelingPage.tsx`
- Create: `src/features/product-modeling/BomTreePanel.tsx`
- Create: `src/features/product-modeling/ParameterPanel.tsx`
- Create: `src/features/product-modeling/DependencyPanel.tsx`
- Create: `src/features/product-modeling/ProductModelingPage.test.tsx`
- Create: `src/components/ui/PanelCard.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { WorkspaceProvider } from '../../store/workspaceStore';
import ProductModelingPage from './ProductModelingPage';

test('renders product tree and parameter dependency panels from shared state', () => {
  render(
    <WorkspaceProvider>
      <ProductModelingPage />
    </WorkspaceProvider>,
  );

  expect(screen.getByText('产品结构树')).toBeInTheDocument();
  expect(screen.getByText('参数依赖关系')).toBeInTheDocument();
  expect(screen.getByText('变更约束摘要')).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/product-modeling/ProductModelingPage.test.tsx`

Expected: FAIL because the page and panel components do not exist.

**Step 3: Write minimal implementation**

- Replace prompt-based editing with controlled panel forms.
- Read all data through `useWorkspace()` and `workspaceSelectors`.
- Start with read-only rendering if needed, then add minimal edit handlers:

```tsx
const tree = useMemo(() => buildProductTree(state.product), [state.product]);

return (
  <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr]">
    <BomTreePanel tree={tree} selectedId={selectedId} onSelect={setSelectedId} />
    <ParameterPanel component={selectedComponent} />
    <DependencyPanel dependencies={dependenciesForComponent} />
  </div>
);
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/features/product-modeling/ProductModelingPage.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/ui/PanelCard.tsx src/features/product-modeling/ProductModelingPage.tsx src/features/product-modeling/BomTreePanel.tsx src/features/product-modeling/ParameterPanel.tsx src/features/product-modeling/DependencyPanel.tsx src/features/product-modeling/ProductModelingPage.test.tsx
git commit -m "feat: rebuild product modeling page on shared workspace"
```

### Task 6: Rebuild The Knowledge Graph Page From Shared Selectors

**Files:**
- Delete: `src/components/KnowledgeGraph.tsx`
- Create: `src/features/knowledge-graph/KnowledgeGraphPage.tsx`
- Create: `src/features/knowledge-graph/KnowledgeGraphCanvas.tsx`
- Create: `src/features/knowledge-graph/KnowledgeGraphSidebar.tsx`
- Create: `src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`
- Create: `src/components/ui/MetricCard.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { WorkspaceProvider } from '../../store/workspaceStore';
import KnowledgeGraphPage from './KnowledgeGraphPage';

test('renders shared product-supply graph metrics', () => {
  render(
    <WorkspaceProvider>
      <KnowledgeGraphPage />
    </WorkspaceProvider>,
  );

  expect(screen.getByText('产品-供应链网络')).toBeInTheDocument();
  expect(screen.getByText('节点总数')).toBeInTheDocument();
  expect(screen.getByText('关系总数')).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

Expected: FAIL because the new page components do not exist.

**Step 3: Write minimal implementation**

- Use `buildKnowledgeGraphView(workspace)` to derive nodes and edges.
- Keep canvas rendering as a thin view layer.
- Ensure the page does not define its own product node dataset.

```tsx
const graph = buildKnowledgeGraphView(state);

return (
  <div className="grid gap-4 lg:grid-cols-[320px_1fr_320px]">
    <KnowledgeGraphSidebar graph={graph} />
    <KnowledgeGraphCanvas graph={graph} />
    <NodeDetailPanel selectedNode={selectedNode} />
  </div>
);
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/ui/MetricCard.tsx src/features/knowledge-graph/KnowledgeGraphPage.tsx src/features/knowledge-graph/KnowledgeGraphCanvas.tsx src/features/knowledge-graph/KnowledgeGraphSidebar.tsx src/features/knowledge-graph/KnowledgeGraphPage.test.tsx
git commit -m "feat: rebuild knowledge graph page from shared state"
```

### Task 7: Rebuild The Propagation Analysis Page With Deterministic Results

**Files:**
- Delete: `src/components/PropagationSimulation.tsx`
- Create: `src/features/propagation-analysis/PropagationAnalysisPage.tsx`
- Create: `src/features/propagation-analysis/ScenarioForm.tsx`
- Create: `src/features/propagation-analysis/PropagationCanvas.tsx`
- Create: `src/features/propagation-analysis/ImpactSummary.tsx`
- Create: `src/features/propagation-analysis/ImpactDetailList.tsx`
- Create: `src/features/propagation-analysis/PropagationAnalysisPage.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkspaceProvider } from '../../store/workspaceStore';
import PropagationAnalysisPage from './PropagationAnalysisPage';

test('runs analysis and shows deterministic impact metrics', async () => {
  const user = userEvent.setup();
  render(
    <WorkspaceProvider>
      <PropagationAnalysisPage />
    </WorkspaceProvider>,
  );

  await user.click(screen.getByRole('button', { name: '执行传播分析' }));

  expect(screen.getByText('受影响节点数')).toBeInTheDocument();
  expect(screen.getByText('综合影响评分')).toBeInTheDocument();
  expect(screen.getByText('成本风险')).toBeInTheDocument();
  expect(screen.getByText('工期风险')).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/propagation-analysis/PropagationAnalysisPage.test.tsx`

Expected: FAIL because the page and analysis wiring do not exist.

**Step 3: Write minimal implementation**

- Build a form that updates `changeScenario`.
- Call `analyzePropagation(state, scenario)` on submit.
- Render metric cards and impacted node list from `state.analysis`.

```tsx
function handleAnalyze() {
  const result = analyzePropagation(state, state.changeScenario);
  setState((prev) => ({ ...prev, analysis: result }));
}
```

- Keep any playback controls optional and derived from `analysis.propagationPaths`, not from random simulation state.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/features/propagation-analysis/PropagationAnalysisPage.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/features/propagation-analysis/PropagationAnalysisPage.tsx src/features/propagation-analysis/ScenarioForm.tsx src/features/propagation-analysis/PropagationCanvas.tsx src/features/propagation-analysis/ImpactSummary.tsx src/features/propagation-analysis/ImpactDetailList.tsx src/features/propagation-analysis/PropagationAnalysisPage.test.tsx
git commit -m "feat: rebuild propagation analysis page with shared model"
```

### Task 8: Wire Final Navigation And Remove Broken Legacy Code

**Files:**
- Modify: `src/App.tsx`
- Create: `src/app/AppShell.tsx`
- Delete: `src/components`
- Modify: `src/index.css`

**Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

test('switches between the three shared-model pages', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: '产品设计知识图谱' }));
  expect(screen.getByText('产品-供应链网络')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '变更效应传播可视化' }));
  expect(screen.getByText('执行传播分析')).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/App.test.tsx`

Expected: FAIL because the app is not yet wired to the new feature pages.

**Step 3: Write minimal implementation**

- Move page-switching shell to `src/app/AppShell.tsx`.
- Wrap the app with `WorkspaceProvider`.
- Remove or delete unused corrupted legacy files under `src/components`.
- Update `src/index.css` only as needed for app shell layout and shared tokens.

```tsx
export default function App() {
  return (
    <WorkspaceProvider>
      <AppShell />
    </WorkspaceProvider>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/App.test.tsx`

Expected: PASS

**Step 5: Commit**

```bash
git add src/App.tsx src/app/AppShell.tsx src/index.css
git add -A src/components
git commit -m "refactor: wire shared-model app shell and remove legacy pages"
```

### Task 9: Run Full Verification

**Files:**
- Modify: `README.md`

**Step 1: Write the failing test**

This task is verification-only. No new failing unit test is required. Instead, treat missing documentation and failing project checks as the failing state.

**Step 2: Run verification to confirm the current state fails or is incomplete**

Run: `npm test -- --run`

Expected: PASS for all tests

Run: `npm run lint`

Expected: PASS

Run: `npm run build`

Expected: PASS

If any command fails, fix the code or config before continuing.

**Step 3: Write minimal implementation**

- Update `README.md` to describe the three shared-model modules, demo-data limitation, and available scripts.

Suggested section:

```md
## Prototype Scope

- 产品结构建模
- 产品设计知识图谱
- 变更效应传播可视化

All three modules share one in-memory workspace model seeded by demo data.
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
git commit -m "docs: document shared-model prototype workflow"
```
