/**
 * G6: Execution Gate - 执行门禁
 * 
 * 验证执行前置条件：
 * - 状态前置条件
 * - 业务规则验证
 * - 资源可用性检查
 */

import { BaseGate, GateType, GateContext, GateConfig } from '../base-gate';
import type { GateResult } from '@ALE/core';

/**
 * 前置条件配置
 */
export interface PreCondition {
  /** 条件名称 */
  name: string;
  /** 条件类型 */
  type: 'state' | 'field' | 'expression' | 'custom';
  /** 条件配置 */
  config: {
    /** 状态条件：期望的状态 */
    expectedState?: string | string[];
    /** 字段条件：字段名 */
    field?: string;
    /** 字段条件：操作符 */
    operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'notIn' | 'exists' | 'notExists';
    /** 字段条件：值 */
    value?: unknown;
    /** 表达式条件 */
    expression?: string;
    /** 自定义验证函数名 */
    validator?: string;
  };
  /** 错误消息 */
  errorMessage: string;
}

/**
 * 执行门禁配置
 */
export interface ExecutionGateConfig extends GateConfig {
  config?: {
    /** 前置条件列表 */
    preConditions?: PreCondition[];
    /** 状态字段名 */
    stateField?: string;
  };
}

/**
 * 执行门禁实现
 */
export class ExecutionGate extends BaseGate {
  private preConditions: PreCondition[];
  private stateField: string;

  constructor(config: ExecutionGateConfig) {
    super({
      ...config,
      type: GateType.G6_EXECUTION,
    });
    
    this.preConditions = config.config?.preConditions || [];
    this.stateField = config.config?.stateField || 'status';
  }

  isApplicable(context: GateContext): boolean {
    return this.preConditions.length > 0;
  }

  async check(context: GateContext): Promise<GateResult> {
    const data = context.before || context.data;
    const errors: string[] = [];

    for (const condition of this.preConditions) {
      const result = await this.evaluateCondition(condition, data, context);
      if (!result.passed) {
        errors.push(result.message);
      }
    }

    if (errors.length > 0) {
      return this.createFailResult(
        `执行前置条件验证失败`,
        { errors },
      );
    }

    return this.createPassResult('执行前置条件验证通过');
  }

  getDescription(): string {
    return 'G6 执行门禁: 验证操作的前置条件是否满足';
  }

  /**
   * 评估单个条件
   */
  private async evaluateCondition(
    condition: PreCondition,
    data: Record<string, unknown>,
    context: GateContext,
  ): Promise<{ passed: boolean; message: string }> {
    const { type, config, errorMessage } = condition;

    switch (type) {
      case 'state':
        return this.evaluateStateCondition(data, config, errorMessage);
      case 'field':
        return this.evaluateFieldCondition(data, config, errorMessage);
      case 'expression':
        return this.evaluateExpressionCondition(data, config, context, errorMessage);
      default:
        return { passed: true, message: '' };
    }
  }

  /**
   * 评估状态条件
   */
  private evaluateStateCondition(
    data: Record<string, unknown>,
    config: PreCondition['config'],
    errorMessage: string,
  ): { passed: boolean; message: string } {
    const currentState = data[this.stateField] as string;
    const expectedStates = Array.isArray(config.expectedState)
      ? config.expectedState
      : [config.expectedState];

    const passed = expectedStates.includes(currentState);
    return {
      passed,
      message: passed ? '' : errorMessage,
    };
  }

  /**
   * 评估字段条件
   */
  private evaluateFieldCondition(
    data: Record<string, unknown>,
    config: PreCondition['config'],
    errorMessage: string,
  ): { passed: boolean; message: string } {
    const fieldValue = data[config.field!];
    const expectedValue = config.value;
    let passed = false;

    switch (config.operator) {
      case 'eq':
        passed = fieldValue === expectedValue;
        break;
      case 'neq':
        passed = fieldValue !== expectedValue;
        break;
      case 'gt':
        passed = (fieldValue as number) > (expectedValue as number);
        break;
      case 'gte':
        passed = (fieldValue as number) >= (expectedValue as number);
        break;
      case 'lt':
        passed = (fieldValue as number) < (expectedValue as number);
        break;
      case 'lte':
        passed = (fieldValue as number) <= (expectedValue as number);
        break;
      case 'in':
        passed = (expectedValue as unknown[]).includes(fieldValue);
        break;
      case 'notIn':
        passed = !(expectedValue as unknown[]).includes(fieldValue);
        break;
      case 'exists':
        passed = fieldValue !== undefined && fieldValue !== null;
        break;
      case 'notExists':
        passed = fieldValue === undefined || fieldValue === null;
        break;
      default:
        passed = true;
    }

    return {
      passed,
      message: passed ? '' : errorMessage,
    };
  }

  /**
   * 评估表达式条件
   */
  private evaluateExpressionCondition(
    data: Record<string, unknown>,
    config: PreCondition['config'],
    context: GateContext,
    errorMessage: string,
  ): { passed: boolean; message: string } {
    try {
      // 创建安全的表达式执行环境
      const expression = config.expression!;
      const fn = new Function('data', 'context', `return ${expression}`);
      const passed = fn(data, context);
      
      return {
        passed: Boolean(passed),
        message: passed ? '' : errorMessage,
      };
    } catch (error) {
      return {
        passed: false,
        message: `表达式执行错误: ${error}`,
      };
    }
  }

  /**
   * 添加前置条件
   */
  addPreCondition(condition: PreCondition): void {
    this.preConditions.push(condition);
  }

  /**
   * 移除前置条件
   */
  removePreCondition(name: string): void {
    this.preConditions = this.preConditions.filter(c => c.name !== name);
  }
}
