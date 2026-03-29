import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import PanelCard from '../ui/PanelCard';
import { buildTopology3DSceneLayout } from '../../services/topology3DScene.service';
import { Topology3DLayout } from '../../services/topology3DLayout.service';
import EdgeLine3D from './EdgeLine3D';
import NodeMesh from './NodeMesh';

type TopologyScene3DProps = {
  layout: Topology3DLayout;
  selectedNodeId: string | null;
  focusNodeId: string | null;
  onSelect: (nodeId: string) => void;
  onExpand: (nodeId: string) => void;
  onResetView: () => void;
};

function canUseWebGL() {
  return typeof window !== 'undefined' && 'WebGLRenderingContext' in window;
}

function SceneSurface({
  layout,
  selectedNodeId,
  focusNodeId,
  onSelect,
  onExpand,
}: Omit<TopologyScene3DProps, 'onResetView'>) {
  const sceneLayout = buildTopology3DSceneLayout(layout);
  const nodeById = new Map(sceneLayout.nodes.map((node) => [node.id, node]));

  if (sceneLayout.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-300">
        当前筛选下无可见节点
      </div>
    );
  }

  if (!canUseWebGL()) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="space-y-2 text-center text-sm">
          <p>3D scene scaffold ready</p>
          <p>Nodes: {sceneLayout.nodes.length}</p>
          <p>Edges: {sceneLayout.edges.length}</p>
          <p>Focus: {focusNodeId ?? 'none'}</p>
          <p>Selected: {selectedNodeId ?? 'none'}</p>
        </div>
      </div>
    );
  }

  return (
    <Canvas className="h-full w-full" style={{ width: '100%', height: '100%' }}>
      <PerspectiveCamera makeDefault position={sceneLayout.cameraPosition} fov={50} />
      <ambientLight intensity={1.6} />
      <directionalLight position={[8, 10, 12]} intensity={2.2} />
      <directionalLight position={[-8, -6, 8]} intensity={1.2} />
      {sceneLayout.edges.map((edge) => {
        const source = nodeById.get(edge.source);
        const target = nodeById.get(edge.target);
        if (!source || !target) {
          return null;
        }

        return <EdgeLine3D key={edge.id} edge={edge} source={source} target={target} />;
      })}
      {sceneLayout.nodes.map((node) => (
        <NodeMesh
          key={node.id}
          node={node}
          isSelected={selectedNodeId === node.id}
          isFocused={focusNodeId === node.id}
          onSelect={onSelect}
          onExpand={onExpand}
        />
      ))}
      <OrbitControls enablePan enableRotate enableZoom />
    </Canvas>
  );
}

export default function TopologyScene3D({
  layout,
  selectedNodeId,
  focusNodeId,
  onSelect,
  onExpand,
  onResetView,
}: TopologyScene3DProps) {
  return (
    <PanelCard
      title="3D Topology Scene"
      eyebrow="Knowledge Graph 3D"
      description="Three-dimensional local subgraph scene for exploration and progressive expansion."
      className="bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_34%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))]"
    >
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onResetView}
          className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700"
        >
          重置视角
        </button>
        <button
          type="button"
          onClick={() => {
            if (selectedNodeId) {
              onExpand(selectedNodeId);
            }
          }}
          disabled={!selectedNodeId}
          className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          展开一跳
        </button>
      </div>

      <div
        data-testid="knowledge-graph-3d-scene"
        className="h-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 text-slate-200"
      >
        <SceneSurface
          layout={layout}
          selectedNodeId={selectedNodeId}
          focusNodeId={focusNodeId}
          onSelect={onSelect}
          onExpand={onExpand}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">当前子图节点</p>
        {layout.nodes.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">当前筛选下无可见节点</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {layout.nodes.map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => onSelect(node.id)}
                className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
              >
                {node.renderLabel}
              </button>
            ))}
          </div>
        )}
      </div>
    </PanelCard>
  );
}
