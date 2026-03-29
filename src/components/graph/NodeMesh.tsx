import { Html } from '@react-three/drei';
import { Topology3DSceneNode } from '../../services/topology3DScene.service';

type NodeMeshProps = {
  node: Topology3DSceneNode;
  isSelected: boolean;
  isFocused: boolean;
  onSelect: (nodeId: string) => void;
  onExpand: (nodeId: string) => void;
};

export default function NodeMesh({ node, isSelected, isFocused, onSelect, onExpand }: NodeMeshProps) {
  const isComponent = node.kind === 'component';
  const color = isComponent ? '#f59e0b' : '#0ea5e9';
  const emissive = isSelected ? '#ffffff' : isFocused ? '#7dd3fc' : '#111827';

  return (
    <mesh
      position={node.position}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(node.id);
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onExpand(node.id);
      }}
    >
      {isComponent ? <boxGeometry args={[0.45, 0.45, 0.45]} /> : <sphereGeometry args={[0.28, 20, 20]} />}
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={isSelected || isFocused ? 0.45 : 0.12}
      />
      {isSelected || isFocused ? (
        <Html distanceFactor={10} position={[0, 0.45, 0]} center>
          <div className="rounded-md bg-slate-950/90 px-2 py-1 text-[10px] font-medium text-white shadow-lg">
            {node.renderLabel}
          </div>
        </Html>
      ) : null}
    </mesh>
  );
}
