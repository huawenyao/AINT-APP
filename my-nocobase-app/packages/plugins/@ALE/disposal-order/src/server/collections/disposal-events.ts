/**
 * Disposal Events Collection - 处置单事件表
 */

import { defineCollection } from '@nocobase/database';

export const disposalEvents = defineCollection({
  name: 'disposal_events',
  title: '处置单事件',
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
      comment: '事件类型: assigned | proposal_submitted | approved | executed | failed | cancelled',
    },
    {
      name: 'data',
      type: 'json',
      comment: '事件数据',
    },
    {
      name: 'actorId',
      type: 'bigInt',
      index: true,
      comment: '操作者ID',
    },
    {
      name: 'timestamp',
      type: 'date',
      index: true,
    },
  ],
});
