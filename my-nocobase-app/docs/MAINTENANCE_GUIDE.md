# ALE 维护指南

> 本文档提供 ALE 平台的日常维护、监控和故障处理指南。

---

## 📋 目录

- [日常维护任务](#日常维护任务)
- [监控指标](#监控指标)
- [备份和恢复](#备份和恢复)
- [性能优化](#性能优化)
- [故障处理](#故障处理)

---

## 🔧 日常维护任务

### 每日检查

```bash
# 1. 检查应用状态
pm2 status

# 2. 检查日志错误
pm2 logs nocobase-ale --err --lines 100

# 3. 检查数据库连接
psql -U nocobase -d nocobase_prod -c "SELECT 1;"

# 4. 检查磁盘空间
df -h

# 5. 检查内存使用
free -h
```

### 每周任务

```bash
# 1. 清理过期日志
find /var/log/nocobase -name "*.log" -mtime +7 -delete

# 2. 清理过期缓存
redis-cli FLUSHDB

# 3. 数据库优化
psql -U nocobase -d nocobase_prod -c "VACUUM ANALYZE;"

# 4. 检查插件更新
yarn outdated
```

### 每月任务

```bash
# 1. 数据库备份验证
# 2. 性能报告生成
# 3. 安全审计
# 4. 依赖更新评估
```

---

## 📊 监控指标

### 应用指标

| 指标 | 正常范围 | 告警阈值 |
|-----|---------|---------|
| CPU 使用率 | < 50% | > 80% |
| 内存使用率 | < 70% | > 90% |
| 响应时间 | < 500ms | > 2000ms |
| 错误率 | < 1% | > 5% |
| 并发连接数 | < 1000 | > 2000 |

### 数据库指标

| 指标 | 正常范围 | 告警阈值 |
|-----|---------|---------|
| 连接数 | < 100 | > 150 |
| 查询时间 | < 100ms | > 1000ms |
| 表大小 | - | > 10GB |
| 索引使用率 | > 80% | < 50% |

### 监控脚本

创建 `scripts/monitor.sh`:

```bash
#!/bin/bash

# CPU 和内存检查
CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
MEM=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100)}')

if [ $CPU -gt 80 ] || [ $MEM -gt 90 ]; then
    echo "警告: CPU=${CPU}% MEM=${MEM}%"
    # 发送告警通知
fi

# 数据库连接检查
DB_CONN=$(psql -U nocobase -d nocobase_prod -t -c "SELECT count(*) FROM pg_stat_activity;")
if [ $DB_CONN -gt 150 ]; then
    echo "警告: 数据库连接数=${DB_CONN}"
fi
```

---

## 💾 备份和恢复

### 数据库备份

```bash
#!/bin/bash
# scripts/backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/database"
DB_NAME="nocobase_prod"
DB_USER="nocobase"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
pg_dump -U $DB_USER -F c -b -v -f "$BACKUP_DIR/db_${DATE}.dump" $DB_NAME

# 压缩备份
gzip "$BACKUP_DIR/db_${DATE}.dump"

# 删除 30 天前的备份
find $BACKUP_DIR -name "*.dump.gz" -mtime +30 -delete

echo "备份完成: $BACKUP_DIR/db_${DATE}.dump.gz"
```

### 文件备份

```bash
#!/bin/bash
# scripts/backup-files.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/files"
STORAGE_DIR="/path/to/storage"

mkdir -p $BACKUP_DIR

tar -czf "$BACKUP_DIR/storage_${DATE}.tar.gz" -C $(dirname $STORAGE_DIR) $(basename $STORAGE_DIR)

find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "文件备份完成: $BACKUP_DIR/storage_${DATE}.tar.gz"
```

### 恢复数据库

```bash
# 恢复备份
pg_restore -U nocobase -d nocobase_prod -c /backup/database/db_20241201_120000.dump.gz

# 或使用 SQL 文件
psql -U nocobase -d nocobase_prod < /backup/database/db_20241201_120000.sql
```

---

## ⚡ 性能优化

### 数据库优化

```sql
-- 1. 分析表统计信息
ANALYZE;

-- 2. 重建索引
REINDEX DATABASE nocobase_prod;

-- 3. 清理过期数据
DELETE FROM ale_audit_logs WHERE timestamp < NOW() - INTERVAL '90 days';
DELETE FROM ale_gate_reports WHERE createdAt < NOW() - INTERVAL '30 days';

-- 4. 优化查询
EXPLAIN ANALYZE SELECT * FROM ale_ontology_objects WHERE status = 'active';
```

### 缓存优化

```bash
# Redis 内存优化
redis-cli CONFIG SET maxmemory 2gb
redis-cli CONFIG SET maxmemory-policy allkeys-lru

# 清理缓存
redis-cli FLUSHDB
```

### 应用优化

```bash
# 启用 Gzip 压缩（Nginx）
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# 启用 HTTP/2
listen 443 ssl http2;

# 静态资源缓存
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

---

## 🚨 故障处理

### 常见问题

#### 1. 应用无法启动

**症状**: PM2 显示应用状态为 `errored`

**排查步骤**:
```bash
# 查看错误日志
pm2 logs nocobase-ale --err --lines 50

# 检查端口占用
netstat -tulpn | grep 13000

# 检查环境变量
pm2 env 0

# 手动启动测试
NODE_ENV=production node packages/app/dist/index.js
```

**解决方案**:
- 检查 `.env` 配置
- 检查数据库连接
- 检查端口冲突
- 检查依赖是否完整

#### 2. 数据库连接失败

**症状**: 应用日志显示数据库连接错误

**排查步骤**:
```bash
# 测试数据库连接
psql -U nocobase -d nocobase_prod -h localhost

# 检查 PostgreSQL 状态
sudo systemctl status postgresql

# 检查连接数
psql -U nocobase -d nocobase_prod -c "SELECT count(*) FROM pg_stat_activity;"
```

**解决方案**:
- 重启 PostgreSQL: `sudo systemctl restart postgresql`
- 检查防火墙规则
- 增加最大连接数
- 清理空闲连接

#### 3. 内存泄漏

**症状**: 内存使用持续增长

**排查步骤**:
```bash
# 查看内存使用
pm2 monit

# 生成堆快照
node --inspect packages/app/dist/index.js
# 使用 Chrome DevTools 分析

# 检查内存泄漏
node --expose-gc packages/app/dist/index.js
```

**解决方案**:
- 重启应用: `pm2 restart nocobase-ale`
- 检查代码中的内存泄漏
- 增加内存限制
- 使用集群模式分散负载

#### 4. 门禁检查失败

**症状**: 所有操作都被门禁阻止

**排查步骤**:
```bash
# 查看门禁报告
curl http://localhost:13000/api/ale_gate_reports:list

# 检查门禁配置
curl http://localhost:13000/api/ale_ontology_objects:list

# 查看日志
pm2 logs nocobase-ale | grep gate
```

**解决方案**:
- 检查门禁配置是否正确
- 检查本体定义是否完整
- 检查证据是否满足要求
- 临时禁用严格模式（仅开发环境）

---

## 📞 支持联系

- **文档**: [项目文档](../README.md)
- **Issue**: [GitHub Issues](https://github.com/your-org/ale/issues)
- **邮件**: support@your-domain.com

---

**最后更新**: 2024-12
