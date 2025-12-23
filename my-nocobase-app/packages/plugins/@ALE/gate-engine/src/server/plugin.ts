/**
 * ALE Gate Engine Plugin - 门禁引擎插件
 * 
 * 控制面核心组件，提供：
 * - 门禁注册和管理
 * - 门禁执行 API
 * - 与 NocoBase Workflow 集成
 */

import { Plugin, InstallOptions } from '@nocobase/server';
import { GateEngine, GateEngineConfig } from './services/gate-engine';
import { GateType, GateContext } from './gates/base-gate';
import { StructuralGate } from './gates/implementations/structural-gate';
import { EvidenceGate } from './gates/implementations/evidence-gate';
import { ExecutionGate } from './gates/implementations/execution-gate';
import { EvaluationGate } from './gates/implementations/evaluation-gate';

/**
 * 门禁引擎插件配置
 */
export interface GateEnginePluginOptions extends GateEngineConfig {
  /** 是否自动注册默认门禁 */
  autoRegisterDefaults?: boolean;
}

export class ALEGateEnginePlugin extends Plugin {
  private gateEngine!: GateEngine;

  async afterAdd() {
    this.app.logger.info('[@ALE/gate-engine] Plugin added');
  }

  async beforeLoad() {
    this.app.logger.info('[@ALE/gate-engine] Before load');
  }

  async load() {
    this.app.logger.info('[@ALE/gate-engine] Loading...');

    // 初始化门禁引擎
    const config = this.options as GateEnginePluginOptions;
    this.gateEngine = new GateEngine(this.db, config);

    // 注册默认门禁
    if (config?.autoRegisterDefaults !== false) {
      this.registerDefaultGates();
    }

    // 注册 API 路由
    this.registerResourceActions();

    // 注册 ACL
    this.app.acl.registerSnippet({
      name: 'pm.ale-gate-engine',
      actions: [
        'ale_gate:*',
      ],
    });

    // 注册数据钩子
    this.registerDataHooks();

    this.app.logger.info('[@ALE/gate-engine] Loaded successfully');
  }

  async install(options?: InstallOptions) {
    this.app.logger.info('[@ALE/gate-engine] Installed');
  }

  /**
   * 注册默认门禁
   */
  private registerDefaultGates() {
    // G1: 默认结构门禁
    const structuralGate = new StructuralGate({
      name: 'default_structural',
      type: GateType.G1_STRUCTURAL,
      enabled: true,
      severity: 'error',
      config: {
        requiredFields: ['id'],
      },
    });
    this.gateEngine.registerGate(structuralGate);

    // G3: 默认证据门禁（仅对高风险操作）
    const evidenceGate = new EvidenceGate({
      name: 'default_evidence',
      type: GateType.G3_EVIDENCE,
      enabled: true,
      severity: 'warning',
      config: {
        defaultMinConfidence: 0.8,
      },
    });
    this.gateEngine.registerGate(evidenceGate);

    // G6: 默认执行门禁
    const executionGate = new ExecutionGate({
      name: 'default_execution',
      type: GateType.G6_EXECUTION,
      enabled: true,
      severity: 'error',
      config: {
        stateField: 'status',
      },
    });
    this.gateEngine.registerGate(executionGate);

    // G7: 默认评估门禁
    const evaluationGate = new EvaluationGate({
      name: 'default_evaluation',
      type: GateType.G7_EVALUATION,
      enabled: true,
      severity: 'warning',
      config: {
        allowPartialFailure: true,
      },
    });
    this.gateEngine.registerGate(evaluationGate);
  }

  /**
   * 注册 API 路由
   */
  private registerResourceActions() {
    this.app.resourcer.define({
      name: 'ale_gate',
      actions: {
        /**
         * 执行门禁检查
         * POST /api/ale_gate:execute
         */
        execute: async (ctx, next) => {
          const { context, gates } = ctx.action.params.values as {
            context: GateContext;
            gates?: string[];
          };

          if (!context?.subjectType) {
            ctx.throw(400, 'Context with subjectType is required');
          }

          const result = await this.gateEngine.execute(context, gates);
          // 转换为 API 格式
          ctx.body = {
            passed: result.passed,
            summary: result.summary,
            duration: result.duration,
            reportId: result.reportId,
            gates: result.results,
          };
          ctx.body = result;
          await next();
        },

        /**
         * 执行预检
         * POST /api/ale_gate:preCheck
         */
        preCheck: async (ctx, next) => {
          const { context, gateTypes } = ctx.action.params.values as {
            context: GateContext;
            gateTypes?: GateType[];
          };

          if (!context?.subjectType) {
            ctx.throw(400, 'Context with subjectType is required');
          }

          const types = gateTypes || [GateType.G1_STRUCTURAL, GateType.G3_EVIDENCE];
          const result = await this.gateEngine.preCheck(context, types);
          ctx.body = {
            passed: result.passed,
            summary: result.summary,
            duration: result.duration,
            gates: result.results,
          };
          await next();
        },

        /**
         * 获取所有已注册的门禁
         * GET /api/ale_gate:list
         */
        list: async (ctx, next) => {
          const gates = this.gateEngine.getAllGates().map(g => ({
            name: g.name,
            type: g.type,
            enabled: g.isEnabled(),
            description: g.getDescription(),
          }));
          ctx.body = gates;
          await next();
        },

        /**
         * 获取特定类型的门禁
         * GET /api/ale_gate:listByType
         */
        listByType: async (ctx, next) => {
          const { type } = ctx.action.params as { type: GateType };
          const gates = this.gateEngine.getGatesByType(type).map(g => ({
            name: g.name,
            type: g.type,
            enabled: g.isEnabled(),
            description: g.getDescription(),
          }));
          ctx.body = gates;
          await next();
        },

        /**
         * 启用门禁
         * POST /api/ale_gate:enable
         */
        enable: async (ctx, next) => {
          const { name } = ctx.action.params.values as { name: string };
          const gate = this.gateEngine.getGate(name);
          
          if (!gate) {
            ctx.throw(404, 'Gate not found');
          }

          gate.enable();
          ctx.body = { success: true, message: `门禁 ${name} 已启用` };
          await next();
        },

        /**
         * 禁用门禁
         * POST /api/ale_gate:disable
         */
        disable: async (ctx, next) => {
          const { name } = ctx.action.params.values as { name: string };
          const gate = this.gateEngine.getGate(name);
          
          if (!gate) {
            ctx.throw(404, 'Gate not found');
          }

          gate.disable();
          ctx.body = { success: true, message: `门禁 ${name} 已禁用` };
          await next();
        },

        /**
         * 从本体加载门禁
         * POST /api/ale_gate:loadFromOntology
         */
        loadFromOntology: async (ctx, next) => {
          const { collectionName } = ctx.action.params.values as { collectionName: string };
          await this.gateEngine.loadGatesFromOntology(collectionName);
          ctx.body = { success: true, message: `已加载 ${collectionName} 的门禁规则` };
          await next();
        },

        /**
         * 获取门禁报告
         * GET /api/ale_gate:getReport
         */
        getReport: async (ctx, next) => {
          const { reportId } = ctx.action.params as { reportId: string };
          const report = await this.db.getRepository('ale_gate_reports').findOne({
            filter: { id: reportId },
          });
          
          if (!report) {
            ctx.throw(404, 'Report not found');
          }

          ctx.body = report;
          await next();
        },
      },
    });
  }

  /**
   * 注册数据钩子（自动门禁检查）
   */
  private registerDataHooks() {
    // 监听所有本体管理的 Collection 的变更
    this.db.on('beforeCreate', async (model, options) => {
      await this.handleBeforeChange('create', model, options);
    });

    this.db.on('beforeUpdate', async (model, options) => {
      await this.handleBeforeChange('update', model, options);
    });

    this.db.on('beforeDestroy', async (model, options) => {
      await this.handleBeforeChange('delete', model, options);
    });
  }

  /**
   * 处理变更前检查
   */
  private async handleBeforeChange(
    action: string,
    model: any,
    options: any,
  ): Promise<void> {
    const collectionName = model.constructor?.tableName || model._modelOptions?.tableName;
    
    // 检查是否是本体管理的 Collection
    const ontologyObject = await this.db.getRepository('ale_ontology_objects').findOne({
      filter: { collectionName, status: 'active' },
    });

    if (!ontologyObject) {
      return; // 非本体管理的 Collection，跳过
    }

    // 构建门禁上下文
    const context: GateContext = {
      action,
      subjectType: collectionName,
      subjectId: model.id,
      data: model.dataValues || model,
      before: model._previousDataValues,
      after: model.dataValues,
      actorId: options?.context?.state?.currentUser?.id,
      actorType: 'user',
    };

    // 执行门禁检查
    const result = await this.gateEngine.execute(context);

    if (!result.passed) {
      throw new Error(`门禁检查失败: ${result.summary}`);
    }
  }

  /**
   * 获取门禁引擎实例
   */
  getEngine(): GateEngine {
    return this.gateEngine;
  }
}

export default ALEGateEnginePlugin;
