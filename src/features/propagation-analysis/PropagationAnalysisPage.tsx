import { startTransition, useEffect, useState } from 'react';
import { ChangeScenario } from '../../domain/analysis';
import { ProductParameter } from '../../domain/workspace';
import { buildKnowledgeGraphView } from '../../services/knowledgeGraph.service';
import { analyzePropagation } from '../../services/propagationAnalysis.service';
import { buildTopologyLayout } from '../../services/topologyLayout.service';
import { useWorkspace } from '../../store/workspaceStore';
import ImpactDetailList from './ImpactDetailList';
import ImpactSummary from './ImpactSummary';
import PropagationCanvas from './PropagationCanvas';
import ScenarioForm from './ScenarioForm';

function getParametersForComponent(componentId: string, parameters: ProductParameter[]) {
  return parameters.filter((parameter) => parameter.componentId === componentId);
}

export default function PropagationAnalysisPage() {
  const { state, setState } = useWorkspace();
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    state.changeScenario.sourceComponentId ?? null,
  );

  const availableParameters = getParametersForComponent(
    state.changeScenario.sourceComponentId,
    state.product.parameters,
  );

  const graph = buildKnowledgeGraphView(state);
  const fallbackNodeId = state.changeScenario.sourceComponentId ?? graph.nodes[0]?.id ?? null;
  const resolvedNodeId =
    selectedNodeId && graph.nodes.some((node) => node.id === selectedNodeId)
      ? selectedNodeId
      : fallbackNodeId;
  const layout = buildTopologyLayout(graph, {
    sourceNodeId: state.changeScenario.sourceComponentId ?? resolvedNodeId ?? undefined,
  });

  useEffect(() => {
    if (!state.analysis) {
      setSelectedPathId(null);
      return;
    }

    const fallbackPathId = state.analysis.propagationPaths[0]?.id ?? null;
    setSelectedPathId((current) => {
      if (current && state.analysis?.propagationPaths.some((path) => path.id === current)) {
        return current;
      }
      return fallbackPathId;
    });
  }, [state.analysis]);

  useEffect(() => {
    if (resolvedNodeId !== selectedNodeId) {
      setSelectedNodeId(resolvedNodeId);
    }
  }, [resolvedNodeId, selectedNodeId]);

  const updateScenario = (updates: Partial<ChangeScenario>) => {
    setState((current) => ({
      ...current,
      changeScenario: {
        ...current.changeScenario,
        ...updates,
      },
    }));
  };

  const handleComponentChange = (componentId: string) => {
    const nextParameters = getParametersForComponent(componentId, state.product.parameters);
    const nextParameterId =
      nextParameters.find((parameter) => parameter.id === state.changeScenario.sourceParameterId)?.id ??
      nextParameters[0]?.id ??
      '';

    setState((current) => ({
      ...current,
      changeScenario: {
        ...current.changeScenario,
        sourceComponentId: componentId,
        sourceParameterId: nextParameterId,
      },
    }));
    setSelectedNodeId(componentId);
  };

  const handleAnalyze = () => {
    const result = analyzePropagation(state, state.changeScenario);

    startTransition(() => {
      setState((current) => ({
        ...current,
        analysis: result,
      }));
      setSelectedPathId(result.propagationPaths[0]?.id ?? null);
      setSelectedNodeId(state.changeScenario.sourceComponentId);
    });
  };

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,_rgba(2,6,23,1)_0%,_rgba(30,41,59,0.98)_48%,_rgba(120,53,15,0.96)_100%)] px-6 py-6 text-white shadow-[0_30px_80px_-40px_rgba(2,6,23,0.9)]">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-amber-300/15 blur-3xl" />
        <div className="relative max-w-3xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/80">
            Deterministic Impact Analysis
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">变更效应传播可视化</h1>
          <p className="text-sm text-slate-300">
            通过统一工作区中的变更场景、产品参数链路和供应链节点，计算可解释、可复现的变更传播结果。
          </p>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[320px_1fr_340px]">
        <ScenarioForm
          scenario={state.changeScenario}
          components={state.product.components}
          availableParameters={availableParameters}
          onScenarioChange={updateScenario}
          onComponentChange={handleComponentChange}
          onAnalyze={handleAnalyze}
        />

        <PropagationCanvas
          graph={graph}
          layout={layout}
          analysis={state.analysis}
          selectedPathId={selectedPathId}
          selectedNodeId={resolvedNodeId}
          onSelectNode={setSelectedNodeId}
        />

        <div className="space-y-5">
          <ImpactSummary analysis={state.analysis} />
          <ImpactDetailList
            analysis={state.analysis}
            selectedPathId={selectedPathId}
            onSelectPath={setSelectedPathId}
          />
        </div>
      </div>
    </div>
  );
}
