export type ChangeType = 'spec-change' | 'cost-change' | 'schedule-change' | 'quality-change';
export type ChangeMagnitude = 'low' | 'medium' | 'high' | 'critical';

export type ChangeScenario = {
  id: string;
  name: string;
  description: string;
  sourceComponentId: string;
  sourceParameterId: string;
  changeType: ChangeType;
  changeMagnitude: ChangeMagnitude;
  rationale: string;
  createdAt: string;
};

export type PropagationRequest = Pick<
  ChangeScenario,
  'sourceComponentId' | 'sourceParameterId' | 'changeType' | 'changeMagnitude'
>;

export type PropagationPath = {
  id: string;
  stages: PathStage[];
  impactScore: number;
  costRisk: number;
  scheduleRisk: number;
};

export type RiskLevel = '\u4F4E' | '\u4E2D' | '\u9AD8' | '\u6781\u9AD8';

export type ParameterStage = {
  kind: 'parameter';
  parameterId: string;
  componentId: string;
  label: string;
};

export type ComponentStage = {
  kind: 'component';
  componentId: string;
  label: string;
};

export type PartnerStage = {
  kind: 'partner';
  partnerId: string;
  label: string;
};

export type RouteStage = {
  kind: 'route';
  routeId: string;
  label: string;
};

export type LinkStage = {
  kind: 'link';
  linkId: string;
  relation: 'functional' | 'constraint' | 'quality' | 'cost' | 'schedule';
  label: string;
};

export type PathStage = ParameterStage | ComponentStage | PartnerStage | RouteStage | LinkStage;

export type PropagationAnalysisResult = {
  affectedNodeCount: number;
  propagationPaths: PropagationPath[];
  overallScore: number;
  costRisk: number;
  scheduleRisk: number;
  riskLevel: RiskLevel;
  highlights: string[];
  details: string[];
};
