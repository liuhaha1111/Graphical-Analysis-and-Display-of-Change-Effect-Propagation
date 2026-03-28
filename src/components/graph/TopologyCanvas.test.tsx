import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { demoWorkspace } from '../../data/demoWorkspace';
import { buildKnowledgeGraphView } from '../../services/knowledgeGraph.service';
import { buildTopologyLayout } from '../../services/topologyLayout.service';
import TopologyCanvas from './TopologyCanvas';

test('renders topology nodes and supports selection affordances', () => {
  const graph = buildKnowledgeGraphView(demoWorkspace);
  const layout = buildTopologyLayout(graph, { sourceNodeId: 'comp_cpu' });
  const onSelect = vi.fn();
  const cpuNode = layout.nodes.find((node) => node.id === 'comp_cpu');
  const partnerNode = layout.nodes.find((node) => node.id === 'partner_chipmaker');

  if (!cpuNode || !partnerNode) {
    throw new Error('Expected demo layout nodes are missing');
  }

  render(
    <TopologyCanvas
      layout={layout}
      selectedNodeId="comp_cpu"
      onSelect={onSelect}
      mode="explore"
    />,
  );

  expect(screen.getByRole('region', { name: /topology canvas/i })).toBeInTheDocument();

  const cpuButton = screen.getByRole('button', { name: new RegExp(cpuNode.renderLabel, 'i') });
  expect(cpuButton).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: new RegExp(partnerNode.renderLabel, 'i') }));
  expect(onSelect).toHaveBeenCalledWith('partner_chipmaker');
});

test('renders propagation mode chrome with the same accessible canvas region', () => {
  const graph = buildKnowledgeGraphView(demoWorkspace);
  const layout = buildTopologyLayout(graph, { sourceNodeId: 'comp_cpu' });
  const highlightedEdge = layout.edges.find((edge) => edge.id === 'route_route_chip_to_board');

  if (!highlightedEdge) {
    throw new Error('Expected highlighted edge is missing');
  }

  const { container } = render(
    <TopologyCanvas
      layout={layout}
      selectedNodeId={null}
      onSelect={() => {}}
      mode="propagation"
      highlightedEdgeIds={[highlightedEdge.id]}
      impactedNodeIds={['comp_cpu']}
    />,
  );

  expect(screen.getByRole('region', { name: /topology canvas/i })).toBeInTheDocument();
  expect(screen.getByText(/propagation mode/i)).toBeInTheDocument();
  expect(container.querySelectorAll('line[stroke-opacity="0.25"]').length).toBeGreaterThan(0);
});

test('renders an empty-state hint when layout has no nodes', () => {
  render(
    <TopologyCanvas
      layout={{ nodes: [], edges: [], width: 0, height: 0 }}
      selectedNodeId={null}
      onSelect={() => {}}
      mode="explore"
    />,
  );

  expect(screen.getByRole('region', { name: /topology canvas/i })).toBeInTheDocument();
  expect(screen.getByText(/no topology nodes available/i)).toBeInTheDocument();
});
