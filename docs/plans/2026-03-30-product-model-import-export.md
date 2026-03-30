# Product Model Import Export Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add product-model-only import/export to the product-modeling page and require dependency relation type plus expression/constraint description when creating links.

**Architecture:** Keep `ProductModelingPage` as the owner of page interaction state, extend `productModelingForm.ts` to model complete dependency drafts, and add a dedicated import/export service that validates raw JSON before replacing `state.product`. The UI continues to render from shared workspace state, but only the `product` slice is imported and exported.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Vitest, Testing Library

---

### Task 1: Define dependency draft metadata and parsing rules

**Files:**
- Modify: `src/features/product-modeling/productModelingForm.ts`
- Modify: `src/features/product-modeling/productModelingForm.test.ts`

**Step 1: Write the failing test**

Add tests that prove a dependency draft is incomplete without relation type or expression and that resolution maps Chinese labels to the domain relation values.

```ts
test('treats relation type and expression as required dependency fields', () => {
  const draft = {
    sourceComponentId: 'comp_cpu',
    sourceParameterId: 'param_cpu_power',
    targetComponentId: 'comp_battery',
    targetParameterId: 'param_battery_capacity',
    relationType: '',
    expression: '',
  };

  expect(isDependencyDraftComplete(draft, parameters)).toBe(false);
});

test('maps numeric transfer to functional relation', () => {
  const resolved = resolveDependencyDraft(
    {
      sourceComponentId: 'comp_cpu',
      sourceParameterId: 'param_cpu_power',
      targetComponentId: 'comp_battery',
      targetParameterId: 'param_battery_capacity',
      relationType: '数值传递',
      expression: 'target = source * 1.1',
    },
    parameters,
  );

  expect(resolved.relation).toBe('functional');
  expect(resolved.expression).toBe('target = source * 1.1');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/product-modeling/productModelingForm.test.ts`
Expected: FAIL because the current draft type has no relation type or expression fields.

**Step 3: Write minimal implementation**

Update the draft model and resolution helpers.

```ts
export type DependencyRelationType = '数值传递' | '逻辑约束';

export type DependencyDraft = {
  sourceComponentId: string;
  sourceParameterId: string;
  targetComponentId: string;
  targetParameterId: string;
  relationType: DependencyRelationType | '';
  expression: string;
};
```

Have `resolveDependencyDraft` return the validated ids plus:

```ts
relation: draft.relationType === '逻辑约束' ? 'constraint' : 'functional',
expression: draft.expression.trim(),
```

Reject blank expressions and unknown relation labels.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/features/product-modeling/productModelingForm.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/product-modeling/productModelingForm.ts src/features/product-modeling/productModelingForm.test.ts
git commit -m "feat: add dependency relation metadata drafts"
```

### Task 2: Add import/export service for ProductDomain JSON

**Files:**
- Create: `src/services/productModelImportExport.ts`
- Create: `src/services/productModelImportExport.test.ts`

**Step 1: Write the failing test**

Add tests that prove only product-model fields are exported and invalid imports are rejected.

```ts
test('exports only product model arrays', () => {
  const json = exportProductModel(product);
  expect(JSON.parse(json)).toEqual({
    components: expect.any(Array),
    parameters: expect.any(Array),
    parameterLinks: expect.any(Array),
  });
});

test('rejects imports with blank link expression', () => {
  expect(() =>
    importProductModel(JSON.stringify({
      components,
      parameters,
      parameterLinks: [{ ...link, expression: '   ' }],
    })),
  ).toThrow(/expression/i);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/services/productModelImportExport.test.ts`
Expected: FAIL because the service does not exist.

**Step 3: Write minimal implementation**

Implement `exportProductModel` and `importProductModel` with structure and reference validation.

```ts
export function exportProductModel(product: ProductDomain): string {
  return JSON.stringify(
    {
      components: product.components,
      parameters: product.parameters,
      parameterLinks: product.parameterLinks,
    },
    null,
    2,
  );
}
```

In `importProductModel`, validate:

- required top-level arrays
- required component, parameter, and link fields
- allowed link relations: `functional` and `constraint`
- non-empty `expression`
- parameter-to-component ownership matches link component ids

If validation succeeds, return a `ProductDomain`.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/services/productModelImportExport.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/productModelImportExport.ts src/services/productModelImportExport.test.ts
git commit -m "feat: add product model import export validation"
```

### Task 3: Extend the product-modeling page tests for dependency metadata and import/export

**Files:**
- Modify: `src/features/product-modeling/ProductModelingPage.test.tsx`

**Step 1: Write the failing test**

Add focused UI tests for the new behavior.

```tsx
test('requires relation type and expression when creating a dependency', () => {
  render(
    <WorkspaceProvider>
      <ProductModelingPage />
    </WorkspaceProvider>,
  );

  fireEvent.click(screen.getByRole('button', { name: /add dependency/i }));
  const dialog = screen.getByRole('dialog', { name: /add dependency/i });

  fireEvent.change(within(dialog).getByLabelText(/source component/i), {
    target: { value: 'comp_cpu' },
  });
  fireEvent.change(within(dialog).getByLabelText(/source parameter/i), {
    target: { value: 'param_cpu_power' },
  });
  fireEvent.change(within(dialog).getByLabelText(/target component/i), {
    target: { value: 'comp_battery' },
  });
  fireEvent.change(within(dialog).getByLabelText(/target parameter/i), {
    target: { value: 'param_battery_capacity' },
  });

  expect(within(dialog).getByRole('button', { name: /save dependency/i })).toBeDisabled();
});
```

Also add:

- a success case showing `数值传递` and the expression text in the dependency card
- an import success case using a small valid JSON file payload
- an import failure case that keeps the old component visible and shows inline error text
- an export case that intercepts the blob payload and verifies only `components / parameters / parameterLinks` are written

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/product-modeling/ProductModelingPage.test.tsx`
Expected: FAIL because the current page does not render the new fields or import/export controls.

**Step 3: Write minimal implementation scaffolding**

Add just enough hooks and placeholders in the page to make the new test targets exist:

- import button
- export button
- hidden file input
- relation type select
- expression textarea
- inline import error region

Do not finish behavior yet; only make the failing reasons concrete and focused.

**Step 4: Run test to verify it still fails for the right reason**

Run: `npm test -- --run src/features/product-modeling/ProductModelingPage.test.tsx`
Expected: FAIL on missing behavior, not missing UI controls.

**Step 5: Commit**

```bash
git add src/features/product-modeling/ProductModelingPage.test.tsx
git commit -m "test: cover product model import export flows"
```

### Task 4: Implement dependency relation type and expression in the page

**Files:**
- Modify: `src/features/product-modeling/ProductModelingPage.tsx`
- Modify: `src/features/product-modeling/DependencyPanel.tsx`

**Step 1: Write the failing test**

Use the page test from Task 3 that saves a dependency with:

- source CPU power
- target battery capacity
- relation type `数值传递`
- expression `target = source * 1.1`

Expected UI after save:

- a dependency card exists
- the card shows `数值传递`
- the card shows `target = source * 1.1`

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/product-modeling/ProductModelingPage.test.tsx -t "requires relation type and expression|shows numeric transfer"`
Expected: FAIL

**Step 3: Write minimal implementation**

In `ProductModelingPage.tsx`:

- initialize dependency drafts with `relationType: ''` and `expression: ''`
- include relation type select and expression textarea in the modal
- disable save until `isDependencyDraftComplete` returns true
- on save, write:

```ts
{
  id: nextDependencyId,
  sourceComponentId: resolvedDependency.sourceComponentId,
  sourceParameterId: resolvedDependency.sourceParameterId,
  targetComponentId: resolvedDependency.targetComponentId,
  targetParameterId: resolvedDependency.targetParameterId,
  relation: resolvedDependency.relation,
  expression: resolvedDependency.expression,
  impactWeight: 0.5,
}
```

In `DependencyPanel.tsx`, map:

```ts
functional -> 数值传递
constraint -> 逻辑约束
```

and show `dependency.expression`.

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/features/product-modeling/ProductModelingPage.test.tsx -t "requires relation type and expression|shows numeric transfer"`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/product-modeling/ProductModelingPage.tsx src/features/product-modeling/DependencyPanel.tsx
git commit -m "feat: capture dependency relation metadata"
```

### Task 5: Implement product-model-only import/export UI and state replacement

**Files:**
- Modify: `src/features/product-modeling/ProductModelingPage.tsx`

**Step 1: Write the failing test**

Use the page tests from Task 3 for:

- import success
- import failure with preserved old state
- export JSON payload

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/features/product-modeling/ProductModelingPage.test.tsx -t "imports a valid product model|shows import error|exports only product model"`
Expected: FAIL

**Step 3: Write minimal implementation**

In `ProductModelingPage.tsx`:

- add a hidden file input with `accept=".json,application/json"`
- on file selection, read text with `File.text()`
- call `importProductModel`
- update state with:

```ts
setState((current) => ({
  ...current,
  product: importedProduct,
}));
```

- clear import error on success
- keep old state and set inline error on failure

For export:

- call `exportProductModel(state.product)`
- wrap in `Blob`
- trigger download as `product-model-${new Date().toISOString().slice(0, 10)}.json`

After import, recompute selected component:

- keep current selection if the imported product still contains it
- otherwise select the first available component

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/features/product-modeling/ProductModelingPage.test.tsx -t "imports a valid product model|shows import error|exports only product model"`
Expected: PASS

**Step 5: Commit**

```bash
git add src/features/product-modeling/ProductModelingPage.tsx
git commit -m "feat: add product model import export actions"
```

### Task 6: Add a sample import file

**Files:**
- Create: `docs/examples/product-model-import.json`
- Modify: `src/services/productModelImportExport.test.ts`

**Step 1: Write the failing check**

Add a lightweight assertion that the checked-in sample JSON parses as a valid product model.

```ts
test('accepts the checked-in sample import file', () => {
  const raw = readFileSync(samplePath, 'utf8');
  expect(() => importProductModel(raw)).not.toThrow();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/services/productModelImportExport.test.ts -t "checked-in sample"`
Expected: FAIL because the sample file does not exist.

**Step 3: Write minimal implementation**

Create `docs/examples/product-model-import.json` with:

- 1 root component
- 1 child component
- 2 parameters
- 1 valid dependency
- non-empty `expression`

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/services/productModelImportExport.test.ts -t "checked-in sample"`
Expected: PASS

**Step 5: Commit**

```bash
git add docs/examples/product-model-import.json src/services/productModelImportExport.test.ts
git commit -m "docs: add sample product model import file"
```

### Task 7: Final verification

**Files:**
- Modify: `src/features/product-modeling/ProductModelingPage.tsx`
- Modify: `src/features/product-modeling/DependencyPanel.tsx`
- Modify: `src/features/product-modeling/productModelingForm.ts`
- Modify: `src/features/product-modeling/ProductModelingPage.test.tsx`
- Modify: `src/features/product-modeling/productModelingForm.test.ts`
- Create: `src/services/productModelImportExport.ts`
- Create: `src/services/productModelImportExport.test.ts`
- Create: `docs/examples/product-model-import.json`

**Step 1: Run the focused form and page tests**

Run: `npm test -- --run src/features/product-modeling/productModelingForm.test.ts src/features/product-modeling/ProductModelingPage.test.tsx src/services/productModelImportExport.test.ts`
Expected: PASS

**Step 2: Run broader app verification**

Run: `npm test -- --run src/App.test.tsx`
Expected: PASS

**Step 3: Run build verification**

Run: `npm run build`
Expected: exit code 0

**Step 4: Review diff**

Run: `git diff -- docs/plans/2026-03-30-product-model-import-export-design.md docs/plans/2026-03-30-product-model-import-export.md src/features/product-modeling/ProductModelingPage.tsx src/features/product-modeling/DependencyPanel.tsx src/features/product-modeling/productModelingForm.ts src/features/product-modeling/ProductModelingPage.test.tsx src/features/product-modeling/productModelingForm.test.ts src/services/productModelImportExport.ts src/services/productModelImportExport.test.ts docs/examples/product-model-import.json`
Expected: Only the planned product-model import/export and dependency metadata changes are present.

**Step 5: Commit**

```bash
git add docs/plans/2026-03-30-product-model-import-export-design.md docs/plans/2026-03-30-product-model-import-export.md src/features/product-modeling/ProductModelingPage.tsx src/features/product-modeling/DependencyPanel.tsx src/features/product-modeling/productModelingForm.ts src/features/product-modeling/ProductModelingPage.test.tsx src/features/product-modeling/productModelingForm.test.ts src/services/productModelImportExport.ts src/services/productModelImportExport.test.ts docs/examples/product-model-import.json
git commit -m "feat: add product model import export"
```
