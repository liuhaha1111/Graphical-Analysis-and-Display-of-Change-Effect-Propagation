import { demoWorkspace } from '../data/demoWorkspace';
import { buildKnowledgeGraphView } from './knowledgeGraph.service';
import { filterKnowledgeGraphByRelationTypes } from './knowledgeGraphFilters';

describe('filterKnowledgeGraphByRelationTypes', () => {
  test('keeps only edges of the selected relationship type and their connected nodes', () => {
    const graph = buildKnowledgeGraphView(demoWorkspace);
    const filtered = filterKnowledgeGraphByRelationTypes(graph, ['transaction']);

    expect(filtered.edges.length).toBeGreaterThan(0);
    expect(filtered.edges.every((edge) => edge.type === 'transaction')).toBe(true);
    expect(filtered.nodes.every((node) => node.kind === 'supplier')).toBe(true);
  });

  test('returns an empty visible graph when no relationship type is selected', () => {
    const graph = buildKnowledgeGraphView(demoWorkspace);
    const filtered = filterKnowledgeGraphByRelationTypes(graph, []);

    expect(filtered.nodes).toHaveLength(0);
    expect(filtered.edges).toHaveLength(0);
  });
});
