# Product Modeling Editing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add shared-workspace creation flows to the product-modeling page so users can add root components, child components, changeable parameters, and parameter dependencies from the current UI.

**Architecture:** Keep `ProductModelingPage` as the single owner of creation state, validation, and shared workspace writes. Extend the three existing panels with lightweight action triggers only, then render modal forms in the page so all create flows update `state.product` through one controlled path.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Vitest, Testing Library

---

### Task 1: Add root-component creation through the BOM panel

**Files:**
- Modify: `src/features/product-modeling/ProductModelingPage.test.tsx`
- Modify: `src/features/product-modeling/ProductModelingPage.tsx`
- Modify: `src/features/product-modeling/BomTreePanel.tsx`

**Step 1: Write the failing test**

Add a test that opens a root-component modal from the BOM panel header, saves a new name, and verifies the new root exists and becomes selected.

```tsx
test('creates a new root component and selects it', () => {
  render(
    <WorkspaceProvider>
      <ProductModelingPage />
    </WorkspaceProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: /add root component/i }));
  fireEvent.change(screen.getByLabelText(/component name/i), {
    target: { value: 'Thermal Platform' },
  });
  fireEvent.click(screen.getByRole('button', { name: /save component/i }));

  expect(screen.getByRole('button', { name: /Thermal Platform/i })).toBeInTheDocument();
  expect(screen.getByText('Thermal Platform')).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/product-modeling/ProductModelingPage.test.tsx`

Expected: FAIL because the BOM panel does not yet expose an add-root action or component modal.

**Step 3: Write the minimal implementation**

In `ProductModelingPage.tsx` add page-level draft state and a save handler that appends a new `ProductComponent` into `state.product.components`.

```tsx
type ComponentDraft = {
  name: string;
  parentId: string | null;
};

const [componentDraft, setComponentDraft] = useState<ComponentDraft | null>(null);
const [componentError, setComponentError] = useState<string | null>(null);

function createId(prefix: 'comp' | 'param' | 'link') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

function saveComponentDraft() {
  if (!componentDraft) return;
  const name = componentDraft.name.trim();
  if (!name) {
    setComponentError('Component name is required.');
    return;
  }

  const newComponent: ProductComponent = {
    id: createId('comp'),
    name,
    parentId: componentDraft.parentId,
    category: 'system',
    stage: 'baseline',
  };

  setState((prev) => ({
    ...prev,
    product: {
      ...prev.product,
      components: [...prev.product.components, newComponent],
    },
  }));
  setSelectedComponentId(newComponent.id);
  setComponentDraft(null);
  setComponentError(null);
}
```

In `BomTreePanel.tsx` add a header button with a stable accessible name while keeping the visible Chinese label.

```tsx
<button
  type="button"
  aria-label="Add root component"
  onClick={onAddRoot}
>
  添加根节点
</button>
```

Render a page-level modal in `ProductModelingPage.tsx` with:

- `role="dialog"`
- a labeled `component name` input
- `Save component` and `Cancel component` buttons

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/features/product-modeling/ProductModelingPage.test.tsx`

Expected: PASS for the new root-component test.

**Step 5: Commit**

```bash
git add src/features/product-modeling/ProductModelingPage.test.tsx src/features/product-modeling/ProductModelingPage.tsx src/features/product-modeling/BomTreePanel.tsx
git commit -m "feat: add root component creation to product modeling"
```

### Task 2: Add child-component creation from BOM nodes

**Files:**
- Modify: `src/features/product-modeling/ProductModelingPage.test.tsx`
- Modify: `src/features/product-modeling/ProductModelingPage.tsx`
- Modify: `src/features/product-modeling/BomTreePanel.tsx`

**Step 1: Write the failing test**

Add a test that selects an existing component, opens the child-component action from that node, saves a child name, and verifies the new child appears.

```tsx
test('creates a child component under the selected BOM node', () => {
  render(
    <WorkspaceProvider>
      <ProductModelingPage />
    </WorkspaceProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: /CPU Module/i }));
  fireEvent.click(screen.getByRole('button', { name: /add child component for CPU Module/i }));
  fireEvent.change(screen.getByLabelText(/component name/i), {
    target: { value: 'Voltage Regulator' },
  });
  fireEvent.click(screen.getByRole('button', { name: /save component/i }));

  expect(screen.getByRole('button', { name: /Voltage Regulator/i })).toBeInTheDocument();
  expect(screen.getByText('Voltage Regulator')).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/product-modeling/ProductModelingPage.test.tsx`

Expected: FAIL because tree nodes do not yet expose child-create actions or parent-aware defaults.

**Step 3: Write the minimal implementation**

Add a child-category helper in `ProductModelingPage.tsx` and use the selected node as the modal parent target.

```tsx
const CHILD_CATEGORY: Record<ProductComponent['category'], ProductComponent['category']> = {
  system: 'assembly',
  assembly: 'module',
  module: 'component',
  component: 'component',
};

function openChildComponentModal(parent: ProductComponent) {
  setComponentDraft({ name: '', parentId: parent.id });
  setComponentError(null);
}

function buildComponentFromDraft(name: string, parentId: string | null): ProductComponent {
  const parent = parentId ? componentById.get(parentId) : undefined;
  return {
    id: createId('comp'),
    name,
    parentId,
    category: parent ? CHILD_CATEGORY[parent.category] : 'system',
    stage: parent?.stage ?? 'baseline',
  };
}
```

Expose a per-node button in `BomTreePanel.tsx`.

```tsx
<button
  type="button"
  aria-label={`Add child component for ${node.name}`}
  onClick={(event) => {
    event.stopPropagation();
    onAddChild(node.id);
  }}
>
  添加子节点
</button>
```

Resolve `node.id` back to the full component in `ProductModelingPage.tsx` before opening the modal.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/features/product-modeling/ProductModelingPage.test.tsx`

Expected: PASS for the child-component test while the root-component test remains green.

**Step 5: Commit**

```bash
git add src/features/product-modeling/ProductModelingPage.test.tsx src/features/product-modeling/ProductModelingPage.tsx src/features/product-modeling/BomTreePanel.tsx
git commit -m "feat: add child component creation to bom tree"
```

### Task 3: Add changeable-parameter creation for the selected component

**Files:**
- Modify: `src/features/product-modeling/ProductModelingPage.test.tsx`
- Modify: `src/features/product-modeling/ProductModelingPage.tsx`
- Modify: `src/features/product-modeling/ParameterPanel.tsx`

**Step 1: Write the failing test**

Add a test that selects a component, opens the parameter modal, saves a new parameter, and verifies the parameter appears in the selected component view.

```tsx
test('creates a changeable parameter for the selected component', () => {
  render(
    <WorkspaceProvider>
      <ProductModelingPage />
    </WorkspaceProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: /CPU Module/i }));
  fireEvent.click(screen.getByRole('button', { name: /add changeable parameter/i }));
  fireEvent.change(screen.getByLabelText(/parameter name/i), {
    target: { value: 'CPU Cache' },
  });
  fireEvent.click(screen.getByRole('button', { name: /save parameter/i }));

  expect(screen.getByText('CPU Cache')).toBeInTheDocument();
  expect(screen.getByText(/0\s*$/)).toBeInTheDocument();
});
```

If the count assertion is too brittle, assert against the parameter card content instead of the summary number.

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/product-modeling/ProductModelingPage.test.tsx`

Expected: FAIL because the parameter panel does not yet expose a create action or parameter modal.

**Step 3: Write the minimal implementation**

Add parameter draft state and a save handler in `ProductModelingPage.tsx`.

```tsx
type ParameterDraft = {
  name: string;
};

const [parameterDraft, setParameterDraft] = useState<ParameterDraft | null>(null);
const [parameterError, setParameterError] = useState<string | null>(null);

function saveParameterDraft() {
  if (!resolvedComponentId || !parameterDraft) return;
  const name = parameterDraft.name.trim();
  if (!name) {
    setParameterError('Parameter name is required.');
    return;
  }

  const newParameter: ProductParameter = {
    id: createId('param'),
    componentId: resolvedComponentId,
    name,
    unit: '',
    baselineValue: 0,
    changeable: true,
  };

  setState((prev) => ({
    ...prev,
    product: {
      ...prev.product,
      parameters: [...prev.product.parameters, newParameter],
    },
  }));
  setParameterDraft(null);
  setParameterError(null);
}
```

Add a stable action trigger in `ParameterPanel.tsx`.

```tsx
<button
  type="button"
  aria-label="Add changeable parameter"
  onClick={onAddParameter}
  disabled={!component}
>
  添加可变更参数
</button>
```

Render a page-level parameter modal with labeled `parameter name` input and `Save parameter` button.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/features/product-modeling/ProductModelingPage.test.tsx`

Expected: PASS for the parameter-creation test while prior tests remain green.

**Step 5: Commit**

```bash
git add src/features/product-modeling/ProductModelingPage.test.tsx src/features/product-modeling/ProductModelingPage.tsx src/features/product-modeling/ParameterPanel.tsx
git commit -m "feat: add changeable parameter creation"
```

### Task 4: Add dependency creation from existing parameters only

**Files:**
- Modify: `src/features/product-modeling/ProductModelingPage.test.tsx`
- Modify: `src/features/product-modeling/ProductModelingPage.tsx`
- Modify: `src/features/product-modeling/DependencyPanel.tsx`

**Step 1: Write the failing test**

Add a test that opens the dependency modal, chooses existing source and target parameters, saves the link, and verifies the new dependency card appears.

```tsx
test('creates a dependency from existing source and target parameters', () => {
  render(
    <WorkspaceProvider>
      <ProductModelingPage />
    </WorkspaceProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: /CPU Module/i }));
  fireEvent.click(screen.getByRole('button', { name: /add dependency/i }));

  fireEvent.change(screen.getByLabelText(/source component/i), {
    target: { value: 'comp_cpu' },
  });
  fireEvent.change(screen.getByLabelText(/source parameter/i), {
    target: { value: 'param_cpu_power' },
  });
  fireEvent.change(screen.getByLabelText(/target component/i), {
    target: { value: 'comp_battery' },
  });
  fireEvent.change(screen.getByLabelText(/target parameter/i), {
    target: { value: 'param_battery_capacity' },
  });
  fireEvent.click(screen.getByRole('button', { name: /save dependency/i }));

  expect(screen.getByText(/CPU Power Limit/)).toBeInTheDocument();
  expect(screen.getAllByText(/Battery Capacity/).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/functional/i).length).toBeGreaterThan(0);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/product-modeling/ProductModelingPage.test.tsx`

Expected: FAIL because the dependency panel does not expose a creation flow and the page has no dependency draft state.

**Step 3: Write the minimal implementation**

Add dependency draft state plus a helper that derives parameter options from the selected component ids.

```tsx
type DependencyDraft = {
  sourceComponentId: string;
  sourceParameterId: string;
  targetComponentId: string;
  targetParameterId: string;
};

const [dependencyDraft, setDependencyDraft] = useState<DependencyDraft | null>(null);
const [dependencyError, setDependencyError] = useState<string | null>(null);

function parametersForComponent(componentId: string) {
  return state.product.parameters.filter((parameter) => parameter.componentId === componentId);
}

function saveDependencyDraft() {
  if (!dependencyDraft) return;
  const newLink: ParameterLink = {
    id: createId('link'),
    sourceComponentId: dependencyDraft.sourceComponentId,
    sourceParameterId: dependencyDraft.sourceParameterId,
    targetComponentId: dependencyDraft.targetComponentId,
    targetParameterId: dependencyDraft.targetParameterId,
    relation: 'functional',
    expression: '',
    impactWeight: 0.5,
  };

  setState((prev) => ({
    ...prev,
    product: {
      ...prev.product,
      parameterLinks: [...prev.product.parameterLinks, newLink],
    },
  }));
  setDependencyDraft(null);
  setDependencyError(null);
}
```

When a selected component changes in the dependency form, clear the dependent parameter id if it is no longer valid.

```tsx
function updateDependencySourceComponent(sourceComponentId: string) {
  setDependencyDraft((current) => {
    if (!current) return current;
    const validSourceIds = new Set(parametersForComponent(sourceComponentId).map((item) => item.id));
    return {
      ...current,
      sourceComponentId,
      sourceParameterId: validSourceIds.has(current.sourceParameterId) ? current.sourceParameterId : '',
    };
  });
}
```

Add a header button in `DependencyPanel.tsx` with `aria-label="Add dependency"`, and render a page-level dependency modal with labeled selects for all four required fields plus `Save dependency`.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/features/product-modeling/ProductModelingPage.test.tsx`

Expected: PASS for the dependency-creation test while prior tests remain green.

**Step 5: Commit**

```bash
git add src/features/product-modeling/ProductModelingPage.test.tsx src/features/product-modeling/ProductModelingPage.tsx src/features/product-modeling/DependencyPanel.tsx
git commit -m "feat: add parameter dependency creation"
```

### Task 5: Add inline validation for duplicate names and invalid dependency selections

**Files:**
- Modify: `src/features/product-modeling/ProductModelingPage.test.tsx`
- Modify: `src/features/product-modeling/ProductModelingPage.tsx`

**Step 1: Write the failing tests**

Add targeted validation tests for the three risky paths:

```tsx
test('rejects duplicate root names under the same parent', () => {
  render(
    <WorkspaceProvider>
      <ProductModelingPage />
    </WorkspaceProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: /add root component/i }));
  fireEvent.change(screen.getByLabelText(/component name/i), {
    target: { value: 'Apex Ultrabook' },
  });
  fireEvent.click(screen.getByRole('button', { name: /save component/i }));

  expect(screen.getByText(/already exists under this parent/i)).toBeInTheDocument();
});

test('rejects duplicate parameter names within the selected component', () => {
  render(
    <WorkspaceProvider>
      <ProductModelingPage />
    </WorkspaceProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: /CPU Module/i }));
  fireEvent.click(screen.getByRole('button', { name: /add changeable parameter/i }));
  fireEvent.change(screen.getByLabelText(/parameter name/i), {
    target: { value: 'CPU Frequency' },
  });
  fireEvent.click(screen.getByRole('button', { name: /save parameter/i }));

  expect(screen.getByText(/parameter already exists/i)).toBeInTheDocument();
});

test('rejects a dependency that reuses the same parameter as both source and target', () => {
  render(
    <WorkspaceProvider>
      <ProductModelingPage />
    </WorkspaceProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: /add dependency/i }));
  fireEvent.change(screen.getByLabelText(/source component/i), {
    target: { value: 'comp_cpu' },
  });
  fireEvent.change(screen.getByLabelText(/source parameter/i), {
    target: { value: 'param_cpu_frequency' },
  });
  fireEvent.change(screen.getByLabelText(/target component/i), {
    target: { value: 'comp_cpu' },
  });
  fireEvent.change(screen.getByLabelText(/target parameter/i), {
    target: { value: 'param_cpu_frequency' },
  });
  fireEvent.click(screen.getByRole('button', { name: /save dependency/i }));

  expect(screen.getByText(/source and target must be different/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/product-modeling/ProductModelingPage.test.tsx`

Expected: FAIL because duplicate-name and same-parameter validation are not implemented yet.

**Step 3: Write the minimal implementation**

Add concrete validation helpers in `ProductModelingPage.tsx`.

```tsx
function componentNameExists(name: string, parentId: string | null) {
  return state.product.components.some(
    (component) => component.parentId === parentId && component.name.trim().toLowerCase() === name.toLowerCase(),
  );
}

function parameterNameExists(name: string, componentId: string) {
  return state.product.parameters.some(
    (parameter) => parameter.componentId === componentId && parameter.name.trim().toLowerCase() === name.toLowerCase(),
  );
}

function validateDependencyDraft(draft: DependencyDraft) {
  if (!draft.sourceComponentId || !draft.sourceParameterId || !draft.targetComponentId || !draft.targetParameterId) {
    return 'All dependency fields are required.';
  }
  if (draft.sourceParameterId === draft.targetParameterId) {
    return 'Source and target must be different.';
  }
  return null;
}
```

Use these helpers inside the save handlers, keep the modal open on validation failure, and render inline error text near the footer or first invalid field.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/features/product-modeling/ProductModelingPage.test.tsx`

Expected: PASS for all validation tests and previously added create-flow tests.

**Step 5: Commit**

```bash
git add src/features/product-modeling/ProductModelingPage.test.tsx src/features/product-modeling/ProductModelingPage.tsx
git commit -m "feat: validate product modeling create flows"
```

### Task 6: Final verification and review

**Files:**
- Modify: `src/features/product-modeling/ProductModelingPage.test.tsx`
- Modify: `src/features/product-modeling/ProductModelingPage.tsx`
- Modify: `src/features/product-modeling/BomTreePanel.tsx`
- Modify: `src/features/product-modeling/ParameterPanel.tsx`
- Modify: `src/features/product-modeling/DependencyPanel.tsx`
- Review: `docs/plans/2026-03-29-product-modeling-editing-design.md`
- Review: `docs/plans/2026-03-29-product-modeling-editing.md`

**Step 1: Run the focused feature tests**

Run: `npm test -- --run src/features/product-modeling/ProductModelingPage.test.tsx`

Expected: PASS

**Step 2: Run type verification**

Run: `npm run lint`

Expected: exit code 0

**Step 3: Review the final diff**

Run: `git diff -- src/features/product-modeling/ProductModelingPage.test.tsx src/features/product-modeling/ProductModelingPage.tsx src/features/product-modeling/BomTreePanel.tsx src/features/product-modeling/ParameterPanel.tsx src/features/product-modeling/DependencyPanel.tsx docs/plans/2026-03-29-product-modeling-editing-design.md docs/plans/2026-03-29-product-modeling-editing.md`

Expected: Only the planned create flows, validation, tests, and docs changes are present.

**Step 4: Optional broader regression check**

Run: `npm test -- --run src/App.test.tsx`

Expected: PASS if the shared workspace updates do not disturb top-level routing and page composition.
