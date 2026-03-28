# 变更效应传播图形化分析展示前端设计

## 背景

当前前端是一个 Vite + React 单页应用，已经粗分为三个功能组件：

- 产品结构建模
- 产品设计知识图谱
- 变更效应传播可视化

但现状存在三个根问题：

1. 源码有明显编码损坏，部分中文、字符串和 JSX 已破坏，不能作为稳定原型继续迭代。
2. 三个页面各自维护一份硬编码状态，业务模型不统一，无法形成“设计域 + 供应链域 + 传播域”的闭环。
3. 传播分析依赖随机逻辑，不基于真实的产品结构、参数依赖和供应链映射，结果不可解释。

本轮目标不是直接做生产系统，而是做一个结构正确、可稳定演示、后续可扩展到真实数据导入的前端原型。

## 目标

- 建立统一的共享业务模型，贯通三个功能页。
- 用内置示例数据驱动完整演示流程。
- 支持产品结构树、参数依赖、产品-供应链网络和变更传播结果的联动展示。
- 以规则驱动的确定性传播替代随机仿真。
- 输出传播路径、受影响节点数、综合影响评分、成本风险和工期风险。

## 非目标

- 不做 Excel 解析。
- 不接后端持久化。
- 不做复杂图布局算法。
- 不做规则脚本引擎。
- 不做多用户协作或权限系统。

## 总体方案

采用“统一领域模型 + 共享状态层 + 派生服务层 + 三个页面视角”的结构。

### 分层

1. `domain`
定义共享业务类型和分析结果类型。

2. `data`
提供原型示例数据。

3. `store`
管理全局工作区状态，三个页面统一从这里读写。

4. `services`
提供纯函数计算：
- 产品树派生
- 参数依赖图派生
- 产品-供应链拓扑派生
- 传播路径计算
- 影响评分计算

5. `features`
按业务页组织 UI 组件：
- `product-modeling`
- `knowledge-graph`
- `propagation-analysis`

## 统一数据模型

统一状态命名为 `WorkspaceModel`，建议结构如下：

```ts
export type WorkspaceModel = {
  product: {
    components: ProductComponent[];
    bomEdges: BomEdge[];
    parameters: ComponentParameter[];
    parameterLinks: ParameterLink[];
    constraints: ConstraintRule[];
  };
  supplyChain: {
    partners: SupplyNode[];
    routes: SupplyRoute[];
    componentSourcing: ComponentSupplierMapping[];
    capabilityProfiles: CapabilityProfile[];
  };
  changeScenario: ChangeScenario;
  analysis: PropagationAnalysisResult | null;
};
```

### 产品域

- `components`: 组件或零部件节点。
- `bomEdges`: 父子 BOM 关系。
- `parameters`: 组件参数。
- `parameterLinks`: 参数到参数的依赖。
- `constraints`: 参数约束或工艺规则。

### 供应链域

- `partners`: 供应商、工厂、分销节点。
- `routes`: 物流、供货、制造、分销路径。
- `componentSourcing`: 产品组件与供应商的映射。
- `capabilityProfiles`: 产能、库存、成本、交期等能力参数。

### 变更与分析域

- `changeScenario`: 当前注入的变更。
- `analysis`: 传播计算结果，包括路径、指标和节点影响明细。

### UI 状态

纯界面态不进入 `WorkspaceModel`，单独放在 store 中：

- 当前页签
- 当前选中节点
- 过滤条件
- 画布高亮和展开状态

## 页面职责

### 1. 产品结构建模页

职责：

- 维护产品树。
- 维护组件参数。
- 维护参数依赖和约束。
- 输出产品结构与参数依赖基础数据。

交互：

- 左侧：BOM 树。
- 中间：当前组件参数与约束。
- 右侧：参数依赖清单和规则摘要。

约束：

- 不再使用 `prompt/alert/confirm` 作为主交互。
- 不保留本页独立的业务状态。

### 2. 产品设计知识图谱页

职责：

- 在产品域基础上补充供应链关系。
- 展示产品组件到供应商、工厂、分销节点的网络拓扑。
- 查看节点能力参数和映射关系。

交互：

- 左侧：筛选与节点清单。
- 中间：拓扑图。
- 右侧：节点详情和供应映射信息。

约束：

- 产品节点来自共享模型，不允许本页再维护独立产品数据集。

### 3. 变更效应传播可视化页

职责：

- 注入变更。
- 执行传播分析。
- 展示路径和综合结果。

交互：

- 左侧：变更注入表单、传播规则参数。
- 中间：传播路径图。
- 右侧：汇总指标、风险等级和受影响节点明细。

约束：

- “开始/暂停/步进”如果保留，仅用于播放结果，不改变分析结论。
- 核心分析必须由纯计算服务给出。

## 传播算法

原型采用“规则驱动的确定性传播 + 可选播放”的策略。

### 输入

- 变更源组件
- 变更参数
- 变更类型
- 变更幅度

### 传播路径

1. 从变更源参数出发。
2. 先沿 `parameterLinks` 在产品域内传播。
3. 再按组件受影响情况映射到供应链域。
4. 在供应链域内沿 `routes` 继续传播。

### 关系权重

建议默认权重：

- 参数直接依赖：`1.0`
- 跨组件参数依赖：`0.8`
- BOM 父子影响：`0.6`
- 组件到供应商映射：`0.75`
- 制造/物流路径：`0.65`

### 节点影响值

```ts
impactValue = sourceImpact * relationWeight * changeMagnitudeFactor * domainFactor;
```

建议约束：

- 结果截断到 `0 - 100`
- 小于阈值的节点不继续扩散
- 已访问节点按最大影响值保留

### 综合影响评分

```ts
overallScore =
  0.35 * structureImpact +
  0.30 * parameterImpact +
  0.20 * supplyChainImpact +
  0.15 * costScheduleRisk;
```

建议输出：

- `affectedNodeCount`
- `maxPropagationDepth`
- `overallScore`
- `costRisk`
- `scheduleRisk`
- `riskLevel`
- `propagationPaths`
- `impactDetails`

风险等级：

- `0 - 29`: 低
- `30 - 59`: 中
- `60 - 79`: 高
- `80 - 100`: 极高

## 建议文件结构

```text
src/
  app/
  components/
    ui/
  data/
  domain/
  features/
    product-modeling/
    knowledge-graph/
    propagation-analysis/
  services/
  store/
```

## 验证策略

至少覆盖两层验证：

1. 纯逻辑测试
- 产品树派生
- 拓扑派生
- 传播分析
- 综合评分

2. 构建验证
- `npm run lint`
- `npm run build`

## 风险与约束

- 当前工作区不是 git 仓库，无法按常规开发流执行提交动作。
- 当前项目存在编码损坏文件，必须优先替换或删除，否则 TypeScript 无法稳定通过。
- 现有项目未确认测试工具链可用，实施时应先补充测试依赖和脚本。

## 结论

本轮最合适的实现路径是：

1. 先重建统一领域模型和共享状态。
2. 再将三页重构为共享模型的不同视角。
3. 最后补传播分析服务和评分逻辑。

这样既能快速交付可演示原型，也能为后续接入 CSV/Excel、后端存储和更复杂规则保留稳定扩展点。
