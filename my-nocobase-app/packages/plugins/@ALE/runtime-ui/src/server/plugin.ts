/**
 * ALE Runtime UI Plugin - 运行态 UI 生成插件
 * 
 * 运行态核心组件，提供：
 * - 从本体自动生成 UI
 * - Collection 自动注册
 * - 菜单动态生成
 */

import { Plugin, InstallOptions } from '@nocobase/server';
import { RuntimeUIGenerator } from './services/runtime-ui-generator';

export class ALERuntimeUIPlugin extends Plugin {
  private uiGenerator!: RuntimeUIGenerator;

  async afterAdd() {
    this.app.logger.info('[@ALE/runtime-ui] Plugin added');
  }

  async beforeLoad() {
    this.app.logger.info('[@ALE/runtime-ui] Before load');
  }

  async load() {
    this.app.logger.info('[@ALE/runtime-ui] Loading...');

    // 初始化 UI 生成器
    this.uiGenerator = new RuntimeUIGenerator(this.db, {
      autoRegisterCollection: true,
      generateDefaultViews: true,
      generateMenu: true,
    });

    // 注册 API 路由
    this.registerResourceActions();

    // 注册 ACL
    this.app.acl.registerSnippet({
      name: 'pm.ale-runtime-ui',
      actions: [
        'ale_runtime_ui:*',
      ],
    });

    this.app.logger.info('[@ALE/runtime-ui] Loaded successfully');
  }

  async install(options?: InstallOptions) {
    this.app.logger.info('[@ALE/runtime-ui] Installed');
  }

  /**
   * 注册 API 路由
   */
  private registerResourceActions() {
    this.app.resourcer.define({
      name: 'ale_runtime_ui',
      actions: {
        /**
         * 从本体生成 UI 配置
         * POST /api/ale_runtime_ui:generate
         */
        generate: async (ctx, next) => {
          const { collectionName } = ctx.action.params.values as { collectionName: string };

          const config = await this.uiGenerator.generateFromOntology(collectionName);
          ctx.body = config;
          await next();
        },

        /**
         * 注册并生成 Collection
         * POST /api/ale_runtime_ui:registerCollection
         */
        registerCollection: async (ctx, next) => {
          const { collectionName } = ctx.action.params.values as { collectionName: string };

          // 生成配置
          const config = await this.uiGenerator.generateFromOntology(collectionName);

          // 注册 Collection
          const collection = this.db.collection(config.collection as any);
          await this.db.sync();

          ctx.body = {
            success: true,
            collection: config.collection,
            message: `Collection ${collectionName} 已注册`,
          };
          await next();
        },

        /**
         * 获取列表 Schema
         * GET /api/ale_runtime_ui:getListSchema
         */
        getListSchema: async (ctx, next) => {
          const { collectionName } = ctx.action.params as { collectionName: string };

          const config = await this.uiGenerator.generateFromOntology(collectionName);
          ctx.body = config.listSchema;
          await next();
        },

        /**
         * 获取表单 Schema
         * GET /api/ale_runtime_ui:getFormSchema
         */
        getFormSchema: async (ctx, next) => {
          const { collectionName } = ctx.action.params as { collectionName: string };

          const config = await this.uiGenerator.generateFromOntology(collectionName);
          ctx.body = config.formSchema;
          await next();
        },

        /**
         * 获取详情 Schema
         * GET /api/ale_runtime_ui:getDetailSchema
         */
        getDetailSchema: async (ctx, next) => {
          const { collectionName } = ctx.action.params as { collectionName: string };

          const config = await this.uiGenerator.generateFromOntology(collectionName);
          ctx.body = config.detailSchema;
          await next();
        },

        /**
         * 批量生成所有本体的 UI
         * POST /api/ale_runtime_ui:generateAll
         */
        generateAll: async (ctx, next) => {
          const objects = await this.db.getRepository('ale_ontology_objects').find({
            filter: { status: 'active' },
          });

          const results: Array<{ collectionName: string; success: boolean; error?: string }> = [];

          for (const obj of objects) {
            try {
              const config = await this.uiGenerator.generateFromOntology(obj.collectionName);
              this.db.collection(config.collection as any);
              results.push({ collectionName: obj.collectionName, success: true });
            } catch (error) {
              results.push({
                collectionName: obj.collectionName,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          }

          await this.db.sync();

          ctx.body = {
            total: objects.length,
            success: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results,
          };
          await next();
        },
      },
    });
  }

  /**
   * 获取 UI 生成器实例
   */
  getGenerator(): RuntimeUIGenerator {
    return this.uiGenerator;
  }
}

export default ALERuntimeUIPlugin;
