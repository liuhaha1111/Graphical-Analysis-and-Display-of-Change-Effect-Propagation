import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

const { createWorkspaceFixture } = vi.hoisted(() => ({
  createWorkspaceFixture: () => ({
    product: {
      components: [
        {
          id: 'comp_laptop',
          name: 'Apex Ultrabook',
          parentId: null,
          category: 'system' as const,
          stage: 'baseline' as const,
        },
        {
          id: 'comp_motherboard',
          name: 'Mainboard Assembly',
          parentId: 'comp_laptop',
          category: 'assembly' as const,
          stage: 'baseline' as const,
        },
        {
          id: 'comp_cpu',
          name: 'CPU Module',
          parentId: 'comp_motherboard',
          category: 'component' as const,
          stage: 'baseline' as const,
        },
        {
          id: 'comp_memory',
          name: 'Memory Module',
          parentId: 'comp_motherboard',
          category: 'module' as const,
          stage: 'baseline' as const,
        },
        {
          id: 'comp_battery',
          name: 'Battery Pack',
          parentId: 'comp_laptop',
          category: 'module' as const,
          stage: 'baseline' as const,
        },
      ],
      parameters: [
        {
          id: 'param_cpu_frequency',
          componentId: 'comp_cpu',
          name: 'CPU Frequency',
          unit: 'GHz',
          baselineValue: 3.2,
          changeable: true,
        },
        {
          id: 'param_cpu_power',
          componentId: 'comp_cpu',
          name: 'CPU Power Limit',
          unit: 'W',
          baselineValue: 45,
          changeable: true,
        },
        {
          id: 'param_memory_capacity',
          componentId: 'comp_memory',
          name: 'Memory Capacity',
          unit: 'GB',
          baselineValue: 16,
          changeable: true,
        },
        {
          id: 'param_battery_capacity',
          componentId: 'comp_battery',
          name: 'Battery Capacity',
          unit: 'Wh',
          baselineValue: 62,
          changeable: true,
        },
      ],
      parameterLinks: [
        {
          id: 'link_cpu_freq_battery',
          sourceComponentId: 'comp_cpu',
          sourceParameterId: 'param_cpu_frequency',
          targetComponentId: 'comp_battery',
          targetParameterId: 'param_battery_capacity',
          relation: 'functional' as const,
          expression: 'target >= 62 + (source - 3.2) * 5',
          impactWeight: 0.75,
        },
      ],
    },
    supplyChain: {
      partners: [],
      routes: [],
    },
    changeScenario: {
      id: 'scenario_cpu_freq_boost',
      name: 'CPU Frequency Increase',
      description: 'Increase CPU frequency.',
      sourceComponentId: 'comp_cpu',
      sourceParameterId: 'param_cpu_frequency',
      changeType: 'spec-change' as const,
      changeMagnitude: 'high' as const,
      rationale: 'Fixture scenario.',
      createdAt: '2026-03-30T00:00:00.000Z',
    },
    analysis: null,
  }),
}));

vi.mock('../../data/demoWorkspace', () => ({
  createDemoWorkspace: () => createWorkspaceFixture(),
}));

import { WorkspaceProvider } from '../../store/workspaceStore';
import ProductModelingPage from './ProductModelingPage';

function createImportedProductModel() {
  return {
    components: [
      {
        id: 'comp_portable_monitor',
        name: 'Portable Monitor',
        parentId: null,
        category: 'system' as const,
        stage: 'baseline' as const,
      },
      {
        id: 'comp_panel',
        name: 'Display Panel',
        parentId: 'comp_portable_monitor',
        category: 'module' as const,
        stage: 'baseline' as const,
      },
    ],
    parameters: [
      {
        id: 'param_power_budget',
        componentId: 'comp_portable_monitor',
        name: 'Power Budget',
        unit: 'W',
        baselineValue: 18,
        changeable: true,
      },
      {
        id: 'param_panel_brightness',
        componentId: 'comp_panel',
        name: 'Panel Brightness',
        unit: 'nits',
        baselineValue: 400,
        changeable: true,
      },
    ],
    parameterLinks: [
      {
        id: 'link_panel_power',
        sourceComponentId: 'comp_panel',
        sourceParameterId: 'param_panel_brightness',
        targetComponentId: 'comp_portable_monitor',
        targetParameterId: 'param_power_budget',
        relation: 'functional' as const,
        expression: 'target >= source / 25',
        impactWeight: 0.45,
      },
    ],
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ProductModelingPage', () => {
  test('renders product tree and dependency panels from shared state', () => {
    render(
      <WorkspaceProvider>
        <ProductModelingPage />
      </WorkspaceProvider>,
    );

    expect(screen.getByText(/shared modeling workspace/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add root component/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add dependency/i })).toBeInTheDocument();
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
    expect(within(dependencyPanel).getByText(/\u6570\u503c\u4f20\u9012/)).toBeInTheDocument();
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

  test('creates a dependency from the dependency panel with relation metadata', () => {
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
    fireEvent.change(within(dialog).getByLabelText(/relation type/i), {
      target: { value: '\u6570\u503c\u4f20\u9012' },
    });
    fireEvent.change(within(dialog).getByLabelText(/expression/i), {
      target: { value: 'target = source * 1.1' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /save dependency/i }));

    expect(
      screen.getByRole('heading', {
        name: /CPU Module.*CPU Power Limit.*Battery Pack.*Battery Capacity/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/\u6570\u503c\u4f20\u9012/).length).toBeGreaterThan(0);
    expect(screen.getByText('target = source * 1.1')).toBeInTheDocument();
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
    const relationType = within(dialog).getByLabelText(/relation type/i);
    const expression = within(dialog).getByLabelText(/expression/i);
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

    expect(saveButton).toBeDisabled();

    fireEvent.change(relationType, {
      target: { value: '\u6570\u503c\u4f20\u9012' },
    });
    expect(saveButton).toBeDisabled();

    fireEvent.change(expression, {
      target: { value: 'target = source * 1.1' },
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
    fireEvent.change(within(dialog).getByLabelText(/relation type/i), {
      target: { value: '\u6570\u503c\u4f20\u9012' },
    });
    fireEvent.change(within(dialog).getByLabelText(/expression/i), {
      target: { value: 'target = source * 1.1' },
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
    fireEvent.change(within(dialog).getByLabelText(/relation type/i), {
      target: { value: '\u903b\u8f91\u7ea6\u675f' },
    });
    fireEvent.change(within(dialog).getByLabelText(/expression/i), {
      target: { value: 'battery >= cpu * 1.1' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /save dependency/i }));

    expect(within(dialog).getByRole('alert')).toHaveTextContent(/must be different/i);
  });

  test('merges a valid product model into the existing page content', async () => {
    render(
      <WorkspaceProvider>
        <ProductModelingPage />
      </WorkspaceProvider>,
    );

    const input = screen.getByLabelText(/import product model file/i);
    const file = new File([JSON.stringify(createImportedProductModel())], 'product-model.json', {
      type: 'application/json',
    });

    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByRole('button', { name: /^Portable Monitor/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Apex Ultrabook/i })).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  test('shows an inline import error and preserves the current product model when merged ids conflict', async () => {
    render(
      <WorkspaceProvider>
        <ProductModelingPage />
      </WorkspaceProvider>,
    );

    const input = screen.getByLabelText(/import product model file/i);
    const file = new File(
      [
        JSON.stringify({
          ...createImportedProductModel(),
          components: [
            {
              ...createImportedProductModel().components[0],
              id: 'comp_laptop',
            },
          ],
          parameters: [],
          parameterLinks: [],
        }),
      ],
      'duplicate-product-model.json',
      {
        type: 'application/json',
      },
    );

    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByRole('alert')).toHaveTextContent(/component id/i);
    expect(screen.getByRole('button', { name: /^Apex Ultrabook/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Portable Monitor/i })).not.toBeInTheDocument();
  });

  test('shows an inline import error and preserves the current product model on failure', async () => {
    render(
      <WorkspaceProvider>
        <ProductModelingPage />
      </WorkspaceProvider>,
    );

    const input = screen.getByLabelText(/import product model file/i);
    const file = new File([JSON.stringify({ components: [] })], 'broken-product-model.json', {
      type: 'application/json',
    });

    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /components, parameters, and parameterLinks arrays/i,
    );
    expect(screen.getByRole('button', { name: /^Apex Ultrabook/i })).toBeInTheDocument();
  });

  test('exports only the product model data', async () => {
    const OriginalBlob = Blob;
    let blobPayload = '';
    class CapturedBlob extends OriginalBlob {
      constructor(blobParts: BlobPart[] = [], options?: BlobPropertyBag) {
        super(blobParts, options);
        blobPayload = blobParts
          .map((part) => {
            if (typeof part === 'string') {
              return part;
            }
            if (part instanceof ArrayBuffer) {
              return new TextDecoder().decode(new Uint8Array(part));
            }
            if (ArrayBuffer.isView(part)) {
              return new TextDecoder().decode(part);
            }
            return String(part);
          })
          .join('');
      }
    }

    const createObjectURL = vi.fn(() => 'blob:product-model');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(globalThis, 'Blob', {
      configurable: true,
      writable: true,
      value: CapturedBlob,
    });
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeObjectURL,
    });
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(
      <WorkspaceProvider>
        <ProductModelingPage />
      </WorkspaceProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /export product model/i }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(anchorClick).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);

    const exported = JSON.parse(blobPayload);

    expect(exported).toEqual({
      components: expect.any(Array),
      parameters: expect.any(Array),
      parameterLinks: expect.any(Array),
    });
    expect(exported).not.toHaveProperty('supplyChain');
    expect(exported).not.toHaveProperty('changeScenario');
    expect(exported).not.toHaveProperty('analysis');

    Object.defineProperty(globalThis, 'Blob', {
      configurable: true,
      writable: true,
      value: OriginalBlob,
    });
  });
});
