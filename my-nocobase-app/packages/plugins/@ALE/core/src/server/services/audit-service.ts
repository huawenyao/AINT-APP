/**
 * Audit Service - 审计服务
 * 
 * 提供操作审计记录和追踪链功能
 */

import { Database, Repository } from '@nocobase/database';
import { v4 as uuid } from 'uuid';
import type { AuditLog } from '../types';

/**
 * 审计服务配置
 */
export interface AuditServiceConfig {
  /** 是否自动记录所有操作 */
  autoLog?: boolean;
  /** 默认保留天数 */
  defaultRetentionDays?: number;
}

/**
 * 审计服务
 */
export class AuditService {
  private db: Database;
  private auditRepo: Repository;
  private config: AuditServiceConfig;

  constructor(db: Database, config: AuditServiceConfig = {}) {
    this.db = db;
    this.auditRepo = db.getRepository('ale_audit_logs');
    this.config = {
      autoLog: config.autoLog ?? true,
      defaultRetentionDays: config.defaultRetentionDays ?? 365,
    };
  }

  /**
   * 记录审计日志
   */
  async log(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<string> {
    const logId = uuid();
    
    await this.auditRepo.create({
      values: {
        id: logId,
        action: entry.action,
        actorId: entry.actorId,
        actorType: entry.actorType || 'user',
        subjectType: entry.subjectType,
        subjectId: entry.subjectId,
        data: entry.data,
        result: entry.result,
        correlationId: entry.correlationId || this.generateCorrelationId(),
        spaceId: entry.spaceId,
        timestamp: new Date(),
      },
    });

    return logId;
  }

  /**
   * 查询审计日志
   */
  async query(filter: {
    action?: string;
    actorId?: number;
    subjectType?: string;
    subjectId?: string;
    correlationId?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  }): Promise<AuditLog[]> {
    const queryFilter: Record<string, unknown> = {};

    if (filter.action) {
      queryFilter.action = filter.action;
    }
    if (filter.actorId) {
      queryFilter.actorId = filter.actorId;
    }
    if (filter.subjectType) {
      queryFilter.subjectType = filter.subjectType;
    }
    if (filter.subjectId) {
      queryFilter.subjectId = filter.subjectId;
    }
    if (filter.correlationId) {
      queryFilter.correlationId = filter.correlationId;
    }
    if (filter.startTime || filter.endTime) {
      queryFilter.timestamp = {};
      if (filter.startTime) {
        queryFilter.timestamp.$gte = filter.startTime;
      }
      if (filter.endTime) {
        queryFilter.timestamp.$lte = filter.endTime;
      }
    }

    const logs = await this.auditRepo.find({
      filter: queryFilter,
      sort: ['-timestamp'],
      limit: filter.limit || 100,
    });

    return logs as AuditLog[];
  }

  /**
   * 获取追踪链
   */
  async getTraceChain(correlationId: string): Promise<AuditLog[]> {
    return this.query({ correlationId });
  }

  /**
   * 获取对象的操作历史
   */
  async getSubjectHistory(
    subjectType: string,
    subjectId: string,
    limit = 50,
  ): Promise<AuditLog[]> {
    return this.query({ subjectType, subjectId, limit });
  }

  /**
   * 获取操作者的操作历史
   */
  async getActorHistory(actorId: number, limit = 50): Promise<AuditLog[]> {
    return this.query({ actorId, limit });
  }

  /**
   * 清理过期日志
   */
  async cleanup(retentionDays?: number): Promise<number> {
    const days = retentionDays || this.config.defaultRetentionDays!;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await this.auditRepo.destroy({
      filter: {
        timestamp: { $lt: cutoffDate },
      },
    });

    return result.length;
  }

  /**
   * 生成关联 ID
   */
  private generateCorrelationId(): string {
    return `ale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
