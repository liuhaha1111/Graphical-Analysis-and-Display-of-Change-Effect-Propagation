import { Line } from '@react-three/drei';
import { GraphEdge } from '../../services/knowledgeGraph.service';
import { Topology3DSceneNode } from '../../services/topology3DScene.service';

type EdgeLine3DProps = {
  edge: GraphEdge;
  source: Topology3DSceneNode;
  target: Topology3DSceneNode;
};

function edgeColor(edgeType: GraphEdge['type']) {
  if (edgeType === 'assembly') return '#f59e0b';
  if (edgeType === 'configuration') return '#8b5cf6';
  if (edgeType === 'supply') return '#0ea5e9';
  if (edgeType === 'service') return '#22c55e';
  return '#14b8a6';
}

export default function EdgeLine3D({ edge, source, target }: EdgeLine3DProps) {
  return <Line points={[source.position, target.position]} color={edgeColor(edge.type)} lineWidth={1.2} />;
}
