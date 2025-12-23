/**
 * OpenAI LLM Provider
 * 
 * 封装 OpenAI API 调用
 */

import OpenAI from 'openai';
import { LLMProvider, LLMOptions } from '../intent-parser';

/**
 * OpenAI Provider 配置
 */
export interface OpenAIProviderConfig {
  apiKey: string;
  baseURL?: string;
  defaultModel?: string;
  organization?: string;
}

/**
 * OpenAI LLM Provider 实现
 */
export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private defaultModel: string;

  constructor(config: OpenAIProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      organization: config.organization,
    });
    this.defaultModel = config.defaultModel || 'gpt-4-turbo-preview';
  }

  /**
   * 文本补全
   */
  async complete(prompt: string, options?: LLMOptions): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: options?.model || this.defaultModel,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that provides structured responses.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
    });

    return response.choices[0]?.message?.content || '';
  }

  /**
   * JSON 解析补全
   */
  async parseJSON<T>(prompt: string, options?: LLMOptions): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: options?.model || this.defaultModel,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that ONLY outputs valid JSON. No markdown, no explanations, just pure JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: options?.temperature ?? 0.2,
      max_tokens: options?.maxTokens ?? 4000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    
    try {
      return JSON.parse(content) as T;
    } catch (error) {
      throw new Error(`Failed to parse LLM response as JSON: ${content}`);
    }
  }
}

/**
 * 创建 OpenAI Provider 工厂函数
 */
export function createOpenAIProvider(config: OpenAIProviderConfig): LLMProvider {
  return new OpenAIProvider(config);
}
