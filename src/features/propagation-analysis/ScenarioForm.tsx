import { ChangeMagnitude, ChangeScenario, ChangeType } from '../../domain/analysis';
import { ProductComponent, ProductParameter } from '../../domain/workspace';
import PanelCard from '../../components/ui/PanelCard';

type ScenarioFormProps = {
  scenario: ChangeScenario;
  components: ProductComponent[];
  availableParameters: ProductParameter[];
  onScenarioChange: (updates: Partial<ChangeScenario>) => void;
  onComponentChange: (componentId: string) => void;
  onAnalyze: () => void;
};

const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  'spec-change': '规格变更',
  'cost-change': '成本变更',
  'schedule-change': '工期变更',
  'quality-change': '质量变更',
};

const MAGNITUDE_LABELS: Record<ChangeMagnitude, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '关键',
};

export default function ScenarioForm({
  scenario,
  components,
  availableParameters,
  onScenarioChange,
  onComponentChange,
  onAnalyze,
}: ScenarioFormProps) {
  return (
    <PanelCard
      title="变更场景注入"
      eyebrow="Scenario Setup"
      description="通过统一工作区状态设置变更源、变更类型和幅度，触发确定性传播计算。"
      className="bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(241,245,249,0.98))]"
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            源组件
          </span>
          <select
            value={scenario.sourceComponentId}
            onChange={(event) => onComponentChange(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          >
            {components.map((component) => (
              <option key={component.id} value={component.id}>
                {component.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            源参数
          </span>
          <select
            value={scenario.sourceParameterId}
            onChange={(event) => onScenarioChange({ sourceParameterId: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          >
            {availableParameters.map((parameter) => (
              <option key={parameter.id} value={parameter.id}>
                {parameter.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              变更类型
            </span>
            <select
              value={scenario.changeType}
              onChange={(event) =>
                onScenarioChange({ changeType: event.target.value as ChangeType })
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            >
              {(Object.entries(CHANGE_TYPE_LABELS) as Array<[ChangeType, string]>).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              变更幅度
            </span>
            <select
              value={scenario.changeMagnitude}
              onChange={(event) =>
                onScenarioChange({ changeMagnitude: event.target.value as ChangeMagnitude })
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            >
              {(Object.entries(MAGNITUDE_LABELS) as Array<[ChangeMagnitude, string]>).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            场景说明
          </span>
          <textarea
            value={scenario.rationale}
            onChange={(event) => onScenarioChange({ rationale: event.target.value })}
            className="min-h-28 w-full rounded-[24px] border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          />
        </label>

        <button
          type="button"
          onClick={onAnalyze}
          className="w-full rounded-[24px] bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          执行传播分析
        </button>
      </div>
    </PanelCard>
  );
}
