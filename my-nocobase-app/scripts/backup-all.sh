#!/bin/bash

# ALE 完整备份脚本

set -e

BACKUP_ROOT="${BACKUP_ROOT:-/backup/ale}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/$DATE"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

echo "💾 ALE 完整备份开始..."
echo "备份目录: $BACKUP_DIR"
echo ""

# 1. 数据库备份
echo "1. 备份数据库..."
if command -v pg_dump &> /dev/null; then
    DB_NAME="${DB_NAME:-nocobase_prod}"
    DB_USER="${DB_USER:-nocobase}"
    
    pg_dump -U "$DB_USER" -F c -b -v -f "$BACKUP_DIR/database.dump" "$DB_NAME" 2>&1 | grep -v "password"
    echo "   ✅ 数据库备份完成"
else
    echo "   ⚠️  pg_dump 未安装，跳过数据库备份"
fi

# 2. 文件备份
echo "2. 备份文件..."
STORAGE_DIR="${STORAGE_DIR:-./storage}"
if [ -d "$STORAGE_DIR" ]; then
    tar -czf "$BACKUP_DIR/storage.tar.gz" -C $(dirname "$STORAGE_DIR") $(basename "$STORAGE_DIR")
    echo "   ✅ 文件备份完成"
else
    echo "   ⚠️  存储目录不存在，跳过文件备份"
fi

# 3. 配置文件备份
echo "3. 备份配置文件..."
if [ -f .env ]; then
    cp .env "$BACKUP_DIR/.env"
    echo "   ✅ 配置文件备份完成"
fi

# 4. 压缩备份
echo "4. 压缩备份..."
cd "$BACKUP_ROOT"
tar -czf "${DATE}.tar.gz" "$DATE"
rm -rf "$DATE"
echo "   ✅ 备份压缩完成: ${DATE}.tar.gz"

# 5. 清理旧备份（保留 30 天）
echo "5. 清理旧备份..."
find "$BACKUP_ROOT" -name "*.tar.gz" -mtime +30 -delete
echo "   ✅ 旧备份已清理"

# 6. 计算备份大小
BACKUP_SIZE=$(du -h "${DATE}.tar.gz" | cut -f1)
echo ""
echo "✅ 备份完成！"
echo "备份文件: ${BACKUP_ROOT}/${DATE}.tar.gz"
echo "备份大小: $BACKUP_SIZE"
