# ALE 部署指南

> 本文档提供 ALE 平台的生产环境部署指南。

---

## 📋 目录

- [部署架构](#部署架构)
- [环境准备](#环境准备)
- [部署步骤](#部署步骤)
- [配置说明](#配置说明)
- [监控和维护](#监控和维护)

---

## 🏗️ 部署架构

### 推荐架构

```
┌─────────────────────────────────────────┐
│         Nginx (反向代理)                │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      NocoBase Application                │
│  ┌────────────────────────────────────┐  │
│  │  @ALE/core                         │  │
│  │  @ALE/ontology                     │  │
│  │  @ALE/gate-engine                  │  │
│  │  ... (其他插件)                     │  │
│  └────────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼────┐          ┌──────▼────┐
│PostgreSQL│        │  Redis    │
└─────────┘          └──────────┘
```

---

## 🔧 环境准备

### 服务器要求

- **CPU**: 4 核以上
- **内存**: 8GB 以上
- **磁盘**: 100GB 以上（SSD 推荐）
- **操作系统**: Ubuntu 20.04+ / CentOS 7+

### 必需软件

```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Yarn
npm install -g yarn

# PostgreSQL 12+
sudo apt-get install postgresql postgresql-contrib

# Redis 6+
sudo apt-get install redis-server

# PM2 (进程管理)
npm install -g pm2
```

---

## 🚀 部署步骤

### 1. 克隆代码

```bash
git clone <repository-url>
cd my-nocobase-app
git checkout <production-branch>
```

### 2. 安装依赖

```bash
yarn install --production
```

### 3. 构建项目

```bash
# 构建所有插件
yarn build

# 或单独构建
cd packages/plugins/@ALE/core && yarn build
```

### 4. 配置环境变量

创建 `.env.production`:

```bash
# 应用配置
NODE_ENV=production
APP_KEY=<生成随机32位字符串>
APP_PORT=13000

# 数据库配置
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=nocobase_prod
DB_USER=nocobase
DB_PASSWORD=<强密码>

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<可选>

# OpenAI API
OPENAI_API_KEY=<生产环境 API Key>

# 日志配置
LOG_LEVEL=info
LOG_DIR=/var/log/nocobase

# 存储配置
STORAGE_TYPE=local
STORAGE_BASE_URL=https://your-domain.com/storage
```

### 5. 初始化数据库

```bash
# 创建数据库
sudo -u postgres psql
CREATE DATABASE nocobase_prod;
CREATE USER nocobase WITH PASSWORD '<password>';
GRANT ALL PRIVILEGES ON DATABASE nocobase_prod TO nocobase;
\q

# 运行迁移
yarn nocobase db:migrate
```

### 6. 注册插件

```bash
# 按顺序注册所有插件
yarn pm add @ALE/core && yarn pm enable @ALE/core
yarn pm add @ALE/ontology && yarn pm enable @ALE/ontology
yarn pm add @ALE/gate-engine && yarn pm enable @ALE/gate-engine
yarn pm add @ALE/changeset && yarn pm enable @ALE/changeset
yarn pm add @ALE/intent-engine && yarn pm enable @ALE/intent-engine
yarn pm add @ALE/dynamic-view && yarn pm enable @ALE/dynamic-view
yarn pm add @ALE/runtime-ui && yarn pm enable @ALE/runtime-ui
yarn pm add @ALE/disposal-order && yarn pm enable @ALE/disposal-order
```

### 7. 启动应用（使用 PM2）

创建 `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'nocobase-ale',
    script: './packages/app/dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
    error_file: '/var/log/nocobase/error.log',
    out_file: '/var/log/nocobase/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
  }],
};
```

启动：

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # 设置开机自启
```

### 8. 配置 Nginx

创建 `/etc/nginx/sites-available/nocobase`:

```nginx
upstream nocobase {
    server 127.0.0.1:13000;
    keepalive 64;
}

server {
    listen 80;
    server_name your-domain.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    client_max_body_size 100M;

    location / {
        proxy_pass http://nocobase;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /storage {
        alias /path/to/nocobase/storage/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/nocobase /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## ⚙️ 配置说明

### 数据库优化

```sql
-- PostgreSQL 配置优化
-- /etc/postgresql/12/main/postgresql.conf

max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
```

### Redis 配置

```conf
# /etc/redis/redis.conf

maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### 应用性能优化

```bash
# 启用 Node.js 集群模式
NODE_ENV=production
NODE_OPTIONS="--max-old-space-size=2048"

# 启用 HTTP/2
# 在 Nginx 配置中启用 http2
```

---

## 📊 监控和维护

### 1. 日志监控

```bash
# PM2 日志
pm2 logs nocobase-ale

# Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# 应用日志
tail -f /var/log/nocobase/error.log
```

### 2. 性能监控

使用 PM2 监控：

```bash
pm2 monit
```

### 3. 健康检查

创建健康检查脚本 `scripts/health-check.sh`:

```bash
#!/bin/bash
curl -f http://localhost:13000/api/ale:health || exit 1
```

添加到 cron:

```bash
*/5 * * * * /path/to/scripts/health-check.sh
```

### 4. 备份策略

```bash
# 数据库备份
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U nocobase nocobase_prod > /backup/db_${DATE}.sql

# 文件备份
tar -czf /backup/storage_${DATE}.tar.gz /path/to/storage
```

### 5. 更新部署

```bash
# 拉取最新代码
git pull origin main

# 安装依赖
yarn install --production

# 构建
yarn build

# 运行数据库迁移
yarn nocobase db:migrate

# 重启应用
pm2 restart nocobase-ale
```

---

## 🔒 安全建议

1. **使用 HTTPS**: 配置 SSL 证书
2. **防火墙**: 只开放必要端口（80, 443）
3. **数据库安全**: 使用强密码，限制访问 IP
4. **API Key 保护**: 不要将 API Key 提交到代码仓库
5. **定期更新**: 保持依赖包和系统更新

---

## 📚 相关文档

- [开发指南](./DEVELOPMENT_GUIDE.md)
- [维护指南](./MAINTENANCE_GUIDE.md)
- [故障排查](./TROUBLESHOOTING.md)

---

**最后更新**: 2024-12
