import { demoWorkspace } from '../data/demoWorkspace';
import { buildKnowledgeGraphView } from './knowledgeGraph.service';
import { buildKnowledgeGraphSubgraph } from './knowledgeGraphSubgraph';
import { buildTopology3DLayout } from './topology3DLayout.service';
import { buildTopologyLayout } from './topologyLayout.service';
import { buildTopology3DSceneLayout } from './topology3DScene.service';

function span(values: number[]) {
  return Math.max(...values) - Math.min(...values);
}

describe('buildTopology3DSceneLayout', () => {
  test('projects the local subgraph into a centered scene with stronger visual spread', () => {
    const graph = buildKnowledgeGraphView(demoWorkspace);
    const subgraph = buildKnowledgeGraphSubgraph(graph, {
      focusNodeId: 'comp_cpu',
      expandedNodeIds: [],
    });
    const layout2d = buildTopologyLayout(subgraph, { sourceNodeId: 'comp_cpu' });
    const layout3d = buildTopology3DLayout(layout2d);
    const sceneLayout = buildTopology3DSceneLayout(layout3d);

    const xs = sceneLayout.nodes.map((node) => node.position[0]);
    const ys = sceneLayout.nodes.map((node) => node.position[1]);
    const zs = sceneLayout.nodes.map((node) => node.position[2]);

    expect(sceneLayout.nodes).toHaveLength(layout3d.nodes.length);
    expect(sceneLayout.cameraPosition).toEqual([0, 0, 14]);
    expect(span(xs)).toBeGreaterThan(10);
    expect(span(ys)).toBeGreaterThan(6);
    expect(span(zs)).toBeGreaterThan(5);
    expect(Math.abs(Math.max(...xs) + Math.min(...xs))).toBeLessThan(0.001);
    expect(Math.abs(Math.max(...ys) + Math.min(...ys))).toBeLessThan(0.001);
    expect(Math.abs(Math.max(...zs) + Math.min(...zs))).toBeLessThan(0.001);
  });

  test('keeps a single-node scene centered at the origin', () => {
    const sceneLayout = buildTopology3DSceneLayout({
      nodes: [
        {
          id: 'comp_cpu',
          name: 'CPU Module',
          renderLabel: 'CPU Module',
          kind: 'component',
          domain: 'product',
          category: 'component',
          stage: 'baseline',
          layer: 'source',
          column: 0,
          row: 0,
          x: 320,
          y: 120,
          z: 0,
        },
      ],
      edges: [],
      width: 800,
      height: 600,
      depth: 240,
    });

    expect(sceneLayout.nodes[0].position).toEqual([0, 0, 0]);
  });
});
