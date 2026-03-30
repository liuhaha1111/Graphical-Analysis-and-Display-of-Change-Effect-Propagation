# 产品模型导入导出与依赖元数据设计

**Date:** 2026-03-30

**Goal:** 为当前产品建模页面补齐产品模型导入/导出能力，并在新增依赖时强制填写关系类型与公式/约束描述。

## 当前状态

当前实际生效的产品建模功能位于：

- `src/features/product-modeling/ProductModelingPage.tsx`
- `src/features/product-modeling/BomTreePanel.tsx`
- `src/features/product-modeling/ParameterPanel.tsx`
- `src/features/product-modeling/DependencyPanel.tsx`
- `src/features/product-modeling/productModelingForm.ts`

这些组件直接读写共享工作区中的 `state.product`，对应的数据结构是 `src/domain/workspace.ts` 里的 `ProductDomain`：

- `components`
- `parameters`
- `parameterLinks`

根目录下的旧版 `ProductModeling.tsx` 只是原型文件，已经包含“关系类型 + 公式/约束描述”的旧实现思路，但它不接入当前共享工作区，也不是当前页面实际使用的代码路径。

当前页面已经支持：

- 新增根组件
- 新增子组件
- 新增可变更参数
- 从现有参数之间新增依赖

当前页面仍缺少：

- 产品模型导入
- 产品模型导出
- 依赖新增时对“关系类型”和“公式/约束描述”的必填采集
- 可直接用于导入测试的产品模型 JSON 示例文件

## 范围与非目标

### 范围

本次只处理产品建模页使用的产品模型数据，即 `ProductDomain`：

- `components`
- `parameters`
- `parameterLinks`

导入导出只读写 `state.product`，不会触碰：

- `supplyChain`
- `changeScenario`
- `analysis`

### 非目标

- 不导入导出整份 `WorkspaceModel`
- 不改知识图谱页和传播分析页的独立状态结构
- 不补做参数、组件、依赖的编辑/删除能力
- 不为大数据量场景引入复杂筛选式导入器

## 方案比较

### 方案一：在页面里直接实现全部导入导出逻辑

在 `ProductModelingPage.tsx` 里直接加入：

- 文件选择
- JSON 解析
- 数据校验
- 导出 Blob 生成

优点：

- 改动路径最短

缺点：

- 页面职责继续膨胀
- JSON 校验和 UI 耦合
- 后续难以复用和单测

### 方案二：页面负责交互，独立模块负责序列化与校验

页面只负责：

- 触发导入
- 显示文件选择器
- 展示错误
- 写回 `state.product`

独立模块负责：

- `ProductDomain` 的导出序列化
- 导入 JSON 的结构校验
- 导入 JSON 的引用校验
- 返回规范化后的 `ProductDomain`

优点：

- 职责清晰
- 更容易做单元测试
- 后续如果别的页面也要复用产品模型 JSON，迁移成本低

缺点：

- 需要新增一个小型服务模块

### 方案三：沿用旧原型的文本框导入方式

保留一个 textarea 让用户粘贴 JSON，再通过按钮导入。

优点：

- 复用旧原型思路

缺点：

- 真实使用体验差
- 与“导入模型/导出模型”诉求不完全匹配

## 结论

采用方案二：页面负责交互，新增独立产品模型导入导出模块负责序列化与校验。

## 数据模型设计

### 依赖字段映射

当前依赖数据结构是 `ParameterLink`：

```ts
export type ParameterLink = {
  id: string;
  sourceComponentId: string;
  sourceParameterId: string;
  targetComponentId: string;
  targetParameterId: string;
  relation: 'functional' | 'constraint' | 'quality' | 'cost' | 'schedule';
  expression: string;
  impactWeight: number;
};
```

本次不新增新的领域字段，而是直接复用现有字段：

- “数值传递” -> `relation: 'functional'`
- “逻辑约束” -> `relation: 'constraint'`
- “公式/约束描述” -> `expression`

这样可以保证：

- 不需要扩展下游领域模型
- 导入后的依赖可以立刻被当前页面与后续分析复用
- 与旧原型里 `relationType + expression` 的用户认知保持一致

### 导入导出 JSON 结构

导出的产品模型 JSON 只包含：

```json
{
  "components": [],
  "parameters": [],
  "parameterLinks": []
}
```

不会包含：

- `supplyChain`
- `changeScenario`
- `analysis`

## 页面交互设计

### 顶部操作

在 `ProductModelingPage.tsx` 的页面头部区域新增两个按钮：

- `导入产品模型`
- `导出产品模型`

导出按钮：

- 直接读取当前 `state.product`
- 生成 `.json` 文件下载
- 文件名格式为 `product-model-YYYY-MM-DD.json`

导入按钮：

- 打开本地文件选择器
- 只接受 `.json`
- 读文件后调用独立校验模块
- 校验成功则覆盖当前 `state.product`
- 校验失败则保留现有数据并展示错误

### 依赖创建弹窗

依赖创建弹窗从当前的 4 个字段扩展为 6 个字段：

- 源节点
- 源参数
- 目标节点
- 目标参数
- 关系类型
- 公式/约束描述

约束如下：

- 关系类型为必选下拉框
- 只提供两个选项：
  - `数值传递`
  - `逻辑约束`
- “公式/约束描述”为必填多行文本框
- 所有字段完整后才允许保存

### 依赖展示卡片

依赖卡片展示同步调整：

- 将内部枚举值转成中文标签展示
- 展示公式/约束描述
- 保留当前源参数到目标参数的可读链路文案

## 导入校验设计

导入校验分两层。

### 第一层：结构校验

顶层必须是对象，且包含：

- `components`
- `parameters`
- `parameterLinks`

三者都必须为数组。

每类条目至少具备以下关键字段：

#### `components`

- `id`
- `name`
- `parentId`
- `category`
- `stage`

#### `parameters`

- `id`
- `componentId`
- `name`
- `unit`
- `baselineValue`
- `changeable`

#### `parameterLinks`

- `id`
- `sourceComponentId`
- `sourceParameterId`
- `targetComponentId`
- `targetParameterId`
- `relation`
- `expression`
- `impactWeight`

### 第二层：引用校验

必须满足：

- 参数引用的 `componentId` 存在
- 依赖引用的源组件和目标组件存在
- 依赖引用的源参数和目标参数存在
- 源参数属于 `sourceComponentId`
- 目标参数属于 `targetComponentId`
- `relation` 只能是 `functional` 或 `constraint`
- `expression` 不能为空白

## 错误处理

页面内错误处理遵循以下规则：

- 导入失败时显示明确错误文案，不使用 `alert`
- 导入成功时清空上一次导入错误
- 导入后如果当前选中组件不存在，重新回退到首个有效组件
- 如果导入数据触发 `buildProductTree` 的树结构错误，保留现有错误暴露路径，不额外吞掉异常

依赖保存错误遵循以下规则：

- 缺少关系类型时不允许保存
- 缺少公式/约束描述时不允许保存
- 保持现有“源参数与目标参数不能相同”的校验

## 模块拆分

### `src/features/product-modeling/ProductModelingPage.tsx`

负责：

- 顶部导入/导出按钮
- 文件选择输入
- 导入错误显示
- 成功导入后覆盖 `state.product`
- 依赖弹窗新增字段与保存逻辑

### `src/features/product-modeling/productModelingForm.ts`

负责：

- 扩展 `DependencyDraft`
- 管理关系类型与表达式的默认值
- 校验依赖草稿是否完整
- 解析依赖草稿为可落盘结构

### `src/features/product-modeling/DependencyPanel.tsx`

负责：

- 依赖卡片的中文关系类型展示
- 依赖描述展示

### `src/services/productModelImportExport.ts`

新增模块，负责：

- `exportProductModel(product: ProductDomain): string`
- `importProductModel(raw: string): ProductDomain`
- 必要的结构和引用校验
- 输出规范化后的 `ProductDomain`

## 示例文件

新增一个可直接导入的产品模型 JSON 文件：

- `docs/examples/product-model-import.json`

内容来源于当前产品模型数据结构，便于：

- 手工导入验证
- 向用户演示 JSON 格式
- 回归测试时快速取样

## 测试设计

### 页面行为测试

更新 `src/features/product-modeling/ProductModelingPage.test.tsx`，覆盖：

- 依赖弹窗必须选择关系类型并填写公式/约束描述
- 成功保存后依赖卡片显示中文关系类型与描述
- 导入合法 JSON 后页面刷新为新数据
- 导入非法 JSON 时保留旧数据并显示错误
- 导出只基于 `ProductDomain`

### 模块测试

新增 `src/services/productModelImportExport.test.ts`，覆盖：

- 导出结果只包含 `components / parameters / parameterLinks`
- 合法 JSON 可成功导入
- 非法关系类型被拒绝
- 空表达式被拒绝
- 参数引用不存在组件时被拒绝
- 依赖中的源目标参数与组件不匹配时被拒绝

## 风险与控制

### 风险一：页面逻辑过重

控制方式：

- 序列化和校验逻辑放入独立服务模块
- 页面仅负责交互和状态切换

### 风险二：导入数据污染共享工作区的其他域

控制方式：

- 只覆盖 `state.product`
- 保持其他工作区字段不变

### 风险三：导入数据结构合法但树关系异常

控制方式：

- 保留现有 `buildProductTree` 错误暴露机制
- 在导入服务里优先做组件引用与参数引用校验

## 验收标准

- 新增依赖时必须填写关系类型和公式/约束描述
- 保存后的依赖以中文关系类型和描述形式显示在页面上
- 产品建模页支持导入与导出 `ProductDomain`
- 导入只覆盖产品模型，不影响其他工作区域
- 仓库内存在一个可直接导入的产品模型 JSON 示例文件
