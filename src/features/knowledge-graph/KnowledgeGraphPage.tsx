import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import PanelCard from '../../components/ui/PanelCard';
import { ProductComponent, SupplyPartner } from '../../domain/workspace';
import {
  addSupplierNode,
  deleteComponentSubtree,
  deleteSupplierNode,
  exportKnowledgeGraphSnapshot,
  SupplierRelationType,
  updateComponentNode,
  updateSupplierNode,
} from '../../services/knowledgeGraphEditing';
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

type SupplierDraft = {
  name: string;
  productionCapacity: string;
  unitPrice: string;
  componentIds: string[];
  relationType: SupplierRelationType;
};

type ComponentDraft = {
  name: string;
  category: ProductComponent['category'];
  stage: ProductComponent['stage'];
  description: string;
  tags: string;
};

type ComponentSelectorProps = {
  components: ProductComponent[];
  selectedIds: string[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  onToggle: (componentId: string) => void;
  searchInputId: string;
};

const COMPONENT_SELECTOR_DEFAULT_LIMIT = 40;

function createEmptySupplierDraft(): SupplierDraft {
  return {
    name: '',
    productionCapacity: '',
    unitPrice: '',
    componentIds: [],
    relationType: 'supply',
  };
}

function createEmptyComponentDraft(): ComponentDraft {
  return {
    name: '',
    category: 'component',
    stage: 'baseline',
    description: '',
    tags: '',
  };
}

function parseTags(value: string) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function getPartnerComponentIds(partner: SupplyPartner) {
  return [
    ...partner.supplies.map((item) => item.componentId),
    ...partner.services.map((item) => item.componentId),
  ];
}

function ComponentSelector({
  components,
  selectedIds,
  searchValue,
  onSearchChange,
  onToggle,
  searchInputId,
}: ComponentSelectorProps) {
  const deferredSearchValue = useDeferredValue(searchValue);

  const visibleComponents = useMemo(() => {
    const normalizedQuery = deferredSearchValue.trim().toLowerCase();

    if (normalizedQuery.length > 0) {
      return components.filter((component) => {
        const haystacks = [
          component.name,
          component.category,
          component.stage,
          component.description ?? '',
          ...(component.tags ?? []),
        ];

        return haystacks.some((value) => value.toLowerCase().includes(normalizedQuery));
      });
    }

    const visibleById = new Map(
      components
        .slice(0, COMPONENT_SELECTOR_DEFAULT_LIMIT)
        .map((component) => [component.id, component] as const),
    );

    selectedIds.forEach((selectedId) => {
      const selectedComponent = components.find((component) => component.id === selectedId);
      if (selectedComponent) {
        visibleById.set(selectedComponent.id, selectedComponent);
      }
    });

    return Array.from(visibleById.values());
  }, [components, deferredSearchValue, selectedIds]);

  const summaryText =
    deferredSearchValue.trim().length > 0
      ? `当前匹配 ${visibleComponents.length} / ${components.length} 个组件`
      : `默认显示前 ${Math.min(
          COMPONENT_SELECTOR_DEFAULT_LIMIT,
          components.length,
        )} 个组件，可通过搜索查找其余组件`;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-700" htmlFor={searchInputId}>
        <span className="mb-2 block">搜索组件</span>
        <input
          id={searchInputId}
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="输入组件名称、类别、阶段或标签"
          className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
        />
      </label>

      <div className="max-h-56 space-y-2 overflow-y-auto rounded-2xl border border-slate-300 bg-slate-50 p-3">
        {visibleComponents.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-3 py-5 text-center text-sm text-slate-500">
            没有匹配的组件
          </p>
        ) : (
          visibleComponents.map((component) => (
            <label
              key={component.id}
              className="flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2 text-sm text-slate-700 transition hover:border-slate-200 hover:bg-white"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(component.id)}
                onChange={() => onToggle(component.id)}
              />
              <span>{component.name}</span>
            </label>
          ))
        )}
      </div>

      <p className="text-xs text-slate-500">{summaryText}</p>
    </div>
  );
}

export default function KnowledgeGraphPage() {
  const { state, setState } = useWorkspace();
  const sourceNodeId = state.changeScenario.sourceComponentId || null;
  const fullGraph = useMemo(() => buildKnowledgeGraphView(state), [state]);

  const [selectedRelationTypes, setSelectedRelationTypes] =
    useState<GraphEdge['type'][]>(ALL_RELATION_TYPES);
  const [focusNodeId] = useState<string | null>(sourceNodeId);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(sourceNodeId);
  const [expandedNodeIds, setExpandedNodeIds] = useState<string[]>([]);
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [supplierDraft, setSupplierDraft] = useState<SupplierDraft>(() => createEmptySupplierDraft());
  const [componentDraft, setComponentDraft] = useState<ComponentDraft>(() => createEmptyComponentDraft());
  const [supplierDetailDraft, setSupplierDetailDraft] =
    useState<SupplierDraft>(() => createEmptySupplierDraft());
  const [modalComponentSearch, setModalComponentSearch] = useState('');
  const [detailComponentSearch, setDetailComponentSearch] = useState('');

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

  useEffect(() => {
    if (selectedComponent) {
      setComponentDraft({
        name: selectedComponent.name,
        category: selectedComponent.category,
        stage: selectedComponent.stage,
        description: selectedComponent.description ?? '',
        tags: (selectedComponent.tags ?? []).join(', '),
      });
      return;
    }

    setComponentDraft(createEmptyComponentDraft());
  }, [selectedComponent]);

  useEffect(() => {
    if (selectedPartner) {
      setSupplierDetailDraft({
        name: selectedPartner.name,
        productionCapacity: String(selectedPartner.productionCapacity),
        unitPrice: String(selectedPartner.unitPrice),
        componentIds: getPartnerComponentIds(selectedPartner),
        relationType: selectedPartner.services.length > 0 ? 'service' : 'supply',
      });
      setDetailComponentSearch('');
      return;
    }

    setSupplierDetailDraft(createEmptySupplierDraft());
    setDetailComponentSearch('');
  }, [selectedPartner]);

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
    setExpandedNodeIds((current) => (current.includes(nodeId) ? current : [...current, nodeId]));
  };

  const handleResetView = () => {
    setExpandedNodeIds([]);
    setSelectedNodeId(resolvedFocusNodeId);
  };

  const openAddSupplierModal = () => {
    setSupplierDraft(createEmptySupplierDraft());
    setModalComponentSearch('');
    setIsAddSupplierModalOpen(true);
  };

  const closeAddSupplierModal = () => {
    setSupplierDraft(createEmptySupplierDraft());
    setModalComponentSearch('');
    setIsAddSupplierModalOpen(false);
  };

  const toggleModalSupplierComponent = (componentId: string) => {
    setSupplierDraft((current) => ({
      ...current,
      componentIds: current.componentIds.includes(componentId)
        ? current.componentIds.filter((id) => id !== componentId)
        : [...current.componentIds, componentId],
    }));
  };

  const toggleDetailSupplierComponent = (componentId: string) => {
    setSupplierDetailDraft((current) => ({
      ...current,
      componentIds: current.componentIds.includes(componentId)
        ? current.componentIds.filter((id) => id !== componentId)
        : [...current.componentIds, componentId],
    }));
  };

  const handleCreateSupplier = () => {
    const trimmedName = supplierDraft.name.trim();
    const productionCapacity = Number(supplierDraft.productionCapacity);
    const unitPrice = Number(supplierDraft.unitPrice);

    if (!trimmedName || supplierDraft.componentIds.length === 0) {
      return;
    }

    if (!Number.isFinite(productionCapacity) || !Number.isFinite(unitPrice)) {
      return;
    }

    const nextState = addSupplierNode(state, {
      name: trimmedName,
      productionCapacity,
      unitPrice,
      componentIds: supplierDraft.componentIds,
      relationType: supplierDraft.relationType,
    });
    const nextSupplierId = nextState.supplyChain.partners.at(-1)?.id ?? null;

    setState(nextState);
    setSelectedNodeId(nextSupplierId);
    setExpandedNodeIds([]);
    closeAddSupplierModal();
  };

  const handleSaveSelectedNode = () => {
    if (selectedComponent) {
      const nextState = updateComponentNode(state, {
        id: selectedComponent.id,
        name: componentDraft.name.trim(),
        category: componentDraft.category,
        stage: componentDraft.stage,
        description: componentDraft.description.trim(),
        tags: parseTags(componentDraft.tags),
      });
      setState(nextState);
      return;
    }

    if (selectedPartner) {
      const trimmedName = supplierDetailDraft.name.trim();
      const productionCapacity = Number(supplierDetailDraft.productionCapacity);
      const unitPrice = Number(supplierDetailDraft.unitPrice);

      if (!trimmedName || supplierDetailDraft.componentIds.length === 0) {
        return;
      }

      if (!Number.isFinite(productionCapacity) || !Number.isFinite(unitPrice)) {
        return;
      }

      const nextState = updateSupplierNode(state, {
        id: selectedPartner.id,
        name: trimmedName,
        productionCapacity,
        unitPrice,
        componentIds: supplierDetailDraft.componentIds,
        relationType: supplierDetailDraft.relationType,
      });
      setState(nextState);
    }
  };

  const handleDeleteSelectedNode = () => {
    if (selectedComponent) {
      const nextState = deleteComponentSubtree(state, selectedComponent.id);
      setState(nextState);
      setSelectedNodeId(null);
      setExpandedNodeIds([]);
      return;
    }

    if (selectedPartner) {
      const nextState = deleteSupplierNode(state, selectedPartner.id);
      setState(nextState);
      setSelectedNodeId(null);
      setExpandedNodeIds([]);
    }
  };

  const handleExportGraph = () => {
    const data = exportKnowledgeGraphSnapshot({
      graph: localGraph,
      filters: selectedRelationTypes,
      focusNodeId: resolvedFocusNodeId,
      selectedNodeId: resolvedSelectedNodeId,
      exportedAt: new Date().toISOString(),
    });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `knowledge-graph-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,_rgba(2,6,23,1)_0%,_rgba(15,23,42,0.98)_48%,_rgba(3,105,161,0.92)_100%)] px-6 py-6 text-white shadow-[0_30px_80px_-40px_rgba(2,6,23,0.9)]">
          <div className="absolute left-0 top-0 h-40 w-40 rounded-full bg-cyan-300/15 blur-3xl" />
          <div className="relative max-w-3xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
              Shared Topology View
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">产品设计知识图谱</h1>
            <p className="text-sm text-slate-300">
              图谱基于共享工作区模型构建，默认仅展示当前筛选结果中的局部子图，用户可围绕当前焦点逐步展开一跳邻域。
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
            onAddSupplier={openAddSupplierModal}
            onExportGraph={handleExportGraph}
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
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">产品编辑</p>
                      <div className="mt-4 space-y-3">
                        <label className="block text-sm font-medium text-slate-700" htmlFor="component-name">
                          <span className="mb-2 block">节点名称</span>
                          <input id="component-name" value={componentDraft.name} onChange={(event) => setComponentDraft((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />
                        </label>
                        <label className="block text-sm font-medium text-slate-700" htmlFor="component-category">
                          <span className="mb-2 block">类别</span>
                          <select id="component-category" value={componentDraft.category} onChange={(event) => setComponentDraft((current) => ({ ...current, category: event.target.value as ProductComponent['category'] }))} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100">
                            <option value="system">system</option><option value="assembly">assembly</option><option value="module">module</option><option value="component">component</option>
                          </select>
                        </label>
                        <label className="block text-sm font-medium text-slate-700" htmlFor="component-stage">
                          <span className="mb-2 block">阶段</span>
                          <select id="component-stage" value={componentDraft.stage} onChange={(event) => setComponentDraft((current) => ({ ...current, stage: event.target.value as ProductComponent['stage'] }))} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100">
                            <option value="baseline">baseline</option><option value="prototype">prototype</option><option value="released">released</option>
                          </select>
                        </label>
                        <label className="block text-sm font-medium text-slate-700" htmlFor="component-description">
                          <span className="mb-2 block">描述</span>
                          <textarea id="component-description" rows={3} value={componentDraft.description} onChange={(event) => setComponentDraft((current) => ({ ...current, description: event.target.value }))} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />
                        </label>
                        <label className="block text-sm font-medium text-slate-700" htmlFor="component-tags">
                          <span className="mb-2 block">标签</span>
                          <input id="component-tags" value={componentDraft.tags} onChange={(event) => setComponentDraft((current) => ({ ...current, tags: event.target.value }))} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />
                        </label>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">参数数量</p>
                      <p className="mt-3 text-3xl font-semibold text-slate-950">{state.product.parameters.filter((parameter) => parameter.componentId === selectedComponent.id).length}</p>
                    </div>
                  </div>
                ) : null}

                {selectedPartner ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">供应节点编辑</p>
                      <div className="mt-4 space-y-3">
                        <label className="block text-sm font-medium text-slate-700" htmlFor="supplier-detail-name">
                          <span className="mb-2 block">节点名称</span>
                          <input id="supplier-detail-name" value={supplierDetailDraft.name} onChange={(event) => setSupplierDetailDraft((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />
                        </label>
                        <label className="block text-sm font-medium text-slate-700" htmlFor="supplier-detail-capacity">
                          <span className="mb-2 block">生产能力</span>
                          <input id="supplier-detail-capacity" type="number" value={supplierDetailDraft.productionCapacity} onChange={(event) => setSupplierDetailDraft((current) => ({ ...current, productionCapacity: event.target.value }))} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />
                        </label>
                        <label className="block text-sm font-medium text-slate-700" htmlFor="supplier-detail-price">
                          <span className="mb-2 block">产品价格</span>
                          <input id="supplier-detail-price" type="number" value={supplierDetailDraft.unitPrice} onChange={(event) => setSupplierDetailDraft((current) => ({ ...current, unitPrice: event.target.value }))} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />
                        </label>
                        <fieldset className="space-y-2 text-sm font-medium text-slate-700">
                          <legend className="mb-2">关系类型</legend>
                          <div className="flex flex-wrap gap-3">
                            <label className="flex items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-sm text-slate-700"><input type="radio" name="supplier-detail-relation-type" value="supply" checked={supplierDetailDraft.relationType === 'supply'} onChange={() => setSupplierDetailDraft((current) => ({ ...current, relationType: 'supply' }))} />供应关系</label>
                            <label className="flex items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-sm text-slate-700"><input type="radio" name="supplier-detail-relation-type" value="service" checked={supplierDetailDraft.relationType === 'service'} onChange={() => setSupplierDetailDraft((current) => ({ ...current, relationType: 'service' }))} />配套服务关系</label>
                          </div>
                        </fieldset>
                        <fieldset className="space-y-2 text-sm font-medium text-slate-700">
                          <legend className="mb-2">供应产品</legend>
                          <ComponentSelector
                            components={state.product.components}
                            selectedIds={supplierDetailDraft.componentIds}
                            searchValue={detailComponentSearch}
                            onSearchChange={setDetailComponentSearch}
                            onToggle={toggleDetailSupplierComponent}
                            searchInputId="supplier-detail-component-search"
                          />
                        </fieldset>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">供应节点属性</p>
                      <p className="mt-3 text-sm text-slate-700">位置: {selectedPartner.location}</p>
                      <p className="mt-1 text-sm text-slate-700">角色: {ROLE_LABELS[selectedPartner.role]}</p>
                      <p className="mt-1 text-sm text-slate-700">风险: {RISK_LABELS[selectedPartner.riskProfile]}</p>
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
                          <div key={summary.type} className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-700">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{RELATION_TYPE_LABELS[summary.type]}</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-950">{summary.count}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-slate-500">当前子图邻接节点数: {connectedNodeCount}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={handleSaveSelectedNode} className="flex-1 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800">保存更新</button>
                  <button type="button" onClick={handleDeleteSelectedNode} className="flex-1 rounded-full border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 transition hover:border-rose-400 hover:bg-rose-100">删除节点</button>
                </div>
              </div>
            )}
          </PanelCard>
        </div>
      </div>

      {isAddSupplierModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div role="dialog" aria-modal="true" aria-labelledby="add-supplier-title" className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.8)]">
            <div className="space-y-2">
              <h2 id="add-supplier-title" className="text-xl font-semibold text-slate-950">新增供应商</h2>
              <p className="text-sm text-slate-500">创建一个新的供应节点，并通过供应关系或配套服务关系连接到现有产品组件。</p>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2" htmlFor="supplier-name"><span>供应商名称</span><input id="supplier-name" value={supplierDraft.name} onChange={(event) => setSupplierDraft((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100" /></label>
              <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="supplier-capacity"><span>生产能力</span><input id="supplier-capacity" type="number" value={supplierDraft.productionCapacity} onChange={(event) => setSupplierDraft((current) => ({ ...current, productionCapacity: event.target.value }))} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100" /></label>
              <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="supplier-unit-price"><span>产品价格</span><input id="supplier-unit-price" type="number" value={supplierDraft.unitPrice} onChange={(event) => setSupplierDraft((current) => ({ ...current, unitPrice: event.target.value }))} className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100" /></label>
              <fieldset className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2"><legend className="mb-2">关系类型</legend><div className="flex flex-wrap gap-3"><label className="flex items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-sm text-slate-700"><input type="radio" name="supplier-relation-type" value="supply" checked={supplierDraft.relationType === 'supply'} onChange={() => setSupplierDraft((current) => ({ ...current, relationType: 'supply' }))} />供应关系</label><label className="flex items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-sm text-slate-700"><input type="radio" name="supplier-relation-type" value="service" checked={supplierDraft.relationType === 'service'} onChange={() => setSupplierDraft((current) => ({ ...current, relationType: 'service' }))} />配套服务关系</label></div></fieldset>
              <fieldset className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
                <legend className="mb-2">供应产品</legend>
                <ComponentSelector
                  components={state.product.components}
                  selectedIds={supplierDraft.componentIds}
                  searchValue={modalComponentSearch}
                  onSearchChange={setModalComponentSearch}
                  onToggle={toggleModalSupplierComponent}
                  searchInputId="supplier-modal-component-search"
                />
              </fieldset>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={closeAddSupplierModal} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50">取消</button>
              <button type="button" onClick={handleCreateSupplier} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">保存供应商</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

