/**
 * ALE ChangeSet Plugin - 变更集管理插件
 * 
 * 双态桥接核心组件，提供：
 * - 变更集 CRUD
 * - 变更集审批流程
 * - 变更集发布和回滚
 */

import { Plugin, InstallOptions } from '@nocobase/server';
import { ChangeSetService } from './services/changeset-service';
import type { ChangeProposal, ChangeSetStatus, ChangeSetType } from '@ALE/core';

export class ALEChangeSetPlugin extends Plugin {
  private changeSetService!: ChangeSetService;

  async afterAdd() {
    this.app.logger.info('[@ALE/changeset] Plugin added');
  }

  async beforeLoad() {
    this.app.logger.info('[@ALE/changeset] Before load');
  }

  async load() {
    this.app.logger.info('[@ALE/changeset] Loading...');

    // 初始化变更集服务
    this.changeSetService = new ChangeSetService(this.db);

    // 注册 API 路由
    this.registerResourceActions();

    // 注册 ACL
    this.app.acl.registerSnippet({
      name: 'pm.ale-changeset',
      actions: [
        'ale_changeset:*',
      ],
    });

    this.app.logger.info('[@ALE/changeset] Loaded successfully');
  }

  async install(options?: InstallOptions) {
    this.app.logger.info('[@ALE/changeset] Installed');
  }

  /**
   * 注册 API 路由
   */
  private registerResourceActions() {
    this.app.resourcer.define({
      name: 'ale_changeset',
      actions: {
        /**
         * 从方案创建变更集
         * POST /api/ale_changeset:createFromProposal
         */
        createFromProposal: async (ctx, next) => {
          const { proposalId } = ctx.action.params.values as { proposalId: string };
          const currentUser = ctx.state.currentUser;

          // 获取方案
          const proposal = await this.db.getRepository('ale_proposals').findOne({
            filter: { id: proposalId },
          });

          if (!proposal) {
            ctx.throw(404, 'Proposal not found');
          }

          const changeSet = await this.changeSetService.createFromProposal(
            proposal as unknown as ChangeProposal,
            currentUser?.id || 0,
          );

          ctx.body = {
            success: true,
            changeSet,
          };
          await next();
        },

        /**
         * 创建变更集
         * POST /api/ale_changeset:create
         */
        create: async (ctx, next) => {
          const input = ctx.action.params.values;
          const currentUser = ctx.state.currentUser;

          const changeSet = await this.changeSetService.create({
            ...input,
            createdBy: currentUser?.id || 0,
          });

          ctx.body = {
            success: true,
            changeSet,
          };
          await next();
        },

        /**
         * 获取变更集
         * GET /api/ale_changeset:get
         */
        get: async (ctx, next) => {
          const { id } = ctx.action.params as { id: string };
          const changeSet = await this.changeSetService.get(id);

          if (!changeSet) {
            ctx.throw(404, 'ChangeSet not found');
          }

          ctx.body = changeSet;
          await next();
        },

        /**
         * 查询变更集列表
         * GET /api/ale_changeset:list
         */
        list: async (ctx, next) => {
          const filter = ctx.action.params.filter as {
            status?: ChangeSetStatus;
            type?: ChangeSetType;
          };

          const changeSets = await this.changeSetService.list(filter);
          ctx.body = changeSets;
          await next();
        },

        /**
         * 提交变更集
         * POST /api/ale_changeset:submit
         */
        submit: async (ctx, next) => {
          const { id } = ctx.action.params.values as { id: string };
          const changeSet = await this.changeSetService.submit(id);

          ctx.body = {
            success: true,
            changeSet,
            message: '变更集已提交审批',
          };
          await next();
        },

        /**
         * 批准变更集
         * POST /api/ale_changeset:approve
         */
        approve: async (ctx, next) => {
          const { id } = ctx.action.params.values as { id: string };
          const currentUser = ctx.state.currentUser;

          const changeSet = await this.changeSetService.approve(id, currentUser?.id || 0);

          ctx.body = {
            success: true,
            changeSet,
            message: '变更集已批准',
          };
          await next();
        },

        /**
         * 拒绝变更集
         * POST /api/ale_changeset:reject
         */
        reject: async (ctx, next) => {
          const { id, reason } = ctx.action.params.values as { id: string; reason?: string };
          const changeSet = await this.changeSetService.reject(id, reason);

          ctx.body = {
            success: true,
            changeSet,
            message: '变更集已拒绝',
          };
          await next();
        },

        /**
         * 发布变更集
         * POST /api/ale_changeset:publish
         */
        publish: async (ctx, next) => {
          const { id } = ctx.action.params.values as { id: string };
          const result = await this.changeSetService.publish(id);

          if (!result.success) {
            ctx.throw(400, result.error);
          }

          ctx.body = {
            success: true,
            message: '变更集已发布',
          };
          await next();
        },

        /**
         * 回滚变更集
         * POST /api/ale_changeset:rollback
         */
        rollback: async (ctx, next) => {
          const { id } = ctx.action.params.values as { id: string };
          const result = await this.changeSetService.rollback(id);

          if (!result.success) {
            ctx.throw(400, result.error);
          }

          ctx.body = {
            success: true,
            message: '变更集已回滚',
          };
          await next();
        },

        /**
         * 获取版本历史
         * GET /api/ale_changeset:versions
         */
        versions: async (ctx, next) => {
          const { limit } = ctx.action.params as { limit?: number };
          const versions = await this.changeSetService.getVersionHistory(limit || 10);
          ctx.body = versions;
          await next();
        },
      },
    });
  }

  /**
   * 获取变更集服务实例
   */
  getService(): ChangeSetService {
    return this.changeSetService;
  }
}

export default ALEChangeSetPlugin;
