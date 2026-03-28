import { TopologyLayout } from '../../services/topologyLayout.service';
import TopologyCanvas from '../../components/graph/TopologyCanvas';

type KnowledgeGraphCanvasProps = {
  layout: TopologyLayout;
  selectedNodeId: string | null;
  onSelect: (nodeId: string) => void;
};

export default function KnowledgeGraphCanvas({
  layout,
  selectedNodeId,
  onSelect,
}: KnowledgeGraphCanvasProps) {
  return (
    <TopologyCanvas
      layout={layout}
      selectedNodeId={selectedNodeId}
      onSelect={onSelect}
      mode="explore"
    />
  );
}
