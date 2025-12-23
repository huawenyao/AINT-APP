# ALE 故障排查指南

> 常见问题和解决方案

---

## 📋 目录

- [环境问题](#环境问题)
- [数据库问题](#数据库问题)
- [插件问题](#插件问题)
- [API 问题](#api-问题)
- [性能问题](#性能问题)

---

## 🔧 环境问题

### Q1: Node.js 版本不兼容

**症状**: `yarn install` 失败，提示 Node.js 版本过低

**解决**:
```bash
# 检查当前版本
node -v

# 使用 nvm 升级到 18+
nvm install 18
nvm use 18
```

### Q2: Yarn 安装依赖失败

**症状**: `yarn install` 报错，无法安装依赖

**解决**:
```bash
# 清理缓存
yarn cache clean

# 删除 node_modules 和 lock 文件
rm -rf node_modules yarn.lock

# 重新安装
yarn install
```

### Q3: Docker 服务无法启动

**症状**: `docker-compose up` 失败

**解决**:
```bash
# 检查 Docker 服务状态
sudo systemctl status docker

# 启动 Docker 服务
sudo systemctl start docker

# 检查端口占用
netstat -tulpn | grep 5432
```

---

## 💾 数据库问题

### Q1: 数据库连接失败

**症状**: 应用启动时报数据库连接错误

**排查**:
```bash
# 1. 检查 PostgreSQL 服务
sudo systemctl status postgresql

# 2. 测试连接
psql -U nocobase -d nocobase_dev -h localhost

# 3. 检查配置文件
cat .env | grep DB_
```

**解决**:
```bash
# 启动 PostgreSQL
sudo systemctl start postgresql

# 创建数据库和用户
sudo -u postgres psql
CREATE DATABASE nocobase_dev;
CREATE USER nocobase WITH PASSWORD 'nocobase';
GRANT ALL PRIVILEGES ON DATABASE nocobase_dev TO nocobase;
```

### Q2: 表未创建

**症状**: 插件启用后数据表未创建

**解决**:
```bash
# 手动同步数据库
yarn nocobase db:sync

# 或重新安装插件
yarn pm remove @ALE/core
yarn pm add @ALE/core
yarn pm enable @ALE/core
```

### Q3: 数据库性能问题

**症状**: 查询缓慢，响应时间长

**解决**:
```sql
-- 分析表统计信息
ANALYZE;

-- 重建索引
REINDEX DATABASE nocobase_dev;

-- 查看慢查询
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
```

---

## 🔌 插件问题

### Q1: 插件注册失败

**症状**: `yarn pm add @ALE/core` 失败

**排查**:
```bash
# 检查插件目录是否存在
ls -la packages/plugins/@ALE/core

# 检查 package.json
cat packages/plugins/@ALE/core/package.json

# 检查构建产物
ls -la packages/plugins/@ALE/core/dist
```

**解决**:
```bash
# 重新构建插件
cd packages/plugins/@ALE/core
yarn build

# 重新安装
cd ../../..
yarn pm add @ALE/core
```

### Q2: 插件依赖错误

**症状**: 插件启动时报依赖缺失错误

**解决**:
```bash
# 检查依赖配置
cat packages/plugins/@ALE/core/package.json | grep dependencies

# 重新安装所有依赖
yarn install

# 检查依赖版本冲突
yarn why <package-name>
```

### Q3: 插件 API 404

**症状**: 调用插件 API 返回 404

**排查**:
```bash
# 检查插件是否启用
yarn pm list

# 检查路由注册
curl http://localhost:13000/api/ale:health

# 查看日志
pm2 logs nocobase-ale | grep route
```

**解决**:
```bash
# 重新启用插件
yarn pm disable @ALE/core
yarn pm enable @ALE/core

# 重启应用
pm2 restart nocobase-ale
```

---

## 🌐 API 问题

### Q1: API 返回 401 未授权

**症状**: API 调用返回 401 错误

**解决**:
```bash
# 检查认证 Token
curl -H "Authorization: Bearer <token>" http://localhost:13000/api/ale:health

# 重新登录获取 Token
curl -X POST http://localhost:13000/api/users:signin \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password"}'
```

### Q2: API 返回 500 错误

**症状**: API 调用返回 500 内部服务器错误

**排查**:
```bash
# 查看错误日志
pm2 logs nocobase-ale --err --lines 50

# 检查数据库连接
psql -U nocobase -d nocobase_dev -c "SELECT 1;"

# 检查环境变量
pm2 env 0
```

### Q3: 意图解析返回空结果

**症状**: `/api/ale_intent:parse` 返回空或错误

**排查**:
```bash
# 检查 OpenAI API Key
echo $OPENAI_API_KEY

# 测试 OpenAI 连接
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# 查看意图解析日志
pm2 logs nocobase-ale | grep intent
```

**解决**:
```bash
# 配置 Mock Provider（开发环境）
# 在 .env 中设置
INTENT_ENGINE_PROVIDER=mock
```

---

## ⚡ 性能问题

### Q1: 应用响应缓慢

**症状**: API 响应时间超过 2 秒

**排查**:
```bash
# 检查 CPU 和内存
pm2 monit

# 检查数据库查询
psql -U nocobase -d nocobase_dev -c "
  SELECT pid, now() - pg_stat_activity.query_start AS duration, query
  FROM pg_stat_activity
  WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '1 second';
"

# 检查慢查询日志
tail -f /var/log/postgresql/postgresql-*.log | grep "duration:"
```

**解决**:
```bash
# 重启应用
pm2 restart nocobase-ale

# 清理缓存
redis-cli FLUSHDB

# 优化数据库
psql -U nocobase -d nocobase_dev -c "VACUUM ANALYZE;"
```

### Q2: 内存泄漏

**症状**: 内存使用持续增长

**排查**:
```bash
# 监控内存使用
pm2 monit

# 生成堆快照
node --inspect packages/app/dist/index.js
# 使用 Chrome DevTools 分析
```

**解决**:
```bash
# 重启应用
pm2 restart nocobase-ale

# 增加内存限制
pm2 restart nocobase-ale --max-memory-restart 1G
```

### Q3: 数据库连接池耗尽

**症状**: 数据库连接数达到上限

**排查**:
```sql
-- 查看当前连接数
SELECT count(*) FROM pg_stat_activity;

-- 查看连接详情
SELECT pid, usename, application_name, client_addr, state
FROM pg_stat_activity
WHERE datname = 'nocobase_dev';
```

**解决**:
```sql
-- 清理空闲连接
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'nocobase_dev'
  AND state = 'idle'
  AND state_change < now() - interval '5 minutes';

-- 增加最大连接数（需要重启 PostgreSQL）
-- 在 postgresql.conf 中设置: max_connections = 200
```

---

## 📞 获取更多帮助

如果以上方案无法解决问题，请：

1. **收集信息**:
   - 错误日志: `pm2 logs nocobase-ale --err --lines 100`
   - 系统信息: `uname -a`, `node -v`, `yarn -v`
   - 配置文件: `.env`（隐藏敏感信息）

2. **提交 Issue**:
   - 描述问题现象
   - 提供错误日志
   - 说明已尝试的解决方案

3. **查看文档**:
   - [开发指南](./DEVELOPMENT_GUIDE.md)
   - [维护指南](./MAINTENANCE_GUIDE.md)
   - [部署指南](./DEPLOYMENT_GUIDE.md)

---

**最后更新**: 2024-12
