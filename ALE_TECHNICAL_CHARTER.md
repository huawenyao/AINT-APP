# AIPOS ALE 技术宪章

> **Agentic Low-code Engineering Platform - Technical Charter**  
> 版本：1.0 | 生效日期：2025年12月  
> 基座平台：NocoBase 1.8.31

---

## 第一章：架构愿景

### 1.1 架构目标

构建**双态分离 + 控制面/执行面分离**的企业级 ALE 平台，实现：
- **构建态 AI 原生**：意图理解 + 响应式动态视图，彻底重构 NocoBase 交互模式
- **运行态本体驱动**：确定性执行 + 门禁保障
- **语义可控**：本体驱动的业务逻辑控制
- **执行可信**：门禁保障的可审计执行
- **扩展可持续**：插件化的能力演进

### 1.2 核心架构范式：双态分离

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          双态架构核心                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    构建态 (Design Time)                          │   │
│  │                    「AI 原生交互层」                              │   │
│  │                                                                  │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐     │   │
│  │  │  意图理解引擎   │  │ 响应式视图引擎  │  │ ChangeSet生成器│     │   │
│  │  │  Intent Engine │  │ Dynamic View   │  │  CS Generator  │     │   │
│  │  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘     │   │
│  │          │                   │                   │               │   │
│  │          └───────────────────┼───────────────────┘               │   │
│  │                              ▼                                    │   │
│  │                    ┌────────────────┐                            │   │
│  │                    │   ChangeSet    │                            │   │
│  │                    │   (待发布变更)  │                            │   │
│  │                    └────────┬───────┘                            │   │
│  └─────────────────────────────┼────────────────────────────────────┘   │
│                                │ 发布（经门禁审批）                      │
│                                ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    运行态 (Runtime)                              │   │
│  │                    「本体驱动执行层」                             │   │
│  │                                                                  │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐     │   │
│  │  │  本体注册表    │  │   门禁引擎     │  │  动作执行器    │     │   │
│  │  │  Ontology Reg  │  │  Gate Engine   │  │ Action Executor│     │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘     │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐     │   │
│  │  │  UI 生成器     │  │  事件总线     │  │  证据存储      │     │   │
│  │  │  UI Generator  │  │  Event Bus    │  │ Evidence Store │     │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**关键区分**：
| 维度 | 构建态 | 运行态 |
|-----|-------|-------|
| **交互模式** | 自然语言 + 动态视图 | 结构化 API + 生成式 UI |
| **核心引擎** | 意图理解引擎 (LLM) | 门禁引擎 (规则) |
| **输出产物** | ChangeSet | Event + Evidence |
| **性能要求** | 可接受延迟 | 低延迟必须 |
| **确定性** | 探索性、迭代性 | 确定性、可重放 |

### 1.2 架构全景

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           接入层 (Access Layer)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Web UI     │  │  REST API   │  │  GraphQL    │  │  Agent API  │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────────────────────────────────────────┐
│                      控制面 (Semantic Control Plane)                     │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌─────────────┐ │
│  │   Ontology    │ │   Behavior    │ │    Policy     │ │  ChangeSet  │ │
│  │   Registry    │ │   Registry    │ │    Engine     │ │   Service   │ │
│  └───────────────┘ └───────────────┘ └───────────────┘ └─────────────┘ │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐                 │
│  │  Gate Engine  │ │ Eval Engine   │ │   Evidence    │                 │
│  │   (G1-G7)     │ │     (G7)      │ │    Store      │                 │
│  └───────────────┘ └───────────────┘ └───────────────┘                 │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────────────────────────────────────────┐
│                       执行面 (Execution Plane)                           │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌─────────────┐ │
│  │  Connectors   │ │   Kinetic     │ │     Tool      │ │  Workflow   │ │
│  │               │ │   Runtime     │ │   Runtime     │ │   Runtime   │ │
│  └───────────────┘ └───────────────┘ └───────────────┘ └─────────────┘ │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐                 │
│  │  Event Bus    │ │  Writeback    │ │ Observability │                 │
│  │               │ │   Gateway     │ │               │                 │
│  └───────────────┘ └───────────────┘ └───────────────┘                 │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────────────────────────────────────────┐
│                        基础设施层 (Infrastructure)                        │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌─────────────┐ │
│  │  PostgreSQL   │ │    Redis      │ │    Vector     │ │   Object    │ │
│  │   (Primary)   │ │ (Cache/Queue) │ │    Store      │ │   Storage   │ │
│  └───────────────┘ └───────────────┘ └───────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 第二章：核心技术原则

### 2.1 架构原则

#### 原则 0：构建态与运行态分离（最高优先级）

```typescript
// ✅ 构建态：AI 原生交互
class DesignTimeStudio {
  private intentEngine: IntentUnderstandingEngine;
  private dynamicViewEngine: DynamicViewEngine;
  private changeSetGenerator: ChangeSetGenerator;

  // 用户自然语言输入
  async handleUserIntent(input: string, context: DesignContext): Promise<DesignResponse> {
    // 1. 意图理解
    const intent = await this.intentEngine.parse(input, context);
    
    // 2. 生成变更方案
    const proposal = await this.intentEngine.generateProposal(intent);
    
    // 3. 更新动态视图（响应式）
    const view = await this.dynamicViewEngine.update(proposal);
    
    // 4. 返回预览（用户可继续迭代）
    return { intent, proposal, view };
  }

  // 用户确认后生成 ChangeSet
  async confirmAndGenerateChangeSet(proposal: ChangeProposal): Promise<ChangeSet> {
    return this.changeSetGenerator.fromProposal(proposal);
  }
}

// ✅ 运行态：本体驱动执行
class RuntimeExecutor {
  private ontologyRegistry: OntologyRegistry;
  private gateEngine: GateEngine;
  private actionExecutor: ActionExecutor;

  // 结构化 API 调用
  async execute(action: string, params: any, context: RuntimeContext): Promise<ActionResult> {
    // 1. 从本体获取动作定义
    const actionDef = await this.ontologyRegistry.getAction(action);
    
    // 2. 门禁检查
    const gateResult = await this.gateEngine.evaluate(params, actionDef.gates);
    if (!gateResult.passed) {
      throw new GateBlockedError(gateResult);
    }
    
    // 3. 执行动作
    const result = await this.actionExecutor.execute(actionDef, params);
    
    // 4. 记录证据
    await this.recordEvidence(action, params, result);
    
    return result;
  }
}

// ❌ 禁止：运行态直接修改本体
class RuntimeExecutor {
  async modifyOntology(changes: any) {
    // 这是错误的！运行态不能直接修改本体
    await this.ontologyRegistry.update(changes); // 禁止！
  }
}
```

#### 原则 1：控制面与执行面分离

```typescript
// ✅ 正确：控制面定义策略，执行面消费策略
class ActionExecutor {
  async execute(action: Action, params: any) {
    // 1. 从控制面获取策略
    const policy = await this.controlPlane.getActionPolicy(action.name);
    
    // 2. 从控制面获取门禁要求
    const gates = await this.controlPlane.getRequiredGates(action.name);
    
    // 3. 执行门禁检查
    const gateResult = await this.gateEngine.evaluate(params, gates);
    if (!gateResult.passed) {
      throw new GateBlockedError(gateResult);
    }
    
    // 4. 执行动作
    return await this.executionPlane.run(action, params);
  }
}

// ❌ 错误：执行面直接包含业务规则
class ActionExecutor {
  async execute(action: Action, params: any) {
    // 硬编码的业务规则
    if (params.amount > 10000) {
      throw new Error('Amount too large');
    }
    return await this.run(action, params);
  }
}
```

#### 原则 2：本体驱动（Schema-First）

```typescript
// ✅ 正确：从本体派生 API 和 UI
const ontologyObject = await ontology.getObject('disposal_orders');

// API 自动生成
const apiRoutes = generateAPIFromOntology(ontologyObject);

// UI Schema 自动生成
const uiSchema = generateUIFromOntology(ontologyObject);

// 验证规则自动生成
const validators = generateValidatorsFromOntology(ontologyObject);

// ❌ 错误：独立定义，与本体脱节
const apiRoutes = {
  '/disposal-orders': { /* 手动定义 */ }
};
```

#### 原则 3：门禁前置（Gate-Before-Execute）

```typescript
// ✅ 正确：门禁检查在执行之前
async function handleAction(ctx: Context) {
  // 1. 先检查门禁
  const gateResult = await gateEngine.evaluate(ctx, requiredGates);
  
  // 2. 记录门禁结果
  await auditLog.record('gate_check', gateResult);
  
  // 3. 门禁通过才执行
  if (gateResult.passed) {
    return await executeAction(ctx);
  } else {
    return handleGateFailure(gateResult);
  }
}

// ❌ 错误：先执行后检查或不检查
async function handleAction(ctx: Context) {
  const result = await executeAction(ctx);
  // 执行后才检查，已经晚了
  await gateEngine.evaluate(ctx, requiredGates);
  return result;
}
```

#### 原则 4：证据链完整（Evidence Chain）

```typescript
// ✅ 正确：每个操作都产生并关联证据
async function processDisposal(order: DisposalOrder) {
  // 1. 记录输入证据
  const inputEvidence = await evidence.record({
    type: 'input',
    source: 'system',
    data: order,
    timestamp: new Date(),
  });
  
  // 2. 执行处理
  const result = await process(order);
  
  // 3. 记录输出证据，关联输入
  const outputEvidence = await evidence.record({
    type: 'output',
    source: 'processor',
    data: result,
    relatedTo: [inputEvidence.id],
    timestamp: new Date(),
  });
  
  // 4. 更新对象，关联证据
  await updateOrder(order.id, {
    evidences: [inputEvidence.id, outputEvidence.id]
  });
}
```

#### 原则 5：变更原子化（Atomic Changes）

```typescript
// ✅ 正确：通过 ChangeSet 管理变更
async function updateOntologyObject(spec: UpdateSpec) {
  // 1. 创建 ChangeSet
  const changeset = await changeSetService.create({
    type: 'schema',
    changes: spec,
  });
  
  // 2. 提交门禁评估
  const submitResult = await changeSetService.submit(changeset.id);
  
  // 3. 等待审批
  if (submitResult.needsApproval) {
    await changeSetService.waitForApproval(changeset.id);
  }
  
  // 4. 发布变更
  await changeSetService.publish(changeset.id);
}

// ❌ 错误：直接修改
async function updateOntologyObject(spec: UpdateSpec) {
  await db.collection('objects').update(spec);
}
```

### 2.2 编码规范

#### 2.2.1 TypeScript 规范

```typescript
// 1. 强类型定义，禁止 any（除非明确标注原因）
interface GateResult {
  gate: string;
  passed: boolean;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  details?: Record<string, unknown>;  // 使用 unknown 替代 any
}

// 2. 使用 Result 模式处理错误
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

async function executeAction(params: ActionParams): Promise<Result<ActionResult, ActionError>> {
  try {
    const result = await doExecute(params);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}

// 3. 使用 Zod 进行运行时验证
import { z } from 'zod';

const DisposalOrderSchema = z.object({
  id: z.string().uuid(),
  orderNo: z.string().min(1),
  status: z.enum(['pending', 'assigned', 'approved', 'resolved']),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
});

type DisposalOrder = z.infer<typeof DisposalOrderSchema>;

// 4. 使用命名导出
export { GateEngine } from './gate-engine';
export type { GateResult, GateContext } from './types';
```

#### 2.2.2 命名规范

```typescript
// 文件命名：kebab-case
// gate-engine.ts, ontology-registry.ts, disposal-order.ts

// 类命名：PascalCase
class GateEngine {}
class OntologyRegistry {}

// 接口命名：PascalCase，不使用 I 前缀
interface GateResult {}  // ✅
interface IGateResult {} // ❌

// 函数/方法命名：camelCase
function evaluateGate() {}
async function createChangeSet() {}

// 常量命名：SCREAMING_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const DEFAULT_GATE_TIMEOUT = 5000;

// 枚举命名：PascalCase + SCREAMING_SNAKE_CASE 值
enum GateSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}
```

#### 2.2.3 目录结构规范

```
packages/plugins/@ale/{plugin-name}/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                 # 主入口
│   ├── server/                  # 服务端代码
│   │   ├── index.ts
│   │   ├── plugin.ts            # 插件定义
│   │   ├── collections/         # 数据模型
│   │   │   └── *.ts
│   │   ├── services/            # 业务服务
│   │   │   └── *.ts
│   │   ├── actions/             # Action 处理器
│   │   │   └── *.ts
│   │   ├── middlewares/         # 中间件
│   │   │   └── *.ts
│   │   └── types.ts             # 类型定义
│   └── client/                  # 客户端代码
│       ├── index.ts
│       ├── components/          # React 组件
│       │   └── *.tsx
│       ├── hooks/               # React Hooks
│       │   └── *.ts
│       └── types.ts
├── __tests__/                   # 测试文件
│   ├── unit/
│   └── integration/
└── README.md
```

### 2.3 数据库规范

#### 2.3.1 表命名规范

```sql
-- ALE 系统表：使用 ale_ 前缀
CREATE TABLE ale_ontology_objects (...);
CREATE TABLE ale_changesets (...);
CREATE TABLE ale_gate_reports (...);
CREATE TABLE ale_audit_logs (...);

-- 业务场景表：使用场景前缀
CREATE TABLE disposal_orders (...);
CREATE TABLE disposal_evidences (...);
CREATE TABLE disposal_events (...);
```

#### 2.3.2 字段规范

```sql
-- 必备字段
id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

-- 审计字段（视需要）
created_by  BIGINT REFERENCES users(id),
updated_by  BIGINT REFERENCES users(id),

-- 软删除（可选）
deleted_at  TIMESTAMPTZ,

-- 版本控制（可选）
version     INTEGER NOT NULL DEFAULT 1,
```

#### 2.3.3 索引规范

```sql
-- 主键索引：自动创建
-- 外键索引：必须创建
CREATE INDEX idx_disposal_orders_assigned_to ON disposal_orders(assigned_to);

-- 查询优化索引：按需创建
CREATE INDEX idx_disposal_orders_status_created ON disposal_orders(status, created_at DESC);

-- 组合索引：高选择性字段在前
CREATE INDEX idx_ale_audit_logs_subject ON ale_audit_logs(subject_type, subject_id, timestamp DESC);
```

---

## 第三章：技术选型

### 3.1 技术栈

| 层级 | 技术 | 版本 | 选型理由 |
|-----|-----|-----|---------|
| **基座平台** | NocoBase | 1.8.31 | 成熟的低代码平台，插件化架构 |
| **运行时** | Node.js | ≥18.x | NocoBase 要求，LTS 版本 |
| **语言** | TypeScript | ≥5.0 | 类型安全，开发效率 |
| **Web 框架** | Koa.js | (NocoBase 内置) | 中间件模式，轻量灵活 |
| **ORM** | Sequelize | (NocoBase 内置) | 多数据库支持 |
| **前端框架** | React | 18.x | NocoBase 内置 |
| **UI 组件** | Ant Design | 5.x | NocoBase 内置 |
| **主数据库** | PostgreSQL | ≥16.x | 强事务、JSONB、向量扩展 |
| **缓存/队列** | Redis | ≥7.x | 高性能，Streams 支持 |
| **向量存储** | pgvector | ≥0.5 | 与 PostgreSQL 统一 |
| **Schema 验证** | Zod / AJV | latest | 运行时类型安全 |
| **测试框架** | Vitest | latest | 快速，兼容 Jest API |

### 3.2 依赖管理

```json
// package.json 依赖约束
{
  "engines": {
    "node": ">=18.0.0"
  },
  "peerDependencies": {
    "@nocobase/server": "1.8.x",
    "@nocobase/database": "1.8.x",
    "@nocobase/client": "1.8.x"
  },
  "dependencies": {
    "zod": "^3.22.0",
    "uuid": "^9.0.0",
    "lodash-es": "^4.17.21"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0"
  }
}
```

### 3.3 版本兼容策略

```
┌─────────────────────────────────────────────────────────────┐
│                    版本兼容矩阵                              │
├───────────────┬─────────────────────────────────────────────┤
│ ALE Version   │ NocoBase Version │ Node.js │ PostgreSQL    │
├───────────────┼──────────────────┼─────────┼───────────────┤
│ 0.1.x (MVP)   │ 1.8.31           │ 18.x    │ 16.x          │
│ 0.2.x (P1)    │ 1.8.x - 1.9.x    │ 18.x    │ 16.x          │
│ 1.0.x (GA)    │ 1.9.x - 2.0.x    │ 20.x    │ 16.x - 17.x   │
└───────────────┴──────────────────┴─────────┴───────────────┘
```

---

## 第四章：API 设计规范

### 4.1 RESTful API 规范

```typescript
// 资源命名：复数形式
GET    /api/ale/changesets              // 列表
POST   /api/ale/changesets              // 创建
GET    /api/ale/changesets/:id          // 详情
PUT    /api/ale/changesets/:id          // 更新
DELETE /api/ale/changesets/:id          // 删除

// 动作型 API：使用动词
POST   /api/ale/changesets/:id/submit   // 提交
POST   /api/ale/changesets/:id/approve  // 审批
POST   /api/ale/changesets/:id/publish  // 发布
POST   /api/ale/changesets/:id/rollback // 回滚

// 查询参数
GET    /api/ale/changesets?status=pending&page=1&pageSize=20
GET    /api/ale/changesets?filter[status]=pending&sort=-created_at
```

### 4.2 响应格式

```typescript
// 成功响应
interface SuccessResponse<T> {
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
  };
}

// 错误响应
interface ErrorResponse {
  error: {
    code: string;           // 错误码：ALE_GATE_BLOCKED
    message: string;        // 用户友好消息
    details?: unknown;      // 详细信息
    traceId?: string;       // 追踪 ID
  };
}

// 门禁失败响应
interface GateBlockedResponse {
  error: {
    code: 'ALE_GATE_BLOCKED';
    message: string;
    details: {
      gateReport: GateReport;
      failedGates: string[];
      suggestions: string[];
    };
  };
}
```

### 4.3 错误码规范

```typescript
// 错误码前缀
const ERROR_PREFIXES = {
  ALE: 'ALE',           // ALE 通用错误
  GATE: 'GATE',         // 门禁相关
  ONTOLOGY: 'ONTO',     // 本体相关
  CHANGESET: 'CS',      // 变更集相关
  EVIDENCE: 'EV',       // 证据相关
};

// 错误码定义
enum ALEErrorCode {
  // 门禁错误 (GATE_xxx)
  GATE_BLOCKED = 'GATE_BLOCKED',
  GATE_TIMEOUT = 'GATE_TIMEOUT',
  GATE_NOT_FOUND = 'GATE_NOT_FOUND',
  
  // 变更集错误 (CS_xxx)
  CS_NOT_FOUND = 'CS_NOT_FOUND',
  CS_INVALID_STATUS = 'CS_INVALID_STATUS',
  CS_CONFLICT = 'CS_CONFLICT',
  
  // 本体错误 (ONTO_xxx)
  ONTO_OBJECT_NOT_FOUND = 'ONTO_OBJECT_NOT_FOUND',
  ONTO_VALIDATION_FAILED = 'ONTO_VALIDATION_FAILED',
  
  // 证据错误 (EV_xxx)
  EV_INSUFFICIENT = 'EV_INSUFFICIENT',
  EV_INVALID = 'EV_INVALID',
}
```

---

## 第五章：安全规范

### 5.1 认证与授权

```typescript
// 1. 所有 ALE API 必须经过认证
app.use('/api/ale/*', authMiddleware);

// 2. 基于角色的访问控制
const rolePermissions = {
  'ale:admin': ['ontology:*', 'changeset:*', 'gate:*'],
  'ale:operator': ['ontology:read', 'changeset:create', 'changeset:submit'],
  'ale:approver': ['changeset:read', 'changeset:approve'],
  'ale:viewer': ['ontology:read', 'changeset:read', 'gate:read'],
};

// 3. 资源级权限检查
async function checkPermission(ctx: Context, resource: string, action: string) {
  const user = ctx.state.currentUser;
  const space = ctx.state.ale?.spaceId;
  
  // 检查用户在当前 Space 的权限
  const allowed = await acl.check(user, space, resource, action);
  if (!allowed) {
    throw new ForbiddenError(`No permission: ${resource}:${action}`);
  }
}
```

### 5.2 数据安全

```typescript
// 1. 敏感字段加密存储
const sensitiveFields = ['ssn', 'credit_card', 'password'];

// 2. 日志脱敏
function sanitizeForLog(data: any): any {
  const sanitized = { ...data };
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }
  return sanitized;
}

// 3. SQL 注入防护（使用参数化查询）
// ✅ 正确
await db.query('SELECT * FROM orders WHERE id = $1', [orderId]);

// ❌ 错误
await db.query(`SELECT * FROM orders WHERE id = '${orderId}'`);
```

### 5.3 审计要求

```typescript
// 必须审计的操作
const AUDITABLE_OPERATIONS = [
  'ontology:create',
  'ontology:update',
  'ontology:delete',
  'changeset:submit',
  'changeset:approve',
  'changeset:publish',
  'changeset:rollback',
  'gate:override',
  'action:execute',
];

// 审计日志结构
interface AuditEntry {
  timestamp: Date;
  actor: {
    id: number;
    type: 'user' | 'system' | 'agent';
    roles: string[];
  };
  action: string;
  resource: {
    type: string;
    id: string;
  };
  context: {
    spaceId?: string;
    correlationId: string;
    ip?: string;
    userAgent?: string;
  };
  before?: any;  // 变更前状态
  after?: any;   // 变更后状态
  result: 'success' | 'failure';
  error?: string;
}
```

---

## 第六章：性能规范

### 6.1 性能目标

| 指标 | 目标值 | 测量方式 |
|-----|-------|---------|
| API 响应时间 (P50) | ≤100ms | APM 监控 |
| API 响应时间 (P99) | ≤500ms | APM 监控 |
| 门禁评估延迟 | ≤200ms | 门禁日志 |
| 数据库查询 | ≤50ms (P99) | 慢查询日志 |
| 页面加载时间 | ≤2s | 前端监控 |

### 6.2 性能优化策略

```typescript
// 1. 门禁缓存
class GateCache {
  private cache: LRUCache<string, GateResult>;
  private ttl = 60 * 1000; // 1 分钟
  
  async getOrEvaluate(key: string, evaluator: () => Promise<GateResult>): Promise<GateResult> {
    const cached = this.cache.get(key);
    if (cached) return cached;
    
    const result = await evaluator();
    this.cache.set(key, result, this.ttl);
    return result;
  }
}

// 2. 并行门禁评估
async function evaluateGatesParallel(gates: string[], context: GateContext) {
  // 识别独立门禁
  const independentGates = gates.filter(g => !hasGateDependency(g));
  const dependentGates = gates.filter(g => hasGateDependency(g));
  
  // 并行评估独立门禁
  const parallelResults = await Promise.all(
    independentGates.map(g => evaluateGate(g, context))
  );
  
  // 串行评估依赖门禁
  const serialResults = [];
  for (const gate of dependentGates) {
    serialResults.push(await evaluateGate(gate, context));
  }
  
  return [...parallelResults, ...serialResults];
}

// 3. 数据库连接池配置
const dbConfig = {
  pool: {
    max: 20,
    min: 5,
    idle: 10000,
    acquire: 30000,
  },
};

// 4. 查询优化：使用索引提示
const orders = await DisposalOrder.findAll({
  where: { status: 'pending' },
  order: [['created_at', 'DESC']],
  limit: 100,
  // 使用覆盖索引
  attributes: ['id', 'order_no', 'status', 'created_at'],
});
```

### 6.3 限流策略

```typescript
// API 限流配置
const rateLimits = {
  // 全局限流
  global: {
    windowMs: 60 * 1000,
    max: 1000,
  },
  // 门禁评估限流
  gate: {
    windowMs: 60 * 1000,
    max: 100,
  },
  // ChangeSet 提交限流
  changeset: {
    windowMs: 60 * 1000,
    max: 10,
  },
};
```

---

## 第七章：可观测性规范

### 7.1 日志规范

```typescript
// 日志级别定义
enum LogLevel {
  DEBUG = 'debug',  // 开发调试
  INFO = 'info',    // 正常操作
  WARN = 'warn',    // 警告但不影响功能
  ERROR = 'error',  // 错误需要处理
}

// 结构化日志格式
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: {
    correlationId: string;
    spaceId?: string;
    userId?: number;
    action?: string;
  };
  data?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// 日志使用示例
logger.info('ChangeSet submitted', {
  context: { correlationId, spaceId, userId },
  data: { changesetId, type, status },
});

logger.error('Gate evaluation failed', {
  context: { correlationId },
  data: { gate: 'G3_EVIDENCE', subject },
  error: { name: error.name, message: error.message },
});
```

### 7.2 指标规范

```typescript
// Prometheus 指标定义
const metrics = {
  // 计数器
  ale_gate_evaluations_total: new Counter({
    name: 'ale_gate_evaluations_total',
    help: 'Total gate evaluations',
    labelNames: ['gate', 'result', 'space'],
  }),
  
  // 直方图
  ale_gate_duration_seconds: new Histogram({
    name: 'ale_gate_duration_seconds',
    help: 'Gate evaluation duration',
    labelNames: ['gate'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  }),
  
  // 仪表盘
  ale_changesets_pending: new Gauge({
    name: 'ale_changesets_pending',
    help: 'Number of pending changesets',
    labelNames: ['space', 'type'],
  }),
};

// 使用示例
const timer = metrics.ale_gate_duration_seconds.startTimer({ gate: 'G1_STRUCTURAL' });
try {
  const result = await evaluateGate(context);
  metrics.ale_gate_evaluations_total.inc({ gate: 'G1_STRUCTURAL', result: result.passed ? 'pass' : 'fail' });
} finally {
  timer();
}
```

### 7.3 链路追踪

```typescript
// 追踪上下文传播
interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
}

// 中间件注入追踪
app.use(async (ctx, next) => {
  const traceId = ctx.headers['x-trace-id'] || generateTraceId();
  const spanId = generateSpanId();
  
  ctx.state.trace = { traceId, spanId };
  ctx.set('x-trace-id', traceId);
  
  const span = tracer.startSpan('http.request', {
    attributes: {
      'http.method': ctx.method,
      'http.url': ctx.url,
      'ale.space': ctx.state.ale?.spaceId,
    },
  });
  
  try {
    await next();
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    throw error;
  } finally {
    span.end();
  }
});
```

---

## 第八章：测试规范

### 8.1 测试金字塔

```
                    ┌─────────────────┐
                    │    E2E Tests    │  10%
                    │   (Playwright)  │
                    └────────┬────────┘
                             │
               ┌─────────────┴─────────────┐
               │    Integration Tests      │  30%
               │     (API + Database)      │
               └────────────┬──────────────┘
                            │
          ┌─────────────────┴─────────────────┐
          │           Unit Tests              │  60%
          │    (Services, Gates, Utils)       │
          └───────────────────────────────────┘
```

### 8.2 测试覆盖率要求

| 代码类型 | 覆盖率要求 | 验收标准 |
|---------|----------|---------|
| 核心服务 (gates, changeset) | ≥90% | 必须 |
| 业务逻辑 (actions, services) | ≥80% | 必须 |
| 工具函数 (utils) | ≥70% | 建议 |
| UI 组件 | ≥60% | 建议 |

### 8.3 测试示例

```typescript
// 单元测试示例
describe('G1StructuralGate', () => {
  let gate: G1StructuralGate;
  
  beforeEach(() => {
    gate = new G1StructuralGate();
  });
  
  it('should pass with valid data', async () => {
    const context: GateContext = {
      subject: { name: 'test', value: 123 },
      actor: { id: 1 },
      action: 'create',
      metadata: {
        schema: {
          type: 'object',
          required: ['name'],
          properties: { name: { type: 'string' } },
        },
      },
    };
    
    const result = await gate.check(context);
    
    expect(result.passed).toBe(true);
    expect(result.gate).toBe('G1_STRUCTURAL');
  });
  
  it('should fail with missing required field', async () => {
    const context: GateContext = {
      subject: { value: 123 },  // 缺少 name
      actor: { id: 1 },
      action: 'create',
      metadata: {
        schema: {
          type: 'object',
          required: ['name'],
          properties: { name: { type: 'string' } },
        },
      },
    };
    
    const result = await gate.check(context);
    
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('error');
  });
});

// 集成测试示例
describe('ChangeSet API', () => {
  let app: Application;
  let agent: SuperTest;
  
  beforeAll(async () => {
    app = await createTestApp();
    agent = request(app.callback());
  });
  
  afterAll(async () => {
    await app.destroy();
  });
  
  it('should create and submit changeset', async () => {
    // 创建
    const createRes = await agent
      .post('/api/ale/changesets')
      .send({
        title: 'Test Change',
        type: 'config',
        changes: { key: 'value' },
      })
      .expect(200);
    
    expect(createRes.body.data.status).toBe('draft');
    const changesetId = createRes.body.data.id;
    
    // 提交
    const submitRes = await agent
      .post(`/api/ale/changesets/${changesetId}/submit`)
      .expect(200);
    
    expect(submitRes.body.data.gateReport).toBeDefined();
    expect(submitRes.body.data.changeset.status).toBe('pending');
  });
});
```

---

## 第九章：部署规范

### 9.1 环境定义

```yaml
# 环境配置
environments:
  development:
    description: 开发环境
    gates:
      mode: warning  # 门禁警告模式
      required: [G1_STRUCTURAL]
    changeset:
      autoApprove: true  # 自动审批
    
  staging:
    description: 预发布环境
    gates:
      mode: strict  # 门禁严格模式
      required: [G1_STRUCTURAL, G3_EVIDENCE, G6_EXECUTION]
    changeset:
      autoApprove: false
    
  production:
    description: 生产环境
    gates:
      mode: strict
      required: [G1_STRUCTURAL, G3_EVIDENCE, G6_EXECUTION, G7_EVALUATION]
    changeset:
      autoApprove: false
      requiredApprovers: 2
```

### 9.2 容器化配置

```dockerfile
# Dockerfile
FROM nocobase/nocobase:1.8.31

# 安装 ALE 插件
COPY packages/plugins/@ale /app/nocobase/packages/plugins/@ale
RUN cd /app/nocobase && yarn install

# 环境变量
ENV NODE_ENV=production
ENV ALE_GATE_MODE=strict
ENV ALE_AUDIT_ENABLED=true

EXPOSE 13000
CMD ["yarn", "start"]
```

### 9.3 健康检查

```typescript
// 健康检查端点
app.use('/health', async (ctx) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    gateEngine: await checkGateEngine(),
  };
  
  const healthy = Object.values(checks).every(c => c.status === 'ok');
  
  ctx.status = healthy ? 200 : 503;
  ctx.body = {
    status: healthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString(),
  };
});

// 就绪检查
app.use('/ready', async (ctx) => {
  const ready = await isAppReady();
  ctx.status = ready ? 200 : 503;
  ctx.body = { ready };
});
```

---

## 第十章：变更管理

### 10.1 技术宪章变更流程

```
1. 提案 → 2. 评审 → 3. 试点 → 4. 发布
   │         │         │         │
   ↓         ↓         ↓         ↓
 RFC 文档   架构评审   试点验证   全量推广
 利益相关方  影响分析   效果评估   文档更新
```

### 10.2 Breaking Change 处理

```typescript
// 1. 标记废弃
/** @deprecated 使用 evaluateGates 替代，将在 v1.0 移除 */
async function checkGates(context: GateContext): Promise<GateResult[]> {
  console.warn('checkGates is deprecated, use evaluateGates instead');
  return this.evaluateGates(context);
}

// 2. 提供迁移路径
// MIGRATION.md 中记录迁移步骤

// 3. 版本兼容层
if (isLegacyClient(ctx)) {
  return legacyResponse(result);
}
return modernResponse(result);
```

---

## 附录 A：技术决策记录 (ADR)

### ADR-001: 选择 NocoBase 作为基座平台

**状态**: 已采纳  
**日期**: 2025-12-22

**背景**:
需要选择一个低代码平台作为 ALE 的基座。

**决策**:
选择 NocoBase 1.8.31

**理由**:
- 开源可控
- 成熟的插件机制
- TypeScript 技术栈
- 完善的 Collection/Workflow/ACL 能力

**后果**:
- 需要遵循 NocoBase 的插件规范
- 需要锁定版本避免兼容性问题

### ADR-002: 控制面与执行面分离

**状态**: 已采纳  
**日期**: 2025-12-22

**背景**:
需要确定 ALE 的架构模式。

**决策**:
采用控制面/执行面分离架构

**理由**:
- 对标 Palantir Ontology 架构
- 策略与执行解耦
- 便于独立演进

---

## 附录 B：检查清单

### 代码提交检查清单

- [ ] 代码通过 lint 检查
- [ ] 单元测试通过且覆盖率达标
- [ ] 新增 API 有文档
- [ ] 敏感信息已脱敏
- [ ] 无硬编码配置

### 发布检查清单

- [ ] 所有测试通过
- [ ] 安全扫描无高危漏洞
- [ ] 数据库迁移脚本已测试
- [ ] 回滚方案已准备
- [ ] 发布公告已准备

---

**文档状态**：生效  
**下次审阅**：2026年3月  
**文档所有者**：技术委员会
