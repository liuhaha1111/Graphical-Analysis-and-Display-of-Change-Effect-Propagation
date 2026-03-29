import TopologyCanvas from '../../components/graph/TopologyCanvas';
import { PropagationAnalysisResult } from '../../domain/analysis';
import { GraphView } from '../../services/knowledgeGraph.service';
import { buildPropagationOverlay } from '../../services/propagationOverlay.service';
import { TopologyLayout } from '../../services/topologyLayout.service';

type PropagationCanvasProps = {
  graph: GraphView;
  layout: TopologyLayout;
  analysis: PropagationAnalysisResult | null;
  selectedPathId: string | null;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
};

export default function PropagationCanvas({
  graph,
  layout,
  analysis,
  selectedPathId,
  selectedNodeId,
  onSelectNode,
}: PropagationCanvasProps) {
  const overlay = buildPropagationOverlay(analysis, selectedPathId, graph);

  return (
    <div className="min-w-0 space-y-3">
      {!analysis ? (
        <div
          data-testid="propagation-waiting-state"
          className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600"
        >
          Waiting for analysis. Run the deterministic propagation analysis to view impact overlays.
        </div>
      ) : null}
      <TopologyCanvas
        layout={layout}
        selectedNodeId={selectedNodeId}
        onSelect={onSelectNode}
        mode="propagation"
        highlightedEdgeIds={overlay.highlightedEdgeIds}
        impactedNodeIds={overlay.impactedNodeIds}
      />
    </div>
  );
}
