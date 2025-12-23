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

export class ALECorePlugin extends Plugin {
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
  }

  /**
   * 初始化默认数据
   */
  private async initializeDefaultData() {
    // 可以在这里初始化一些默认的本体对象、流程等
    this.app.logger.info('[@ALE/core] Default data initialized');
  }
}

export default ALECorePlugin;
