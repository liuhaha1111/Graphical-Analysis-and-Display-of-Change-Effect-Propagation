import { useMemo, useState } from 'react';
import PanelCard from '../../components/ui/PanelCard';
import { SupplyPartner } from '../../domain/workspace';
import { filterKnowledgeGraphByRelationTypes } from '../../services/knowledgeGraphFilters';
import { buildKnowledgeGraphView, GraphEdge } from '../../services/knowledgeGraph.service';
import { buildKnowledgeGraphSubgraph } from '../../services/knowledgeGraphSubgraph';
import { buildTopology3DLayout } from '../../services/topology3DLayout.service';
import { buildTopologyLayout } from '../../services/topologyLayout.service';
import { useWorkspace } from '../../store/workspaceStore';
import KnowledgeGraphCanvas from './KnowledgeGraphCanvas';
import KnowledgeGraphSidebar, { RELATION_TYPE_LABELS } from './KnowledgeGraphSidebar';

const ROLE_LABELS: Record<SupplyPartner['role'], string> = {
  supplier: '供应商',
  assembler: '装配商',
  logistics: '物流商',
};

const RISK_LABELS: Record<SupplyPartner['riskProfile'], string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};

const ALL_RELATION_TYPES: GraphEdge['type'][] = [
  'assembly',
  'configuration',
  'supply',
  'service',
  'transaction',
];

export default function KnowledgeGraphPage() {
  const { state } = useWorkspace();
  const sourceNodeId = state.changeScenario.sourceComponentId ?? null;
  const fullGraph = useMemo(() => buildKnowledgeGraphView(state), [state]);

  const [selectedRelationTypes, setSelectedRelationTypes] =
    useState<GraphEdge['type'][]>(ALL_RELATION_TYPES);
  const [focusNodeId] = useState<string | null>(sourceNodeId);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(sourceNodeId);
  const [expandedNodeIds, setExpandedNodeIds] = useState<string[]>([]);

  const visibleGraph = useMemo(
    () => filterKnowledgeGraphByRelationTypes(fullGraph, selectedRelationTypes),
    [fullGraph, selectedRelationTypes],
  );

  const preferredVisibleSourceId =
    sourceNodeId && visibleGraph.nodes.some((node) => node.id === sourceNodeId) ? sourceNodeId : null;
  const hasFocusNode =
    focusNodeId !== null && visibleGraph.nodes.some((node) => node.id === focusNodeId);
  const hasSelectedNode =
    selectedNodeId !== null && visibleGraph.nodes.some((node) => node.id === selectedNodeId);
  const resolvedFocusNodeId =
    (hasFocusNode ? focusNodeId : null) ??
    (hasSelectedNode ? selectedNodeId : null) ??
    preferredVisibleSourceId ??
    visibleGraph.nodes[0]?.id ??
    null;

  const localGraph = useMemo(
    () =>
      buildKnowledgeGraphSubgraph(visibleGraph, {
        focusNodeId: resolvedFocusNodeId,
        expandedNodeIds,
      }),
    [expandedNodeIds, resolvedFocusNodeId, visibleGraph],
  );

  const hasSelectedNodeInLocalGraph =
    selectedNodeId !== null && localGraph.nodes.some((node) => node.id === selectedNodeId);
  const resolvedSelectedNodeId =
    (hasSelectedNodeInLocalGraph ? selectedNodeId : null) ?? resolvedFocusNodeId;

  const layout = useMemo(() => {
    const layout2D = buildTopologyLayout(localGraph, {
      sourceNodeId: resolvedFocusNodeId ?? undefined,
    });

    return buildTopology3DLayout(layout2D);
  }, [localGraph, resolvedFocusNodeId]);

  const focusNode = localGraph.nodes.find((node) => node.id === resolvedFocusNodeId) ?? null;
  const selectedNode = localGraph.nodes.find((node) => node.id === resolvedSelectedNodeId) ?? null;
  const selectedComponent = state.product.components.find((component) => component.id === resolvedSelectedNodeId);
  const selectedPartner = state.supplyChain.partners.find((partner) => partner.id === resolvedSelectedNodeId);
  const connectedEdges = selectedNode
    ? localGraph.edges.filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id)
    : [];
  const connectedNodeCount = selectedNode
    ? new Set(
        connectedEdges.map((edge) => (edge.source === selectedNode.id ? edge.target : edge.source)),
      ).size
    : 0;
  const connectionSummaries = ALL_RELATION_TYPES.flatMap((type) => {
    const count = connectedEdges.filter((edge) => edge.type === type).length;
    return count > 0 ? [{ type, count }] : [];
  });

  const toggleRelationType = (type: GraphEdge['type']) => {
    setSelectedRelationTypes((current) =>
      current.includes(type)
        ? current.filter((candidate) => candidate !== type)
        : ALL_RELATION_TYPES.filter((candidate) => current.includes(candidate) || candidate === type),
    );
    setExpandedNodeIds([]);
  };

  const handleSelectNode = (nodeId: string) => {
    if (nodeId === resolvedSelectedNodeId) {
      return;
    }

    setSelectedNodeId(nodeId);
  };

  const handleExpandNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setExpandedNodeIds((current) =>
      current.includes(nodeId) ? current : [...current, nodeId],
    );
  };

  const handleResetView = () => {
    setExpandedNodeIds([]);
    setSelectedNodeId(resolvedFocusNodeId);
  };

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,_rgba(2,6,23,1)_0%,_rgba(15,23,42,0.98)_48%,_rgba(3,105,161,0.92)_100%)] px-6 py-6 text-white shadow-[0_30px_80px_-40px_rgba(2,6,23,0.9)]">
        <div className="absolute left-0 top-0 h-40 w-40 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="relative max-w-3xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
            Shared Topology View
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">产品设计知识图谱</h1>
          <p className="text-sm text-slate-300">
            图谱基于 3012 个真实实体构建，默认仅展示当前筛选结果中的局部子图，用户可围绕当前焦点逐步展开一跳邻域。
          </p>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[320px_1fr_320px]">
        <KnowledgeGraphSidebar
          totalGraph={fullGraph}
          visibleGraph={visibleGraph}
          selectedNodeName={focusNode?.name}
          selectedRelationTypes={selectedRelationTypes}
          onToggleRelationType={toggleRelationType}
        />

        <KnowledgeGraphCanvas
          layout={layout}
          selectedNodeId={resolvedSelectedNodeId}
          focusNodeId={resolvedFocusNodeId}
          onSelect={handleSelectNode}
          onExpand={handleExpandNode}
          onResetView={handleResetView}
        />

        <PanelCard
          title="节点详情"
          eyebrow="Detail Focus"
          description="查看当前局部子图焦点的产品属性、供应属性，以及当前可见关系摘要。"
          className="bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(241,245,249,0.98))]"
        >
          {!selectedNode ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              当前筛选下无可见节点
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-[24px] border border-slate-200 bg-slate-950 p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
                  {selectedNode.kind === 'component' ? 'Product Node' : 'Supply Node'}
                </p>
                <h2 className="mt-2 text-2xl font-semibold">{selectedNode.name}</h2>
                <p className="mt-2 text-sm text-slate-300">
                  {selectedComponent?.description ?? selectedPartner?.location ?? '当前节点暂无额外说明。'}
                </p>
              </div>

              {selectedComponent ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">产品属性</p>
                    <p className="mt-3 text-sm text-slate-700">类别: {selectedComponent.category}</p>
                    <p className="mt-1 text-sm text-slate-700">阶段: {selectedComponent.stage}</p>
                    <p className="mt-1 text-sm text-slate-700">
                      标签: {selectedComponent.tags?.join(', ') ?? '无'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">参数数量</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-950">
                      {
                        state.product.parameters.filter(
                          (parameter) => parameter.componentId === selectedComponent.id,
                        ).length
                      }
                    </p>
                  </div>
                </div>
              ) : null}

              {selectedPartner ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">供应节点属性</p>
                    <p className="mt-3 text-sm text-slate-700">位置: {selectedPartner.location}</p>
                    <p className="mt-1 text-sm text-slate-700">角色: {ROLE_LABELS[selectedPartner.role]}</p>
                    <p className="mt-1 text-sm text-slate-700">风险: {RISK_LABELS[selectedPartner.riskProfile]}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">能力标签</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedPartner.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">当前可见关系摘要</p>
                {connectedEdges.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">当前筛选下，该节点没有可见连接关系。</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {connectionSummaries.map((summary) => (
                        <div
                          key={summary.type}
                          className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-700"
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            {RELATION_TYPE_LABELS[summary.type]}
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.count}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-slate-500">当前子图邻接节点数: {connectedNodeCount}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </PanelCard>
      </div>
    </div>
  );
}
