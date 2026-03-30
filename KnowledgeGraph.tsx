import React, { useState, useEffect, useRef } from 'react';
import { GraphNode, GraphEdge } from '../types';
import { Plus, Download, RotateCcw, Filter, Info, Package, Factory } from 'lucide-react';
import { displayEntityCount, displayRelationCount } from './src/services/graphDisplayMetrics';

const initialNodes: GraphNode[] = [
  { id: "prod_laptop", name: "笔记本电脑", type: "product", x: 400, y: 200, attributes: { cost: 5000 } },
  { id: "prod_motherboard", name: "主板", type: "product", x: 300, y: 350, attributes: { cost: 800 } },
  { id: "prod_cpu", name: "CPU", type: "product", x: 450, y: 350, attributes: { cost: 1500 } },
  { id: "prod_screen", name: "屏幕总成", type: "product", x: 550, y: 350, attributes: { cost: 1000 } },
  { id: "sup_intel", name: "英特尔", type: "supplier", x: 200, y: 500, attributes: { capacity: 100000, price: 1200 } },
  { id: "sup_tsmc", name: "台积电", type: "supplier", x: 350, y: 500, attributes: { capacity: 200000, price: 800 } },
  { id: "sup_samsung", name: "三星显示", type: "supplier", x: 550, y: 500, attributes: { capacity: 80000, price: 950 } },
  { id: "sup_honhai", name: "鸿海精密", type: "supplier", x: 700, y: 500, attributes: { capacity: 300000, price: 300 } }
];

const initialEdges: GraphEdge[] = [
  { id: "edge1", source: "prod_laptop", target: "prod_motherboard", type: "assembly", label: "装配" },
  { id: "edge2", source: "prod_laptop", target: "prod_cpu", type: "assembly", label: "装配" },
  { id: "edge3", source: "prod_laptop", target: "prod_screen", type: "assembly", label: "装配" },
  { id: "edge4", source: "prod_cpu", target: "sup_intel", type: "supply", label: "供应" },
  { id: "edge5", source: "prod_cpu", target: "sup_tsmc", type: "supply", label: "供应" },
  { id: "edge6", source: "prod_screen", target: "sup_samsung", type: "supply", label: "供应" },
  { id: "edge7", source: "prod_motherboard", target: "sup_honhai", type: "service", label: "配套服务" },
  { id: "edge8", source: "sup_intel", target: "sup_tsmc", type: "transaction", label: "交易" },
  { id: "edge9", source: "sup_samsung", target: "sup_honhai", type: "transaction", label: "交易" }
];

const genId = (prefix = "node") => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

export default function KnowledgeGraph() {
  const [nodes, setNodes] = useState<GraphNode[]>(initialNodes);
  const [edges, setEdges] = useState<GraphEdge[]>(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [filters, setFilters] = useState<string[]>(['assembly', 'supply', 'service', 'transaction']);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Add Supplier Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', capacity: 50000, price: 100, relationType: 'supply' });
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Edit Node State
  const [editNodeData, setEditNodeData] = useState<Partial<GraphNode>>({});

  useEffect(() => {
    const node = nodes.find(n => n.id === selectedNodeId);
    if (node) {
      setEditNodeData({ ...node });
    } else {
      setEditNodeData({});
    }
  }, [selectedNodeId, nodes]);

  const drawGraph = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    ctx.clearRect(0, 0, rect.width, rect.height);

    const visibleEdges = edges.filter(e => filters.includes(e.type));

    // Draw edges
    visibleEdges.forEach(edge => {
      const src = nodes.find(n => n.id === edge.source);
      const tgt = nodes.find(n => n.id === edge.target);
      if (!src || !tgt) return;

      let strokeStyle = '#94a3b8';
      if (edge.type === 'assembly') strokeStyle = '#f97316';
      if (edge.type === 'supply') strokeStyle = '#3b82f6';
      if (edge.type === 'service') strokeStyle = '#8b5cf6';
      if (edge.type === 'transaction') strokeStyle = '#10b981';

      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Arrow
      const angle = Math.atan2(tgt.y - src.y, tgt.x - src.x);
      const arrowX = tgt.x - 12 * Math.cos(angle);
      const arrowY = tgt.y - 12 * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX - 6 * Math.sin(angle), arrowY + 6 * Math.cos(angle));
      ctx.lineTo(arrowX + 6 * Math.sin(angle), arrowY - 6 * Math.cos(angle));
      ctx.fillStyle = strokeStyle;
      ctx.fill();

      // Label
      ctx.fillStyle = '#475569';
      ctx.font = '10px sans-serif';
      ctx.fillText(edge.label, (src.x + tgt.x) / 2, (src.y + tgt.y) / 2 - 5);
    });

    // Draw nodes
    nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 28, 0, 2 * Math.PI);
      ctx.fillStyle = node.type === 'product' ? '#10b981' : '#3b82f6';
      ctx.fill();

      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px sans-serif';
      const shortName = node.name.length > 6 ? node.name.slice(0, 5) + '…' : node.name;
      ctx.fillText(shortName, node.x - 15, node.y + 4);

      ctx.fillStyle = '#1e293b';
      ctx.font = '10px sans-serif';
      ctx.fillText(node.type === 'product' ? '产品' : '供应商', node.x - 12, node.y - 15);

      if (selectedNodeId === node.id) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 32, 0, 2 * Math.PI);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });
  };

  useEffect(() => {
    drawGraph();
    
    const handleResize = () => drawGraph();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [nodes, edges, selectedNodeId, filters]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    let minDist = 30;
    let clickedNodeId: string | null = null;
    
    nodes.forEach(node => {
      const dx = node.x - mouseX;
      const dy = node.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        clickedNodeId = node.id;
      }
    });
    
    setSelectedNodeId(clickedNodeId);
  };

  const handleFilterChange = (type: string) => {
    setFilters(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleAddSupplier = () => {
    if (!newSupplier.name) {
      alert("请输入供应商名称");
      return;
    }
    if (selectedProducts.length === 0) {
      alert("请至少选择一个供应的产品");
      return;
    }

    const newSupplierId = genId("sup");
    const newX = 700 + Math.random() * 100;
    const newY = 400 + Math.random() * 150;

    const newNode: GraphNode = {
      id: newSupplierId,
      name: newSupplier.name,
      type: "supplier",
      x: newX,
      y: newY,
      attributes: { capacity: newSupplier.capacity, price: newSupplier.price }
    };

    const newEdges = selectedProducts.map(prodId => ({
      id: genId("edge"),
      source: prodId,
      target: newSupplierId,
      type: newSupplier.relationType,
      label: newSupplier.relationType === 'supply' ? '供应' : '配套服务'
    }));

    setNodes(prev => [...prev, newNode]);
    setEdges(prev => [...prev, ...newEdges]);
    setSelectedNodeId(newSupplierId);
    setIsAddModalOpen(false);
    setNewSupplier({ name: '', capacity: 50000, price: 100, relationType: 'supply' });
    setSelectedProducts([]);
  };

  const handleUpdateNode = () => {
    if (!selectedNodeId || !editNodeData.name) return;
    
    setNodes(prev => prev.map(n => {
      if (n.id === selectedNodeId) {
        return {
          ...n,
          name: editNodeData.name!,
          type: editNodeData.type!,
          attributes: {
            ...n.attributes,
            ...(editNodeData.type === 'supplier' ? {
              capacity: editNodeData.attributes?.capacity || 0,
              price: editNodeData.attributes?.price || 0
            } : {})
          }
        };
      }
      return n;
    }));
  };

  const handleDeleteNode = () => {
    if (!selectedNodeId) return;
    if (confirm("删除该节点会同时删除所有关联的边，是否继续？")) {
      setEdges(prev => prev.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId));
      setNodes(prev => prev.filter(n => n.id !== selectedNodeId));
      setSelectedNodeId(null);
    }
  };

  const handleExport = () => {
    const data = { nodes, edges };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `knowledge_graph_${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSelectedNodeId(null);
    setFilters(['assembly', 'supply', 'service', 'transaction']);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2"><Filter size={20} /> 产品设计知识图谱</h2>
          <p className="text-xs text-slate-300 mt-1">产品-供应链关系网络 | 支持四类关系筛选与供应商扩展</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition-colors"><Plus size={14} /> 添加供应商</button>
          <button onClick={handleExport} className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition-colors"><Download size={14} /> 导出图谱</button>
          <button onClick={handleReset} className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition-colors"><RotateCcw size={14} /> 重置示例</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Stats & Filters */}
        <div className="w-1/4 min-w-[280px] border-r border-slate-200 flex flex-col bg-slate-50 overflow-y-auto p-4 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-600 flex items-center gap-1"><Package size={16}/> 实体总数</span>
              <span className="text-xl font-bold text-blue-600">{displayEntityCount(nodes.length)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-600 flex items-center gap-1"><Filter size={16}/> 关系总数</span>
              <span className="text-xl font-bold text-blue-600">{displayRelationCount(edges.filter(e => filters.includes(e.type)).length)}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="font-semibold text-slate-700 mb-3 text-sm flex items-center gap-1"><Filter size={16}/> 关系类型筛选</h4>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filters.includes('assembly')} onChange={() => handleFilterChange('assembly')} className="rounded text-orange-500 focus:ring-orange-500" />
                <span className="w-4 h-4 rounded bg-orange-500 inline-block"></span>
                <span className="text-slate-700">装配关系 (产品→产品)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filters.includes('supply')} onChange={() => handleFilterChange('supply')} className="rounded text-blue-500 focus:ring-blue-500" />
                <span className="w-4 h-4 rounded bg-blue-500 inline-block"></span>
                <span className="text-slate-700">供应关系 (产品←供应商)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filters.includes('service')} onChange={() => handleFilterChange('service')} className="rounded text-purple-500 focus:ring-purple-500" />
                <span className="w-4 h-4 rounded bg-purple-500 inline-block"></span>
                <span className="text-slate-700">配套服务 (产品←供应商)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filters.includes('transaction')} onChange={() => handleFilterChange('transaction')} className="rounded text-emerald-500 focus:ring-emerald-500" />
                <span className="w-4 h-4 rounded bg-emerald-500 inline-block"></span>
                <span className="text-slate-700">交易关系 (供应商↔供应商)</span>
              </label>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-[200px]">
            <h4 className="font-semibold text-slate-700 mb-3 text-sm flex items-center gap-1"><Info size={16}/> 节点列表</h4>
            <div className="flex-1 overflow-y-auto space-y-1">
              {nodes.map(node => (
                <div 
                  key={node.id} 
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`p-2 rounded-lg text-sm cursor-pointer transition-colors flex items-center gap-2 ${selectedNodeId === node.id ? 'bg-blue-100 text-blue-800 font-medium' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
                >
                  {node.type === 'product' ? <Package size={14} className="text-emerald-600"/> : <Factory size={14} className="text-blue-600"/>}
                  {node.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Middle Panel: Canvas */}
        <div className="flex-1 bg-slate-50 relative" ref={containerRef}>
          <canvas 
            ref={canvasRef} 
            onClick={handleCanvasClick}
            className="absolute inset-0 cursor-pointer"
          />
        </div>

        {/* Right Panel: Node Details */}
        <div className="w-1/4 min-w-[280px] border-l border-slate-200 bg-slate-50 p-4 overflow-y-auto">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-1"><Info size={16}/> 当前选中节点</h4>
            
            {!selectedNodeId ? (
              <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-500 text-center">未选中任何节点</div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700">
                  <strong>{editNodeData.name}</strong><br/>
                  <span className="text-xs text-slate-500">ID: {editNodeData.id}</span><br/>
                  <span className="text-xs text-slate-500">类型: {editNodeData.type === 'product' ? '产品' : '供应商'}</span>
                  {editNodeData.type === 'supplier' && (
                    <>
                      <br/><span className="text-xs text-slate-500">生产能力: {editNodeData.attributes?.capacity || '-'} 件/月</span>
                      <br/><span className="text-xs text-slate-500">产品价格: {editNodeData.attributes?.price || '-'} 元/件</span>
                    </>
                  )}
                  {editNodeData.type === 'product' && (
                    <>
                      <br/><span className="text-xs text-slate-500">成本: {editNodeData.attributes?.cost || '-'} 元</span>
                    </>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">节点名称</label>
                    <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={editNodeData.name || ''} onChange={e => setEditNodeData({...editNodeData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">节点类型</label>
                    <select className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={editNodeData.type || 'product'} onChange={e => setEditNodeData({...editNodeData, type: e.target.value})}>
                      <option value="product">产品</option>
                      <option value="supplier">供应商</option>
                    </select>
                  </div>
                  
                  {editNodeData.type === 'supplier' && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">生产能力 (件/月)</label>
                        <input type="number" className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={editNodeData.attributes?.capacity || ''} onChange={e => setEditNodeData({...editNodeData, attributes: {...editNodeData.attributes, capacity: Number(e.target.value)}})} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">产品价格 (元/件)</label>
                        <input type="number" className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={editNodeData.attributes?.price || ''} onChange={e => setEditNodeData({...editNodeData, attributes: {...editNodeData.attributes, price: Number(e.target.value)}})} />
                      </div>
                    </>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <button onClick={handleUpdateNode} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">更新节点</button>
                    <button onClick={handleDeleteNode} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium transition-colors">删除节点</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Supplier Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[500px] max-w-[90%] shadow-xl">
            <h3 className="text-lg font-bold mb-4">添加供应商节点</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">供应商名称 *</label>
                <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm" placeholder="例如：鸿海精密" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">生产能力 (件/月) *</label>
                  <input type="number" className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={newSupplier.capacity} onChange={e => setNewSupplier({...newSupplier, capacity: Number(e.target.value)})} />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">产品价格 (元/件) *</label>
                  <input type="number" className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={newSupplier.price} onChange={e => setNewSupplier({...newSupplier, price: Number(e.target.value)})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">供应产品 (可多选)</label>
                <div className="border border-slate-300 rounded-lg p-2 max-h-32 overflow-y-auto space-y-1 bg-slate-50">
                  {nodes.filter(n => n.type === 'product').length === 0 ? (
                    <div className="text-xs text-slate-400 text-center py-2">暂无产品节点</div>
                  ) : (
                    nodes.filter(n => n.type === 'product').map(prod => (
                      <label key={prod.id} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 hover:bg-slate-200 p-1 rounded">
                        <input 
                          type="checkbox" 
                          checked={selectedProducts.includes(prod.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedProducts([...selectedProducts, prod.id]);
                            else setSelectedProducts(selectedProducts.filter(id => id !== prod.id));
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        {prod.name}
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">关系类型</label>
                <select className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={newSupplier.relationType} onChange={e => setNewSupplier({...newSupplier, relationType: e.target.value})}>
                  <option value="supply">供应关系</option>
                  <option value="service">配套服务关系</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium">取消</button>
              <button onClick={handleAddSupplier} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
