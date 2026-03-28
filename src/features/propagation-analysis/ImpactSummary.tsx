import MetricCard from '../../components/ui/MetricCard';
import PanelCard from '../../components/ui/PanelCard';
import { PropagationAnalysisResult } from '../../domain/analysis';

type ImpactSummaryProps = {
  analysis: PropagationAnalysisResult | null;
};

export default function ImpactSummary({ analysis }: ImpactSummaryProps) {
  return (
    <PanelCard
      title="Propagation Summary"
      eyebrow="Impact Summary"
      description="Deterministic summary metrics for impact, cost, and schedule risk."
      className="bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(241,245,249,0.98))]"
    >
      {!analysis ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          Run analysis to render summary metrics.
        </div>
      ) : (
        <div className="space-y-4">
          <div
            data-testid="impact-summary-risk-level"
            className="rounded-[24px] border border-slate-200 bg-slate-950 p-5 text-white"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/80">
              Risk Level
            </p>
            <p className="mt-2 text-3xl font-semibold">{analysis.riskLevel}</p>
            <p className="mt-2 text-sm text-slate-300">
              Identified {analysis.propagationPaths.length} propagation paths.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div data-testid="impact-summary-metric-affected-nodes">
              <MetricCard label="Affected Nodes" value={analysis.affectedNodeCount} />
            </div>
            <div data-testid="impact-summary-metric-overall-score">
              <MetricCard label="Overall Impact Score" value={analysis.overallScore.toFixed(1)} />
            </div>
            <div data-testid="impact-summary-metric-cost-risk">
              <MetricCard label="Cost Risk" value={analysis.costRisk.toFixed(1)} />
            </div>
            <div data-testid="impact-summary-metric-schedule-risk">
              <MetricCard label="Schedule Risk" value={analysis.scheduleRisk.toFixed(1)} />
            </div>
          </div>
        </div>
      )}
    </PanelCard>
  );
}
