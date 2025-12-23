/**
 * G1: Structural Gate - 结构门禁
 * 
 * 验证数据结构的合规性：
 * - Schema 验证
 * - 必填字段检查
 * - 类型检查
 * - 格式验证
 */

import { z, ZodSchema, ZodError } from 'zod';
import { BaseGate, GateType, GateContext, GateConfig } from '../base-gate';
import type { GateResult } from '@ALE/core';

/**
 * 结构门禁配置
 */
export interface StructuralGateConfig extends GateConfig {
  config?: {
    /** Schema 定义 */
    schema?: Record<string, unknown>;
    /** 必填字段 */
    requiredFields?: string[];
    /** 字段类型映射 */
    fieldTypes?: Record<string, string>;
  };
}

/**
 * 结构门禁实现
 */
export class StructuralGate extends BaseGate {
  private zodSchema?: ZodSchema;
  private requiredFields: string[];
  private fieldTypes: Record<string, string>;

  constructor(config: StructuralGateConfig) {
    super({
      ...config,
      type: GateType.G1_STRUCTURAL,
    });
    
    this.requiredFields = config.config?.requiredFields || [];
    this.fieldTypes = config.config?.fieldTypes || {};
    
    if (config.config?.schema) {
      this.zodSchema = this.buildZodSchema(config.config.schema);
    }
  }

  isApplicable(context: GateContext): boolean {
    // 适用于创建和更新操作
    return ['create', 'update'].includes(context.action);
  }

  async check(context: GateContext): Promise<GateResult> {
    const data = context.after || context.data;
    const errors: string[] = [];

    // 1. 必填字段检查
    for (const field of this.requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        errors.push(`必填字段 "${field}" 不能为空`);
      }
    }

    // 2. 字段类型检查
    for (const [field, expectedType] of Object.entries(this.fieldTypes)) {
      if (data[field] !== undefined && data[field] !== null) {
        const actualType = typeof data[field];
        if (!this.isTypeCompatible(actualType, expectedType)) {
          errors.push(`字段 "${field}" 类型错误: 期望 ${expectedType}, 实际 ${actualType}`);
        }
      }
    }

    // 3. Zod Schema 验证
    if (this.zodSchema) {
      try {
        this.zodSchema.parse(data);
      } catch (error) {
        if (error instanceof ZodError) {
          for (const issue of error.issues) {
            errors.push(`${issue.path.join('.')}: ${issue.message}`);
          }
        }
      }
    }

    if (errors.length > 0) {
      return this.createFailResult(
        `结构验证失败: ${errors.length} 个错误`,
        { errors },
      );
    }

    return this.createPassResult('结构验证通过');
  }

  getDescription(): string {
    return 'G1 结构门禁: 验证数据结构的合规性，包括必填字段、类型和格式';
  }

  /**
   * 检查类型兼容性
   */
  private isTypeCompatible(actual: string, expected: string): boolean {
    const typeMap: Record<string, string[]> = {
      string: ['string'],
      number: ['number', 'bigint'],
      integer: ['number', 'bigint'],
      float: ['number'],
      boolean: ['boolean'],
      object: ['object'],
      array: ['object'], // arrays are objects in JS
    };

    const compatibleTypes = typeMap[expected] || [expected];
    return compatibleTypes.includes(actual);
  }

  /**
   * 从配置构建 Zod Schema
   */
  private buildZodSchema(schemaConfig: Record<string, unknown>): ZodSchema {
    const shape: Record<string, ZodSchema> = {};
    
    for (const [field, config] of Object.entries(schemaConfig)) {
      const fieldConfig = config as { type: string; required?: boolean };
      let fieldSchema = this.getZodType(fieldConfig.type);
      
      if (!fieldConfig.required) {
        fieldSchema = fieldSchema.optional();
      }
      
      shape[field] = fieldSchema;
    }

    return z.object(shape).passthrough();
  }

  /**
   * 获取 Zod 类型
   */
  private getZodType(type: string): ZodSchema {
    switch (type) {
      case 'string':
        return z.string();
      case 'number':
      case 'integer':
      case 'float':
        return z.number();
      case 'boolean':
        return z.boolean();
      case 'date':
        return z.date().or(z.string());
      case 'uuid':
        return z.string().uuid();
      case 'email':
        return z.string().email();
      case 'url':
        return z.string().url();
      default:
        return z.any();
    }
  }
}
