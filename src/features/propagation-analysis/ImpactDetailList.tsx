import PanelCard from '../../components/ui/PanelCard';
import { PropagationAnalysisResult } from '../../domain/analysis';
import { cn } from '../../lib/utils';

type ImpactDetailListProps = {
  analysis: PropagationAnalysisResult | null;
  selectedPathId: string | null;
  onSelectPath: (pathId: string) => void;
};

export default function ImpactDetailList({
  analysis,
  selectedPathId,
  onSelectPath,
}: ImpactDetailListProps) {
  const selectedPath = analysis?.propagationPaths.find((path) => path.id === selectedPathId);

  return (
    <PanelCard
      title="影响明细"
      eyebrow="Evidence Trail"
      description="保留高层结论、结果明细和路径导航，便于解释传播影响。"
      className="bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_36%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))]"
    >
      {!analysis ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          执行分析后会展示高亮结论和路径导航。
        </div>
      ) : (
        <div className="space-y-5">
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
              路径导航
            </h3>
            <div className="mt-3 space-y-2">
              {analysis.propagationPaths.map((path) => {
                const isSelected = path.id === selectedPathId;
                return (
                  <button
                    key={path.id}
                    type="button"
                    onClick={() => onSelectPath(path.id)}
                    className={cn(
                      'w-full rounded-2xl border px-3 py-3 text-left transition',
                      isSelected
                        ? 'border-amber-300 bg-amber-50 text-amber-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
                    )}
                  >
                    <p className="text-sm font-semibold">{path.id}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] opacity-80">
                      {path.stages.length} 个阶段
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
              高亮结论
            </h3>
            <div className="mt-3 space-y-2">
              {analysis.highlights.map((highlight) => (
                <p
                  key={highlight}
                  className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-3 text-sm text-amber-950"
                >
                  {highlight}
                </p>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
              结果明细
            </h3>
            <div className="mt-3 space-y-2">
              {analysis.details.map((detail) => (
                <p
                  key={detail}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700"
                >
                  {detail}
                </p>
              ))}
            </div>
          </section>

          {selectedPath ? (
            <section className="rounded-[24px] border border-slate-200 bg-slate-950 p-5 text-white">
              <h3 className="text-lg font-semibold">当前路径</h3>
              <p className="mt-1 text-sm text-slate-300">{selectedPath.id}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedPath.stages.map((stage, index) => (
                  <span
                    key={`${selectedPath.id}-${stage.kind}-${index}`}
                    className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-medium text-white"
                  >
                    {stage.label}
                  </span>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </PanelCard>
  );
}
