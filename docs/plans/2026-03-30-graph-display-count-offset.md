# Graph Display Count Offset Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply a display-only `+500` entity offset and `+7000` relation offset to all user-visible graph count surfaces without changing real graph data.

**Architecture:** Add a tiny pure display-metrics service for graph counts, then swap UI components to consume that service while preserving existing graph services, filters, layouts, and subgraph logic. Cover the helper with focused unit tests, update the routed knowledge-graph UI tests, and keep real graph-size assertions unchanged.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library

---

### Task 1: Add Graph Display Metrics Helper

**Files:**
- Create: `src/services/graphDisplayMetrics.test.ts`
- Create: `src/services/graphDisplayMetrics.ts`

**Step 1: Write the failing test**

```ts
import {
  displayEntityCount,
  displayEntityCountLabel,
  displayRelationCount,
  displayRelationCountPair,
} from './graphDisplayMetrics';

describe('graphDisplayMetrics', () => {
  test('adds the configured display offsets to entity and relation counts', () => {
    expect(displayEntityCount(3012)).toBe(3512);
    expect(displayEntityCountLabel(3012)).toBe('3512');
    expect(displayRelationCount(5573)).toBe(12573);
  });

  test('formats visible and total relation counts with the display offset on both values', () => {
    expect(displayRelationCountPair(0, 5573)).toBe('7000 / 12573');
    expect(displayRelationCountPair(5573, 5573)).toBe('12573 / 12573');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/services/graphDisplayMetrics.test.ts`
Expected: FAIL because `./graphDisplayMetrics` does not exist yet.

**Step 3: Write minimal implementation**

```ts
const ENTITY_DISPLAY_OFFSET = 500;
const RELATION_DISPLAY_OFFSET = 7000;

export function displayEntityCount(count: number) {
  return count + ENTITY_DISPLAY_OFFSET;
}

export function displayRelationCount(count: number) {
  return count + RELATION_DISPLAY_OFFSET;
}

export function displayEntityCountLabel(count: number) {
  return String(displayEntityCount(count));
}

export function displayRelationCountPair(visible: number, total: number) {
  return `${displayRelationCount(visible)} / ${displayRelationCount(total)}`;
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/services/graphDisplayMetrics.test.ts`
Expected: PASS with 2 tests passing.

**Step 5: Commit**

```bash
git add src/services/graphDisplayMetrics.ts src/services/graphDisplayMetrics.test.ts
git commit -m "feat: add graph display metrics helper"
```

### Task 2: Apply Display Offsets To Shared Graph Chrome

**Files:**
- Create: `src/components/graph/GraphToolbar.test.tsx`
- Modify: `src/components/graph/GraphToolbar.tsx`
- Modify: `src/components/graph/TopologyScene3D.tsx`
- Modify: `src/components/graph/TopologyScene3D.test.tsx`

**Step 1: Write the failing tests**

```tsx
import { render, screen } from '@testing-library/react';
import GraphToolbar from './GraphToolbar';

test('shows display-offset graph counts in the toolbar', () => {
  render(<GraphToolbar mode="explore" nodeCount={10} edgeCount={12} />);

  expect(screen.getByText('510 nodes')).toBeInTheDocument();
  expect(screen.getByText('7012 edges')).toBeInTheDocument();
});
```

```tsx
test('shows offset fallback counts when WebGL is unavailable', () => {
  render(
    <TopologyScene3D
      layout={{
        nodes: [
          {
            id: 'comp_cpu',
            name: 'CPU Module',
            renderLabel: 'CPU Module',
            kind: 'component',
            domain: 'product',
            category: 'component',
            stage: 'baseline',
            layer: 'source',
            column: 0,
            row: 0,
            x: 100,
            y: 120,
            z: 0,
          },
        ],
        edges: [],
        width: 800,
        height: 600,
        depth: 240,
      }}
      selectedNodeId="comp_cpu"
      focusNodeId="comp_cpu"
      onSelect={() => {}}
      onExpand={() => {}}
      onResetView={() => {}}
    />,
  );

  expect(screen.getByText('Nodes: 501')).toBeInTheDocument();
  expect(screen.getByText('Edges: 7000')).toBeInTheDocument();
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run src/components/graph/GraphToolbar.test.tsx src/components/graph/TopologyScene3D.test.tsx`
Expected: FAIL because the toolbar and fallback still show raw counts.

**Step 3: Write minimal implementation**

- Import the new helper into `src/components/graph/GraphToolbar.tsx` and wrap `nodeCount` and `edgeCount` before rendering.
- Import the relation/entity helpers into `src/components/graph/TopologyScene3D.tsx` and use them only in the non-WebGL fallback block.

```tsx
<span>{displayEntityCount(nodeCount)} nodes</span>
<span>{displayRelationCount(edgeCount)} edges</span>
```

```tsx
<p>Nodes: {displayEntityCount(sceneLayout.nodes.length)}</p>
<p>Edges: {displayRelationCount(sceneLayout.edges.length)}</p>
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --run src/components/graph/GraphToolbar.test.tsx src/components/graph/TopologyScene3D.test.tsx`
Expected: PASS with the new offset assertions green.

**Step 5: Commit**

```bash
git add src/components/graph/GraphToolbar.tsx src/components/graph/GraphToolbar.test.tsx src/components/graph/TopologyScene3D.tsx src/components/graph/TopologyScene3D.test.tsx
git commit -m "feat: offset shared graph count chrome"
```

### Task 3: Apply Display Offsets To Knowledge Graph Overview

**Files:**
- Modify: `src/features/knowledge-graph/KnowledgeGraphSidebar.tsx`
- Modify: `src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`

**Step 1: Write the failing page assertions**

Update `src/features/knowledge-graph/KnowledgeGraphPage.test.tsx` so the initial page test and filter test assert the displayed offset values:

```tsx
expect(screen.getByText('3512')).toBeInTheDocument();
expect(screen.getByText('12573 / 12573')).toBeInTheDocument();
```

Add a filter assertion after only `交易关系` remains enabled:

```tsx
expect(screen.getByText('7479 / 12573')).toBeInTheDocument();
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`
Expected: FAIL because the sidebar still renders raw values like `3012` and `479 / 5573`.

**Step 3: Write minimal implementation**

- Import the helper into `src/features/knowledge-graph/KnowledgeGraphSidebar.tsx`.
- Replace the metric card values with the offset helpers.
- Replace each per-type `visible / total` row with the same relation pair formatter so the card and the filter rows stay in sync.

```tsx
<MetricCard
  label="实体总数"
  value={displayEntityCountLabel(totalGraph.nodes.length)}
/>
<MetricCard
  label="关系总数"
  value={displayRelationCountPair(visibleGraph.edges.length, totalGraph.edges.length)}
/>
```

```tsx
<span className="text-xs text-slate-500">
  {displayRelationCountPair(visibleCount, totalCount)}
</span>
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`
Expected: PASS with the new offset metrics visible in the sidebar.

**Step 5: Commit**

```bash
git add src/features/knowledge-graph/KnowledgeGraphSidebar.tsx src/features/knowledge-graph/KnowledgeGraphPage.test.tsx
git commit -m "feat: offset knowledge graph overview counts"
```

### Task 4: Update The Legacy Prototype Count Card

**Files:**
- Modify: `KnowledgeGraph.tsx`

**Step 1: Reuse the existing helper**

Because `KnowledgeGraph.tsx` is excluded from `tsconfig.json` and is not part of the routed app, do not add new test coverage here. Reuse the helper from the routed UI work so the raw `nodes.length` and filtered edge count are offset in the left stats card.

**Step 2: Apply the minimal implementation**

```tsx
<span className="text-xl font-bold text-blue-600">{displayEntityCount(nodes.length)}</span>
<span className="text-xl font-bold text-blue-600">{displayRelationCount(edges.filter(e => filters.includes(e.type)).length)}</span>
```

**Step 3: Run the routed regression checks**

Run: `npm test -- --run src/services/graphDisplayMetrics.test.ts src/components/graph/GraphToolbar.test.tsx src/components/graph/TopologyScene3D.test.tsx src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`
Expected: PASS, proving the supported app surfaces use the display offsets while real graph services stay unchanged.

**Step 4: Commit**

```bash
git add KnowledgeGraph.tsx src/services/graphDisplayMetrics.ts src/services/graphDisplayMetrics.test.ts src/components/graph/GraphToolbar.tsx src/components/graph/GraphToolbar.test.tsx src/components/graph/TopologyScene3D.tsx src/components/graph/TopologyScene3D.test.tsx src/features/knowledge-graph/KnowledgeGraphSidebar.tsx src/features/knowledge-graph/KnowledgeGraphPage.test.tsx
git commit -m "feat: offset displayed graph counts"
```
