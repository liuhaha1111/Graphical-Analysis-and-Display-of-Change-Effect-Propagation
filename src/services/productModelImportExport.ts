import { ParameterLink, ProductComponent, ProductDomain, ProductParameter } from '../domain/workspace';

const ALLOWED_COMPONENT_CATEGORIES = new Set<ProductComponent['category']>([
  'system',
  'assembly',
  'module',
  'component',
]);

const ALLOWED_COMPONENT_STAGES = new Set<ProductComponent['stage']>([
  'baseline',
  'prototype',
  'released',
]);

const ALLOWED_LINK_RELATIONS = new Set<ParameterLink['relation']>([
  'functional',
  'constraint',
  'quality',
  'cost',
  'schedule',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertRecord(value: unknown, message: string): asserts value is Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(message);
  }
}

function assertString(value: unknown, message: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(message);
  }
}

function assertNumber(value: unknown, message: string): asserts value is number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(message);
  }
}

function assertBoolean(value: unknown, message: string): asserts value is boolean {
  if (typeof value !== 'boolean') {
    throw new Error(message);
  }
}

function validateComponent(component: unknown, index: number): asserts component is ProductComponent {
  assertRecord(component, `Component at index ${index} must be an object.`);
  assertString(component.id, `Component at index ${index} is missing id.`);
  assertString(component.name, `Component ${component.id} is missing name.`);

  if (component.parentId !== null) {
    assertString(component.parentId, `Component ${component.id} has an invalid parentId.`);
  }

  assertString(component.category, `Component ${component.id} is missing category.`);
  if (!ALLOWED_COMPONENT_CATEGORIES.has(component.category as ProductComponent['category'])) {
    throw new Error(`Component ${component.id} has an invalid category.`);
  }

  assertString(component.stage, `Component ${component.id} is missing stage.`);
  if (!ALLOWED_COMPONENT_STAGES.has(component.stage as ProductComponent['stage'])) {
    throw new Error(`Component ${component.id} has an invalid stage.`);
  }
}

function validateParameter(parameter: unknown, index: number): asserts parameter is ProductParameter {
  assertRecord(parameter, `Parameter at index ${index} must be an object.`);
  assertString(parameter.id, `Parameter at index ${index} is missing id.`);
  assertString(parameter.componentId, `Parameter ${parameter.id} is missing componentId.`);
  assertString(parameter.name, `Parameter ${parameter.id} is missing name.`);
  assertString(parameter.unit, `Parameter ${parameter.id} is missing unit.`);
  assertNumber(parameter.baselineValue, `Parameter ${parameter.id} is missing baselineValue.`);
  assertBoolean(parameter.changeable, `Parameter ${parameter.id} is missing changeable.`);
}

function validateParameterLink(link: unknown, index: number): asserts link is ParameterLink {
  assertRecord(link, `Parameter link at index ${index} must be an object.`);
  assertString(link.id, `Parameter link at index ${index} is missing id.`);
  assertString(link.sourceComponentId, `Parameter link ${link.id} is missing sourceComponentId.`);
  assertString(link.sourceParameterId, `Parameter link ${link.id} is missing sourceParameterId.`);
  assertString(link.targetComponentId, `Parameter link ${link.id} is missing targetComponentId.`);
  assertString(link.targetParameterId, `Parameter link ${link.id} is missing targetParameterId.`);
  assertString(link.relation, `Parameter link ${link.id} is missing relation.`);
  if (!ALLOWED_LINK_RELATIONS.has(link.relation as ParameterLink['relation'])) {
    throw new Error(`Parameter link ${link.id} has an invalid relation.`);
  }

  assertString(link.expression, `Parameter link ${link.id} is missing expression.`);
  if (!link.expression.trim()) {
    throw new Error(`Parameter link ${link.id} must include a non-empty expression.`);
  }

  assertNumber(link.impactWeight, `Parameter link ${link.id} is missing impactWeight.`);
}

function validateProductReferences(product: ProductDomain) {
  const componentById = new Map(product.components.map((component) => [component.id, component]));
  const parameterById = new Map(product.parameters.map((parameter) => [parameter.id, parameter]));

  for (const component of product.components) {
    if (component.parentId && !componentById.has(component.parentId)) {
      throw new Error(`Component ${component.id} references a missing parent component.`);
    }
  }

  for (const parameter of product.parameters) {
    if (!componentById.has(parameter.componentId)) {
      throw new Error(`Parameter component ${parameter.componentId} does not exist.`);
    }
  }

  for (const link of product.parameterLinks) {
    const sourceComponent = componentById.get(link.sourceComponentId);
    const targetComponent = componentById.get(link.targetComponentId);
    const sourceParameter = parameterById.get(link.sourceParameterId);
    const targetParameter = parameterById.get(link.targetParameterId);

    if (!sourceComponent) {
      throw new Error(`Parameter link ${link.id} references a missing source component.`);
    }
    if (!targetComponent) {
      throw new Error(`Parameter link ${link.id} references a missing target component.`);
    }
    if (!sourceParameter) {
      throw new Error(`Parameter link ${link.id} references a missing source parameter.`);
    }
    if (!targetParameter) {
      throw new Error(`Parameter link ${link.id} references a missing target parameter.`);
    }
    if (sourceParameter.componentId !== link.sourceComponentId) {
      throw new Error(`Parameter link ${link.id} source parameter does not belong to the source component.`);
    }
    if (targetParameter.componentId !== link.targetComponentId) {
      throw new Error(`Parameter link ${link.id} target parameter does not belong to the target component.`);
    }
  }
}

function validateUniqueIds(product: ProductDomain) {
  const componentIds = new Set<string>();
  const parameterIds = new Set<string>();
  const parameterLinkIds = new Set<string>();

  for (const component of product.components) {
    if (componentIds.has(component.id)) {
      throw new Error(`Duplicate component id "${component.id}" is not allowed.`);
    }
    componentIds.add(component.id);
  }

  for (const parameter of product.parameters) {
    if (parameterIds.has(parameter.id)) {
      throw new Error(`Duplicate parameter id "${parameter.id}" is not allowed.`);
    }
    parameterIds.add(parameter.id);
  }

  for (const parameterLink of product.parameterLinks) {
    if (parameterLinkIds.has(parameterLink.id)) {
      throw new Error(`Duplicate parameter link id "${parameterLink.id}" is not allowed.`);
    }
    parameterLinkIds.add(parameterLink.id);
  }
}

export function exportProductModel(product: ProductDomain): string {
  return JSON.stringify(
    {
      components: product.components,
      parameters: product.parameters,
      parameterLinks: product.parameterLinks,
    },
    null,
    2,
  );
}

export function importProductModel(raw: string): ProductDomain {
  const parsed = JSON.parse(raw) as unknown;
  assertRecord(
    parsed,
    'Imported product model must be an object with components, parameters, and parameterLinks.',
  );

  const { components, parameters, parameterLinks } = parsed;
  if (!Array.isArray(components) || !Array.isArray(parameters) || !Array.isArray(parameterLinks)) {
    throw new Error('Imported product model must include components, parameters, and parameterLinks arrays.');
  }

  components.forEach((component, index) => validateComponent(component, index));
  parameters.forEach((parameter, index) => validateParameter(parameter, index));
  parameterLinks.forEach((link, index) => validateParameterLink(link, index));

  const product: ProductDomain = {
    components,
    parameters,
    parameterLinks,
  };

  validateUniqueIds(product);
  validateProductReferences(product);

  return product;
}

export function mergeProductModels(current: ProductDomain, imported: ProductDomain): ProductDomain {
  const merged: ProductDomain = {
    components: [...current.components, ...imported.components],
    parameters: [...current.parameters, ...imported.parameters],
    parameterLinks: [...current.parameterLinks, ...imported.parameterLinks],
  };

  validateUniqueIds(merged);
  validateProductReferences(merged);

  return merged;
}
