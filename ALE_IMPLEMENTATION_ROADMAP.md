# ALE 实施路线图

## 版本信息

- **版本**: 1.0.0
- **创建日期**: 2024-12
- **状态**: 待执行

---

## 第一部分：资源目录

### 1.1 必读文档

在开始任何开发任务前，必须先阅读以下文档：

| 优先级 | 文档路径 | 说明 |
|--------|----------|------|
| P0 | `/workspace/ALE_DATA_MODEL_DESIGN.md` | 数据模型设计文档（核心） |
| P0 | `/workspace/ALE_DUAL_MODE_ARCHITECTURE.md` | 双态架构详细设计 |
| P0 | `/workspace/ALE_TECHNICAL_CHARTER.md` | 技术宪章 |
| P1 | `/workspace/ALE_PRODUCT_CHARTER.md` | 产品宪章 |
| P1 | `/workspace/ALE_FEASIBILITY_ASSESSMENT.md` | 可行性评估 |
| P1 | `/workspace/ALE_IMPLEMENTATION_PLAN.md` | 实施计划概述 |
| P2 | `/workspace/ALE_VERIFICATION_PLAN.md` | 验证计划 |
| P2 | `/workspace/AI_NATIVE_PLATFORM_DESIGN.md` | AI 原生平台设计参考 |
| P2 | `/workspace/PROJECT_SUMMARY.md` | 项目概述 |

### 1.2 已创建的代码资源

#### 1.2.1 @ALE/core - 核心模块

| 文件路径 | 说明 | 状态 |
|----------|------|------|
| `packages/plugins/@ALE/core/package.json` | 包配置 | ✅ 已创建 |
| `packages/plugins/@ALE/core/tsconfig.json` | TS 配置 | ✅ 已创建 |
| `packages/plugins/@ALE/core/src/server/types/index.ts` | 核心类型定义 | ✅ 已创建 |
| `packages/plugins/@ALE/core/src/server/collections/index.ts` | 数据表定义 | ✅ 已创建 |
| `packages/plugins/@ALE/core/src/server/plugin.ts` | 插件入口 | ✅ 已创建 |
| `packages/plugins/@ALE/core/src/server/index.ts` | 模块导出 | ✅ 已创建 |

#### 1.2.2 @ALE/intent-engine - 意图引擎

| 文件路径 | 说明 | 状态 |
|----------|------|------|
| `packages/plugins/@ALE/intent-engine/package.json` | 包配置 | ✅ 已创建 |
| `packages/plugins/@ALE/intent-engine/tsconfig.json` | TS 配置 | ✅ 已创建 |
| `packages/plugins/@ALE/intent-engine/src/server/services/intent-parser.ts` | 意图解析器 | ✅ 已创建 |
| `packages/plugins/@ALE/intent-engine/src/server/services/proposal-generator.ts` | 方案生成器 | ✅ 已创建 |
| `packages/plugins/@ALE/intent-engine/src/server/services/llm-providers/openai-provider.ts` | OpenAI 适配 | ✅ 已创建 |
| `packages/plugins/@ALE/intent-engine/src/server/plugin.ts` | 插件入口 | ✅ 已创建 |

#### 1.2.3 @ALE/ontology - 本体注册表

| 文件路径 | 说明 | 状态 |
|----------|------|------|
| `packages/plugins/@ALE/ontology/package.json` | 包配置 | ✅ 已创建 |
| `packages/plugins/@ALE/ontology/src/server/services/ontology-registry.ts` | 本体注册表服务 | ✅ 已创建 |
| `packages/plugins/@ALE/ontology/src/server/plugin.ts` | 插件入口 | ✅ 已创建 |

#### 1.2.4 @ALE/gate-engine - 门禁引擎

| 文件路径 | 说明 | 状态 |
|----------|------|------|
| `packages/plugins/@ALE/gate-engine/package.json` | 包配置 | ✅ 已创建 |
| `packages/plugins/@ALE/gate-engine/src/server/gates/base-gate.ts` | 门禁基类 | ✅ 已创建 |
| `packages/plugins/@ALE/gate-engine/src/server/gates/implementations/structural-gate.ts` | G1 结构门禁 | ✅ 已创建 |
| `packages/plugins/@ALE/gate-engine/src/server/gates/implementations/evidence-gate.ts` | G3 证据门禁 | ✅ 已创建 |
| `packages/plugins/@ALE/gate-engine/src/server/gates/implementations/execution-gate.ts` | G6 执行门禁 | ✅ 已创建 |
| `packages/plugins/@ALE/gate-engine/src/server/gates/implementations/evaluation-gate.ts` | G7 评估门禁 | ✅ 已创建 |
| `packages/plugins/@ALE/gate-engine/src/server/services/gate-engine.ts` | 门禁引擎服务 | ✅ 已创建 |
| `packages/plugins/@ALE/gate-engine/src/server/plugin.ts` | 插件入口 | ✅ 已创建 |

#### 1.2.5 @ALE/changeset - 变更集管理

| 文件路径 | 说明 | 状态 |
|----------|------|------|
| `packages/plugins/@ALE/changeset/package.json` | 包配置 | ✅ 已创建 |
| `packages/plugins/@ALE/changeset/src/server/services/changeset-service.ts` | 变更集服务 | ✅ 已创建 |
| `packages/plugins/@ALE/changeset/src/server/plugin.ts` | 插件入口 | ✅ 已创建 |

#### 1.2.6 @ALE/dynamic-view - 动态视图

| 文件路径 | 说明 | 状态 |
|----------|------|------|
| `packages/plugins/@ALE/dynamic-view/package.json` | 包配置 | ✅ 已创建 |
| `packages/plugins/@ALE/dynamic-view/src/server/services/view-generator.ts` | 视图生成器 | ✅ 已创建 |
| `packages/plugins/@ALE/dynamic-view/src/server/plugin.ts` | 插件入口 | ✅ 已创建 |

#### 1.2.7 @ALE/runtime-ui - 运行态 UI

| 文件路径 | 说明 | 状态 |
|----------|------|------|
| `packages/plugins/@ALE/runtime-ui/package.json` | 包配置 | ✅ 已创建 |
| `packages/plugins/@ALE/runtime-ui/src/server/services/runtime-ui-generator.ts` | 运行态 UI 生成器 | ✅ 已创建 |
| `packages/plugins/@ALE/runtime-ui/src/server/plugin.ts` | 插件入口 | ✅ 已创建 |

### 1.3 NocoBase 基础参考

| 文件路径 | 说明 |
|----------|------|
| `/workspace/my-nocobase-app/package.json` | NocoBase 1.8.31 版本配置 |
| `/workspace/my-nocobase-app/tsconfig.json` | TypeScript 配置 |
| `/workspace/my-nocobase-app/lerna.json` | Monorepo 配置 |
| `/workspace/docker-compose.yml` | Docker 环境配置 |

---

## 第二部分：工程实现模块

### 2.1 模块依赖关系

```
                          ┌─────────────┐
                          │  @ALE/core  │
                          │  (核心类型)  │
                          └──────┬──────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐    ┌───────────────────┐    ┌───────────────┐
│ @ALE/intent-  │    │   @ALE/ontology   │    │ @ALE/gate-    │
│    engine     │    │   (本体注册表)     │    │   engine      │
│ (意图引擎)     │    │                   │    │ (门禁引擎)     │
└───────┬───────┘    └─────────┬─────────┘    └───────┬───────┘
        │                      │                      │
        └──────────┬───────────┴──────────────────────┘
                   │
                   ▼
        ┌───────────────────┐
        │  @ALE/changeset   │
        │   (变更集管理)     │
        └─────────┬─────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌───────────────┐    ┌───────────────┐
│@ALE/dynamic-  │    │ @ALE/runtime- │
│    view       │    │      ui       │
│ (动态视图)     │    │ (运行态 UI)   │
└───────────────┘    └───────────────┘
```

### 2.2 模块功能矩阵

| 模块 | 态 | 核心功能 | 依赖 |
|------|-----|---------|------|
| @ALE/core | 共享 | 类型定义、数据表、基础服务 | NocoBase |
| @ALE/intent-engine | 构建态 | 意图解析、方案生成 | core, OpenAI |
| @ALE/ontology | 运行态 | 本体注册、版本管理 | core |
| @ALE/gate-engine | 控制面 | 门禁执行、报告生成 | core |
| @ALE/changeset | 桥接 | 变更集生命周期 | core, ontology, gate-engine |
| @ALE/dynamic-view | 构建态 | 预览生成、Schema/状态机图 | core |
| @ALE/runtime-ui | 运行态 | UI Schema 生成、Collection 注册 | core, ontology, gate-engine |

---

## 第三部分：核心方案

### 3.1 方案 A：基础框架搭建

**目标**: 完成插件基础设施和数据表创建

**范围**:
- 所有插件的依赖安装和编译配置
- 数据表同步和初始化
- 基础 API 路由注册

**验收标准**:
- [ ] 所有插件可正常编译
- [ ] 数据表成功创建
- [ ] 健康检查 API 可访问

### 3.2 方案 B：构建态核心流程

**目标**: 实现从意图到变更集的完整流程

**范围**:
- 意图解析和澄清
- 方案生成和迭代
- 动态预览生成
- 变更集创建

**验收标准**:
- [ ] 自然语言输入可解析为结构化意图
- [ ] 方案可生成并支持迭代修改
- [ ] Schema 图和状态机图可正常生成
- [ ] 变更集可从方案创建

### 3.3 方案 C：运行态核心流程

**目标**: 实现本体驱动的执行和 UI 生成

**范围**:
- 本体注册和管理
- 门禁执行链
- Collection 自动注册
- UI Schema 生成

**验收标准**:
- [ ] 本体可注册和查询
- [ ] 门禁可正常执行
- [ ] Collection 可从本体自动创建
- [ ] 列表/表单/详情视图可自动生成

### 3.4 方案 D：双态闭环

**目标**: 实现构建态到运行态的完整闭环

**范围**:
- 变更集审批流程
- 变更集发布
- 版本快照
- 回滚能力

**验收标准**:
- [ ] 变更集可提交审批
- [ ] 批准后可发布到本体
- [ ] 发布时创建版本快照
- [ ] 可回滚到历史版本

### 3.5 方案 E：MVP 场景验证

**目标**: 以"延迟订单处置"场景验证完整功能

**范围**:
- 创建处置单对象
- 定义处置状态机
- 配置门禁规则
- 端到端测试

**验收标准**:
- [ ] 通过自然语言创建处置单数据模型
- [ ] 状态机可正常流转
- [ ] 门禁可阻止非法操作
- [ ] 审计日志完整记录

---

## 第四部分：实施任务清单

### Phase 0: 环境准备 (Day 1)

#### TASK-P0-001: 环境检查和依赖安装

```yaml
任务ID: TASK-P0-001
名称: 环境检查和依赖安装
优先级: P0
预估时间: 2h
前置条件: 无

操作步骤:
  1. 读取资源:
     - /workspace/my-nocobase-app/package.json
     - /workspace/docker-compose.yml
  
  2. 执行命令:
     - cd /workspace/my-nocobase-app
     - yarn install
     - docker-compose up -d (启动 PostgreSQL/Redis)
  
  3. 验证:
     - yarn nocobase version
     - docker ps (确认容器运行)

输出产物:
  - 依赖安装成功
  - 数据库/Redis 运行正常

验收标准:
  - [ ] yarn install 无报错
  - [ ] NocoBase CLI 可用
  - [ ] PostgreSQL 连接正常
  - [ ] Redis 连接正常
```

#### TASK-P0-002: 插件包配置完善

```yaml
任务ID: TASK-P0-002
名称: 插件包配置完善
优先级: P0
预估时间: 2h
前置条件: TASK-P0-001

操作步骤:
  1. 读取资源:
     - /workspace/my-nocobase-app/packages/plugins/@ALE/*/package.json
     - /workspace/my-nocobase-app/packages/plugins/@ALE/*/tsconfig.json
  
  2. 补充缺失配置:
     - 添加 client 端入口文件
     - 完善 tsconfig references
     - 配置 eslint/prettier
  
  3. 创建根级 tsconfig.build.json
  
  4. 验证:
     - yarn build (各插件)

输出产物:
  - 完整的 TypeScript 配置
  - 构建脚本可用

验收标准:
  - [ ] tsc -b 编译无错误
  - [ ] 各插件 dist 目录生成
```

---

### Phase 1: 核心框架 (Day 2-4)

#### TASK-P1-001: @ALE/core 插件完善

```yaml
任务ID: TASK-P1-001
名称: @ALE/core 插件完善
优先级: P0
预估时间: 4h
前置条件: TASK-P0-002

操作步骤:
  1. 读取资源:
     - /workspace/my-nocobase-app/packages/plugins/@ALE/core/src/server/types/index.ts
     - /workspace/my-nocobase-app/packages/plugins/@ALE/core/src/server/collections/index.ts
     - /workspace/my-nocobase-app/packages/plugins/@ALE/core/src/server/plugin.ts
  
  2. 补充功能:
     - 添加 Zod schema 导出
     - 完善 Collection 索引定义
     - 添加数据库迁移支持
     - 添加种子数据初始化
  
  3. 添加客户端导出:
     - 创建 src/client/index.ts
     - 导出类型供前端使用
  
  4. 编写单元测试:
     - src/server/__tests__/collections.test.ts
     - src/server/__tests__/types.test.ts

输出产物:
  - 完善的 core 插件
  - 单元测试

验收标准:
  - [ ] 13 个数据表定义正确
  - [ ] 类型导出完整
  - [ ] 单元测试通过
```

#### TASK-P1-002: 数据库表同步

```yaml
任务ID: TASK-P1-002
名称: 数据库表同步
优先级: P0
预估时间: 2h
前置条件: TASK-P1-001

操作步骤:
  1. 读取资源:
     - /workspace/ALE_DATA_MODEL_DESIGN.md (数据表设计)
  
  2. 启动 NocoBase:
     - yarn dev
  
  3. 注册插件:
     - yarn pm add @ALE/core
     - yarn pm enable @ALE/core
  
  4. 同步数据库:
     - 检查表创建
     - 验证索引创建
     - 验证外键约束

输出产物:
  - 数据库表结构

验收标准:
  - [ ] 所有 ale_* 表已创建
  - [ ] 索引正确创建
  - [ ] 可通过 API 访问
```

#### TASK-P1-003: @ALE/gate-engine 完善

```yaml
任务ID: TASK-P1-003
名称: @ALE/gate-engine 完善
优先级: P0
预估时间: 4h
前置条件: TASK-P1-002

操作步骤:
  1. 读取资源:
     - /workspace/my-nocobase-app/packages/plugins/@ALE/gate-engine/src/server/gates/base-gate.ts
     - /workspace/my-nocobase-app/packages/plugins/@ALE/gate-engine/src/server/gates/implementations/*.ts
     - /workspace/my-nocobase-app/packages/plugins/@ALE/gate-engine/src/server/services/gate-engine.ts
  
  2. 补充门禁:
     - 实现 G2_SEMANTIC (语义门禁)
     - 实现 G4_PERMISSION (权限门禁)
     - 实现 G5_FLOW (流程门禁)
  
  3. 增强功能:
     - 添加门禁配置持久化
     - 添加门禁执行日志
     - 添加门禁指标收集
  
  4. 编写测试:
     - src/server/__tests__/gates/*.test.ts
     - src/server/__tests__/gate-engine.test.ts

输出产物:
  - 完整的 7 个门禁实现
  - 单元测试

验收标准:
  - [ ] G1-G7 门禁全部实现
  - [ ] 门禁可链式执行
  - [ ] 报告正确生成
```

#### TASK-P1-004: @ALE/ontology 完善

```yaml
任务ID: TASK-P1-004
名称: @ALE/ontology 完善
优先级: P0
预估时间: 4h
前置条件: TASK-P1-002

操作步骤:
  1. 读取资源:
     - /workspace/my-nocobase-app/packages/plugins/@ALE/ontology/src/server/services/ontology-registry.ts
     - /workspace/my-nocobase-app/packages/plugins/@ALE/ontology/src/server/plugin.ts
  
  2. 补充功能:
     - 添加版本比较功能
     - 添加本体验证服务
     - 添加本体搜索（语义标签）
     - 添加本体导入/导出（JSON/YAML）
  
  3. 增强 Collection 同步:
     - 支持字段增量更新
     - 支持字段类型迁移
     - 支持关系自动创建
  
  4. 编写测试:
     - src/server/__tests__/ontology-registry.test.ts

输出产物:
  - 完善的本体注册表
  - 单元测试

验收标准:
  - [ ] 本体 CRUD 正常
  - [ ] 版本管理正常
  - [ ] Collection 同步正常
```

#### TASK-P1-005: @ALE/changeset 完善

```yaml
任务ID: TASK-P1-005
名称: @ALE/changeset 完善
优先级: P0
预估时间: 4h
前置条件: TASK-P1-003, TASK-P1-004

操作步骤:
  1. 读取资源:
     - /workspace/my-nocobase-app/packages/plugins/@ALE/changeset/src/server/services/changeset-service.ts
     - /workspace/my-nocobase-app/packages/plugins/@ALE/changeset/src/server/plugin.ts
  
  2. 补充功能:
     - 添加变更集冲突检测
     - 添加变更集合并能力
     - 添加变更集依赖分析
     - 集成门禁引擎校验
  
  3. 增强发布流程:
     - 添加发布前门禁检查
     - 添加发布后验证
     - 添加部分回滚支持
  
  4. 集成 NocoBase Workflow:
     - 创建审批工作流模板
     - 添加工作流触发
  
  5. 编写测试:
     - src/server/__tests__/changeset-service.test.ts
     - src/server/__tests__/changeset-workflow.test.ts

输出产物:
  - 完善的变更集服务
  - 审批工作流集成
  - 单元测试

验收标准:
  - [ ] 变更集生命周期完整
  - [ ] 门禁检查集成
  - [ ] 回滚功能可用
```

---

### Phase 2: 构建态实现 (Day 5-7)

#### TASK-P2-001: @ALE/intent-engine LLM 集成

```yaml
任务ID: TASK-P2-001
名称: @ALE/intent-engine LLM 集成
优先级: P0
预估时间: 4h
前置条件: TASK-P1-001

操作步骤:
  1. 读取资源:
     - /workspace/my-nocobase-app/packages/plugins/@ALE/intent-engine/src/server/services/intent-parser.ts
     - /workspace/my-nocobase-app/packages/plugins/@ALE/intent-engine/src/server/services/llm-providers/openai-provider.ts
  
  2. 增强 LLM 集成:
     - 添加 Claude Provider
     - 添加本地模型 Provider (Ollama)
     - 添加 Provider 选择配置
     - 添加 API Key 安全存储
  
  3. 优化 Prompt:
     - 创建 prompts 目录
     - 实现 Prompt 模板管理
     - 添加少样本示例
  
  4. 添加缓存:
     - 实现意图解析结果缓存
     - 使用 Redis 存储

输出产物:
  - 多 LLM Provider 支持
  - Prompt 模板系统
  - 缓存机制

验收标准:
  - [ ] OpenAI/Claude 可正常调用
  - [ ] Prompt 模板可配置
  - [ ] 缓存减少重复调用
```

#### TASK-P2-002: 意图解析增强

```yaml
任务ID: TASK-P2-002
名称: 意图解析增强
优先级: P0
预估时间: 4h
前置条件: TASK-P2-001

操作步骤:
  1. 读取资源:
     - /workspace/my-nocobase-app/packages/plugins/@ALE/intent-engine/src/server/services/intent-parser.ts
     - /workspace/ALE_DUAL_MODE_ARCHITECTURE.md
  
  2. 增强解析能力:
     - 添加多轮对话支持
     - 添加上下文继承
     - 添加意图消歧
     - 添加实体识别增强
  
  3. 添加意图分类器:
     - 创建意图分类模型
     - 支持自定义意图类型
  
  4. 添加验证:
     - 意图结构验证
     - 意图完整性检查

输出产物:
  - 增强的意图解析器
  - 多轮对话支持

验收标准:
  - [ ] 多轮对话正常
  - [ ] 意图分类准确
  - [ ] 实体识别完整
```

#### TASK-P2-003: 方案生成增强

```yaml
任务ID: TASK-P2-003
名称: 方案生成增强
优先级: P0
预估时间: 4h
前置条件: TASK-P2-002, TASK-P1-004

操作步骤:
  1. 读取资源:
     - /workspace/my-nocobase-app/packages/plugins/@ALE/intent-engine/src/server/services/proposal-generator.ts
  
  2. 增强生成能力:
     - 添加复杂对象生成
     - 添加关系推断
     - 添加状态机自动生成
     - 添加规则推断
  
  3. 添加迭代支持:
     - 实现增量更新
     - 实现局部修改
     - 保留用户确认的部分
  
  4. 添加影响分析:
     - 依赖关系分析
     - 破坏性变更检测
     - 建议生成

输出产物:
  - 增强的方案生成器
  - 迭代更新支持
  - 影响分析

验收标准:
  - [ ] 复杂对象可生成
  - [ ] 迭代更新正常
  - [ ] 影响分析准确
```

#### TASK-P2-004: @ALE/dynamic-view 完善

```yaml
任务ID: TASK-P2-004
名称: @ALE/dynamic-view 完善
优先级: P0
预估时间: 4h
前置条件: TASK-P2-003

操作步骤:
  1. 读取资源:
     - /workspace/my-nocobase-app/packages/plugins/@ALE/dynamic-view/src/server/services/view-generator.ts
     - /workspace/my-nocobase-app/packages/plugins/@ALE/dynamic-view/src/server/plugin.ts
  
  2. 增强预览生成:
     - 添加实时预览 WebSocket 支持
     - 添加预览差异对比
     - 添加预览动画效果
  
  3. 增强图生成:
     - 优化 Schema 图布局算法
     - 添加状态机图动画
     - 添加数据流图生成
  
  4. 添加 Mock 数据增强:
     - 支持自定义 Mock 规则
     - 支持关联数据生成

输出产物:
  - 增强的视图生成器
  - 实时预览支持

验收标准:
  - [ ] 预览实时更新
  - [ ] 图布局美观
  - [ ] Mock 数据真实
```

---

### Phase 3: 运行态实现 (Day 8-10)

#### TASK-P3-001: @ALE/runtime-ui 完善

```yaml
任务ID: TASK-P3-001
名称: @ALE/runtime-ui 完善
优先级: P0
预估时间: 4h
前置条件: TASK-P1-004

操作步骤:
  1. 读取资源:
     - /workspace/my-nocobase-app/packages/plugins/@ALE/runtime-ui/src/server/services/runtime-ui-generator.ts
     - /workspace/my-nocobase-app/packages/plugins/@ALE/runtime-ui/src/server/plugin.ts
  
  2. 增强 UI Schema 生成:
     - 添加更多视图类型 (Kanban, Calendar, Chart)
     - 添加自定义组件映射
     - 添加响应式布局
  
  3. 增强 Collection 注册:
     - 添加增量更新支持
     - 添加字段迁移
     - 添加数据迁移
  
  4. 添加菜单生成:
     - 自动生成菜单结构
     - 支持菜单分组
     - 支持权限控制

输出产物:
  - 完善的运行态 UI 生成器
  - 菜单自动生成

验收标准:
  - [ ] 多视图类型支持
  - [ ] Collection 增量更新
  - [ ] 菜单自动生成
```

#### TASK-P3-002: 门禁运行时集成

```yaml
任务ID: TASK-P3-002
名称: 门禁运行时集成
优先级: P0
预估时间: 4h
前置条件: TASK-P1-003, TASK-P3-001

操作步骤:
  1. 读取资源:
     - /workspace/my-nocobase-app/packages/plugins/@ALE/gate-engine/src/server/plugin.ts
  
  2. 集成数据操作钩子:
     - beforeCreate 门禁检查
     - beforeUpdate 门禁检查
     - beforeDestroy 门禁检查
     - afterAll 评估门禁
  
  3. 添加 Action 集成:
     - 自定义 Action 门禁
     - 批量操作门禁
     - 审批操作门禁
  
  4. 添加 UI 反馈:
     - 门禁失败提示
     - 门禁警告提示
     - 门禁报告展示

输出产物:
  - 门禁运行时集成
  - UI 反馈

验收标准:
  - [ ] 数据操作自动检查门禁
  - [ ] 门禁失败正确阻断
  - [ ] UI 正确展示结果
```

#### TASK-P3-003: 审计和证据系统

```yaml
任务ID: TASK-P3-003
名称: 审计和证据系统
优先级: P1
预估时间: 4h
前置条件: TASK-P3-002

操作步骤:
  1. 读取资源:
     - /workspace/ALE_DATA_MODEL_DESIGN.md (ale_audit_logs, ale_evidences)
  
  2. 实现审计服务:
     - 创建 AuditService
     - 实现操作记录
     - 实现追踪链 (correlationId)
  
  3. 实现证据服务:
     - 创建 EvidenceService
     - 实现证据收集
     - 实现证据验证
  
  4. 集成到门禁:
     - 证据门禁使用 EvidenceService
     - 所有门禁结果记录审计
  
  5. 添加查询 API:
     - 审计日志查询
     - 证据查询
     - 追踪链查询

输出产物:
  - 审计服务
  - 证据服务
  - 查询 API

验收标准:
  - [ ] 所有操作有审计记录
  - [ ] 证据可收集和验证
  - [ ] 追踪链完整
```

---

### Phase 4: 前端实现 (Day 11-14)

#### TASK-P4-001: 构建态 Studio UI

```yaml
任务ID: TASK-P4-001
名称: 构建态 Studio UI
优先级: P0
预估时间: 8h
前置条件: TASK-P2-004

操作步骤:
  1. 读取资源:
     - /workspace/ALE_DUAL_MODE_ARCHITECTURE.md (前端架构)
  
  2. 创建 Studio 页面:
     - packages/plugins/@ALE/dynamic-view/src/client/
     - 创建对话界面组件
     - 创建预览面板组件
     - 创建变更摘要组件
  
  3. 实现核心组件:
     - ChatInterface: 对话输入
     - ProposalPreview: 方案预览
     - SchemaGraph: ER 图 (使用 ReactFlow)
     - StateMachineGraph: 状态机图
     - ImpactAnalysis: 影响分析
     - GatePreCheck: 门禁预检
  
  4. 实现状态管理:
     - 使用 zustand 或 jotai
     - 实现实时更新

输出产物:
  - 构建态 Studio UI
  - 核心预览组件

验收标准:
  - [ ] 对话界面可用
  - [ ] 预览实时更新
  - [ ] 图可交互
```

#### TASK-P4-002: Schema/状态机图组件

```yaml
任务ID: TASK-P4-002
名称: Schema/状态机图组件
优先级: P0
预估时间: 6h
前置条件: TASK-P4-001

操作步骤:
  1. 安装依赖:
     - reactflow
     - @reactflow/node-types
     - dagre (布局算法)
  
  2. 实现 Schema 图:
     - 自定义 ObjectNode 组件
     - 自定义 RelationEdge 组件
     - 实现自动布局
     - 实现拖拽编辑
  
  3. 实现状态机图:
     - 自定义 StateNode 组件
     - 自定义 TransitionEdge 组件
     - 实现动画效果
  
  4. 添加交互:
     - 节点点击详情
     - 边点击编辑
     - 缩放和平移

输出产物:
  - Schema 图组件
  - 状态机图组件

验收标准:
  - [ ] 图自动布局
  - [ ] 交互流畅
  - [ ] 编辑功能可用
```

#### TASK-P4-003: 运行态 UI 增强

```yaml
任务ID: TASK-P4-003
名称: 运行态 UI 增强
优先级: P1
预估时间: 4h
前置条件: TASK-P3-001

操作步骤:
  1. 读取资源:
     - /workspace/my-nocobase-app/packages/plugins/@ALE/runtime-ui/src/client/
  
  2. 实现自定义组件:
     - StateFlowIndicator: 状态流程指示器
     - GateStatusBadge: 门禁状态徽章
     - AuditLogPanel: 审计日志面板
  
  3. 集成到 NocoBase:
     - 注册自定义组件
     - 扩展表格列类型
     - 扩展表单字段类型
  
  4. 添加主题支持:
     - 状态颜色配置
     - 门禁图标配置

输出产物:
  - 运行态自定义组件
  - NocoBase 集成

验收标准:
  - [ ] 自定义组件可用
  - [ ] 与 NocoBase 风格一致
```

---

### Phase 5: MVP 场景验证 (Day 15-17)

#### TASK-P5-001: 处置单场景 - 构建态

```yaml
任务ID: TASK-P5-001
名称: 处置单场景 - 构建态
优先级: P0
预估时间: 4h
前置条件: TASK-P4-001

操作步骤:
  1. 使用构建态创建处置单:
     - 输入: "创建一个延迟订单处置单，包含订单号、延迟天数、风险等级、处置状态、处置人、处置时间、处置原因"
     - 验证意图解析
     - 验证方案生成
     - 验证预览展示
  
  2. 迭代完善:
     - 添加状态机: "为处置单添加状态流程：待处理→处理中→已完成/已取消"
     - 添加规则: "延迟超过7天自动标记为高风险"
     - 添加动作: "添加催办动作"
  
  3. 确认并生成变更集
  
  4. 审批并发布

输出产物:
  - 处置单本体定义
  - 状态机定义
  - 规则定义

验收标准:
  - [ ] 意图正确解析
  - [ ] 方案正确生成
  - [ ] 变更集成功发布
```

#### TASK-P5-002: 处置单场景 - 运行态

```yaml
任务ID: TASK-P5-002
名称: 处置单场景 - 运行态
优先级: P0
预估时间: 4h
前置条件: TASK-P5-001, TASK-P3-002

操作步骤:
  1. 验证 Collection 创建:
     - 检查 disposal_orders 表
     - 检查字段定义
     - 检查索引
  
  2. 验证 UI 生成:
     - 检查列表视图
     - 检查表单视图
     - 检查详情视图
  
  3. 验证门禁:
     - 创建处置单（应通过）
     - 更新状态（应通过）
     - 非法状态转换（应拒绝）
  
  4. 验证规则:
     - 创建延迟7天以上订单
     - 验证自动标记高风险
  
  5. 验证审计:
     - 检查审计日志
     - 检查操作追踪

输出产物:
  - 完整的处置单功能
  - 测试报告

验收标准:
  - [ ] CRUD 功能正常
  - [ ] 状态流转正常
  - [ ] 门禁正常工作
  - [ ] 审计完整
```

#### TASK-P5-003: 端到端测试

```yaml
任务ID: TASK-P5-003
名称: 端到端测试
优先级: P0
预估时间: 4h
前置条件: TASK-P5-002

操作步骤:
  1. 编写 E2E 测试用例:
     - tests/e2e/disposal-order.spec.ts
  
  2. 测试构建态流程:
     - 意图输入测试
     - 方案确认测试
     - 变更集发布测试
  
  3. 测试运行态流程:
     - 数据 CRUD 测试
     - 状态流转测试
     - 门禁阻断测试
  
  4. 测试回滚:
     - 回滚变更集
     - 验证数据恢复
  
  5. 生成测试报告

输出产物:
  - E2E 测试用例
  - 测试报告

验收标准:
  - [ ] 所有 E2E 测试通过
  - [ ] 测试覆盖率 > 80%
```

---

### Phase 6: 优化和文档 (Day 18-20)

#### TASK-P6-001: 性能优化

```yaml
任务ID: TASK-P6-001
名称: 性能优化
优先级: P1
预估时间: 4h
前置条件: TASK-P5-003

操作步骤:
  1. LLM 调用优化:
     - 添加响应缓存
     - 添加流式输出
     - 优化 Prompt 长度
  
  2. 数据库优化:
     - 添加查询缓存
     - 优化 JSONB 查询
     - 添加连接池配置
  
  3. 前端优化:
     - 添加组件懒加载
     - 优化图渲染性能
     - 添加虚拟滚动
  
  4. 性能测试:
     - 使用 k6 进行负载测试
     - 生成性能报告

输出产物:
  - 性能优化
  - 性能测试报告

验收标准:
  - [ ] 意图解析 < 3s
  - [ ] 方案生成 < 5s
  - [ ] 页面加载 < 2s
```

#### TASK-P6-002: 文档完善

```yaml
任务ID: TASK-P6-002
名称: 文档完善
优先级: P1
预估时间: 4h
前置条件: TASK-P5-003

操作步骤:
  1. API 文档:
     - 使用 OpenAPI 生成
     - 添加使用示例
     - 添加错误码说明
  
  2. 开发文档:
     - 插件开发指南
     - 门禁扩展指南
     - LLM Provider 扩展指南
  
  3. 用户文档:
     - 构建态使用指南
     - 运行态使用指南
     - FAQ
  
  4. 生成 README:
     - 各插件 README.md
     - 项目根 README.md

输出产物:
  - 完整文档

验收标准:
  - [ ] API 文档完整
  - [ ] 开发指南清晰
  - [ ] README 完善
```

#### TASK-P6-003: 发布准备

```yaml
任务ID: TASK-P6-003
名称: 发布准备
优先级: P1
预估时间: 2h
前置条件: TASK-P6-001, TASK-P6-002

操作步骤:
  1. 版本管理:
     - 更新所有 package.json 版本
     - 生成 CHANGELOG.md
  
  2. 构建验证:
     - 完整构建测试
     - 生产环境配置检查
  
  3. 发布清单:
     - 核对所有功能
     - 核对所有文档
     - 核对所有测试
  
  4. 创建发布标签:
     - git tag v0.1.0
     - 生成 release notes

输出产物:
  - 发布版本
  - CHANGELOG

验收标准:
  - [ ] 版本号一致
  - [ ] 构建无错误
  - [ ] 发布标签创建
```

---

## 第五部分：任务依赖图

```
TASK-P0-001 ─┬─► TASK-P0-002 ─┬─► TASK-P1-001 ─► TASK-P1-002 ─┬─► TASK-P1-003
             │                │                               │
             │                │                               ├─► TASK-P1-004
             │                │                               │
             │                │                               └─► TASK-P1-005
             │                │                                        │
             │                │                                        ▼
             │                └─► TASK-P2-001 ─► TASK-P2-002 ─► TASK-P2-003 ─► TASK-P2-004
             │                                                                     │
             │                                                                     ▼
             │                                                              TASK-P4-001 ─► TASK-P4-002
             │                                                                     │
             │                                                                     ▼
             │                                                              TASK-P5-001
             │                                                                     │
             │                                                                     ▼
             │        TASK-P1-004 ─► TASK-P3-001 ─► TASK-P3-002 ─► TASK-P3-003     │
             │                              │              │                       │
             │                              ▼              │                       │
             │                       TASK-P4-003           │                       │
             │                              │              │                       │
             └──────────────────────────────┴──────────────┴───────► TASK-P5-002 ─► TASK-P5-003
                                                                            │
                                                                            ▼
                                                                     TASK-P6-001
                                                                            │
                                                                            ▼
                                                                     TASK-P6-002
                                                                            │
                                                                            ▼
                                                                     TASK-P6-003
```

---

## 第六部分：快速开始指南

### 开始新会话时的标准流程

1. **首先读取本文档**:
   ```
   读取 /workspace/ALE_IMPLEMENTATION_ROADMAP.md
   ```

2. **确认当前进度**:
   ```
   检查哪些 TASK 已完成（查看代码是否存在、测试是否通过）
   ```

3. **选择下一个 TASK**:
   ```
   根据依赖关系选择可执行的 TASK
   ```

4. **执行 TASK**:
   ```
   按照 TASK 的操作步骤执行
   读取指定的资源文件
   创建/修改代码
   运行测试
   ```

5. **更新进度**:
   ```
   标记 TASK 完成状态
   ```

### 常用命令

```bash
# 进入项目目录
cd /workspace/my-nocobase-app

# 安装依赖
yarn install

# 启动开发环境
yarn dev

# 构建所有插件
yarn build

# 运行测试
yarn test

# 添加插件
yarn pm add @ALE/core
yarn pm enable @ALE/core

# 数据库同步
yarn nocobase db:sync
```

### 环境变量

```bash
# .env 文件
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=nocobase
DB_USER=postgres
DB_PASSWORD=password
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-xxx
```

---

## 附录：检查清单

### MVP 完成检查清单

- [ ] **构建态**
  - [ ] 意图解析正常工作
  - [ ] 方案生成正常工作
  - [ ] 预览实时更新
  - [ ] 变更集可创建

- [ ] **运行态**
  - [ ] 本体注册正常
  - [ ] Collection 自动创建
  - [ ] UI 自动生成
  - [ ] 门禁正常执行

- [ ] **闭环**
  - [ ] 变更集审批流程
  - [ ] 变更集发布
  - [ ] 版本快照
  - [ ] 回滚功能

- [ ] **质量**
  - [ ] 单元测试覆盖率 > 70%
  - [ ] E2E 测试通过
  - [ ] 性能达标
  - [ ] 文档完整
