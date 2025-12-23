/**
 * Disposal Order Actions - 处置单动作定义
 */

import { Application } from '@nocobase/server';
import type { GateContext } from '@ALE/gate-engine';
import { GateType } from '@ALE/gate-engine';

/**
 * 注册处置单动作
 */
export function registerDisposalActions(app: Application) {
  const gateEngine = app.plugin('@ALE/gate-engine')?.getEngine();
  if (!gateEngine) {
    app.logger.warn('Gate engine not found, actions will not have gate checks');
  }

  // 动作1：分配处置单
  app.resourcer.define({
    name: 'disposal_orders',
    actions: {
      assign: async (ctx, next) => {
        const { filterByTk, values } = ctx.action.params;
        const { assigneeId } = values;

        if (!gateEngine) {
          ctx.throw(500, 'Gate engine not available');
        }

        // 获取当前处置单
        const order = await app.db.getRepository('disposal_orders').findOne({
          filter: { id: filterByTk },
        });

        if (!order) {
          ctx.throw(404, 'Disposal order not found');
        }

        if (order.status !== 'pending') {
          ctx.throw(400, `Cannot assign order in status: ${order.status}`);
        }

        // 门禁检查
        const gateContext: GateContext = {
          action: 'assign',
          subjectType: 'disposal_orders',
          subjectId: filterByTk,
          data: { assigneeId },
          before: order.toJSON(),
          after: { ...order.toJSON(), assignedTo: assigneeId, status: 'assigned' },
          actorId: ctx.state.currentUser?.id,
          actorType: 'user',
          metadata: {
            requiredRoles: ['operator', 'manager'],
          },
        };

        const gateResult = await gateEngine.execute(gateContext, ['G6_EXECUTION']);

        if (!gateResult.passed) {
          ctx.throw(403, `Gate check failed: ${gateResult.summary}`);
        }

        // 执行分配
        await app.db.getRepository('disposal_orders').update({
          filter: { id: filterByTk },
          values: {
            assignedTo: assigneeId,
            status: 'assigned',
            updatedAt: new Date(),
          },
        });

        // 记录事件
        await app.db.getRepository('disposal_events').create({
          values: {
            disposalOrderId: filterByTk,
            type: 'assigned',
            actorId: ctx.state.currentUser?.id,
            data: { assigneeId },
            timestamp: new Date(),
          },
        });

        ctx.body = { success: true, gateReport: gateResult };
        await next();
      },

      // 动作2：提交处置方案
      submitProposal: async (ctx, next) => {
        const { filterByTk, values } = ctx.action.params;
        const { proposedAction, evidence } = values;

        if (!gateEngine) {
          ctx.throw(500, 'Gate engine not available');
        }

        const order = await app.db.getRepository('disposal_orders').findOne({
          filter: { id: filterByTk },
        });

        if (!order) {
          ctx.throw(404, 'Disposal order not found');
        }

        if (order.status !== 'assigned') {
          ctx.throw(400, `Cannot submit proposal for order in status: ${order.status}`);
        }

        // 门禁检查
        const gateContext: GateContext = {
          action: 'submit_proposal',
          subjectType: 'disposal_orders',
          subjectId: filterByTk,
          data: { proposedAction },
          before: order.toJSON(),
          after: { ...order.toJSON(), proposedAction, status: 'proposal_submitted' },
          actorId: ctx.state.currentUser?.id,
          actorType: 'user',
          evidences: evidence || [],
          metadata: {
            requiredEvidence: ['risk_assessment'],
            schema: {
              type: 'object',
              required: ['proposedAction'],
              properties: {
                proposedAction: { type: 'string', minLength: 1 },
              },
            },
          },
        };

        const gateResult = await gateEngine.execute(gateContext, ['G1_STRUCTURAL', 'G3_EVIDENCE']);

        if (!gateResult.passed) {
          ctx.throw(400, `Gate check failed: ${gateResult.summary}`);
        }

        // 保存证据
        if (evidence && evidence.length > 0) {
          for (const ev of evidence) {
            await app.db.getRepository('disposal_evidences').create({
              values: {
                disposalOrderId: filterByTk,
                type: ev.type,
                content: ev.content,
                source: ev.source || 'manual',
                confidence: ev.confidence || 1.0,
                verified: ev.verified || false,
                createdById: ctx.state.currentUser?.id,
                createdAt: new Date(),
              },
            });
          }
        }

        // 更新处置单
        await app.db.getRepository('disposal_orders').update({
          filter: { id: filterByTk },
          values: {
            proposedAction,
            status: 'proposal_submitted',
            updatedAt: new Date(),
          },
        });

        // 记录事件
        await app.db.getRepository('disposal_events').create({
          values: {
            disposalOrderId: filterByTk,
            type: 'proposal_submitted',
            actorId: ctx.state.currentUser?.id,
            data: { proposedAction, evidenceCount: evidence?.length || 0 },
            timestamp: new Date(),
          },
        });

        ctx.body = { success: true, gateReport: gateResult };
        await next();
      },

      // 动作3：审批处置方案
      approve: async (ctx, next) => {
        const { filterByTk, values } = ctx.action.params;
        const { approvalNotes } = values || {};

        if (!gateEngine) {
          ctx.throw(500, 'Gate engine not available');
        }

        const order = await app.db.getRepository('disposal_orders').findOne({
          filter: { id: filterByTk },
        });

        if (!order) {
          ctx.throw(404, 'Disposal order not found');
        }

        if (order.status !== 'proposal_submitted') {
          ctx.throw(400, `Cannot approve order in status: ${order.status}`);
        }

        // 门禁检查
        const gateContext: GateContext = {
          action: 'approve',
          subjectType: 'disposal_orders',
          subjectId: filterByTk,
          data: { approvalNotes },
          before: order.toJSON(),
          after: { ...order.toJSON(), status: 'approved' },
          actorId: ctx.state.currentUser?.id,
          actorType: 'user',
          metadata: {
            requiredRoles: ['manager', 'approver'],
          },
        };

        const gateResult = await gateEngine.execute(gateContext, ['G6_EXECUTION', 'G7_EVALUATION']);

        if (!gateResult.passed) {
          ctx.throw(403, `Gate check failed: ${gateResult.summary}`);
        }

        // 更新处置单
        await app.db.getRepository('disposal_orders').update({
          filter: { id: filterByTk },
          values: {
            status: 'approved',
            approvedBy: ctx.state.currentUser?.id,
            updatedAt: new Date(),
          },
        });

        // 记录事件
        await app.db.getRepository('disposal_events').create({
          values: {
            disposalOrderId: filterByTk,
            type: 'approved',
            actorId: ctx.state.currentUser?.id,
            data: { approvalNotes },
            timestamp: new Date(),
          },
        });

        ctx.body = { success: true, gateReport: gateResult };
        await next();
      },

      // 动作4：执行处置
      execute: async (ctx, next) => {
        const { filterByTk } = ctx.action.params;

        if (!gateEngine) {
          ctx.throw(500, 'Gate engine not available');
        }

        const order = await app.db.getRepository('disposal_orders').findOne({
          filter: { id: filterByTk },
        });

        if (!order) {
          ctx.throw(404, 'Disposal order not found');
        }

        if (order.status !== 'approved') {
          ctx.throw(400, `Cannot execute order in status: ${order.status}`);
        }

        // 门禁检查
        const gateContext: GateContext = {
          action: 'execute',
          subjectType: 'disposal_orders',
          subjectId: filterByTk,
          data: {},
          before: order.toJSON(),
          after: { ...order.toJSON(), status: 'executing' },
          actorId: ctx.state.currentUser?.id,
          actorType: 'user',
          metadata: {
            riskLevel: order.riskLevel,
          },
        };

        const gateResult = await gateEngine.execute(gateContext, ['G6_EXECUTION']);

        if (!gateResult.passed) {
          ctx.throw(403, `Gate check failed: ${gateResult.summary}`);
        }

        try {
          // 更新状态为执行中
          await app.db.getRepository('disposal_orders').update({
            filter: { id: filterByTk },
            values: { status: 'executing', updatedAt: new Date() },
          });

          // 模拟执行处置动作
          // TODO: 实际集成写回网关
          await simulateExecution(order);

          // 更新状态为已解决
          await app.db.getRepository('disposal_orders').update({
            filter: { id: filterByTk },
            values: {
              status: 'resolved',
              finalAction: order.proposedAction,
              resolvedAt: new Date(),
              updatedAt: new Date(),
            },
          });

          // 记录执行结果证据
          await app.db.getRepository('disposal_evidences').create({
            values: {
              disposalOrderId: filterByTk,
              type: 'execution_result',
              content: { result: 'success', action: order.proposedAction },
              source: 'system',
              confidence: 1.0,
              verified: true,
              createdById: ctx.state.currentUser?.id,
              createdAt: new Date(),
            },
          });

          // 记录事件
          await app.db.getRepository('disposal_events').create({
            values: {
              disposalOrderId: filterByTk,
              type: 'executed',
              actorId: ctx.state.currentUser?.id,
              data: { action: order.proposedAction, result: 'success' },
              timestamp: new Date(),
            },
          });

          ctx.body = { success: true, gateReport: gateResult };
        } catch (error) {
          // 执行失败
          await app.db.getRepository('disposal_orders').update({
            filter: { id: filterByTk },
            values: { status: 'failed', updatedAt: new Date() },
          });

          await app.db.getRepository('disposal_events').create({
            values: {
              disposalOrderId: filterByTk,
              type: 'execution_failed',
              actorId: ctx.state.currentUser?.id,
              data: { error: error instanceof Error ? error.message : 'Unknown error' },
              timestamp: new Date(),
            },
          });

          ctx.throw(500, `Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        await next();
      },
    },
  });
}

/**
 * 模拟执行处置动作
 */
async function simulateExecution(order: any): Promise<void> {
  // MVP: 模拟执行
  // 实际应该调用写回网关执行实际动作
  await new Promise(resolve => setTimeout(resolve, 100));
}
