import { demoWorkspace } from '../data/demoWorkspace';
import { filterKnowledgeGraphByRelationTypes } from './knowledgeGraphFilters';
import { buildKnowledgeGraphView } from './knowledgeGraph.service';
import { buildKnowledgeGraphSubgraph } from './knowledgeGraphSubgraph';

describe('buildKnowledgeGraphSubgraph', () => {
  test('includes focus node and its one-hop neighborhood from candidate graph', () => {
    const candidate = filterKnowledgeGraphByRelationTypes(
      buildKnowledgeGraphView(demoWorkspace),
      ['supply', 'transaction'],
    );

    const subgraph = buildKnowledgeGraphSubgraph(candidate, {
      focusNodeId: 'partner_chipmaker',
      expandedNodeIds: [],
    });

    expect(subgraph.nodes.some((node) => node.id === 'partner_chipmaker')).toBe(true);
    expect(subgraph.nodes.some((node) => node.id === 'comp_cpu')).toBe(true);
    expect(subgraph.nodes.some((node) => node.id === 'partner_boarder')).toBe(true);
    expect(subgraph.nodes.some((node) => node.id === 'partner_distributor')).toBe(false);

    expect(subgraph.edges.every((edge) => {
      return (
        edge.source === 'partner_chipmaker' ||
        edge.target === 'partner_chipmaker'
      );
    })).toBe(true);
  });

  test('adds one-hop neighborhood of expanded nodes when those nodes exist in candidate graph', () => {
    const candidate = filterKnowledgeGraphByRelationTypes(
      buildKnowledgeGraphView(demoWorkspace),
      ['transaction'],
    );

    const subgraph = buildKnowledgeGraphSubgraph(candidate, {
      focusNodeId: 'partner_chipmaker',
      expandedNodeIds: ['partner_boarder'],
    });

    expect(subgraph.nodes.some((node) => node.id === 'partner_distributor')).toBe(true);
    expect(subgraph.nodes.some((node) => node.id === 'partner_logistics')).toBe(false);
    expect(subgraph.edges.every((edge) => {
      const nodeIds = new Set(subgraph.nodes.map((node) => node.id));
      return nodeIds.has(edge.source) && nodeIds.has(edge.target);
    })).toBe(true);
  });

  test('returns empty graph when focus is null or missing from candidate graph', () => {
    const candidate = filterKnowledgeGraphByRelationTypes(
      buildKnowledgeGraphView(demoWorkspace),
      ['supply'],
    );

    const nullFocus = buildKnowledgeGraphSubgraph(candidate, {
      focusNodeId: null,
      expandedNodeIds: [],
    });
    expect(nullFocus.nodes).toHaveLength(0);
    expect(nullFocus.edges).toHaveLength(0);

    const missingFocus = buildKnowledgeGraphSubgraph(candidate, {
      focusNodeId: 'missing_node',
      expandedNodeIds: ['partner_chipmaker'],
    });
    expect(missingFocus.nodes).toHaveLength(0);
    expect(missingFocus.edges).toHaveLength(0);
  });
});
