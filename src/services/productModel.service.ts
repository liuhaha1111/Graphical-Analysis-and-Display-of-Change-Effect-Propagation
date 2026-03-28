import { ProductComponent, ProductDomain } from '../domain/workspace';

export type ProductTreeNode = ProductComponent & {
  children: ProductTreeNode[];
};

export function buildProductTree(product: ProductDomain): ProductTreeNode[] {
  const nodes: ProductTreeNode[] = product.components.map((component) => ({ ...component, children: [] }));
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const childrenByParent = new Map<string | null, ProductTreeNode[]>();

  for (const node of nodes) {
    const siblings = childrenByParent.get(node.parentId) ?? [];
    siblings.push(node);
    childrenByParent.set(node.parentId, siblings);
  }

  const rootNodes: ProductTreeNode[] = [];
  const addedRoots = new Set<string>();
  const addRoot = (node: ProductTreeNode) => {
    if (!addedRoots.has(node.id)) {
      rootNodes.push(node);
      addedRoots.add(node.id);
    }
  };

  for (const root of childrenByParent.get(null) ?? []) {
    addRoot(root);
  }

  for (const node of nodes) {
    if (node.parentId !== null && !nodesById.has(node.parentId)) {
      addRoot(node);
    }
  }

  if (rootNodes.length === 0 && nodes.length > 0) {
    throw new Error('Product tree does not have any root component; possible cycle or missing parent definitions.');
  }

  const visited = new Set<string>();

  const attachChildren = (node: ProductTreeNode, ancestors: Set<string>): ProductTreeNode => {
    if (ancestors.has(node.id)) {
      throw new Error(`Product tree detected a cycle involving component ${node.id}`);
    }

    const nextAncestors = new Set(ancestors);
    nextAncestors.add(node.id);

    const children = childrenByParent.get(node.id) ?? [];

    visited.add(node.id);

    return {
      ...node,
      children: children.map((child) => attachChildren(child, nextAncestors)),
    };
  };

  const tree = rootNodes.map((root) => attachChildren(root, new Set()));
  const unvisited = nodes.filter((node) => !visited.has(node.id));
  if (unvisited.length > 0) {
    const ids = unvisited.map((node) => node.id).join(', ');
    throw new Error(
      `Unvisited components detected (${ids}); this typically means a disconnected cycle or missing parent references.`
    );
  }

  return tree;
}
