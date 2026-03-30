import MetricCard from '../../components/ui/MetricCard';
import PanelCard from '../../components/ui/PanelCard';
import {
  displayEntityCountLabel,
  displayRelationCountPair,
} from '../../services/graphDisplayMetrics';
import { GraphEdge, GraphView } from '../../services/knowledgeGraph.service';

export const RELATION_TYPE_LABELS: Record<GraphEdge['type'], string> = {
  assembly: '装配关系',
  configuration: '配置关系',
  supply: '供应关系',
  service: '配套服务',
  transaction: '交易关系',
};

type KnowledgeGraphSidebarProps = {
  totalGraph: GraphView;
  visibleGraph: GraphView;
  selectedNodeName?: string;
  selectedRelationTypes: GraphEdge['type'][];
  onToggleRelationType: (type: GraphEdge['type']) => void;
  onAddSupplier: () => void;
  onExportGraph: () => void;
};

const RELATION_TYPE_ORDER: GraphEdge['type'][] = [
  'assembly',
  'configuration',
  'supply',
  'service',
  'transaction',
];

export default function KnowledgeGraphSidebar({
  totalGraph,
  visibleGraph,
  selectedNodeName,
  selectedRelationTypes,
  onToggleRelationType,
  onAddSupplier,
  onExportGraph,
}: KnowledgeGraphSidebarProps) {
  const componentNodeCount = totalGraph.nodes.filter((node) => node.kind === 'component').length;
  const supplierNodeCount = totalGraph.nodes.filter((node) => node.kind === 'supplier').length;

  return (
    <PanelCard
      title="图谱概览"
      eyebrow="Graph Overview"
      description="实体总量来自共享工作区模型，关系筛选只影响当前可见图谱。"
      className="bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(241,245,249,0.98))]"
    >
      <div className="space-y-4">
        <div className="rounded-[24px] border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">图谱操作</p>
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={onAddSupplier}
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              新增供应商
            </button>
            <button
              type="button"
              onClick={onExportGraph}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              导出当前图谱
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <MetricCard
            label="实体总数"
            value={displayEntityCountLabel(totalGraph.nodes.length)}
            caption={`${componentNodeCount} 个产品实体，${supplierNodeCount} 个供应链实体`}
            className="bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.16),_white_55%)]"
          />
          <MetricCard
            label="关系总数"
            value={displayRelationCountPair(visibleGraph.edges.length, totalGraph.edges.length)}
            caption="当前可见关系数 / 全量关系数"
            className="bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_white_52%)]"
          />
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">关系类型筛选</p>
          <div className="mt-4 space-y-2">
            {RELATION_TYPE_ORDER.map((type) => {
              const totalCount = totalGraph.edges.filter((edge) => edge.type === type).length;
              const visibleCount = visibleGraph.edges.filter((edge) => edge.type === type).length;
              const checked = selectedRelationTypes.includes(type);

              return (
                <label
                  key={type}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700"
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleRelationType(type)}
                      aria-label={RELATION_TYPE_LABELS[type]}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>{RELATION_TYPE_LABELS[type]}</span>
                  </span>
                  <span className="text-xs text-slate-500">
                    {displayRelationCountPair(visibleCount, totalCount)}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-950 p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200/80">
            当前焦点
          </p>
          <p className="mt-2 text-xl font-semibold">{selectedNodeName ?? '当前筛选下无可见节点'}</p>
          <p className="mt-2 text-sm text-slate-300">
            左侧负责规模与关系筛选，中间画布负责选点，右侧负责查看节点属性和当前可见连接关系。
          </p>
        </div>
      </div>
    </PanelCard>
  );
}
