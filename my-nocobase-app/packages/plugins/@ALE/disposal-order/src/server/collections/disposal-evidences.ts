/**
 * Disposal Evidences Collection - 处置单证据表
 */

import { defineCollection } from '@nocobase/database';

export const disposalEvidences = defineCollection({
  name: 'disposal_evidences',
  title: '处置单证据',
  fields: [
    {
      name: 'id',
      type: 'uuid',
      primaryKey: true,
    },
    {
      name: 'disposalOrderId',
      type: 'string',
      index: true,
      comment: '关联的处置单ID',
    },
    {
      name: 'disposalOrder',
      type: 'belongsTo',
      target: 'disposal_orders',
      foreignKey: 'disposalOrderId',
    },
    {
      name: 'type',
      type: 'string',
      index: true,
      comment: '证据类型: risk_assessment | execution_result | approval_record',
    },
    {
      name: 'content',
      type: 'json',
      comment: '证据内容',
    },
    {
      name: 'source',
      type: 'string',
      comment: '证据来源',
    },
    {
      name: 'confidence',
      type: 'float',
      defaultValue: 1.0,
      comment: '置信度',
    },
    {
      name: 'verified',
      type: 'boolean',
      defaultValue: false,
      comment: '是否已验证',
    },
    {
      name: 'createdBy',
      type: 'belongsTo',
      target: 'users',
    },
    {
      name: 'createdAt',
      type: 'date',
    },
  ],
});
