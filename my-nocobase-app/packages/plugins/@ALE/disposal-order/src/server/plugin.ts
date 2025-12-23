/**
 * ALE Disposal Order Plugin - 延迟订单处置场景插件
 * 
 * MVP 场景验证插件，提供：
 * - 处置单数据模型
 * - 状态机定义
 * - 动作实现
 * - 本体注册
 */

import { Plugin, InstallOptions } from '@nocobase/server';
import { collections } from './collections';
import { DisposalStateMachine } from './state-machine/disposal-states';
import { registerDisposalActions } from './actions/disposal-actions';
import type { ObjectDefinition, FlowDefinition, ActionDefinition } from '@ALE/core';

export class ALEDisposalOrderPlugin extends Plugin {
  async afterAdd() {
    this.app.logger.info('[@ALE/disposal-order] Plugin added');
  }

  async beforeLoad() {
    this.app.logger.info('[@ALE/disposal-order] Before load');
    
    // 注册 Collections
    for (const collection of collections) {
      this.db.collection(collection);
    }
  }

  async load() {
    this.app.logger.info('[@ALE/disposal-order] Loading...');

    // 注册动作
    registerDisposalActions(this.app);

    // 注册 API 路由
    this.registerResourceActions();

    // 注册 ACL
    this.app.acl.registerSnippet({
      name: 'pm.ale-disposal-order',
      actions: [
        'disposal_orders:*',
        'disposal_evidences:*',
        'disposal_events:*',
      ],
    });

    this.app.logger.info('[@ALE/disposal-order] Loaded successfully');
  }

  async install(options?: InstallOptions) {
    this.app.logger.info('[@ALE/disposal-order] Installing...');
    
    // 同步数据库表
    await this.db.sync();
    
    // 注册到本体
    await this.registerToOntology();
    
    this.app.logger.info('[@ALE/disposal-order] Installed successfully');
  }

  /**
   * 注册到本体
   */
  private async registerToOntology() {
    const ontologyPlugin = this.app.plugin('@ALE/ontology');
    if (!ontologyPlugin) {
      this.app.logger.warn('Ontology plugin not found, skipping ontology registration');
      return;
    }

    const registry = ontologyPlugin.getRegistry();

    // 注册处置单对象
    const disposalOrderObject: Omit<ObjectDefinition, 'id'> = {
      collectionName: 'disposal_orders',
      displayName: '处置单',
      description: '延迟订单风险处置单',
      fields: [
        {
          name: 'orderNo',
          displayName: '处置单号',
          type: 'string',
          required: true,
          unique: true,
        },
        {
          name: 'sourceOrderId',
          displayName: '原订单ID',
          type: 'string',
          required: true,
        },
        {
          name: 'customerName',
          displayName: '客户名称',
          type: 'string',
          required: true,
        },
        {
          name: 'delayReason',
          displayName: '延迟原因',
          type: 'text',
          required: false,
        },
        {
          name: 'delayDays',
          displayName: '延迟天数',
          type: 'integer',
          required: true,
        },
        {
          name: 'orderAmount',
          displayName: '订单金额',
          type: 'decimal',
          required: true,
        },
        {
          name: 'riskLevel',
          displayName: '风险等级',
          type: 'enum',
          required: true,
          options: [
            { value: 'low', label: '低' },
            { value: 'medium', label: '中' },
            { value: 'high', label: '高' },
            { value: 'critical', label: '严重' },
          ],
        },
        {
          name: 'status',
          displayName: '状态',
          type: 'enum',
          required: true,
          options: [
            { value: 'pending', label: '待处理' },
            { value: 'assigned', label: '已分配' },
            { value: 'proposal_submitted', label: '方案已提交' },
            { value: 'approved', label: '已批准' },
            { value: 'executing', label: '执行中' },
            { value: 'resolved', label: '已解决' },
            { value: 'failed', label: '执行失败' },
            { value: 'escalated', label: '已升级' },
            { value: 'cancelled', label: '已取消' },
          ],
        },
        {
          name: 'proposedAction',
          displayName: '建议处置动作',
          type: 'string',
          required: false,
        },
        {
          name: 'finalAction',
          displayName: '最终处置动作',
          type: 'string',
          required: false,
        },
        {
          name: 'resolutionNotes',
          displayName: '处置说明',
          type: 'text',
          required: false,
        },
      ],
      semanticTags: ['订单', '风险', '处置', '延迟'],
      evidenceSchema: {
        risk_assessment: {
          type: 'object',
          required: ['level', 'reason'],
          properties: {
            level: { type: 'string' },
            reason: { type: 'string' },
          },
        },
        execution_result: {
          type: 'object',
          required: ['result', 'action'],
          properties: {
            result: { type: 'string' },
            action: { type: 'string' },
          },
        },
      },
      gateRules: [
        {
          name: 'high_risk_requires_approval',
          gate: 'G6_EXECUTION',
          condition: {
            type: 'expression',
            config: {
              expression: 'data.riskLevel === "high" || data.riskLevel === "critical"',
            },
          },
          severity: 'error',
          message: '高风险订单需要审批',
          enabled: true,
        },
      ],
      version: '1.0.0',
      status: 'active',
    };

    await registry.registerObject(disposalOrderObject);

    // 注册状态机
    await registry.registerFlow(DisposalStateMachine);

    // 注册动作
    const actions: Array<Omit<ActionDefinition, 'id'>> = [
      {
        name: 'assign_disposal_order',
        displayName: '分配处置单',
        description: '将处置单分配给指定人员',
        targetObject: 'disposal_orders',
        type: 'custom',
        inputSchema: {
          type: 'object',
          required: ['assigneeId'],
          properties: {
            assigneeId: { type: 'number' },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            gateReport: { type: 'object' },
          },
        },
        gates: ['G6_EXECUTION'],
        riskLevel: 'low',
        idempotent: false,
        audit: {
          level: 'detailed',
          retentionDays: 365,
        },
        version: '1.0.0',
      },
      {
        name: 'submit_disposal_proposal',
        displayName: '提交处置方案',
        description: '提交处置方案并附上风险评估证据',
        targetObject: 'disposal_orders',
        type: 'custom',
        inputSchema: {
          type: 'object',
          required: ['proposedAction', 'evidence'],
          properties: {
            proposedAction: { type: 'string' },
            evidence: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  content: { type: 'object' },
                  source: { type: 'string' },
                },
              },
            },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            gateReport: { type: 'object' },
          },
        },
        gates: ['G1_STRUCTURAL', 'G3_EVIDENCE'],
        riskLevel: 'medium',
        idempotent: false,
        audit: {
          level: 'detailed',
          retentionDays: 365,
        },
        version: '1.0.0',
      },
      {
        name: 'approve_disposal_proposal',
        displayName: '审批处置方案',
        description: '审批处置方案',
        targetObject: 'disposal_orders',
        type: 'custom',
        inputSchema: {
          type: 'object',
          properties: {
            approvalNotes: { type: 'string' },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            gateReport: { type: 'object' },
          },
        },
        gates: ['G6_EXECUTION', 'G7_EVALUATION'],
        riskLevel: 'high',
        idempotent: false,
        audit: {
          level: 'detailed',
          retentionDays: 365,
        },
        version: '1.0.0',
      },
      {
        name: 'execute_disposal',
        displayName: '执行处置',
        description: '执行已批准的处置动作',
        targetObject: 'disposal_orders',
        type: 'custom',
        inputSchema: {
          type: 'object',
          properties: {},
        },
        outputSchema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            gateReport: { type: 'object' },
          },
        },
        gates: ['G6_EXECUTION', 'G3_EVIDENCE'],
        riskLevel: 'high',
        idempotent: false,
        audit: {
          level: 'detailed',
          retentionDays: 365,
        },
        version: '1.0.0',
      },
    ];

    for (const action of actions) {
      await registry.registerAction(action);
    }

    this.app.logger.info('[@ALE/disposal-order] Registered to ontology');
  }

  /**
   * 注册资源动作
   */
  private registerResourceActions() {
    this.app.resourcer.define({
      name: 'disposal_orders',
      actions: {
        /**
         * 获取处置单统计
         * GET /api/disposal_orders:stats
         */
        stats: async (ctx, next) => {
          const repo = this.db.getRepository('disposal_orders');
          
          const total = await repo.count();
          const byStatus = await repo.find({
            fields: ['status'],
            group: ['status'],
          });
          const byRiskLevel = await repo.find({
            fields: ['riskLevel'],
            group: ['riskLevel'],
          });

          ctx.body = {
            total,
            byStatus: byStatus.reduce((acc: Record<string, number>, item: any) => {
              acc[item.status] = (acc[item.status] || 0) + 1;
              return acc;
            }, {}),
            byRiskLevel: byRiskLevel.reduce((acc: Record<string, number>, item: any) => {
              acc[item.riskLevel] = (acc[item.riskLevel] || 0) + 1;
              return acc;
            }, {}),
          };
          await next();
        },
      },
    });
  }
}

export default ALEDisposalOrderPlugin;
