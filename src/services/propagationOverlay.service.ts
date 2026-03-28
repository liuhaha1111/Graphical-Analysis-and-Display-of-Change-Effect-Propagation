import { PathStage, PropagationAnalysisResult } from '../domain/analysis';
import { GraphEdge, GraphView } from './knowledgeGraph.service';

export type PropagationOverlay = {
  impactedNodeIds: string[];
  highlightedEdgeIds: string[];
};

function toSortedArray(items: Iterable<string>): string[] {
  return Array.from(items).sort((a, b) => a.localeCompare(b));
}

type StageTransition =
  | 'component->component'
  | 'component->partner'
  | 'parameter->partner'
  | 'partner->partner';

const SUPPORTED_STAGE_TRANSITIONS: ReadonlySet<StageTransition> = new Set([
  'component->component',
  'component->partner',
  'parameter->partner',
  'partner->partner',
]);

function edgeIdFromRouteStage(stage: PathStage): string | null {
  if (stage.kind !== 'route') return null;
  return `route_${stage.routeId}`;
}

function getStageTransition(previous: PathStage, current: PathStage): StageTransition | null {
  const transition = `${previous.kind}->${current.kind}`;
  return SUPPORTED_STAGE_TRANSITIONS.has(transition as StageTransition)
    ? (transition as StageTransition)
    : null;
}

function matchEdgeFromSupportedStages(
  graphEdges: GraphEdge[],
  transition: StageTransition,
  previous: PathStage,
  current: PathStage,
): string | null {
  if (transition === 'component->component') {
    if (previous.kind !== 'component' || current.kind !== 'component') return null;
    const edge = graphEdges.find(
      (candidate) =>
        candidate.type === 'bom' &&
        candidate.source === previous.componentId &&
        candidate.target === current.componentId,
    );
    return edge?.id ?? null;
  }

  if (transition === 'component->partner') {
    if (previous.kind !== 'component' || current.kind !== 'partner') return null;
    const edge = graphEdges.find(
      (candidate) =>
        candidate.type === 'sourcing' &&
        candidate.source === previous.componentId &&
        candidate.target === current.partnerId,
    );
    return edge?.id ?? null;
  }

  if (transition === 'parameter->partner') {
    if (previous.kind !== 'parameter' || current.kind !== 'partner') return null;
    const edge = graphEdges.find(
      (candidate) =>
        candidate.type === 'sourcing' &&
        candidate.source === previous.componentId &&
        candidate.target === current.partnerId,
    );
    return edge?.id ?? null;
  }

  if (transition === 'partner->partner') {
    if (previous.kind !== 'partner' || current.kind !== 'partner') return null;
    const edge = graphEdges.find(
      (candidate) =>
        candidate.type === 'route' &&
        candidate.source === previous.partnerId &&
        candidate.target === current.partnerId,
    );
    return edge?.id ?? null;
  }

  return null;
}

export function buildPropagationOverlay(
  analysis: PropagationAnalysisResult | null,
  selectedPathId: string | null,
  graph: GraphView,
): PropagationOverlay {
  if (!analysis) {
    return {
      impactedNodeIds: [],
      highlightedEdgeIds: [],
    };
  }

  const impactedNodeIds = new Set<string>();
  analysis.propagationPaths.forEach((path) => {
    path.stages.forEach((stage) => {
      if (stage.kind === 'component') impactedNodeIds.add(stage.componentId);
      if (stage.kind === 'partner') impactedNodeIds.add(stage.partnerId);
      if (stage.kind === 'parameter') impactedNodeIds.add(stage.componentId);
    });
  });

  const selectedPath =
    analysis.propagationPaths.find((path) => path.id === selectedPathId) ??
    analysis.propagationPaths[0];

  if (!selectedPath) {
    return {
      impactedNodeIds: toSortedArray(impactedNodeIds),
      highlightedEdgeIds: [],
    };
  }

  const highlightedEdgeIds = new Set<string>();
  selectedPath.stages.forEach((stage, index) => {
    const routeEdgeId = edgeIdFromRouteStage(stage);
    if (routeEdgeId) {
      highlightedEdgeIds.add(routeEdgeId);
    }

    if (index === 0) return;
    const previous = selectedPath.stages[index - 1];
    const transition = getStageTransition(previous, stage);
    if (!transition) {
      // Unsupported stage transitions are intentionally ignored in the overlay.
      return;
    }

    const matchedEdgeId = matchEdgeFromSupportedStages(graph.edges, transition, previous, stage);
    if (matchedEdgeId) {
      highlightedEdgeIds.add(matchedEdgeId);
    }
  });

  return {
    impactedNodeIds: toSortedArray(impactedNodeIds),
    highlightedEdgeIds: toSortedArray(highlightedEdgeIds),
  };
}
