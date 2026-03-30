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
          relationType: '\u6570\u503c\u4f20\u9012',
          expression: 'target = source * 1.1',
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
          relationType: '',
          expression: '',
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
          relationType: '\u6570\u503c\u4f20\u9012',
          expression: 'target = source * 1.1',
        },
        parameters,
      ),
    ).toEqual({
      sourceComponentId: 'comp_cpu',
      sourceParameterId: 'param_cpu_power',
      targetComponentId: 'comp_battery',
      targetParameterId: 'param_battery_capacity',
      relation: 'functional',
      expression: 'target = source * 1.1',
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
          relationType: '\u903b\u8f91\u7ea6\u675f',
          expression: 'battery >= cpu * 1.1',
        },
        parameters,
      ),
    ).toEqual({
      sourceComponentId: 'comp_cpu',
      sourceParameterId: 'param_cpu_power',
      targetComponentId: 'comp_battery',
      targetParameterId: 'param_battery_capacity',
      relation: 'constraint',
      expression: 'battery >= cpu * 1.1',
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
          relationType: '\u6570\u503c\u4f20\u9012',
          expression: 'target = source * 1.1',
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
          relationType: '\u6570\u503c\u4f20\u9012',
          expression: 'target = source * 1.1',
        },
        parameters,
      ),
    ).toThrow('Source and target parameters must be different.');
  });

  test('requires relation type and expression before the draft is complete', () => {
    expect(
      isDependencyDraftComplete(
        {
          sourceComponentId: 'comp_cpu',
          sourceParameterId: 'param_cpu_power',
          targetComponentId: 'comp_battery',
          targetParameterId: 'param_battery_capacity',
          relationType: '',
          expression: '',
        },
        parameters,
      ),
    ).toBe(false);
  });

  test('rejects saving when relation type is missing', () => {
    expect(() =>
      resolveDependencyDraft(
        {
          sourceComponentId: 'comp_cpu',
          sourceParameterId: 'param_cpu_power',
          targetComponentId: 'comp_battery',
          targetParameterId: 'param_battery_capacity',
          relationType: '',
          expression: 'target = source * 1.1',
        },
        parameters,
      ),
    ).toThrow('Relation type is required.');
  });

  test('rejects saving when expression is blank', () => {
    expect(() =>
      resolveDependencyDraft(
        {
          sourceComponentId: 'comp_cpu',
          sourceParameterId: 'param_cpu_power',
          targetComponentId: 'comp_battery',
          targetParameterId: 'param_battery_capacity',
          relationType: '\u6570\u503c\u4f20\u9012',
          expression: '   ',
        },
        parameters,
      ),
    ).toThrow('Expression is required.');
  });
});
