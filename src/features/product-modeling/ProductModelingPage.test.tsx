import { fireEvent, render, screen, within } from '@testing-library/react';
import { WorkspaceProvider } from '../../store/workspaceStore';
import ProductModelingPage from './ProductModelingPage';

describe('ProductModelingPage', () => {
  test('renders product tree and dependency panels from shared state', () => {
    render(
      <WorkspaceProvider>
        <ProductModelingPage />
      </WorkspaceProvider>,
    );

    expect(screen.getByText('产品结构树')).toBeInTheDocument();
    expect(screen.getByText('参数依赖关系')).toBeInTheDocument();
    expect(screen.getByText('变更约束摘要')).toBeInTheDocument();
  });

  test('updates parameter and dependency details when a component is selected', () => {
    render(
      <WorkspaceProvider>
        <ProductModelingPage />
      </WorkspaceProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /CPU Module/i }));

    const parameterPanel = screen.getByRole('region', { name: '组件参数' });
    expect(within(parameterPanel).getByText('CPU Frequency')).toBeInTheDocument();
    expect(within(parameterPanel).getByText('CPU Power Limit')).toBeInTheDocument();

    const dependencyPanel = screen.getByRole('region', { name: '参数依赖关系' });
    expect(within(dependencyPanel).getByText(/Battery Pack/)).toBeInTheDocument();
    expect(within(dependencyPanel).getByText(/functional/i)).toBeInTheDocument();
  });
});
