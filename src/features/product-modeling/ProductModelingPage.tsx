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

export default function ProductModelingPage() {
  const { state } = useWorkspace();
  const [selectedComponentId, setSelectedComponentId] = useState(() =>
    findInitialComponent(
      state.product.components,
      state.product.parameters,
      state.changeScenario.sourceComponentId,
    ),
  );

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
        />
        <ParameterPanel
          component={selectedComponent}
          parameters={selectedParameters}
          inboundDependencyCount={inboundDependencyCount}
          outboundDependencyCount={outboundDependencyCount}
        />
        <DependencyPanel
          component={selectedComponent}
          parameters={selectedParameters}
          dependencies={selectedDependencies}
          componentById={componentById}
          parameterById={parameterById}
        />
      </div>
    </div>
  );
}
