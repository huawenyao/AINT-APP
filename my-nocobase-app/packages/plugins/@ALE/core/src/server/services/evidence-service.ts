/**
 * Evidence Service - 证据服务
 * 
 * 提供证据收集、验证和管理功能
 */

import { Database, Repository } from '@nocobase/database';
import { v4 as uuid } from 'uuid';
import type { Evidence } from '../types';

/**
 * 证据服务配置
 */
export interface EvidenceServiceConfig {
  /** 默认置信度阈值 */
  defaultConfidenceThreshold?: number;
  /** 是否自动验证 */
  autoVerify?: boolean;
}

/**
 * 证据服务
 */
export class EvidenceService {
  private db: Database;
  private evidenceRepo: Repository;
  private config: EvidenceServiceConfig;

  constructor(db: Database, config: EvidenceServiceConfig = {}) {
    this.db = db;
    this.evidenceRepo = db.getRepository('ale_evidences');
    this.config = {
      defaultConfidenceThreshold: config.defaultConfidenceThreshold ?? 0.8,
      autoVerify: config.autoVerify ?? false,
    };
  }

  /**
   * 收集证据
   */
  async collect(evidence: Omit<Evidence, 'id' | 'createdAt'>): Promise<string> {
    const evidenceId = uuid();

    await this.evidenceRepo.create({
      values: {
        id: evidenceId,
        type: evidence.type,
        source: evidence.source,
        content: evidence.content,
        confidence: evidence.confidence ?? 1.0,
        verified: this.config.autoVerify ? true : (evidence.verified || false),
        relatedTo: evidence.relatedTo,
        subjectType: evidence.subjectType || '',
        subjectId: evidence.subjectId || '',
        createdById: evidence.createdBy,
        createdAt: new Date(),
      },
    });

    return evidenceId;
  }

  /**
   * 验证证据
   */
  async verify(evidenceId: string, verified: boolean = true): Promise<boolean> {
    const result = await this.evidenceRepo.update({
      filter: { id: evidenceId },
      values: { verified },
    });

    return result.length > 0;
  }

  /**
   * 查询证据
   */
  async query(filter: {
    type?: string;
    subjectType?: string;
    subjectId?: string;
    verified?: boolean;
    minConfidence?: number;
    limit?: number;
  }): Promise<Evidence[]> {
    const queryFilter: Record<string, unknown> = {};

    if (filter.type) {
      queryFilter.type = filter.type;
    }
    if (filter.subjectType) {
      queryFilter.subjectType = filter.subjectType;
    }
    if (filter.subjectId) {
      queryFilter.subjectId = filter.subjectId;
    }
    if (filter.verified !== undefined) {
      queryFilter.verified = filter.verified;
    }
    if (filter.minConfidence !== undefined) {
      queryFilter.confidence = { $gte: filter.minConfidence };
    }

    const evidences = await this.evidenceRepo.find({
      filter: queryFilter,
      sort: ['-createdAt'],
      limit: filter.limit || 100,
    });

    return evidences as Evidence[];
  }

  /**
   * 获取对象的证据
   */
  async getSubjectEvidence(
    subjectType: string,
    subjectId: string,
    type?: string,
  ): Promise<Evidence[]> {
    return this.query({ subjectType, subjectId, type });
  }

  /**
   * 验证证据完整性
   */
  async validateEvidenceCompleteness(
    subjectType: string,
    subjectId: string,
    requiredTypes: string[],
  ): Promise<{ complete: boolean; missing: string[] }> {
    const evidences = await this.getSubjectEvidence(subjectType, subjectId);
    const providedTypes = new Set(evidences.map((e) => e.type));
    const missing = requiredTypes.filter((type) => !providedTypes.has(type));

    return {
      complete: missing.length === 0,
      missing,
    };
  }

  /**
   * 关联证据
   */
  async relateEvidence(evidenceId: string, relatedTo: string[]): Promise<boolean> {
    const result = await this.evidenceRepo.update({
      filter: { id: evidenceId },
      values: { relatedTo },
    });

    return result.length > 0;
  }
}
