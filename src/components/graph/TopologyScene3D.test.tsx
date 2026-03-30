import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import TopologyScene3D from './TopologyScene3D';

describe('TopologyScene3D', () => {
  test('renders a 3d topology scene container with scene controls', () => {
    render(
      <TopologyScene3D
        layout={{ nodes: [], edges: [], width: 800, height: 600, depth: 240 }}
        selectedNodeId={null}
        focusNodeId={null}
        onSelect={() => {}}
        onExpand={() => {}}
        onResetView={() => {}}
      />,
    );

    expect(screen.getByTestId('knowledge-graph-3d-scene')).toBeInTheDocument();
    expect(screen.getByTestId('knowledge-graph-3d-scene').className).toContain('h-[560px]');
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  test('shows offset fallback counts when WebGL is unavailable', () => {
    render(
      <TopologyScene3D
        layout={{
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
              x: 100,
              y: 120,
              z: 0,
            },
          ],
          edges: [],
          width: 800,
          height: 600,
          depth: 240,
        }}
        selectedNodeId="comp_cpu"
        focusNodeId="comp_cpu"
        onSelect={() => {}}
        onExpand={() => {}}
        onResetView={() => {}}
      />,
    );

    expect(screen.getByText('Nodes: 501')).toBeInTheDocument();
    expect(screen.getByText('Edges: 7000')).toBeInTheDocument();
  });

  test('wires scene controls to expand, reset, and select callbacks', () => {
    const onSelect = vi.fn();
    const onExpand = vi.fn();
    const onResetView = vi.fn();

    render(
      <TopologyScene3D
        layout={{
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
              x: 100,
              y: 120,
              z: 0,
            },
          ],
          edges: [],
          width: 800,
          height: 600,
          depth: 240,
        }}
        selectedNodeId="comp_cpu"
        focusNodeId="comp_cpu"
        onSelect={onSelect}
        onExpand={onExpand}
        onResetView={onResetView}
      />,
    );

    const [resetButton, expandButton, nodeButton] = screen.getAllByRole('button');

    fireEvent.click(resetButton);
    fireEvent.click(expandButton);
    fireEvent.click(nodeButton);

    expect(onResetView).toHaveBeenCalledTimes(1);
    expect(onExpand).toHaveBeenCalledWith('comp_cpu');
    expect(onSelect).toHaveBeenCalledWith('comp_cpu');
  });
});
