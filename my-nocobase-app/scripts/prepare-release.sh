#!/bin/bash

# ALE 发布准备脚本
# 用于统一更新版本号和生成发布包

set -e

VERSION=${1:-"0.1.0"}
ROOT_DIR=$(pwd)

echo "准备发布 ALE v${VERSION}..."

# 更新所有插件的版本号
echo "更新插件版本号..."
find packages/plugins/@ALE -name "package.json" -type f | while read file; do
  echo "更新 $file"
  # 使用 sed 更新版本号（需要根据实际情况调整）
  sed -i "s/\"version\": \".*\"/\"version\": \"${VERSION}\"/" "$file"
done

# 构建所有插件
echo "构建所有插件..."
cd packages/plugins/@ALE
for plugin in */; do
  if [ -f "${plugin}package.json" ]; then
    echo "构建 ${plugin}..."
    cd "${plugin}"
    yarn build || echo "构建 ${plugin} 失败，继续..."
    cd ..
  fi
done

cd "$ROOT_DIR"

# 运行测试
echo "运行测试..."
yarn test || echo "测试失败，继续..."

# 生成文档
echo "生成文档..."
# TODO: 生成 API 文档

echo "发布准备完成！"
echo "版本: ${VERSION}"
echo "下一步:"
echo "  1. 检查 CHANGELOG.md"
echo "  2. 提交代码"
echo "  3. 创建 git tag: git tag v${VERSION}"
echo "  4. 推送标签: git push origin v${VERSION}"
