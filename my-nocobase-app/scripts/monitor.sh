#!/bin/bash

# ALE 监控脚本

APP_NAME="${APP_NAME:-nocobase-ale}"
ALERT_EMAIL="${ALERT_EMAIL:-admin@example.com}"

# 颜色定义
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "📊 ALE 监控报告"
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 1. PM2 状态
echo "1. 应用状态 (PM2):"
if command -v pm2 &> /dev/null; then
    PM2_STATUS=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.status" 2>/dev/null || echo "unknown")
    if [ "$PM2_STATUS" = "online" ]; then
        echo -e "   ${GREEN}✅ 应用运行中${NC}"
    else
        echo -e "   ${RED}❌ 应用未运行 (状态: $PM2_STATUS)${NC}"
    fi
    
    CPU=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .monit.cpu" 2>/dev/null || echo "0")
    MEM=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .monit.memory" 2>/dev/null || echo "0")
    MEM_MB=$((MEM / 1024 / 1024))
    echo "   CPU: ${CPU}%"
    echo "   内存: ${MEM_MB}MB"
    
    if (( $(echo "$CPU > 80" | bc -l) )); then
        echo -e "   ${YELLOW}⚠️  CPU 使用率过高${NC}"
    fi
else
    echo "   ⚠️  PM2 未安装"
fi

# 2. 数据库状态
echo ""
echo "2. 数据库状态:"
if command -v psql &> /dev/null; then
    DB_CONN=$(psql -U nocobase -d nocobase_prod -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null || echo "0")
    echo "   连接数: $DB_CONN"
    
    if [ "$DB_CONN" -gt 150 ]; then
        echo -e "   ${YELLOW}⚠️  数据库连接数过高${NC}"
    fi
else
    echo "   ⚠️  PostgreSQL 客户端未安装"
fi

# 3. Redis 状态
echo ""
echo "3. Redis 状态:"
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo -e "   ${GREEN}✅ Redis 运行中${NC}"
        REDIS_MEM=$(redis-cli info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
        echo "   内存使用: $REDIS_MEM"
    else
        echo -e "   ${RED}❌ Redis 无响应${NC}"
    fi
else
    echo "   ⚠️  Redis 客户端未安装"
fi

# 4. 磁盘空间
echo ""
echo "4. 磁盘空间:"
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
DISK_AVAIL=$(df -h / | awk 'NR==2 {print $4}')
echo "   使用率: ${DISK_USAGE}%"
echo "   可用空间: $DISK_AVAIL"

if [ "$DISK_USAGE" -gt 80 ]; then
    echo -e "   ${YELLOW}⚠️  磁盘空间不足${NC}"
fi

# 5. 最近错误日志
echo ""
echo "5. 最近错误 (最后 5 条):"
if command -v pm2 &> /dev/null; then
    ERRORS=$(pm2 logs $APP_NAME --err --lines 5 --nostream 2>/dev/null | tail -5)
    if [ -n "$ERRORS" ]; then
        echo "$ERRORS" | while IFS= read -r line; do
            echo -e "   ${RED}$line${NC}"
        done
    else
        echo -e "   ${GREEN}✅ 无错误${NC}"
    fi
fi

echo ""
echo "监控完成"
