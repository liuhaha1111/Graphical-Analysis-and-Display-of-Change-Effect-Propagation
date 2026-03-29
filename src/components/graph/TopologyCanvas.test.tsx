import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { demoWorkspace } from '../../data/demoWorkspace';
import { buildKnowledgeGraphView } from '../../services/knowledgeGraph.service';
import { buildTopologyLayout } from '../../services/topologyLayout.service';
import TopologyCanvas, { getViewportOffsetForNode } from './TopologyCanvas';

describe('TopologyCanvas', () => {
  test('renders topology nodes and supports selection affordances in dense mode', () => {
    const graph = buildKnowledgeGraphView(demoWorkspace);
    const layout = buildTopologyLayout(graph, { sourceNodeId: 'comp_cpu' });
    const onSelect = vi.fn();

    render(
      <TopologyCanvas
        layout={layout}
        selectedNodeId="comp_cpu"
        onSelect={onSelect}
        mode="explore"
        density="dense"
      />,
    );

    expect(screen.getByRole('region', { name: /topology canvas/i })).toBeInTheDocument();

    const cpuButton = screen.getByRole('button', { name: /CPU Module/i });
    expect(cpuButton).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Crystal Shadow Technologies/i }));
    expect(onSelect).toHaveBeenCalledWith('partner_chipmaker');
  });

  test('renders propagation mode chrome with the same accessible canvas region', () => {
    const graph = buildKnowledgeGraphView(demoWorkspace);
    const layout = buildTopologyLayout(graph, { sourceNodeId: 'comp_cpu' });
    const highlightedEdge = layout.edges.find((edge) => edge.id === 'transaction_route_chip_to_board');

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

  test('renders a bounded viewport for the topology surface', () => {
    const graph = buildKnowledgeGraphView(demoWorkspace);
    const layout = buildTopologyLayout(graph, { sourceNodeId: 'comp_cpu' });

    render(
      <TopologyCanvas layout={layout} selectedNodeId="comp_cpu" onSelect={() => {}} mode="propagation" />,
    );

    expect(screen.getByTestId('topology-canvas-viewport')).toBeInTheDocument();
  });

  test('pans the topology viewport when dragging across empty canvas space', () => {
    const graph = buildKnowledgeGraphView(demoWorkspace);
    const layout = buildTopologyLayout(graph, { sourceNodeId: 'comp_cpu' });

    render(
      <TopologyCanvas layout={layout} selectedNodeId="comp_cpu" onSelect={() => {}} mode="propagation" />,
    );

    const viewport = screen.getByTestId('topology-canvas-viewport');
    Object.defineProperty(viewport, 'scrollLeft', { configurable: true, value: 200, writable: true });
    Object.defineProperty(viewport, 'scrollTop', { configurable: true, value: 120, writable: true });

    fireEvent.mouseDown(viewport, { button: 0, clientX: 300, clientY: 200 });
    fireEvent.mouseMove(viewport, { clientX: 260, clientY: 170 });
    fireEvent.mouseUp(viewport, { clientX: 260, clientY: 170 });

    expect(viewport.scrollLeft).toBeGreaterThan(200);
    expect(viewport.scrollTop).toBeGreaterThan(120);
  });

  test('computes centered viewport offsets for the selected node', () => {
    expect(
      getViewportOffsetForNode({
        canvasHeight: 2406,
        canvasWidth: 5576,
        nodeX: 656,
        nodeY: 1626,
        viewportHeight: 420,
        viewportWidth: 640,
      }),
    ).toEqual({ left: 336, top: 1416 });
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
});
