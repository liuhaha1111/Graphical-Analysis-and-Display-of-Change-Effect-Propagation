import { ProductParameter } from '../../domain/workspace';

export type ParameterDraft = {
  name: string;
  propagationRule: string;
  constraintCondition: string;
  constraintRange: string;
};

export type DependencyDraft = {
  sourceComponentId: string;
  sourceParameterId: string;
  targetComponentId: string;
  targetParameterId: string;
};

export function createEmptyParameterDraft(): ParameterDraft {
  return {
    name: '',
    propagationRule: '',
    constraintCondition: '',
    constraintRange: '',
  };
}

export function createDependencyDraft(sourceComponentId = ''): DependencyDraft {
  return {
    sourceComponentId,
    sourceParameterId: '',
    targetComponentId: '',
    targetParameterId: '',
  };
}

function findDependencyParameters(draft: DependencyDraft, parameters: ProductParameter[]) {
  return {
    sourceParameter: parameters.find((parameter) => parameter.id === draft.sourceParameterId),
    targetParameter: parameters.find((parameter) => parameter.id === draft.targetParameterId),
  };
}

export function isDependencyDraftComplete(
  draft: DependencyDraft,
  parameters: ProductParameter[],
): boolean {
  const { sourceParameter, targetParameter } = findDependencyParameters(draft, parameters);
  return Boolean(sourceParameter && targetParameter);
}

export function resolveDependencyDraft(
  draft: DependencyDraft,
  parameters: ProductParameter[],
): DependencyDraft {
  const { sourceParameter, targetParameter } = findDependencyParameters(draft, parameters);

  if (!sourceParameter || !targetParameter) {
    throw new Error('All dependency fields are required.');
  }

  if (sourceParameter.id === targetParameter.id) {
    throw new Error('Source and target parameters must be different.');
  }

  return {
    sourceComponentId: sourceParameter.componentId,
    sourceParameterId: sourceParameter.id,
    targetComponentId: targetParameter.componentId,
    targetParameterId: targetParameter.id,
  };
}
