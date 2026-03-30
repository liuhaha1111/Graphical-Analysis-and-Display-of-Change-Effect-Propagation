# 知识图谱节点编辑与导出设计

**Date:** 2026-03-30

**Goal:** 在当前实际使用的知识图谱页面中补齐新增供应商、节点编辑、递归删除组件子树以及导出当前图谱 JSON 的能力，并保持与共享工作区模型一致。

## 当前状态

当前实际生效的知识图谱页面位于：

- `src/features/knowledge-graph/KnowledgeGraphPage.tsx`
- `src/features/knowledge-graph/KnowledgeGraphSidebar.tsx`
- `src/features/knowledge-graph/KnowledgeGraphCanvas.tsx`
- `src/services/knowledgeGraph.service.ts`
- `src/store/workspaceStore.tsx`

根目录下的 `KnowledgeGraph.tsx` 仅作为原型参考，不是当前应用入口。

当前页面已经具备：

- 从共享工作区 `WorkspaceModel` 构建图谱
- 关系类型筛选
- 3D 画布选点与一跳展开
- 节点详情查看

当前页面仍缺少：

- 在实际页面新增供应商节点
- 点击节点后编辑节点
- 删除供应商节点
- 删除产品组件节点并递归删除整个子树
- 导出当前图谱 JSON

## 范围与非目标

### 范围

本次只处理当前知识图谱页面及其直接依赖的数据服务：

- 供应商节点新增
- 产品组件节点编辑
- 供应商节点编辑
- 供应商节点删除
- 产品组件节点递归删除
- 当前可见图谱导出 JSON

### 非目标

- 不修改根目录原型 `KnowledgeGraph.tsx`
- 不增加新的后端接口或持久化能力
- 不调整 3D 布局算法本身
- 不支持编辑产品组件父子层级
- 不支持为同一供应商同时保存混合的 `supply` 与 `service` 关系

## 方案比较

### 方案一：把所有编辑逻辑直接写在页面组件里

优点：

- 上手快
- 文件数较少

缺点：

- `KnowledgeGraphPage.tsx` 会继续膨胀
- 递归删除和级联清理难以单测
- 导出逻辑与 UI 强耦合

### 方案二：页面负责交互，新增独立编辑服务负责数据变更

优点：

- 页面只负责收集表单数据和展示结果
- 新增、更新、删除、导出都能用纯函数测试
- 风险集中，便于保护共享工作区一致性

缺点：

- 需要新增一个小型服务模块

### 方案三：把全部编辑能力上提到 store action 层

优点：

- 长期结构最整齐

缺点：

- 这次会引出一轮 store 重构
- 范围超过本次需求

## 结论

采用方案二：页面负责交互，新增独立服务负责知识图谱编辑与导出逻辑。

## 数据模型设计

### 共享工作区写回位置

新增和编辑都直接写回 `WorkspaceModel`：

- 产品节点落在 `state.product.components`
- 供应商节点落在 `state.supplyChain.partners`
- 供应关系落在 `partner.supplies`
- 配套服务关系落在 `partner.services`
- 供应商交易路线保留在 `state.supplyChain.routes`

### 供应商属性扩展

为满足“生产能力”和“产品价格”编辑需求，需要在 `SupplyPartner` 上增加两个节点级字段：

- `productionCapacity: number`
- `unitPrice: number`

这样图谱详情面板和导出 JSON 都能直接读取，不必从 `supplies` 或 `services` 推断。

### 关系类型约束

新增或编辑供应商时，关系类型本次统一为单选：

- `supply` 对应“供应关系”
- `service` 对应“配套服务关系”

若用户为一个供应商选择多个组件，则按同一种关系类型批量建立多条跨域边。

## 页面交互设计

### 左侧概览区

在 `KnowledgeGraphSidebar.tsx` 中补充“图谱操作”区域，提供两个动作：

- `新增供应商`
- `导出当前图谱 JSON`

保持现有关系筛选和指标概览不变。

### 中间画布区

`KnowledgeGraphCanvas.tsx` 保持现有 3D 交互不变：

- 点击节点选中
- 展开一跳邻居
- 重置局部视图

新增功能不直接修改画布交互模型。

### 右侧详情区

右侧详情区升级为“查看 + 编辑”面板：

- 选中产品组件时，显示并允许编辑：
  - `name`
  - `category`
  - `stage`
  - `description`
  - `tags`
- 选中供应商时，显示并允许编辑：
  - `name`
  - `productionCapacity`
  - `unitPrice`
  - `supplied components`
  - `relation type`

同时提供：

- `保存更新`
- `删除节点`

未选中节点时维持空状态。

### 新增供应商弹窗

新增供应商使用 modal，字段如下：

- 供应商名称
- 生产能力
- 产品价格
- 供应产品多选
- 关系类型单选

校验规则：

- 名称不能为空
- 至少选择一个产品组件
- 数值字段必须是有效数字

保存后：

- 新供应商写入共享工作区
- 供应关系或服务关系同步建立
- 节点自动成为当前选中节点

## 更新与删除规则

### 更新产品组件

允许更新：

- `name`
- `category`
- `stage`
- `description`
- `tags`

不允许更新：

- `id`
- `parentId`

### 更新供应商

允许更新：

- `name`
- `productionCapacity`
- `unitPrice`
- 组件关联列表
- 统一关系类型

更新供应商关联时，需先清空当前供应商的 `supplies` 与 `services`，再按表单重建，避免旧关系残留。

### 删除供应商

删除供应商时，级联删除：

- 当前供应商节点
- 该供应商的 `supplies`
- 该供应商的 `services`
- 以该供应商为起点或终点的 `routes`

### 删除产品组件

删除产品组件时，递归删除整个组件子树，并同步清理：

- 子树内所有组件
- 这些组件的参数
- 这些参数相关的参数依赖
- 所有指向这些组件的供应关系
- 所有指向这些组件的服务关系

若 `changeScenario.sourceComponentId` 或 `changeScenario.sourceParameterId` 落在删除范围内，则同步清空，避免页面引用失效。

删除后如果当前选中节点不可见，则自动回退到仍可见节点；若局部图为空，则展示空状态。

## 导出设计

导出目标为“当前图谱数据 JSON”，不是图片。

导出内容采用当前可见局部图 `localGraph`，并附带当前视图上下文：

```json
{
  "exportedAt": "2026-03-30T00:00:00.000Z",
  "filters": ["assembly", "configuration", "supply"],
  "focusNodeId": "comp_cpu",
  "selectedNodeId": "partner_chipmaker",
  "nodes": [],
  "edges": []
}
```

导出文件名格式：

- `knowledge-graph-YYYY-MM-DD.json`

## 模块拆分

### `src/services/knowledgeGraphEditing.ts`

新增纯函数服务，负责：

- 生成新供应商 ID
- 新增供应商
- 更新产品组件
- 更新供应商及其跨域关系
- 删除供应商
- 递归删除产品组件子树
- 构建当前图谱导出 JSON

### `src/domain/workspace.ts`

扩展 `SupplyPartner` 字段：

- `productionCapacity`
- `unitPrice`

### `src/data/demoWorkspace.ts`

补齐种子供应商和生成供应商的默认 `productionCapacity` 与 `unitPrice` 数据，保证演示数据完整。

### `src/features/knowledge-graph/KnowledgeGraphPage.tsx`

负责：

- 弹窗开关与表单状态
- 右侧详情编辑表单
- 调用编辑服务并写回 `setState`
- 调用导出函数并触发下载

### `src/features/knowledge-graph/KnowledgeGraphSidebar.tsx`

负责：

- 新增“图谱操作”按钮区

## 测试设计

### 服务测试

新增 `src/services/knowledgeGraphEditing.test.ts`，覆盖：

- 新增供应商会写入 partner 与 supply/service 关系
- 更新产品组件会持久化 `category / stage / description / tags`
- 更新供应商会替换旧的供应或服务关系
- 删除供应商会移除相关 routes
- 递归删除产品组件会清理子树、参数、参数依赖以及供应/服务关系
- 删除组件会在必要时清理 `changeScenario`
- 导出函数只导出当前可见图谱上下文

### 页面测试

扩展 `src/features/knowledge-graph/KnowledgeGraphPage.test.tsx`，覆盖：

- 新增供应商后可在详情区看到新节点
- 选中产品组件后可编辑并保存字段
- 选中供应商后可编辑并保存字段与关系
- 删除组件后该节点及其子节点不可见
- 触发导出时生成 JSON 下载链接

## 风险与控制

### 风险一：删除组件导致共享工作区引用失效

控制方式：

- 删除逻辑集中在服务层
- 同步清理参数、依赖、供应关系和 `changeScenario`

### 风险二：编辑供应商后旧关系残留

控制方式：

- 更新供应商时统一重建 `supplies` 与 `services`

### 风险三：页面文件继续膨胀

控制方式：

- 数据变更和导出逻辑抽到独立服务
- 表单草稿状态在页面内最小化持有

## 验收标准

- 当前实际知识图谱页面支持新增供应商
- 新增的供应商节点可在图谱中显示并被选中
- 选中产品组件节点后可更新 `category / stage / description / tags`
- 选中供应商节点后可更新名称、生产能力、产品价格、供应产品和关系类型
- 删除供应商后相关跨域关系与路线被清理
- 删除产品组件后整个子树及相关引用被清理
- 页面支持导出当前可见图谱 JSON
- 新增和编辑能力有自动化测试覆盖
