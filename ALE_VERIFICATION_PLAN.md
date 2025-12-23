# AIPOS ALE 验证计划

> **版本**: 1.0  
> **日期**: 2025年12月  
> **范围**: 技术验证 + 功能验证 + 性能验证 + 安全验证

---

## 1. 验证策略概述

### 1.1 验证目标

确保 ALE 平台满足以下要求：
1. **技术可行性**：NocoBase 插件机制能支撑 ALE 架构
2. **功能正确性**：门禁、变更、本体等核心功能正常工作
3. **性能达标**：响应时间、吞吐量满足业务需求
4. **安全合规**：权限隔离、审计追溯符合要求

### 1.2 验证阶段

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          验证阶段总览                                    │
├─────────────┬─────────────┬─────────────┬─────────────┬────────────────┤
│   V0        │    V1       │    V2       │    V3       │     V4         │
│ 技术验证    │  单元验证   │  集成验证   │  系统验证   │   验收验证     │
│ (M0)        │  (持续)     │  (Sprint)   │  (里程碑)   │   (发布前)     │
├─────────────┼─────────────┼─────────────┼─────────────┼────────────────┤
│ PoC 验证    │ 单元测试    │ 集成测试    │ E2E 测试    │ UAT 验收       │
│ 技术可行性  │ 代码覆盖    │ API 测试    │ 性能测试    │ 安全审计       │
│             │             │ 契约测试    │ 安全测试    │ 合规检查       │
└─────────────┴─────────────┴─────────────┴─────────────┴────────────────┘
```

### 1.3 验证职责矩阵

| 验证类型 | 执行者 | 审核者 | 频率 |
|---------|-------|-------|-----|
| 技术验证 (V0) | 架构师 | 技术委员会 | M0 阶段 |
| 单元测试 (V1) | 开发者 | 代码审核者 | 每次提交 |
| 集成测试 (V2) | 开发者 + QA | 技术负责人 | 每次 PR |
| 系统测试 (V3) | QA | 技术负责人 | 每个 Sprint |
| 验收测试 (V4) | QA + 业务方 | 产品负责人 | 发布前 |

---

## 2. V0：技术验证（M0 阶段）

### 2.1 验证目标

验证 NocoBase 平台能够支撑 ALE 架构的核心技术需求。

### 2.2 验证用例

#### TC-V0-001：NocoBase 插件机制验证

```yaml
用例ID: TC-V0-001
用例名称: NocoBase 插件生命周期验证
前置条件:
  - NocoBase 1.8.31 开发环境就绪
  - 创建示例插件 @ale/test-plugin

验证步骤:
  1. 创建插件骨架
     - 执行: yarn nocobase create-plugin @ale/test-plugin
     - 预期: 插件目录结构正确创建
  
  2. 插件加载
     - 启动 NocoBase
     - 预期: 插件 load() 方法被调用，日志输出正常
  
  3. 插件依赖
     - 配置 @ale/test-plugin 依赖 @nocobase/plugin-workflow
     - 预期: 依赖插件先加载，依赖注入正常
  
  4. 插件热重载
     - 修改插件代码
     - 预期: 开发模式下自动重载

验证结果:
  □ 通过  □ 失败  □ 阻塞

备注: _______________
```

#### TC-V0-002：Collection Manager 扩展验证

```yaml
用例ID: TC-V0-002
用例名称: Collection Manager 元数据扩展验证
前置条件:
  - NocoBase 开发环境就绪
  - @ale/test-plugin 已创建

验证步骤:
  1. 扩展 Collection 元数据
     代码:
     ```typescript
     this.db.collection({
       name: 'test_objects',
       fields: [
         { name: 'id', type: 'uuid', primaryKey: true },
         { name: 'semantic_tags', type: 'json' },
         { name: 'gate_rules', type: 'json' },
       ],
     });
     ```
     预期: 表创建成功，字段类型正确
  
  2. 关联现有 Collection
     代码:
     ```typescript
     const usersCollection = this.db.getCollection('users');
     // 添加动态字段
     ```
     预期: 可以获取并操作现有 Collection
  
  3. 监听 Collection 变更
     代码:
     ```typescript
     this.db.on('collection.afterCreate', async (collection) => {
       // 自动注册到本体
     });
     ```
     预期: 事件监听正常工作

验证结果:
  □ 通过  □ 失败  □ 阻塞

备注: _______________
```

#### TC-V0-003：Workflow 引擎扩展验证

```yaml
用例ID: TC-V0-003
用例名称: Workflow 自定义节点验证
前置条件:
  - @nocobase/plugin-workflow 已启用

验证步骤:
  1. 注册自定义节点类型
     代码:
     ```typescript
     workflow.registerNodeType('gate_check', {
       run: async (context) => {
         // 门禁检查逻辑
         return { passed: true };
       },
     });
     ```
     预期: 节点类型注册成功
  
  2. 在工作流中使用自定义节点
     - 创建包含 gate_check 节点的工作流
     - 触发工作流执行
     预期: 自定义节点正常执行
  
  3. 节点间数据传递
     预期: context 中可以获取上游节点数据

验证结果:
  □ 通过  □ 失败  □ 阻塞

备注: _______________
```

#### TC-V0-004：ACL 模块扩展验证

```yaml
用例ID: TC-V0-004
用例名称: ACL 细粒度权限验证
前置条件:
  - @nocobase/plugin-acl 已启用

验证步骤:
  1. 资源级权限配置
     代码:
     ```typescript
     this.app.acl.allow('disposal_orders', 'create', 'loggedIn');
     this.app.acl.allow('disposal_orders', 'approve', 'role', { roles: ['manager'] });
     ```
     预期: 权限配置生效
  
  2. 字段级权限配置
     代码:
     ```typescript
     this.app.acl.setFieldPermission('disposal_orders', 'risk_level', {
       read: ['operator', 'manager'],
       write: ['manager'],
     });
     ```
     预期: 字段级权限控制有效
  
  3. 自定义权限中间件
     预期: 可以注入自定义权限检查逻辑

验证结果:
  □ 通过  □ 失败  □ 阻塞

备注: _______________
```

### 2.3 技术验证报告模板

```markdown
# ALE 技术验证报告

## 1. 验证概要
- 验证日期: ____
- 验证人员: ____
- NocoBase 版本: 1.8.31

## 2. 验证结果汇总

| 验证项 | 结果 | 备注 |
|-------|-----|-----|
| TC-V0-001 插件机制 | ✅/❌ | |
| TC-V0-002 Collection 扩展 | ✅/❌ | |
| TC-V0-003 Workflow 扩展 | ✅/❌ | |
| TC-V0-004 ACL 扩展 | ✅/❌ | |

## 3. 发现的问题

| ID | 描述 | 严重程度 | 解决方案 |
|----|-----|---------|---------|
| | | | |

## 4. 结论
□ 技术验证通过，可进入 MVP 开发
□ 技术验证部分通过，需解决问题后继续
□ 技术验证失败，需重新评估方案

## 5. 签字
技术负责人: ____________  日期: ____
```

---

## 3. V1：单元验证（持续）

### 3.1 单元测试规范

#### 测试文件组织

```
packages/plugins/@ale/{plugin}/
├── src/
│   └── server/
│       └── services/
│           └── gate-engine.ts
└── __tests__/
    └── unit/
        └── server/
            └── services/
                └── gate-engine.test.ts
```

#### 测试命名规范

```typescript
describe('GateEngine', () => {
  describe('evaluate', () => {
    it('should pass all gates when data is valid', async () => {});
    it('should fail G1 when schema validation fails', async () => {});
    it('should return partial results when gate throws error', async () => {});
  });
});
```

### 3.2 核心模块测试用例

#### 门禁引擎测试

```typescript
// __tests__/unit/server/services/gate-engine.test.ts

describe('GateEngine', () => {
  let gateEngine: GateEngine;
  
  beforeEach(() => {
    gateEngine = new GateEngine(mockApp);
  });

  describe('G1_STRUCTURAL Gate', () => {
    it('TC-V1-G1-001: should pass with valid data matching schema', async () => {
      const context: GateContext = {
        subject: { name: 'Test', value: 123 },
        actor: { id: 1 },
        action: 'create',
        metadata: {
          schema: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string' },
              value: { type: 'number' },
            },
          },
        },
      };

      const result = await gateEngine.evaluateSingle('G1_STRUCTURAL', context);

      expect(result.passed).toBe(true);
      expect(result.gate).toBe('G1_STRUCTURAL');
    });

    it('TC-V1-G1-002: should fail when required field is missing', async () => {
      const context: GateContext = {
        subject: { value: 123 }, // missing 'name'
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

      const result = await gateEngine.evaluateSingle('G1_STRUCTURAL', context);

      expect(result.passed).toBe(false);
      expect(result.severity).toBe('error');
    });

    it('TC-V1-G1-003: should pass when no schema defined', async () => {
      const context: GateContext = {
        subject: { anything: 'goes' },
        actor: { id: 1 },
        action: 'create',
        metadata: {},
      };

      const result = await gateEngine.evaluateSingle('G1_STRUCTURAL', context);

      expect(result.passed).toBe(true);
    });
  });

  describe('G3_EVIDENCE Gate', () => {
    it('TC-V1-G3-001: should pass when all required evidence provided', async () => {
      const context: GateContext = {
        subject: {},
        actor: { id: 1 },
        action: 'submit',
        evidence: [
          { type: 'risk_assessment', content: {} },
          { type: 'approval_doc', content: {} },
        ],
        metadata: {
          requiredEvidence: ['risk_assessment', 'approval_doc'],
        },
      };

      const result = await gateEngine.evaluateSingle('G3_EVIDENCE', context);

      expect(result.passed).toBe(true);
    });

    it('TC-V1-G3-002: should fail when evidence is missing', async () => {
      const context: GateContext = {
        subject: {},
        actor: { id: 1 },
        action: 'submit',
        evidence: [{ type: 'risk_assessment', content: {} }],
        metadata: {
          requiredEvidence: ['risk_assessment', 'approval_doc'],
        },
      };

      const result = await gateEngine.evaluateSingle('G3_EVIDENCE', context);

      expect(result.passed).toBe(false);
      expect(result.details.missing).toContain('approval_doc');
    });
  });

  describe('evaluate (multiple gates)', () => {
    it('TC-V1-GE-001: should evaluate all specified gates', async () => {
      const context: GateContext = {
        subject: { name: 'Test' },
        actor: { id: 1, roles: ['admin'] },
        action: 'create',
        evidence: [{ type: 'doc', content: {} }],
        metadata: {
          schema: { type: 'object', properties: { name: { type: 'string' } } },
          requiredEvidence: ['doc'],
          requiredRoles: ['admin'],
        },
      };

      const report = await gateEngine.evaluate(
        context,
        ['G1_STRUCTURAL', 'G3_EVIDENCE', 'G6_EXECUTION']
      );

      expect(report.gates).toHaveLength(3);
      expect(report.passed).toBe(true);
    });

    it('TC-V1-GE-002: should stop on critical failure', async () => {
      // 配置某个门禁为 critical 失败
      const context: GateContext = {
        subject: {}, // 缺少必需字段
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

      const report = await gateEngine.evaluate(
        context,
        ['G1_STRUCTURAL', 'G3_EVIDENCE', 'G6_EXECUTION']
      );

      expect(report.passed).toBe(false);
      // G1 失败后应该继续还是停止取决于配置
    });
  });
});
```

#### ChangeSet 服务测试

```typescript
// __tests__/unit/server/services/changeset-service.test.ts

describe('ChangeSetService', () => {
  let changeSetService: ChangeSetService;
  let mockGateEngine: jest.Mocked<GateEngine>;
  let mockDb: jest.Mocked<Database>;

  beforeEach(() => {
    mockGateEngine = createMockGateEngine();
    mockDb = createMockDatabase();
    changeSetService = new ChangeSetService(mockApp);
  });

  describe('create', () => {
    it('TC-V1-CS-001: should create changeset with draft status', async () => {
      const spec = {
        title: 'Test Change',
        type: 'config' as const,
        changes: { key: 'value' },
        createdBy: 1,
      };

      const result = await changeSetService.create(spec);

      expect(result.status).toBe('draft');
      expect(result.title).toBe('Test Change');
      expect(result.changes).toEqual({ key: 'value' });
    });
  });

  describe('submit', () => {
    it('TC-V1-CS-002: should submit changeset and run gates', async () => {
      mockGateEngine.evaluate.mockResolvedValue({
        id: 'report-1',
        timestamp: new Date(),
        gates: [],
        passed: true,
        summary: 'All gates passed',
      });

      const changeset = await changeSetService.create({
        title: 'Test',
        type: 'config',
        changes: {},
        createdBy: 1,
      });

      const result = await changeSetService.submit(changeset.id, { id: 1 });

      expect(result.gateReport.passed).toBe(true);
      expect(result.changeset.status).toBe('pending');
    });

    it('TC-V1-CS-003: should reject submit when gates fail', async () => {
      mockGateEngine.evaluate.mockResolvedValue({
        id: 'report-1',
        timestamp: new Date(),
        gates: [{ gate: 'G1', passed: false, message: 'Failed', severity: 'error' }],
        passed: false,
        summary: 'G1 failed',
      });

      const changeset = await changeSetService.create({
        title: 'Test',
        type: 'config',
        changes: {},
        createdBy: 1,
      });

      const result = await changeSetService.submit(changeset.id, { id: 1 });

      expect(result.gateReport.passed).toBe(false);
      expect(result.changeset.status).toBe('draft'); // 保持 draft
      expect(result.nextAction).toBe('fix_issues');
    });
  });

  describe('approve', () => {
    it('TC-V1-CS-004: should approve pending changeset', async () => {
      // 先创建并提交
      const changeset = await createAndSubmitChangeset();

      const result = await changeSetService.approve(changeset.id, { id: 2, roles: ['approver'] });

      expect(result.status).toBe('approved');
      expect(result.approved_by).toBe(2);
    });

    it('TC-V1-CS-005: should reject approve for non-pending changeset', async () => {
      const changeset = await changeSetService.create({
        title: 'Test',
        type: 'config',
        changes: {},
        createdBy: 1,
      });

      await expect(
        changeSetService.approve(changeset.id, { id: 2 })
      ).rejects.toThrow('ChangeSet is not pending approval');
    });
  });

  describe('publish', () => {
    it('TC-V1-CS-006: should publish approved changeset with version', async () => {
      const changeset = await createApprovedChangeset();

      const result = await changeSetService.publish(changeset.id, { id: 2 });

      expect(result.success).toBe(true);
      expect(result.version).toMatch(/^v-/);
      expect(result.changeset.status).toBe('published');
    });
  });

  describe('rollback', () => {
    it('TC-V1-CS-007: should rollback published changeset', async () => {
      const changeset = await createPublishedChangeset();

      const result = await changeSetService.rollback(changeset.id, { id: 2 });

      expect(result.success).toBe(true);
      expect(result.changeset.status).toBe('rolled_back');
    });
  });
});
```

### 3.3 覆盖率要求

| 模块 | 行覆盖率 | 分支覆盖率 | 函数覆盖率 |
|-----|---------|----------|----------|
| @ale/core | ≥80% | ≥70% | ≥80% |
| @ale/gate-engine | ≥90% | ≥85% | ≥90% |
| @ale/changeset | ≥85% | ≥80% | ≥85% |
| @ale/ontology | ≥80% | ≥70% | ≥80% |
| @ale/disposal-order | ≥75% | ≥70% | ≥75% |

---

## 4. V2：集成验证（每个 Sprint）

### 4.1 API 集成测试

#### 测试环境配置

```typescript
// __tests__/integration/setup.ts

import { createTestApp, destroyTestApp } from '@nocobase/test';

let app: Application;
let agent: SuperTest;

beforeAll(async () => {
  app = await createTestApp({
    plugins: [
      '@ale/core',
      '@ale/ontology',
      '@ale/gate-engine',
      '@ale/changeset',
      '@ale/disposal-order',
    ],
  });
  agent = request(app.callback());
});

afterAll(async () => {
  await destroyTestApp(app);
});

export { app, agent };
```

#### ChangeSet API 测试

```typescript
// __tests__/integration/api/changeset.test.ts

describe('ChangeSet API', () => {
  describe('POST /api/ale/changesets', () => {
    it('TC-V2-CS-001: should create changeset', async () => {
      const response = await agent
        .post('/api/ale/changesets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Change',
          type: 'config',
          changes: { key: 'value' },
        })
        .expect(200);

      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.status).toBe('draft');
    });

    it('TC-V2-CS-002: should reject without auth', async () => {
      await agent
        .post('/api/ale/changesets')
        .send({ title: 'Test', type: 'config', changes: {} })
        .expect(401);
    });
  });

  describe('POST /api/ale/changesets/:id/submit', () => {
    it('TC-V2-CS-003: should submit and run gates', async () => {
      // 创建 changeset
      const createRes = await agent
        .post('/api/ale/changesets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Test', type: 'config', changes: { key: 'value' } });

      const changesetId = createRes.body.data.id;

      // 提交
      const submitRes = await agent
        .post(`/api/ale/changesets/${changesetId}/submit`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(submitRes.body.data.gateReport).toBeDefined();
      expect(submitRes.body.data.gateReport.gates).toBeInstanceOf(Array);
    });
  });

  describe('Full lifecycle', () => {
    it('TC-V2-CS-004: should complete full lifecycle', async () => {
      // 1. Create
      const createRes = await agent
        .post('/api/ale/changesets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Full Lifecycle Test', type: 'config', changes: {} });
      
      const id = createRes.body.data.id;

      // 2. Submit
      await agent
        .post(`/api/ale/changesets/${id}/submit`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // 3. Approve
      await agent
        .post(`/api/ale/changesets/${id}/approve`)
        .set('Authorization', `Bearer ${approverToken}`)
        .expect(200);

      // 4. Publish
      const publishRes = await agent
        .post(`/api/ale/changesets/${id}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(publishRes.body.data.version).toBeDefined();

      // 5. Rollback
      await agent
        .post(`/api/ale/changesets/${id}/rollback`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});
```

#### 处置单 API 测试

```typescript
// __tests__/integration/api/disposal-order.test.ts

describe('Disposal Order API', () => {
  describe('POST /api/disposal_orders:assign', () => {
    it('TC-V2-DO-001: should assign order with gate check', async () => {
      // 创建处置单
      const order = await createTestOrder();

      // 分配
      const response = await agent
        .post(`/api/disposal_orders/${order.id}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ assignee_id: operatorUserId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.gateReport.passed).toBe(true);

      // 验证状态变更
      const updatedOrder = await getOrder(order.id);
      expect(updatedOrder.status).toBe('assigned');
      expect(updatedOrder.assigned_to).toBe(operatorUserId);
    });

    it('TC-V2-DO-002: should reject assign without permission', async () => {
      const order = await createTestOrder();

      await agent
        .post(`/api/disposal_orders/${order.id}/assign`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ assignee_id: operatorUserId })
        .expect(403);
    });
  });

  describe('State machine transitions', () => {
    it('TC-V2-DO-003: should follow valid state transitions', async () => {
      const order = await createTestOrder();

      // pending -> assigned
      await agent
        .post(`/api/disposal_orders/${order.id}/assign`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ assignee_id: operatorUserId })
        .expect(200);

      // assigned -> proposal_submitted
      await agent
        .post(`/api/disposal_orders/${order.id}/submitProposal`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          proposed_action: 'refund',
          evidence: [{ type: 'risk_assessment', content: { level: 'low' } }],
        })
        .expect(200);

      // proposal_submitted -> approved
      await agent
        .post(`/api/disposal_orders/${order.id}/approve`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ approval_notes: 'Approved' })
        .expect(200);

      // approved -> resolved
      await agent
        .post(`/api/disposal_orders/${order.id}/execute`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(200);

      // 验证最终状态
      const finalOrder = await getOrder(order.id);
      expect(finalOrder.status).toBe('resolved');
    });

    it('TC-V2-DO-004: should reject invalid state transition', async () => {
      const order = await createTestOrder(); // status: pending

      // 尝试直接 approve（应该失败，因为不是 proposal_submitted 状态）
      await agent
        .post(`/api/disposal_orders/${order.id}/approve`)
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(400);
    });
  });
});
```

### 4.2 契约测试

```typescript
// __tests__/integration/contracts/gate-report.contract.ts

import { z } from 'zod';

// 定义 GateReport 契约
const GateResultSchema = z.object({
  gate: z.string(),
  passed: z.boolean(),
  message: z.string(),
  severity: z.enum(['info', 'warning', 'error', 'critical']),
  details: z.unknown().optional(),
  timestamp: z.string().datetime(),
});

const GateReportSchema = z.object({
  id: z.string(),
  timestamp: z.string().datetime(),
  gates: z.array(GateResultSchema),
  passed: z.boolean(),
  summary: z.string(),
});

describe('GateReport Contract', () => {
  it('TC-V2-CT-001: should conform to contract schema', async () => {
    const response = await agent
      .post('/api/ale/changesets/test-id/submit')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const gateReport = response.body.data.gateReport;
    
    // 验证契约
    const parseResult = GateReportSchema.safeParse(gateReport);
    expect(parseResult.success).toBe(true);
  });
});
```

---

## 5. V3：系统验证（里程碑）

### 5.1 端到端测试

```typescript
// __tests__/e2e/disposal-order-flow.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Disposal Order E2E Flow', () => {
  test('TC-V3-E2E-001: Complete disposal order lifecycle', async ({ page }) => {
    // 1. 登录
    await page.goto('/login');
    await page.fill('[data-testid="username"]', 'admin');
    await page.fill('[data-testid="password"]', 'admin123');
    await page.click('[data-testid="login-btn"]');
    await expect(page).toHaveURL('/dashboard');

    // 2. 创建处置单
    await page.goto('/disposal-orders');
    await page.click('[data-testid="create-btn"]');
    await page.fill('[data-testid="order-no"]', 'DO-2025-001');
    await page.fill('[data-testid="delay-reason"]', '物流延迟');
    await page.selectOption('[data-testid="risk-level"]', 'medium');
    await page.click('[data-testid="submit-btn"]');
    await expect(page.locator('[data-testid="toast-success"]')).toBeVisible();

    // 3. 分配处置单
    await page.click('[data-testid="assign-btn"]');
    await page.selectOption('[data-testid="assignee"]', 'operator1');
    await page.click('[data-testid="confirm-assign"]');
    await expect(page.locator('[data-testid="status"]')).toHaveText('已分配');

    // 4. 提交处置方案（切换用户）
    await loginAs(page, 'operator1');
    await page.goto('/disposal-orders');
    await page.click('[data-testid="order-DO-2025-001"]');
    await page.click('[data-testid="submit-proposal-btn"]');
    await page.fill('[data-testid="proposed-action"]', '全额退款');
    await page.click('[data-testid="add-evidence"]');
    await page.fill('[data-testid="evidence-content"]', '风险评估完成');
    await page.click('[data-testid="submit-proposal"]');
    await expect(page.locator('[data-testid="status"]')).toHaveText('待审批');

    // 5. 审批（切换用户）
    await loginAs(page, 'manager');
    await page.goto('/approvals');
    await page.click('[data-testid="order-DO-2025-001"]');
    await page.click('[data-testid="approve-btn"]');
    await expect(page.locator('[data-testid="status"]')).toHaveText('已审批');

    // 6. 执行
    await page.click('[data-testid="execute-btn"]');
    await expect(page.locator('[data-testid="status"]')).toHaveText('已完成');

    // 7. 验证审计日志
    await page.goto('/audit-logs');
    await page.fill('[data-testid="filter-subject"]', 'DO-2025-001');
    await page.click('[data-testid="search"]');
    const logs = page.locator('[data-testid="audit-log-row"]');
    await expect(logs).toHaveCount(5); // create, assign, submit, approve, execute
  });
});
```

### 5.2 性能测试

#### 负载测试脚本

```javascript
// __tests__/performance/gate-engine-load.js (k6)

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // 预热
    { duration: '1m', target: 50 },   // 加压
    { duration: '2m', target: 100 },  // 峰值
    { duration: '30s', target: 0 },   // 降压
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:12000';

export default function () {
  // 创建 ChangeSet
  const createRes = http.post(
    `${BASE_URL}/api/ale/changesets`,
    JSON.stringify({
      title: `Load Test ${Date.now()}`,
      type: 'config',
      changes: { key: `value-${Date.now()}` },
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${__ENV.TOKEN}`,
      },
    }
  );

  check(createRes, {
    'create status is 200': (r) => r.status === 200,
  });

  const changesetId = JSON.parse(createRes.body).data.id;

  // 提交（触发门禁评估）
  const submitRes = http.post(
    `${BASE_URL}/api/ale/changesets/${changesetId}/submit`,
    null,
    {
      headers: {
        'Authorization': `Bearer ${__ENV.TOKEN}`,
      },
    }
  );

  check(submitRes, {
    'submit status is 200': (r) => r.status === 200,
    'gate evaluation completed': (r) => {
      const body = JSON.parse(r.body);
      return body.data.gateReport !== undefined;
    },
  });

  sleep(1);
}
```

#### 性能指标

| 场景 | 指标 | 目标值 | 测量方法 |
|-----|-----|-------|---------|
| 门禁评估 | P50 延迟 | ≤100ms | k6 |
| 门禁评估 | P95 延迟 | ≤200ms | k6 |
| 门禁评估 | P99 延迟 | ≤500ms | k6 |
| API 响应 | P50 延迟 | ≤100ms | k6 |
| API 响应 | P99 延迟 | ≤500ms | k6 |
| 吞吐量 | 每秒请求 | ≥100 RPS | k6 |
| 错误率 | 失败率 | ≤1% | k6 |
| 数据库 | 查询延迟 P99 | ≤50ms | APM |

### 5.3 安全测试

#### 安全测试清单

```markdown
## 安全测试清单

### 认证与授权
- [ ] TC-V3-SEC-001: 未认证用户无法访问 ALE API
- [ ] TC-V3-SEC-002: 低权限用户无法执行高权限操作
- [ ] TC-V3-SEC-003: 跨 Space 访问被正确拦截
- [ ] TC-V3-SEC-004: Token 过期后无法访问

### 数据安全
- [ ] TC-V3-SEC-005: SQL 注入防护有效
- [ ] TC-V3-SEC-006: XSS 防护有效
- [ ] TC-V3-SEC-007: 敏感数据在日志中脱敏
- [ ] TC-V3-SEC-008: 敏感字段加密存储

### 审计
- [ ] TC-V3-SEC-009: 所有敏感操作有审计记录
- [ ] TC-V3-SEC-010: 审计日志不可篡改
- [ ] TC-V3-SEC-011: 审计日志可按时间/用户/资源查询

### 依赖安全
- [ ] TC-V3-SEC-012: 无高危 CVE 漏洞
- [ ] TC-V3-SEC-013: 依赖版本符合安全策略
```

#### 渗透测试场景

```typescript
// __tests__/security/penetration.test.ts

describe('Security Penetration Tests', () => {
  describe('SQL Injection', () => {
    it('TC-V3-SEC-005: should prevent SQL injection', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      
      const response = await agent
        .get(`/api/disposal_orders?filter[order_no]=${encodeURIComponent(maliciousInput)}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // 不应该导致错误或数据泄露
      expect(response.status).not.toBe(500);
      // 表应该仍然存在
      const usersExist = await checkTableExists('users');
      expect(usersExist).toBe(true);
    });
  });

  describe('Authorization Bypass', () => {
    it('TC-V3-SEC-002: should prevent privilege escalation', async () => {
      // 使用 operator token 尝试审批
      const order = await createPendingApprovalOrder();

      const response = await agent
        .post(`/api/disposal_orders/${order.id}/approve`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({});

      expect(response.status).toBe(403);
    });

    it('TC-V3-SEC-003: should prevent cross-space access', async () => {
      // 在 Space A 创建订单
      const orderInSpaceA = await createOrderInSpace('space-a');

      // 使用 Space B 的 token 尝试访问
      const response = await agent
        .get(`/api/disposal_orders/${orderInSpaceA.id}`)
        .set('Authorization', `Bearer ${spaceBToken}`)
        .set('X-ALE-Space', 'space-b');

      expect(response.status).toBe(404); // 或 403
    });
  });
});
```

---

## 6. V4：验收验证（发布前）

### 6.1 用户验收测试 (UAT)

#### UAT 场景

```markdown
## UAT 场景清单

### 场景 1：延迟订单处置完整流程
**角色**: 运营主管、客服专员

**步骤**:
1. 运营主管登录系统
2. 查看延迟订单列表
3. 选择一个订单，分配给客服专员
4. 客服专员登录，查看待处理订单
5. 提交处置方案（选择"延期发货"）
6. 上传证据（客户沟通记录）
7. 运营主管审批处置方案
8. 系统执行处置
9. 验证订单状态为"已完成"
10. 验证审计日志完整

**验收标准**:
- [ ] 所有步骤可正常执行
- [ ] 门禁检查正常工作
- [ ] 状态转换正确
- [ ] 审计日志完整

---

### 场景 2：ChangeSet 审批流程
**角色**: 系统管理员、技术负责人

**步骤**:
1. 管理员创建配置变更
2. 提交变更，查看门禁报告
3. 门禁通过后进入待审批
4. 技术负责人审批变更
5. 发布变更
6. 验证变更生效
7. 执行回滚
8. 验证回滚成功

**验收标准**:
- [ ] ChangeSet 生命周期完整
- [ ] 门禁报告清晰可读
- [ ] 版本号正确生成
- [ ] 回滚功能正常

---

### 场景 3：权限隔离验证
**角色**: 不同权限用户

**步骤**:
1. 以 viewer 角色登录
2. 尝试创建处置单（应该失败）
3. 以 operator 角色登录
4. 尝试审批（应该失败）
5. 以 manager 角色登录
6. 审批操作成功

**验收标准**:
- [ ] 权限检查正确
- [ ] 错误提示友好
- [ ] 无越权漏洞
```

#### UAT 签字表

```markdown
## UAT 签字确认

### 项目信息
- 项目名称: AIPOS ALE
- 版本: MVP v0.1.0
- UAT 日期: ____

### 验收结果

| 场景 | 执行人 | 结果 | 备注 |
|-----|-------|-----|-----|
| 延迟订单处置 | | ✅/❌ | |
| ChangeSet 审批 | | ✅/❌ | |
| 权限隔离验证 | | ✅/❌ | |

### 发现的问题

| ID | 描述 | 严重程度 | 处理状态 |
|----|-----|---------|---------|
| | | | |

### 验收结论
□ 验收通过，可以发布
□ 验收通过（有条件），需修复后发布
□ 验收不通过，需重新测试

### 签字
业务方代表: ____________  日期: ____
产品负责人: ____________  日期: ____
技术负责人: ____________  日期: ____
```

### 6.2 发布验证清单

```markdown
## 发布验证清单

### 环境验证
- [ ] Staging 环境测试通过
- [ ] Production 配置已更新
- [ ] 数据库迁移脚本已验证
- [ ] 监控告警已配置

### 功能验证
- [ ] 冒烟测试通过
- [ ] 核心流程可用
- [ ] 门禁引擎正常
- [ ] 审计日志正常

### 回滚验证
- [ ] 回滚脚本已准备
- [ ] 回滚流程已演练
- [ ] 数据回滚方案已确认

### 文档验证
- [ ] API 文档已更新
- [ ] 用户手册已更新
- [ ] 运维手册已更新
- [ ] 变更日志已更新

### 通知
- [ ] 发布通知已发送
- [ ] 用户培训已完成
- [ ] 支持团队已就位
```

---

## 7. 验证工具与基础设施

### 7.1 测试工具链

| 类型 | 工具 | 用途 |
|-----|-----|-----|
| 单元测试 | Vitest | 快速单元测试 |
| 集成测试 | Supertest | API 测试 |
| E2E 测试 | Playwright | 端到端测试 |
| 性能测试 | k6 | 负载测试 |
| 安全扫描 | Snyk | 依赖漏洞 |
| 代码覆盖 | c8 | 覆盖率统计 |
| 契约测试 | Zod | Schema 验证 |

### 7.2 CI/CD 集成

```yaml
# .github/workflows/test.yml

name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'yarn'
      - run: yarn install
      - run: yarn test:unit
      - uses: codecov/codecov-action@v3

  integration-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
      redis:
        image: redis:7
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: yarn install
      - run: yarn test:integration

  e2e-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: yarn install
      - run: npx playwright install
      - run: yarn test:e2e

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### 7.3 测试环境

| 环境 | 用途 | 配置 |
|-----|-----|-----|
| Local | 开发测试 | Docker Compose |
| CI | 自动化测试 | GitHub Actions |
| Staging | 集成测试 | 与生产同配置 |
| Production | 冒烟测试 | 生产环境 |

---

## 8. 验证度量与报告

### 8.1 质量指标看板

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ALE 质量看板                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  测试覆盖率          构建状态            安全状态                        │
│  ┌─────────┐        ┌─────────┐        ┌─────────┐                     │
│  │  85%    │        │  ✓ PASS │        │ 0 HIGH  │                     │
│  │ ████████│        │         │        │ 2 MED   │                     │
│  └─────────┘        └─────────┘        └─────────┘                     │
│                                                                         │
│  性能指标                                                               │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │ API P99: 423ms  │ Gate P99: 156ms  │ Error Rate: 0.1%       │       │
│  └─────────────────────────────────────────────────────────────┘       │
│                                                                         │
│  测试趋势                                                               │
│  100% ┤                                    ●                            │
│   80% ┤              ●        ●    ●                                   │
│   60% ┤     ●   ●                                                      │
│   40% ┤ ●                                                              │
│       └─────┴────┴────┴────┴────┴────→                                │
│        W1   W2   W3   W4   W5   W6                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.2 验证报告模板

```markdown
# ALE 验证报告

## 1. 报告概要
- 报告日期: ____
- 验证阶段: MVP / P1 / P2 / P3
- 报告人: ____

## 2. 验证摘要

| 验证类型 | 用例数 | 通过 | 失败 | 阻塞 | 通过率 |
|---------|-------|-----|-----|-----|-------|
| 单元测试 | | | | | |
| 集成测试 | | | | | |
| E2E 测试 | | | | | |
| 性能测试 | | | | | |
| 安全测试 | | | | | |

## 3. 覆盖率报告

| 模块 | 行覆盖 | 分支覆盖 | 函数覆盖 | 达标 |
|-----|-------|---------|---------|-----|
| @ale/core | | | | ✅/❌ |
| @ale/gate-engine | | | | ✅/❌ |
| @ale/changeset | | | | ✅/❌ |
| @ale/ontology | | | | ✅/❌ |

## 4. 性能报告

| 指标 | 目标 | 实际 | 状态 |
|-----|-----|-----|-----|
| API P50 | ≤100ms | | |
| API P99 | ≤500ms | | |
| Gate P99 | ≤200ms | | |
| Throughput | ≥100 RPS | | |

## 5. 发现的问题

| ID | 描述 | 严重程度 | 状态 | 负责人 |
|----|-----|---------|-----|-------|
| | | | | |

## 6. 风险评估

| 风险 | 影响 | 缓解措施 |
|-----|-----|---------|
| | | |

## 7. 结论与建议

□ 验证通过，可进入下一阶段
□ 验证通过（有条件）
□ 验证不通过，需整改

## 8. 签字
QA 负责人: ____________  日期: ____
技术负责人: ____________  日期: ____
```

---

## 附录 A：测试用例索引

| 用例 ID | 用例名称 | 类型 | 优先级 |
|--------|---------|-----|-------|
| TC-V0-001 | NocoBase 插件生命周期验证 | 技术验证 | P0 |
| TC-V0-002 | Collection Manager 扩展验证 | 技术验证 | P0 |
| TC-V0-003 | Workflow 自定义节点验证 | 技术验证 | P0 |
| TC-V0-004 | ACL 细粒度权限验证 | 技术验证 | P0 |
| TC-V1-G1-001 | G1 门禁通过有效数据 | 单元测试 | P0 |
| TC-V1-G1-002 | G1 门禁拒绝缺失必填字段 | 单元测试 | P0 |
| TC-V1-G3-001 | G3 门禁通过完整证据 | 单元测试 | P0 |
| TC-V1-CS-001 | ChangeSet 创建 draft 状态 | 单元测试 | P0 |
| TC-V2-CS-001 | ChangeSet API 创建 | 集成测试 | P0 |
| TC-V2-DO-001 | 处置单分配带门禁 | 集成测试 | P0 |
| TC-V3-E2E-001 | 处置单完整生命周期 | E2E 测试 | P0 |
| TC-V3-SEC-001 | 未认证访问拦截 | 安全测试 | P0 |

---

**文档状态**：草案  
**最后更新**：2025年12月  
**下次评审**：M0 完成后
