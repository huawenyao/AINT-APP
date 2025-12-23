/**
 * Prompt Templates - Prompt 模板管理
 * 
 * 管理各种 LLM Prompt 模板
 */

/**
 * 意图解析 Prompt 模板
 */
export const INTENT_PARSE_PROMPT = `你是一个专业的意图理解 AI，负责将用户的自然语言需求解析为结构化的意图。

## 用户输入
"{input}"

## 上下文
{context}

## 输出要求
请将用户意图解析为 JSON 格式，包含以下字段：

{{
  "category": "create | modify | delete | query | analyze | automate",
  "subjects": [
    {{
      "type": "object | relation | flow | view | rule | action",
      "name": "主体名称",
      "inferred": false,
      "properties": {{}}
    }}
  ],
  "actions": [
    {{
      "verb": "动作动词",
      "target": "动作目标",
      "parameters": {{}}
    }}
  ],
  "constraints": [
    {{
      "type": "condition | validation | permission | workflow",
      "expression": "约束表达式",
      "value": null
    }}
  ],
  "confidence": 0.0-1.0,
  "clarifications": [
    {{
      "question": "需要澄清的问题",
      "options": ["选项1", "选项2"],
      "required": true
    }}
  ],
  "summary": "一句话总结用户意图"
}}

## 解析规则
1. 识别用户想要操作的核心对象（object）
2. 识别对象的属性和关系
3. 识别业务规则和约束条件
4. 如果意图不明确，设置 confidence < 0.7 并生成 clarifications
5. 尽可能推断隐含的意图，标记 inferred: true

请直接输出 JSON，不要有其他文字。`;

/**
 * 方案生成 Prompt 模板
 */
export const PROPOSAL_GENERATE_PROMPT = `你是一个专业的系统设计 AI，负责根据用户意图生成变更方案。

## 用户意图
{intent}

## 当前本体上下文
{ontologyContext}

## 输出要求
请生成完整的变更方案 JSON，包含：

{{
  "summary": "方案摘要",
  "components": {{
    "objects": [],
    "relations": [],
    "flows": [],
    "views": [],
    "rules": [],
    "actions": []
  }},
  "impact": {{
    "affectedObjects": [],
    "affectedViews": [],
    "affectedFlows": [],
    "affectedRules": [],
    "riskLevel": "low | medium | high | critical",
    "warnings": [],
    "suggestions": []
  }}
}}

请直接输出 JSON，不要有其他文字。`;

/**
 * 方案迭代 Prompt 模板
 */
export const PROPOSAL_ITERATE_PROMPT = `你是一个专业的系统设计 AI。用户对之前的方案提供了反馈，请根据反馈更新方案。

## 原始方案
{originalProposal}

## 用户反馈
{feedback}

## 任务
根据用户反馈，更新方案。保留用户确认的部分，只修改需要调整的部分。

请直接输出完整的更新后方案 JSON，不要有其他文字。`;

/**
 * Prompt 模板管理器
 */
export class PromptTemplateManager {
  /**
   * 渲染模板
   */
  static render(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  }

  /**
   * 获取意图解析 Prompt
   */
  static getIntentParsePrompt(input: string, context: string = ''): string {
    return this.render(INTENT_PARSE_PROMPT, {
      input,
      context: context || '无额外上下文',
    });
  }

  /**
   * 获取方案生成 Prompt
   */
  static getProposalGeneratePrompt(intent: string, ontologyContext: string): string {
    return this.render(PROPOSAL_GENERATE_PROMPT, {
      intent,
      ontologyContext,
    });
  }

  /**
   * 获取方案迭代 Prompt
   */
  static getProposalIteratePrompt(originalProposal: string, feedback: string): string {
    return this.render(PROPOSAL_ITERATE_PROMPT, {
      originalProposal,
      feedback,
    });
  }
}
