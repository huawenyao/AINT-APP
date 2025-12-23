/**
 * Intent Parser - 意图解析器
 * 
 * 负责将用户的自然语言输入解析为结构化的意图
 */

import { v4 as uuid } from 'uuid';
import type {
  IntentInput,
  ParsedIntent,
  IntentCategory,
  IntentSubject,
  IntentAction,
  IntentConstraint,
  ClarificationRequest,
  DesignContext,
} from '@ALE/core';

/**
 * LLM Provider 接口
 */
export interface LLMProvider {
  complete(prompt: string, options?: LLMOptions): Promise<string>;
  parseJSON<T>(prompt: string, options?: LLMOptions): Promise<T>;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

/**
 * 意图解析结果
 */
export interface IntentParseResult {
  success: boolean;
  intent?: ParsedIntent;
  error?: string;
  needsClarification?: boolean;
  clarifications?: ClarificationRequest[];
}

/**
 * 意图解析器配置
 */
export interface IntentParserConfig {
  provider: LLMProvider;
  contextWindow?: number;
  confidenceThreshold?: number;
  enableAutoCorrect?: boolean;
}

/**
 * 意图解析器
 */
export class IntentParser {
  private provider: LLMProvider;
  private confidenceThreshold: number;
  private enableAutoCorrect: boolean;

  constructor(config: IntentParserConfig) {
    this.provider = config.provider;
    this.confidenceThreshold = config.confidenceThreshold ?? 0.7;
    this.enableAutoCorrect = config.enableAutoCorrect ?? true;
  }

  /**
   * 解析意图
   */
  async parse(input: IntentInput): Promise<IntentParseResult> {
    try {
      // 构建解析 prompt
      const prompt = this.buildParsePrompt(input);
      
      // 调用 LLM 解析
      const result = await this.provider.parseJSON<RawParsedIntent>(prompt, {
        temperature: 0.2,
        maxTokens: 2000,
      });

      // 验证和转换结果
      const parsedIntent = this.transformResult(result, input);
      
      // 检查置信度
      if (parsedIntent.confidence < this.confidenceThreshold) {
        return {
          success: true,
          intent: parsedIntent,
          needsClarification: true,
          clarifications: parsedIntent.clarifications,
        };
      }

      return {
        success: true,
        intent: parsedIntent,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 澄清意图
   */
  async clarify(
    originalIntent: ParsedIntent,
    clarification: Record<string, string>,
  ): Promise<IntentParseResult> {
    try {
      const prompt = this.buildClarificationPrompt(originalIntent, clarification);
      
      const result = await this.provider.parseJSON<RawParsedIntent>(prompt, {
        temperature: 0.1,
        maxTokens: 2000,
      });

      const updatedIntent = this.transformResult(result, {
        type: 'text',
        content: originalIntent.rawInput,
      });

      // 继承原始 ID
      updatedIntent.id = originalIntent.id;

      return {
        success: true,
        intent: updatedIntent,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 构建解析 Prompt
   */
  private buildParsePrompt(input: IntentInput): string {
    const contextInfo = input.context ? this.formatContext(input.context) : '';
    
    return `你是一个专业的意图理解 AI，负责将用户的自然语言需求解析为结构化的意图。

## 用户输入
"${input.content}"

## 上下文
${contextInfo || '无额外上下文'}

## 输出要求
请将用户意图解析为 JSON 格式，包含以下字段：

{
  "category": "create | modify | delete | query | analyze | automate",
  "subjects": [
    {
      "type": "object | relation | flow | view | rule | action",
      "name": "主体名称",
      "inferred": false,
      "properties": {}
    }
  ],
  "actions": [
    {
      "verb": "动作动词",
      "target": "动作目标",
      "parameters": {}
    }
  ],
  "constraints": [
    {
      "type": "condition | validation | permission | workflow",
      "expression": "约束表达式",
      "value": null
    }
  ],
  "confidence": 0.0-1.0,
  "clarifications": [
    {
      "question": "需要澄清的问题",
      "options": ["选项1", "选项2"],
      "required": true
    }
  ],
  "summary": "一句话总结用户意图"
}

## 解析规则
1. 识别用户想要操作的核心对象（object）
2. 识别对象的属性和关系
3. 识别业务规则和约束条件
4. 如果意图不明确，设置 confidence < 0.7 并生成 clarifications
5. 尽可能推断隐含的意图，标记 inferred: true

请直接输出 JSON，不要有其他文字。`;
  }

  /**
   * 构建澄清 Prompt
   */
  private buildClarificationPrompt(
    originalIntent: ParsedIntent,
    clarification: Record<string, string>,
  ): string {
    const clarificationText = Object.entries(clarification)
      .map(([q, a]) => `Q: ${q}\nA: ${a}`)
      .join('\n\n');

    return `你是一个专业的意图理解 AI。用户已经对之前的意图进行了澄清。

## 原始意图
${originalIntent.rawInput}

## 已解析结构
${JSON.stringify(originalIntent, null, 2)}

## 用户澄清
${clarificationText}

## 任务
根据用户的澄清，更新并完善意图解析结果。输出完整的 JSON 结构。

请直接输出 JSON，不要有其他文字。`;
  }

  /**
   * 格式化上下文
   */
  private formatContext(context: DesignContext): string {
    const parts: string[] = [];
    
    if (context.spaceId) {
      parts.push(`当前 Space: ${context.spaceId}`);
    }
    if (context.currentView) {
      parts.push(`当前视图: ${context.currentView}`);
    }
    if (context.selectedObjects?.length) {
      parts.push(`已选对象: ${context.selectedObjects.join(', ')}`);
    }
    if (context.conversationHistory?.length) {
      const recentHistory = context.conversationHistory.slice(-3);
      parts.push('最近对话:');
      recentHistory.forEach((msg) => {
        parts.push(`  ${msg.role}: ${msg.content}`);
      });
    }
    
    return parts.join('\n');
  }

  /**
   * 转换 LLM 结果为 ParsedIntent
   */
  private transformResult(raw: RawParsedIntent, input: IntentInput): ParsedIntent {
    return {
      id: uuid(),
      category: raw.category as IntentCategory,
      subjects: raw.subjects as IntentSubject[],
      actions: raw.actions as IntentAction[],
      constraints: raw.constraints as IntentConstraint[],
      confidence: raw.confidence,
      clarifications: raw.clarifications as ClarificationRequest[],
      rawInput: input.content,
      createdAt: new Date(),
    };
  }
}

/**
 * LLM 返回的原始意图格式
 */
interface RawParsedIntent {
  category: string;
  subjects: Array<{
    type: string;
    name: string;
    inferred: boolean;
    properties?: Record<string, unknown>;
  }>;
  actions: Array<{
    verb: string;
    target: string;
    parameters?: Record<string, unknown>;
  }>;
  constraints: Array<{
    type: string;
    expression: string;
    value?: unknown;
  }>;
  confidence: number;
  clarifications?: Array<{
    question: string;
    options?: string[];
    required: boolean;
  }>;
  summary?: string;
}
