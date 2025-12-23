# Changelog

All notable changes to ALE will be documented in this file.

## [0.1.0] - 2024-12

### Added

#### Core Framework
- ✅ 13 个核心数据表定义（构建态 + 运行态 + 共享）
- ✅ 完整的 TypeScript 类型系统
- ✅ Zod Schema 验证
- ✅ 审计服务（AuditService）
- ✅ 证据服务（EvidenceService）

#### Gate Engine
- ✅ G1_STRUCTURAL - 结构门禁实现
- ✅ G3_EVIDENCE - 证据门禁实现
- ✅ G6_EXECUTION - 执行门禁实现
- ✅ G7_EVALUATION - 评估门禁实现
- ✅ 门禁链式执行
- ✅ 门禁结果缓存
- ✅ 运行时数据钩子集成

#### Ontology Registry
- ✅ 对象/关系/流程/动作/规则注册和管理
- ✅ Collection 自动同步
- ✅ 本体导入/导出
- ✅ 版本控制

#### ChangeSet Management
- ✅ 变更集完整生命周期（创建→提交→审批→发布→回滚）
- ✅ 版本快照
- ✅ 与门禁引擎集成

#### Intent Engine
- ✅ 意图解析（自然语言 → 结构化意图）
- ✅ 方案生成（意图 → 变更方案）
- ✅ OpenAI Provider 集成
- ✅ Mock Provider（用于开发）
- ✅ 意图澄清
- ✅ 方案迭代
- ✅ 结果缓存
- ✅ Prompt 模板管理

#### Dynamic View
- ✅ Schema 图生成（ReactFlow）
- ✅ 状态机图生成（ReactFlow）
- ✅ UI Schema 生成
- ✅ Mock 数据生成
- ✅ 前端组件（ChatInterface, ProposalPreview, SchemaGraph, StateMachineGraph, ImpactAnalysis, GatePreCheck, ALEStudio）

#### Runtime UI Generator
- ✅ Collection 自动注册
- ✅ 列表/表单/详情视图自动生成
- ✅ 菜单自动生成
- ✅ 前端组件（StateFlowIndicator, GateStatusBadge, AuditLogPanel）

#### MVP Scenario
- ✅ 处置单场景插件（@ALE/disposal-order）
- ✅ 处置单数据模型（3 个表）
- ✅ 状态机（9 个状态，8 个转换）
- ✅ 4 个核心动作
- ✅ 门禁集成
- ✅ 端到端测试用例

#### Performance
- ✅ 意图解析结果缓存
- ✅ 门禁结果缓存
- ✅ 查询优化

#### Documentation
- ✅ 各插件 README
- ✅ API 文档
- ✅ 实施状态报告

### Changed

- 修复了所有插件的依赖配置（workspace:* → *）
- 完善了 TypeScript 配置（esModuleInterop, skipLibCheck）
- 添加了所有插件的客户端入口文件

### Fixed

- 修复了 tsconfig.json 重复配置问题
- 创建了缺失的 .env.e2e.example 文件

---

## [Unreleased]

### Planned

- G2_SEMANTIC - 语义门禁实现
- G4_PERMISSION - 权限门禁实现
- G5_FLOW - 流程门禁实现
- Claude Provider 集成
- Ollama Provider 集成
- Redis 缓存支持
- WebSocket 实时预览
- 更多视图类型（Kanban, Calendar, Chart）
- 性能监控和指标收集
