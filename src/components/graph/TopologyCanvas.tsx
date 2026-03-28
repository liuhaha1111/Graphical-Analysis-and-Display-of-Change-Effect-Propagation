import PanelCard from '../ui/PanelCard';
import { cn } from '../../lib/utils';
import { TopologyLayout } from '../../services/topologyLayout.service';
import GraphLegend from './GraphLegend';
import GraphToolbar from './GraphToolbar';

type TopologyCanvasProps = {
  layout: TopologyLayout;
  selectedNodeId: string | null;
  onSelect: (nodeId: string) => void;
  mode: 'explore' | 'propagation';
  highlightedEdgeIds?: string[];
  impactedNodeIds?: string[];
};

function edgeColor(edgeType: TopologyLayout['edges'][number]['type']) {
  if (edgeType === 'bom') return '#f59e0b';
  if (edgeType === 'sourcing') return '#0ea5e9';
  return '#14b8a6';
}

function edgeStroke(edgeId: string, highlightedEdges: Set<string>) {
  return highlightedEdges.has(edgeId) ? 2.4 : 1.4;
}

export default function TopologyCanvas({
  layout,
  selectedNodeId,
  onSelect,
  mode,
  highlightedEdgeIds = [],
  impactedNodeIds = [],
}: TopologyCanvasProps) {
  const nodeById = new Map(layout.nodes.map((node) => [node.id, node]));
  const highlightedEdges = new Set(highlightedEdgeIds);
  const impactedNodes = new Set(impactedNodeIds);
  const isEmpty = layout.nodes.length === 0;

  return (
    <PanelCard
      title="Topology Canvas"
      eyebrow="Shared Graph Surface"
      description="Reusable topology view for exploration and propagation overlays."
      headerSlot={<GraphToolbar mode={mode} nodeCount={layout.nodes.length} edgeCount={layout.edges.length} />}
      className="bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_34%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))]"
      contentClassName="space-y-4"
    >
      <GraphLegend mode={mode} />

      <div className="overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div
          className="relative rounded-xl border border-slate-200 bg-white"
          style={{ width: Math.max(layout.width, 900), height: Math.max(layout.height, 420) }}
        >
          <svg
            className="pointer-events-none absolute inset-0"
            width="100%"
            height="100%"
            viewBox={`0 0 ${Math.max(layout.width, 900)} ${Math.max(layout.height, 420)}`}
            preserveAspectRatio="xMinYMin meet"
            aria-hidden="true"
          >
            {layout.edges.map((edge) => {
              const source = nodeById.get(edge.source);
              const target = nodeById.get(edge.target);
              if (!source || !target) return null;

              const midX = (source.x + target.x) / 2;
              const midY = (source.y + target.y) / 2;
              const stroke = edgeColor(edge.type);

              return (
                <g key={edge.id}>
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={stroke}
                    strokeWidth={edgeStroke(edge.id, highlightedEdges)}
                    strokeOpacity={highlightedEdges.size === 0 || highlightedEdges.has(edge.id) ? 0.95 : 0.25}
                  />
                  <text x={midX} y={midY - 6} textAnchor="middle" fontSize="10" fill="#475569">
                    {edge.renderLabel}
                  </text>
                </g>
              );
            })}
          </svg>

          {isEmpty ? (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-slate-500">
              No topology nodes available for the current view.
            </div>
          ) : null}

          {layout.nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isImpacted = mode === 'propagation' && impactedNodes.has(node.id);
            const isComponent = node.kind === 'component';

            const baseTone = isComponent
              ? 'border-amber-200 bg-amber-50 text-amber-950'
              : 'border-sky-200 bg-sky-50 text-sky-950';
            const selectedTone = isComponent
              ? 'ring-2 ring-amber-400 shadow-[0_12px_25px_-18px_rgba(245,158,11,0.85)]'
              : 'ring-2 ring-sky-400 shadow-[0_12px_25px_-18px_rgba(14,165,233,0.85)]';

            return (
              <button
                key={node.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(node.id)}
                className={cn(
                  'absolute min-w-[140px] -translate-x-1/2 -translate-y-1/2 rounded-xl border px-3 py-2 text-left transition',
                  'hover:shadow-[0_12px_20px_-18px_rgba(15,23,42,0.7)]',
                  baseTone,
                  isSelected ? selectedTone : null,
                  isImpacted ? 'border-rose-300 bg-rose-50 text-rose-900' : null,
                )}
                style={{ left: node.x, top: node.y }}
              >
                <p className="text-xs font-semibold">{node.renderLabel}</p>
                <p className="mt-1 text-[11px] opacity-80">
                  {node.kind === 'component' ? node.category : node.role}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </PanelCard>
  );
}
