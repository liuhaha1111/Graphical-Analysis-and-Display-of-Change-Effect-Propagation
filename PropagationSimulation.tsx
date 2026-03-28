import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimNode, SimEdge } from '../types';
import { Play, Pause, SkipForward, RotateCcw, Zap, FileJson, Activity, AlertTriangle, Clock, DollarSign } from 'lucide-react';

const initialNodes: SimNode[] = [
  { id: "prod_laptop", name: "笔记本电脑", type: "product", x: 500, y: 80, status: 0, cost: 5000, delay: 0 },
  { id: "prod_motherboard", name: "主板", type: "product", x: 300, y: 200, status: 0, cost: 800, delay: 0 },
  { id: "prod_cpu", name: "CPU", type: "product", x: 450, y: 200, status: 0, cost: 1500, delay: 0 },
  { id: "prod_ram", name: "内存", type: "product", x: 600, y: 200, status: 0, cost: 400, delay: 0 },
  { id: "prod_ssd", name: "固态硬盘", type: "product", x: 750, y: 200, status: 0, cost: 600, delay: 0 },
  { id: "prod_screen", name: "屏幕总成", type: "product", x: 400, y: 320, status: 0, cost: 1000, delay: 0 },
  { id: "prod_battery", name: "电池", type: "product", x: 600, y: 320, status: 0, cost: 300, delay: 0 },
  { id: "sup_intel", name: "英特尔", type: "supplier", x: 150, y: 400, status: 0, cost: 0, delay: 0, capacity: 100000, price: 1200 },
  { id: "sup_amd", name: "AMD", type: "supplier", x: 280, y: 480, status: 0, cost: 0, delay: 0, capacity: 80000, price: 1100 },
  { id: "sup_samsung", name: "三星电子", type: "supplier", x: 500, y: 480, status: 0, cost: 0, delay: 0, capacity: 150000, price: 850 },
  { id: "sup_hynix", name: "海力士", type: "supplier", x: 650, y: 480, status: 0, cost: 0, delay: 0, capacity: 120000, price: 780 },
  { id: "sup_wd", name: "西部数据", type: "supplier", x: 800, y: 480, status: 0, cost: 0, delay: 0, capacity: 90000, price: 500 },
  { id: "factory", name: "广达电脑", type: "manufacturer", x: 400, y: 580, status: 0, cost: 0, delay: 0, capacity: 200000 },
  { id: "distributor", name: "联强国际", type: "distributor", x: 650, y: 580, status: 0, cost: 0, delay: 0, capacity: 50000 }
];

const initialEdges: SimEdge[] = [
  { id: "e1", source: "prod_laptop", target: "prod_motherboard", type: "assembly", label: "装配" },
  { id: "e2", source: "prod_laptop", target: "prod_cpu", type: "assembly", label: "装配" },
  { id: "e3", source: "prod_laptop", target: "prod_ram", type: "assembly", label: "装配" },
  { id: "e4", source: "prod_laptop", target: "prod_ssd", type: "assembly", label: "装配" },
  { id: "e5", source: "prod_laptop", target: "prod_screen", type: "assembly", label: "装配" },
  { id: "e6", source: "prod_laptop", target: "prod_battery", type: "assembly", label: "装配" },
  { id: "e7", source: "prod_cpu", target: "sup_intel", type: "supply", label: "供应" },
  { id: "e8", source: "prod_cpu", target: "sup_amd", type: "supply", label: "供应" },
  { id: "e9", source: "prod_ram", target: "sup_samsung", type: "supply", label: "供应" },
  { id: "e10", source: "prod_ram", target: "sup_hynix", type: "supply", label: "供应" },
  { id: "e11", source: "prod_ssd", target: "sup_wd", type: "supply", label: "供应" },
  { id: "e12", source: "prod_screen", target: "sup_samsung", type: "supply", label: "供应" },
  { id: "e13", source: "prod_battery", target: "sup_samsung", type: "supply", label: "供应" },
  { id: "e14", source: "prod_motherboard", target: "factory", type: "manufacture", label: "制造" },
  { id: "e15", source: "prod_cpu", target: "factory", type: "manufacture", label: "制造" },
  { id: "e16", source: "prod_ram", target: "factory", type: "manufacture", label: "制造" },
  { id: "e17", source: "prod_ssd", target: "factory", type: "manufacture", label: "制造" },
  { id: "e18", source: "prod_screen", target: "factory", type: "manufacture", label: "制造" },
  { id: "e19", source: "prod_battery", target: "factory", type: "manufacture", label: "制造" },
  { id: "e20", source: "factory", target: "distributor", type: "distribution", label: "分销" },
  { id: "e21", source: "sup_intel", target: "sup_amd", type: "transaction", label: "交易" },
  { id: "e22", source: "sup_samsung", target: "sup_hynix", type: "transaction", label: "交易" }
];

export default function PropagationSimulation() {
  const [nodes, setNodes] = useState<SimNode[]>(initialNodes);
  const [edges] = useState<SimEdge[]>(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(5);
  const [stepCount, setStepCount] = useState(0);
  const [affectedNodes, setAffectedNodes] = useState<Set<string>>(new Set());
  const [propagationDepth, setPropagationDepth] = useState(0);
  const [logs, setLogs] = useState<string[]>(['仿真就绪，点击“开始”或“注入变更”运行。']);
  
  const [rules, setRules] = useState({
    propagationProbability: 0.7,
    costMultiplier: 1.5,
    delayDays: 5,
    customRuleActive: false
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const drawSimulation = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw edges
    edges.forEach(edge => {
      const src = nodes.find(n => n.id === edge.source);
      const tgt = nodes.find(n => n.id === edge.target);
      if (!src || !tgt) return;

      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);
      
      let strokeStyle = '#94a3b8';
      if (edge.type === 'assembly') strokeStyle = '#f97316';
      else if (edge.type === 'supply') strokeStyle = '#3b82f6';
      else if (edge.type === 'manufacture') strokeStyle = '#8b5cf6';
      else if (edge.type === 'distribution') strokeStyle = '#10b981';
      else if (edge.type === 'transaction') strokeStyle = '#ef4444';
      
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Arrow
      const angle = Math.atan2(tgt.y - src.y, tgt.x - src.x);
      const arrowX = tgt.x - 12 * Math.cos(angle);
      const arrowY = tgt.y - 12 * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX - 5 * Math.sin(angle), arrowY + 5 * Math.cos(angle));
      ctx.lineTo(arrowX + 5 * Math.sin(angle), arrowY - 5 * Math.cos(angle));
      ctx.fillStyle = strokeStyle;
      ctx.fill();

      // Label
      ctx.fillStyle = '#475569';
      ctx.font = '9px sans-serif';
      ctx.fillText(edge.label, (src.x + tgt.x) / 2, (src.y + tgt.y) / 2 - 5);
    });

    // Draw nodes
    nodes.forEach(node => {
      const x = node.x, y = node.y;
      const radius = 22;
      
      let fillColor = node.status === 0 ? '#10b981' : node.status === 1 ? '#f59e0b' : '#ef4444';
      ctx.fillStyle = fillColor;
      
      if (node.type === 'product') {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
      } else if (node.type === 'supplier') {
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      } else if (node.type === 'manufacturer') {
        ctx.beginPath();
        ctx.moveTo(x, y - radius);
        ctx.lineTo(x + radius, y + radius * 0.8);
        ctx.lineTo(x - radius, y + radius * 0.8);
        ctx.fill();
      } else if (node.type === 'distributor') {
        ctx.beginPath();
        ctx.moveTo(x, y - radius);
        ctx.lineTo(x + radius, y);
        ctx.lineTo(x, y + radius);
        ctx.lineTo(x - radius, y);
        ctx.fill();
      }

      if (selectedNodeId === node.id) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        if (node.type === 'product') {
          ctx.beginPath(); ctx.arc(x, y, radius + 2, 0, 2 * Math.PI); ctx.stroke();
        } else if (node.type === 'supplier') {
          ctx.strokeRect(x - radius - 2, y - radius - 2, (radius+2)*2, (radius+2)*2);
        } else if (node.type === 'manufacturer') {
          ctx.beginPath(); ctx.moveTo(x, y - radius - 2); ctx.lineTo(x + radius + 2, y + radius * 0.8 + 2); ctx.lineTo(x - radius - 2, y + radius * 0.8 + 2); ctx.closePath(); ctx.stroke();
        } else if (node.type === 'distributor') {
          ctx.beginPath(); ctx.moveTo(x, y - radius - 2); ctx.lineTo(x + radius + 2, y); ctx.lineTo(x, y + radius + 2); ctx.lineTo(x - radius - 2, y); ctx.closePath(); ctx.stroke();
        }
      }

      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px sans-serif';
      const shortName = node.name.length > 8 ? node.name.slice(0, 7) + '…' : node.name;
      ctx.fillText(shortName, x - 12, y + 4);

      ctx.fillStyle = '#1e293b';
      ctx.font = '12px sans-serif';
      if (node.type === 'product') ctx.fillText('📦', x - 20, y - 12);
      else if (node.type === 'supplier') ctx.fillText('🏭', x - 20, y - 12);
      else if (node.type === 'manufacturer') ctx.fillText('🏭', x - 20, y - 12);
      else if (node.type === 'distributor') ctx.fillText('🚚', x - 20, y - 12);
    });
  }, [nodes, edges, selectedNodeId]);

  useEffect(() => {
    drawSimulation();
    const handleResize = () => drawSimulation();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawSimulation]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const propagateChange = (sourceId: string, isForced = false) => {
    setNodes(prevNodes => {
      let newNodes = [...prevNodes];
      let newAffected = new Set(affectedNodes);
      let newDepth = propagationDepth;
      
      const sourceIndex = newNodes.findIndex(n => n.id === sourceId);
      if (sourceIndex === -1) return prevNodes;

      const source = { ...newNodes[sourceIndex] };
      if (source.status === 0) {
        source.status = 1;
        newAffected.add(source.id);
        addLog(`${source.name} 受到变更影响，状态变为预警`);
      }
      newNodes[sourceIndex] = source;

      const downstreamEdges = edges.filter(e => e.source === sourceId);
      for (let edge of downstreamEdges) {
        const targetIndex = newNodes.findIndex(n => n.id === edge.target);
        if (targetIndex !== -1 && newNodes[targetIndex].status === 0) {
          let shouldPropagate = isForced || Math.random() < rules.propagationProbability;
          if (shouldPropagate) {
            const target = { ...newNodes[targetIndex] };
            target.status = 2;
            newAffected.add(target.id);
            
            if (target.cost > 0) {
              target.cost = target.cost * rules.costMultiplier;
            } else if (target.type === 'supplier' && target.price) {
              target.cost = target.price * rules.costMultiplier;
            } else {
              target.cost = 1000 * rules.costMultiplier;
            }
            target.delay = rules.delayDays;
            
            addLog(`${target.name} 传播中断，成本增加 ${rules.costMultiplier} 倍，延迟 ${rules.delayDays} 天`);
            newNodes[targetIndex] = target;

            // Calculate depth
            let depth = 1;
            let current = target;
            while (current) {
              const parentEdge = edges.find(e => e.target === current.id);
              if (parentEdge) {
                const parentNode = newNodes.find(n => n.id === parentEdge.source);
                if (parentNode && parentNode.status === 2) depth++;
                current = parentNode;
              } else break;
            }
            if (depth > newDepth) newDepth = depth;
          } else {
            addLog(`${newNodes[targetIndex].name} 因规则概率未触发，未传播变更`);
          }
        }
      }
      
      setAffectedNodes(newAffected);
      setPropagationDepth(newDepth);
      return newNodes;
    });
  };

  const simulationStep = () => {
    setNodes(prevNodes => {
      const activeNodes = prevNodes.filter(n => n.status === 1);
      if (activeNodes.length > 0) {
        const rand = activeNodes[Math.floor(Math.random() * activeNodes.length)];
        // We need to call propagateChange, but since it uses setNodes, we should just return prevNodes and call it outside
        // Or better, we can just do the logic here.
        setTimeout(() => propagateChange(rand.id, false), 0);
      } else {
        addLog("仿真步进: 无预警节点，无新传播事件");
      }
      return prevNodes;
    });
    
    setStepCount(prev => {
      const next = prev + 1;
      if (next > 100) {
        setIsRunning(false);
        addLog("仿真达到最大步数，停止");
      }
      return next;
    });
  };

  useEffect(() => {
    if (isRunning) {
      const intervalTime = Math.max(100, 1000 - (speed - 1) * 80);
      intervalRef.current = setInterval(() => {
        simulationStep();
      }, intervalTime);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, speed]);

  const handleStart = () => {
    if (!isRunning) {
      setIsRunning(true);
      addLog("仿真开始运行");
    }
  };

  const handlePause = () => {
    if (isRunning) {
      setIsRunning(false);
      addLog("仿真已暂停");
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setNodes(initialNodes);
    setAffectedNodes(new Set());
    setPropagationDepth(0);
    setStepCount(0);
    setSelectedNodeId(null);
    setLogs(['仿真已重置，所有节点恢复正常']);
  };

  const handleInject = () => {
    const targetId = prompt("请输入变更注入的节点ID (如 prod_cpu, sup_intel)", "prod_cpu");
    if (targetId) {
      const node = nodes.find(n => n.id === targetId);
      if (node) {
        addLog(`手动注入变更到节点 ${node.name}，强制传播下游（概率100%）`);
        propagateChange(node.id, true);
      } else {
        alert("节点不存在，可选ID: " + nodes.map(n => n.id).join(", "));
      }
    }
  };

  const handleImportRule = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const ruleData = JSON.parse(ev.target?.result as string);
          setRules(prev => ({
            ...prev,
            propagationProbability: typeof ruleData.propagationProbability === 'number' ? Math.min(1, Math.max(0, ruleData.propagationProbability)) : prev.propagationProbability,
            costMultiplier: typeof ruleData.costMultiplier === 'number' ? Math.max(1, ruleData.costMultiplier) : prev.costMultiplier,
            delayDays: typeof ruleData.delayDays === 'number' ? Math.max(0, ruleData.delayDays) : prev.delayDays,
            customRuleActive: true
          }));
          addLog(`已导入规则：传播概率=${ruleData.propagationProbability || rules.propagationProbability}, 成本系数=${ruleData.costMultiplier || rules.costMultiplier}, 延迟=${ruleData.delayDays || rules.delayDays}`);
        } catch (err) {
          alert("规则文件格式错误，请使用JSON格式，包含 propagationProbability, costMultiplier, delayDays 字段");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    let minDist = 30;
    let clickedNode: SimNode | null = null;
    
    nodes.forEach(node => {
      const dx = node.x - mouseX;
      const dy = node.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        clickedNode = node;
      }
    });
    
    if (clickedNode) {
      setSelectedNodeId(clickedNode.id);
      let info = `${clickedNode.name} (${clickedNode.type})\n状态: ${clickedNode.status === 0 ? '正常' : (clickedNode.status === 1 ? '预警' : '中断')}`;
      if (clickedNode.type === 'product') info += `\n成本: ${clickedNode.cost} 元`;
      else if (clickedNode.type === 'supplier') info += `\n产能: ${clickedNode.capacity} 件/月\n价格: ${clickedNode.price} 元`;
      else if (clickedNode.type === 'manufacturer') info += `\n产能: ${clickedNode.capacity} 件/月`;
      else if (clickedNode.type === 'distributor') info += `\n吞吐量: ${clickedNode.capacity} 件/月`;
      alert(info);
    } else {
      setSelectedNodeId(null);
    }
  };

  const totalCost = nodes.reduce((sum, n) => sum + (n.status === 2 ? n.cost : 0), 0);
  const totalDelay = nodes.reduce((sum, n) => sum + (n.status === 2 ? n.delay : 0), 0);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2"><Activity size={20} /> 变更效应传播可视化</h2>
          <p className="text-xs text-slate-300 mt-1">产品-供应链网络 | 智能体规则导入 | 动态传播仿真</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleImportRule} className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition-colors"><FileJson size={14} /> 导入智能体规则</button>
          <button onClick={handleStart} disabled={isRunning} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition-colors"><Play size={14} /> 开始</button>
          <button onClick={handlePause} disabled={!isRunning} className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition-colors"><Pause size={14} /> 暂停</button>
          <button onClick={() => { if (!isRunning) simulationStep(); }} disabled={isRunning} className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition-colors"><SkipForward size={14} /> 步进</button>
          <button onClick={handleReset} className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition-colors"><RotateCcw size={14} /> 重置</button>
          <button onClick={handleInject} className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition-colors"><Zap size={14} /> 注入变更</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Canvas */}
        <div className="flex-1 bg-slate-50 relative border-r border-slate-200" ref={containerRef}>
          <canvas 
            ref={canvasRef} 
            onClick={handleCanvasClick}
            className="absolute inset-0 cursor-pointer"
          />
        </div>

        {/* Right Panel: Dashboard */}
        <div className="w-1/4 min-w-[320px] bg-slate-50 p-4 flex flex-col overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1"><AlertTriangle size={12}/> 受影响节点数</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{affectedNodes.size}</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1"><Activity size={12}/> 最大传播深度</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{propagationDepth}</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1"><DollarSign size={12}/> 累计成本(万)</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{(totalCost / 10000).toFixed(1)}</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
              <div className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1"><Clock size={12}/> 总延迟(天)</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{totalDelay}</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <label className="block text-sm font-semibold text-slate-700 mb-2">仿真速度</label>
            <input 
              type="range" 
              min="1" max="10" 
              value={speed} 
              onChange={e => setSpeed(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>慢</span>
              <span>快</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl text-xs text-blue-800">
            <strong>📋 当前规则：</strong> {rules.customRuleActive ? '自定义规则' : '默认规则'}
            <br/>传播概率: {rules.propagationProbability}
            <br/>成本系数: {rules.costMultiplier}
            <br/>延迟: {rules.delayDays} 天
          </div>

          <div className="bg-slate-900 rounded-xl flex-1 min-h-[200px] flex flex-col overflow-hidden shadow-inner">
            <div className="bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 border-b border-slate-700 flex items-center gap-1">
              <Activity size={12}/> 仿真日志
            </div>
            <div className="p-3 overflow-y-auto flex-1 font-mono text-[10px] text-emerald-400 space-y-1">
              {logs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
