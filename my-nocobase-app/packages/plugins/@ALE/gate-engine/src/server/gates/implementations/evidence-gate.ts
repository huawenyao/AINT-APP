/**
 * G3: Evidence Gate - 证据门禁
 * 
 * 验证操作证据的完整性：
 * - 证据存在性检查
 * - 证据内容验证
 * - 证据关联性验证
 */

import { BaseGate, GateType, GateContext, GateConfig } from '../base-gate';
import type { GateResult, Evidence } from '@ALE/core';

/**
 * 证据要求配置
 */
export interface EvidenceRequirement {
  /** 证据类型 */
  type: string;
  /** 是否必需 */
  required: boolean;
  /** 最小置信度 */
  minConfidence?: number;
  /** 必须包含的字段 */
  requiredFields?: string[];
  /** 验证表达式 */
  validationExpr?: string;
}

/**
 * 证据门禁配置
 */
export interface EvidenceGateConfig extends GateConfig {
  config?: {
    /** 证据要求列表 */
    requirements?: EvidenceRequirement[];
    /** 默认最小置信度 */
    defaultMinConfidence?: number;
  };
}

/**
 * 证据门禁实现
 */
export class EvidenceGate extends BaseGate {
  private requirements: EvidenceRequirement[];
  private defaultMinConfidence: number;

  constructor(config: EvidenceGateConfig) {
    super({
      ...config,
      type: GateType.G3_EVIDENCE,
    });
    
    this.requirements = config.config?.requirements || [];
    this.defaultMinConfidence = config.config?.defaultMinConfidence || 0.8;
  }

  isApplicable(context: GateContext): boolean {
    // 适用于需要证据的高风险操作
    return this.requirements.length > 0 || context.metadata?.requiresEvidence === true;
  }

  async check(context: GateContext): Promise<GateResult> {
    const evidences = context.evidences || [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // 检查每个证据要求
    for (const req of this.requirements) {
      const matchingEvidences = evidences.filter(e => e.type === req.type);
      
      if (matchingEvidences.length === 0) {
        if (req.required) {
          errors.push(`缺少必需的证据类型: ${req.type}`);
        } else {
          warnings.push(`建议提供证据类型: ${req.type}`);
        }
        continue;
      }

      // 验证每个匹配的证据
      for (const evidence of matchingEvidences) {
        // 置信度检查
        const minConf = req.minConfidence || this.defaultMinConfidence;
        if (evidence.confidence !== undefined && evidence.confidence < minConf) {
          errors.push(
            `证据 ${evidence.id} 置信度不足: ${evidence.confidence} < ${minConf}`,
          );
        }

        // 必填字段检查
        if (req.requiredFields) {
          for (const field of req.requiredFields) {
            if (!(field in evidence.content)) {
              errors.push(`证据 ${evidence.id} 缺少必填字段: ${field}`);
            }
          }
        }

        // 验证已验证状态
        if (req.required && !evidence.verified) {
          warnings.push(`证据 ${evidence.id} 尚未验证`);
        }
      }
    }

    if (errors.length > 0) {
      return this.createFailResult(
        `证据验证失败: ${errors.length} 个错误`,
        { errors, warnings },
      );
    }

    if (warnings.length > 0) {
      return this.createPassResult(
        `证据验证通过，但有 ${warnings.length} 个警告`,
        { warnings },
      );
    }

    return this.createPassResult('证据验证通过');
  }

  getDescription(): string {
    return 'G3 证据门禁: 验证操作证据的完整性和有效性';
  }

  /**
   * 添加证据要求
   */
  addRequirement(requirement: EvidenceRequirement): void {
    this.requirements.push(requirement);
  }

  /**
   * 移除证据要求
   */
  removeRequirement(type: string): void {
    this.requirements = this.requirements.filter(r => r.type !== type);
  }

  /**
   * 获取证据要求列表
   */
  getRequirements(): EvidenceRequirement[] {
    return [...this.requirements];
  }
}
