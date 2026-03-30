import { ParameterLink, ProductParameter } from '../../domain/workspace';

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
  relationType: DependencyRelationType | '';
  expression: string;
};

export const NUMERIC_TRANSFER_RELATION_TYPE = '\u6570\u503c\u4f20\u9012';
export const LOGIC_CONSTRAINT_RELATION_TYPE = '\u903b\u8f91\u7ea6\u675f';

export type DependencyRelationType =
  | typeof NUMERIC_TRANSFER_RELATION_TYPE
  | typeof LOGIC_CONSTRAINT_RELATION_TYPE;

export const DEPENDENCY_RELATION_TYPE_OPTIONS: DependencyRelationType[] = [
  NUMERIC_TRANSFER_RELATION_TYPE,
  LOGIC_CONSTRAINT_RELATION_TYPE,
];

export type ResolvedDependencyDraft = {
  sourceComponentId: string;
  sourceParameterId: string;
  targetComponentId: string;
  targetParameterId: string;
  relation: ParameterLink['relation'];
  expression: string;
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
    relationType: '',
    expression: '',
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
  return Boolean(
    sourceParameter &&
      targetParameter &&
      draft.relationType &&
      draft.expression.trim(),
  );
}

export function resolveDependencyDraft(
  draft: DependencyDraft,
  parameters: ProductParameter[],
): ResolvedDependencyDraft {
  const { sourceParameter, targetParameter } = findDependencyParameters(draft, parameters);

  if (!sourceParameter || !targetParameter) {
    throw new Error('All dependency fields are required.');
  }

  if (sourceParameter.id === targetParameter.id) {
    throw new Error('Source and target parameters must be different.');
  }

  if (!draft.relationType) {
    throw new Error('Relation type is required.');
  }

  const expression = draft.expression.trim();
  if (!expression) {
    throw new Error('Expression is required.');
  }

  if (!DEPENDENCY_RELATION_TYPE_OPTIONS.includes(draft.relationType)) {
    throw new Error('Relation type is invalid.');
  }

  return {
    sourceComponentId: sourceParameter.componentId,
    sourceParameterId: sourceParameter.id,
    targetComponentId: targetParameter.componentId,
    targetParameterId: targetParameter.id,
    relation:
      draft.relationType === LOGIC_CONSTRAINT_RELATION_TYPE
        ? 'constraint'
        : 'functional',
    expression,
  };
}

export function getDependencyRelationLabel(relation: ParameterLink['relation']): string {
  switch (relation) {
    case 'functional':
      return NUMERIC_TRANSFER_RELATION_TYPE;
    case 'constraint':
      return LOGIC_CONSTRAINT_RELATION_TYPE;
    case 'quality':
      return '\u8d28\u91cf\u5f71\u54cd';
    case 'cost':
      return '\u6210\u672c\u5f71\u54cd';
    case 'schedule':
      return '\u5de5\u671f\u5f71\u54cd';
    default:
      return relation;
  }
}
