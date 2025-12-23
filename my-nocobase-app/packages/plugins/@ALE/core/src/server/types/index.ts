/**
 * ALE Core Types - 核心类型定义
 * 
 * 本文件定义了 ALE 双态架构的核心类型
 * - 构建态类型：意图、方案、动态视图
 * - 运行态类型：本体、门禁、执行
 * - 共享类型：ChangeSet、证据、审计
 */

import { z } from 'zod';

// ============================================================================
// 基础类型
// ============================================================================

/** 唯一标识符 */
export type UUID = string;

/** 时间戳 */
export type Timestamp = Date;

/** 风险等级 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** 状态 */
export type Status = 'draft' | 'pending' | 'approved' | 'rejected' | 'published' | 'rolled_back';

// ============================================================================
// 构建态类型 (Design Time)
// ============================================================================

/**
 * 意图输入 - 用户的自然语言表达
 */
export interface IntentInput {
  /** 输入类型 */
  type: 'text' | 'voice' | 'multimodal';
  /** 输入内容 */
  content: string;
  /** 附件（截图、文档等） */
  attachments?: Attachment[];
  /** 上下文 */
  context?: DesignContext;
}

export interface Attachment {
  id: UUID;
  type: 'image' | 'document' | 'audio';
  url: string;
  metadata?: Record<string, unknown>;
}

export interface DesignContext {
  /** 当前 Space */
  spaceId?: string;
  /** 当前视图 */
  currentView?: string;
  /** 选中的对象 */
  selectedObjects?: string[];
  /** 会话历史 */
  conversationHistory?: ConversationMessage[];
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Timestamp;
  metadata?: Record<string, unknown>;
}

/**
 * 解析后的意图
 */
export interface ParsedIntent {
  /** 意图 ID */
  id: UUID;
  /** 意图分类 */
  category: IntentCategory;
  /** 意图主体 */
  subjects: IntentSubject[];
  /** 意图动作 */
  actions: IntentAction[];
  /** 约束条件 */
  constraints: IntentConstraint[];
  /** 置信度 (0-1) */
  confidence: number;
  /** 需要澄清的点 */
  clarifications?: ClarificationRequest[];
  /** 原始输入 */
  rawInput: string;
  /** 创建时间 */
  createdAt: Timestamp;
}

export type IntentCategory = 'create' | 'modify' | 'delete' | 'query' | 'analyze' | 'automate';

export interface IntentSubject {
  /** 主体类型 */
  type: 'object' | 'relation' | 'flow' | 'view' | 'rule' | 'action';
  /** 主体名称 */
  name: string;
  /** 是否推断 */
  inferred: boolean;
  /** 属性 */
  properties?: Record<string, unknown>;
}

export interface IntentAction {
  /** 动作动词 */
  verb: string;
  /** 动作目标 */
  target: string;
  /** 参数 */
  parameters?: Record<string, unknown>;
}

export interface IntentConstraint {
  /** 约束类型 */
  type: 'condition' | 'validation' | 'permission' | 'workflow';
  /** 约束表达式 */
  expression: string;
  /** 约束值 */
  value?: unknown;
}

export interface ClarificationRequest {
  /** 问题 */
  question: string;
  /** 选项 */
  options?: string[];
  /** 必须回答 */
  required: boolean;
}

/**
 * 变更方案 - AI 生成的变更建议
 */
export interface ChangeProposal {
  /** 方案 ID */
  id: UUID;
  /** 摘要 */
  summary: string;
  /** 来源意图 */
  intentId: UUID;
  /** 方案版本 */
  version: number;
  /** 方案组件 */
  components: ProposalComponents;
  /** 预览 */
  previews: ProposalPreviews;
  /** 影响分析 */
  impact: ImpactAnalysis;
  /** 门禁预检 */
  gatePreCheck: GatePreCheckResults;
  /** 状态 */
  status: 'draft' | 'confirmed' | 'discarded';
  /** 创建时间 */
  createdAt: Timestamp;
  /** 更新时间 */
  updatedAt: Timestamp;
}

export interface ProposalComponents {
  objects?: ObjectDefinition[];
  relations?: RelationDefinition[];
  flows?: FlowDefinition[];
  views?: ViewDefinition[];
  rules?: RuleDefinition[];
  actions?: ActionDefinition[];
}

export interface ProposalPreviews {
  schema?: SchemaPreview;
  stateMachine?: StateMachinePreview;
  ui?: UIPreview;
  dataFlow?: DataFlowPreview;
}

export interface ImpactAnalysis {
  affectedObjects: string[];
  affectedViews: string[];
  affectedFlows: string[];
  affectedRules: string[];
  riskLevel: RiskLevel;
  warnings: string[];
  suggestions: string[];
}

export interface GatePreCheckResults {
  G1?: GatePreCheckResult;
  G3?: GatePreCheckResult;
  G6?: GatePreCheckResult;
  G7?: GatePreCheckResult;
}

export interface GatePreCheckResult {
  gate: string;
  passed: boolean;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// 运行态类型 (Runtime)
// ============================================================================

/**
 * 本体对象定义
 */
export interface ObjectDefinition {
  /** 对象 ID */
  id: UUID;
  /** 集合名称（对应 NocoBase Collection） */
  collectionName: string;
  /** 显示名称 */
  displayName: string;
  /** 描述 */
  description?: string;
  /** 字段定义 */
  fields: FieldDefinition[];
  /** 语义标签 */
  semanticTags: string[];
  /** 证据模式 */
  evidenceSchema?: Record<string, unknown>;
  /** 门禁规则 */
  gateRules?: GateRule[];
  /** 版本 */
  version: string;
  /** 状态 */
  status: 'active' | 'deprecated' | 'draft';
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

export interface FieldDefinition {
  /** 字段名 */
  name: string;
  /** 显示名 */
  displayName: string;
  /** 字段类型 */
  type: FieldType;
  /** 是否必填 */
  required: boolean;
  /** 是否唯一 */
  unique?: boolean;
  /** 默认值 */
  defaultValue?: unknown;
  /** 验证规则 */
  validations?: ValidationRule[];
  /** 选项（枚举类型） */
  options?: FieldOption[];
  /** 关联配置（关系类型） */
  relation?: RelationConfig;
  /** UI 配置 */
  uiConfig?: FieldUIConfig;
  /** 语义标签 */
  semanticTags?: string[];
}

export type FieldType = 
  | 'string' | 'text' | 'richText'
  | 'integer' | 'float' | 'decimal'
  | 'boolean'
  | 'date' | 'datetime' | 'time'
  | 'enum' | 'set'
  | 'json' | 'array'
  | 'uuid'
  | 'belongsTo' | 'hasOne' | 'hasMany' | 'belongsToMany';

export interface FieldOption {
  value: string | number;
  label: string;
  color?: string;
}

export interface RelationConfig {
  target: string;
  foreignKey?: string;
  sourceKey?: string;
  through?: string;
}

export interface FieldUIConfig {
  component?: string;
  width?: number | string;
  hidden?: boolean;
  readonly?: boolean;
  placeholder?: string;
}

export interface ValidationRule {
  type: string;
  value?: unknown;
  message: string;
}

/**
 * 关系定义
 */
export interface RelationDefinition {
  id: UUID;
  name: string;
  displayName: string;
  sourceObject: string;
  targetObject: string;
  relationType: 'belongsTo' | 'hasOne' | 'hasMany' | 'belongsToMany';
  semanticType: 'owns' | 'references' | 'triggers' | 'requires' | 'contains';
  foreignKey?: string;
  through?: string;
  constraints?: RelationConstraint[];
  version: string;
}

export interface RelationConstraint {
  type: 'cascade' | 'restrict' | 'setNull';
  onDelete?: boolean;
  onUpdate?: boolean;
}

/**
 * 流程/状态机定义
 */
export interface FlowDefinition {
  id: UUID;
  name: string;
  displayName: string;
  type: 'state-machine' | 'workflow' | 'approval';
  targetObject: string;
  states: StateDefinition[];
  transitions: TransitionDefinition[];
  initialState: string;
  finalStates: string[];
  gateRequirements: Record<string, FlowGateRequirement>;
  version: string;
}

export interface StateDefinition {
  id: string;
  name: string;
  displayName: string;
  type: 'normal' | 'initial' | 'final';
  metadata?: Record<string, unknown>;
}

export interface TransitionDefinition {
  id: string;
  name: string;
  displayName: string;
  from: string;
  to: string;
  trigger: string;
  conditions?: TransitionCondition[];
  actions?: string[];
}

export interface TransitionCondition {
  type: 'field' | 'expression' | 'gate';
  field?: string;
  operator?: string;
  value?: unknown;
  expression?: string;
}

export interface FlowGateRequirement {
  gates: string[];
  evidenceRequired: string[];
  failurePolicy: 'block' | 'escalate' | 'degrade';
}

/**
 * 视图定义
 */
export interface ViewDefinition {
  id: UUID;
  name: string;
  displayName: string;
  type: 'list' | 'form' | 'detail' | 'kanban' | 'calendar' | 'chart';
  targetObject: string;
  config: ViewConfig;
  permissions?: ViewPermission[];
  version: string;
}

export interface ViewConfig {
  columns?: ColumnConfig[];
  fields?: FormFieldConfig[];
  filters?: FilterConfig[];
  actions?: ViewActionConfig[];
  layout?: LayoutConfig;
}

export interface ColumnConfig {
  field: string;
  title?: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
}

export interface FormFieldConfig {
  field: string;
  label?: string;
  required?: boolean;
  component?: string;
  props?: Record<string, unknown>;
}

export interface FilterConfig {
  field: string;
  operator: string;
  defaultValue?: unknown;
}

export interface ViewActionConfig {
  name: string;
  label: string;
  type: 'primary' | 'default' | 'danger';
  action: string;
  visible?: string;
  disabled?: string;
}

export interface LayoutConfig {
  type: 'vertical' | 'horizontal' | 'grid';
  columns?: number;
  gutter?: number;
}

export interface ViewPermission {
  role: string;
  actions: string[];
}

/**
 * 规则定义
 */
export interface RuleDefinition {
  id: UUID;
  name: string;
  displayName: string;
  type: 'validation' | 'computation' | 'trigger' | 'policy';
  targetObject: string;
  condition: RuleCondition;
  actions: RuleAction[];
  priority: number;
  enabled: boolean;
  version: string;
}

export interface RuleCondition {
  type: 'expression' | 'field' | 'composite';
  expression?: string;
  field?: string;
  operator?: string;
  value?: unknown;
  children?: RuleCondition[];
  logic?: 'and' | 'or';
}

export interface RuleAction {
  type: 'set' | 'validate' | 'notify' | 'trigger' | 'block';
  target?: string;
  value?: unknown;
  message?: string;
  params?: Record<string, unknown>;
}

/**
 * 动作定义
 */
export interface ActionDefinition {
  id: UUID;
  name: string;
  displayName: string;
  description?: string;
  targetObject: string;
  type: 'create' | 'update' | 'delete' | 'custom' | 'workflow';
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  gates: string[];
  riskLevel: RiskLevel;
  idempotent: boolean;
  compensation?: CompensationConfig;
  audit: AuditConfig;
  version: string;
}

export interface CompensationConfig {
  action: string;
  autoTrigger: boolean;
  timeout?: number;
}

export interface AuditConfig {
  level: 'none' | 'basic' | 'detailed';
  retentionDays: number;
  fields?: string[];
}

/**
 * 门禁规则
 */
export interface GateRule {
  id: UUID;
  name: string;
  gate: 'G1' | 'G2' | 'G3' | 'G4' | 'G5' | 'G6' | 'G7';
  condition: GateCondition;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  enabled: boolean;
}

export interface GateCondition {
  type: 'schema' | 'evidence' | 'permission' | 'expression' | 'evaluation';
  config: Record<string, unknown>;
}

// ============================================================================
// 共享类型
// ============================================================================

/**
 * ChangeSet - 变更集
 */
export interface ChangeSet {
  id: UUID;
  title: string;
  description?: string;
  type: ChangeSetType;
  status: ChangeSetStatus;
  changes: ChangeSetChange[];
  proposalId?: UUID;
  gateReportId?: UUID;
  gateReport?: GateReport;
  riskLevel: RiskLevel;
  version?: string;
  parentVersion?: string;
  createdBy: number;
  approvedBy?: number;
  createdAt: Timestamp;
  submittedAt?: Timestamp;
  approvedAt?: Timestamp;
  publishedAt?: Timestamp;
  rolledBackAt?: Timestamp;
}

export type ChangeSetType = 'schema' | 'action' | 'flow' | 'view' | 'rule' | 'policy' | 'config' | 'design';
export type ChangeSetStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'published' | 'rolled_back';

export interface ChangeSetChange {
  id: UUID;
  action: 'create' | 'update' | 'delete';
  type: 'object' | 'relation' | 'flow' | 'view' | 'rule' | 'action';
  target: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  diff?: Record<string, unknown>;
}

/**
 * 门禁报告
 */
export interface GateReport {
  id: UUID;
  timestamp: Timestamp;
  gates: GateResult[];
  passed: boolean;
  summary: string;
  subjectType: string;
  subjectId: string;
}

export interface GateResult {
  gate: string;
  passed: boolean;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  details?: Record<string, unknown>;
  timestamp: Timestamp;
}

/**
 * 证据
 */
export interface Evidence {
  id: UUID;
  type: string;
  source: string;
  content: Record<string, unknown>;
  confidence?: number;
  verified: boolean;
  relatedTo?: UUID[];
  createdAt: Timestamp;
  createdBy?: number;
}

/**
 * 审计日志
 */
export interface AuditLog {
  id: UUID;
  action: string;
  actorId: number;
  actorType: 'user' | 'system' | 'agent';
  subjectType: string;
  subjectId: string;
  data?: Record<string, unknown>;
  result?: Record<string, unknown>;
  correlationId: string;
  spaceId?: string;
  timestamp: Timestamp;
}

/**
 * 预览类型
 */
export interface SchemaPreview {
  objects: ObjectPreviewNode[];
  relations: RelationPreviewEdge[];
}

export interface ObjectPreviewNode {
  id: string;
  name: string;
  displayName: string;
  fields: FieldPreview[];
  isNew?: boolean;
  isModified?: boolean;
}

export interface FieldPreview {
  name: string;
  displayName: string;
  type: string;
  required: boolean;
  isNew?: boolean;
}

export interface RelationPreviewEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  label: string;
  isNew?: boolean;
}

export interface StateMachinePreview {
  states: StatePreviewNode[];
  transitions: TransitionPreviewEdge[];
}

export interface StatePreviewNode {
  id: string;
  name: string;
  type: 'initial' | 'normal' | 'final';
  isNew?: boolean;
}

export interface TransitionPreviewEdge {
  id: string;
  from: string;
  to: string;
  trigger: string;
  label: string;
  isNew?: boolean;
}

export interface UIPreview {
  type: 'list' | 'form' | 'detail';
  mockData?: Record<string, unknown>[];
  screenshot?: string;
}

export interface DataFlowPreview {
  nodes: DataFlowNode[];
  edges: DataFlowEdge[];
}

export interface DataFlowNode {
  id: string;
  type: 'source' | 'transform' | 'destination';
  label: string;
}

export interface DataFlowEdge {
  source: string;
  target: string;
  label?: string;
}

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

export const IntentInputSchema = z.object({
  type: z.enum(['text', 'voice', 'multimodal']),
  content: z.string().min(1),
  attachments: z.array(z.object({
    id: z.string().uuid(),
    type: z.enum(['image', 'document', 'audio']),
    url: z.string().url(),
    metadata: z.record(z.unknown()).optional(),
  })).optional(),
  context: z.object({
    spaceId: z.string().optional(),
    currentView: z.string().optional(),
    selectedObjects: z.array(z.string()).optional(),
  }).optional(),
});

export const ChangeSetSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(['schema', 'action', 'flow', 'view', 'rule', 'policy', 'config', 'design']),
  changes: z.array(z.object({
    action: z.enum(['create', 'update', 'delete']),
    type: z.enum(['object', 'relation', 'flow', 'view', 'rule', 'action']),
    target: z.string(),
    before: z.record(z.unknown()).optional(),
    after: z.record(z.unknown()).optional(),
  })),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).default('low'),
});

export const FieldDefinitionSchema = z.object({
  name: z.string().regex(/^[a-z][a-z0-9_]*$/i),
  displayName: z.string(),
  type: z.enum([
    'string', 'text', 'richText',
    'integer', 'float', 'decimal',
    'boolean',
    'date', 'datetime', 'time',
    'enum', 'set',
    'json', 'array',
    'uuid',
    'belongsTo', 'hasOne', 'hasMany', 'belongsToMany'
  ]),
  required: z.boolean().default(false),
  unique: z.boolean().optional(),
  defaultValue: z.unknown().optional(),
});

export const ObjectDefinitionSchema = z.object({
  collectionName: z.string().regex(/^[a-z][a-z0-9_]*$/i),
  displayName: z.string(),
  description: z.string().optional(),
  fields: z.array(FieldDefinitionSchema),
  semanticTags: z.array(z.string()).default([]),
});
