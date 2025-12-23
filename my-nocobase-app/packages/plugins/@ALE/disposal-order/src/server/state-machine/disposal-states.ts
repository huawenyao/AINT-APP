/**
 * Disposal Order State Machine - 处置单状态机定义
 */

import type { FlowDefinition } from '@ALE/core';

/**
 * 处置单状态机定义
 */
export const DisposalStateMachine: FlowDefinition = {
  id: 'disposal_order_state_machine',
  name: 'disposal_order_state_machine',
  displayName: '处置单状态机',
  type: 'state-machine',
  targetObject: 'disposal_orders',
  initialState: 'pending',
  finalStates: ['resolved', 'cancelled'],
  states: [
    {
      id: 'pending',
      name: 'pending',
      displayName: '待处理',
      type: 'initial',
    },
    {
      id: 'assigned',
      name: 'assigned',
      displayName: '已分配',
      type: 'normal',
    },
    {
      id: 'proposal_submitted',
      name: 'proposal_submitted',
      displayName: '方案已提交',
      type: 'normal',
    },
    {
      id: 'approved',
      name: 'approved',
      displayName: '已批准',
      type: 'normal',
    },
    {
      id: 'executing',
      name: 'executing',
      displayName: '执行中',
      type: 'normal',
    },
    {
      id: 'resolved',
      name: 'resolved',
      displayName: '已解决',
      type: 'final',
    },
    {
      id: 'failed',
      name: 'failed',
      displayName: '执行失败',
      type: 'normal',
    },
    {
      id: 'escalated',
      name: 'escalated',
      displayName: '已升级',
      type: 'normal',
    },
    {
      id: 'cancelled',
      name: 'cancelled',
      displayName: '已取消',
      type: 'final',
    },
  ],
  transitions: [
    {
      id: 'assign',
      name: 'assign',
      displayName: '分配',
      from: 'pending',
      to: 'assigned',
      trigger: 'ASSIGN',
    },
    {
      id: 'submit_proposal',
      name: 'submit_proposal',
      displayName: '提交方案',
      from: 'assigned',
      to: 'proposal_submitted',
      trigger: 'SUBMIT_PROPOSAL',
    },
    {
      id: 'approve',
      name: 'approve',
      displayName: '批准',
      from: 'proposal_submitted',
      to: 'approved',
      trigger: 'APPROVE',
    },
    {
      id: 'reject',
      name: 'reject',
      displayName: '拒绝',
      from: 'proposal_submitted',
      to: 'assigned',
      trigger: 'REJECT',
    },
    {
      id: 'execute',
      name: 'execute',
      displayName: '执行',
      from: 'approved',
      to: 'executing',
      trigger: 'EXECUTE',
    },
    {
      id: 'complete',
      name: 'complete',
      displayName: '完成',
      from: 'executing',
      to: 'resolved',
      trigger: 'COMPLETE',
    },
    {
      id: 'fail',
      name: 'fail',
      displayName: '失败',
      from: 'executing',
      to: 'failed',
      trigger: 'FAIL',
    },
    {
      id: 'cancel',
      name: 'cancel',
      displayName: '取消',
      from: 'approved',
      to: 'cancelled',
      trigger: 'CANCEL',
    },
  ],
  gateRequirements: {
    'assigned->proposal_submitted': {
      gates: ['G1_STRUCTURAL', 'G3_EVIDENCE'],
      evidenceRequired: ['risk_assessment'],
      failurePolicy: 'block',
    },
    'proposal_submitted->approved': {
      gates: ['G6_EXECUTION', 'G7_EVALUATION'],
      evidenceRequired: [],
      failurePolicy: 'block',
    },
    'approved->executing': {
      gates: ['G6_EXECUTION'],
      evidenceRequired: [],
      failurePolicy: 'block',
    },
    'executing->resolved': {
      gates: ['G3_EVIDENCE'],
      evidenceRequired: ['execution_result'],
      failurePolicy: 'block',
    },
  },
  version: '1.0.0',
};

/**
 * 状态转换的门禁要求
 */
export const StateGateRequirements = {
  'pending->assigned': {
    gates: ['G6_EXECUTION'],
    metadata: { requiredRoles: ['operator', 'manager'] },
  },
  'assigned->proposal_submitted': {
    gates: ['G1_STRUCTURAL', 'G3_EVIDENCE'],
    metadata: { requiredEvidence: ['risk_assessment'] },
  },
  'proposal_submitted->approved': {
    gates: ['G6_EXECUTION', 'G7_EVALUATION'],
    metadata: { requiredRoles: ['manager', 'approver'] },
  },
  'approved->executing': {
    gates: ['G6_EXECUTION'],
    metadata: {},
  },
  'executing->resolved': {
    gates: ['G3_EVIDENCE'],
    metadata: { requiredEvidence: ['execution_result'] },
  },
};
