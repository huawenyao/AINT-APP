# @ALE/dynamic-view

ALE 动态视图 - 构建态核心组件，提供方案预览和图表生成。

## 功能

- Schema 图生成（ReactFlow）
- 状态机图生成（ReactFlow）
- UI Schema 生成
- Mock 数据生成
- 实时预览支持

## 安装

```bash
yarn pm add @ALE/dynamic-view
yarn pm enable @ALE/dynamic-view
```

## 前端组件

```tsx
import { ALEStudio, SchemaGraph, StateMachineGraph } from '@ALE/dynamic-view';

// 使用 Studio 组件
<ALEStudio
  sessionId="xxx"
  currentProposal={proposal}
  onSendIntent={handleSendIntent}
/>

// 使用 Schema 图
<SchemaGraph preview={proposal.previews.schema} />

// 使用状态机图
<StateMachineGraph preview={proposal.previews.stateMachine} />
```

## API

- `generatePreviews(proposalId)` - 生成方案预览
- `generateSchemaGraph(proposalId)` - 生成 Schema 图
- `generateStateMachineGraph(flowId)` - 生成状态机图
- `generateUISchema(collectionName, viewType)` - 生成 UI Schema
- `generateMockData(collectionName, count)` - 生成 Mock 数据
