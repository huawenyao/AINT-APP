# ALE 开发指南

> 本文档面向 ALE 平台的开发人员，提供开发环境搭建、代码规范、调试技巧等信息。

---

## 📋 目录

- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [开发规范](#开发规范)
- [调试技巧](#调试技巧)
- [常见问题](#常见问题)

---

## 🔧 环境要求

### 必需软件

- **Node.js**: >= 18.0.0
- **Yarn**: >= 1.22.0
- **PostgreSQL**: >= 12.0
- **Redis**: >= 6.0（可选，用于缓存）
- **Docker**: >= 20.0（可选，用于快速启动数据库）

### 推荐工具

- **VS Code** + TypeScript 插件
- **Docker Compose**（用于本地开发环境）
- **Postman** 或 **Insomnia**（API 测试）

---

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd my-nocobase-app
```

### 2. 安装依赖

```bash
yarn install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env` 并配置：

```bash
# 数据库配置
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=nocobase
DB_USER=nocobase
DB_PASSWORD=nocobase

# Redis 配置（可选）
REDIS_HOST=localhost
REDIS_PORT=6379

# OpenAI API（用于意图解析）
OPENAI_API_KEY=sk-xxx

# 应用配置
APP_KEY=your-app-key
APP_PORT=13000
```

### 4. 启动数据库（使用 Docker）

```bash
docker-compose up -d postgres redis
```

### 5. 启动开发服务器

```bash
yarn dev
```

访问 http://localhost:13000

---

## 📁 项目结构

```
my-nocobase-app/
├── packages/
│   └── plugins/
│       └── @ALE/
│           ├── core/              # 核心模块
│           ├── ontology/          # 本体注册表
│           ├── gate-engine/      # 门禁引擎
│           ├── changeset/        # 变更集管理
│           ├── intent-engine/    # 意图理解引擎
│           ├── dynamic-view/    # 动态视图
│           ├── runtime-ui/       # 运行态 UI
│           └── disposal-order/   # 处置单场景
├── tests/
│   └── e2e/                      # 端到端测试
├── scripts/                      # 工具脚本
├── docs/                         # 文档目录
└── storage/                      # 存储目录
```

---

## 📝 开发规范

### TypeScript 规范

1. **使用严格模式**
   ```json
   {
     "strict": true,
     "noImplicitAny": true,
     "strictNullChecks": true
   }
   ```

2. **命名规范**
   - 类名：PascalCase（如 `IntentParser`）
   - 函数/变量：camelCase（如 `parseIntent`）
   - 常量：UPPER_SNAKE_CASE（如 `MAX_RETRY_COUNT`）
   - 文件名：kebab-case（如 `intent-parser.ts`）

3. **类型定义**
   ```typescript
   // ✅ 好的做法
   interface UserConfig {
     name: string;
     age: number;
   }
   
   // ❌ 避免使用 any
   function process(data: any) { }
   ```

### 代码组织

1. **插件结构**
   ```
   plugin-name/
   ├── src/
   │   ├── server/
   │   │   ├── collections/      # 数据表定义
   │   │   ├── services/        # 服务类
   │   │   ├── actions/         # 自定义动作
   │   │   └── plugin.ts        # 插件入口
   │   └── client/
   │       ├── components/      # React 组件
   │       └── index.ts         # 客户端入口
   ├── package.json
   └── tsconfig.json
   ```

2. **服务类规范**
   ```typescript
   export class MyService {
     private db: Database;
     
     constructor(db: Database) {
       this.db = db;
     }
     
     async doSomething(): Promise<Result> {
       // 实现逻辑
     }
   }
   ```

### Git 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/)：

```
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建/工具变更
```

示例：
```bash
git commit -m "feat(gate-engine): 添加 G2_SEMANTIC 门禁实现"
```

---

## 🐛 调试技巧

### 1. 日志调试

```typescript
// 在服务中使用 logger
this.app.logger.info('[@ALE/core] 操作开始');
this.app.logger.error('[@ALE/core] 操作失败', error);
this.app.logger.debug('[@ALE/core] 调试信息', { data });
```

### 2. 数据库查询调试

```typescript
// 启用 Sequelize 日志
const db = app.db;
db.sequelize.options.logging = console.log;
```

### 3. API 调试

使用 Postman 或 curl：

```bash
# 解析意图
curl -X POST http://localhost:13000/api/ale_intent:parse \
  -H "Content-Type: application/json" \
  -d '{"input": {"type": "text", "content": "创建处置单"}}'
```

### 4. 前端调试

```bash
# 启动前端开发服务器（如果分离）
yarn dev:client

# 或使用浏览器 DevTools
# Chrome DevTools > Network > 查看 API 请求
```

---

## ❓ 常见问题

### Q1: 插件注册失败

**问题**: `yarn pm add @ALE/core` 失败

**解决**:
1. 检查插件目录是否存在
2. 检查 `package.json` 配置是否正确
3. 运行 `yarn install` 重新安装依赖

### Q2: 数据库表未创建

**问题**: 插件启用后表未创建

**解决**:
```bash
# 手动同步数据库
yarn nocobase db:sync

# 或重新安装插件
yarn pm remove @ALE/core
yarn pm add @ALE/core
yarn pm enable @ALE/core
```

### Q3: TypeScript 编译错误

**问题**: `tsc` 报错

**解决**:
1. 检查 `tsconfig.json` 配置
2. 确保所有依赖已安装
3. 运行 `yarn build` 查看详细错误

### Q4: 门禁检查失败

**问题**: 门禁总是返回失败

**解决**:
1. 检查门禁配置是否正确
2. 查看门禁报告：`/api/ale_gate_reports:list`
3. 检查日志中的错误信息

### Q5: 意图解析返回空结果

**问题**: LLM 调用失败或返回空

**解决**:
1. 检查 `OPENAI_API_KEY` 是否配置
2. 检查网络连接
3. 查看 Mock Provider 是否可用

---

## 📚 相关文档

- [API 文档](./API_REFERENCE.md)
- [架构设计](../ALE_DUAL_MODE_ARCHITECTURE.md)
- [数据模型](../ALE_DATA_MODEL_DESIGN.md)
- [部署指南](./DEPLOYMENT_GUIDE.md)

---

**最后更新**: 2024-12
