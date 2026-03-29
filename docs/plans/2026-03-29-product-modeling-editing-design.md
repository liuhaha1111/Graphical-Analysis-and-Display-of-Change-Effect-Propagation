# Product Modeling Editing Design

**Date:** 2026-03-29

**Goal:** Add lightweight create flows to the product-modeling page so users can add root components, child components, changeable parameters, and parameter dependencies directly into the shared workspace model.

## Current State

`src/features/product-modeling/ProductModelingPage.tsx` reads product data from the shared workspace and renders three read-only panels:

- `BomTreePanel` renders the BOM hierarchy.
- `ParameterPanel` renders the selected component and its parameters.
- `DependencyPanel` renders dependencies connected to the selected component.

The current page can inspect shared modeling data, but it cannot create or extend the model. The older root-level `ProductModeling.tsx` contains local demo interactions for adding BOM nodes, parameters, and dependencies, but those actions are not wired into the current shared workspace architecture.

## Chosen Approach

Keep the existing three-panel layout and add page-level creation workflows managed by `ProductModelingPage`.

This is the lowest-risk option because:

- Shared workspace writes can stay centralized in one component.
- Existing presentation panels can remain mostly presentational.
- New modeling data becomes immediately available to downstream knowledge-graph and propagation-analysis flows.
- The scope stays limited to create-only behavior rather than full CRUD refactoring.

## State Ownership

`ProductModelingPage` becomes the owner of:

- modal open/close state for component, parameter, and dependency creation
- form draft state for each creation flow
- validation errors for each modal
- helper functions that write new objects into `state.product`

The panels stay focused on display plus action triggers:

- `BomTreePanel` exposes `add root` and `add child` entry points.
- `ParameterPanel` exposes `add changeable parameter`.
- `DependencyPanel` exposes `add dependency`.

## Interaction Model

### Add root component

- Available from the BOM panel header.
- User provides only the component name.
- Save creates a new `ProductComponent` with `parentId = null`.
- The newly created root becomes the current selection.

### Add child component

- Available from a selected or hovered tree node.
- Requires an existing selected component target.
- User provides only the child component name.
- Save creates a new `ProductComponent` whose `parentId` is the selected component id.
- The new child becomes the current selection.

### Add changeable parameter

- Available from the parameter panel only when a component is selected.
- User provides only the parameter name.
- Save creates a new `ProductParameter` linked to the selected component.
- The parameter panel refreshes immediately because it reads from shared workspace state.

### Add dependency

- Available from the dependency panel header.
- User selects source component, source parameter, target component, and target parameter from existing workspace data.
- Save creates a new `ParameterLink` in shared workspace state.
- The dependency panel refreshes immediately for the selected component.

## Default Values

### Components

- Root component defaults:
  - `category = 'system'`
  - `stage = 'baseline'`
  - `description` omitted
- Child component defaults:
  - `stage` inherits from the parent component
  - `category` is inferred by parent category:
    - `system -> assembly`
    - `assembly -> module`
    - `module -> component`
    - `component -> component`

### Parameters

- `unit = ''`
- `baselineValue = 0`
- `changeable = true`
- `minValue` and `maxValue` omitted
- `notes` omitted

### Dependencies

- `relation = 'functional'`
- `expression = ''`
- `impactWeight = 0.5`

## Validation Rules

### Component creation

- Name is required after trimming whitespace.
- Duplicate names under the same parent are rejected.
- Child creation is blocked when no component is selected.

### Parameter creation

- A selected component is required.
- Parameter name is required after trimming whitespace.
- Duplicate parameter names within the same component are rejected.

### Dependency creation

- Source component, source parameter, target component, and target parameter are all required.
- Source and target parameter ids cannot be the same.
- Parameters must be chosen from existing parameter lists; free-text parameter creation is out of scope.
- If switching a component makes the chosen parameter invalid, the parameter selection resets.

## Error Handling

- Validation errors are shown inline inside each modal rather than through `alert`.
- Canceling or successfully saving a modal clears its draft state and errors.
- The page should only permit parent-child combinations that preserve a valid tree structure.
- ID generation must produce unique values for newly created components, parameters, and links.

## Component Changes

### `src/features/product-modeling/ProductModelingPage.tsx`

- Add modal state, draft state, and validation state.
- Add helper functions for generating ids and inferring child categories.
- Add shared workspace update functions for component, parameter, and dependency creation.
- Pass creation callbacks and UI state into the three panel components.
- Render shared creation modals with lightweight forms.

### `src/features/product-modeling/BomTreePanel.tsx`

- Add an `add root` button in the panel header.
- Add an `add child` action for each rendered node.
- Preserve selection behavior and current tree rendering structure.

### `src/features/product-modeling/ParameterPanel.tsx`

- Add an `add changeable parameter` action.
- Disable or soften the action when no component is selected.

### `src/features/product-modeling/DependencyPanel.tsx`

- Add an `add dependency` action in the header.
- Continue rendering selected-component dependency summaries while exposing the new create entry point.

### `src/features/product-modeling/ProductModelingPage.test.tsx`

- Add regression tests that cover creating root components, child components, parameters, and dependencies.
- Add validation coverage for missing required fields and duplicate names.

## Testing

Use TDD:

1. Add one failing test for root component creation.
2. Run the focused product-modeling test file and verify it fails for the expected reason.
3. Implement the minimal root creation flow.
4. Repeat for child creation, parameter creation, and dependency creation.
5. Run focused tests again after each change.
6. Finish with broader verification for the product-modeling flow and project test suite as appropriate.

## Risks

- Shared workspace updates can cause broad rerenders because the page works on a large demo dataset.
- Tree actions can become visually noisy if add-child controls are too prominent on every node.
- Dependency forms can be awkward on large datasets, so the initial version should favor correctness over advanced filtering or search.
- Create-only scope avoids edit/delete complexity, but future iterations may need a shared form abstraction to prevent duplication.
