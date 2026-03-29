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

    fireEvent.click(screen.getByRole('button', { name: /^CPU Module/i }));

    const parameterPanel = screen.getByRole('region', { name: '组件参数' });
    expect(within(parameterPanel).getByText('CPU Frequency')).toBeInTheDocument();
    expect(within(parameterPanel).getByText('CPU Power Limit')).toBeInTheDocument();

    const dependencyPanel = screen.getByRole('region', { name: '参数依赖关系' });
    expect(within(dependencyPanel).getByText(/Battery Pack/)).toBeInTheDocument();
    expect(within(dependencyPanel).getByText(/functional/i)).toBeInTheDocument();
  });
  test('creates a root component from the BOM panel', () => {
    render(
      <WorkspaceProvider>
        <ProductModelingPage />
      </WorkspaceProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /add root component/i }));

    const dialog = screen.getByRole('dialog', { name: /add root component/i });
    fireEvent.change(within(dialog).getByLabelText(/component name/i), {
      target: { value: 'Thermal Control System' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /save component/i }));

    expect(screen.getByRole('button', { name: /^Thermal Control System/i })).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Thermal Control System' })).toBeInTheDocument();
  });

  test('creates a child component from a BOM node action', () => {
    render(
      <WorkspaceProvider>
        <ProductModelingPage />
      </WorkspaceProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /add child component for mainboard assembly/i }));

    const dialog = screen.getByRole('dialog', { name: /add child component/i });
    fireEvent.change(within(dialog).getByLabelText(/component name/i), {
      target: { value: 'Sensor Hub' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /save component/i }));

    expect(screen.getByRole('button', { name: /^Sensor Hub/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sensor Hub' })).toBeInTheDocument();
  });

  test('creates a changeable parameter for the selected component', () => {
    render(
      <WorkspaceProvider>
        <ProductModelingPage />
      </WorkspaceProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /^CPU Module/i }));
    fireEvent.click(screen.getByRole('button', { name: /add changeable parameter/i }));

    const dialog = screen.getByRole('dialog', { name: /add changeable parameter/i });
    fireEvent.change(within(dialog).getByLabelText(/parameter name/i), {
      target: { value: 'Thermal Margin' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /save parameter/i }));

    expect(screen.getByRole('heading', { name: 'Thermal Margin' })).toBeInTheDocument();
  });

  test('captures propagation metadata when creating a changeable parameter', () => {
    render(
      <WorkspaceProvider>
        <ProductModelingPage />
      </WorkspaceProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /^CPU Module/i }));
    fireEvent.click(screen.getByRole('button', { name: /add changeable parameter/i }));

    const dialog = screen.getByRole('dialog', { name: /add changeable parameter/i });
    fireEvent.change(within(dialog).getByLabelText(/parameter name/i), {
      target: { value: 'Thermal Margin' },
    });
    fireEvent.change(within(dialog).getByLabelText(/propagation rule/i), {
      target: { value: 'Raise thermal headroom toward the battery pack.' },
    });
    fireEvent.change(within(dialog).getByLabelText(/constraint condition/i), {
      target: { value: 'Only valid when fan mode remains performance.' },
    });
    fireEvent.change(within(dialog).getByLabelText(/constraint range/i), {
      target: { value: '8% - 15%' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /save parameter/i }));

    expect(screen.getByRole('heading', { name: 'Thermal Margin' })).toBeInTheDocument();
    expect(screen.getByText(/Raise thermal headroom toward the battery pack./i)).toBeInTheDocument();
    expect(screen.getByText(/Only valid when fan mode remains performance./i)).toBeInTheDocument();
    expect(screen.getByText('8% - 15%')).toBeInTheDocument();
  });

  test('creates a dependency from the dependency panel', () => {
    render(
      <WorkspaceProvider>
        <ProductModelingPage />
      </WorkspaceProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /add dependency/i }));

    const dialog = screen.getByRole('dialog', { name: /add dependency/i });
    fireEvent.change(within(dialog).getByLabelText(/source component/i), {
      target: { value: 'comp_cpu' },
    });
    fireEvent.change(within(dialog).getByLabelText(/source parameter/i), {
      target: { value: 'param_cpu_power' },
    });
    fireEvent.change(within(dialog).getByLabelText(/target component/i), {
      target: { value: 'comp_battery' },
    });
    fireEvent.change(within(dialog).getByLabelText(/target parameter/i), {
      target: { value: 'param_battery_capacity' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /save dependency/i }));

    expect(
      screen.getByRole('heading', {
        name: /CPU Module.*CPU Power Limit.*Battery Pack.*Battery Capacity/i,
      }),
    ).toBeInTheDocument();
  });

  test('keeps dependency save disabled until the draft is complete', () => {
    render(
      <WorkspaceProvider>
        <ProductModelingPage />
      </WorkspaceProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /add dependency/i }));

    const dialog = screen.getByRole('dialog', { name: /add dependency/i });
    const sourceParameter = within(dialog).getByLabelText(/source parameter/i);
    const targetComponent = within(dialog).getByLabelText(/target component/i);
    const targetParameter = within(dialog).getByLabelText(/target parameter/i);
    const saveButton = within(dialog).getByRole('button', { name: /save dependency/i });

    expect(sourceParameter).not.toBeDisabled();
    expect(targetParameter).toBeDisabled();
    expect(saveButton).toBeDisabled();

    fireEvent.change(sourceParameter, {
      target: { value: 'param_cpu_power' },
    });
    fireEvent.change(targetComponent, {
      target: { value: 'comp_battery' },
    });

    expect(targetParameter).not.toBeDisabled();
    expect(saveButton).toBeDisabled();

    fireEvent.change(targetParameter, {
      target: { value: 'param_battery_capacity' },
    });

    expect(saveButton).not.toBeDisabled();
  });

  test('saves a dependency without raising the required-fields error when all selections are made', () => {
    render(
      <WorkspaceProvider>
        <ProductModelingPage />
      </WorkspaceProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /^CPU Module/i }));
    fireEvent.click(screen.getByRole('button', { name: /add dependency/i }));

    const dialog = screen.getByRole('dialog', { name: /add dependency/i });
    fireEvent.change(within(dialog).getByLabelText(/source parameter/i), {
      target: { value: 'param_cpu_power' },
    });
    fireEvent.change(within(dialog).getByLabelText(/target component/i), {
      target: { value: 'comp_battery' },
    });
    fireEvent.change(within(dialog).getByLabelText(/target parameter/i), {
      target: { value: 'param_battery_capacity' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /save dependency/i }));

    expect(screen.queryByText(/all dependency fields are required/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /CPU Module.*CPU Power Limit.*Battery Pack.*Battery Capacity/i,
      }),
    ).toBeInTheDocument();
  });

  test('shows inline validation for missing and duplicate root component names', () => {
    render(
      <WorkspaceProvider>
        <ProductModelingPage />
      </WorkspaceProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /add root component/i }));

    let dialog = screen.getByRole('dialog', { name: /add root component/i });
    fireEvent.click(within(dialog).getByRole('button', { name: /save component/i }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent(/component name is required/i);

    fireEvent.change(within(dialog).getByLabelText(/component name/i), {
      target: { value: 'Apex Ultrabook' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /save component/i }));

    dialog = screen.getByRole('dialog', { name: /add root component/i });
    expect(within(dialog).getByRole('alert')).toHaveTextContent(/already exists/i);
  });

  test('shows inline validation for duplicate parameter names on a component', () => {
    render(
      <WorkspaceProvider>
        <ProductModelingPage />
      </WorkspaceProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /^CPU Module/i }));
    fireEvent.click(screen.getByRole('button', { name: /add changeable parameter/i }));

    const dialog = screen.getByRole('dialog', { name: /add changeable parameter/i });
    fireEvent.change(within(dialog).getByLabelText(/parameter name/i), {
      target: { value: 'CPU Frequency' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /save parameter/i }));

    expect(within(dialog).getByRole('alert')).toHaveTextContent(/already exists/i);
  });

  test('resets invalid dependency parameter selections and rejects matching parameter ids', () => {
    render(
      <WorkspaceProvider>
        <ProductModelingPage />
      </WorkspaceProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /add dependency/i }));

    const dialog = screen.getByRole('dialog', { name: /add dependency/i });
    const sourceComponent = within(dialog).getByLabelText(/source component/i) as HTMLSelectElement;
    const sourceParameter = within(dialog).getByLabelText(/source parameter/i) as HTMLSelectElement;
    const targetComponent = within(dialog).getByLabelText(/target component/i) as HTMLSelectElement;
    const targetParameter = within(dialog).getByLabelText(/target parameter/i) as HTMLSelectElement;

    fireEvent.change(sourceComponent, { target: { value: 'comp_cpu' } });
    fireEvent.change(sourceParameter, { target: { value: 'param_cpu_frequency' } });
    fireEvent.change(sourceComponent, { target: { value: 'comp_battery' } });

    expect(sourceParameter.value).toBe('');

    fireEvent.change(sourceParameter, { target: { value: 'param_battery_capacity' } });
    fireEvent.change(targetComponent, { target: { value: 'comp_battery' } });
    fireEvent.change(targetParameter, { target: { value: 'param_battery_capacity' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /save dependency/i }));

    expect(within(dialog).getByRole('alert')).toHaveTextContent(/must be different/i);
  });
});
