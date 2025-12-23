/**
 * ChangeSet Service - 变更集服务
 * 
 * 双态桥接核心组件，负责：
 * - 从方案生成变更集
 * - 变更集生命周期管理
 * - 变更集应用和回滚
 * - 版本控制
 */

import { Database, Repository } from '@nocobase/database';
import { v4 as uuid } from 'uuid';
import * as semver from 'semver';
import type {
  ChangeSet,
  ChangeSetChange,
  ChangeSetStatus,
  ChangeSetType,
  ChangeProposal,
  RiskLevel,
  GateReport,
} from '@ALE/core';

/**
 * 变更集创建输入
 */
export interface CreateChangeSetInput {
  title: string;
  description?: string;
  type: ChangeSetType;
  changes: Omit<ChangeSetChange, 'id'>[];
  proposalId?: string;
  riskLevel?: RiskLevel;
  createdBy: number;
}

/**
 * 变更集服务
 */
export class ChangeSetService {
  private db: Database;
  private changeSetRepo: Repository;
  private snapshotRepo: Repository;
  private ontologyRepo: Repository;

  constructor(db: Database) {
    this.db = db;
    this.changeSetRepo = db.getRepository('ale_changesets');
    this.snapshotRepo = db.getRepository('ale_version_snapshots');
    this.ontologyRepo = db.getRepository('ale_ontology_objects');
  }

  /**
   * 从方案创建变更集
   */
  async createFromProposal(
    proposal: ChangeProposal,
    createdBy: number,
  ): Promise<ChangeSet> {
    const changes: Omit<ChangeSetChange, 'id'>[] = [];

    // 转换对象变更
    for (const obj of proposal.components.objects || []) {
      const existing = await this.ontologyRepo.findOne({
        filter: { collectionName: obj.collectionName },
      });

      changes.push({
        action: existing ? 'update' : 'create',
        type: 'object',
        target: obj.collectionName,
        before: existing ? this.extractObjectData(existing) : undefined,
        after: this.extractObjectData(obj),
      });
    }

    // 转换关系变更
    for (const rel of proposal.components.relations || []) {
      changes.push({
        action: 'create',
        type: 'relation',
        target: rel.name,
        after: rel as unknown as Record<string, unknown>,
      });
    }

    // 转换流程变更
    for (const flow of proposal.components.flows || []) {
      changes.push({
        action: 'create',
        type: 'flow',
        target: flow.name,
        after: flow as unknown as Record<string, unknown>,
      });
    }

    // 转换视图变更
    for (const view of proposal.components.views || []) {
      changes.push({
        action: 'create',
        type: 'view',
        target: view.name,
        after: view as unknown as Record<string, unknown>,
      });
    }

    // 转换规则变更
    for (const rule of proposal.components.rules || []) {
      changes.push({
        action: 'create',
        type: 'rule',
        target: rule.name,
        after: rule as unknown as Record<string, unknown>,
      });
    }

    // 转换动作变更
    for (const action of proposal.components.actions || []) {
      changes.push({
        action: 'create',
        type: 'action',
        target: action.name,
        after: action as unknown as Record<string, unknown>,
      });
    }

    return this.create({
      title: proposal.summary,
      description: `从方案 ${proposal.id} 生成`,
      type: 'design',
      changes,
      proposalId: proposal.id,
      riskLevel: proposal.impact.riskLevel,
      createdBy,
    });
  }

  /**
   * 创建变更集
   */
  async create(input: CreateChangeSetInput): Promise<ChangeSet> {
    const changeSetId = uuid();
    const changes = input.changes.map(c => ({
      ...c,
      id: uuid(),
    }));

    // 获取当前版本
    const latestSnapshot = await this.snapshotRepo.findOne({
      sort: ['-createdAt'],
    });
    const parentVersion = latestSnapshot?.version;
    const newVersion = this.generateNextVersion(parentVersion);

    const changeSet: ChangeSet = {
      id: changeSetId,
      title: input.title,
      description: input.description,
      type: input.type,
      status: 'draft',
      changes,
      proposalId: input.proposalId,
      riskLevel: input.riskLevel || 'low',
      version: newVersion,
      parentVersion,
      createdBy: input.createdBy,
      createdAt: new Date(),
    };

    await this.changeSetRepo.create({
      values: changeSet,
    });

    return changeSet;
  }

  /**
   * 获取变更集
   */
  async get(id: string): Promise<ChangeSet | null> {
    const result = await this.changeSetRepo.findOne({
      filter: { id },
    });
    return result as ChangeSet | null;
  }

  /**
   * 提交变更集（请求审批）
   */
  async submit(id: string): Promise<ChangeSet> {
    const changeSet = await this.get(id);
    if (!changeSet) {
      throw new Error('ChangeSet not found');
    }

    if (changeSet.status !== 'draft') {
      throw new Error('Only draft changesets can be submitted');
    }

    await this.changeSetRepo.update({
      filter: { id },
      values: {
        status: 'pending',
        submittedAt: new Date(),
      },
    });

    return { ...changeSet, status: 'pending', submittedAt: new Date() };
  }

  /**
   * 批准变更集
   */
  async approve(id: string, approvedBy: number): Promise<ChangeSet> {
    const changeSet = await this.get(id);
    if (!changeSet) {
      throw new Error('ChangeSet not found');
    }

    if (changeSet.status !== 'pending') {
      throw new Error('Only pending changesets can be approved');
    }

    await this.changeSetRepo.update({
      filter: { id },
      values: {
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
      },
    });

    return { ...changeSet, status: 'approved', approvedBy, approvedAt: new Date() };
  }

  /**
   * 拒绝变更集
   */
  async reject(id: string, reason?: string): Promise<ChangeSet> {
    const changeSet = await this.get(id);
    if (!changeSet) {
      throw new Error('ChangeSet not found');
    }

    if (changeSet.status !== 'pending') {
      throw new Error('Only pending changesets can be rejected');
    }

    await this.changeSetRepo.update({
      filter: { id },
      values: {
        status: 'rejected',
        description: reason ? `${changeSet.description}\n\n拒绝原因: ${reason}` : changeSet.description,
      },
    });

    return { ...changeSet, status: 'rejected' };
  }

  /**
   * 发布变更集（应用到本体）
   */
  async publish(id: string): Promise<{ success: boolean; error?: string }> {
    const changeSet = await this.get(id);
    if (!changeSet) {
      return { success: false, error: 'ChangeSet not found' };
    }

    if (changeSet.status !== 'approved') {
      return { success: false, error: 'Only approved changesets can be published' };
    }

    try {
      // 在事务中应用变更
      await this.db.sequelize.transaction(async () => {
        for (const change of changeSet.changes) {
          await this.applyChange(change);
        }

        // 创建版本快照
        await this.createSnapshot(changeSet);

        // 更新变更集状态
        await this.changeSetRepo.update({
          filter: { id },
          values: {
            status: 'published',
            publishedAt: new Date(),
          },
        });
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 回滚变更集
   */
  async rollback(id: string): Promise<{ success: boolean; error?: string }> {
    const changeSet = await this.get(id);
    if (!changeSet) {
      return { success: false, error: 'ChangeSet not found' };
    }

    if (changeSet.status !== 'published') {
      return { success: false, error: 'Only published changesets can be rolled back' };
    }

    try {
      // 在事务中回滚变更
      await this.db.sequelize.transaction(async () => {
        // 逆序回滚
        const reversedChanges = [...changeSet.changes].reverse();
        
        for (const change of reversedChanges) {
          await this.rollbackChange(change);
        }

        // 更新变更集状态
        await this.changeSetRepo.update({
          filter: { id },
          values: {
            status: 'rolled_back',
            rolledBackAt: new Date(),
          },
        });
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 应用单个变更
   */
  private async applyChange(change: ChangeSetChange): Promise<void> {
    const repoName = this.getRepoName(change.type);
    const repo = this.db.getRepository(repoName);

    switch (change.action) {
      case 'create':
        await repo.create({
          values: {
            id: uuid(),
            ...change.after,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        break;

      case 'update':
        await repo.update({
          filter: this.getFilter(change),
          values: {
            ...change.after,
            updatedAt: new Date(),
          },
        });
        break;

      case 'delete':
        await repo.destroy({
          filter: this.getFilter(change),
        });
        break;
    }
  }

  /**
   * 回滚单个变更
   */
  private async rollbackChange(change: ChangeSetChange): Promise<void> {
    const repoName = this.getRepoName(change.type);
    const repo = this.db.getRepository(repoName);

    switch (change.action) {
      case 'create':
        // 创建的回滚是删除
        await repo.destroy({
          filter: this.getFilter(change),
        });
        break;

      case 'update':
        // 更新的回滚是恢复原值
        if (change.before) {
          await repo.update({
            filter: this.getFilter(change),
            values: {
              ...change.before,
              updatedAt: new Date(),
            },
          });
        }
        break;

      case 'delete':
        // 删除的回滚是重建
        if (change.before) {
          await repo.create({
            values: {
              ...change.before,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
        break;
    }
  }

  /**
   * 创建版本快照
   */
  private async createSnapshot(changeSet: ChangeSet): Promise<void> {
    // 获取当前完整本体状态
    const objects = await this.db.getRepository('ale_ontology_objects').find({
      filter: { status: 'active' },
    });
    const relations = await this.db.getRepository('ale_ontology_relations').find();
    const flows = await this.db.getRepository('ale_flows').find({
      filter: { enabled: true },
    });
    const actions = await this.db.getRepository('ale_actions').find({
      filter: { enabled: true },
    });
    const rules = await this.db.getRepository('ale_rules').find({
      filter: { enabled: true },
    });

    await this.snapshotRepo.create({
      values: {
        id: uuid(),
        version: changeSet.version,
        changesetId: changeSet.id,
        snapshot: { objects, relations, flows, actions, rules },
        diff: { changes: changeSet.changes },
        parentVersion: changeSet.parentVersion,
        createdById: changeSet.createdBy,
        createdAt: new Date(),
      },
    });
  }

  /**
   * 获取仓库名称
   */
  private getRepoName(type: ChangeSetChange['type']): string {
    const repoMap: Record<string, string> = {
      object: 'ale_ontology_objects',
      relation: 'ale_ontology_relations',
      flow: 'ale_flows',
      view: 'ale_views', // 需要创建此表
      rule: 'ale_rules',
      action: 'ale_actions',
    };
    return repoMap[type] || 'ale_ontology_objects';
  }

  /**
   * 获取过滤条件
   */
  private getFilter(change: ChangeSetChange): Record<string, unknown> {
    const data = change.after || change.before || {};
    
    // 根据类型确定主键字段
    switch (change.type) {
      case 'object':
        return { collectionName: data.collectionName || change.target };
      case 'relation':
      case 'flow':
      case 'rule':
      case 'action':
        return { name: data.name || change.target };
      default:
        return { id: data.id };
    }
  }

  /**
   * 生成下一个版本号
   */
  private generateNextVersion(currentVersion?: string): string {
    if (!currentVersion) {
      return '1.0.0';
    }
    return semver.inc(currentVersion, 'patch') || '1.0.1';
  }

  /**
   * 提取对象数据
   */
  private extractObjectData(obj: unknown): Record<string, unknown> {
    const data = obj as Record<string, unknown>;
    return {
      collectionName: data.collectionName,
      displayName: data.displayName,
      description: data.description,
      fields: data.fields,
      semanticTags: data.semanticTags,
      evidenceSchema: data.evidenceSchema,
      gateRules: data.gateRules,
    };
  }

  /**
   * 查询变更集列表
   */
  async list(filter?: {
    status?: ChangeSetStatus;
    type?: ChangeSetType;
    createdBy?: number;
  }): Promise<ChangeSet[]> {
    const queryFilter: Record<string, unknown> = {};
    
    if (filter?.status) {
      queryFilter.status = filter.status;
    }
    if (filter?.type) {
      queryFilter.type = filter.type;
    }
    if (filter?.createdBy) {
      queryFilter.createdBy = filter.createdBy;
    }

    const results = await this.changeSetRepo.find({
      filter: queryFilter,
      sort: ['-createdAt'],
    });

    return results as ChangeSet[];
  }

  /**
   * 获取版本历史
   */
  async getVersionHistory(limit = 10): Promise<unknown[]> {
    const snapshots = await this.snapshotRepo.find({
      sort: ['-createdAt'],
      limit,
    });
    return snapshots;
  }
}
