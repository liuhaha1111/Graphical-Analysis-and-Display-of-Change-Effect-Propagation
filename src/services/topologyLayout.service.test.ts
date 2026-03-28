import { demoWorkspace } from '../data/demoWorkspace';
import { buildKnowledgeGraphView } from './knowledgeGraph.service';
import { buildTopologyLayout } from './topologyLayout.service';

test('buildTopologyLayout assigns stable layers and coordinates', () => {
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
  expect(sourceNode?.layer).toBe('source');

  const supplierNode = layout.nodes.find((node) => node.id === 'partner_chipmaker');
  expect(supplierNode?.layer).toBe('supply');

  const repeatedLayout = buildTopologyLayout(graph, {
    sourceNodeId: 'comp_cpu',
  });
  expect(repeatedLayout.nodes).toEqual(layout.nodes);

  const supplyIds = layout.nodes
    .filter((node) => node.layer === 'supply')
    .map((node) => node.id);
  expect(supplyIds).toEqual([
    'partner_battery',
    'partner_chipmaker',
    'partner_boarder',
    'partner_distributor',
    'partner_logistics',
  ]);
});
