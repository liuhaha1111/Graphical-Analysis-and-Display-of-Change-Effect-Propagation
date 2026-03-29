import { describe, expect, test } from 'vitest';
import { demoWorkspace } from '../data/demoWorkspace';
import { buildKnowledgeGraphView } from './knowledgeGraph.service';
import { buildPropagationOverlay } from './propagationOverlay.service';
import { analyzePropagation } from './propagationAnalysis.service';

describe('buildPropagationOverlay', () => {
  test('returns empty overlay when analysis is missing', () => {
    const graph = buildKnowledgeGraphView(demoWorkspace);
    const overlay = buildPropagationOverlay(null, null, graph);

    expect(overlay.impactedNodeIds).toEqual([]);
    expect(overlay.highlightedEdgeIds).toEqual([]);
  });

  test('maps analysis into impacted nodes and highlighted edges for selected path', () => {
    const graph = buildKnowledgeGraphView(demoWorkspace);
    const analysis = analyzePropagation(demoWorkspace, demoWorkspace.changeScenario);
    const selectedPathId =
      analysis.propagationPaths.find((path) => path.id === 'route:route_chip_to_board')?.id ?? null;

    const overlay = buildPropagationOverlay(analysis, selectedPathId, graph);
    const graphEdgeIds = new Set(graph.edges.map((edge) => edge.id));

    expect(overlay.impactedNodeIds).toContain('comp_cpu');
    expect(overlay.impactedNodeIds).toContain('partner_chipmaker');
    expect(overlay.highlightedEdgeIds).toContain('transaction_route_chip_to_board');
    expect(overlay.highlightedEdgeIds.every((edgeId) => graphEdgeIds.has(edgeId))).toBe(true);
    expect(overlay.impactedNodeIds).toEqual([...overlay.impactedNodeIds].sort());
    expect(overlay.highlightedEdgeIds).toEqual([...overlay.highlightedEdgeIds].sort());
  });
});
