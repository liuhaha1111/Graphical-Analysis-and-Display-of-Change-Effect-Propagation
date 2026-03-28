import PanelCard from '../../components/ui/PanelCard';
import { ProductComponent, ProductParameter } from '../../domain/workspace';

type ParameterPanelProps = {
  component?: ProductComponent;
  parameters: ProductParameter[];
  inboundDependencyCount: number;
  outboundDependencyCount: number;
};

const STAGE_LABELS: Record<NonNullable<ProductComponent['stage']>, string> = {
  baseline: '基线配置',
  prototype: '样机验证',
  released: '量产发布',
};

const CATEGORY_LABELS: Record<NonNullable<ProductComponent['category']>, string> = {
  system: '系统',
  assembly: '总成',
  module: '模块',
  component: '零件',
};

function formatRange(parameter: ProductParameter) {
  if (parameter.minValue === undefined && parameter.maxValue === undefined) {
    return '未定义';
  }

  if (parameter.minValue !== undefined && parameter.maxValue !== undefined) {
    return `${parameter.minValue} - ${parameter.maxValue} ${parameter.unit}`.trim();
  }

  if (parameter.minValue !== undefined) {
    return `>= ${parameter.minValue} ${parameter.unit}`.trim();
  }

  return `<= ${parameter.maxValue} ${parameter.unit}`.trim();
}

export default function ParameterPanel({
  component,
  parameters,
  inboundDependencyCount,
  outboundDependencyCount,
}: ParameterPanelProps) {
  return (
    <PanelCard
      title="组件参数"
      eyebrow="Parameter View"
      description="当前选中组件的可变参数、上下游依赖密度和边界条件。"
      className="bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(241,245,249,0.98))]"
    >
      {!component ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          从左侧产品结构树选择一个组件以查看参数基线。
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-[24px] border border-slate-200 bg-slate-950 p-5 text-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-200/80">
                  {CATEGORY_LABELS[component.category]}
                </p>
                <h3 className="mt-2 text-2xl font-semibold">{component.name}</h3>
                <p className="mt-2 max-w-xl text-sm text-slate-300">
                  {component.description ?? '当前组件尚未补充说明，后续可在共享模型中扩展。'}
                </p>
              </div>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white">
                {STAGE_LABELS[component.stage]}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">参数数</p>
                <p className="mt-2 text-2xl font-semibold">{parameters.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">传入依赖</p>
                <p className="mt-2 text-2xl font-semibold">{inboundDependencyCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">传出依赖</p>
                <p className="mt-2 text-2xl font-semibold">{outboundDependencyCount}</p>
              </div>
            </div>
          </div>

          {parameters.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              该组件当前没有参数定义。
            </div>
          ) : (
            <div className="space-y-3">
              {parameters.map((parameter) => (
                <article
                  key={parameter.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_36px_-32px_rgba(15,23,42,0.8)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">{parameter.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        基线值 {parameter.baselineValue} {parameter.unit}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        parameter.changeable
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {parameter.changeable ? '可变更' : '锁定'}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 px-3 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">约束范围</p>
                      <p className="mt-2 text-sm font-medium text-slate-700">{formatRange(parameter)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">参数 ID</p>
                      <p className="mt-2 text-sm font-medium text-slate-700">{parameter.id}</p>
                    </div>
                  </div>

                  {parameter.notes ? (
                    <p className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-3 text-sm text-amber-900">
                      {parameter.notes}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </PanelCard>
  );
}
