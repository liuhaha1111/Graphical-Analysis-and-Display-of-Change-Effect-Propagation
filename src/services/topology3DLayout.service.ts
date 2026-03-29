import { TopologyLayout } from './topologyLayout.service';

export type Topology3DNode = TopologyLayout['nodes'][number] & {
  z: number;
};

export type Topology3DLayout = {
  nodes: Topology3DNode[];
  edges: TopologyLayout['edges'];
  width: number;
  height: number;
  depth: number;
};

function zByLayer(node: TopologyLayout['nodes'][number]): number {
  if (node.layer === 'source') {
    return 0;
  }

  if (node.layer === 'product') {
    if (node.kind === 'component') {
      if (node.category === 'system') return 0;
      if (node.category === 'assembly') return 24;
      if (node.category === 'module') return 48;
      return 72;
    }

    return 40;
  }

  if (node.kind === 'supplier') {
    if (node.role === 'supplier') return 160;
    if (node.role === 'assembler') return 180;
    return 200;
  }

  return 160;
}

export function buildTopology3DLayout(layout: TopologyLayout): Topology3DLayout {
  const nodes = layout.nodes.map((node) => ({
    ...node,
    z: zByLayer(node),
  }));

  const maxDepth = nodes.reduce((current, node) => Math.max(current, node.z), 0);

  return {
    nodes,
    edges: layout.edges,
    width: layout.width,
    height: layout.height,
    depth: maxDepth + 80,
  };
}
