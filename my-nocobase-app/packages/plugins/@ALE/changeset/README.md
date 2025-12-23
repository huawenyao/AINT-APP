# @ALE/changeset

ALE 变更集管理 - 双态桥接核心组件，管理变更的完整生命周期。

## 功能

- 从方案创建变更集
- 变更集提交和审批
- 变更集发布和回滚
- 版本快照
- 版本历史查询

## 安装

```bash
yarn pm add @ALE/changeset
yarn pm enable @ALE/changeset
```

## 使用

```typescript
import { ChangeSetService } from '@ALE/changeset';

const service = app.plugin('@ALE/changeset')?.getService();

// 从方案创建变更集
const changeSet = await service.createFromProposal(proposal, userId);

// 提交变更集
await service.submit(changeSet.id);

// 批准变更集
await service.approve(changeSet.id, approverId);

// 发布变更集
await service.publish(changeSet.id);
```

## API

- `createFromProposal(proposal, createdBy)` - 从方案创建变更集
- `create(input)` - 创建变更集
- `submit(id)` - 提交变更集
- `approve(id, approvedBy)` - 批准变更集
- `reject(id, reason)` - 拒绝变更集
- `publish(id)` - 发布变更集
- `rollback(id)` - 回滚变更集
- `getVersionHistory(limit)` - 获取版本历史

## 变更集状态

- `draft` - 草稿
- `pending` - 待审批
- `approved` - 已批准
- `rejected` - 已拒绝
- `published` - 已发布
- `rolled_back` - 已回滚
