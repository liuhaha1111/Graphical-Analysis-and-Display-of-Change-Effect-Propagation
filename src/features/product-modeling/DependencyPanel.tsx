import PanelCard from '../../components/ui/PanelCard';
import {
  ParameterLink,
  ProductComponent,
  ProductParameter,
} from '../../domain/workspace';

type DependencyPanelProps = {
  component?: ProductComponent;
  parameters: ProductParameter[];
  dependencies: ParameterLink[];
  componentById: Map<string, ProductComponent>;
  parameterById: Map<string, ProductParameter>;
};

function getComponentName(componentById: Map<string, ProductComponent>, componentId: string) {
  return componentById.get(componentId)?.name ?? componentId;
}

function getParameterName(parameterById: Map<string, ProductParameter>, parameterId: string) {
  return parameterById.get(parameterId)?.name ?? parameterId;
}

export default function DependencyPanel({
  component,
  parameters,
  dependencies,
  componentById,
  parameterById,
}: DependencyPanelProps) {
  const inboundDependencies = component
    ? dependencies.filter((dependency) => dependency.targetComponentId === component.id)
    : [];
  const outboundDependencies = component
    ? dependencies.filter((dependency) => dependency.sourceComponentId === component.id)
    : [];
  const changeableParameters = parameters.filter((parameter) => parameter.changeable);
  const boundedParameters = parameters.filter(
    (parameter) => parameter.minValue !== undefined || parameter.maxValue !== undefined,
  );
  const notedParameters = parameters
    .filter((parameter) => parameter.notes)
    .slice(0, 3)
    .map((parameter) => `${parameter.name}: ${parameter.notes}`);

  return (
    <PanelCard
      title="参数依赖关系"
      eyebrow="Dependency Map"
      description="共享参数链路定义了跨组件传播的方向、类型和影响权重。"
      className="bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.14),_transparent_34%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))]"
    >
      <div className="space-y-5">
        {!component ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            选择组件后会展示与之相关的参数传播链路。
          </div>
        ) : dependencies.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            {component.name} 当前没有参数依赖。
          </div>
        ) : (
          <div className="space-y-3">
            {dependencies.map((dependency) => (
              <article
                key={dependency.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.8)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {getComponentName(componentById, dependency.sourceComponentId)} ·{' '}
                      {getParameterName(parameterById, dependency.sourceParameterId)} →{' '}
                      {getComponentName(componentById, dependency.targetComponentId)} ·{' '}
                      {getParameterName(parameterById, dependency.targetParameterId)}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">{dependency.expression}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700">
                      {dependency.relation}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      影响权重 {dependency.impactWeight.toFixed(2)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <section className="rounded-[24px] border border-slate-200 bg-slate-950 p-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">变更约束摘要</h3>
              <p className="mt-1 text-sm text-slate-300">
                将参数数量、边界范围与依赖方向压缩成建模摘要，作为后续传播分析的输入背景。
              </p>
            </div>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white">
              {component ? component.name : '未选择组件'}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">可调参数</p>
              <p className="mt-2 text-2xl font-semibold">{changeableParameters.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">边界参数</p>
              <p className="mt-2 text-2xl font-semibold">{boundedParameters.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">传入链路</p>
              <p className="mt-2 text-2xl font-semibold">{inboundDependencies.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">传出链路</p>
              <p className="mt-2 text-2xl font-semibold">{outboundDependencies.length}</p>
            </div>
          </div>

          {notedParameters.length > 0 ? (
            <div className="mt-5 space-y-2">
              {notedParameters.map((note) => (
                <p
                  key={note}
                  className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-3 py-3 text-sm text-amber-50"
                >
                  {note}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-2xl border border-dashed border-white/15 px-3 py-3 text-sm text-slate-300">
              当前组件暂无额外参数备注。
            </p>
          )}
        </section>
      </div>
    </PanelCard>
  );
}
