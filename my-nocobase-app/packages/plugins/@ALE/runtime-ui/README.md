# @ALE/runtime-ui

ALE 运行态 UI 生成 - 运行态核心组件，从本体自动生成 NocoBase UI。

## 功能

- Collection 自动注册
- 列表/表单/详情视图自动生成
- 菜单自动生成
- 自定义组件（状态流程指示器、门禁状态徽章、审计日志面板）

## 安装

```bash
yarn pm add @ALE/runtime-ui
yarn pm enable @ALE/runtime-ui
```

## 前端组件

```tsx
import {
  StateFlowIndicator,
  GateStatusBadge,
  AuditLogPanel,
} from '@ALE/runtime-ui';

// 状态流程指示器
<StateFlowIndicator
  currentStatus="approved"
  statusHistory={history}
/>

// 门禁状态徽章
<GateStatusBadge result={gateResult} showDetails />

// 审计日志面板
<AuditLogPanel
  subjectType="disposal_orders"
  subjectId="xxx"
  autoRefresh
/>
```

## API

- `generate(collectionName)` - 从本体生成 UI 配置
- `registerCollection(collectionName)` - 注册并生成 Collection
- `getListSchema(collectionName)` - 获取列表 Schema
- `getFormSchema(collectionName)` - 获取表单 Schema
- `getDetailSchema(collectionName)` - 获取详情 Schema
- `generateAll()` - 批量生成所有本体的 UI
