#!/bin/bash

# ALE 开发环境快速设置脚本

set -e

echo "🚀 ALE 开发环境设置开始..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 版本过低，需要 18+，当前: $(node -v)"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"

# 检查 Yarn
if ! command -v yarn &> /dev/null; then
    echo "📦 安装 Yarn..."
    npm install -g yarn
fi

echo "✅ Yarn 版本: $(yarn -v)"

# 检查 Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker 已安装"
    if docker ps &> /dev/null; then
        echo "✅ Docker 服务运行中"
    else
        echo "⚠️  Docker 服务未运行，请启动 Docker"
    fi
else
    echo "⚠️  Docker 未安装（可选，用于数据库）"
fi

# 安装依赖
echo "📦 安装项目依赖..."
yarn install

# 创建环境变量文件
if [ ! -f .env ]; then
    echo "📝 创建 .env 文件..."
    cat > .env << EOF
# 数据库配置
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=nocobase_dev
DB_USER=nocobase
DB_PASSWORD=nocobase

# Redis 配置（可选）
REDIS_HOST=localhost
REDIS_PORT=6379

# OpenAI API（可选，用于意图解析）
OPENAI_API_KEY=

# 应用配置
APP_KEY=$(openssl rand -hex 16)
APP_PORT=13000
NODE_ENV=development
EOF
    echo "✅ .env 文件已创建，请根据需要修改配置"
else
    echo "✅ .env 文件已存在"
fi

# 创建 E2E 环境变量文件
if [ ! -f .env.e2e.example ]; then
    echo "📝 创建 .env.e2e.example 文件..."
    cat > .env.e2e.example << EOF
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=nocobase_test
DB_USER=nocobase
DB_PASSWORD=nocobase
EOF
    echo "✅ .env.e2e.example 文件已创建"
fi

# 启动 Docker 服务（如果可用）
if command -v docker-compose &> /dev/null && docker ps &> /dev/null; then
    echo "🐳 启动 Docker 服务..."
    docker-compose up -d postgres redis 2>/dev/null || echo "⚠️  无法启动 Docker 服务，请手动启动"
fi

# 构建项目
echo "🔨 构建项目..."
yarn build || echo "⚠️  构建失败，请检查错误信息"

echo ""
echo "✅ 开发环境设置完成！"
echo ""
echo "下一步："
echo "  1. 检查并修改 .env 文件配置"
echo "  2. 启动数据库: docker-compose up -d"
echo "  3. 启动开发服务器: yarn dev"
echo "  4. 访问 http://localhost:13000"
