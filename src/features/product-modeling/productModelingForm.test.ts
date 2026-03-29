import { ProductParameter } from '../../domain/workspace';
import { isDependencyDraftComplete, resolveDependencyDraft } from './productModelingForm';

const parameters: ProductParameter[] = [
  {
    id: 'param_cpu_power',
    componentId: 'comp_cpu',
    name: 'CPU Power Limit',
    unit: 'W',
    baselineValue: 45,
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
];

describe('resolveDependencyDraft', () => {
  test('reports completeness only when both selected parameters resolve', () => {
    expect(
      isDependencyDraftComplete(
        {
          sourceComponentId: 'comp_stale_source',
          sourceParameterId: 'param_cpu_power',
          targetComponentId: 'comp_stale_target',
          targetParameterId: 'param_battery_capacity',
        },
        parameters,
      ),
    ).toBe(true);

    expect(
      isDependencyDraftComplete(
        {
          sourceComponentId: 'comp_cpu',
          sourceParameterId: 'param_cpu_power',
          targetComponentId: '',
          targetParameterId: '',
        },
        parameters,
      ),
    ).toBe(false);
  });

  test('infers component ids from selected parameters before saving', () => {
    expect(
      resolveDependencyDraft(
        {
          sourceComponentId: '',
          sourceParameterId: 'param_cpu_power',
          targetComponentId: '',
          targetParameterId: 'param_battery_capacity',
        },
        parameters,
      ),
    ).toEqual({
      sourceComponentId: 'comp_cpu',
      sourceParameterId: 'param_cpu_power',
      targetComponentId: 'comp_battery',
      targetParameterId: 'param_battery_capacity',
    });
  });

  test('normalizes stale component ids to the selected parameter owners', () => {
    expect(
      resolveDependencyDraft(
        {
          sourceComponentId: 'comp_stale_source',
          sourceParameterId: 'param_cpu_power',
          targetComponentId: 'comp_stale_target',
          targetParameterId: 'param_battery_capacity',
        },
        parameters,
      ),
    ).toEqual({
      sourceComponentId: 'comp_cpu',
      sourceParameterId: 'param_cpu_power',
      targetComponentId: 'comp_battery',
      targetParameterId: 'param_battery_capacity',
    });
  });

  test('rejects saving when either selected parameter does not exist', () => {
    expect(() =>
      resolveDependencyDraft(
        {
          sourceComponentId: '',
          sourceParameterId: 'param_missing',
          targetComponentId: '',
          targetParameterId: 'param_battery_capacity',
        },
        parameters,
      ),
    ).toThrow('All dependency fields are required.');
  });

  test('rejects matching source and target parameters after inferring components', () => {
    expect(() =>
      resolveDependencyDraft(
        {
          sourceComponentId: '',
          sourceParameterId: 'param_cpu_power',
          targetComponentId: '',
          targetParameterId: 'param_cpu_power',
        },
        parameters,
      ),
    ).toThrow('Source and target parameters must be different.');
  });
});
