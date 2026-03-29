import { useState } from 'react';
import { ProductComponent, ProductParameter } from '../../domain/workspace';
import { buildProductTree } from '../../services/productModel.service';
import { useWorkspace } from '../../store/workspaceStore';
import BomTreePanel from './BomTreePanel';
import DependencyPanel from './DependencyPanel';
import ParameterPanel from './ParameterPanel';

function findInitialComponent(
  components: ProductComponent[],
  parameters: ProductParameter[],
  preferredComponentId?: string,
) {
  if (preferredComponentId) {
    const matched = components.find((component) => component.id === preferredComponentId);
    if (matched) {
      return matched.id;
    }
  }

  const withParameters = components.find((component) =>
    parameters.some((parameter) => parameter.componentId === component.id),
  );
  return withParameters?.id ?? components[0]?.id ?? null;
}

function createId(prefix: string, existingIds: Set<string>) {
  let nextIndex = existingIds.size + 1;
  let nextId = `${prefix}_${nextIndex}`;

  while (existingIds.has(nextId)) {
    nextIndex += 1;
    nextId = `${prefix}_${nextIndex}`;
  }

  return nextId;
}

function inferChildCategory(parentCategory: ProductComponent['category']) {
  switch (parentCategory) {
    case 'system':
      return 'assembly';
    case 'assembly':
      return 'module';
    case 'module':
      return 'component';
    case 'component':
    default:
      return 'component';
  }
}

export default function ProductModelingPage() {
  const { state, setState } = useWorkspace();
  const [selectedComponentId, setSelectedComponentId] = useState(() =>
    findInitialComponent(
      state.product.components,
      state.product.parameters,
      state.changeScenario.sourceComponentId,
    ),
  );
  const [isRootModalOpen, setIsRootModalOpen] = useState(false);
  const [rootComponentName, setRootComponentName] = useState('');
  const [rootComponentError, setRootComponentError] = useState<string | null>(null);
  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [childParentId, setChildParentId] = useState<string | null>(null);
  const [childComponentName, setChildComponentName] = useState('');
  const [childComponentError, setChildComponentError] = useState<string | null>(null);
  const [isParameterModalOpen, setIsParameterModalOpen] = useState(false);
  const [parameterName, setParameterName] = useState('');
  const [parameterError, setParameterError] = useState<string | null>(null);
  const [isDependencyModalOpen, setIsDependencyModalOpen] = useState(false);
  const [dependencyDraft, setDependencyDraft] = useState({
    sourceComponentId: '',
    sourceParameterId: '',
    targetComponentId: '',
    targetParameterId: '',
  });
  const [dependencyError, setDependencyError] = useState<string | null>(null);

  const tree = buildProductTree(state.product);
  const componentById = new Map(state.product.components.map((component) => [component.id, component]));
  const parameterById = new Map(state.product.parameters.map((parameter) => [parameter.id, parameter]));

  const resolvedComponentId = componentById.has(selectedComponentId ?? '')
    ? selectedComponentId
    : findInitialComponent(
        state.product.components,
        state.product.parameters,
        state.changeScenario.sourceComponentId,
      );

  const selectedComponent = resolvedComponentId
    ? componentById.get(resolvedComponentId)
    : undefined;
  const childParent = childParentId ? componentById.get(childParentId) : undefined;

  const selectedParameters = selectedComponent
    ? state.product.parameters.filter((parameter) => parameter.componentId === selectedComponent.id)
    : [];
  const selectedDependencies = selectedComponent
    ? state.product.parameterLinks.filter(
        (dependency) =>
          dependency.sourceComponentId === selectedComponent.id ||
          dependency.targetComponentId === selectedComponent.id,
      )
    : [];

  const inboundDependencyCount = selectedComponent
    ? state.product.parameterLinks.filter(
        (dependency) => dependency.targetComponentId === selectedComponent.id,
      ).length
    : 0;
  const outboundDependencyCount = selectedComponent
    ? state.product.parameterLinks.filter(
        (dependency) => dependency.sourceComponentId === selectedComponent.id,
      ).length
    : 0;
  const sourceParameterOptions = dependencyDraft.sourceComponentId
    ? state.product.parameters.filter(
        (parameter) => parameter.componentId === dependencyDraft.sourceComponentId,
      )
    : [];
  const targetParameterOptions = dependencyDraft.targetComponentId
    ? state.product.parameters.filter(
        (parameter) => parameter.componentId === dependencyDraft.targetComponentId,
      )
    : [];

  const openRootModal = () => {
    setRootComponentName('');
    setRootComponentError(null);
    setIsRootModalOpen(true);
  };

  const closeRootModal = () => {
    setRootComponentName('');
    setRootComponentError(null);
    setIsRootModalOpen(false);
  };

  const openChildModal = (parentId: string) => {
    setChildParentId(parentId);
    setChildComponentName('');
    setChildComponentError(null);
    setIsChildModalOpen(true);
  };

  const closeChildModal = () => {
    setChildParentId(null);
    setChildComponentName('');
    setChildComponentError(null);
    setIsChildModalOpen(false);
  };

  const openParameterModal = () => {
    if (!selectedComponent) {
      return;
    }

    setParameterName('');
    setParameterError(null);
    setIsParameterModalOpen(true);
  };

  const closeParameterModal = () => {
    setParameterName('');
    setParameterError(null);
    setIsParameterModalOpen(false);
  };

  const openDependencyModal = () => {
    setDependencyDraft({
      sourceComponentId: selectedComponent?.id ?? '',
      sourceParameterId: '',
      targetComponentId: '',
      targetParameterId: '',
    });
    setDependencyError(null);
    setIsDependencyModalOpen(true);
  };

  const closeDependencyModal = () => {
    setDependencyDraft({
      sourceComponentId: '',
      sourceParameterId: '',
      targetComponentId: '',
      targetParameterId: '',
    });
    setDependencyError(null);
    setIsDependencyModalOpen(false);
  };

  const handleCreateRootComponent = () => {
    const trimmedName = rootComponentName.trim();

    if (!trimmedName) {
      setRootComponentError('Component name is required.');
      return;
    }

    const hasDuplicateName = state.product.components.some(
      (component) =>
        component.parentId === null && component.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );

    if (hasDuplicateName) {
      setRootComponentError('A root component with this name already exists.');
      return;
    }

    const nextComponentId = createId(
      'comp',
      new Set(state.product.components.map((component) => component.id)),
    );

    setState((current) => ({
      ...current,
      product: {
        ...current.product,
        components: [
          ...current.product.components,
          {
            id: nextComponentId,
            name: trimmedName,
            parentId: null,
            category: 'system',
            stage: 'baseline',
          },
        ],
      },
    }));
    setSelectedComponentId(nextComponentId);
    closeRootModal();
  };

  const handleCreateChildComponent = () => {
    const trimmedName = childComponentName.trim();
    const parentComponent = childParentId ? componentById.get(childParentId) : undefined;

    if (!parentComponent) {
      setChildComponentError('Select a parent component before adding a child.');
      return;
    }

    if (!trimmedName) {
      setChildComponentError('Component name is required.');
      return;
    }

    const hasDuplicateName = state.product.components.some(
      (component) =>
        component.parentId === parentComponent.id &&
        component.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );

    if (hasDuplicateName) {
      setChildComponentError('A child component with this name already exists.');
      return;
    }

    const nextComponentId = createId(
      'comp',
      new Set(state.product.components.map((component) => component.id)),
    );

    setState((current) => ({
      ...current,
      product: {
        ...current.product,
        components: [
          ...current.product.components,
          {
            id: nextComponentId,
            name: trimmedName,
            parentId: parentComponent.id,
            category: inferChildCategory(parentComponent.category),
            stage: parentComponent.stage,
          },
        ],
      },
    }));
    setSelectedComponentId(nextComponentId);
    closeChildModal();
  };

  const handleCreateParameter = () => {
    const trimmedName = parameterName.trim();

    if (!selectedComponent) {
      setParameterError('Select a component before adding a parameter.');
      return;
    }

    if (!trimmedName) {
      setParameterError('Parameter name is required.');
      return;
    }

    const hasDuplicateName = state.product.parameters.some(
      (parameter) =>
        parameter.componentId === selectedComponent.id &&
        parameter.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );

    if (hasDuplicateName) {
      setParameterError('A parameter with this name already exists on this component.');
      return;
    }

    const nextParameterId = createId(
      'param',
      new Set(state.product.parameters.map((parameter) => parameter.id)),
    );

    setState((current) => ({
      ...current,
      product: {
        ...current.product,
        parameters: [
          ...current.product.parameters,
          {
            id: nextParameterId,
            componentId: selectedComponent.id,
            name: trimmedName,
            unit: '',
            baselineValue: 0,
            changeable: true,
          },
        ],
      },
    }));
    closeParameterModal();
  };

  const handleCreateDependency = () => {
    const { sourceComponentId, sourceParameterId, targetComponentId, targetParameterId } = dependencyDraft;

    if (!sourceComponentId || !sourceParameterId || !targetComponentId || !targetParameterId) {
      setDependencyError('All dependency fields are required.');
      return;
    }

    if (sourceParameterId === targetParameterId) {
      setDependencyError('Source and target parameters must be different.');
      return;
    }

    const nextDependencyId = createId(
      'link',
      new Set(state.product.parameterLinks.map((dependency) => dependency.id)),
    );

    setState((current) => ({
      ...current,
      product: {
        ...current.product,
        parameterLinks: [
          ...current.product.parameterLinks,
          {
            id: nextDependencyId,
            sourceComponentId,
            sourceParameterId,
            targetComponentId,
            targetParameterId,
            relation: 'functional',
            expression: '',
            impactWeight: 0.5,
          },
        ],
      },
    }));
    closeDependencyModal();
  };

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,_rgba(15,23,42,1)_0%,_rgba(30,41,59,0.98)_52%,_rgba(120,53,15,0.96)_100%)] px-6 py-6 text-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.85)]">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_center,_rgba(251,191,36,0.28),_transparent_62%)] lg:block" />
        <div className="relative space-y-5">
          <div className="max-w-3xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/80">
              Shared Modeling Workspace
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">产品结构建模</h1>
            <p className="text-sm text-slate-300">
              将产品层级、组件参数和参数传播链路收敛到同一份工作区模型，为知识图谱和变更传播分析提供统一输入。
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">组件总数</p>
              <p className="mt-2 text-2xl font-semibold">{state.product.components.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">参数总数</p>
              <p className="mt-2 text-2xl font-semibold">{state.product.parameters.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">依赖链路</p>
              <p className="mt-2 text-2xl font-semibold">{state.product.parameterLinks.length}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr_1.1fr]">
        <BomTreePanel
          tree={tree}
          selectedId={selectedComponent?.id ?? null}
          onSelect={setSelectedComponentId}
          onAddRoot={openRootModal}
          onAddChild={openChildModal}
        />
        <ParameterPanel
          component={selectedComponent}
          parameters={selectedParameters}
          inboundDependencyCount={inboundDependencyCount}
          outboundDependencyCount={outboundDependencyCount}
          canAddParameter={Boolean(selectedComponent)}
          onAddParameter={openParameterModal}
        />
        <DependencyPanel
          component={selectedComponent}
          parameters={selectedParameters}
          dependencies={selectedDependencies}
          componentById={componentById}
          parameterById={parameterById}
          onAddDependency={openDependencyModal}
        />
      </div>

      {isRootModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-root-component-title"
            className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.8)]"
          >
            <div className="space-y-2">
              <h2 id="add-root-component-title" className="text-xl font-semibold text-slate-950">
                Add Root Component
              </h2>
              <p className="text-sm text-slate-500">
                Create a new top-level component in the shared product model.
              </p>
            </div>

            <div className="mt-5 space-y-2">
              <label className="block text-sm font-medium text-slate-700" htmlFor="root-component-name">
                Component Name
              </label>
              <input
                id="root-component-name"
                value={rootComponentName}
                onChange={(event) => {
                  setRootComponentName(event.target.value);
                  if (rootComponentError) {
                    setRootComponentError(null);
                  }
                }}
                className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
              {rootComponentError ? (
                <p role="alert" className="text-sm text-rose-600">
                  {rootComponentError}
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeRootModal}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateRootComponent}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Save Component
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isChildModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-child-component-title"
            className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.8)]"
          >
            <div className="space-y-2">
              <h2 id="add-child-component-title" className="text-xl font-semibold text-slate-950">
                Add Child Component
              </h2>
              <p className="text-sm text-slate-500">
                Create a child component under {childParent?.name ?? 'the selected parent'}.
              </p>
            </div>

            <div className="mt-5 space-y-2">
              <label className="block text-sm font-medium text-slate-700" htmlFor="child-component-name">
                Component Name
              </label>
              <input
                id="child-component-name"
                value={childComponentName}
                onChange={(event) => {
                  setChildComponentName(event.target.value);
                  if (childComponentError) {
                    setChildComponentError(null);
                  }
                }}
                className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
              {childComponentError ? (
                <p role="alert" className="text-sm text-rose-600">
                  {childComponentError}
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeChildModal}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateChildComponent}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Save Component
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isParameterModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-parameter-title"
            className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.8)]"
          >
            <div className="space-y-2">
              <h2 id="add-parameter-title" className="text-xl font-semibold text-slate-950">
                Add Changeable Parameter
              </h2>
              <p className="text-sm text-slate-500">
                Create a new changeable parameter for {selectedComponent?.name ?? 'the selected component'}.
              </p>
            </div>

            <div className="mt-5 space-y-2">
              <label className="block text-sm font-medium text-slate-700" htmlFor="parameter-name">
                Parameter Name
              </label>
              <input
                id="parameter-name"
                value={parameterName}
                onChange={(event) => {
                  setParameterName(event.target.value);
                  if (parameterError) {
                    setParameterError(null);
                  }
                }}
                className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
              {parameterError ? (
                <p role="alert" className="text-sm text-rose-600">
                  {parameterError}
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeParameterModal}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateParameter}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Save Parameter
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isDependencyModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-dependency-title"
            className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.8)]"
          >
            <div className="space-y-2">
              <h2 id="add-dependency-title" className="text-xl font-semibold text-slate-950">
                Add Dependency
              </h2>
              <p className="text-sm text-slate-500">
                Link existing parameters in the shared workspace product model.
              </p>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Source Component</span>
                <select
                  value={dependencyDraft.sourceComponentId}
                  onChange={(event) => {
                    const nextSourceComponentId = event.target.value;
                    setDependencyDraft((current) => ({
                      ...current,
                      sourceComponentId: nextSourceComponentId,
                      sourceParameterId: state.product.parameters.some(
                        (parameter) =>
                          parameter.componentId === nextSourceComponentId &&
                          parameter.id === current.sourceParameterId,
                      )
                        ? current.sourceParameterId
                        : '',
                    }));
                    if (dependencyError) {
                      setDependencyError(null);
                    }
                  }}
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                >
                  <option value="">Select source component</option>
                  {state.product.components.map((component) => (
                    <option key={component.id} value={component.id}>
                      {component.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Source Parameter</span>
                <select
                  value={dependencyDraft.sourceParameterId}
                  onChange={(event) => {
                    setDependencyDraft((current) => ({
                      ...current,
                      sourceParameterId: event.target.value,
                    }));
                    if (dependencyError) {
                      setDependencyError(null);
                    }
                  }}
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                >
                  <option value="">Select source parameter</option>
                  {sourceParameterOptions.map((parameter) => (
                    <option key={parameter.id} value={parameter.id}>
                      {parameter.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Target Component</span>
                <select
                  value={dependencyDraft.targetComponentId}
                  onChange={(event) => {
                    const nextTargetComponentId = event.target.value;
                    setDependencyDraft((current) => ({
                      ...current,
                      targetComponentId: nextTargetComponentId,
                      targetParameterId: state.product.parameters.some(
                        (parameter) =>
                          parameter.componentId === nextTargetComponentId &&
                          parameter.id === current.targetParameterId,
                      )
                        ? current.targetParameterId
                        : '',
                    }));
                    if (dependencyError) {
                      setDependencyError(null);
                    }
                  }}
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                >
                  <option value="">Select target component</option>
                  {state.product.components.map((component) => (
                    <option key={component.id} value={component.id}>
                      {component.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Target Parameter</span>
                <select
                  value={dependencyDraft.targetParameterId}
                  onChange={(event) => {
                    setDependencyDraft((current) => ({
                      ...current,
                      targetParameterId: event.target.value,
                    }));
                    if (dependencyError) {
                      setDependencyError(null);
                    }
                  }}
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                >
                  <option value="">Select target parameter</option>
                  {targetParameterOptions.map((parameter) => (
                    <option key={parameter.id} value={parameter.id}>
                      {parameter.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {dependencyError ? (
              <p role="alert" className="mt-4 text-sm text-rose-600">
                {dependencyError}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDependencyModal}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateDependency}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Save Dependency
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
