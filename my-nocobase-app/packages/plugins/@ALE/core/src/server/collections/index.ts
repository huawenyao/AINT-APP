/**
 * ALE Core Collections - 核心数据表定义
 * 
 * 这些表支撑 ALE 双态架构的核心功能
 */

import { defineCollection } from '@nocobase/database';

// ============================================================================
// 构建态表 (Design Time Tables)
// ============================================================================

/**
 * 意图记录表 - 存储用户的意图输入和解析结果
 */
export const aleIntents = defineCollection({
  name: 'ale_intents',
  title: '意图记录',
  fields: [
    {
      name: 'id',
      type: 'uuid',
      primaryKey: true,
    },
    {
      name: 'sessionId',
      type: 'string',
      index: true,
      comment: '会话ID，用于关联多轮对话',
    },
    {
      name: 'status',
      type: 'string',
      defaultValue: 'pending',
      index: true,
      comment: 'pending | processed | clarification_needed | failed',
    },
    {
      name: 'input',
      type: 'json',
      comment: '原始输入（IntentInput）',
    },
    {
      name: 'parsedIntent',
      type: 'json',
      comment: '解析后的意图（ParsedIntent）',
    },
    {
      name: 'confidence',
      type: 'float',
      comment: '置信度',
    },
    {
      name: 'spaceId',
      type: 'string',
      index: true,
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
    {
      name: 'updatedAt',
      type: 'date',
    },
  ],
});

/**
 * 变更方案表 - 存储 AI 生成的变更方案
 */
export const aleProposals = defineCollection({
  name: 'ale_proposals',
  title: '变更方案',
  fields: [
    {
      name: 'id',
      type: 'uuid',
      primaryKey: true,
    },
    {
      name: 'intentId',
      type: 'string',
      index: true,
      comment: '关联的意图ID',
    },
    {
      name: 'summary',
      type: 'text',
      comment: '方案摘要',
    },
    {
      name: 'version',
      type: 'integer',
      defaultValue: 1,
      comment: '方案版本（同一意图可能产生多个版本）',
    },
    {
      name: 'components',
      type: 'json',
      comment: '方案组件（ProposalComponents）',
    },
    {
      name: 'previews',
      type: 'json',
      comment: '预览数据（ProposalPreviews）',
    },
    {
      name: 'impact',
      type: 'json',
      comment: '影响分析（ImpactAnalysis）',
    },
    {
      name: 'gatePreCheck',
      type: 'json',
      comment: '门禁预检结果',
    },
    {
      name: 'status',
      type: 'string',
      defaultValue: 'draft',
      index: true,
      comment: 'draft | confirmed | discarded',
    },
    {
      name: 'createdAt',
      type: 'date',
    },
    {
      name: 'updatedAt',
      type: 'date',
    },
  ],
});

/**
 * 会话历史表 - 存储构建态的对话历史
 */
export const aleConversations = defineCollection({
  name: 'ale_conversations',
  title: '会话历史',
  fields: [
    {
      name: 'id',
      type: 'uuid',
      primaryKey: true,
    },
    {
      name: 'sessionId',
      type: 'string',
      unique: true,
      comment: '会话ID',
    },
    {
      name: 'title',
      type: 'string',
      comment: '会话标题（自动生成）',
    },
    {
      name: 'messages',
      type: 'json',
      comment: '消息列表（ConversationMessage[]）',
    },
    {
      name: 'currentProposalId',
      type: 'string',
      comment: '当前方案ID',
    },
    {
      name: 'status',
      type: 'string',
      defaultValue: 'active',
      comment: 'active | completed | abandoned',
    },
    {
      name: 'spaceId',
      type: 'string',
      index: true,
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
    {
      name: 'updatedAt',
      type: 'date',
    },
  ],
});

// ============================================================================
// 运行态表 (Runtime Tables)
// ============================================================================

/**
 * 本体对象表 - 存储对象定义的元数据
 */
export const aleOntologyObjects = defineCollection({
  name: 'ale_ontology_objects',
  title: '本体对象',
  fields: [
    {
      name: 'id',
      type: 'uuid',
      primaryKey: true,
    },
    {
      name: 'collectionName',
      type: 'string',
      unique: true,
      comment: '对应 NocoBase Collection 名称',
    },
    {
      name: 'displayName',
      type: 'string',
    },
    {
      name: 'description',
      type: 'text',
    },
    {
      name: 'fields',
      type: 'json',
      comment: '字段定义（FieldDefinition[]）',
    },
    {
      name: 'semanticTags',
      type: 'json',
      defaultValue: [],
      comment: '语义标签',
    },
    {
      name: 'evidenceSchema',
      type: 'json',
      comment: '证据模式定义',
    },
    {
      name: 'gateRules',
      type: 'json',
      defaultValue: [],
      comment: '门禁规则',
    },
    {
      name: 'version',
      type: 'string',
      defaultValue: '1.0.0',
    },
    {
      name: 'status',
      type: 'string',
      defaultValue: 'active',
      index: true,
      comment: 'active | deprecated | draft',
    },
    {
      name: 'metadata',
      type: 'json',
    },
    {
      name: 'createdAt',
      type: 'date',
    },
    {
      name: 'updatedAt',
      type: 'date',
    },
  ],
});

/**
 * 本体关系表 - 存储对象间关系的元数据
 */
export const aleOntologyRelations = defineCollection({
  name: 'ale_ontology_relations',
  title: '本体关系',
  fields: [
    {
      name: 'id',
      type: 'uuid',
      primaryKey: true,
    },
    {
      name: 'name',
      type: 'string',
    },
    {
      name: 'displayName',
      type: 'string',
    },
    {
      name: 'sourceObject',
      type: 'string',
      index: true,
      comment: '源对象 collectionName',
    },
    {
      name: 'targetObject',
      type: 'string',
      index: true,
      comment: '目标对象 collectionName',
    },
    {
      name: 'relationType',
      type: 'string',
      comment: 'belongsTo | hasOne | hasMany | belongsToMany',
    },
    {
      name: 'semanticType',
      type: 'string',
      comment: 'owns | references | triggers | requires | contains',
    },
    {
      name: 'foreignKey',
      type: 'string',
    },
    {
      name: 'through',
      type: 'string',
      comment: '多对多关系的中间表',
    },
    {
      name: 'constraints',
      type: 'json',
    },
    {
      name: 'version',
      type: 'string',
      defaultValue: '1.0.0',
    },
    {
      name: 'createdAt',
      type: 'date',
    },
    {
      name: 'updatedAt',
      type: 'date',
    },
  ],
});

/**
 * 流程定义表 - 存储状态机/工作流定义
 */
export const aleFlows = defineCollection({
  name: 'ale_flows',
  title: '流程定义',
  fields: [
    {
      name: 'id',
      type: 'uuid',
      primaryKey: true,
    },
    {
      name: 'name',
      type: 'string',
      unique: true,
    },
    {
      name: 'displayName',
      type: 'string',
    },
    {
      name: 'type',
      type: 'string',
      comment: 'state-machine | workflow | approval',
    },
    {
      name: 'targetObject',
      type: 'string',
      index: true,
      comment: '关联的对象 collectionName',
    },
    {
      name: 'states',
      type: 'json',
      comment: '状态定义（StateDefinition[]）',
    },
    {
      name: 'transitions',
      type: 'json',
      comment: '转换定义（TransitionDefinition[]）',
    },
    {
      name: 'initialState',
      type: 'string',
    },
    {
      name: 'finalStates',
      type: 'json',
      defaultValue: [],
    },
    {
      name: 'gateRequirements',
      type: 'json',
      comment: '门禁要求配置',
    },
    {
      name: 'version',
      type: 'string',
      defaultValue: '1.0.0',
    },
    {
      name: 'enabled',
      type: 'boolean',
      defaultValue: true,
    },
    {
      name: 'createdAt',
      type: 'date',
    },
    {
      name: 'updatedAt',
      type: 'date',
    },
  ],
});

/**
 * 动作定义表 - 存储可执行动作的定义
 */
export const aleActions = defineCollection({
  name: 'ale_actions',
  title: '动作定义',
  fields: [
    {
      name: 'id',
      type: 'uuid',
      primaryKey: true,
    },
    {
      name: 'name',
      type: 'string',
      unique: true,
    },
    {
      name: 'displayName',
      type: 'string',
    },
    {
      name: 'description',
      type: 'text',
    },
    {
      name: 'targetObject',
      type: 'string',
      index: true,
    },
    {
      name: 'type',
      type: 'string',
      comment: 'create | update | delete | custom | workflow',
    },
    {
      name: 'inputSchema',
      type: 'json',
      comment: '输入参数 Schema',
    },
    {
      name: 'outputSchema',
      type: 'json',
      comment: '输出结果 Schema',
    },
    {
      name: 'gates',
      type: 'json',
      defaultValue: [],
      comment: '需要通过的门禁列表',
    },
    {
      name: 'riskLevel',
      type: 'string',
      defaultValue: 'low',
      comment: 'low | medium | high | critical',
    },
    {
      name: 'idempotent',
      type: 'boolean',
      defaultValue: false,
    },
    {
      name: 'compensation',
      type: 'json',
      comment: '补偿配置',
    },
    {
      name: 'audit',
      type: 'json',
      comment: '审计配置',
    },
    {
      name: 'version',
      type: 'string',
      defaultValue: '1.0.0',
    },
    {
      name: 'enabled',
      type: 'boolean',
      defaultValue: true,
    },
    {
      name: 'createdAt',
      type: 'date',
    },
    {
      name: 'updatedAt',
      type: 'date',
    },
  ],
});

/**
 * 规则定义表 - 存储业务规则
 */
export const aleRules = defineCollection({
  name: 'ale_rules',
  title: '规则定义',
  fields: [
    {
      name: 'id',
      type: 'uuid',
      primaryKey: true,
    },
    {
      name: 'name',
      type: 'string',
      unique: true,
    },
    {
      name: 'displayName',
      type: 'string',
    },
    {
      name: 'type',
      type: 'string',
      comment: 'validation | computation | trigger | policy',
    },
    {
      name: 'targetObject',
      type: 'string',
      index: true,
    },
    {
      name: 'condition',
      type: 'json',
      comment: '触发条件',
    },
    {
      name: 'actions',
      type: 'json',
      comment: '执行动作',
    },
    {
      name: 'priority',
      type: 'integer',
      defaultValue: 100,
    },
    {
      name: 'enabled',
      type: 'boolean',
      defaultValue: true,
    },
    {
      name: 'version',
      type: 'string',
      defaultValue: '1.0.0',
    },
    {
      name: 'createdAt',
      type: 'date',
    },
    {
      name: 'updatedAt',
      type: 'date',
    },
  ],
});

// ============================================================================
// 共享表 (Shared Tables)
// ============================================================================

/**
 * 变更集表 - 存储变更请求
 */
export const aleChangeSets = defineCollection({
  name: 'ale_changesets',
  title: '变更集',
  fields: [
    {
      name: 'id',
      type: 'uuid',
      primaryKey: true,
    },
    {
      name: 'title',
      type: 'string',
    },
    {
      name: 'description',
      type: 'text',
    },
    {
      name: 'type',
      type: 'string',
      comment: 'schema | action | flow | view | rule | policy | config | design',
    },
    {
      name: 'status',
      type: 'string',
      defaultValue: 'draft',
      index: true,
      comment: 'draft | pending | approved | rejected | published | rolled_back',
    },
    {
      name: 'changes',
      type: 'json',
      comment: '变更内容列表（ChangeSetChange[]）',
    },
    {
      name: 'proposalId',
      type: 'string',
      comment: '来源方案ID',
    },
    {
      name: 'gateReportId',
      type: 'string',
    },
    {
      name: 'gateReport',
      type: 'json',
    },
    {
      name: 'riskLevel',
      type: 'string',
      defaultValue: 'low',
    },
    {
      name: 'version',
      type: 'string',
    },
    {
      name: 'parentVersion',
      type: 'string',
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
      name: 'createdAt',
      type: 'date',
    },
    {
      name: 'submittedAt',
      type: 'date',
    },
    {
      name: 'approvedAt',
      type: 'date',
    },
    {
      name: 'publishedAt',
      type: 'date',
    },
    {
      name: 'rolledBackAt',
      type: 'date',
    },
  ],
});

/**
 * 门禁报告表 - 存储门禁评估结果
 */
export const aleGateReports = defineCollection({
  name: 'ale_gate_reports',
  title: '门禁报告',
  fields: [
    {
      name: 'id',
      type: 'uuid',
      primaryKey: true,
    },
    {
      name: 'subjectType',
      type: 'string',
      index: true,
      comment: '评估对象类型',
    },
    {
      name: 'subjectId',
      type: 'string',
      index: true,
      comment: '评估对象ID',
    },
    {
      name: 'gates',
      type: 'json',
      comment: '门禁结果列表（GateResult[]）',
    },
    {
      name: 'passed',
      type: 'boolean',
      index: true,
    },
    {
      name: 'summary',
      type: 'text',
    },
    {
      name: 'createdAt',
      type: 'date',
    },
  ],
});

/**
 * 证据表 - 存储操作证据
 */
export const aleEvidences = defineCollection({
  name: 'ale_evidences',
  title: '证据',
  fields: [
    {
      name: 'id',
      type: 'uuid',
      primaryKey: true,
    },
    {
      name: 'type',
      type: 'string',
      index: true,
      comment: '证据类型',
    },
    {
      name: 'source',
      type: 'string',
      comment: '证据来源',
    },
    {
      name: 'content',
      type: 'json',
      comment: '证据内容',
    },
    {
      name: 'confidence',
      type: 'float',
      comment: '置信度',
    },
    {
      name: 'verified',
      type: 'boolean',
      defaultValue: false,
    },
    {
      name: 'relatedTo',
      type: 'json',
      comment: '关联的其他证据ID',
    },
    {
      name: 'subjectType',
      type: 'string',
      index: true,
    },
    {
      name: 'subjectId',
      type: 'string',
      index: true,
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

/**
 * 审计日志表 - 存储操作审计
 */
export const aleAuditLogs = defineCollection({
  name: 'ale_audit_logs',
  title: '审计日志',
  fields: [
    {
      name: 'id',
      type: 'uuid',
      primaryKey: true,
    },
    {
      name: 'action',
      type: 'string',
      index: true,
    },
    {
      name: 'actorId',
      type: 'bigInt',
      index: true,
    },
    {
      name: 'actorType',
      type: 'string',
      comment: 'user | system | agent',
    },
    {
      name: 'subjectType',
      type: 'string',
      index: true,
    },
    {
      name: 'subjectId',
      type: 'string',
      index: true,
    },
    {
      name: 'data',
      type: 'json',
    },
    {
      name: 'result',
      type: 'json',
    },
    {
      name: 'correlationId',
      type: 'string',
      index: true,
    },
    {
      name: 'spaceId',
      type: 'string',
      index: true,
    },
    {
      name: 'timestamp',
      type: 'date',
    },
  ],
});

/**
 * 版本快照表 - 存储本体版本快照
 */
export const aleVersionSnapshots = defineCollection({
  name: 'ale_version_snapshots',
  title: '版本快照',
  fields: [
    {
      name: 'id',
      type: 'uuid',
      primaryKey: true,
    },
    {
      name: 'version',
      type: 'string',
      unique: true,
    },
    {
      name: 'changesetId',
      type: 'string',
      comment: '关联的变更集ID',
    },
    {
      name: 'snapshot',
      type: 'json',
      comment: '完整快照数据',
    },
    {
      name: 'diff',
      type: 'json',
      comment: '与上一版本的差异',
    },
    {
      name: 'parentVersion',
      type: 'string',
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

// 导出所有 Collections
export const collections = [
  // 构建态
  aleIntents,
  aleProposals,
  aleConversations,
  // 运行态
  aleOntologyObjects,
  aleOntologyRelations,
  aleFlows,
  aleActions,
  aleRules,
  // 共享
  aleChangeSets,
  aleGateReports,
  aleEvidences,
  aleAuditLogs,
  aleVersionSnapshots,
];
