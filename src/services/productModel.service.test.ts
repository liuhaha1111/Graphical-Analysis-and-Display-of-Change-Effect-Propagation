import { buildProductTree, ProductTreeNode } from './productModel.service';
import { ProductDomain } from '../domain/workspace';
import { demoWorkspace } from '../data/demoWorkspace';

const findNodeById = (nodes: ProductTreeNode[], id: string): ProductTreeNode | undefined => {
  const stack: ProductTreeNode[] = [...nodes];
  while (stack.length) {
    const node = stack.shift()!;
    if (node.id === id) {
      return node;
    }
    stack.push(...node.children);
  }
  return undefined;
};

test('buildProductTree preserves metadata and deeply nests BOM descendants', () => {
  const tree = buildProductTree(demoWorkspace.product);
  const root = tree.find((node) => node.id === 'comp_laptop');
  expect(root).toBeDefined();
  expect(root?.category).toBe('system');
  expect(root?.stage).toBe('baseline');

  const cpuNode = findNodeById(tree, 'comp_cpu');
  expect(cpuNode).toBeDefined();
  expect(cpuNode?.name).toBe('CPU Module');
  expect(cpuNode?.stage).toBe('baseline');
  expect(cpuNode?.parentId).toBe('comp_motherboard');
});

test('buildProductTree surfaces orphaned nodes instead of dropping them', () => {
  const orphanProduct: ProductDomain = {
    components: [
      {
        id: 'root',
        name: 'Root Assembly',
        parentId: null,
        category: 'assembly',
        stage: 'baseline',
      },
      {
        id: 'orphan',
        name: 'Orphan Component',
        parentId: 'missing-parent',
        category: 'component',
        stage: 'prototype',
      },
    ],
    parameters: [],
    parameterLinks: [],
  };

  const tree = buildProductTree(orphanProduct);
  expect(tree.some((node) => node.id === 'orphan')).toBe(true);
  expect(findNodeById(tree, 'orphan')?.parentId).toBe('missing-parent');
});

test('buildProductTree rejects disconnected cycles even when a valid tree exists', () => {
  const mixedProduct: ProductDomain = {
    components: [
      {
        id: 'root',
        name: 'Root Assembly',
        parentId: null,
        category: 'assembly',
        stage: 'baseline',
      },
      {
        id: 'child',
        name: 'Child Component',
        parentId: 'root',
        category: 'component',
        stage: 'baseline',
      },
      {
        id: 'cycle-a',
        name: 'Cycle A',
        parentId: 'cycle-b',
        category: 'module',
        stage: 'baseline',
      },
      {
        id: 'cycle-b',
        name: 'Cycle B',
        parentId: 'cycle-a',
        category: 'component',
        stage: 'baseline',
      },
    ],
    parameters: [],
    parameterLinks: [],
  };

  expect(() => buildProductTree(mixedProduct)).toThrow(/cycle-a/);
});

test('buildProductTree rejects component cycles', () => {
  const cyclicProduct: ProductDomain = {
    components: [
      {
        id: 'cycle-a',
        name: 'Cycle A',
        parentId: 'cycle-b',
        category: 'module',
        stage: 'baseline',
      },
      {
        id: 'cycle-b',
        name: 'Cycle B',
        parentId: 'cycle-a',
        category: 'component',
        stage: 'baseline',
      },
    ],
    parameters: [],
    parameterLinks: [],
  };
  expect(() => buildProductTree(cyclicProduct)).toThrow(/cycle/i);
});
