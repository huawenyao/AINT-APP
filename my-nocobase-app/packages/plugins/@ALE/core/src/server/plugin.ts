/**
 * ALE Core Plugin - 核心插件
 * 
 * 提供 ALE 双态架构的核心功能:
 * - 注册所有核心 Collections
 * - 提供基础服务注册机制
 * - 管理插件生命周期
 */

import { Plugin, InstallOptions } from '@nocobase/server';
import { collections } from './collections';
import { AuditService } from './services/audit-service';
import { EvidenceService } from './services/evidence-service';

export class ALECorePlugin extends Plugin {
  private auditService!: AuditService;
  private evidenceService!: EvidenceService;

  /**
   * 插件加载阶段
   */
  async afterAdd() {
    this.app.logger.info('[@ALE/core] Plugin added');
  }

  /**
   * 插件初始化前
   */
  async beforeLoad() {
    this.app.logger.info('[@ALE/core] Before load');
    
    // 注册所有 Collections
    for (const collection of collections) {
      this.db.collection(collection);
    }
  }

  /**
   * 插件加载阶段
   */
  async load() {
    this.app.logger.info('[@ALE/core] Loading...');

    // 初始化服务
    this.auditService = new AuditService(this.db, {
      autoLog: true,
      defaultRetentionDays: 365,
    });
    this.evidenceService = new EvidenceService(this.db, {
      defaultConfidenceThreshold: 0.8,
      autoVerify: false,
    });

    // 注册服务到应用容器
    this.app.registry.set('ale.auditService', this.auditService);
    this.app.registry.set('ale.evidenceService', this.evidenceService);

    // 注册 ALE 服务容器
    this.app.acl.registerSnippet({
      name: 'pm.ale-core',
      actions: [
        'ale_intents:*',
        'ale_proposals:*',
        'ale_conversations:*',
        'ale_ontology_objects:*',
        'ale_ontology_relations:*',
        'ale_flows:*',
        'ale_actions:*',
        'ale_rules:*',
        'ale_changesets:*',
        'ale_gate_reports:*',
        'ale_evidences:*',
        'ale_audit_logs:list,get',
        'ale_version_snapshots:*',
      ],
    });

    // 注册资源路由
    this.registerResourceActions();
    
    this.app.logger.info('[@ALE/core] Loaded successfully');
  }

  /**
   * 插件安装
   */
  async install(options?: InstallOptions) {
    this.app.logger.info('[@ALE/core] Installing...');
    
    // 同步数据库表
    await this.db.sync();
    
    // 初始化默认数据
    await this.initializeDefaultData();
    
    this.app.logger.info('[@ALE/core] Installed successfully');
  }

  /**
   * 插件卸载
   */
  async afterDisable() {
    this.app.logger.info('[@ALE/core] Disabled');
  }

  /**
   * 插件移除
   */
  async afterRemove() {
    this.app.logger.info('[@ALE/core] Removed');
  }

  /**
   * 注册资源动作
   */
  private registerResourceActions() {
    // 健康检查
    this.app.resourcer.define({
      name: 'ale',
      actions: {
        health: async (ctx, next) => {
          ctx.body = {
            status: 'ok',
            version: this.options?.version || '0.1.0',
            timestamp: new Date().toISOString(),
          };
          await next();
        },
        // 获取本体元数据
        getOntologyMeta: async (ctx, next) => {
          const objects = await this.db.getRepository('ale_ontology_objects').find({
            filter: { status: 'active' },
          });
          const relations = await this.db.getRepository('ale_ontology_relations').find();
          const flows = await this.db.getRepository('ale_flows').find({
            filter: { enabled: true },
          });
          
          ctx.body = {
            objects,
            relations,
            flows,
          };
          await next();
        },
      },
    });

    // 注册审计日志 API
    this.app.resourcer.define({
      name: 'ale_audit',
      actions: {
        query: async (ctx, next) => {
          const filter = ctx.action.params.filter || {};
          const logs = await this.auditService.query(filter);
          ctx.body = logs;
          await next();
        },
        getTraceChain: async (ctx, next) => {
          const { correlationId } = ctx.action.params;
          const chain = await this.auditService.getTraceChain(correlationId);
          ctx.body = chain;
          await next();
        },
        getSubjectHistory: async (ctx, next) => {
          const { subjectType, subjectId, limit } = ctx.action.params;
          const history = await this.auditService.getSubjectHistory(
            subjectType,
            subjectId,
            limit || 50,
          );
          ctx.body = history;
          await next();
        },
      },
    });

    // 注册证据 API
    this.app.resourcer.define({
      name: 'ale_evidence',
      actions: {
        collect: async (ctx, next) => {
          const evidence = ctx.action.params.values;
          const evidenceId = await this.evidenceService.collect(evidence);
          ctx.body = { success: true, evidenceId };
          await next();
        },
        verify: async (ctx, next) => {
          const { id, verified } = ctx.action.params.values;
          const success = await this.evidenceService.verify(id, verified);
          ctx.body = { success };
          await next();
        },
        query: async (ctx, next) => {
          const filter = ctx.action.params.filter || {};
          const evidences = await this.evidenceService.query(filter);
          ctx.body = evidences;
          await next();
        },
        validateCompleteness: async (ctx, next) => {
          const { subjectType, subjectId, requiredTypes } = ctx.action.params.values;
          const result = await this.evidenceService.validateEvidenceCompleteness(
            subjectType,
            subjectId,
            requiredTypes,
          );
          ctx.body = result;
          await next();
        },
      },
    });
  }

  /**
   * 获取审计服务实例
   */
  getAuditService(): AuditService {
    return this.auditService;
  }

  /**
   * 获取证据服务实例
   */
  getEvidenceService(): EvidenceService {
    return this.evidenceService;
  }

  /**
   * 初始化默认数据
   */
  private async initializeDefaultData() {
    try {
      // 初始化审计日志索引（如果需要）
      // 可以在这里初始化一些默认的本体对象、流程等
      this.app.logger.info('[@ALE/core] Default data initialized');
    } catch (error) {
      this.app.logger.warn('[@ALE/core] Failed to initialize default data:', error);
    }
  }
}

export default ALECorePlugin;
