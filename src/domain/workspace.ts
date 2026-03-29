import { ChangeScenario, PropagationAnalysisResult } from './analysis';

export type ProductDomain = {
  components: ProductComponent[];
  parameters: ProductParameter[];
  parameterLinks: ParameterLink[];
};

export type ProductComponent = {
  id: string;
  name: string;
  parentId: string | null;
  category: 'system' | 'assembly' | 'module' | 'component';
  stage: 'baseline' | 'prototype' | 'released';
  description?: string;
  tags?: string[];
};

export type ProductParameter = {
  id: string;
  componentId: string;
  name: string;
  unit: string;
  baselineValue: number;
  minValue?: number;
  maxValue?: number;
  changeable: boolean;
  propagationRule?: string;
  constraintCondition?: string;
  constraintRange?: string;
  notes?: string;
};

export type ParameterLink = {
  id: string;
  sourceComponentId: string;
  sourceParameterId: string;
  targetComponentId: string;
  targetParameterId: string;
  relation: 'functional' | 'constraint' | 'quality' | 'cost' | 'schedule';
  expression: string;
  impactWeight: number;
};

export type SupplyChainDomain = {
  partners: SupplyPartner[];
  routes: SupplyRoute[];
};

export type SupplyAllocation = {
  componentId: string;
  quantityPerWeek: number;
  leadTimeDays: number;
  notes?: string;
};

export type SupplyService = {
  componentId: string;
  serviceName: string;
  leadTimeDays: number;
  notes?: string;
};

export type SupplyPartner = {
  id: string;
  name: string;
  location: string;
  role: 'supplier' | 'assembler' | 'logistics';
  specialties: string[];
  riskProfile: 'low' | 'medium' | 'high';
  supplies: SupplyAllocation[];
  services: SupplyService[];
};

export type SupplyRoute = {
  id: string;
  sourcePartnerId: string;
  targetPartnerId: string;
  mode: 'sea' | 'air' | 'land';
  transitDays: number;
  reliability: number;
  constraints?: string;
};

export type WorkspaceModel = {
  product: ProductDomain;
  supplyChain: SupplyChainDomain;
  changeScenario: ChangeScenario;
  analysis: PropagationAnalysisResult | null;
};
