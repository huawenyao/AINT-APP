# ALE 文档中心

> 完整的文档索引和使用指南

---

## 📚 文档目录

### 🚀 快速开始
- [使用指南](./USAGE_GUIDE.html) - **可视化使用说明页面** ⭐
- [开发指南](./DEVELOPMENT_GUIDE.md) - 开发环境搭建和开发规范
- [部署指南](./DEPLOYMENT_GUIDE.md) - 生产环境部署步骤

### 🔧 运维文档
- [维护指南](./MAINTENANCE_GUIDE.md) - 日常维护、监控、备份
- [故障排查](./TROUBLESHOOTING.md) - 常见问题和解决方案

### 📖 架构文档
- [双态架构设计](../ALE_DUAL_MODE_ARCHITECTURE.md) - 构建态与运行态设计
- [数据模型设计](../ALE_DATA_MODEL_DESIGN.md) - 数据表结构设计
- [技术宪章](../ALE_TECHNICAL_CHARTER.md) - 技术规范和标准

### 📋 项目文档
- [实施路线图](../ALE_IMPLEMENTATION_ROADMAP.md) - 开发计划和任务
- [实施状态](../ALE_IMPLEMENTATION_STATUS.md) - 当前实施进度
- [完成总结](../ALE_COMPLETION_SUMMARY.md) - 迭代完成情况

---

## 🎯 快速导航

### 我是开发者
1. 阅读 [开发指南](./DEVELOPMENT_GUIDE.md) 搭建环境
2. 查看 [使用指南](./USAGE_GUIDE.html) 了解功能
3. 参考 [架构设计](../ALE_DUAL_MODE_ARCHITECTURE.md) 理解系统

### 我是运维人员
1. 阅读 [部署指南](./DEPLOYMENT_GUIDE.md) 部署系统
2. 查看 [维护指南](./MAINTENANCE_GUIDE.md) 日常维护
3. 参考 [故障排查](./TROUBLESHOOTING.md) 解决问题

### 我是用户
1. 打开 [使用指南](./USAGE_GUIDE.html) 学习使用
2. 查看各场景的使用说明
3. 参考 API 文档进行集成

---

## 🛠️ 脚本工具

所有脚本位于 `/scripts` 目录：

| 脚本 | 说明 | 用法 |
|-----|------|------|
| `dev-setup.sh` | 开发环境快速设置 | `./scripts/dev-setup.sh` |
| `health-check.sh` | 健康检查 | `./scripts/health-check.sh` |
| `monitor.sh` | 监控报告 | `./scripts/monitor.sh` |
| `backup-all.sh` | 完整备份 | `./scripts/backup-all.sh` |
| `prepare-release.sh` | 发布准备 | `./scripts/prepare-release.sh` |
| `verify-ale-tables.ts` | 验证数据表 | `yarn nocobase exec scripts/verify-ale-tables.ts` |

---

## 📞 获取帮助

- **文档问题**: 提交 Issue 或 PR
- **技术问题**: 查看 [故障排查](./TROUBLESHOOTING.md)
- **功能建议**: 提交 Feature Request

---

**最后更新**: 2024-12
