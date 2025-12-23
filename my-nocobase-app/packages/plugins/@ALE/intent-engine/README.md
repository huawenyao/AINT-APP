# @ALE/intent-engine

ALE 意图理解引擎 - 构建态核心组件，提供自然语言意图解析和方案生成。

## 功能

- 意图解析（自然语言 → 结构化意图）
- 方案生成（意图 → 变更方案）
- LLM 集成（OpenAI、Mock）
- 意图澄清
- 方案迭代
- 结果缓存

## 安装

```bash
yarn pm add @ALE/intent-engine
yarn pm enable @ALE/intent-engine
```

## 配置

```typescript
// 在插件配置中设置 LLM Provider
{
  llm: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4-turbo-preview',
  },
}
```

## 使用

```typescript
// 解析意图
const result = await request.post('/api/ale_intent:parse', {
  data: {
    input: {
      type: 'text',
      content: '创建一个延迟订单处置单',
    },
  },
});

// 生成方案
const proposal = await request.post('/api/ale_intent:generateProposal', {
  data: { intentId: result.intent.id },
});
```

## API

- `parse(input)` - 解析意图
- `clarify(intentId, clarification)` - 澄清意图
- `generateProposal(intentId)` - 生成方案
- `iterateProposal(proposalId, feedback)` - 迭代方案
- `confirmProposal(proposalId)` - 确认方案
