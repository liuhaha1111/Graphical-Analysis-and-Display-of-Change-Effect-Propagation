import { GraphEdge, GraphNode, GraphView } from './knowledgeGraph.service';

export type TopologyLayer = 'source' | 'product' | 'supply';

export type TopologyLayoutNode = GraphNode & {
  layer: TopologyLayer;
  column: number;
  row: number;
  x: number;
  y: number;
};

export type TopologyLayout = {
  nodes: TopologyLayoutNode[];
  edges: GraphEdge[];
  width: number;
  height: number;
};

export type BuildTopologyLayoutOptions = {
  sourceNodeId?: string;
};

const COLUMN_X = {
  source: 160,
  product: 440,
  supply: 720,
} as const;

const ROW_START_Y = 120;
const ROW_GAP = 110;
const WIDTH_PADDING = 200;
const HEIGHT_PADDING = 140;

function resolveLayer(node: GraphNode, options: BuildTopologyLayoutOptions): TopologyLayer {
  if (options.sourceNodeId && node.id === options.sourceNodeId) {
    return 'source';
  }

  return node.domain === 'product' ? 'product' : 'supply';
}

function compareNodes(a: GraphNode, b: GraphNode): number {
  if (a.kind !== b.kind) {
    return a.kind === 'component' ? -1 : 1;
  }

  if (a.kind === 'supplier' && b.kind === 'supplier') {
    const roleRank = {
      supplier: 0,
      assembler: 1,
      logistics: 2,
    } as const;
    const roleComparison = roleRank[a.role] - roleRank[b.role];
    if (roleComparison !== 0) {
      return roleComparison;
    }
  }

  if (a.kind === 'component' && b.kind === 'component') {
    const categoryRank = {
      system: 0,
      assembly: 1,
      module: 2,
      component: 3,
    } as const;
    const categoryComparison = categoryRank[a.category] - categoryRank[b.category];
    if (categoryComparison !== 0) {
      return categoryComparison;
    }
  }

  return a.id.localeCompare(b.id);
}

export function buildTopologyLayout(
  graph: GraphView,
  options: BuildTopologyLayoutOptions = {},
): TopologyLayout {
  const grouped = new Map<TopologyLayer, GraphNode[]>([
    ['source', []],
    ['product', []],
    ['supply', []],
  ]);

  const sortedNodes = [...graph.nodes].sort(compareNodes);
  for (const node of sortedNodes) {
    const layer = resolveLayer(node, options);
    grouped.get(layer)?.push(node);
  }

  const layoutNodes: TopologyLayoutNode[] = [];
  let maxRowCount = 0;

  (['source', 'product', 'supply'] as const).forEach((layer, column) => {
    const nodes = grouped.get(layer) ?? [];
    maxRowCount = Math.max(maxRowCount, nodes.length);

    nodes.forEach((node, row) => {
      layoutNodes.push({
        ...node,
        layer,
        column,
        row,
        x: COLUMN_X[layer],
        y: ROW_START_Y + row * ROW_GAP,
      });
    });
  });

  return {
    nodes: layoutNodes,
    edges: graph.edges,
    width: Math.max(...Object.values(COLUMN_X)) + WIDTH_PADDING,
    height: ROW_START_Y + Math.max(0, maxRowCount - 1) * ROW_GAP + HEIGHT_PADDING,
  };
}
