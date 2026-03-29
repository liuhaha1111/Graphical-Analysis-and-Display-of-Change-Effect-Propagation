import TopologyScene3D from '../../components/graph/TopologyScene3D';
import { Topology3DLayout } from '../../services/topology3DLayout.service';

type KnowledgeGraphCanvasProps = {
  layout: Topology3DLayout;
  selectedNodeId: string | null;
  focusNodeId: string | null;
  onSelect: (nodeId: string) => void;
  onExpand: (nodeId: string) => void;
  onResetView: () => void;
};

export default function KnowledgeGraphCanvas({
  layout,
  selectedNodeId,
  focusNodeId,
  onSelect,
  onExpand,
  onResetView,
}: KnowledgeGraphCanvasProps) {
  return (
    <TopologyScene3D
      layout={layout}
      selectedNodeId={selectedNodeId}
      focusNodeId={focusNodeId}
      onSelect={onSelect}
      onExpand={onExpand}
      onResetView={onResetView}
    />
  );
}
