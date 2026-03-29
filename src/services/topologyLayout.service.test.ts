import { demoWorkspace } from '../data/demoWorkspace';
import { buildKnowledgeGraphView } from './knowledgeGraph.service';
import { buildTopologyLayout } from './topologyLayout.service';

describe('buildTopologyLayout', () => {
  test('assigns stable layers and grid coordinates for large graphs', () => {
    const graph = buildKnowledgeGraphView(demoWorkspace);
    const layout = buildTopologyLayout(graph, {
      sourceNodeId: 'comp_cpu',
    });

    expect(layout.nodes.length).toBe(graph.nodes.length);
    expect(layout.edges).toEqual(graph.edges);
    expect(layout.nodes.every((node) => typeof node.x === 'number')).toBe(true);
    expect(layout.nodes.every((node) => typeof node.y === 'number')).toBe(true);
    expect(layout.nodes.some((node) => node.layer === 'source')).toBe(true);
    expect(layout.nodes.some((node) => node.layer === 'product')).toBe(true);
    expect(layout.nodes.some((node) => node.layer === 'supply')).toBe(true);

    const sourceNode = layout.nodes.find((node) => node.id === 'comp_cpu');
    const productNode = layout.nodes.find((node) => node.id === 'comp_battery');
    const supplierNode = layout.nodes.find((node) => node.id === 'partner_chipmaker');

    expect(sourceNode?.layer).toBe('source');
    expect(productNode?.layer).toBe('product');
    expect(supplierNode?.layer).toBe('supply');
    expect((sourceNode?.x ?? 0) < (productNode?.x ?? 0)).toBe(true);
    expect((productNode?.x ?? 0) < (supplierNode?.x ?? 0)).toBe(true);

    const repeatedLayout = buildTopologyLayout(graph, {
      sourceNodeId: 'comp_cpu',
    });
    expect(repeatedLayout.nodes).toEqual(layout.nodes);
    expect(layout.width).toBeGreaterThan(1000);
    expect(layout.height).toBeGreaterThan(560);
  });
});
