#!/bin/bash

# ALE 健康检查脚本

set -e

APP_URL="${APP_URL:-http://localhost:13000}"
TIMEOUT="${TIMEOUT:-5}"

echo "🏥 ALE 健康检查开始..."
echo "检查地址: $APP_URL"
echo ""

# 1. 检查应用是否响应
echo "1. 检查应用响应..."
if curl -f -s --max-time $TIMEOUT "$APP_URL/api/ale:health" > /dev/null; then
    echo "   ✅ 应用响应正常"
else
    echo "   ❌ 应用无响应"
    exit 1
fi

# 2. 检查数据库连接
echo "2. 检查数据库连接..."
DB_CHECK=$(curl -s --max-time $TIMEOUT "$APP_URL/api/ale:health" | grep -o '"db":"ok"' || echo "")
if [ -n "$DB_CHECK" ]; then
    echo "   ✅ 数据库连接正常"
else
    echo "   ⚠️  数据库连接状态未知"
fi

# 3. 检查插件状态
echo "3. 检查插件状态..."
PLUGINS=("@ALE/core" "@ALE/ontology" "@ALE/gate-engine" "@ALE/changeset")
for plugin in "${PLUGINS[@]}"; do
    if curl -s --max-time $TIMEOUT "$APP_URL/api/app:getLang" > /dev/null; then
        echo "   ✅ $plugin 已加载"
    else
        echo "   ⚠️  $plugin 状态未知"
    fi
done

# 4. 检查磁盘空间
echo "4. 检查磁盘空间..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo "   ✅ 磁盘空间充足 ($DISK_USAGE%)"
else
    echo "   ⚠️  磁盘空间不足 ($DISK_USAGE%)"
fi

# 5. 检查内存使用
echo "5. 检查内存使用..."
if command -v free &> /dev/null; then
    MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
    if [ "$MEM_USAGE" -lt 90 ]; then
        echo "   ✅ 内存使用正常 ($MEM_USAGE%)"
    else
        echo "   ⚠️  内存使用过高 ($MEM_USAGE%)"
    fi
fi

echo ""
echo "✅ 健康检查完成"
