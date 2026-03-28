import {
  WorkspaceModel,
  ParameterLink,
  SupplyPartner,
  SupplyRoute,
} from '../domain/workspace';
import {
  ChangeMagnitude,
  ChangeType,
  PathStage,
  PropagationAnalysisResult,
  PropagationPath,
  PropagationRequest,
  RiskLevel,
} from '../domain/analysis';

type QueueEntry = {
  parameterId: string;
  componentId: string;
  impact: number;
  stages: PathStage[];
  signature: string;
};

type VisitRecord = {
  componentId: string;
  impact: number;
  signature: string;
  stages: PathStage[];
};

type PartnerVisit = {
  impact: number;
  stages: PathStage[];
};

type StageRecord = {
  impact: number;
  costRisk: number;
  scheduleRisk: number;
  stages: PathStage[];
  signature: string;
};

type StageRecordInput = Omit<StageRecord, 'signature'>;

const EPSILON = 1e-6;

const magnitudeToFactor: Record<ChangeMagnitude, number> = {
  low: 0.25,
  medium: 0.5,
  high: 0.75,
  critical: 1,
};

const relationWeights: Record<ParameterLink['relation'], { impact: number; cost: number; schedule: number }> = {
  functional: { impact: 0.8, cost: 0.2, schedule: 0.2 },
  constraint: { impact: 0.6, cost: 0.4, schedule: 0.35 },
  quality: { impact: 0.6, cost: 0.25, schedule: 0.4 },
  cost: { impact: 0.7, cost: 0.7, schedule: 0.2 },
  schedule: { impact: 0.7, cost: 0.25, schedule: 0.7 },
};

const supplyRiskMultiplier: Record<SupplyPartner['riskProfile'], number> = {
  low: 0.95,
  medium: 1,
  high: 1.15,
};

const changeTypeModifiers: Record<ChangeType, { impact: number; cost: number; schedule: number }> = {
  'spec-change': { impact: 1.12, cost: 0.9, schedule: 0.95 },
  'cost-change': { impact: 0.92, cost: 1.2, schedule: 0.9 },
  'schedule-change': { impact: 0.9, cost: 0.85, schedule: 1.25 },
  'quality-change': { impact: 1, cost: 1.05, schedule: 1.05 },
};

const parameterKey = (parameterId: string) => `parameter:${parameterId}`;
const partnerKey = (partnerId: string) => `partner:${partnerId}`;
const routeKey = (routeId: string) => `route:${routeId}`;

function determineRiskLevel(score: number): RiskLevel {
  if (score < 30) return '\u4F4E';
  if (score < 60) return '\u4E2D';
  if (score < 80) return '\u9AD8';
  return '\u6781\u9AD8';
}

function selectTopPartner(partnerImpacts: Map<string, PartnerVisit>): { id: string; impact: number } | undefined {
  let top: { id: string; impact: number } | undefined;
  for (const [id, payload] of partnerImpacts.entries()) {
    if (!top || payload.impact > top.impact) {
      top = { id, impact: payload.impact };
    }
  }
  return top;
}

function stageElementSignature(stage: PathStage): string {
  switch (stage.kind) {
    case 'parameter':
      return `parameter:${stage.parameterId}`;
    case 'component':
      return `component:${stage.componentId}`;
    case 'partner':
      return `partner:${stage.partnerId}`;
    case 'route':
      return `route:${stage.routeId}`;
    case 'link':
      return `link:${stage.linkId}`;
  }
}

function buildStagesSignature(stages: PathStage[]): string {
  return stages.map((stage) => stageElementSignature(stage)).join('|');
}

function ensureStageRecord(
  records: Map<string, StageRecord>,
  key: string,
  record: StageRecordInput,
  signature?: string,
): boolean {
  const finalizedSignature = signature ?? buildStagesSignature(record.stages);
  const enriched: StageRecord = { ...record, signature: finalizedSignature };
  const existing = records.get(key);
  if (!existing) {
    records.set(key, enriched);
    return true;
  }

  if (record.impact > existing.impact + EPSILON) {
    records.set(key, enriched);
    return true;
  }

  if (Math.abs(record.impact - existing.impact) <= EPSILON) {
    if (finalizedSignature < existing.signature) {
      records.set(key, enriched);
      return true;
    }
  }

  return false;
}

function createLinkStage(link: ParameterLink): PathStage {
  return {
    kind: 'link',
    linkId: link.id,
    relation: link.relation,
    label: `${link.relation.toUpperCase()} ${link.id}`,
  };
}

export function analyzePropagation(
  workspace: WorkspaceModel,
  scenario: PropagationRequest,
): PropagationAnalysisResult {
  const parameterById = new Map(workspace.product.parameters.map((param) => [param.id, param]));
  const componentById = new Map(workspace.product.components.map((component) => [component.id, component]));
  const partnerById = new Map(workspace.supplyChain.partners.map((partner) => [partner.id, partner]));

  const typeModifier = changeTypeModifiers[scenario.changeType] ?? { impact: 1, cost: 1, schedule: 1 };
  const magnitudeFactor = magnitudeToFactor[scenario.changeMagnitude] ?? 0.5;
  const initialImpact = Math.min(100, magnitudeFactor * 100 * typeModifier.impact);

  const createComponentStage = (componentId: string): PathStage => {
    const component = componentById.get(componentId);
    return {
      kind: 'component',
      componentId,
      label: component ? component.name : `Component ${componentId}`,
    };
  };

  const buildParameterStages = (parameterId: string, fallbackComponentId?: string): PathStage[] => {
    const parameter = parameterById.get(parameterId);
    const resolvedComponentId = parameter?.componentId ?? fallbackComponentId ?? '';
    const stages: PathStage[] = [];
    if (resolvedComponentId) {
      stages.push(createComponentStage(resolvedComponentId));
    }
    const componentLabel = componentById.get(resolvedComponentId)?.name ?? resolvedComponentId;
    const parameterLabel = parameter?.name ?? parameterId;
    stages.push({
      kind: 'parameter',
      parameterId,
      componentId: resolvedComponentId,
      label: `${componentLabel} · ${parameterLabel}`,
    });
    return stages;
  };

  const createPartnerStage = (partnerId: string): PathStage => {
    const partner = partnerById.get(partnerId);
    return {
      kind: 'partner',
      partnerId,
      label: partner ? partner.name : `Partner ${partnerId}`,
    };
  };

  const createRouteStage = (route: SupplyRoute): PathStage => ({
    kind: 'route',
    routeId: route.id,
    label: `${route.mode.toUpperCase()} ${route.id}`,
  });

  const parameterLinksBySource = new Map<string, ParameterLink[]>();
  workspace.product.parameterLinks
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .forEach((link) => {
      const list = parameterLinksBySource.get(link.sourceParameterId) ?? [];
      list.push(link);
      parameterLinksBySource.set(link.sourceParameterId, list);
    });

  const initialStages = buildParameterStages(scenario.sourceParameterId, scenario.sourceComponentId);
  const initialSignature = buildStagesSignature(initialStages);

  const queue: QueueEntry[] = [
    {
      parameterId: scenario.sourceParameterId,
      componentId: scenario.sourceComponentId,
      impact: initialImpact,
      stages: initialStages,
      signature: initialSignature,
    },
  ];

  const visited = new Map<string, VisitRecord>();
  const stageRecords = new Map<string, StageRecord>();
  ensureStageRecord(
    stageRecords,
    parameterKey(scenario.sourceParameterId),
    {
      impact: initialImpact,
      costRisk: 0,
      scheduleRisk: 0,
      stages: initialStages,
    },
    initialSignature,
  );

  const relationFallback = { impact: 0.6, cost: 0.25, schedule: 0.25 };

  while (queue.length > 0) {
    const current = queue.shift()!;
    const recorded = visited.get(current.parameterId);
    if (
      recorded &&
      (recorded.impact > current.impact + EPSILON ||
        (Math.abs(recorded.impact - current.impact) <= EPSILON &&
          recorded.signature <= current.signature))
    ) {
      continue;
    }

    visited.set(current.parameterId, {
      componentId: current.componentId,
      impact: current.impact,
      signature: current.signature,
      stages: current.stages,
    });

    const outgoing = parameterLinksBySource.get(current.parameterId) ?? [];
    for (const link of outgoing) {
      const weights = relationWeights[link.relation] ?? relationFallback;
      const nextImpact = Math.min(
        100,
        current.impact * link.impactWeight * weights.impact * typeModifier.impact,
      );
      if (nextImpact <= 0) continue;

      const linkStage = createLinkStage(link);
      const targetStages = buildParameterStages(link.targetParameterId, link.targetComponentId);
      const nextStages = [...current.stages, linkStage, ...targetStages];
      const nextSignature = buildStagesSignature(nextStages);
      const costContribution = Math.min(100, nextImpact * weights.cost * typeModifier.cost);
      const scheduleContribution = Math.min(100, nextImpact * weights.schedule * typeModifier.schedule);

      const updated = ensureStageRecord(
        stageRecords,
        parameterKey(link.targetParameterId),
        {
          impact: nextImpact,
          costRisk: costContribution,
          scheduleRisk: scheduleContribution,
          stages: nextStages,
        },
        nextSignature,
      );

      if (updated) {
        queue.push({
          parameterId: link.targetParameterId,
          componentId: link.targetComponentId,
          impact: nextImpact,
          stages: nextStages,
          signature: nextSignature,
        });
      }
    }
  }

  const componentImpacts = new Map<string, VisitRecord>();
  visited.forEach((record) => {
    const existing = componentImpacts.get(record.componentId);
    if (!existing || record.impact > existing.impact) {
      componentImpacts.set(record.componentId, record);
    }
  });

  const orderedPartners = [...workspace.supplyChain.partners].sort((a, b) => a.id.localeCompare(b.id));
  const partnerImpacts = new Map<string, PartnerVisit>();
  const partnerQueue: Array<{ partnerId: string; impact: number; stages: PathStage[] }> = [];

  orderedPartners.forEach((partner) => {
    let bestImpact = 0;
    let bestStages: PathStage[] = [];

    for (const allocation of partner.supplies) {
      const componentRecord = componentImpacts.get(allocation.componentId);
      if (!componentRecord) continue;

      const leadTimeFactor = 1 + allocation.leadTimeDays / 45;
      const riskMultiplier = supplyRiskMultiplier[partner.riskProfile] ?? 1;
      const candidateImpact = Math.min(
        100,
        componentRecord.impact * leadTimeFactor * riskMultiplier * typeModifier.impact,
      );

      if (candidateImpact > bestImpact) {
        bestImpact = candidateImpact;
        bestStages = [...componentRecord.stages, createPartnerStage(partner.id)];
      }
    }

    if (bestImpact > 0) {
      const partnerSignature = buildStagesSignature(bestStages);
      const updated = ensureStageRecord(
        stageRecords,
        partnerKey(partner.id),
        {
          impact: bestImpact,
          costRisk: Math.min(100, bestImpact * 0.3 * typeModifier.cost),
          scheduleRisk: Math.min(100, bestImpact * 0.25 * typeModifier.schedule),
          stages: bestStages.map((stage) => ({ ...stage })),
        },
        partnerSignature,
      );
      if (updated) {
        partnerImpacts.set(partner.id, { impact: bestImpact, stages: bestStages });
        partnerQueue.push({
          partnerId: partner.id,
          impact: bestImpact,
          stages: bestStages,
        });
      }
    }
  });

  const routeAdjacency = new Map<string, SupplyRoute[]>();
  workspace.supplyChain.routes.forEach((route) => {
    const outgoing = routeAdjacency.get(route.sourcePartnerId) ?? [];
    outgoing.push(route);
    routeAdjacency.set(route.sourcePartnerId, outgoing);
  });
  routeAdjacency.forEach((routes) =>
    routes.sort((a, b) => {
      const targetComparison = a.targetPartnerId.localeCompare(b.targetPartnerId);
      if (targetComparison !== 0) return targetComparison;
      return a.id.localeCompare(b.id);
    }),
  );

  while (partnerQueue.length > 0) {
    const entry = partnerQueue.shift()!;
    const routes = routeAdjacency.get(entry.partnerId) ?? [];

    for (const route of routes) {
      const reliabilityPenalty = 1 + (1 - route.reliability);
      const transitPenalty = 1 + route.transitDays / 40;
      const routeImpact = Math.min(
        100,
        entry.impact * reliabilityPenalty * transitPenalty * 0.9 * typeModifier.impact,
      );
      if (routeImpact <= 0) continue;

      const routeStages = [
        ...entry.stages,
        createRouteStage(route),
        createPartnerStage(route.targetPartnerId),
      ];
      const routeSignature = buildStagesSignature(routeStages);
      const routeCost = Math.min(100, routeImpact * 0.25 * typeModifier.cost);
      const routeSchedule = Math.min(100, routeImpact * 0.35 * typeModifier.schedule);

      ensureStageRecord(
        stageRecords,
        routeKey(route.id),
        {
          impact: routeImpact,
          costRisk: routeCost,
          scheduleRisk: routeSchedule,
          stages: routeStages,
        },
        routeSignature,
      );

      const updatedPartner = ensureStageRecord(
        stageRecords,
        partnerKey(route.targetPartnerId),
        {
          impact: routeImpact,
          costRisk: routeCost,
          scheduleRisk: routeSchedule,
          stages: routeStages.map((stage) => ({ ...stage })),
        },
        routeSignature,
      );

      if (updatedPartner) {
        partnerImpacts.set(route.targetPartnerId, { impact: routeImpact, stages: routeStages });
        partnerQueue.push({
          partnerId: route.targetPartnerId,
          impact: routeImpact,
          stages: routeStages,
        });
      }
    }
  }

  const propagationPaths = Array.from(stageRecords.entries())
    .map(([id, record]) => ({
      id,
      stages: record.stages,
      impactScore: record.impact,
      costRisk: record.costRisk,
      scheduleRisk: record.scheduleRisk,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const componentSet = new Set<string>();
  const parameterSet = new Set<string>();
  const partnerSet = new Set<string>();
  const routeSet = new Set<string>();

  propagationPaths.forEach((path) => {
    path.stages.forEach((stage) => {
      if (stage.kind === 'component' && stage.componentId) {
        componentSet.add(stage.componentId);
        return;
      }
      if (stage.kind === 'parameter') {
        parameterSet.add(stage.parameterId);
        if (stage.componentId) {
          componentSet.add(stage.componentId);
        }
        return;
      }
      if (stage.kind === 'partner' && stage.partnerId) {
        partnerSet.add(stage.partnerId);
        return;
      }
      if (stage.kind === 'route' && stage.routeId) {
        routeSet.add(stage.routeId);
      }
    });
  });

  const affectedNodeCount =
    componentSet.size + parameterSet.size + partnerSet.size + routeSet.size;

  const pathCount = Math.max(1, propagationPaths.length);
  const totalImpact = propagationPaths.reduce((sum, path) => sum + path.impactScore, 0);
  const overallScore = Math.min(100, totalImpact / pathCount);
  const costRisk = Math.min(
    100,
    propagationPaths.reduce((sum, path) => sum + path.costRisk, 0) / pathCount,
  );
  const scheduleRisk = Math.min(
    100,
    propagationPaths.reduce((sum, path) => sum + path.scheduleRisk, 0) / pathCount,
  );

  const riskLevel = determineRiskLevel(overallScore);
  const topPartner = selectTopPartner(partnerImpacts);
  const highlights = buildHighlights({
    scenario,
    componentCount: componentImpacts.size,
    partnerCount: partnerImpacts.size,
    topPartner,
    overallScore,
    riskLevel,
  });

  const componentsList = Array.from(componentImpacts.keys()).join(', ');
  const details: string[] = [
    `Cost risk ${costRisk.toFixed(1)}, schedule risk ${scheduleRisk.toFixed(1)} via ${propagationPaths.length} paths`,
  ];
  if (componentsList) {
    details.push(`Components affected: ${componentsList}`);
  }

  return {
    affectedNodeCount,
    propagationPaths,
    overallScore,
    costRisk,
    scheduleRisk,
    riskLevel,
    highlights,
    details,
  };
}

function buildHighlights(params: {
  scenario: PropagationRequest;
  componentCount: number;
  partnerCount: number;
  topPartner?: { id: string; impact: number };
  overallScore: number;
  riskLevel: RiskLevel;
}): string[] {
  const entries = [
    `Change ${params.scenario.changeType} on ${params.scenario.sourceComponentId}.${params.scenario.sourceParameterId} (magnitude ${params.scenario.changeMagnitude})`,
    `Impacted ${params.componentCount} components and ${params.partnerCount} partners`,
    params.topPartner
      ? `Top partner ${params.topPartner.id} impact ${params.topPartner.impact.toFixed(1)}`
      : undefined,
    `Overall risk ${params.riskLevel} at ${params.overallScore.toFixed(1)}`,
  ];

  return entries.filter((entry): entry is string => Boolean(entry));
}
