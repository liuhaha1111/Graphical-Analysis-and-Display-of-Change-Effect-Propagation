import { useState } from 'react';
import PanelCard from '../../components/ui/PanelCard';
import { SupplyPartner } from '../../domain/workspace';
import { buildKnowledgeGraphView } from '../../services/knowledgeGraph.service';
import { buildTopologyLayout } from '../../services/topologyLayout.service';
import { useWorkspace } from '../../store/workspaceStore';
import KnowledgeGraphCanvas from './KnowledgeGraphCanvas';
import KnowledgeGraphSidebar from './KnowledgeGraphSidebar';

const ROLE_LABELS: Record<SupplyPartner['role'], string> = {
  supplier: '供应商',
  assembler: '制造/装配',
  logistics: '物流',
};

const RISK_LABELS: Record<SupplyPartner['riskProfile'], string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};

export default function KnowledgeGraphPage() {
  const { state } = useWorkspace();
  const graph = buildKnowledgeGraphView(state);
  const fallbackNodeId = state.changeScenario.sourceComponentId ?? graph.nodes[0]?.id ?? null;
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(fallbackNodeId);
  const hasValidSelection =
    selectedNodeId !== null && graph.nodes.some((node) => node.id === selectedNodeId);
  const resolvedSelectedNodeId = hasValidSelection ? selectedNodeId : fallbackNodeId;
  const layout = buildTopologyLayout(graph, {
    sourceNodeId: state.changeScenario.sourceComponentId ?? undefined,
  });

  const selectedNode =
    graph.nodes.find((node) => node.id === resolvedSelectedNodeId) ?? graph.nodes[0];
  const selectedComponent = state.product.components.find((component) => component.id === selectedNode?.id);
  const selectedPartner = state.supplyChain.partners.find((partner) => partner.id === selectedNode?.id);
  const connectedEdges = selectedNode
    ? graph.edges.filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id)
    : [];
  const nodeNameById = new Map(graph.nodes.map((node) => [node.id, node.name]));

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
            产品组件、供应商、物流节点和跨域关系都通过共享数据模型实时派生，不再维护独立页面数据集。
          </p>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[320px_1fr_320px]">
        <KnowledgeGraphSidebar graph={graph} selectedNodeName={selectedNode?.name} />
        <KnowledgeGraphCanvas
          layout={layout}
          selectedNodeId={selectedNode?.id ?? null}
          onSelect={setSelectedNodeId}
        />

        <PanelCard
          title="节点详情"
          eyebrow="Detail Focus"
          description="查看当前选中节点的设计域元数据、供应链属性以及连接关系。"
          className="bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(241,245,249,0.98))]"
        >
          {!selectedNode ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              当前没有可展示的节点。
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-[24px] border border-slate-200 bg-slate-950 p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
                  {selectedNode.kind === 'component' ? 'Component Node' : 'Supply Node'}
                </p>
                <h2 className="mt-2 text-2xl font-semibold">{selectedNode.name}</h2>
                <p className="mt-2 text-sm text-slate-300">
                  {selectedComponent
                    ? selectedComponent.description ?? '该组件尚未补充详细说明。'
                    : selectedPartner
                      ? selectedPartner.location
                      : '未找到节点详情。'}
                </p>
              </div>

              {selectedComponent ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      组件属性
                    </p>
                    <p className="mt-3 text-sm text-slate-700">类别: {selectedComponent.category}</p>
                    <p className="mt-1 text-sm text-slate-700">阶段: {selectedComponent.stage}</p>
                    <p className="mt-1 text-sm text-slate-700">
                      标签: {selectedComponent.tags?.join(', ') ?? '无'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      参数数量
                    </p>
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
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      供应节点属性
                    </p>
                    <p className="mt-3 text-sm text-slate-700">位置: {selectedPartner.location}</p>
                    <p className="mt-1 text-sm text-slate-700">角色: {ROLE_LABELS[selectedPartner.role]}</p>
                    <p className="mt-1 text-sm text-slate-700">
                      风险: {RISK_LABELS[selectedPartner.riskProfile]}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      能力侧重点
                    </p>
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
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  连接关系
                </p>
                {connectedEdges.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">该节点当前没有连接边。</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {connectedEdges.map((edge) => (
                      <p
                        key={edge.id}
                        className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-700"
                      >
                        {nodeNameById.get(edge.source) ?? edge.source} → {nodeNameById.get(edge.target) ?? edge.target} · {edge.type}
                      </p>
                    ))}
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
