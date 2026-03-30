import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createDemoWorkspace } from '../data/demoWorkspace';
import { ProductDomain } from '../domain/workspace';
import { exportProductModel, importProductModel, mergeProductModels } from './productModelImportExport';

function createProductModelFixture(): ProductDomain {
  return {
    components: [
      {
        id: 'comp_root',
        name: 'Portable Monitor',
        parentId: null,
        category: 'system',
        stage: 'baseline',
      },
      {
        id: 'comp_panel',
        name: 'Display Panel',
        parentId: 'comp_root',
        category: 'module',
        stage: 'baseline',
      },
    ],
    parameters: [
      {
        id: 'param_brightness',
        componentId: 'comp_panel',
        name: 'Brightness',
        unit: 'nits',
        baselineValue: 400,
        changeable: true,
      },
      {
        id: 'param_power',
        componentId: 'comp_root',
        name: 'Power Budget',
        unit: 'W',
        baselineValue: 18,
        changeable: true,
      },
    ],
    parameterLinks: [
      {
        id: 'link_display_power',
        sourceComponentId: 'comp_panel',
        sourceParameterId: 'param_brightness',
        targetComponentId: 'comp_root',
        targetParameterId: 'param_power',
        relation: 'constraint',
        expression: 'target >= source / 25',
        impactWeight: 0.55,
      },
    ],
  };
}

describe('productModelImportExport', () => {
  test('exports only product model arrays', () => {
    const json = exportProductModel(createProductModelFixture());

    expect(JSON.parse(json)).toEqual({
      components: expect.any(Array),
      parameters: expect.any(Array),
      parameterLinks: expect.any(Array),
    });
  });

  test('round-trips the current demo product model', () => {
    const product = createDemoWorkspace().product;

    expect(importProductModel(exportProductModel(product))).toEqual(product);
  });

  test('merges a valid imported product model into the current product model', () => {
    const current = createDemoWorkspace().product;
    const incoming = createProductModelFixture();

    expect(mergeProductModels(current, incoming)).toEqual({
      components: [...current.components, ...incoming.components],
      parameters: [...current.parameters, ...incoming.parameters],
      parameterLinks: [...current.parameterLinks, ...incoming.parameterLinks],
    });
  });

  test('rejects merges when an imported component id already exists', () => {
    const current = createDemoWorkspace().product;
    const incoming = createProductModelFixture();

    expect(() =>
      mergeProductModels(current, {
        ...incoming,
        components: [
          {
            ...incoming.components[0],
            id: current.components[0].id,
          },
        ],
      }),
    ).toThrow(/component id/i);
  });

  test('rejects imports with missing top-level arrays', () => {
    expect(() => importProductModel(JSON.stringify({ components: [] }))).toThrow(
      /components, parameters, and parameterLinks/i,
    );
  });

  test('rejects imports with an unknown relation value', () => {
    const product = createProductModelFixture();

    expect(() =>
      importProductModel(
        JSON.stringify({
          ...product,
          parameterLinks: [
            {
              ...product.parameterLinks[0],
              relation: 'unknown',
            },
          ],
        }),
      ),
    ).toThrow(/relation/i);
  });

  test('rejects imports with blank link expression', () => {
    const product = createProductModelFixture();

    expect(() =>
      importProductModel(
        JSON.stringify({
          ...product,
          parameterLinks: [
            {
              ...product.parameterLinks[0],
              expression: '   ',
            },
          ],
        }),
      ),
    ).toThrow(/expression/i);
  });

  test('rejects imports when a parameter references a missing component', () => {
    const product = createProductModelFixture();

    expect(() =>
      importProductModel(
        JSON.stringify({
          ...product,
          parameters: [
            {
              ...product.parameters[0],
              componentId: 'comp_missing',
            },
          ],
        }),
      ),
    ).toThrow(/parameter component/i);
  });

  test('rejects imports when a link source parameter is not owned by the source component', () => {
    const product = createProductModelFixture();

    expect(() =>
      importProductModel(
        JSON.stringify({
          ...product,
          parameterLinks: [
            {
              ...product.parameterLinks[0],
              sourceComponentId: 'comp_root',
            },
          ],
        }),
      ),
    ).toThrow(/source parameter/i);
  });

  test('accepts the checked-in sample import file', () => {
    const samplePath = path.resolve(
      process.cwd(),
      'docs',
      'examples',
      'product-model-import.json',
    );
    const raw = readFileSync(samplePath, 'utf8');

    expect(() => importProductModel(raw)).not.toThrow();
  });
});
