import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { WorkspaceProvider } from '../../store/workspaceStore';
import KnowledgeGraphPage from './KnowledgeGraphPage';

describe('KnowledgeGraphPage', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:knowledge-graph'),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test('renders the 3d scene, the 3512-entity metric, and only the default local subgraph', () => {
    render(
      <WorkspaceProvider>
        <KnowledgeGraphPage />
      </WorkspaceProvider>,
    );

    expect(screen.getByTestId('knowledge-graph-3d-scene')).toBeInTheDocument();
    expect(screen.getByText('3512')).toBeInTheDocument();
    expect(screen.getByText('12573 / 12573')).toBeInTheDocument();
    expect(screen.queryByText('2412 个产品实体，600 个供应链实体')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /CPU Module/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Battery Pack/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /SwiftWind Logistics/i })).not.toBeInTheDocument();
  });

  test('updates detail focus and current focus when a local subgraph node is selected', () => {
    render(
      <WorkspaceProvider>
        <KnowledgeGraphPage />
      </WorkspaceProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /^Battery Pack$/i }));

    const overviewPanel = screen.getByRole('region', { name: /图谱概览/i });
    const detailPanel = screen.getAllByRole('region')[2];
    expect(within(overviewPanel).getByText('Battery Pack')).toBeInTheDocument();
    expect(within(overviewPanel).queryByText('CPU Module')).not.toBeInTheDocument();
    expect(within(detailPanel).getByText('Battery Pack')).toBeInTheDocument();
  });

  test('re-centers the local subgraph on the selected node', () => {
    render(
      <WorkspaceProvider>
        <KnowledgeGraphPage />
      </WorkspaceProvider>,
    );

    expect(screen.queryByRole('button', { name: /Harmony Boards Co\./i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Crystal Shadow Technologies/i }));

    expect(screen.getByRole('button', { name: /Harmony Boards Co\./i })).toBeInTheDocument();
  });

  test('falls back to a visible supplier focus when product relations are filtered out', () => {
    render(
      <WorkspaceProvider>
        <KnowledgeGraphPage />
      </WorkspaceProvider>,
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    fireEvent.click(checkboxes[2]);
    fireEvent.click(checkboxes[3]);

    expect(screen.getByText('7479 / 12573')).toBeInTheDocument();

    const detailPanel = screen.getAllByRole('region')[2];
    expect(within(detailPanel).queryByRole('heading', { name: 'CPU Module' })).not.toBeInTheDocument();
    expect(within(detailPanel).getByText(/Crystal Shadow Technologies|Harmony Boards Co\.|GreenCore Energy|Blue Harbor Storage|SwiftWind Logistics/)).toBeInTheDocument();
  });

  test('shows an empty state when all relationship filters are disabled', () => {
    render(
      <WorkspaceProvider>
        <KnowledgeGraphPage />
      </WorkspaceProvider>,
    );

    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((checkbox) => fireEvent.click(checkbox));

    expect(screen.queryByRole('button', { name: /CPU Module/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Crystal Shadow Technologies/i })).not.toBeInTheDocument();
  });

  test('creates a supplier node from the live page modal', async () => {
    render(
      <WorkspaceProvider>
        <KnowledgeGraphPage />
      </WorkspaceProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /新增供应商/i }));
    fireEvent.change(screen.getByLabelText(/供应商名称/i), { target: { value: 'Nova Circuits' } });
    fireEvent.change(screen.getByLabelText(/生产能力/i), { target: { value: '4200' } });
    fireEvent.change(screen.getByLabelText(/产品价格/i), { target: { value: '380' } });
    fireEvent.click(screen.getByLabelText(/CPU Module/i));
    fireEvent.click(screen.getByRole('button', { name: /保存供应商/i }));

    expect(await screen.findByRole('button', { name: /Nova Circuits/i })).toBeInTheDocument();
  });

  test('exports the current visible graph as json', () => {
    const click = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName.toLowerCase() === 'a') {
        return {
          click,
          set href(_: string) {},
          set download(_: string) {},
        } as unknown as HTMLAnchorElement;
      }

      return originalCreateElement(tagName);
    });

    render(
      <WorkspaceProvider>
        <KnowledgeGraphPage />
      </WorkspaceProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /导出当前图谱/i }));

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
  });

  test('updates the selected product component from the detail panel', async () => {
    render(
      <WorkspaceProvider>
        <KnowledgeGraphPage />
      </WorkspaceProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /^CPU Module$/i }));

    const detailPanel = screen.getAllByRole('region')[2];
    fireEvent.change(within(detailPanel).getByLabelText(/节点名称/i), {
      target: { value: 'CPU Module X' },
    });
    fireEvent.change(within(detailPanel).getByLabelText(/类别/i), {
      target: { value: 'module' },
    });
    fireEvent.change(within(detailPanel).getByLabelText(/阶段/i), {
      target: { value: 'prototype' },
    });
    fireEvent.change(within(detailPanel).getByLabelText(/描述/i), {
      target: { value: 'Updated description' },
    });
    fireEvent.change(within(detailPanel).getByLabelText(/标签/i), {
      target: { value: 'compute, critical' },
    });
    fireEvent.click(within(detailPanel).getByRole('button', { name: /保存更新/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /CPU Module X/i })).toBeInTheDocument();
    });
    expect(within(detailPanel).getByDisplayValue('CPU Module X')).toBeInTheDocument();
  });

  test('updates a supplier node from the detail panel', async () => {
    render(
      <WorkspaceProvider>
        <KnowledgeGraphPage />
      </WorkspaceProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /新增供应商/i }));
    fireEvent.change(screen.getByLabelText(/供应商名称/i), { target: { value: 'Nova Circuits' } });
    fireEvent.change(screen.getByLabelText(/生产能力/i), { target: { value: '4200' } });
    fireEvent.change(screen.getByLabelText(/产品价格/i), { target: { value: '380' } });
    fireEvent.click(screen.getByLabelText(/CPU Module/i));
    fireEvent.click(screen.getByRole('button', { name: /保存供应商/i }));

    await screen.findByRole('button', { name: /Nova Circuits/i });

    const detailPanel = screen.getAllByRole('region')[2];
    fireEvent.change(within(detailPanel).getByLabelText(/节点名称/i), {
      target: { value: 'Nova Circuits Service Hub' },
    });
    fireEvent.change(within(detailPanel).getByLabelText(/生产能力/i), {
      target: { value: '5000' },
    });
    fireEvent.change(within(detailPanel).getByLabelText(/产品价格/i), {
      target: { value: '450' },
    });
    fireEvent.click(within(detailPanel).getByLabelText(/配套服务关系/i));
    fireEvent.click(within(detailPanel).getByLabelText(/^Battery Pack$/i));
    fireEvent.click(within(detailPanel).getByRole('button', { name: /保存更新/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Nova Circuits Service Hub/i })).toBeInTheDocument();
    });
    const updatedDetailPanel = screen.getAllByRole('region')[2];
    expect(within(updatedDetailPanel).getByDisplayValue('Nova Circuits Service Hub')).toBeInTheDocument();
    expect(within(updatedDetailPanel).getByText(/^配套服务$/)).toBeInTheDocument();
  }, 20000);

  test('recursively deletes a selected component subtree from the page', async () => {
    render(
      <WorkspaceProvider>
        <KnowledgeGraphPage />
      </WorkspaceProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /^Mainboard Assembly$/i }));

    const detailPanel = screen.getAllByRole('region')[2];
    fireEvent.click(within(detailPanel).getByRole('button', { name: /删除节点/i }));

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /^Mainboard Assembly$/i })).not.toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /^CPU Module$/i })).not.toBeInTheDocument();
  });
});





