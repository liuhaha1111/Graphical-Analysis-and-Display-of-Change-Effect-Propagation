import { Topology3DLayout, Topology3DNode } from './topology3DLayout.service';

export type Topology3DSceneNode = Topology3DNode & {
  position: [number, number, number];
};

export type Topology3DSceneLayout = {
  nodes: Topology3DSceneNode[];
  edges: Topology3DLayout['edges'];
  width: number;
  height: number;
  depth: number;
  cameraPosition: [number, number, number];
};

const TARGET_HALF_SPAN = {
  x: 7.5,
  y: 4.8,
  z: 5.5,
} as const;

const DEFAULT_CAMERA_POSITION: [number, number, number] = [0, 0, 14];

function normalizeToSceneRange(
  value: number,
  min: number,
  max: number,
  halfSpan: number,
): number {
  if (max === min) {
    return 0;
  }

  return ((value - min) / (max - min) - 0.5) * halfSpan * 2;
}

function canonicalZero(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}

function projectNodePosition(
  node: Topology3DNode,
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  },
): [number, number, number] {
  return [
    canonicalZero(normalizeToSceneRange(node.x, bounds.minX, bounds.maxX, TARGET_HALF_SPAN.x)),
    canonicalZero(-normalizeToSceneRange(node.y, bounds.minY, bounds.maxY, TARGET_HALF_SPAN.y)),
    canonicalZero(normalizeToSceneRange(node.z, bounds.minZ, bounds.maxZ, TARGET_HALF_SPAN.z)),
  ];
}

export function buildTopology3DSceneLayout(layout: Topology3DLayout): Topology3DSceneLayout {
  if (layout.nodes.length === 0) {
    return {
      edges: layout.edges,
      width: layout.width,
      height: layout.height,
      depth: layout.depth,
      cameraPosition: DEFAULT_CAMERA_POSITION,
      nodes: [],
    };
  }

  const bounds = layout.nodes.reduce(
    (current, node) => ({
      minX: Math.min(current.minX, node.x),
      maxX: Math.max(current.maxX, node.x),
      minY: Math.min(current.minY, node.y),
      maxY: Math.max(current.maxY, node.y),
      minZ: Math.min(current.minZ, node.z),
      maxZ: Math.max(current.maxZ, node.z),
    }),
    {
      minX: layout.nodes[0].x,
      maxX: layout.nodes[0].x,
      minY: layout.nodes[0].y,
      maxY: layout.nodes[0].y,
      minZ: layout.nodes[0].z,
      maxZ: layout.nodes[0].z,
    },
  );

  return {
    edges: layout.edges,
    width: layout.width,
    height: layout.height,
    depth: layout.depth,
    cameraPosition: DEFAULT_CAMERA_POSITION,
    nodes: layout.nodes.map<Topology3DSceneNode>((node) => ({
      ...node,
      position: projectNodePosition(node, bounds),
    })),
  };
}
