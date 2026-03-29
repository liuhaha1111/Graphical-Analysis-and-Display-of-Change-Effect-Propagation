import { GraphEdge, GraphView } from './knowledgeGraph.service';

export function filterKnowledgeGraphByRelationTypes(
  graph: GraphView,
  relationTypes: GraphEdge['type'][],
): GraphView {
  if (relationTypes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const allowed = new Set(relationTypes);
  const edges = graph.edges.filter((edge) => allowed.has(edge.type));
  const visibleNodeIds = new Set(edges.flatMap((edge) => [edge.source, edge.target]));
  const nodes = graph.nodes.filter((node) => visibleNodeIds.has(node.id));

  return {
    nodes,
    edges,
  };
}
