/**
 * Disposal Orders Collection - 处置单数据表
 */

import { defineCollection } from '@nocobase/database';

export const disposalOrders = defineCollection({
  name: 'disposal_orders',
  title: '处置单',
  fields: [
    {
      name: 'id',
      type: 'uuid',
      primaryKey: true,
    },
    {
      name: 'orderNo',
      type: 'string',
      unique: true,
      comment: '处置单号',
    },
    {
      name: 'sourceOrderId',
      type: 'string',
      index: true,
      comment: '原订单ID',
    },
    {
      name: 'customerName',
      type: 'string',
      comment: '客户名称',
    },
    {
      name: 'delayReason',
      type: 'text',
      comment: '延迟原因',
    },
    {
      name: 'delayDays',
      type: 'integer',
      comment: '延迟天数',
    },
    {
      name: 'orderAmount',
      type: 'decimal',
      comment: '订单金额',
    },
    {
      name: 'riskLevel',
      type: 'string',
      defaultValue: 'low',
      index: true,
      comment: '风险等级: low | medium | high | critical',
    },
    {
      name: 'status',
      type: 'string',
      defaultValue: 'pending',
      index: true,
      comment: '状态: pending | assigned | proposal_submitted | approved | executing | resolved | failed | escalated | cancelled',
    },
    {
      name: 'proposedAction',
      type: 'string',
      comment: '建议处置动作',
    },
    {
      name: 'finalAction',
      type: 'string',
      comment: '最终处置动作',
    },
    {
      name: 'resolutionNotes',
      type: 'text',
      comment: '处置说明',
    },
    {
      name: 'assignedTo',
      type: 'belongsTo',
      target: 'users',
      comment: '分配给',
    },
    {
      name: 'createdBy',
      type: 'belongsTo',
      target: 'users',
    },
    {
      name: 'approvedBy',
      type: 'belongsTo',
      target: 'users',
    },
    {
      name: 'evidences',
      type: 'hasMany',
      target: 'disposal_evidences',
      foreignKey: 'disposalOrderId',
    },
    {
      name: 'events',
      type: 'hasMany',
      target: 'disposal_events',
      foreignKey: 'disposalOrderId',
    },
    {
      name: 'createdAt',
      type: 'date',
    },
    {
      name: 'updatedAt',
      type: 'date',
    },
    {
      name: 'resolvedAt',
      type: 'date',
    },
  ],
});
