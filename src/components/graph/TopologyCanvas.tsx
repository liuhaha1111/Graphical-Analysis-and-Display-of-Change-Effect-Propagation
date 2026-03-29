import { useEffect, useRef, useState } from 'react';
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
  density?: 'default' | 'dense';
};

type DragState = {
  startX: number;
  startY: number;
  startScrollLeft: number;
  startScrollTop: number;
  moved: boolean;
};

type ViewportOffsetInput = {
  canvasHeight: number;
  canvasWidth: number;
  nodeX: number;
  nodeY: number;
  viewportHeight: number;
  viewportWidth: number;
};

const DRAG_THRESHOLD = 4;

function edgeColor(edgeType: TopologyLayout['edges'][number]['type']) {
  if (edgeType === 'assembly') return '#f59e0b';
  if (edgeType === 'configuration') return '#8b5cf6';
  if (edgeType === 'supply') return '#0ea5e9';
  if (edgeType === 'service') return '#22c55e';
  return '#14b8a6';
}

function edgeStroke(edgeId: string, highlightedEdges: Set<string>) {
  return highlightedEdges.has(edgeId) ? 2.8 : 1.2;
}

export function getViewportOffsetForNode({
  canvasHeight,
  canvasWidth,
  nodeX,
  nodeY,
  viewportHeight,
  viewportWidth,
}: ViewportOffsetInput) {
  const nextScrollLeft = Math.max(nodeX - viewportWidth / 2, 0);
  const nextScrollTop = Math.max(nodeY - viewportHeight / 2, 0);
  const maxScrollLeft = Math.max(canvasWidth - viewportWidth, 0);
  const maxScrollTop = Math.max(canvasHeight - viewportHeight, 0);

  return {
    left: Math.min(nextScrollLeft, maxScrollLeft),
    top: Math.min(nextScrollTop, maxScrollTop),
  };
}

export default function TopologyCanvas({
  layout,
  selectedNodeId,
  onSelect,
  mode,
  highlightedEdgeIds = [],
  impactedNodeIds = [],
  density,
}: TopologyCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const nodeById = new Map(layout.nodes.map((node) => [node.id, node]));
  const highlightedEdges = new Set(highlightedEdgeIds);
  const impactedNodes = new Set(impactedNodeIds);
  const isEmpty = layout.nodes.length === 0;
  const resolvedDensity = density ?? (layout.nodes.length > 500 ? 'dense' : 'default');
  const showEdgeLabels = resolvedDensity === 'default' && layout.edges.length <= 300;
  const canvasWidth = Math.max(layout.width, 960);
  const canvasHeight = Math.max(layout.height, 560);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || isEmpty) {
      return;
    }

    const targetNode = selectedNodeId
      ? layout.nodes.find((node) => node.id === selectedNodeId)
      : layout.nodes.find((node) => node.layer === 'source') ?? layout.nodes[0];

    if (!targetNode) {
      return;
    }

    const offset = getViewportOffsetForNode({
      canvasHeight,
      canvasWidth,
      nodeX: targetNode.x,
      nodeY: targetNode.y,
      viewportHeight: viewport.clientHeight,
      viewportWidth: viewport.clientWidth,
    });

    viewport.scrollLeft = offset.left;
    viewport.scrollTop = offset.top;
  }, [canvasHeight, canvasWidth, isEmpty, layout.nodes, selectedNodeId]);

  const stopDragging = () => {
    dragStateRef.current = null;
    setIsDragging(false);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    if (event.target instanceof Element && event.target.closest('button')) {
      return;
    }

    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: viewport.scrollLeft,
      startScrollTop: viewport.scrollTop,
      moved: false,
    };
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    const dragState = dragStateRef.current;

    if (!viewport || !dragState) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (!dragState.moved && Math.abs(deltaX) < DRAG_THRESHOLD && Math.abs(deltaY) < DRAG_THRESHOLD) {
      return;
    }

    if (!dragState.moved) {
      dragState.moved = true;
      setIsDragging(true);
    }

    viewport.scrollLeft = dragState.startScrollLeft - deltaX;
    viewport.scrollTop = dragState.startScrollTop - deltaY;
    event.preventDefault();
  };

  const handleMouseUp = () => {
    if (!dragStateRef.current) {
      return;
    }

    stopDragging();
  };

  const handleMouseLeave = () => {
    if (!dragStateRef.current) {
      return;
    }

    stopDragging();
  };

  return (
    <PanelCard
      title="Topology Canvas"
      eyebrow="Shared Graph Surface"
      description="Reusable topology view for exploration and propagation overlays."
      headerSlot={<GraphToolbar mode={mode} nodeCount={layout.nodes.length} edgeCount={layout.edges.length} />}
      className="min-w-0 w-full bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_34%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))]"
      contentClassName="space-y-4"
    >
      <GraphLegend mode={mode} />

      <div
        ref={viewportRef}
        data-testid="topology-canvas-viewport"
        className={cn(
          'h-[420px] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 select-none',
          isDragging ? 'cursor-grabbing' : 'cursor-grab',
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative rounded-xl border border-slate-200 bg-white" style={{ width: canvasWidth, height: canvasHeight }}>
          <svg
            className="pointer-events-none absolute inset-0"
            width="100%"
            height="100%"
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
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
              const isHighlighted = highlightedEdges.size === 0 || highlightedEdges.has(edge.id);

              return (
                <g key={edge.id}>
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={stroke}
                    strokeWidth={edgeStroke(edge.id, highlightedEdges)}
                    strokeOpacity={isHighlighted ? 0.9 : 0.25}
                  />
                  {showEdgeLabels ? (
                    <text x={midX} y={midY - 6} textAnchor="middle" fontSize="10" fill="#475569">
                      {edge.renderLabel}
                    </text>
                  ) : null}
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

            if (resolvedDensity === 'dense') {
              return (
                <div key={node.id}>
                  <button
                    type="button"
                    aria-label={node.renderLabel}
                    aria-pressed={isSelected}
                    onClick={() => onSelect(node.id)}
                    className={cn(
                      'absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border transition',
                      isComponent ? 'border-amber-200 bg-amber-500' : 'border-sky-200 bg-sky-500',
                      isSelected ? 'z-20 ring-4 ring-slate-200' : null,
                      isImpacted ? 'border-rose-300 bg-rose-500' : null,
                    )}
                    style={{ left: node.x, top: node.y }}
                  >
                    <span className="sr-only">{node.renderLabel}</span>
                  </button>
                  {isSelected || node.layer === 'source' ? (
                    <div
                      className="pointer-events-none absolute -translate-x-1/2 rounded-md bg-slate-950/90 px-2 py-1 text-[10px] font-medium text-white shadow-lg"
                      style={{ left: node.x, top: node.y - 18 }}
                    >
                      {node.renderLabel}
                    </div>
                  ) : null}
                </div>
              );
            }

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
                aria-label={node.renderLabel}
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
