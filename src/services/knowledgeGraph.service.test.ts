import { buildKnowledgeGraphView } from './knowledgeGraph.service';
import { demoWorkspace } from '../data/demoWorkspace';

test('buildKnowledgeGraphView exposes typed nodes and edges with domain metadata', () => {
  const graph = buildKnowledgeGraphView(demoWorkspace);

  const cpuNode = graph.nodes.find((node) => node.id === 'comp_cpu');
  expect(cpuNode).toBeDefined();
  expect(cpuNode?.kind).toBe('component');
  if (cpuNode?.kind === 'component') {
    expect(cpuNode.domain).toBe('product');
    expect(cpuNode.renderLabel).toBe('CPU Module');
    expect(cpuNode.category).toBe('component');
    expect(cpuNode.stage).toBe('baseline');
  }

  const chipmakerNode = graph.nodes.find((node) => node.id === 'partner_chipmaker');
  expect(chipmakerNode).toBeDefined();
  expect(chipmakerNode?.kind).toBe('supplier');
  if (chipmakerNode?.kind === 'supplier') {
    expect(chipmakerNode.domain).toBe('supply');
    expect(chipmakerNode.renderLabel).toBe('Crystal Shadow Technologies');
    expect(chipmakerNode.role).toBe('supplier');
    expect(chipmakerNode.riskProfile).toBe('medium');
  }

  expect(graph.edges.some((edge) => edge.type === 'bom')).toBe(true);
  expect(graph.edges.some((edge) => edge.type === 'sourcing')).toBe(true);
  expect(graph.edges.some((edge) => edge.type === 'route')).toBe(true);

  const bomEdge = graph.edges.find((edge) => edge.type === 'bom' && edge.target === 'comp_cpu');
  expect(bomEdge).toBeDefined();
  expect(bomEdge?.source).toBe('comp_motherboard');
  expect(bomEdge?.domain).toBe('product');
  expect(bomEdge?.label).toBe('BOM');
  expect(bomEdge?.renderLabel).toBe('BOM');

  const sourcingEdge = graph.edges.find(
    (edge) => edge.type === 'sourcing' && edge.target === 'partner_chipmaker'
  );
  expect(sourcingEdge).toBeDefined();
  if (sourcingEdge && sourcingEdge.type === 'sourcing') {
    expect(sourcingEdge.domain).toBe('cross-domain');
    expect(sourcingEdge.renderLabel).toBe('Sourcing Link');
    expect(sourcingEdge.allocation.quantityPerWeek).toBe(1200);
    expect(sourcingEdge.allocation.leadTimeDays).toBe(28);
  }

  const routeEdge = graph.edges.find(
    (edge) => edge.type === 'route' && edge.source === 'partner_boarder'
  );
  expect(routeEdge).toBeDefined();
  if (routeEdge && routeEdge.type === 'route') {
    expect(routeEdge.domain).toBe('supply');
    expect(routeEdge.renderLabel).toBe('SEA');
    expect(routeEdge.route.mode).toBe('sea');
    expect(routeEdge.route.transitDays).toBe(12);
    expect(routeEdge.route.reliability).toBe(0.88);
  }
});
