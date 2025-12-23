# @ALE/core

ALE 核心模块 - 提供双态架构的基础类型定义和数据表。

## 功能

- 13 个核心数据表定义
- 完整的 TypeScript 类型系统
- Zod Schema 验证
- 审计服务
- 证据服务

## 安装

```bash
yarn pm add @ALE/core
yarn pm enable @ALE/core
```

## 使用

```typescript
import { ALECorePlugin } from '@ALE/core';
import { AuditService, EvidenceService } from '@ALE/core';

// 使用审计服务
const auditService = app.plugin('@ALE/core')?.getAuditService();
await auditService.log({
  action: 'create',
  actorId: 1,
  subjectType: 'disposal_orders',
  subjectId: 'xxx',
  data: {},
});
```

## API

### 审计服务

- `log(entry)` - 记录审计日志
- `query(filter)` - 查询审计日志
- `getTraceChain(correlationId)` - 获取追踪链
- `getSubjectHistory(subjectType, subjectId)` - 获取对象操作历史

### 证据服务

- `collect(evidence)` - 收集证据
- `verify(evidenceId, verified)` - 验证证据
- `query(filter)` - 查询证据
- `validateEvidenceCompleteness(subjectType, subjectId, requiredTypes)` - 验证证据完整性

## 数据表

- `ale_intents` - 意图记录
- `ale_proposals` - 变更方案
- `ale_conversations` - 会话历史
- `ale_ontology_objects` - 本体对象
- `ale_ontology_relations` - 本体关系
- `ale_flows` - 流程定义
- `ale_actions` - 动作定义
- `ale_rules` - 规则定义
- `ale_changesets` - 变更集
- `ale_gate_reports` - 门禁报告
- `ale_evidences` - 证据
- `ale_audit_logs` - 审计日志
- `ale_version_snapshots` - 版本快照
