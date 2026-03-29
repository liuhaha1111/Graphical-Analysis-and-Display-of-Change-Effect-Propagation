import PanelCard from '../../components/ui/PanelCard';
import { cn } from '../../lib/utils';
import { ProductTreeNode } from '../../services/productModel.service';

type BomTreePanelProps = {
  tree: ProductTreeNode[];
  selectedId: string | null;
  onSelect: (componentId: string) => void;
  onAddRoot: () => void;
  onAddChild: (componentId: string) => void;
};

const CATEGORY_LABELS: Record<ProductTreeNode['category'], string> = {
  system: '系统',
  assembly: '总成',
  module: '模块',
  component: '零件',
};

const STAGE_LABELS: Record<ProductTreeNode['stage'], string> = {
  baseline: '基线',
  prototype: '样机',
  released: '发布',
};

function TreeBranch({
  nodes,
  selectedId,
  onSelect,
  onAddChild,
  depth,
}: {
  nodes: ProductTreeNode[];
  selectedId: string | null;
  onSelect: (componentId: string) => void;
  onAddChild: (componentId: string) => void;
  depth: number;
}) {
  return (
    <ul className={cn('space-y-3', depth > 0 && 'mt-3 border-l border-dashed border-slate-200 pl-4')}>
      {nodes.map((node) => {
        const isSelected = node.id === selectedId;

        return (
          <li key={node.id} className="space-y-3">
            <button
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(node.id)}
              className={cn(
                'w-full rounded-2xl border px-4 py-3 text-left transition',
                isSelected
                  ? 'border-amber-300 bg-amber-50 shadow-[0_20px_40px_-30px_rgba(180,83,9,0.9)]'
                  : 'border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-white',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{node.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{node.description ?? '共享产品模型中的 BOM 节点'}</p>
                </div>
                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white">
                  {node.children.length} 子项
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700">
                  {CATEGORY_LABELS[node.category]}
                </span>
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  {STAGE_LABELS[node.stage]}
                </span>
              </div>
            </button>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => onAddChild(node.id)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white"
                aria-label={`Add Child Component for ${node.name}`}
              >
                Add Child
              </button>
            </div>

            {node.children.length > 0 ? (
              <TreeBranch
                nodes={node.children}
                selectedId={selectedId}
                onSelect={onSelect}
                onAddChild={onAddChild}
                depth={depth + 1}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export default function BomTreePanel({
  tree,
  selectedId,
  onSelect,
  onAddRoot,
  onAddChild,
}: BomTreePanelProps) {
  return (
    <PanelCard
      headerSlot={
        <button
          type="button"
          onClick={onAddRoot}
          className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
        >
          Add Root Component
        </button>
      }
      title="产品结构树"
      eyebrow="Product Domain"
      description="共享工作区中的层级 BOM 结构，支持将建模、知识图谱和传播分析绑定到同一组件标识。"
      className="bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.16),_transparent_36%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))]"
    >
      {tree.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          当前没有可展示的产品层级。
        </div>
      ) : (
        <TreeBranch
          nodes={tree}
          selectedId={selectedId}
          onSelect={onSelect}
          onAddChild={onAddChild}
          depth={0}
        />
      )}
    </PanelCard>
  );
}
