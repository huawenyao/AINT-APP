/**
 * ALE Ontology Plugin - 本体管理插件
 * 
 * 运行态核心组件，提供：
 * - 本体注册表服务
 * - 对象/关系/流程管理
 * - 与 NocoBase Collection 的同步
 */

import { Plugin, InstallOptions } from '@nocobase/server';
import { OntologyRegistry } from './services/ontology-registry';
import type { ObjectDefinition, RelationDefinition, FlowDefinition } from '@ALE/core';

export class ALEOntologyPlugin extends Plugin {
  private ontologyRegistry!: OntologyRegistry;

  async afterAdd() {
    this.app.logger.info('[@ALE/ontology] Plugin added');
  }

  async beforeLoad() {
    this.app.logger.info('[@ALE/ontology] Before load');
  }

  async load() {
    this.app.logger.info('[@ALE/ontology] Loading...');

    // 初始化本体注册表
    this.ontologyRegistry = new OntologyRegistry(this.db);

    // 注册 API 路由
    this.registerResourceActions();

    // 注册 ACL
    this.app.acl.registerSnippet({
      name: 'pm.ale-ontology',
      actions: [
        'ale_ontology:*',
      ],
    });

    this.app.logger.info('[@ALE/ontology] Loaded successfully');
  }

  async install(options?: InstallOptions) {
    this.app.logger.info('[@ALE/ontology] Installed');
  }

  /**
   * 注册 API 路由
   */
  private registerResourceActions() {
    this.app.resourcer.define({
      name: 'ale_ontology',
      actions: {
        /**
         * 获取完整本体
         * GET /api/ale_ontology:export
         */
        export: async (ctx, next) => {
          const snapshot = await this.ontologyRegistry.exportOntology();
          ctx.body = snapshot;
          await next();
        },

        /**
         * 导入本体
         * POST /api/ale_ontology:import
         */
        import: async (ctx, next) => {
          const snapshot = ctx.action.params.values;
          const success = await this.ontologyRegistry.importOntology(snapshot);
          
          ctx.body = {
            success,
            message: success ? '导入成功' : '导入失败',
          };
          await next();
        },

        /**
         * 注册对象
         * POST /api/ale_ontology:registerObject
         */
        registerObject: async (ctx, next) => {
          const definition = ctx.action.params.values as Omit<ObjectDefinition, 'id'>;
          const result = await this.ontologyRegistry.registerObject(definition);
          ctx.body = result;
          await next();
        },

        /**
         * 获取对象
         * GET /api/ale_ontology:getObject
         */
        getObject: async (ctx, next) => {
          const { collectionName } = ctx.action.params;
          const object = await this.ontologyRegistry.getObject(collectionName);
          
          if (!object) {
            ctx.throw(404, 'Object not found');
          }
          
          ctx.body = object;
          await next();
        },

        /**
         * 查询对象
         * GET /api/ale_ontology:findObjects
         */
        findObjects: async (ctx, next) => {
          const filter = ctx.action.params.filter || {};
          const objects = await this.ontologyRegistry.findObjects(filter);
          ctx.body = objects;
          await next();
        },

        /**
         * 注册关系
         * POST /api/ale_ontology:registerRelation
         */
        registerRelation: async (ctx, next) => {
          const definition = ctx.action.params.values as Omit<RelationDefinition, 'id'>;
          const result = await this.ontologyRegistry.registerRelation(definition);
          ctx.body = result;
          await next();
        },

        /**
         * 获取对象的关系
         * GET /api/ale_ontology:getRelations
         */
        getRelations: async (ctx, next) => {
          const { collectionName } = ctx.action.params;
          const relations = await this.ontologyRegistry.getRelationsForObject(collectionName);
          ctx.body = relations;
          await next();
        },

        /**
         * 注册流程
         * POST /api/ale_ontology:registerFlow
         */
        registerFlow: async (ctx, next) => {
          const definition = ctx.action.params.values as Omit<FlowDefinition, 'id'>;
          const result = await this.ontologyRegistry.registerFlow(definition);
          ctx.body = result;
          await next();
        },

        /**
         * 获取对象的流程
         * GET /api/ale_ontology:getFlows
         */
        getFlows: async (ctx, next) => {
          const { collectionName } = ctx.action.params;
          const flows = await this.ontologyRegistry.getFlowsForObject(collectionName);
          ctx.body = flows;
          await next();
        },

        /**
         * 同步到 NocoBase Collection
         * POST /api/ale_ontology:syncCollection
         */
        syncCollection: async (ctx, next) => {
          const { collectionName } = ctx.action.params.values as { collectionName: string };
          
          const object = await this.ontologyRegistry.getObject(collectionName);
          if (!object) {
            ctx.throw(404, 'Object not found');
          }

          const success = await this.ontologyRegistry.syncToCollection(object);
          ctx.body = {
            success,
            message: success ? '同步成功' : '同步失败',
          };
          await next();
        },

        /**
         * 获取对象的完整信息（含关系、流程、动作）
         * GET /api/ale_ontology:getObjectFull
         */
        getObjectFull: async (ctx, next) => {
          const { collectionName } = ctx.action.params;
          
          const object = await this.ontologyRegistry.getObject(collectionName);
          if (!object) {
            ctx.throw(404, 'Object not found');
          }

          const [relations, flows, actions] = await Promise.all([
            this.ontologyRegistry.getRelationsForObject(collectionName),
            this.ontologyRegistry.getFlowsForObject(collectionName),
            this.ontologyRegistry.getActionsForObject(collectionName),
          ]);

          ctx.body = {
            object,
            relations,
            flows,
            actions,
          };
          await next();
        },
      },
    });
  }

  /**
   * 获取本体注册表实例
   */
  getRegistry(): OntologyRegistry {
    return this.ontologyRegistry;
  }
}

export default ALEOntologyPlugin;
