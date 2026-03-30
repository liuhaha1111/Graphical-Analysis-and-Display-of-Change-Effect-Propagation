# Topology Canvas Drag-Pan Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce the propagation-analysis Topology Canvas viewport and add drag-to-pan navigation so users can inspect the topology by dragging the canvas in all directions.

**Architecture:** Keep the existing large topology surface and convert the current scroll wrapper in `TopologyCanvas` into a bounded viewport that pans by updating `scrollLeft` and `scrollTop`. Preserve existing node rendering and selection behavior, then add a centering effect so the smaller viewport opens near the active node instead of the top-left corner.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Vitest, Testing Library

---

### Task 1: Add failing tests for the drag-enabled viewport

**Files:**
- Modify: `src/components/graph/TopologyCanvas.test.tsx`

**Step 1: Write the failing test**

Add two focused assertions:

- A test that expects the canvas viewport element to expose a dedicated test id such as `topology-canvas-viewport`.
- A test that seeds `scrollLeft` and `scrollTop`, fires pointer drag events, and expects the viewport scroll position to change.

Example test shape:

```tsx
const viewport = screen.getByTestId('topology-canvas-viewport');
Object.defineProperty(viewport, 'scrollLeft', { value: 200, writable: true });
Object.defineProperty(viewport, 'scrollTop', { value: 120, writable: true });

fireEvent.pointerDown(viewport, { clientX: 300, clientY: 200, button: 0 });
fireEvent.pointerMove(viewport, { clientX: 260, clientY: 170 });
fireEvent.pointerUp(viewport, { clientX: 260, clientY: 170 });

expect(viewport.scrollLeft).toBeGreaterThan(200);
expect(viewport.scrollTop).toBeGreaterThan(120);
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/components/graph/TopologyCanvas.test.tsx`

Expected: FAIL because the viewport test id and drag behavior do not exist yet.

**Step 3: Commit**

```bash
git add src/components/graph/TopologyCanvas.test.tsx
git commit -m "test: cover topology canvas drag viewport"
```

### Task 2: Implement bounded viewport and drag-to-pan behavior

**Files:**
- Modify: `src/components/graph/TopologyCanvas.tsx`

**Step 1: Write the minimal implementation**

Update `TopologyCanvas` to:

- Add a viewport ref.
- Track pointer press position, initial scroll offsets, and whether dragging is active.
- Convert the outer canvas wrapper into a smaller fixed-height viewport.
- Apply `cursor-grab` and `cursor-grabbing`.
- Update scroll offsets during pointer moves after a small movement threshold.
- Stop dragging on pointer up, pointer cancel, and pointer leave.

Representative code shape:

```tsx
const viewportRef = useRef<HTMLDivElement>(null);
const dragStateRef = useRef({
  pointerId: null as number | null,
  startX: 0,
  startY: 0,
  startScrollLeft: 0,
  startScrollTop: 0,
  moved: false,
});
const [isDragging, setIsDragging] = useState(false);
```

**Step 2: Run test to verify it passes**

Run: `npm test -- --run src/components/graph/TopologyCanvas.test.tsx`

Expected: PASS for the new viewport and drag behavior tests while preserving existing assertions.

**Step 3: Commit**

```bash
git add src/components/graph/TopologyCanvas.tsx src/components/graph/TopologyCanvas.test.tsx
git commit -m "feat: add drag-pannable topology canvas viewport"
```

### Task 3: Center the smaller viewport on the active node

**Files:**
- Modify: `src/components/graph/TopologyCanvas.tsx`
- Modify: `src/components/graph/TopologyCanvas.test.tsx`

**Step 1: Write the failing test**

Add a test that mocks the viewport dimensions and asserts the centering effect updates scroll offsets toward the selected node after render.

Example shape:

```tsx
Object.defineProperty(viewport, 'clientWidth', { value: 640, configurable: true });
Object.defineProperty(viewport, 'clientHeight', { value: 420, configurable: true });

expect(viewport.scrollLeft).toBeGreaterThan(0);
expect(viewport.scrollTop).toBeGreaterThan(0);
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/components/graph/TopologyCanvas.test.tsx`

Expected: FAIL because the viewport does not yet auto-center on the selected node.

**Step 3: Implement the minimal centering effect**

Use an effect keyed by `layout`, `selectedNodeId`, and `mode` to:

- Resolve the selected node when present.
- Fall back to the first source-layer node or first layout node.
- Compute the target scroll offset from node coordinates and viewport size.
- Clamp naturally by assigning to `scrollLeft` and `scrollTop`.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/components/graph/TopologyCanvas.test.tsx`

Expected: PASS with the new centering test included.

**Step 5: Commit**

```bash
git add src/components/graph/TopologyCanvas.tsx src/components/graph/TopologyCanvas.test.tsx
git commit -m "feat: center topology viewport on active node"
```

### Task 4: Final verification

**Files:**
- Modify: `src/components/graph/TopologyCanvas.tsx`
- Modify: `src/components/graph/TopologyCanvas.test.tsx`

**Step 1: Run focused tests**

Run: `npm test -- --run src/components/graph/TopologyCanvas.test.tsx`

Expected: PASS

**Step 2: Run type verification**

Run: `npm run lint`

Expected: exit code 0

**Step 3: Inspect the diff**

Run: `git diff -- src/components/graph/TopologyCanvas.tsx src/components/graph/TopologyCanvas.test.tsx docs/plans/2026-03-29-topology-canvas-drag-pan-design.md docs/plans/2026-03-29-topology-canvas-drag-pan.md`

Expected: Only the planned viewport, drag behavior, centering logic, tests, and docs changes are present.
