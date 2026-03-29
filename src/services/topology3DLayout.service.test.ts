import { demoWorkspace } from '../data/demoWorkspace';
import { buildKnowledgeGraphView } from './knowledgeGraph.service';
import { buildKnowledgeGraphSubgraph } from './knowledgeGraphSubgraph';
import { buildTopologyLayout } from './topologyLayout.service';
import { buildTopology3DLayout } from './topology3DLayout.service';

describe('buildTopology3DLayout', () => {
  test('maps the local graph into stable 3d coordinates', () => {
    const graph = buildKnowledgeGraphView(demoWorkspace);
    const subgraph = buildKnowledgeGraphSubgraph(graph, {
      focusNodeId: 'comp_cpu',
      expandedNodeIds: [],
    });
    const layout2d = buildTopologyLayout(subgraph, { sourceNodeId: 'comp_cpu' });
    const layout3d = buildTopology3DLayout(layout2d);

    expect(layout3d.nodes.length).toBe(layout2d.nodes.length);
    expect(layout3d.edges).toEqual(layout2d.edges);
    expect(layout3d.nodes.every((node) => typeof node.z === 'number')).toBe(true);
    expect(layout3d.nodes.find((node) => node.id === 'comp_cpu')?.z).toBe(0);
    expect(layout3d.nodes.find((node) => node.id === 'comp_motherboard')?.z).toBeGreaterThanOrEqual(0);
    expect(layout3d.nodes.find((node) => node.id === 'partner_chipmaker')?.z).toBeGreaterThan(0);

    const repeated = buildTopology3DLayout(layout2d);
    expect(repeated.nodes).toEqual(layout3d.nodes);
  });
});
