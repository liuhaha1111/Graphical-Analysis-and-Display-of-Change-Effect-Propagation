import { type ReactElement, useState } from 'react';
import KnowledgeGraphPage from '../features/knowledge-graph/KnowledgeGraphPage';
import ProductModelingPage from '../features/product-modeling/ProductModelingPage';
import PropagationAnalysisPage from '../features/propagation-analysis/PropagationAnalysisPage';
import { cn } from '../lib/utils';

type ModuleTab = {
  id: 'product' | 'graph' | 'analysis';
  label: string;
  description: string;
  render: () => ReactElement;
};

const MODULE_TABS: ModuleTab[] = [
  {
    id: 'product',
    label: '产品结构建模',
    description: '维护 BOM、参数基线和依赖关系。',
    render: () => <ProductModelingPage />,
  },
  {
    id: 'graph',
    label: '产品设计知识图谱',
    description: '联结组件、供应商与物流网络。',
    render: () => <KnowledgeGraphPage />,
  },
  {
    id: 'analysis',
    label: '变更效应传播可视化',
    description: '执行确定性传播分析并解释影响。',
    render: () => <PropagationAnalysisPage />,
  },
];

export default function AppShell() {
  const [activeTabId, setActiveTabId] = useState<ModuleTab['id']>('product');
  const activeTab = MODULE_TABS.find((tab) => tab.id === activeTabId) ?? MODULE_TABS[0];

  return (
    <div className="min-h-screen px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="relative overflow-hidden rounded-[36px] border border-white/60 bg-[linear-gradient(135deg,_rgba(255,255,255,0.92)_0%,_rgba(248,250,252,0.96)_54%,_rgba(255,237,213,0.95)_100%)] px-6 py-6 shadow-[0_35px_90px_-45px_rgba(15,23,42,0.6)]">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-amber-300/25 blur-3xl" />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
                Change Impact Studio
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
                变更效应传播图形化分析展示
              </h1>
              <p className="text-sm leading-6 text-slate-600">
                三个功能页共享同一套内存工作区模型: 产品结构建模负责定义设计域，知识图谱负责联结供应链域，传播分析负责输出确定性影响结果。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
              {MODULE_TABS.map((tab, index) => {
                const isActive = tab.id === activeTab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-label={tab.label}
                    id={`module-tab-${index}`}
                    aria-selected={isActive}
                    aria-controls={`module-panel-${index}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => setActiveTabId(tab.id)}
                    className={cn(
                      'rounded-[24px] border px-4 py-4 text-left transition',
                      isActive
                        ? 'border-slate-950 bg-slate-950 text-white shadow-[0_24px_50px_-30px_rgba(15,23,42,0.8)]'
                        : 'border-white/70 bg-white/70 text-slate-800 hover:border-slate-300 hover:bg-white',
                    )}
                  >
                    <p className="text-sm font-semibold">{tab.label}</p>
                    <p
                      className={cn(
                        'mt-2 text-xs leading-5',
                        isActive ? 'text-slate-300' : 'text-slate-500',
                      )}
                    >
                      {tab.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        <section
          role="tabpanel"
          id={`module-panel-${MODULE_TABS.findIndex((tab) => tab.id === activeTab.id)}`}
          aria-labelledby={`module-tab-${MODULE_TABS.findIndex((tab) => tab.id === activeTab.id)}`}
        >
          {activeTab.render()}
        </section>
      </div>
    </div>
  );
}
