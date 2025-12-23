# @ALE/gate-engine

ALE 门禁引擎 - 控制面核心组件，提供 7 种门禁类型的检查和链式执行。

## 功能

- G1_STRUCTURAL - 结构门禁（Schema 验证）
- G3_EVIDENCE - 证据门禁（证据完整性）
- G6_EXECUTION - 执行门禁（前置条件）
- G7_EVALUATION - 评估门禁（后置效果）
- 门禁链式执行
- 结果缓存
- 报告生成

## 安装

```bash
yarn pm add @ALE/gate-engine
yarn pm enable @ALE/gate-engine
```

## 使用

```typescript
import { GateEngine, GateContext } from '@ALE/gate-engine';

const gateEngine = app.plugin('@ALE/gate-engine')?.getEngine();

const context: GateContext = {
  action: 'create',
  subjectType: 'disposal_orders',
  data: { orderNo: 'DO-001' },
  actorId: 1,
};

const result = await gateEngine.execute(context, ['G1_STRUCTURAL', 'G3_EVIDENCE']);
if (!result.passed) {
  console.error('门禁检查失败:', result.summary);
}
```

## API

- `execute(context, gates?)` - 执行门禁链
- `preCheck(context, gateTypes)` - 执行预检
- `registerGate(gate)` - 注册门禁
- `getGate(name)` - 获取门禁
- `getAllGates()` - 获取所有门禁

## 门禁类型

| 门禁 | 名称 | 说明 |
|-----|------|------|
| G1 | STRUCTURAL | 结构验证（Schema、类型、必填字段） |
| G3 | EVIDENCE | 证据验证（证据存在性、置信度） |
| G6 | EXECUTION | 执行验证（权限、状态、前置条件） |
| G7 | EVALUATION | 评估验证（目标达成、副作用、质量指标） |
