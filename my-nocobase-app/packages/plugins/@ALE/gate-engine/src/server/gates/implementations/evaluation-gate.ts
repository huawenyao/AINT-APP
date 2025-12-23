/**
 * G7: Evaluation Gate - 评估门禁
 * 
 * 验证执行后效果：
 * - 目标达成评估
 * - 副作用检查
 * - 质量指标验证
 */

import { BaseGate, GateType, GateContext, GateConfig } from '../base-gate';
import type { GateResult } from '@ALE/core';

/**
 * 评估规则配置
 */
export interface EvaluationRule {
  /** 规则名称 */
  name: string;
  /** 规则类型 */
  type: 'target' | 'effect' | 'quality';
  /** 规则配置 */
  config: {
    /** 目标达成：期望的字段值 */
    expectedValues?: Record<string, unknown>;
    /** 副作用：检查的关联对象 */
    affectedObjects?: string[];
    /** 质量指标：评估函数 */
    qualityFn?: string;
    /** 质量指标：阈值 */
    threshold?: number;
  };
  /** 失败消息 */
  failureMessage: string;
  /** 是否严重 */
  critical: boolean;
}

/**
 * 评估门禁配置
 */
export interface EvaluationGateConfig extends GateConfig {
  config?: {
    /** 评估规则列表 */
    rules?: EvaluationRule[];
    /** 是否允许部分失败 */
    allowPartialFailure?: boolean;
  };
}

/**
 * 评估门禁实现
 */
export class EvaluationGate extends BaseGate {
  private rules: EvaluationRule[];
  private allowPartialFailure: boolean;

  constructor(config: EvaluationGateConfig) {
    super({
      ...config,
      type: GateType.G7_EVALUATION,
    });
    
    this.rules = config.config?.rules || [];
    this.allowPartialFailure = config.config?.allowPartialFailure || false;
  }

  isApplicable(context: GateContext): boolean {
    // 适用于需要后置评估的操作
    return this.rules.length > 0 && context.after !== undefined;
  }

  async check(context: GateContext): Promise<GateResult> {
    const before = context.before || {};
    const after = context.after || context.data;
    const criticalErrors: string[] = [];
    const warnings: string[] = [];
    const metrics: Record<string, unknown> = {};

    for (const rule of this.rules) {
      const result = await this.evaluateRule(rule, before, after, context);
      
      if (!result.passed) {
        if (rule.critical) {
          criticalErrors.push(result.message);
        } else {
          warnings.push(result.message);
        }
      }

      if (result.metric !== undefined) {
        metrics[rule.name] = result.metric;
      }
    }

    // 如果有严重错误，门禁失败
    if (criticalErrors.length > 0) {
      return this.createFailResult(
        `执行效果评估失败: ${criticalErrors.length} 个关键问题`,
        { criticalErrors, warnings, metrics },
      );
    }

    // 如果不允许部分失败，有警告也失败
    if (!this.allowPartialFailure && warnings.length > 0) {
      return this.createFailResult(
        `执行效果评估失败: ${warnings.length} 个问题`,
        { warnings, metrics },
      );
    }

    return this.createPassResult(
      warnings.length > 0 
        ? `执行效果评估通过，但有 ${warnings.length} 个警告`
        : '执行效果评估通过',
      { warnings, metrics },
    );
  }

  getDescription(): string {
    return 'G7 评估门禁: 验证操作执行后的效果是否符合预期';
  }

  /**
   * 评估单个规则
   */
  private async evaluateRule(
    rule: EvaluationRule,
    before: Record<string, unknown>,
    after: Record<string, unknown>,
    context: GateContext,
  ): Promise<{ passed: boolean; message: string; metric?: number }> {
    switch (rule.type) {
      case 'target':
        return this.evaluateTargetRule(rule, after);
      case 'effect':
        return this.evaluateEffectRule(rule, before, after);
      case 'quality':
        return this.evaluateQualityRule(rule, before, after, context);
      default:
        return { passed: true, message: '' };
    }
  }

  /**
   * 评估目标达成规则
   */
  private evaluateTargetRule(
    rule: EvaluationRule,
    after: Record<string, unknown>,
  ): { passed: boolean; message: string } {
    const expectedValues = rule.config.expectedValues || {};
    const mismatches: string[] = [];

    for (const [field, expectedValue] of Object.entries(expectedValues)) {
      const actualValue = after[field];
      if (actualValue !== expectedValue) {
        mismatches.push(`${field}: 期望 ${JSON.stringify(expectedValue)}, 实际 ${JSON.stringify(actualValue)}`);
      }
    }

    if (mismatches.length > 0) {
      return {
        passed: false,
        message: `${rule.failureMessage}: ${mismatches.join('; ')}`,
      };
    }

    return { passed: true, message: '' };
  }

  /**
   * 评估副作用规则
   */
  private evaluateEffectRule(
    rule: EvaluationRule,
    before: Record<string, unknown>,
    after: Record<string, unknown>,
  ): { passed: boolean; message: string } {
    // 检查预期之外的变更
    const unexpectedChanges: string[] = [];
    const affectedObjects = new Set(rule.config.affectedObjects || []);

    for (const key of Object.keys(after)) {
      if (!affectedObjects.has(key) && before[key] !== after[key]) {
        unexpectedChanges.push(key);
      }
    }

    if (unexpectedChanges.length > 0) {
      return {
        passed: false,
        message: `${rule.failureMessage}: 发现意外变更 ${unexpectedChanges.join(', ')}`,
      };
    }

    return { passed: true, message: '' };
  }

  /**
   * 评估质量指标规则
   */
  private evaluateQualityRule(
    rule: EvaluationRule,
    before: Record<string, unknown>,
    after: Record<string, unknown>,
    context: GateContext,
  ): { passed: boolean; message: string; metric?: number } {
    try {
      // 执行质量评估函数
      const qualityFn = rule.config.qualityFn!;
      const fn = new Function('before', 'after', 'context', `return ${qualityFn}`);
      const metric = fn(before, after, context) as number;
      
      const threshold = rule.config.threshold || 0;
      const passed = metric >= threshold;

      return {
        passed,
        message: passed ? '' : `${rule.failureMessage}: 指标 ${metric} < 阈值 ${threshold}`,
        metric,
      };
    } catch (error) {
      return {
        passed: false,
        message: `质量评估执行错误: ${error}`,
      };
    }
  }

  /**
   * 添加评估规则
   */
  addRule(rule: EvaluationRule): void {
    this.rules.push(rule);
  }

  /**
   * 移除评估规则
   */
  removeRule(name: string): void {
    this.rules = this.rules.filter(r => r.name !== name);
  }
}
