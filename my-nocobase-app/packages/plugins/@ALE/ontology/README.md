# @ALE/ontology

ALE 本体注册表 - 运行态核心组件，管理对象、关系、流程、动作、规则的注册和版本控制。

## 功能

- 对象注册和管理
- 关系注册和管理
- 流程注册和管理
- 动作注册和管理
- 规则注册和管理
- Collection 自动同步
- 本体导入/导出
- 版本控制

## 安装

```bash
yarn pm add @ALE/ontology
yarn pm enable @ALE/ontology
```

## 使用

```typescript
import { OntologyRegistry } from '@ALE/ontology';

const registry = app.plugin('@ALE/ontology')?.getRegistry();

// 注册对象
await registry.registerObject({
  collectionName: 'disposal_orders',
  displayName: '处置单',
  fields: [...],
});

// 同步到 Collection
await registry.syncToCollection(objectDefinition);
```

## API

- `registerObject(definition)` - 注册对象
- `getObject(collectionName)` - 获取对象
- `registerRelation(definition)` - 注册关系
- `registerFlow(definition)` - 注册流程
- `registerAction(definition)` - 注册动作
- `registerRule(definition)` - 注册规则
- `syncToCollection(objectDefinition)` - 同步到 Collection
- `exportOntology()` - 导出本体
- `importOntology(snapshot)` - 导入本体
