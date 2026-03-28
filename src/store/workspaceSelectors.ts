import { WorkspaceModel } from '../domain/workspace';
import { buildProductTree, ProductTreeNode } from '../services/productModel.service';
import { buildKnowledgeGraphView, GraphView } from '../services/knowledgeGraph.service';
import { buildPropagationOverlay, PropagationOverlay } from '../services/propagationOverlay.service';

export function selectProductTree(workspace: WorkspaceModel): ProductTreeNode[] {
  return buildProductTree(workspace.product);
}

export function selectKnowledgeGraphView(workspace: WorkspaceModel): GraphView {
  return buildKnowledgeGraphView(workspace);
}

export function selectPropagationOverlay(
  workspace: WorkspaceModel,
  selectedPathId: string | null,
): PropagationOverlay {
  const graph = buildKnowledgeGraphView(workspace);
  return buildPropagationOverlay(workspace.analysis, selectedPathId, graph);
}
