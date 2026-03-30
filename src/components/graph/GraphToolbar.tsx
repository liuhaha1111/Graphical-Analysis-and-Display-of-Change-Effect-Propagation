import { displayEntityCount, displayRelationCount } from '../../services/graphDisplayMetrics';

type GraphToolbarProps = {
  mode: 'explore' | 'propagation';
  nodeCount: number;
  edgeCount: number;
};

export default function GraphToolbar({ mode, nodeCount, edgeCount }: GraphToolbarProps) {
  const modeLabel = mode === 'propagation' ? 'Propagation Mode' : 'Explore Mode';

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">
        {modeLabel}
      </span>
      <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs text-slate-100">
        {displayEntityCount(nodeCount)} nodes
      </span>
      <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs text-slate-100">
        {displayRelationCount(edgeCount)} edges
      </span>
    </div>
  );
}
