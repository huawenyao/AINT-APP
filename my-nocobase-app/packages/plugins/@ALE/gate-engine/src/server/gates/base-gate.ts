/**
 * Base Gate - 门禁基类
 * 
 * 所有门禁的抽象基类，定义门禁的核心接口
 */

import type { GateResult, Evidence } from '@ALE/core';

/**
 * 门禁类型枚举
 */
export enum GateType {
  /** G1: 结构门禁 - 验证 Schema 合规性 */
  G1_STRUCTURAL = 'G1_STRUCTURAL',
  /** G2: 语义门禁 - 验证业务语义一致性 */
  G2_SEMANTIC = 'G2_SEMANTIC',
  /** G3: 证据门禁 - 验证操作证据完整性 */
  G3_EVIDENCE = 'G3_EVIDENCE',
  /** G4: 权限门禁 - 验证操作权限 */
  G4_PERMISSION = 'G4_PERMISSION',
  /** G5: 流程门禁 - 验证流程状态转换 */
  G5_FLOW = 'G5_FLOW',
  /** G6: 执行门禁 - 验证执行前置条件 */
  G6_EXECUTION = 'G6_EXECUTION',
  /** G7: 评估门禁 - 验证执行后效果 */
  G7_EVALUATION = 'G7_EVALUATION',
}

/**
 * 门禁上下文
 */
export interface GateContext {
  /** 操作类型 */
  action: string;
  /** 主体类型 */
  subjectType: string;
  /** 主体 ID */
  subjectId?: string;
  /** 主体数据 */
  data: Record<string, unknown>;
  /** 变更前数据 */
  before?: Record<string, unknown>;
  /** 变更后数据 */
  after?: Record<string, unknown>;
  /** 操作者 ID */
  actorId?: number;
  /** 操作者类型 */
  actorType?: 'user' | 'system' | 'agent';
  /** Space ID */
  spaceId?: string;
  /** 证据列表 */
  evidences?: Evidence[];
  /** 额外元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 门禁配置
 */
export interface GateConfig {
  /** 门禁名称 */
  name: string;
  /** 门禁类型 */
  type: GateType;
  /** 是否启用 */
  enabled: boolean;
  /** 严重级别 */
  severity: 'info' | 'warning' | 'error' | 'critical';
  /** 配置参数 */
  config?: Record<string, unknown>;
}

/**
 * 门禁基类
 */
export abstract class BaseGate {
  readonly name: string;
  readonly type: GateType;
  protected enabled: boolean;
  protected severity: 'info' | 'warning' | 'error' | 'critical';
  protected config: Record<string, unknown>;

  constructor(gateConfig: GateConfig) {
    this.name = gateConfig.name;
    this.type = gateConfig.type;
    this.enabled = gateConfig.enabled;
    this.severity = gateConfig.severity;
    this.config = gateConfig.config || {};
  }

  /**
   * 检查门禁是否适用于当前上下文
   */
  abstract isApplicable(context: GateContext): boolean;

  /**
   * 执行门禁检查
   */
  abstract check(context: GateContext): Promise<GateResult>;

  /**
   * 获取门禁描述
   */
  abstract getDescription(): string;

  /**
   * 创建通过结果
   */
  protected createPassResult(message: string, details?: Record<string, unknown>): GateResult {
    return {
      gate: this.name,
      passed: true,
      message,
      severity: this.severity,
      details,
      timestamp: new Date(),
    };
  }

  /**
   * 创建失败结果
   */
  protected createFailResult(message: string, details?: Record<string, unknown>): GateResult {
    return {
      gate: this.name,
      passed: false,
      message,
      severity: this.severity,
      details,
      timestamp: new Date(),
    };
  }

  /**
   * 启用门禁
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * 禁用门禁
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * 检查是否启用
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}
