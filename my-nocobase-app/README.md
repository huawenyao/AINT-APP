# ALE - Agentic Low-code Engineering

> AI 原生的低代码工程平台，基于 NocoBase 1.8.31

## 🎯 核心理念

**构建态 AI 原生交互 + 运行态本体驱动执行**

- **构建态**: 自然语言表达意图 → AI 理解 → 动态预览 → 确认变更
- **运行态**: 本体驱动 → 门禁检查 → 自动执行 → 审计追溯

## 📦 插件列表

| 插件 | 说明 | 状态 |
|-----|------|------|
| @ALE/core | 核心模块（13 个数据表） | ✅ |
| @ALE/ontology | 本体注册表 | ✅ |
| @ALE/gate-engine | 门禁引擎（G1/G3/G6/G7） | ✅ |
| @ALE/changeset | 变更集管理 | ✅ |
| @ALE/intent-engine | 意图理解引擎 | ✅ |
| @ALE/dynamic-view | 动态视图生成 | ✅ |
| @ALE/runtime-ui | 运行态 UI 生成 | ✅ |
| @ALE/disposal-order | 处置单场景插件 | ✅ |

## 🚀 快速开始

### 1. 安装依赖

```bash
cd /workspace/my-nocobase-app
yarn install
```

### 2. 启动 NocoBase

```bash
yarn dev
```

### 3. 注册插件

```bash
# 按顺序注册插件
yarn pm add @ALE/core
yarn pm enable @ALE/core

yarn pm add @ALE/ontology
yarn pm enable @ALE/ontology

yarn pm add @ALE/gate-engine
yarn pm enable @ALE/gate-engine

yarn pm add @ALE/changeset
yarn pm enable @ALE/changeset

yarn pm add @ALE/intent-engine
yarn pm enable @ALE/intent-engine

yarn pm add @ALE/dynamic-view
yarn pm enable @ALE/dynamic-view

yarn pm add @ALE/runtime-ui
yarn pm enable @ALE/runtime-ui

yarn pm add @ALE/disposal-order
yarn pm enable @ALE/disposal-order
```

### 4. 配置环境变量

```bash
# .env
OPENAI_API_KEY=sk-xxx  # 可选，用于意图解析
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=nocobase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

## 📖 使用示例

### 构建态：通过自然语言创建数据模型

```bash
# 1. 解析意图
curl -X POST http://localhost:13000/api/ale_intent:parse \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "type": "text",
      "content": "创建一个延迟订单处置单，包含订单号、延迟天数、风险等级、处置状态"
    }
  }'

# 2. 生成方案
curl -X POST http://localhost:13000/api/ale_intent:generateProposal \
  -H "Content-Type: application/json" \
  -d '{"intentId": "xxx"}'

# 3. 确认方案并创建变更集
curl -X POST http://localhost:13000/api/ale_changeset:createFromProposal \
  -H "Content-Type: application/json" \
  -d '{"proposalId": "xxx"}'
```

### 运行态：使用处置单

```bash
# 创建处置单
curl -X POST http://localhost:13000/api/disposal_orders:create \
  -H "Content-Type: application/json" \
  -d '{
    "orderNo": "DO-001",
    "sourceOrderId": "ORD-001",
    "customerName": "客户A",
    "delayDays": 5,
    "orderAmount": 1000.00,
    "riskLevel": "low"
  }'

# 分配处置单
curl -X POST http://localhost:13000/api/disposal_orders:assign \
  -H "Content-Type: application/json" \
  -d '{"assigneeId": 1}'
```

## 🏗️ 架构

```
┌─────────────────────────────────────────────────────────┐
│                    ALE 双态架构                           │
├─────────────────────────┬───────────────────────────────┤
│     构建态 (Design)      │     运行态 (Runtime)          │
├─────────────────────────┼───────────────────────────────┤
│ Intent Engine           │ Ontology Registry             │
│ Proposal Generator      │ Gate Engine                   │
│ Dynamic View            │ Runtime UI Generator          │
│ ChangeSet               │ Action Executor               │
└─────────────────────────┴───────────────────────────────┘
```

## 📚 文档

### 🎯 快速开始
- **[使用指南](./docs/USAGE_GUIDE.html)** - 可视化使用说明页面 ⭐
- [开发指南](./docs/DEVELOPMENT_GUIDE.md) - 开发环境搭建
- [部署指南](./docs/DEPLOYMENT_GUIDE.md) - 生产环境部署

### 🔧 运维文档
- [维护指南](./docs/MAINTENANCE_GUIDE.md) - 日常维护和监控
- [故障排查](./docs/TROUBLESHOOTING.md) - 常见问题解决

### 📖 架构文档
- [实施路线图](./ALE_IMPLEMENTATION_ROADMAP.md)
- [数据模型设计](./ALE_DATA_MODEL_DESIGN.md)
- [双态架构设计](./ALE_DUAL_MODE_ARCHITECTURE.md)
- [技术宪章](./ALE_TECHNICAL_CHARTER.md)
- [MVP 实现指南](./ALE_MVP_IMPLEMENTATION_GUIDE.md)
- [实施状态](./ALE_IMPLEMENTATION_STATUS.md)

## 🧪 测试

```bash
# 运行单元测试
yarn test

# 运行端到端测试
yarn e2e tests/e2e/disposal-order.spec.ts
```

## 🛠️ 工具脚本

```bash
# 开发环境快速设置
./scripts/dev-setup.sh

# 健康检查
./scripts/health-check.sh

# 监控报告
./scripts/monitor.sh

# 完整备份
./scripts/backup-all.sh

# 发布准备
./scripts/prepare-release.sh
```

## 📝 开发指南

### 添加新门禁

```typescript
import { BaseGate, GateType } from '@ALE/gate-engine';

export class MyCustomGate extends BaseGate {
  name = 'my_custom_gate';
  type = GateType.G2_SEMANTIC; // 或其他类型
  
  isApplicable(context: GateContext): boolean {
    return true;
  }
  
  async check(context: GateContext): Promise<GateResult> {
    // 实现检查逻辑
    return this.createPassResult('检查通过');
  }
  
  getDescription(): string {
    return '自定义门禁描述';
  }
}
```

### 添加新 LLM Provider

```typescript
import { LLMProvider } from '@ALE/intent-engine';

export class MyLLMProvider implements LLMProvider {
  async complete(prompt: string): Promise<string> {
    // 实现文本补全
  }
  
  async parseJSON<T>(prompt: string): Promise<T> {
    // 实现 JSON 解析
  }
}
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT
