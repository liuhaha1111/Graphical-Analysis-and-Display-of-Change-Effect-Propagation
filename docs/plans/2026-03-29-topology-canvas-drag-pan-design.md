# Topology Canvas Drag-Pan Design

**Date:** 2026-03-29

**Goal:** Shrink the propagation-analysis Topology Canvas viewport and let users drag the canvas in all directions to inspect the full topology without relying on oversized visible content.

## Current State

`src/features/propagation-analysis/PropagationCanvas.tsx` renders the shared `TopologyCanvas` component. The current `TopologyCanvas` keeps the full internal graph surface visible inside a plain `overflow-auto` wrapper:

- The visible canvas area is too tall for the propagation-analysis page.
- Navigation depends on default scrolling rather than direct manipulation.
- Opening the page can leave the user at the top-left corner instead of near the active source or selected node.

## Chosen Approach

Keep the existing large internal topology surface and turn the outer wrapper into a fixed viewport with drag-to-pan behavior implemented through `scrollLeft` and `scrollTop`.

This is the lowest-risk option because:

- Existing node and edge rendering can stay unchanged.
- Node selection remains button-based and accessible.
- Browser scroll bounds provide natural panning limits.
- The change is scoped to `TopologyCanvas`, which is currently only used by the propagation-analysis flow.

## Interaction Model

The viewport becomes a smaller framed window over the larger internal graph surface.

- Pointer down on empty canvas space stores the pointer start position and current scroll offsets.
- Pointer move updates the viewport scroll position, producing direct panning in all directions.
- Pointer up, pointer cancel, and pointer leave end the drag session.
- The viewport uses `grab` and `grabbing` cursor states to signal the interaction.
- A small move threshold prevents ordinary node clicks from being misread as drag gestures.

## Viewport Behavior

- Width continues to fill the middle propagation-analysis column.
- Height is reduced to a fixed viewport-sized value so the panel no longer dominates the page vertically.
- The internal topology surface keeps its existing computed width and height.
- Scrollbars can remain functional as a fallback, but drag becomes the primary interaction.

## Focus Management

The viewport should not stay parked at the top-left by default.

- On first render and whenever the layout or selected node changes, the viewport recenters on the active node.
- The selected node is the first centering target.
- If no selected node is available, the source-layer node is used as the fallback focus.

This keeps the smaller viewport usable immediately after the analysis runs or the selected node changes.

## Component Changes

### `src/components/graph/TopologyCanvas.tsx`

- Add a viewport ref for drag scrolling.
- Add pointer gesture state for press, move threshold, and active dragging.
- Add an effect that recenters the viewport around the selected or source node.
- Replace the generic scroll container styling with a smaller viewport-style container and drag cursor affordances.

### `src/components/graph/TopologyCanvas.test.tsx`

- Add a regression test that verifies the viewport renders as a bounded pan surface.
- Add a regression test that simulates pointer dragging and confirms scroll offsets change.
- Keep existing selection and propagation overlay assertions intact.

## Error Handling And Edge Cases

- Empty layouts still render the existing empty state.
- Dragging must stop cleanly when the pointer is released or canceled.
- Centering logic must clamp naturally through browser scroll limits.
- No zoom behavior is added in this change.
- Touch pinch or kinetic panning is out of scope for this iteration.

## Testing

Use TDD:

1. Add a failing test for the smaller drag-enabled viewport.
2. Run the focused `TopologyCanvas` test suite and verify the new test fails for the expected reason.
3. Implement the minimal viewport and drag behavior.
4. Re-run the focused tests until they pass.
5. Run project verification for TypeScript and relevant tests.

## Risks

- Pointer-event handling can accidentally interfere with node clicks if the drag threshold is too small.
- JSDOM support for pointer interactions can be limited, so tests should assert scroll state directly and avoid overfitting browser-only behavior.
- Future zoom support may require extracting the pan logic into a reusable hook, but that is not necessary for this change.
