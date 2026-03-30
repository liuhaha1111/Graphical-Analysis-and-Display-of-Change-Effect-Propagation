import React, { useState } from 'react';
import { ProductModel, ProductNode, Dependency, Param } from '../types';
import { Plus, Edit2, Trash2, FileJson, Download, RotateCcw, Folder, FileText, Box } from 'lucide-react';

const initialModel: ProductModel = {
  nodes: [
    { id: "root_1", name: "智能笔记本", parentId: null, changeableParams: [] },
    { id: "node_2", name: "主板组件", parentId: "root_1", changeableParams: [] },
    { id: "node_3", name: "CPU", parentId: "node_2", changeableParams: [{ paramName: "主频(GHz)", rule: "上游变更幅度超过5%触发重新适配" }] },
    { id: "node_4", name: "散热模组", parentId: "node_2", changeableParams: [{ paramName: "风扇转速", rule: "线性跟随CPU温度参数" }] },
    { id: "node_5", name: "屏幕总成", parentId: "root_1", changeableParams: [{ paramName: "分辨率", rule: "变更需同步验证显示驱动" }] },
    { id: "node_6", name: "电池包", parentId: "root_1", changeableParams: [{ paramName: "容量(mAh)", rule: "结构尺寸变更需同步模具" }] }
  ],
  dependencies: [
    { id: "dep_1", sourceNodeId: "node_3", sourceParam: "主频(GHz)", targetNodeId: "node_4", targetParam: "风扇转速", relationType: "数值传递", expression: "source * 1.2 + 1500" },
    { id: "dep_2", sourceNodeId: "node_5", sourceParam: "分辨率", targetNodeId: "node_6", targetParam: "容量(mAh)", relationType: "逻辑约束", expression: "高分辨率需电池≥5000mAh" }
  ]
};

const genId = (prefix = "node") => `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

export default function ProductModeling() {
  const [model, setModel] = useState<ProductModel>(initialModel);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  
  const [isDepModalOpen, setIsDepModalOpen] = useState(false);
  const [editingDep, setEditingDep] = useState<Partial<Dependency> | null>(null);
  
  const [isParamModalOpen, setIsParamModalOpen] = useState(false);
  const [editingParam, setEditingParam] = useState<{param: Partial<Param>, index: number | null} | null>(null);

  const selectedNode = model.nodes.find(n => n.id === selectedNodeId);

  const handleAddRoot = () => {
    const name = prompt("根节点名称", "新产品");
    if (name) {
      const newNode: ProductNode = { id: genId("root"), name, parentId: null, changeableParams: [] };
      setModel(prev => ({ ...prev, nodes: [...prev.nodes, newNode] }));
      setSelectedNodeId(newNode.id);
    }
  };

  const handleAddChild = (parentId: string) => {
    const name = prompt("请输入子部件名称", "新零件");
    if (name) {
      const newNode: ProductNode = { id: genId(), name, parentId, changeableParams: [] };
      setModel(prev => ({ ...prev, nodes: [...prev.nodes, newNode] }));
      setSelectedNodeId(newNode.id);
    }
  };

  const handleEditNode = (id: string) => {
    const node = model.nodes.find(n => n.id === id);
    if (node) {
      const newName = prompt("修改节点名称", node.name);
      if (newName) {
        setModel(prev => ({
          ...prev,
          nodes: prev.nodes.map(n => n.id === id ? { ...n, name: newName } : n)
        }));
      }
    }
  };

  const handleDeleteNode = (id: string) => {
    if (confirm("删除该节点及所有子节点？同时会删除相关依赖")) {
      const toDelete = new Set([id]);
      const collectChildren = (pid: string) => {
        model.nodes.filter(n => n.parentId === pid).forEach(c => {
          toDelete.add(c.id);
          collectChildren(c.id);
        });
      };
      collectChildren(id);

      setModel(prev => ({
        nodes: prev.nodes.filter(n => !toDelete.has(n.id)),
        dependencies: prev.dependencies.filter(d => !toDelete.has(d.sourceNodeId) && !toDelete.has(d.targetNodeId))
      }));
      if (selectedNodeId && toDelete.has(selectedNodeId)) {
        setSelectedNodeId(null);
      }
    }
  };

  const handleSaveDep = () => {
    if (!editingDep?.sourceNodeId || !editingDep?.sourceParam || !editingDep?.targetNodeId || !editingDep?.targetParam) {
      alert("请完整填写源/目标节点及参数名称");
      return;
    }
    
    setModel(prev => {
      if (editingDep.id) {
        return {
          ...prev,
          dependencies: prev.dependencies.map(d => d.id === editingDep.id ? editingDep as Dependency : d)
        };
      } else {
        return {
          ...prev,
          dependencies: [...prev.dependencies, { ...editingDep, id: genId("dep") } as Dependency]
        };
      }
    });
    setIsDepModalOpen(false);
  };

  const handleSaveParam = () => {
    if (!selectedNodeId || !editingParam?.param.paramName) {
      alert("参数名称不能为空");
      return;
    }

    setModel(prev => {
      const newNodes = [...prev.nodes];
      const nodeIndex = newNodes.findIndex(n => n.id === selectedNodeId);
      if (nodeIndex === -1) return prev;

      const node = { ...newNodes[nodeIndex] };
      const newParams = [...node.changeableParams];
      
      const paramToSave = {
        paramName: editingParam.param.paramName,
        rule: editingParam.param.rule || "默认传播"
      };

      if (editingParam.index !== null) {
        newParams[editingParam.index] = paramToSave;
      } else {
        newParams.push(paramToSave);
      }
      
      node.changeableParams = newParams;
      newNodes[nodeIndex] = node;
      return { ...prev, nodes: newNodes };
    });
    setIsParamModalOpen(false);
  };

  const handleDeleteParam = (index: number) => {
    if (!selectedNodeId) return;
    setModel(prev => {
      const newNodes = [...prev.nodes];
      const nodeIndex = newNodes.findIndex(n => n.id === selectedNodeId);
      if (nodeIndex === -1) return prev;
      
      const node = { ...newNodes[nodeIndex] };
      node.changeableParams = node.changeableParams.filter((_, i) => i !== index);
      newNodes[nodeIndex] = node;
      return { ...prev, nodes: newNodes };
    });
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importJson);
      if (!parsed.nodes || !Array.isArray(parsed.nodes) || !parsed.dependencies || !Array.isArray(parsed.dependencies)) {
        throw new Error("无效格式: 需要包含 nodes 和 dependencies 数组");
      }
      setModel(parsed);
      setSelectedNodeId(null);
      setIsImportModalOpen(false);
      alert("导入成功！");
    } catch (e: any) {
      alert("导入失败: " + e.message);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(model, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product_model_${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderTree = (parentId: string | null) => {
    const children = model.nodes.filter(n => n.parentId === parentId);
    if (children.length === 0) return null;

    return (
      <ul className={parentId ? "pl-5" : ""}>
        {children.map(node => {
          const isSelected = selectedNodeId === node.id;
          const hasChildren = model.nodes.some(n => n.parentId === node.id);
          return (
            <li key={node.id} className="list-none relative">
              <div 
                className={`group flex items-center justify-between p-2 my-1 rounded-lg cursor-pointer transition-colors text-sm ${isSelected ? 'bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-slate-100'}`}
                onClick={() => setSelectedNodeId(node.id)}
              >
                <span className="font-medium flex items-center gap-2 text-slate-700">
                  {hasChildren ? <Folder size={16} className="text-blue-500" /> : <FileText size={16} className="text-slate-400" />}
                  {node.name}
                  <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">
                    {node.changeableParams.length} 变更参数
                  </span>
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-blue-600 hover:bg-blue-200 p-1 rounded" onClick={(e) => { e.stopPropagation(); handleAddChild(node.id); }} title="添加子部件"><Plus size={14} /></button>
                  <button className="text-slate-600 hover:bg-slate-200 p-1 rounded" onClick={(e) => { e.stopPropagation(); handleEditNode(node.id); }} title="重命名"><Edit2 size={14} /></button>
                  <button className="text-red-500 hover:bg-red-100 p-1 rounded" onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id); }} title="删除"><Trash2 size={14} /></button>
                </div>
              </div>
              {renderTree(node.id)}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2"><Box size={20} /> 产品结构树建模模块</h2>
          <p className="text-xs text-slate-300 mt-1">BOM管理 · 参数依赖图配置 · 变更属性定义</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsImportModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition-colors"><FileJson size={14} /> 导入模型</button>
          <button onClick={handleExport} className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition-colors"><Download size={14} /> 导出模型</button>
          <button onClick={() => setModel(initialModel)} className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition-colors"><RotateCcw size={14} /> 重置示例</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: BOM Tree */}
        <div className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50">
          <div className="p-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center font-semibold text-slate-700">
            <span>🌲 产品结构树 (BOM)</span>
            <button onClick={handleAddRoot} className="text-blue-600 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded text-xs flex items-center gap-1"><Plus size={12} /> 添加根节点</button>
          </div>
          <div className="p-3 flex-1 overflow-y-auto">
            {model.nodes.length === 0 ? (
              <div className="text-center text-slate-400 mt-10 text-sm">暂无产品节点，请点击“添加根节点”</div>
            ) : (
              renderTree(null)
            )}
          </div>
        </div>

        {/* Middle Panel: Dependencies */}
        <div className="w-1/3 border-r border-slate-200 flex flex-col bg-white">
          <div className="p-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center font-semibold text-slate-700">
            <span>🔗 参数依赖图配置</span>
            <button 
              onClick={() => {
                setEditingDep({ relationType: '数值传递', sourceNodeId: model.nodes[0]?.id, targetNodeId: model.nodes[1]?.id });
                setIsDepModalOpen(true);
              }} 
              className="text-blue-600 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded text-xs flex items-center gap-1"
            >
              <Plus size={12} /> 添加依赖
            </button>
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            {model.dependencies.length === 0 ? (
              <div className="text-center text-slate-400 mt-10 text-sm">暂无参数依赖，点击“添加依赖”创建</div>
            ) : (
              model.dependencies.map(dep => {
                const sourceNode = model.nodes.find(n => n.id === dep.sourceNodeId);
                const targetNode = model.nodes.find(n => n.id === dep.targetNodeId);
                return (
                  <div key={dep.id} className="bg-slate-50 rounded-xl p-3 mb-3 border-l-4 border-blue-500 relative group shadow-sm border border-slate-100">
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingDep(dep); setIsDepModalOpen(true); }} className="text-slate-500 hover:bg-slate-200 p-1 rounded"><Edit2 size={12} /></button>
                      <button onClick={() => setModel(prev => ({ ...prev, dependencies: prev.dependencies.filter(d => d.id !== dep.id) }))} className="text-red-500 hover:bg-red-100 p-1 rounded"><Trash2 size={12} /></button>
                    </div>
                    <div className="text-sm text-slate-800">
                      <strong>{sourceNode?.name || '?'} . {dep.sourceParam}</strong> → <strong>{targetNode?.name || '?'} . {dep.targetParam}</strong>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">类型: {dep.relationType} | 规则: {dep.expression}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Change Attributes */}
        <div className="w-1/3 flex flex-col bg-slate-50">
          <div className="p-4 border-b border-slate-200 bg-white">
            <div className="font-semibold text-slate-700 mb-2">📌 当前选中节点</div>
            <div className="bg-slate-100 p-3 rounded-lg text-sm text-slate-700">
              {selectedNode ? (
                <>
                  <strong>{selectedNode.name}</strong><br/>
                  <span className="text-slate-500 text-xs">ID: {selectedNode.id}</span><br/>
                  <span className="text-slate-500 text-xs">变更参数数: {selectedNode.changeableParams.length}</span>
                </>
              ) : '未选中任何节点'}
            </div>
          </div>
          
          <div className="p-4 border-b border-slate-200 flex-1 overflow-y-auto bg-white">
            <div className="font-semibold text-slate-700">⚙️ 变更属性定义</div>
            <div className="text-xs text-slate-500 mb-3">可配置参数及传播规则</div>
            
            {!selectedNode ? (
              <div className="text-slate-400 text-sm italic">请先选中左侧节点以配置变更属性</div>
            ) : selectedNode.changeableParams.length === 0 ? (
              <div className="text-slate-400 text-sm italic">暂无变更参数，点击下方按钮添加</div>
            ) : (
              selectedNode.changeableParams.map((param, idx) => (
                <div key={idx} className="bg-slate-50 p-2 rounded-lg mb-2 flex justify-between items-center border border-slate-100 group">
                  <div className="text-sm">
                    <strong className="text-slate-700">{param.paramName}</strong><br/>
                    <span className="bg-slate-200 px-2 py-0.5 rounded-full text-[10px] text-slate-600 mt-1 inline-block">传播规则: {param.rule}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingParam({ param, index: idx }); setIsParamModalOpen(true); }} className="text-slate-500 hover:bg-slate-200 p-1 rounded"><Edit2 size={12} /></button>
                    <button onClick={() => handleDeleteParam(idx)} className="text-red-500 hover:bg-red-100 p-1 rounded"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))
            )}
            
            {selectedNode && (
              <button 
                onClick={() => { setEditingParam({ param: { paramName: '', rule: '' }, index: null }); setIsParamModalOpen(true); }}
                className="mt-3 w-full bg-blue-50 text-blue-600 hover:bg-blue-100 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
              >
                <Plus size={14} /> 添加可变更参数
              </button>
            )}
          </div>
          
          <div className="p-4 bg-slate-50">
            <div className="font-semibold text-slate-700 text-sm">📐 依赖关系说明</div>
            <div className="text-xs text-slate-500 mt-1">参数依赖支持公式/逻辑约束，仿真时自动传播</div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[500px] max-w-[90%] shadow-xl">
            <h3 className="text-lg font-bold mb-4">导入产品模型 (JSON)</h3>
            <textarea 
              className="w-full h-32 border border-slate-300 rounded-lg p-2 font-mono text-sm"
              placeholder="粘贴符合格式的JSON..."
              value={importJson}
              onChange={e => setImportJson(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium">取消</button>
              <button onClick={handleImport} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">导入</button>
            </div>
          </div>
        </div>
      )}

      {isDepModalOpen && editingDep && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[500px] max-w-[90%] shadow-xl">
            <h3 className="text-lg font-bold mb-4">{editingDep.id ? "编辑参数依赖" : "添加参数依赖"}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">源节点</label>
                <select className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={editingDep.sourceNodeId || ''} onChange={e => setEditingDep({...editingDep, sourceNodeId: e.target.value})}>
                  <option value="">请选择...</option>
                  {model.nodes.map(n => <option key={n.id} value={n.id}>{n.name} ({n.id})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">源参数名称</label>
                <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm" placeholder="例如：主频(GHz)" value={editingDep.sourceParam || ''} onChange={e => setEditingDep({...editingDep, sourceParam: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">目标节点</label>
                <select className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={editingDep.targetNodeId || ''} onChange={e => setEditingDep({...editingDep, targetNodeId: e.target.value})}>
                  <option value="">请选择...</option>
                  {model.nodes.map(n => <option key={n.id} value={n.id}>{n.name} ({n.id})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">目标参数名称</label>
                <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm" placeholder="例如：风扇转速" value={editingDep.targetParam || ''} onChange={e => setEditingDep({...editingDep, targetParam: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">关系类型</label>
                <select className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={editingDep.relationType || '数值传递'} onChange={e => setEditingDep({...editingDep, relationType: e.target.value})}>
                  <option>数值传递</option>
                  <option>逻辑约束</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">公式/约束描述</label>
                <textarea className="w-full border border-slate-300 rounded-lg p-2 text-sm" placeholder="例如：source * 1.2 + 1500" value={editingDep.expression || ''} onChange={e => setEditingDep({...editingDep, expression: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setIsDepModalOpen(false)} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium">取消</button>
              <button onClick={handleSaveDep} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">保存</button>
            </div>
          </div>
        </div>
      )}

      {isParamModalOpen && editingParam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[400px] max-w-[90%] shadow-xl">
            <h3 className="text-lg font-bold mb-4">{editingParam.index !== null ? "编辑可变更参数" : "添加可变更参数"}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">参数名称</label>
                <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm" placeholder="例如：材料等级、尺寸公差" value={editingParam.param.paramName || ''} onChange={e => setEditingParam({...editingParam, param: {...editingParam.param, paramName: e.target.value}})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">传播规则 / 约束条件</label>
                <textarea className="w-full border border-slate-300 rounded-lg p-2 text-sm" placeholder="例如：影响下游结构强度" value={editingParam.param.rule || ''} onChange={e => setEditingParam({...editingParam, param: {...editingParam.param, rule: e.target.value}})} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setIsParamModalOpen(false)} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium">取消</button>
              <button onClick={handleSaveParam} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
