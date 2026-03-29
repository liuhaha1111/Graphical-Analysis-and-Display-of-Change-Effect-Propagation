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

const ROW_START_Y = 96;
const LAYER_GAP = 180;
const COLUMN_GAP = 112;
const HEIGHT_PADDING = 180;
const WIDTH_PADDING = 260;

const MAX_ROWS: Record<TopologyLayer, number> = {
  source: 24,
  product: 72,
  supply: 72,
};

const ROW_GAP: Record<TopologyLayer, number> = {
  source: 72,
  product: 30,
  supply: 30,
};

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

  return a.id.localeCompare(b.id);
}

function columnCount(nodeCount: number, layer: TopologyLayer): number {
  return Math.max(1, Math.ceil(nodeCount / MAX_ROWS[layer]));
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

  const sourceNodes = grouped.get('source') ?? [];
  const productNodes = grouped.get('product') ?? [];
  const supplyNodes = grouped.get('supply') ?? [];

  const sourceStartX = 140;
  const productStartX = 320;
  const productColumnCount = columnCount(productNodes.length, 'product');
  const supplyStartX = productStartX + productColumnCount * COLUMN_GAP + LAYER_GAP;

  const layerStartX: Record<TopologyLayer, number> = {
    source: sourceStartX,
    product: productStartX,
    supply: supplyStartX,
  };

  const layoutNodes: TopologyLayoutNode[] = [];
  let maxHeight = 0;

  (['source', 'product', 'supply'] as const).forEach((layer) => {
    const nodes = grouped.get(layer) ?? [];
    const maxRows = MAX_ROWS[layer];
    const rowGap = ROW_GAP[layer];

    nodes.forEach((node, index) => {
      const column = Math.floor(index / maxRows);
      const row = index % maxRows;
      const x = layerStartX[layer] + column * COLUMN_GAP;
      const y = ROW_START_Y + row * rowGap;

      maxHeight = Math.max(maxHeight, y);
      layoutNodes.push({
        ...node,
        layer,
        column,
        row,
        x,
        y,
      });
    });
  });

  const supplyColumnCount = columnCount(supplyNodes.length, 'supply');
  const width = supplyStartX + supplyColumnCount * COLUMN_GAP + WIDTH_PADDING;
  const height = Math.max(maxHeight + HEIGHT_PADDING, 560);

  return {
    nodes: layoutNodes,
    edges: graph.edges,
    width,
    height,
  };
}
