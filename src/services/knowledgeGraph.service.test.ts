import { buildKnowledgeGraphView } from './knowledgeGraph.service';
import { demoWorkspace } from '../data/demoWorkspace';

describe('buildKnowledgeGraphView', () => {
  test('exposes 3012 real entities from the shared workspace', () => {
    const graph = buildKnowledgeGraphView(demoWorkspace);

    expect(graph.nodes).toHaveLength(3012);
    expect(graph.nodes.filter((node) => node.kind === 'component')).toHaveLength(2412);
    expect(graph.nodes.filter((node) => node.kind === 'supplier')).toHaveLength(600);
  });

  test('maps the graph into five relationship types with correct directions', () => {
    const graph = buildKnowledgeGraphView(demoWorkspace);

    expect(graph.edges.some((edge) => edge.type === 'assembly')).toBe(true);
    expect(graph.edges.some((edge) => edge.type === 'configuration')).toBe(true);
    expect(graph.edges.some((edge) => edge.type === 'supply')).toBe(true);
    expect(graph.edges.some((edge) => edge.type === 'service')).toBe(true);
    expect(graph.edges.some((edge) => edge.type === 'transaction')).toBe(true);

    const cpuNode = graph.nodes.find((node) => node.id === 'comp_cpu');
    const chipmakerNode = graph.nodes.find((node) => node.id === 'partner_chipmaker');
    expect(cpuNode).toBeDefined();
    expect(chipmakerNode).toBeDefined();

    const assemblyEdge = graph.edges.find(
      (edge) => edge.type === 'assembly' && edge.target === 'comp_cpu',
    );
    expect(assemblyEdge).toBeDefined();
    expect(assemblyEdge?.source).toBe('comp_motherboard');
    expect(assemblyEdge?.domain).toBe('product');

    const configurationEdge = graph.edges.find(
      (edge) => edge.type === 'configuration' && edge.source === 'comp_cpu' && edge.target === 'comp_battery',
    );
    expect(configurationEdge).toBeDefined();
    expect(configurationEdge?.domain).toBe('product');

    const supplyEdge = graph.edges.find(
      (edge) => edge.type === 'supply' && edge.source === 'comp_cpu' && edge.target === 'partner_chipmaker',
    );
    expect(supplyEdge).toBeDefined();
    expect(supplyEdge?.domain).toBe('cross-domain');

    const serviceEdge = graph.edges.find(
      (edge) => edge.type === 'service' && edge.source === 'comp_laptop' && edge.target === 'partner_boarder',
    );
    expect(serviceEdge).toBeDefined();
    expect(serviceEdge?.domain).toBe('cross-domain');

    const transactionEdge = graph.edges.find(
      (edge) => edge.type === 'transaction' && edge.source === 'partner_chipmaker' && edge.target === 'partner_boarder',
    );
    expect(transactionEdge).toBeDefined();
    expect(transactionEdge?.domain).toBe('supply');
  });
});
