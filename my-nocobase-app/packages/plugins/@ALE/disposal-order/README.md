# @ALE/disposal-order

ALE 延迟订单处置场景插件 - MVP 场景验证插件。

## 功能

- 处置单数据模型（disposal_orders, disposal_evidences, disposal_events）
- 状态机（9 个状态，8 个转换）
- 4 个核心动作（assign, submitProposal, approve, execute）
- 门禁集成
- 事件记录和审计

## 安装

```bash
yarn pm add @ALE/disposal-order
yarn pm enable @ALE/disposal-order
```

## 使用

```typescript
// 创建处置单
await request.post('/api/disposal_orders:create', {
  data: {
    orderNo: 'DO-001',
    sourceOrderId: 'ORD-001',
    customerName: '客户A',
    delayDays: 5,
    orderAmount: 1000.00,
    riskLevel: 'low',
  },
});

// 分配处置单
await request.post('/api/disposal_orders:assign', {
  params: { filterByTk: orderId },
  data: { assigneeId: 1 },
});

// 提交方案
await request.post('/api/disposal_orders:submitProposal', {
  params: { filterByTk: orderId },
  data: {
    proposedAction: '联系客户协商延期',
    evidence: [{ type: 'risk_assessment', content: {...} }],
  },
});
```

## 状态机

- `pending` → `assigned` → `proposal_submitted` → `approved` → `executing` → `resolved`
- 支持 `failed`, `escalated`, `cancelled` 状态

## 门禁要求

- `assigned → proposal_submitted`: G1_STRUCTURAL, G3_EVIDENCE
- `proposal_submitted → approved`: G6_EXECUTION, G7_EVALUATION
- `approved → executing`: G6_EXECUTION
- `executing → resolved`: G3_EVIDENCE
