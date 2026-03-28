import { fireEvent, render, screen, within } from '@testing-library/react';
import { WorkspaceProvider } from '../../store/workspaceStore';
import KnowledgeGraphPage from './KnowledgeGraphPage';

describe('KnowledgeGraphPage', () => {
  test('renders topology canvas and key metrics', () => {
    render(
      <WorkspaceProvider>
        <KnowledgeGraphPage />
      </WorkspaceProvider>,
    );

    expect(screen.getByRole('region', { name: /topology canvas/i })).toBeInTheDocument();
    expect(screen.getByText(/节点总数/)).toBeInTheDocument();
    expect(screen.getByText(/关系总数/)).toBeInTheDocument();
  });

  test('shows selected node details from the shared graph view', () => {
    render(
      <WorkspaceProvider>
        <KnowledgeGraphPage />
      </WorkspaceProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /GreenCore Energy/i }));

    const detailPanel = screen.getByRole('region', { name: /节点详情/ });
    expect(within(detailPanel).getByText('GreenCore Energy')).toBeInTheDocument();
    expect(within(detailPanel).getByText('Huizhou Energy Campus')).toBeInTheDocument();
  });

  test('keeps node positions stable when selection changes', () => {
    render(
      <WorkspaceProvider>
        <KnowledgeGraphPage />
      </WorkspaceProvider>,
    );

    const supplierNode = screen.getByRole('button', { name: /GreenCore Energy/i });
    const componentNode = screen.getByRole('button', { name: /Battery Pack/i });
    const initialSupplierPosition = {
      left: supplierNode.style.left,
      top: supplierNode.style.top,
    };
    const initialComponentPosition = {
      left: componentNode.style.left,
      top: componentNode.style.top,
    };

    fireEvent.click(supplierNode);

    const selectedSupplierNode = screen.getByRole('button', { name: /GreenCore Energy/i });
    const stableComponentNode = screen.getByRole('button', { name: /Battery Pack/i });

    expect(selectedSupplierNode.style.left).toBe(initialSupplierPosition.left);
    expect(selectedSupplierNode.style.top).toBe(initialSupplierPosition.top);
    expect(stableComponentNode.style.left).toBe(initialComponentPosition.left);
    expect(stableComponentNode.style.top).toBe(initialComponentPosition.top);
  });

  test('renders connected edge labels with node names and readable separators', () => {
    render(
      <WorkspaceProvider>
        <KnowledgeGraphPage />
      </WorkspaceProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /GreenCore Energy/i }));

    expect(screen.getByText(/Battery Pack[\s\S]*GreenCore Energy[\s\S]*sourcing/i)).toBeInTheDocument();
  });
});
