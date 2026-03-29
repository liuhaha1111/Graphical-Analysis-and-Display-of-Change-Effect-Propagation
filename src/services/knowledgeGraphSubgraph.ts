import { GraphView } from './knowledgeGraph.service';

type BuildKnowledgeGraphSubgraphOptions = {
  focusNodeId: string | null;
  expandedNodeIds: string[];
};

export function buildKnowledgeGraphSubgraph(
  graph: GraphView,
  options: BuildKnowledgeGraphSubgraphOptions,
): GraphView {
  const { focusNodeId, expandedNodeIds } = options;
  if (!focusNodeId) {
    return { nodes: [], edges: [] };
  }

  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  if (!nodeIds.has(focusNodeId)) {
    return { nodes: [], edges: [] };
  }

  const centers = new Set<string>([focusNodeId]);
  for (const nodeId of expandedNodeIds) {
    if (nodeIds.has(nodeId)) {
      centers.add(nodeId);
    }
  }

  const localNodeIds = new Set<string>(centers);
  for (const edge of graph.edges) {
    if (centers.has(edge.source) || centers.has(edge.target)) {
      localNodeIds.add(edge.source);
      localNodeIds.add(edge.target);
    }
  }

  const nodes = graph.nodes.filter((node) => localNodeIds.has(node.id));
  const edges = graph.edges.filter(
    (edge) => localNodeIds.has(edge.source) && localNodeIds.has(edge.target),
  );

  return { nodes, edges };
}
