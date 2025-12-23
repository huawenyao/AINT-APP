/**
 * ALE Dynamic View Plugin - 响应式动态视图插件
 * 
 * 构建态核心组件，提供：
 * - 方案预览生成
 * - Schema 图数据
 * - 状态机图数据
 * - UI Schema 生成
 */

import { Plugin, InstallOptions } from '@nocobase/server';
import { ViewGenerator } from './services/view-generator';
import type { ChangeProposal, ObjectDefinition, FlowDefinition } from '@ALE/core';

export class ALEDynamicViewPlugin extends Plugin {
  private viewGenerator!: ViewGenerator;

  async afterAdd() {
    this.app.logger.info('[@ALE/dynamic-view] Plugin added');
  }

  async beforeLoad() {
    this.app.logger.info('[@ALE/dynamic-view] Before load');
  }

  async load() {
    this.app.logger.info('[@ALE/dynamic-view] Loading...');

    // 初始化视图生成器
    this.viewGenerator = new ViewGenerator({
      enableRealtime: true,
      generateMockData: true,
    });

    // 注册 API 路由
    this.registerResourceActions();

    // 注册 ACL
    this.app.acl.registerSnippet({
      name: 'pm.ale-dynamic-view',
      actions: [
        'ale_view:*',
      ],
    });

    this.app.logger.info('[@ALE/dynamic-view] Loaded successfully');
  }

  async install(options?: InstallOptions) {
    this.app.logger.info('[@ALE/dynamic-view] Installed');
  }

  /**
   * 注册 API 路由
   */
  private registerResourceActions() {
    this.app.resourcer.define({
      name: 'ale_view',
      actions: {
        /**
         * 生成方案预览
         * POST /api/ale_view:generatePreviews
         */
        generatePreviews: async (ctx, next) => {
          const { proposalId } = ctx.action.params.values as { proposalId: string };

          // 获取方案
          const proposal = await this.db.getRepository('ale_proposals').findOne({
            filter: { id: proposalId },
          });

          if (!proposal) {
            ctx.throw(404, 'Proposal not found');
          }

          const previews = this.viewGenerator.generatePreviews(
            proposal as unknown as ChangeProposal,
          );

          ctx.body = previews;
          await next();
        },

        /**
         * 生成 Schema 图
         * POST /api/ale_view:generateSchemaGraph
         */
        generateSchemaGraph: async (ctx, next) => {
          const { proposalId } = ctx.action.params.values as { proposalId: string };

          const proposal = await this.db.getRepository('ale_proposals').findOne({
            filter: { id: proposalId },
          });

          if (!proposal) {
            ctx.throw(404, 'Proposal not found');
          }

          const graph = this.viewGenerator.generateSchemaGraph(
            proposal as unknown as ChangeProposal,
          );

          ctx.body = graph;
          await next();
        },

        /**
         * 生成状态机图
         * POST /api/ale_view:generateStateMachineGraph
         */
        generateStateMachineGraph: async (ctx, next) => {
          const { flowId } = ctx.action.params.values as { flowId?: string };
          const { proposalId } = ctx.action.params.values as { proposalId?: string };

          let flow: FlowDefinition | null = null;

          if (flowId) {
            // 从数据库获取流程
            const flowRecord = await this.db.getRepository('ale_flows').findOne({
              filter: { id: flowId },
            });
            flow = flowRecord as unknown as FlowDefinition;
          } else if (proposalId) {
            // 从方案中获取第一个流程
            const proposal = await this.db.getRepository('ale_proposals').findOne({
              filter: { id: proposalId },
            });

            if (proposal) {
              const components = (proposal as any).components;
              if (components?.flows?.length > 0) {
                flow = components.flows[0];
              }
            }
          }

          if (!flow) {
            ctx.throw(404, 'Flow not found');
          }

          const graph = this.viewGenerator.generateStateMachineGraph(flow);

          ctx.body = graph;
          await next();
        },

        /**
         * 生成 UI Schema
         * POST /api/ale_view:generateUISchema
         */
        generateUISchema: async (ctx, next) => {
          const { objectId, viewType } = ctx.action.params.values as {
            objectId?: string;
            collectionName?: string;
            viewType: 'list' | 'form' | 'detail';
          };
          const { collectionName } = ctx.action.params.values as { collectionName?: string };

          let object: ObjectDefinition | null = null;

          if (objectId) {
            const objectRecord = await this.db.getRepository('ale_ontology_objects').findOne({
              filter: { id: objectId },
            });
            object = objectRecord as unknown as ObjectDefinition;
          } else if (collectionName) {
            const objectRecord = await this.db.getRepository('ale_ontology_objects').findOne({
              filter: { collectionName },
            });
            object = objectRecord as unknown as ObjectDefinition;
          }

          if (!object) {
            ctx.throw(404, 'Object not found');
          }

          const schema = this.viewGenerator.generateUISchema(object, viewType || 'list');

          ctx.body = schema;
          await next();
        },

        /**
         * 获取本体的完整视图配置
         * GET /api/ale_view:getOntologyView
         */
        getOntologyView: async (ctx, next) => {
          const { collectionName } = ctx.action.params as { collectionName: string };

          // 获取对象定义
          const object = await this.db.getRepository('ale_ontology_objects').findOne({
            filter: { collectionName, status: 'active' },
          });

          if (!object) {
            ctx.throw(404, 'Object not found');
          }

          // 获取关联的关系
          const relations = await this.db.getRepository('ale_ontology_relations').find({
            filter: {
              $or: [
                { sourceObject: collectionName },
                { targetObject: collectionName },
              ],
            },
          });

          // 获取关联的流程
          const flows = await this.db.getRepository('ale_flows').find({
            filter: { targetObject: collectionName, enabled: true },
          });

          // 生成各种视图 Schema
          const objectDef = object as unknown as ObjectDefinition;
          const listSchema = this.viewGenerator.generateUISchema(objectDef, 'list');
          const formSchema = this.viewGenerator.generateUISchema(objectDef, 'form');
          const detailSchema = this.viewGenerator.generateUISchema(objectDef, 'detail');

          ctx.body = {
            object: objectDef,
            relations,
            flows,
            schemas: {
              list: listSchema,
              form: formSchema,
              detail: detailSchema,
            },
          };
          await next();
        },

        /**
         * 生成 Mock 数据
         * POST /api/ale_view:generateMockData
         */
        generateMockData: async (ctx, next) => {
          const { collectionName, count } = ctx.action.params.values as {
            collectionName: string;
            count?: number;
          };

          const object = await this.db.getRepository('ale_ontology_objects').findOne({
            filter: { collectionName },
          });

          if (!object) {
            ctx.throw(404, 'Object not found');
          }

          // 创建临时生成器生成指定数量的 mock 数据
          const mockData = this.generateMockDataForObject(
            object as unknown as ObjectDefinition,
            count || 10,
          );

          ctx.body = mockData;
          await next();
        },
      },
    });
  }

  /**
   * 生成 Mock 数据
   */
  private generateMockDataForObject(
    object: ObjectDefinition,
    count: number,
  ): Record<string, unknown>[] {
    const mockData: Record<string, unknown>[] = [];

    for (let i = 0; i < count; i++) {
      const row: Record<string, unknown> = {
        id: `${i + 1}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      for (const field of object.fields) {
        if (['id', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'].includes(field.name)) {
          continue;
        }
        row[field.name] = this.generateMockValue(field.type, field.name, i);
      }

      mockData.push(row);
    }

    return mockData;
  }

  /**
   * 生成单个 Mock 值
   */
  private generateMockValue(type: string, fieldName: string, index: number): unknown {
    switch (type) {
      case 'string':
        if (fieldName.toLowerCase().includes('name')) {
          return `示例 ${index + 1}`;
        }
        if (fieldName.toLowerCase().includes('email')) {
          return `user${index + 1}@example.com`;
        }
        if (fieldName.toLowerCase().includes('phone')) {
          return `1380000${(1000 + index).toString()}`;
        }
        return `文本${index + 1}`;

      case 'text':
        return `这是第 ${index + 1} 条的详细描述内容。`;

      case 'integer':
        return index + 1;

      case 'float':
      case 'decimal':
        return parseFloat((Math.random() * 100).toFixed(2));

      case 'boolean':
        return index % 2 === 0;

      case 'date':
        const date = new Date();
        date.setDate(date.getDate() - index);
        return date.toISOString().split('T')[0];

      case 'datetime':
        const datetime = new Date();
        datetime.setHours(datetime.getHours() - index);
        return datetime.toISOString();

      case 'enum':
        const options = ['选项A', '选项B', '选项C'];
        return options[index % options.length];

      default:
        return null;
    }
  }

  /**
   * 获取视图生成器实例
   */
  getGenerator(): ViewGenerator {
    return this.viewGenerator;
  }
}

export default ALEDynamicViewPlugin;
