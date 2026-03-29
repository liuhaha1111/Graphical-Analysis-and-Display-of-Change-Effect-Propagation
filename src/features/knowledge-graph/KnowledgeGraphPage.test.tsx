import { fireEvent, render, screen, within } from '@testing-library/react';
import { WorkspaceProvider } from '../../store/workspaceStore';
import KnowledgeGraphPage from './KnowledgeGraphPage';

describe('KnowledgeGraphPage', () => {
  test('renders the 3d scene, the 3012-entity metric, and only the default local subgraph', () => {
    render(
      <WorkspaceProvider>
        <KnowledgeGraphPage />
      </WorkspaceProvider>,
    );

    expect(screen.getByTestId('knowledge-graph-3d-scene')).toBeInTheDocument();
    expect(screen.getByText('3012')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /展开一跳/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /重置视角/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /CPU Module/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Battery Pack/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /SwiftWind Logistics/i })).not.toBeInTheDocument();
  });

  test('updates detail focus when a local subgraph node is selected', () => {
    render(
      <WorkspaceProvider>
        <KnowledgeGraphPage />
      </WorkspaceProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /^Battery Pack$/i }));

    const detailPanel = screen.getByRole('region', { name: /节点详情/i });
    expect(within(detailPanel).getByText('Battery Pack')).toBeInTheDocument();
  });

  test('expands one-hop neighbors from the selected node', () => {
    render(
      <WorkspaceProvider>
        <KnowledgeGraphPage />
      </WorkspaceProvider>,
    );

    expect(screen.queryByRole('button', { name: /Harmony Boards Co\./i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Crystal Shadow Technologies/i }));
    expect(screen.queryByRole('button', { name: /Harmony Boards Co\./i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /展开一跳/i }));

    expect(screen.getByRole('button', { name: /Harmony Boards Co\./i })).toBeInTheDocument();
  });

  test('falls back to a visible supplier focus when product relations are filtered out', () => {
    render(
      <WorkspaceProvider>
        <KnowledgeGraphPage />
      </WorkspaceProvider>,
    );

    fireEvent.click(screen.getByLabelText('装配关系'));
    fireEvent.click(screen.getByLabelText('配置关系'));
    fireEvent.click(screen.getByLabelText('供应关系'));
    fireEvent.click(screen.getByLabelText('配置服务'));

    const detailPanel = screen.getByRole('region', { name: /节点详情/i });
    expect(within(detailPanel).queryByText('CPU Module')).not.toBeInTheDocument();
    expect(within(detailPanel).getByText(/Crystal Shadow Technologies|Harmony Boards Co\.|GreenCore Energy|Blue Harbor Storage|SwiftWind Logistics/)).toBeInTheDocument();
  });

  test('shows an empty state when all relationship filters are disabled', () => {
    render(
      <WorkspaceProvider>
        <KnowledgeGraphPage />
      </WorkspaceProvider>,
    );

    fireEvent.click(screen.getByLabelText('装配关系'));
    fireEvent.click(screen.getByLabelText('配置关系'));
    fireEvent.click(screen.getByLabelText('供应关系'));
    fireEvent.click(screen.getByLabelText('配置服务'));
    fireEvent.click(screen.getByLabelText('交易关系'));

    expect(screen.getAllByText('当前筛选下无可见节点').length).toBeGreaterThan(0);
  });
});
