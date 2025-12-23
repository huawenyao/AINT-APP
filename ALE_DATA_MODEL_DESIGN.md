# ALE 数据模型设计文档

## 版本信息

- **版本**: 1.0.0
- **日期**: 2024-12
- **状态**: 初始设计

## 1. 架构概述

### 1.1 双态架构原则

ALE 采用**构建态（Design Time）** 和 **运行态（Runtime）** 分离的双态架构：

```
┌─────────────────────────────────────────────────────────────────┐
│                         构建态 (Design Time)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Intent      │→ │ Proposal    │→ │ ChangeSet   │              │
│  │ 意图输入    │  │ 变更方案    │  │ 变更集      │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│         ↓                 ↓                 ↓                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ LLM Parse   │  │ Dynamic     │  │ Gate        │              │
│  │ 意图解析    │  │ Preview     │  │ Pre-Check   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Publish (发布)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         运行态 (Runtime)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Ontology    │→ │ Gate        │→ │ Execution   │              │
│  │ 本体注册表  │  │ Engine      │  │ 执行引擎    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│         ↓                 ↓                 ↓                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Collection  │  │ Evidence    │  │ Audit Log   │              │
│  │ 数据集合    │  │ 证据记录    │  │ 审计日志    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 插件架构

```
@ALE/
├── core/           # 核心类型和 Collections
├── intent-engine/  # 意图理解引擎（构建态）
├── ontology/       # 本体注册表（运行态）
├── gate-engine/    # 门禁引擎（控制面）
├── changeset/      # 变更集管理（双态桥接）
├── dynamic-view/   # 响应式动态视图（构建态）
└── runtime-ui/     # 运行态 UI 生成（运行态）
```

## 2. 核心数据表设计

### 2.1 构建态数据表

#### 2.1.1 ale_intents（意图记录表）

存储用户的自然语言输入和解析结果。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| sessionId | STRING | 会话ID，关联多轮对话 |
| input | JSON | 原始输入（IntentInput） |
| parsedIntent | JSON | 解析后的意图（ParsedIntent） |
| confidence | FLOAT | 置信度 (0-1) |
| status | STRING | pending / processed / clarification_needed / failed |
| spaceId | STRING | 所属 Space |
| createdBy | FK → users | 创建者 |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

**索引**:
- `idx_intents_session`: sessionId
- `idx_intents_space`: spaceId

#### 2.1.2 ale_proposals（变更方案表）

存储 AI 生成的变更方案。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| intentId | STRING | 关联的意图ID |
| summary | TEXT | 方案摘要 |
| version | INTEGER | 方案版本 |
| components | JSON | 方案组件（ProposalComponents） |
| previews | JSON | 预览数据（ProposalPreviews） |
| impact | JSON | 影响分析（ImpactAnalysis） |
| gatePreCheck | JSON | 门禁预检结果 |
| status | STRING | draft / confirmed / discarded |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

**索引**:
- `idx_proposals_intent`: intentId

#### 2.1.3 ale_conversations（会话历史表）

存储构建态的对话历史。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| sessionId | STRING | 会话ID（唯一） |
| title | STRING | 会话标题 |
| messages | JSON | 消息列表（ConversationMessage[]） |
| currentProposalId | STRING | 当前方案ID |
| status | STRING | active / completed / abandoned |
| spaceId | STRING | 所属 Space |
| createdBy | FK → users | 创建者 |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

### 2.2 运行态数据表

#### 2.2.1 ale_ontology_objects（本体对象表）

存储对象定义的元数据。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| collectionName | STRING | 对应 NocoBase Collection 名称（唯一） |
| displayName | STRING | 显示名称 |
| description | TEXT | 描述 |
| fields | JSON | 字段定义（FieldDefinition[]） |
| semanticTags | JSON | 语义标签 |
| evidenceSchema | JSON | 证据模式定义 |
| gateRules | JSON | 门禁规则 |
| version | STRING | 版本号 |
| status | STRING | active / deprecated / draft |
| metadata | JSON | 扩展元数据 |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

**索引**:
- `idx_objects_collection`: collectionName (UNIQUE)
- `idx_objects_status`: status
- `idx_objects_tags`: semanticTags (GIN)

#### 2.2.2 ale_ontology_relations（本体关系表）

存储对象间关系的元数据。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| name | STRING | 关系名称 |
| displayName | STRING | 显示名称 |
| sourceObject | STRING | 源对象 collectionName |
| targetObject | STRING | 目标对象 collectionName |
| relationType | STRING | belongsTo / hasOne / hasMany / belongsToMany |
| semanticType | STRING | owns / references / triggers / requires / contains |
| foreignKey | STRING | 外键字段 |
| through | STRING | 多对多中间表 |
| constraints | JSON | 约束配置 |
| version | STRING | 版本号 |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

**索引**:
- `idx_relations_source`: sourceObject
- `idx_relations_target`: targetObject

#### 2.2.3 ale_flows（流程定义表）

存储状态机/工作流定义。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| name | STRING | 流程名称（唯一） |
| displayName | STRING | 显示名称 |
| type | STRING | state-machine / workflow / approval |
| targetObject | STRING | 关联的对象 collectionName |
| states | JSON | 状态定义（StateDefinition[]） |
| transitions | JSON | 转换定义（TransitionDefinition[]） |
| initialState | STRING | 初始状态 |
| finalStates | JSON | 最终状态列表 |
| gateRequirements | JSON | 门禁要求配置 |
| version | STRING | 版本号 |
| enabled | BOOLEAN | 是否启用 |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

**索引**:
- `idx_flows_object`: targetObject
- `idx_flows_enabled`: enabled

#### 2.2.4 ale_actions（动作定义表）

存储可执行动作的定义。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| name | STRING | 动作名称（唯一） |
| displayName | STRING | 显示名称 |
| description | TEXT | 描述 |
| targetObject | STRING | 目标对象 collectionName |
| type | STRING | create / update / delete / custom / workflow |
| inputSchema | JSON | 输入参数 Schema |
| outputSchema | JSON | 输出结果 Schema |
| gates | JSON | 需要通过的门禁列表 |
| riskLevel | STRING | low / medium / high / critical |
| idempotent | BOOLEAN | 是否幂等 |
| compensation | JSON | 补偿配置 |
| audit | JSON | 审计配置 |
| version | STRING | 版本号 |
| enabled | BOOLEAN | 是否启用 |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

**索引**:
- `idx_actions_object`: targetObject
- `idx_actions_enabled`: enabled

#### 2.2.5 ale_rules（规则定义表）

存储业务规则。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| name | STRING | 规则名称（唯一） |
| displayName | STRING | 显示名称 |
| type | STRING | validation / computation / trigger / policy |
| targetObject | STRING | 目标对象 collectionName |
| condition | JSON | 触发条件 |
| actions | JSON | 执行动作 |
| priority | INTEGER | 优先级 |
| enabled | BOOLEAN | 是否启用 |
| version | STRING | 版本号 |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

### 2.3 共享数据表

#### 2.3.1 ale_changesets（变更集表）

存储变更请求。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| title | STRING | 标题 |
| description | TEXT | 描述 |
| type | STRING | schema / action / flow / view / rule / policy / config / design |
| status | STRING | draft / pending / approved / rejected / published / rolled_back |
| changes | JSON | 变更内容列表（ChangeSetChange[]） |
| proposalId | STRING | 来源方案ID |
| gateReportId | STRING | 门禁报告ID |
| gateReport | JSON | 门禁报告快照 |
| riskLevel | STRING | low / medium / high / critical |
| version | STRING | 目标版本号 |
| parentVersion | STRING | 父版本号 |
| createdBy | FK → users | 创建者 |
| approvedBy | FK → users | 批准者 |
| createdAt | DATETIME | 创建时间 |
| submittedAt | DATETIME | 提交时间 |
| approvedAt | DATETIME | 批准时间 |
| publishedAt | DATETIME | 发布时间 |
| rolledBackAt | DATETIME | 回滚时间 |

**索引**:
- `idx_changesets_status`: status
- `idx_changesets_proposal`: proposalId
- `idx_changesets_created`: createdAt

#### 2.3.2 ale_gate_reports（门禁报告表）

存储门禁评估结果。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| subjectType | STRING | 评估对象类型 |
| subjectId | STRING | 评估对象ID |
| gates | JSON | 门禁结果列表（GateResult[]） |
| passed | BOOLEAN | 是否全部通过 |
| summary | TEXT | 摘要 |
| createdAt | DATETIME | 创建时间 |

**索引**:
- `idx_gate_reports_subject`: (subjectType, subjectId)

#### 2.3.3 ale_evidences（证据表）

存储操作证据。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| type | STRING | 证据类型 |
| source | STRING | 证据来源 |
| content | JSON | 证据内容 |
| confidence | FLOAT | 置信度 |
| verified | BOOLEAN | 是否已验证 |
| relatedTo | JSON | 关联的其他证据ID |
| subjectType | STRING | 关联对象类型 |
| subjectId | STRING | 关联对象ID |
| createdBy | FK → users | 创建者 |
| createdAt | DATETIME | 创建时间 |

**索引**:
- `idx_evidences_type`: type
- `idx_evidences_subject`: (subjectType, subjectId)

#### 2.3.4 ale_audit_logs（审计日志表）

存储操作审计。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| action | STRING | 操作类型 |
| actorId | BIGINT | 操作者ID |
| actorType | STRING | user / system / agent |
| subjectType | STRING | 操作对象类型 |
| subjectId | STRING | 操作对象ID |
| data | JSON | 操作数据 |
| result | JSON | 操作结果 |
| correlationId | STRING | 关联ID（追踪链） |
| spaceId | STRING | 所属 Space |
| timestamp | DATETIME | 时间戳 |

**索引**:
- `idx_audit_action`: action
- `idx_audit_actor`: actorId
- `idx_audit_subject`: (subjectType, subjectId)
- `idx_audit_correlation`: correlationId
- `idx_audit_timestamp`: timestamp

#### 2.3.5 ale_version_snapshots（版本快照表）

存储本体版本快照。

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| version | STRING | 版本号（唯一） |
| changesetId | STRING | 关联的变更集ID |
| snapshot | JSON | 完整快照数据 |
| diff | JSON | 与上一版本的差异 |
| parentVersion | STRING | 父版本号 |
| createdBy | FK → users | 创建者 |
| createdAt | DATETIME | 创建时间 |

**索引**:
- `idx_snapshots_version`: version (UNIQUE)
- `idx_snapshots_parent`: parentVersion

## 3. 核心类型定义

### 3.1 意图类型

```typescript
interface IntentInput {
  type: 'text' | 'voice' | 'multimodal';
  content: string;
  attachments?: Attachment[];
  context?: DesignContext;
}

interface ParsedIntent {
  id: UUID;
  category: 'create' | 'modify' | 'delete' | 'query' | 'analyze' | 'automate';
  subjects: IntentSubject[];
  actions: IntentAction[];
  constraints: IntentConstraint[];
  confidence: number;
  clarifications?: ClarificationRequest[];
  rawInput: string;
  createdAt: Timestamp;
}
```

### 3.2 本体类型

```typescript
interface ObjectDefinition {
  id: UUID;
  collectionName: string;
  displayName: string;
  description?: string;
  fields: FieldDefinition[];
  semanticTags: string[];
  evidenceSchema?: Record<string, unknown>;
  gateRules?: GateRule[];
  version: string;
  status: 'active' | 'deprecated' | 'draft';
}

interface FieldDefinition {
  name: string;
  displayName: string;
  type: FieldType;
  required: boolean;
  unique?: boolean;
  defaultValue?: unknown;
  validations?: ValidationRule[];
  options?: FieldOption[];
  relation?: RelationConfig;
  uiConfig?: FieldUIConfig;
  semanticTags?: string[];
}
```

### 3.3 门禁类型

```typescript
enum GateType {
  G1_STRUCTURAL = 'G1_STRUCTURAL',   // 结构门禁
  G2_SEMANTIC = 'G2_SEMANTIC',       // 语义门禁
  G3_EVIDENCE = 'G3_EVIDENCE',       // 证据门禁
  G4_PERMISSION = 'G4_PERMISSION',   // 权限门禁
  G5_FLOW = 'G5_FLOW',               // 流程门禁
  G6_EXECUTION = 'G6_EXECUTION',     // 执行门禁
  G7_EVALUATION = 'G7_EVALUATION',   // 评估门禁
}

interface GateResult {
  gate: string;
  passed: boolean;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  details?: Record<string, unknown>;
  timestamp: Timestamp;
}
```

### 3.4 变更集类型

```typescript
interface ChangeSet {
  id: UUID;
  title: string;
  description?: string;
  type: ChangeSetType;
  status: ChangeSetStatus;
  changes: ChangeSetChange[];
  proposalId?: UUID;
  gateReport?: GateReport;
  riskLevel: RiskLevel;
  version?: string;
  parentVersion?: string;
  createdBy: number;
  createdAt: Timestamp;
}

interface ChangeSetChange {
  id: UUID;
  action: 'create' | 'update' | 'delete';
  type: 'object' | 'relation' | 'flow' | 'view' | 'rule' | 'action';
  target: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}
```

## 4. 插件 API 设计

### 4.1 意图引擎 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/ale_intent:parse` | POST | 解析意图 |
| `/api/ale_intent:clarify` | POST | 澄清意图 |
| `/api/ale_intent:generateProposal` | POST | 生成方案 |
| `/api/ale_intent:iterateProposal` | POST | 迭代方案 |
| `/api/ale_intent:confirmProposal` | POST | 确认方案 |

### 4.2 本体管理 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/ale_ontology:export` | GET | 导出完整本体 |
| `/api/ale_ontology:import` | POST | 导入本体 |
| `/api/ale_ontology:registerObject` | POST | 注册对象 |
| `/api/ale_ontology:getObject` | GET | 获取对象 |
| `/api/ale_ontology:getObjectFull` | GET | 获取对象完整信息 |
| `/api/ale_ontology:syncCollection` | POST | 同步到 Collection |

### 4.3 门禁引擎 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/ale_gate:execute` | POST | 执行门禁检查 |
| `/api/ale_gate:preCheck` | POST | 执行预检 |
| `/api/ale_gate:list` | GET | 获取所有门禁 |
| `/api/ale_gate:enable` | POST | 启用门禁 |
| `/api/ale_gate:disable` | POST | 禁用门禁 |
| `/api/ale_gate:getReport` | GET | 获取门禁报告 |

### 4.4 变更集 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/ale_changeset:createFromProposal` | POST | 从方案创建变更集 |
| `/api/ale_changeset:create` | POST | 创建变更集 |
| `/api/ale_changeset:submit` | POST | 提交审批 |
| `/api/ale_changeset:approve` | POST | 批准 |
| `/api/ale_changeset:reject` | POST | 拒绝 |
| `/api/ale_changeset:publish` | POST | 发布 |
| `/api/ale_changeset:rollback` | POST | 回滚 |
| `/api/ale_changeset:versions` | GET | 版本历史 |

### 4.5 动态视图 API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/ale_view:generatePreviews` | POST | 生成方案预览 |
| `/api/ale_view:generateSchemaGraph` | POST | 生成 Schema 图 |
| `/api/ale_view:generateStateMachineGraph` | POST | 生成状态机图 |
| `/api/ale_view:generateUISchema` | POST | 生成 UI Schema |
| `/api/ale_view:getOntologyView` | GET | 获取本体视图配置 |

### 4.6 运行态 UI API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/ale_runtime_ui:generate` | POST | 生成 UI 配置 |
| `/api/ale_runtime_ui:registerCollection` | POST | 注册 Collection |
| `/api/ale_runtime_ui:getListSchema` | GET | 获取列表 Schema |
| `/api/ale_runtime_ui:getFormSchema` | GET | 获取表单 Schema |
| `/api/ale_runtime_ui:generateAll` | POST | 批量生成所有本体 UI |

## 5. 数据流程

### 5.1 构建态流程

```
1. 用户输入自然语言意图
   └─► IntentParser 解析意图
       └─► ParsedIntent (存储到 ale_intents)

2. 意图确认后生成方案
   └─► ProposalGenerator 生成方案
       └─► ChangeProposal (存储到 ale_proposals)
           ├─► 生成 Schema 预览
           ├─► 生成状态机预览
           └─► 执行门禁预检

3. 方案确认后生成变更集
   └─► ChangeSetService 生成变更集
       └─► ChangeSet (存储到 ale_changesets)

4. 变更集审批
   └─► submit → pending → approve/reject
       └─► 通过后状态变为 approved

5. 变更集发布
   └─► publish → 应用变更到本体表
       ├─► 更新 ale_ontology_objects
       ├─► 更新 ale_ontology_relations
       ├─► 更新 ale_flows
       └─► 创建版本快照 ale_version_snapshots
```

### 5.2 运行态流程

```
1. 请求执行操作
   └─► GateEngine 执行门禁链
       ├─► G1: 结构门禁 (Schema 验证)
       ├─► G3: 证据门禁 (证据验证)
       ├─► G6: 执行门禁 (前置条件)
       └─► 生成 GateReport

2. 门禁通过后执行操作
   └─► 创建/更新/删除数据
       └─► 记录审计日志 (ale_audit_logs)

3. 执行后评估
   └─► G7: 评估门禁 (效果验证)
       └─► 更新 GateReport

4. UI 自动生成
   └─► RuntimeUIGenerator 从本体生成
       ├─► Collection 定义
       ├─► List Schema
       ├─► Form Schema
       └─► Detail Schema
```

## 6. 安全与治理

### 6.1 权限控制

所有 ALE 插件通过 NocoBase ACL 系统控制权限：

```typescript
// 权限片段注册示例
this.app.acl.registerSnippet({
  name: 'pm.ale-core',
  actions: [
    'ale_intents:*',
    'ale_proposals:*',
    'ale_ontology_objects:*',
    'ale_changesets:*',
    'ale_audit_logs:list,get',  // 审计日志只读
  ],
});
```

### 6.2 审计追踪

所有操作通过 `ale_audit_logs` 表记录：

- **correlationId**: 用于追踪完整操作链
- **actorType**: 区分用户/系统/Agent 操作
- **spaceId**: 支持多租户隔离

### 6.3 版本控制

通过 `ale_version_snapshots` 表实现本体版本控制：

- 每次 ChangeSet 发布创建新版本快照
- 支持版本比较和回滚
- 使用语义化版本号 (SemVer)

## 7. 扩展点

### 7.1 自定义门禁

继承 `BaseGate` 类实现自定义门禁：

```typescript
class CustomGate extends BaseGate {
  isApplicable(context: GateContext): boolean {
    return context.action === 'custom_action';
  }

  async check(context: GateContext): Promise<GateResult> {
    // 自定义检查逻辑
    return this.createPassResult('检查通过');
  }

  getDescription(): string {
    return '自定义门禁描述';
  }
}
```

### 7.2 自定义 LLM Provider

实现 `LLMProvider` 接口接入不同的 LLM：

```typescript
class CustomLLMProvider implements LLMProvider {
  async complete(prompt: string, options?: LLMOptions): Promise<string> {
    // 调用自定义 LLM
  }

  async parseJSON<T>(prompt: string, options?: LLMOptions): Promise<T> {
    // JSON 解析调用
  }
}
```

### 7.3 自定义视图组件

通过 NocoBase 组件扩展机制添加自定义视图：

```typescript
// 注册自定义预览组件
registerComponent('StateFlowGraph', StateFlowGraphComponent);
registerComponent('ERDiagram', ERDiagramComponent);
```

## 8. 附录

### 8.1 完整 ER 图

```
┌────────────────────┐     ┌────────────────────┐
│   ale_intents      │     │   ale_proposals    │
├────────────────────┤     ├────────────────────┤
│ id (PK)            │────▶│ id (PK)            │
│ sessionId          │     │ intentId (FK)      │
│ input (JSON)       │     │ components (JSON)  │
│ parsedIntent(JSON) │     │ previews (JSON)    │
│ confidence         │     │ impact (JSON)      │
│ status             │     │ status             │
└────────────────────┘     └─────────┬──────────┘
                                     │
                                     ▼
┌────────────────────┐     ┌────────────────────┐
│   ale_changesets   │◀────│   ale_proposals    │
├────────────────────┤     └────────────────────┘
│ id (PK)            │
│ proposalId (FK)    │     ┌────────────────────┐
│ changes (JSON)     │────▶│ale_version_snapshots│
│ status             │     ├────────────────────┤
│ version            │     │ id (PK)            │
│ gateReport (JSON)  │     │ version            │
└─────────┬──────────┘     │ changesetId (FK)   │
          │                │ snapshot (JSON)    │
          ▼                └────────────────────┘
┌────────────────────┐
│ale_ontology_objects│     ┌────────────────────┐
├────────────────────┤     │ale_ontology_relations│
│ id (PK)            │◀───▶├────────────────────┤
│ collectionName     │     │ id (PK)            │
│ fields (JSON)      │     │ sourceObject (FK)  │
│ gateRules (JSON)   │     │ targetObject (FK)  │
│ version            │     │ relationType       │
└─────────┬──────────┘     └────────────────────┘
          │
          ▼
┌────────────────────┐     ┌────────────────────┐
│    ale_flows       │     │    ale_actions     │
├────────────────────┤     ├────────────────────┤
│ id (PK)            │     │ id (PK)            │
│ targetObject (FK)  │     │ targetObject (FK)  │
│ states (JSON)      │     │ inputSchema (JSON) │
│ transitions (JSON) │     │ gates (JSON)       │
└────────────────────┘     └────────────────────┘
```

### 8.2 状态转换图

**ChangeSet 状态**:
```
draft → pending → approved → published
                     ↓            ↓
                 rejected    rolled_back
```

**Proposal 状态**:
```
draft → confirmed
   ↓
discarded
```

**Intent 状态**:
```
pending → processed
    ↓
clarification_needed → processed
    ↓
  failed
```
