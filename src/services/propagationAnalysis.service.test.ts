import { analyzePropagation } from './propagationAnalysis.service';
import { demoWorkspace } from '../data/demoWorkspace';
import { PathStage, PropagationPath } from '../domain/analysis';

const requestTemplate = {
  sourceComponentId: 'comp_cpu',
  sourceParameterId: 'param_cpu_frequency',
  changeMagnitude: 'high' as const,
};

const buildRouteReorderedWorkspace = () => {
  const clone = JSON.parse(JSON.stringify(demoWorkspace));
  clone.supplyChain.routes = [...clone.supplyChain.routes].reverse();
  return clone;
};

const buildPartnerReorderedWorkspace = () => {
  const clone = JSON.parse(JSON.stringify(demoWorkspace));
  clone.supplyChain.partners = [...clone.supplyChain.partners].reverse();
  return clone;
};

const buildConvergingWorkspace = (order: 'normal' | 'reverse') => {
  const clone = JSON.parse(JSON.stringify(demoWorkspace));
  const originalLinkIndex = clone.product.parameterLinks.findIndex(
    (link: any) => link.id === 'link_cpu_freq_battery',
  );
  if (originalLinkIndex === -1) throw new Error('missing reference link');

  const originalLink = { ...clone.product.parameterLinks[originalLinkIndex] };
  const alternateLink = {
    id: 'link_cpu_freq_battery_alt',
    sourceComponentId: originalLink.sourceComponentId,
    sourceParameterId: originalLink.sourceParameterId,
    targetComponentId: originalLink.targetComponentId,
    targetParameterId: originalLink.targetParameterId,
    relation: originalLink.relation,
    expression: originalLink.expression,
    impactWeight: originalLink.impactWeight,
  };

  const otherLinks = clone.product.parameterLinks.filter(
    (link: any) => link.id !== 'link_cpu_freq_battery',
  );

  const orderedLinks =
    order === 'normal'
      ? [...otherLinks, originalLink, alternateLink]
      : [...otherLinks, alternateLink, originalLink];

  clone.product.parameterLinks = orderedLinks;
  return clone;
};

const buildDuplicateRouteWorkspace = (order: 'primary' | 'secondary') => {
  const clone = JSON.parse(JSON.stringify(demoWorkspace));
  clone.supplyChain.routes =
    clone.supplyChain.routes.filter((route: any) => route.id !== 'route_board_to_distributor');

  const duplicateRoutes = [
    {
      id: 'route_dup_alpha',
      sourcePartnerId: 'partner_boarder',
      targetPartnerId: 'partner_distributor',
      mode: 'sea',
      transitDays: 12,
      reliability: 0.88,
    },
    {
      id: 'route_dup_beta',
      sourcePartnerId: 'partner_boarder',
      targetPartnerId: 'partner_distributor',
      mode: 'sea',
      transitDays: 12,
      reliability: 0.88,
    },
  ];

  clone.supplyChain.routes = [
    ...clone.supplyChain.routes,
    ...(order === 'primary' ? duplicateRoutes : duplicateRoutes.slice().reverse()),
  ];

  return clone;
};

const stageSignature = (stage: PathStage) => {
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
};

const pathSignature = (path: PropagationPath) => path.stages.map(stageSignature).join('|');

const EXTREME_RISK = '\u6781\u9AD8';

describe('analyzePropagation', () => {
  test('reports localized risk, highlights, and details', () => {
    const result = analyzePropagation(demoWorkspace, {
      ...requestTemplate,
      changeType: 'spec-change',
      changeMagnitude: 'critical',
    });

    expect(result.riskLevel).toBe(EXTREME_RISK);
    expect(result.highlights.some((text) => text.includes('spec-change'))).toBe(true);
    expect(result.details.some((text) => /Cost risk/i.test(text))).toBe(true);
  });

  test('changeType modifiers influence score and cost risk', () => {
    const specResult = analyzePropagation(demoWorkspace, {
      ...requestTemplate,
      changeType: 'spec-change',
    });
    const costResult = analyzePropagation(demoWorkspace, {
      ...requestTemplate,
      changeType: 'cost-change',
    });

    expect(specResult.overallScore).toBeGreaterThan(costResult.overallScore);
    expect(specResult.costRisk).toBeLessThanOrEqual(costResult.costRisk);
  });

  test('route and partner ordering have no effect on canonical output', () => {
    const baseResult = analyzePropagation(demoWorkspace, {
      ...requestTemplate,
      changeType: 'spec-change',
    });
    const routeReordered = analyzePropagation(buildRouteReorderedWorkspace(), {
      ...requestTemplate,
      changeType: 'spec-change',
    });
    const partnerReordered = analyzePropagation(buildPartnerReorderedWorkspace(), {
      ...requestTemplate,
      changeType: 'spec-change',
    });

    const assertOrderNeutral = (variant: ReturnType<typeof analyzePropagation>) => {
      expect(variant.overallScore).toBe(baseResult.overallScore);
      expect(variant.riskLevel).toBe(baseResult.riskLevel);
      expect(variant.affectedNodeCount).toBe(baseResult.affectedNodeCount);
      expect(variant.propagationPaths.length).toBe(baseResult.propagationPaths.length);
    };

    assertOrderNeutral(routeReordered);
    assertOrderNeutral(partnerReordered);

    const reachesLogistics = (result: ReturnType<typeof analyzePropagation>) =>
      result.propagationPaths.some((path) =>
        path.stages.some(
          (stage) => stage.kind === 'partner' && stage.partnerId === 'partner_logistics',
        ),
      );

    expect(reachesLogistics(baseResult)).toBe(true);
    expect(reachesLogistics(routeReordered)).toBe(true);
    expect(reachesLogistics(partnerReordered)).toBe(true);
  });

  test('canonical parameter propagation ties are order-independent', () => {
    const normal = analyzePropagation(buildConvergingWorkspace('normal'), {
      ...requestTemplate,
      changeType: 'spec-change',
    });
    const reversed = analyzePropagation(buildConvergingWorkspace('reverse'), {
      ...requestTemplate,
      changeType: 'spec-change',
    });

    expect(normal.overallScore).toBe(reversed.overallScore);
    expect(normal.riskLevel).toBe(reversed.riskLevel);
    expect(normal.affectedNodeCount).toBe(reversed.affectedNodeCount);
    expect(normal.propagationPaths.length).toBe(reversed.propagationPaths.length);

    const normalPath = normal.propagationPaths.find(
      (path) => path.id === 'parameter:param_battery_capacity',
    );
    const reversedPath = reversed.propagationPaths.find(
      (path) => path.id === 'parameter:param_battery_capacity',
    );

    expect(normalPath).toBeDefined();
    expect(reversedPath).toBeDefined();

    const normalSignature = pathSignature(normalPath!);
    const reversedSignature = pathSignature(reversedPath!);
    expect(normalSignature).toBe(reversedSignature);
    expect(normalSignature).toContain('link:link_cpu_freq_battery');
  });

  test('duplicate routes with equal impact resolve to the canonical path', () => {
    const primary = analyzePropagation(buildDuplicateRouteWorkspace('primary'), {
      ...requestTemplate,
      changeType: 'spec-change',
    });
    const secondary = analyzePropagation(buildDuplicateRouteWorkspace('secondary'), {
      ...requestTemplate,
      changeType: 'spec-change',
    });

    const primaryPartnerPath = primary.propagationPaths.find(
      (path) => path.id === 'partner:partner_distributor',
    );
    const secondaryPartnerPath = secondary.propagationPaths.find(
      (path) => path.id === 'partner:partner_distributor',
    );

    expect(primaryPartnerPath).toBeDefined();
    expect(secondaryPartnerPath).toBeDefined();
    expect(primaryPartnerPath?.impactScore).toBeCloseTo(secondaryPartnerPath?.impactScore ?? 0);
    expect(pathSignature(primaryPartnerPath!)).toBe(pathSignature(secondaryPartnerPath!));
    expect(pathSignature(primaryPartnerPath!)).toContain('route:route_dup_alpha');
  });

  test('path stages include typed component and parameter sequence', () => {
    const result = analyzePropagation(demoWorkspace, {
      ...requestTemplate,
      changeType: 'spec-change',
    });

    const cpuParameterPaths = result.propagationPaths.filter((path) =>
      path.stages.some(
        (stage) => stage.kind === 'parameter' && stage.parameterId === 'param_cpu_frequency',
      ),
    );
    expect(cpuParameterPaths.length).toBeGreaterThan(0);

    const componentStagePresent = cpuParameterPaths.some((path) =>
      path.stages.some(
        (stage) => stage.kind === 'component' && stage.componentId === 'comp_cpu',
      ),
    );
    expect(componentStagePresent).toBe(true);
  });
});
