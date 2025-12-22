# ALE MVP 实现指南

> 本文档提供基于 NocoBase 实现 AIPOS ALE 架构的 MVP 阶段详细实现指南

---

## 1. MVP 目标与范围

### 1.1 场景选择：延迟订单风险处置

**业务闭环**：
```
延迟订单识别 → 风险评估 → 处置方案生成 → 审批 → 执行 → 结案
```

**MVP 交付清单**：
- ✅ L2 场景视图本体：对象/关系/最小证据集
- ✅ 处置单状态机 + 事件定义
- ✅ 关键动作 3-6 个（写回/审批/通知）
- ✅ Gates：G1/G3/G6/G7 跑通并输出报告
- ✅ ChangeSet：提案→门禁→审批→发布→回滚
- ✅ 低代码生成：工作台 UI + 审批页

### 1.2 技术边界

| 包含 | 不包含（后续阶段） |
|-----|------------------|
| 核心本体对象定义 | 多 Space 隔离 |
| 基础门禁引擎（G1/G3/G6/G7） | G2/G4/G5 门禁 |
| 简单 ChangeSet 流程 | 复杂审批路由 |
| 状态机工作流 | Agent Studio |
| 基础审计 | Kinetic 映射 |
| 处置单 CRUD UI | 仿真沙箱 |

---

## 2. 插件架构设计

### 2.1 MVP 插件列表

```
packages/plugins/
├── @ale/core/              # ALE 核心模块
├── @ale/ontology/          # 本体注册表
├── @ale/gate-engine/       # 门禁引擎
├── @ale/changeset/         # 变更管理
├── @ale/disposal-order/    # 延迟订单处置场景
└── @ale/ui/                # ALE UI 组件
```

### 2.2 插件依赖关系

```
┌─────────────────────────────────────────────────────────┐
│                    @ale/disposal-order                   │
│                     (业务场景插件)                        │
└─────────────────────────┬───────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────┐
│  @ale/ontology  │ │ @ale/gate-  │ │   @ale/     │
│                 │ │   engine    │ │  changeset  │
└────────┬────────┘ └──────┬──────┘ └──────┬──────┘
         │                 │               │
         └─────────────────┼───────────────┘
                           ▼
                   ┌──────────────┐
                   │  @ale/core   │
                   └──────────────┘
                           │
                           ▼
                   ┌──────────────┐
                   │   NocoBase   │
                   │    Core      │
                   └──────────────┘
```

---

## 3. 核心插件实现

### 3.1 @ale/core - 核心模块

#### 目录结构

```
packages/plugins/@ale/core/
├── package.json
├── src/
│   ├── index.ts
│   ├── server/
│   │   ├── index.ts
│   │   ├── plugin.ts
│   │   └── types.ts
│   └── client/
│       └── index.ts
└── tsconfig.json
```

#### package.json

```json
{
  "name": "@ale/core",
  "version": "0.1.0",
  "main": "./dist/server/index.js",
  "devDependencies": {
    "@nocobase/server": "1.8.31",
    "@nocobase/database": "1.8.31"
  },
  "peerDependencies": {
    "@nocobase/server": "1.8.x",
    "@nocobase/database": "1.8.x"
  }
}
```

#### src/server/plugin.ts

```typescript
import { Plugin } from '@nocobase/server';

export class ALECorePlugin extends Plugin {
  async afterAdd() {
    // 插件添加后的初始化
  }

  async beforeLoad() {
    // 注册全局类型
    this.registerTypes();
  }

  async load() {
    // 注册核心服务
    this.app.registry.set('ale.core', this);
    
    // 注册共享 Collection
    await this.registerCollections();
    
    // 注册中间件
    this.registerMiddlewares();
    
    this.log.info('ALE Core plugin loaded');
  }

  async install() {
    // 首次安装时的数据初始化
  }

  async afterEnable() {
    // 插件启用后
  }

  async afterDisable() {
    // 插件禁用后
  }

  async remove() {
    // 插件移除时的清理
  }

  private registerTypes() {
    // 注册 ALE 核心类型定义
  }

  private async registerCollections() {
    // 注册 ALE 审计日志表
    this.db.collection({
      name: 'ale_audit_logs',
      fields: [
        { name: 'id', type: 'uuid', primaryKey: true },
        { name: 'action', type: 'string' },
        { name: 'actor_id', type: 'bigInt' },
        { name: 'subject_type', type: 'string' },
        { name: 'subject_id', type: 'string' },
        { name: 'data', type: 'json' },
        { name: 'result', type: 'json' },
        { name: 'timestamp', type: 'date' },
        { name: 'correlation_id', type: 'string', index: true },
      ],
    });
  }

  private registerMiddlewares() {
    // 注册 ALE 上下文中间件
    this.app.use(async (ctx, next) => {
      // 注入 ALE 上下文
      ctx.state.ale = {
        correlationId: ctx.headers['x-correlation-id'] || this.generateCorrelationId(),
        spaceId: ctx.headers['x-ale-space'],
        timestamp: new Date(),
      };
      await next();
    });
  }

  private generateCorrelationId(): string {
    return `ale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 公共 API
  async audit(entry: AuditEntry) {
    await this.db.getRepository('ale_audit_logs').create({
      values: {
        ...entry,
        timestamp: new Date(),
      },
    });
  }
}

interface AuditEntry {
  action: string;
  actor_id: number;
  subject_type: string;
  subject_id: string;
  data?: any;
  result?: any;
  correlation_id?: string;
}

export default ALECorePlugin;
```

### 3.2 @ale/ontology - 本体注册表

#### src/server/collections/ontology-objects.ts

```typescript
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'ale_ontology_objects',
  title: '本体对象',
  fields: [
    {
      name: 'id',
      type: 'uuid',
      primaryKey: true,
    },
    {
      name: 'collection_name',
      type: 'string',
      unique: true,
      comment: '对应 NocoBase Collection 名称',
    },
    {
      name: 'display_name',
      type: 'string',
    },
    {
      name: 'description',
      type: 'text',
    },
    {
      name: 'semantic_tags',
      type: 'json',
      defaultValue: [],
      comment: '语义标签',
    },
    {
      name: 'version',
      type: 'string',
      defaultValue: '1.0.0',
    },
    {
      name: 'evidence_schema',
      type: 'json',
      comment: '关联证据的 Schema',
    },
    {
      name: 'gate_rules',
      type: 'json',
      comment: '门禁规则配置',
    },
    {
      name: 'status',
      type: 'string',
      defaultValue: 'active',
    },
    {
      name: 'created_at',
      type: 'date',
    },
    {
      name: 'updated_at',
      type: 'date',
    },
  ],
});
```

#### src/server/collections/ontology-relations.ts

```typescript
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'ale_ontology_relations',
  title: '本体关系',
  fields: [
    {
      name: 'id',
      type: 'uuid',
      primaryKey: true,
    },
    {
      name: 'name',
      type: 'string',
    },
    {
      name: 'source_object',
      type: 'string',
      comment: '源对象 collection_name',
    },
    {
      name: 'target_object',
      type: 'string',
      comment: '目标对象 collection_name',
    },
    {
      name: 'relation_type',
      type: 'string',
      comment: 'hasOne | hasMany | belongsTo | belongsToMany',
    },
    {
      name: 'semantic_type',
      type: 'string',
      comment: '语义关系类型：owns | references | triggers | requires',
    },
    {
      name: 'constraints',
      type: 'json',
      comment: '关系约束',
    },
    {
      name: 'version',
      type: 'string',
      defaultValue: '1.0.0',
    },
  ],
});
```

#### src/server/services/ontology-registry.ts

```typescript
import { Application } from '@nocobase/server';

export class OntologyRegistry {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  // 注册对象到本体
  async registerObject(spec: OntologyObjectSpec): Promise<void> {
    const repo = this.app.db.getRepository('ale_ontology_objects');
    
    // 检查 Collection 是否存在
    const collection = this.app.db.getCollection(spec.collectionName);
    if (!collection) {
      throw new Error(`Collection ${spec.collectionName} does not exist`);
    }

    // 创建或更新本体对象
    await repo.updateOrCreate({
      filterKeys: ['collection_name'],
      values: {
        collection_name: spec.collectionName,
        display_name: spec.displayName,
        description: spec.description,
        semantic_tags: spec.semanticTags || [],
        version: spec.version || '1.0.0',
        evidence_schema: spec.evidenceSchema,
        gate_rules: spec.gateRules,
        updated_at: new Date(),
      },
    });

    this.app.log.info(`Ontology object registered: ${spec.collectionName}`);
  }

  // 注册关系
  async registerRelation(spec: OntologyRelationSpec): Promise<void> {
    const repo = this.app.db.getRepository('ale_ontology_relations');
    
    await repo.create({
      values: {
        name: spec.name,
        source_object: spec.sourceObject,
        target_object: spec.targetObject,
        relation_type: spec.relationType,
        semantic_type: spec.semanticType,
        constraints: spec.constraints,
        version: spec.version || '1.0.0',
      },
    });
  }

  // 获取对象元数据
  async getObjectMeta(collectionName: string): Promise<OntologyObjectMeta | null> {
    const repo = this.app.db.getRepository('ale_ontology_objects');
    const record = await repo.findOne({
      filter: { collection_name: collectionName },
    });

    if (!record) return null;

    // 合并 NocoBase Collection 信息
    const collection = this.app.db.getCollection(collectionName);
    
    return {
      ...record.toJSON(),
      fields: collection?.fields?.map(f => ({
        name: f.name,
        type: f.type,
        options: f.options,
      })),
    };
  }

  // 获取对象关系
  async getObjectRelations(collectionName: string): Promise<OntologyRelation[]> {
    const repo = this.app.db.getRepository('ale_ontology_relations');
    const relations = await repo.find({
      filter: {
        $or: [
          { source_object: collectionName },
          { target_object: collectionName },
        ],
      },
    });

    return relations.map(r => r.toJSON());
  }

  // 验证对象符合本体规则
  async validateAgainstOntology(collectionName: string, data: any): Promise<ValidationResult> {
    const meta = await this.getObjectMeta(collectionName);
    if (!meta) {
      return { valid: false, errors: [`Object ${collectionName} not registered in ontology`] };
    }

    const errors: string[] = [];

    // 验证门禁规则
    if (meta.gate_rules) {
      for (const rule of meta.gate_rules) {
        if (!this.evaluateRule(rule, data)) {
          errors.push(`Gate rule failed: ${rule.name}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private evaluateRule(rule: any, data: any): boolean {
    // 简单规则评估（MVP）
    // TODO: 完善规则引擎
    return true;
  }
}

interface OntologyObjectSpec {
  collectionName: string;
  displayName: string;
  description?: string;
  semanticTags?: string[];
  version?: string;
  evidenceSchema?: any;
  gateRules?: any[];
}

interface OntologyRelationSpec {
  name: string;
  sourceObject: string;
  targetObject: string;
  relationType: 'hasOne' | 'hasMany' | 'belongsTo' | 'belongsToMany';
  semanticType: 'owns' | 'references' | 'triggers' | 'requires';
  constraints?: any;
  version?: string;
}

interface OntologyObjectMeta {
  id: string;
  collection_name: string;
  display_name: string;
  semantic_tags: string[];
  version: string;
  fields?: any[];
}

interface OntologyRelation {
  id: string;
  name: string;
  source_object: string;
  target_object: string;
  relation_type: string;
  semantic_type: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

### 3.3 @ale/gate-engine - 门禁引擎

#### src/server/gates/base-gate.ts

```typescript
export interface GateContext {
  subject: any;
  actor: any;
  action: string;
  evidence?: any[];
  metadata?: Record<string, any>;
}

export interface GateResult {
  gate: string;
  passed: boolean;
  message: string;
  details?: any;
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: Date;
}

export abstract class BaseGate {
  abstract name: string;
  abstract description: string;

  abstract check(context: GateContext): Promise<GateResult>;

  protected pass(message?: string, details?: any): GateResult {
    return {
      gate: this.name,
      passed: true,
      message: message || 'Gate passed',
      details,
      severity: 'info',
      timestamp: new Date(),
    };
  }

  protected fail(message: string, severity: 'warning' | 'error' | 'critical' = 'error', details?: any): GateResult {
    return {
      gate: this.name,
      passed: false,
      message,
      details,
      severity,
      timestamp: new Date(),
    };
  }
}
```

#### src/server/gates/g1-structural-gate.ts

```typescript
import { BaseGate, GateContext, GateResult } from './base-gate';
import Ajv from 'ajv';

/**
 * G1 - 结构校验门禁
 * 验证输入数据符合 Schema 定义
 */
export class G1StructuralGate extends BaseGate {
  name = 'G1_STRUCTURAL';
  description = '结构校验：验证数据符合 Schema';

  private ajv: Ajv;

  constructor() {
    super();
    this.ajv = new Ajv({ allErrors: true });
  }

  async check(context: GateContext): Promise<GateResult> {
    const { subject, metadata } = context;

    // 获取 Schema（从 metadata 或本体）
    const schema = metadata?.schema;
    if (!schema) {
      return this.pass('No schema defined, skipping structural validation');
    }

    // 编译并验证
    const validate = this.ajv.compile(schema);
    const valid = validate(subject);

    if (valid) {
      return this.pass('Structural validation passed');
    }

    return this.fail(
      `Structural validation failed: ${this.ajv.errorsText(validate.errors)}`,
      'error',
      { errors: validate.errors }
    );
  }
}
```

#### src/server/gates/g3-evidence-gate.ts

```typescript
import { BaseGate, GateContext, GateResult } from './base-gate';

/**
 * G3 - 证据校验门禁
 * 验证操作具有充分的证据支持
 */
export class G3EvidenceGate extends BaseGate {
  name = 'G3_EVIDENCE';
  description = '证据校验：验证操作具有充分证据';

  async check(context: GateContext): Promise<GateResult> {
    const { evidence, metadata } = context;
    const requiredEvidence = metadata?.requiredEvidence || [];

    if (requiredEvidence.length === 0) {
      return this.pass('No evidence requirements defined');
    }

    const providedTypes = new Set((evidence || []).map((e: any) => e.type));
    const missing = requiredEvidence.filter((req: string) => !providedTypes.has(req));

    if (missing.length === 0) {
      return this.pass('All required evidence provided', {
        provided: Array.from(providedTypes),
      });
    }

    return this.fail(
      `Missing required evidence: ${missing.join(', ')}`,
      'error',
      { missing, provided: Array.from(providedTypes) }
    );
  }
}
```

#### src/server/gates/g6-execution-gate.ts

```typescript
import { BaseGate, GateContext, GateResult } from './base-gate';

/**
 * G6 - 执行校验门禁
 * 验证执行条件满足（权限、资源、时间窗口等）
 */
export class G6ExecutionGate extends BaseGate {
  name = 'G6_EXECUTION';
  description = '执行校验：验证执行条件满足';

  async check(context: GateContext): Promise<GateResult> {
    const { actor, action, metadata } = context;

    const checks: { name: string; passed: boolean; message: string }[] = [];

    // 1. 权限检查
    const requiredRoles = metadata?.requiredRoles || [];
    if (requiredRoles.length > 0) {
      const hasRole = actor?.roles?.some((r: string) => requiredRoles.includes(r));
      checks.push({
        name: 'role_check',
        passed: !!hasRole,
        message: hasRole ? 'Role check passed' : `Required roles: ${requiredRoles.join(', ')}`,
      });
    }

    // 2. 时间窗口检查
    const timeWindow = metadata?.timeWindow;
    if (timeWindow) {
      const now = new Date();
      const inWindow = now >= new Date(timeWindow.start) && now <= new Date(timeWindow.end);
      checks.push({
        name: 'time_window',
        passed: inWindow,
        message: inWindow ? 'Within time window' : 'Outside allowed time window',
      });
    }

    // 3. 风险等级检查
    const riskLevel = metadata?.riskLevel;
    const maxAutoApproveRisk = metadata?.maxAutoApproveRisk || 'low';
    if (riskLevel) {
      const riskOrder = ['low', 'medium', 'high', 'critical'];
      const allowed = riskOrder.indexOf(riskLevel) <= riskOrder.indexOf(maxAutoApproveRisk);
      checks.push({
        name: 'risk_level',
        passed: allowed,
        message: allowed ? 'Risk level acceptable' : `Risk level ${riskLevel} requires approval`,
      });
    }

    const failedChecks = checks.filter(c => !c.passed);
    if (failedChecks.length === 0) {
      return this.pass('All execution conditions met', { checks });
    }

    return this.fail(
      `Execution conditions not met: ${failedChecks.map(c => c.message).join('; ')}`,
      'error',
      { checks }
    );
  }
}
```

#### src/server/gates/g7-evaluation-gate.ts

```typescript
import { BaseGate, GateContext, GateResult } from './base-gate';

/**
 * G7 - 评测校验门禁
 * 验证变更通过预定义的评测集
 */
export class G7EvaluationGate extends BaseGate {
  name = 'G7_EVALUATION';
  description = '评测校验：验证变更通过评测集';

  async check(context: GateContext): Promise<GateResult> {
    const { subject, metadata } = context;
    const evalSets = metadata?.evalSets || [];

    if (evalSets.length === 0) {
      return this.pass('No evaluation sets defined');
    }

    const results: { evalSet: string; passed: boolean; score?: number }[] = [];

    for (const evalSet of evalSets) {
      // MVP: 简单的规则评测
      // TODO: 扩展为完整的评测框架
      const result = await this.runEvalSet(evalSet, subject);
      results.push(result);
    }

    const failed = results.filter(r => !r.passed);
    if (failed.length === 0) {
      return this.pass('All evaluation sets passed', { results });
    }

    return this.fail(
      `Evaluation failed: ${failed.map(f => f.evalSet).join(', ')}`,
      'warning',
      { results }
    );
  }

  private async runEvalSet(evalSet: any, subject: any): Promise<{ evalSet: string; passed: boolean; score?: number }> {
    // MVP 实现：基于规则的简单评测
    // 后续可扩展为：
    // - 离线评测集
    // - 模型评测
    // - A/B 测试
    
    const rules = evalSet.rules || [];
    let passedRules = 0;

    for (const rule of rules) {
      if (this.evaluateRule(rule, subject)) {
        passedRules++;
      }
    }

    const score = rules.length > 0 ? passedRules / rules.length : 1;
    const threshold = evalSet.threshold || 0.8;

    return {
      evalSet: evalSet.name,
      passed: score >= threshold,
      score,
    };
  }

  private evaluateRule(rule: any, subject: any): boolean {
    // 简单规则评估
    // TODO: 完善规则引擎
    return true;
  }
}
```

#### src/server/services/gate-engine.ts

```typescript
import { Application } from '@nocobase/server';
import { BaseGate, GateContext, GateResult } from '../gates/base-gate';
import { G1StructuralGate } from '../gates/g1-structural-gate';
import { G3EvidenceGate } from '../gates/g3-evidence-gate';
import { G6ExecutionGate } from '../gates/g6-execution-gate';
import { G7EvaluationGate } from '../gates/g7-evaluation-gate';

export interface GateReport {
  id: string;
  timestamp: Date;
  gates: GateResult[];
  passed: boolean;
  summary: string;
}

export class GateEngine {
  private app: Application;
  private gates: Map<string, BaseGate> = new Map();

  constructor(app: Application) {
    this.app = app;
    this.registerDefaultGates();
  }

  private registerDefaultGates() {
    this.registerGate(new G1StructuralGate());
    this.registerGate(new G3EvidenceGate());
    this.registerGate(new G6ExecutionGate());
    this.registerGate(new G7EvaluationGate());
  }

  registerGate(gate: BaseGate) {
    this.gates.set(gate.name, gate);
    this.app.log.info(`Gate registered: ${gate.name}`);
  }

  async evaluate(context: GateContext, gateNames: string[]): Promise<GateReport> {
    const results: GateResult[] = [];
    let allPassed = true;

    for (const gateName of gateNames) {
      const gate = this.gates.get(gateName);
      if (!gate) {
        this.app.log.warn(`Gate not found: ${gateName}`);
        continue;
      }

      const result = await gate.check(context);
      results.push(result);

      if (!result.passed) {
        allPassed = false;
        // 根据严重程度决定是否继续
        if (result.severity === 'critical') {
          break;
        }
      }
    }

    const report: GateReport = {
      id: this.generateReportId(),
      timestamp: new Date(),
      gates: results,
      passed: allPassed,
      summary: allPassed
        ? 'All gates passed'
        : `Failed gates: ${results.filter(r => !r.passed).map(r => r.gate).join(', ')}`,
    };

    // 持久化报告
    await this.persistReport(report, context);

    return report;
  }

  async evaluateSingle(gateName: string, context: GateContext): Promise<GateResult> {
    const gate = this.gates.get(gateName);
    if (!gate) {
      throw new Error(`Gate not found: ${gateName}`);
    }
    return gate.check(context);
  }

  private generateReportId(): string {
    return `gr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async persistReport(report: GateReport, context: GateContext) {
    await this.app.db.getRepository('ale_gate_reports').create({
      values: {
        id: report.id,
        subject_type: context.metadata?.subjectType || 'unknown',
        subject_id: context.metadata?.subjectId || '',
        gates_evaluated: report.gates.map(g => g.gate),
        passed: report.passed,
        details: report.gates,
        created_at: report.timestamp,
      },
    });
  }
}
```

### 3.4 @ale/changeset - 变更管理

#### src/server/collections/changesets.ts

```typescript
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'ale_changesets',
  title: '变更集',
  fields: [
    {
      name: 'id',
      type: 'uuid',
      primaryKey: true,
    },
    {
      name: 'title',
      type: 'string',
    },
    {
      name: 'description',
      type: 'text',
    },
    {
      name: 'type',
      type: 'string',
      comment: 'schema | action | flow | policy | config',
    },
    {
      name: 'status',
      type: 'string',
      defaultValue: 'draft',
      comment: 'draft | pending | approved | rejected | published | rolled_back',
    },
    {
      name: 'changes',
      type: 'json',
      comment: '变更内容',
    },
    {
      name: 'gate_report_id',
      type: 'string',
    },
    {
      name: 'gate_report',
      type: 'json',
    },
    {
      name: 'risk_level',
      type: 'string',
      defaultValue: 'low',
      comment: 'low | medium | high | critical',
    },
    {
      name: 'version',
      type: 'string',
    },
    {
      name: 'parent_version',
      type: 'string',
    },
    {
      name: 'created_by',
      type: 'belongsTo',
      target: 'users',
    },
    {
      name: 'approved_by',
      type: 'belongsTo',
      target: 'users',
    },
    {
      name: 'created_at',
      type: 'date',
    },
    {
      name: 'submitted_at',
      type: 'date',
    },
    {
      name: 'approved_at',
      type: 'date',
    },
    {
      name: 'published_at',
      type: 'date',
    },
    {
      name: 'rolled_back_at',
      type: 'date',
    },
  ],
});
```

#### src/server/services/changeset-service.ts

```typescript
import { Application } from '@nocobase/server';
import { GateEngine, GateReport } from '@ale/gate-engine';

export class ChangeSetService {
  private app: Application;
  private gateEngine: GateEngine;

  constructor(app: Application) {
    this.app = app;
    this.gateEngine = app.registry.get('ale.gateEngine');
  }

  // 创建变更集
  async create(spec: CreateChangeSetSpec): Promise<ChangeSet> {
    const repo = this.app.db.getRepository('ale_changesets');

    const changeset = await repo.create({
      values: {
        title: spec.title,
        description: spec.description,
        type: spec.type,
        status: 'draft',
        changes: spec.changes,
        risk_level: spec.riskLevel || 'low',
        created_by: spec.createdBy,
        created_at: new Date(),
      },
    });

    return changeset.toJSON();
  }

  // 提交变更集（触发门禁评估）
  async submit(id: string, actor: any): Promise<SubmitResult> {
    const repo = this.app.db.getRepository('ale_changesets');
    const changeset = await repo.findOne({ filter: { id } });

    if (!changeset) {
      throw new Error(`ChangeSet not found: ${id}`);
    }

    if (changeset.status !== 'draft') {
      throw new Error(`ChangeSet is not in draft status: ${changeset.status}`);
    }

    // 执行门禁评估
    const gateReport = await this.gateEngine.evaluate(
      {
        subject: changeset.changes,
        actor,
        action: 'submit_changeset',
        metadata: {
          subjectType: 'changeset',
          subjectId: id,
          riskLevel: changeset.risk_level,
          requiredEvidence: this.getRequiredEvidence(changeset.type),
        },
      },
      ['G1_STRUCTURAL', 'G3_EVIDENCE', 'G6_EXECUTION', 'G7_EVALUATION']
    );

    // 更新变更集状态
    const newStatus = gateReport.passed ? 'pending' : 'draft';
    await repo.update({
      filter: { id },
      values: {
        status: newStatus,
        gate_report_id: gateReport.id,
        gate_report: gateReport,
        submitted_at: new Date(),
      },
    });

    return {
      changeset: { ...changeset.toJSON(), status: newStatus },
      gateReport,
      nextAction: gateReport.passed ? 'await_approval' : 'fix_issues',
    };
  }

  // 审批变更集
  async approve(id: string, approver: any): Promise<ChangeSet> {
    const repo = this.app.db.getRepository('ale_changesets');
    const changeset = await repo.findOne({ filter: { id } });

    if (!changeset) {
      throw new Error(`ChangeSet not found: ${id}`);
    }

    if (changeset.status !== 'pending') {
      throw new Error(`ChangeSet is not pending approval: ${changeset.status}`);
    }

    await repo.update({
      filter: { id },
      values: {
        status: 'approved',
        approved_by: approver.id,
        approved_at: new Date(),
      },
    });

    // 审计日志
    await this.audit('changeset.approved', approver.id, 'changeset', id, { changeset });

    return (await repo.findOne({ filter: { id } })).toJSON();
  }

  // 发布变更集
  async publish(id: string, actor: any): Promise<PublishResult> {
    const repo = this.app.db.getRepository('ale_changesets');
    const changeset = await repo.findOne({ filter: { id } });

    if (!changeset) {
      throw new Error(`ChangeSet not found: ${id}`);
    }

    if (changeset.status !== 'approved') {
      throw new Error(`ChangeSet is not approved: ${changeset.status}`);
    }

    try {
      // 应用变更
      await this.applyChanges(changeset);

      // 生成版本号
      const version = this.generateVersion();

      // 更新状态
      await repo.update({
        filter: { id },
        values: {
          status: 'published',
          version,
          parent_version: changeset.version,
          published_at: new Date(),
        },
      });

      // 审计日志
      await this.audit('changeset.published', actor.id, 'changeset', id, { version });

      return {
        success: true,
        version,
        changeset: (await repo.findOne({ filter: { id } })).toJSON(),
      };
    } catch (error) {
      this.app.log.error(`Failed to publish changeset ${id}:`, error);
      throw error;
    }
  }

  // 回滚变更集
  async rollback(id: string, actor: any): Promise<RollbackResult> {
    const repo = this.app.db.getRepository('ale_changesets');
    const changeset = await repo.findOne({ filter: { id } });

    if (!changeset) {
      throw new Error(`ChangeSet not found: ${id}`);
    }

    if (changeset.status !== 'published') {
      throw new Error(`ChangeSet is not published: ${changeset.status}`);
    }

    try {
      // 执行回滚
      await this.revertChanges(changeset);

      // 更新状态
      await repo.update({
        filter: { id },
        values: {
          status: 'rolled_back',
          rolled_back_at: new Date(),
        },
      });

      // 审计日志
      await this.audit('changeset.rolled_back', actor.id, 'changeset', id, {});

      return {
        success: true,
        changeset: (await repo.findOne({ filter: { id } })).toJSON(),
      };
    } catch (error) {
      this.app.log.error(`Failed to rollback changeset ${id}:`, error);
      throw error;
    }
  }

  private getRequiredEvidence(type: string): string[] {
    const evidenceMap: Record<string, string[]> = {
      schema: ['design_doc', 'review_approval'],
      action: ['test_result', 'risk_assessment'],
      flow: ['flow_diagram', 'stakeholder_approval'],
      policy: ['policy_doc', 'compliance_check'],
      config: ['config_diff'],
    };
    return evidenceMap[type] || [];
  }

  private async applyChanges(changeset: any): Promise<void> {
    // 根据变更类型应用变更
    // MVP: 记录变更，实际应用由各子系统处理
    this.app.log.info(`Applying changes for changeset: ${changeset.id}`);
  }

  private async revertChanges(changeset: any): Promise<void> {
    // 回滚变更
    // MVP: 记录回滚，实际回滚由各子系统处理
    this.app.log.info(`Reverting changes for changeset: ${changeset.id}`);
  }

  private generateVersion(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 4);
    return `v-${timestamp}-${random}`;
  }

  private async audit(action: string, actorId: number, subjectType: string, subjectId: string, data: any) {
    const aleCore = this.app.registry.get('ale.core');
    await aleCore?.audit({
      action,
      actor_id: actorId,
      subject_type: subjectType,
      subject_id: subjectId,
      data,
    });
  }
}

interface CreateChangeSetSpec {
  title: string;
  description?: string;
  type: 'schema' | 'action' | 'flow' | 'policy' | 'config';
  changes: any;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  createdBy: number;
}

interface ChangeSet {
  id: string;
  title: string;
  status: string;
  changes: any;
  gate_report?: any;
  version?: string;
}

interface SubmitResult {
  changeset: ChangeSet;
  gateReport: GateReport;
  nextAction: string;
}

interface PublishResult {
  success: boolean;
  version: string;
  changeset: ChangeSet;
}

interface RollbackResult {
  success: boolean;
  changeset: ChangeSet;
}
```

---

## 4. 场景插件实现：延迟订单处置

### 4.1 数据模型定义

#### src/server/collections/disposal-orders.ts

```typescript
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'disposal_orders',
  title: '处置单',
  fields: [
    { name: 'id', type: 'uuid', primaryKey: true },
    { name: 'order_no', type: 'string', unique: true },
    { name: 'source_order_id', type: 'string', comment: '原订单ID' },
    { name: 'customer_name', type: 'string' },
    { name: 'delay_reason', type: 'string' },
    { name: 'delay_days', type: 'integer' },
    { name: 'order_amount', type: 'decimal' },
    { name: 'risk_level', type: 'string', defaultValue: 'low' },
    { name: 'status', type: 'string', defaultValue: 'pending' },
    { name: 'proposed_action', type: 'string' },
    { name: 'final_action', type: 'string' },
    { name: 'resolution_notes', type: 'text' },
    { name: 'assigned_to', type: 'belongsTo', target: 'users' },
    { name: 'created_by', type: 'belongsTo', target: 'users' },
    { name: 'approved_by', type: 'belongsTo', target: 'users' },
    { name: 'evidences', type: 'hasMany', target: 'disposal_evidences' },
    { name: 'events', type: 'hasMany', target: 'disposal_events' },
    { name: 'created_at', type: 'date' },
    { name: 'updated_at', type: 'date' },
    { name: 'resolved_at', type: 'date' },
  ],
});
```

### 4.2 状态机定义

#### src/server/state-machine/disposal-states.ts

```typescript
export const DisposalStateMachine = {
  name: 'disposal_order_state_machine',
  initial: 'pending',
  states: {
    pending: {
      on: {
        ASSIGN: 'assigned',
        AUTO_RESOLVE: 'resolved',
      },
    },
    assigned: {
      on: {
        SUBMIT_PROPOSAL: 'proposal_submitted',
        REASSIGN: 'assigned',
        CANCEL: 'cancelled',
      },
    },
    proposal_submitted: {
      on: {
        APPROVE: 'approved',
        REJECT: 'assigned',
        REQUEST_MORE_INFO: 'assigned',
      },
    },
    approved: {
      on: {
        EXECUTE: 'executing',
        CANCEL: 'cancelled',
      },
    },
    executing: {
      on: {
        COMPLETE: 'resolved',
        FAIL: 'failed',
      },
    },
    resolved: {
      type: 'final',
    },
    failed: {
      on: {
        RETRY: 'executing',
        ESCALATE: 'escalated',
      },
    },
    escalated: {
      on: {
        RESOLVE_MANUALLY: 'resolved',
      },
    },
    cancelled: {
      type: 'final',
    },
  },
};

// 状态转换的门禁要求
export const StateGateRequirements = {
  'pending->assigned': {
    gates: ['G6_EXECUTION'],
    metadata: { requiredRoles: ['operator', 'manager'] },
  },
  'assigned->proposal_submitted': {
    gates: ['G1_STRUCTURAL', 'G3_EVIDENCE'],
    metadata: { requiredEvidence: ['risk_assessment'] },
  },
  'proposal_submitted->approved': {
    gates: ['G6_EXECUTION', 'G7_EVALUATION'],
    metadata: { requiredRoles: ['manager', 'approver'] },
  },
  'approved->executing': {
    gates: ['G6_EXECUTION'],
    metadata: {},
  },
  'executing->resolved': {
    gates: ['G3_EVIDENCE'],
    metadata: { requiredEvidence: ['execution_result'] },
  },
};
```

### 4.3 动作定义

#### src/server/actions/disposal-actions.ts

```typescript
import { Application } from '@nocobase/server';

export function registerDisposalActions(app: Application) {
  const gateEngine = app.registry.get('ale.gateEngine');

  // 动作1：分配处置单
  app.resource('disposal_orders', {
    actions: {
      assign: async (ctx, next) => {
        const { filterByTk, values } = ctx.action.params;
        const { assignee_id } = values;

        // 门禁检查
        const gateResult = await gateEngine.evaluate(
          {
            subject: { id: filterByTk, assignee_id },
            actor: ctx.state.currentUser,
            action: 'assign',
            metadata: {
              subjectType: 'disposal_order',
              subjectId: filterByTk,
              requiredRoles: ['operator', 'manager'],
            },
          },
          ['G6_EXECUTION']
        );

        if (!gateResult.passed) {
          ctx.throw(403, gateResult.summary);
        }

        // 执行分配
        const repo = app.db.getRepository('disposal_orders');
        await repo.update({
          filter: { id: filterByTk },
          values: {
            assigned_to: assignee_id,
            status: 'assigned',
            updated_at: new Date(),
          },
        });

        // 记录事件
        await app.db.getRepository('disposal_events').create({
          values: {
            disposal_order_id: filterByTk,
            type: 'assigned',
            actor_id: ctx.state.currentUser?.id,
            data: { assignee_id },
            timestamp: new Date(),
          },
        });

        ctx.body = { success: true, gateReport: gateResult };
        await next();
      },

      // 动作2：提交处置方案
      submitProposal: async (ctx, next) => {
        const { filterByTk, values } = ctx.action.params;
        const { proposed_action, evidence } = values;

        // 门禁检查
        const gateResult = await gateEngine.evaluate(
          {
            subject: { id: filterByTk, proposed_action },
            actor: ctx.state.currentUser,
            action: 'submit_proposal',
            evidence,
            metadata: {
              subjectType: 'disposal_order',
              subjectId: filterByTk,
              requiredEvidence: ['risk_assessment'],
              schema: {
                type: 'object',
                required: ['proposed_action'],
                properties: {
                  proposed_action: { type: 'string', minLength: 1 },
                },
              },
            },
          },
          ['G1_STRUCTURAL', 'G3_EVIDENCE']
        );

        if (!gateResult.passed) {
          ctx.throw(400, gateResult.summary);
        }

        // 保存证据
        if (evidence && evidence.length > 0) {
          for (const ev of evidence) {
            await app.db.getRepository('disposal_evidences').create({
              values: {
                disposal_order_id: filterByTk,
                type: ev.type,
                content: ev.content,
                source: ev.source,
                created_at: new Date(),
              },
            });
          }
        }

        // 更新处置单
        const repo = app.db.getRepository('disposal_orders');
        await repo.update({
          filter: { id: filterByTk },
          values: {
            proposed_action,
            status: 'proposal_submitted',
            updated_at: new Date(),
          },
        });

        // 记录事件
        await app.db.getRepository('disposal_events').create({
          values: {
            disposal_order_id: filterByTk,
            type: 'proposal_submitted',
            actor_id: ctx.state.currentUser?.id,
            data: { proposed_action, evidence_count: evidence?.length || 0 },
            timestamp: new Date(),
          },
        });

        ctx.body = { success: true, gateReport: gateResult };
        await next();
      },

      // 动作3：审批处置方案
      approve: async (ctx, next) => {
        const { filterByTk, values } = ctx.action.params;
        const { approval_notes } = values;

        // 门禁检查
        const gateResult = await gateEngine.evaluate(
          {
            subject: { id: filterByTk },
            actor: ctx.state.currentUser,
            action: 'approve',
            metadata: {
              subjectType: 'disposal_order',
              subjectId: filterByTk,
              requiredRoles: ['manager', 'approver'],
            },
          },
          ['G6_EXECUTION', 'G7_EVALUATION']
        );

        if (!gateResult.passed) {
          ctx.throw(403, gateResult.summary);
        }

        // 更新处置单
        const repo = app.db.getRepository('disposal_orders');
        await repo.update({
          filter: { id: filterByTk },
          values: {
            status: 'approved',
            approved_by: ctx.state.currentUser?.id,
            updated_at: new Date(),
          },
        });

        // 记录事件
        await app.db.getRepository('disposal_events').create({
          values: {
            disposal_order_id: filterByTk,
            type: 'approved',
            actor_id: ctx.state.currentUser?.id,
            data: { approval_notes },
            timestamp: new Date(),
          },
        });

        ctx.body = { success: true, gateReport: gateResult };
        await next();
      },

      // 动作4：执行处置
      execute: async (ctx, next) => {
        const { filterByTk } = ctx.action.params;

        // 获取处置单信息
        const order = await app.db.getRepository('disposal_orders').findOne({
          filter: { id: filterByTk },
        });

        if (!order || order.status !== 'approved') {
          ctx.throw(400, 'Order is not approved');
        }

        // 门禁检查
        const gateResult = await gateEngine.evaluate(
          {
            subject: order.toJSON(),
            actor: ctx.state.currentUser,
            action: 'execute',
            metadata: {
              subjectType: 'disposal_order',
              subjectId: filterByTk,
              riskLevel: order.risk_level,
            },
          },
          ['G6_EXECUTION']
        );

        if (!gateResult.passed) {
          ctx.throw(403, gateResult.summary);
        }

        try {
          // 更新状态为执行中
          await app.db.getRepository('disposal_orders').update({
            filter: { id: filterByTk },
            values: { status: 'executing', updated_at: new Date() },
          });

          // 模拟执行处置动作
          // TODO: 实际集成写回网关
          await this.executeDisposalAction(order);

          // 更新状态为已解决
          await app.db.getRepository('disposal_orders').update({
            filter: { id: filterByTk },
            values: {
              status: 'resolved',
              final_action: order.proposed_action,
              resolved_at: new Date(),
              updated_at: new Date(),
            },
          });

          // 记录事件
          await app.db.getRepository('disposal_events').create({
            values: {
              disposal_order_id: filterByTk,
              type: 'executed',
              actor_id: ctx.state.currentUser?.id,
              data: { action: order.proposed_action, result: 'success' },
              timestamp: new Date(),
            },
          });

          ctx.body = { success: true, gateReport: gateResult };
        } catch (error) {
          // 执行失败
          await app.db.getRepository('disposal_orders').update({
            filter: { id: filterByTk },
            values: { status: 'failed', updated_at: new Date() },
          });

          await app.db.getRepository('disposal_events').create({
            values: {
              disposal_order_id: filterByTk,
              type: 'execution_failed',
              actor_id: ctx.state.currentUser?.id,
              data: { error: error.message },
              timestamp: new Date(),
            },
          });

          ctx.throw(500, `Execution failed: ${error.message}`);
        }

        await next();
      },
    },
  });
}
```

---

## 5. 快速启动指南

### 5.1 环境准备

```bash
# 1. 确保 NocoBase 应用已初始化
cd /workspace/my-nocobase-app
yarn install

# 2. 创建 ALE 插件目录结构
mkdir -p packages/plugins/@ale/core
mkdir -p packages/plugins/@ale/ontology
mkdir -p packages/plugins/@ale/gate-engine
mkdir -p packages/plugins/@ale/changeset
mkdir -p packages/plugins/@ale/disposal-order

# 3. 初始化各插件 package.json
# （按照上述模板创建）

# 4. 安装依赖
yarn install

# 5. 启动开发环境
yarn dev
```

### 5.2 插件启用顺序

```typescript
// 在 NocoBase 配置中按顺序启用插件
const plugins = [
  '@ale/core',           // 1. 核心模块
  '@ale/ontology',       // 2. 本体注册
  '@ale/gate-engine',    // 3. 门禁引擎
  '@ale/changeset',      // 4. 变更管理
  '@ale/disposal-order', // 5. 业务场景
];
```

### 5.3 验证清单

- [ ] 数据库表创建成功
- [ ] 门禁引擎正常工作
- [ ] ChangeSet 流程跑通
- [ ] 处置单 CRUD 正常
- [ ] 状态机转换正确
- [ ] 审计日志记录完整

---

## 6. 测试用例

### 6.1 门禁引擎测试

```typescript
describe('GateEngine', () => {
  it('should pass G1 structural gate with valid data', async () => {
    const result = await gateEngine.evaluate(
      {
        subject: { name: 'test', value: 123 },
        actor: { id: 1, roles: ['admin'] },
        action: 'create',
        metadata: {
          schema: {
            type: 'object',
            required: ['name'],
            properties: { name: { type: 'string' } },
          },
        },
      },
      ['G1_STRUCTURAL']
    );
    
    expect(result.passed).toBe(true);
  });

  it('should fail G3 evidence gate without required evidence', async () => {
    const result = await gateEngine.evaluate(
      {
        subject: {},
        actor: { id: 1 },
        action: 'submit',
        evidence: [],
        metadata: { requiredEvidence: ['risk_assessment'] },
      },
      ['G3_EVIDENCE']
    );
    
    expect(result.passed).toBe(false);
  });
});
```

### 6.2 ChangeSet 流程测试

```typescript
describe('ChangeSetService', () => {
  it('should create, submit, approve and publish changeset', async () => {
    // 创建
    const changeset = await changeSetService.create({
      title: 'Test Change',
      type: 'config',
      changes: { key: 'value' },
      createdBy: 1,
    });
    expect(changeset.status).toBe('draft');

    // 提交
    const submitResult = await changeSetService.submit(changeset.id, { id: 1, roles: ['admin'] });
    expect(submitResult.gateReport.passed).toBe(true);

    // 审批
    const approved = await changeSetService.approve(changeset.id, { id: 2, roles: ['approver'] });
    expect(approved.status).toBe('approved');

    // 发布
    const publishResult = await changeSetService.publish(changeset.id, { id: 2 });
    expect(publishResult.success).toBe(true);
    expect(publishResult.version).toBeDefined();
  });
});
```

---

## 7. 下一步

完成 MVP 后的扩展方向：

1. **P1 阶段**：
   - Schema 版本控制
   - Kinetic 映射层
   - 多 Space 支持

2. **P2 阶段**：
   - Agent Studio
   - Scenario 沙箱
   - RAG 集成

3. **P3 阶段**：
   - 多 Agent 编排
   - 联邦化支持
   - 完整的 OSDK

---

**文档版本**: 1.0  
**最后更新**: 2025年12月22日
