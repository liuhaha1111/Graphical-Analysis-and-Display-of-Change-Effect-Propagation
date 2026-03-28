import MetricCard from '../../components/ui/MetricCard';
import PanelCard from '../../components/ui/PanelCard';
import { GraphView } from '../../services/knowledgeGraph.service';

type KnowledgeGraphSidebarProps = {
  graph: GraphView;
  selectedNodeName?: string;
};

export default function KnowledgeGraphSidebar({
  graph,
  selectedNodeName,
}: KnowledgeGraphSidebarProps) {
  const componentNodeCount = graph.nodes.filter((node) => node.kind === 'component').length;
  const supplierNodeCount = graph.nodes.filter((node) => node.kind === 'supplier').length;
  const sourcingEdgeCount = graph.edges.filter((edge) => edge.type === 'sourcing').length;
  const routeEdgeCount = graph.edges.filter((edge) => edge.type === 'route').length;

  return (
    <PanelCard
      title="图谱概览"
      eyebrow="Graph Overview"
      description="产品节点、供应节点和跨域关系全部来自共享工作区选择器，没有页内私有数据副本。"
      className="bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(241,245,249,0.98))]"
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <MetricCard
            label="节点总数"
            value={graph.nodes.length}
            caption={`${componentNodeCount} 个产品节点，${supplierNodeCount} 个供应链节点`}
            className="bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.16),_white_55%)]"
          />
          <MetricCard
            label="关系总数"
            value={graph.edges.length}
            caption={`${sourcingEdgeCount} 条供货映射，${routeEdgeCount} 条物流路径`}
            className="bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_white_52%)]"
          />
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-950 p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200/80">
            当前焦点
          </p>
          <p className="mt-2 text-xl font-semibold">{selectedNodeName ?? '未选择节点'}</p>
          <p className="mt-2 text-sm text-slate-300">
            左侧指标描述网络规模，中间视图区负责选点，右侧详情区展示节点元数据与连接关系。
          </p>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">图例</p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              <span>产品结构节点</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-sky-500" />
              <span>供应链节点</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-3 w-10 rounded-full bg-slate-300" />
              <span>BOM / 供货 / 路由边</span>
            </div>
          </div>
        </div>
      </div>
    </PanelCard>
  );
}
