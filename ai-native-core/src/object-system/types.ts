/**
 * AI原生应用平台 - 统一对象系统类型定义
 */

import { JSONSchema7 } from 'json-schema';

// 对象类型枚举
export enum ObjectType {
  DATA = 'data',           // 数据对象
  UI = 'ui',              // 界面对象
  WORKFLOW = 'workflow',   // 流程对象
  USER = 'user',          // 用户对象
  PERMISSION = 'permission', // 权限对象
  SERVICE = 'service',     // 服务对象
  RULE = 'rule',          // 规则对象
  KNOWLEDGE = 'knowledge'  // 知识对象
}

// 对象生命周期状态
export enum ObjectLifecycleState {
  DRAFT = 'draft',         // 草稿
  ACTIVE = 'active',       // 活跃
  INACTIVE = 'inactive',   // 非活跃
  DEPRECATED = 'deprecated', // 已废弃
  DELETED = 'deleted'      // 已删除
}

// 对象关系类型
export enum RelationshipType {
  OWNS = 'owns',           // 拥有关系
  USES = 'uses',           // 使用关系
  DEPENDS_ON = 'depends_on', // 依赖关系
  CONTAINS = 'contains',   // 包含关系
  REFERENCES = 'references', // 引用关系
  INHERITS = 'inherits'    // 继承关系
}

// 对象元数据
export interface ObjectMetadata {
  name: string;
  description: string;
  version: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  schema?: JSONSchema7;
}

// 对象关系
export interface ObjectRelationship {
  id: string;
  type: RelationshipType;
  sourceObjectId: string;
  targetObjectId: string;
  properties?: Record<string, any>;
  metadata: {
    createdAt: Date;
    createdBy: string;
  };
}

// 对象生命周期
export interface ObjectLifecycle {
  state: ObjectLifecycleState;
  history: ObjectLifecycleEvent[];
  transitions: ObjectStateTransition[];
}

export interface ObjectLifecycleEvent {
  id: string;
  fromState: ObjectLifecycleState;
  toState: ObjectLifecycleState;
  timestamp: Date;
  triggeredBy: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface ObjectStateTransition {
  from: ObjectLifecycleState;
  to: ObjectLifecycleState;
  condition?: (object: UniversalObject) => boolean;
  action?: (object: UniversalObject) => Promise<void>;
}

// Agent能力定义
export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  category: string;
  inputSchema: JSONSchema7;
  outputSchema: JSONSchema7;
  executor: CapabilityExecutor;
  dependencies: string[];
  metadata: {
    version: string;
    author: string;
    createdAt: Date;
  };
}

export type CapabilityExecutor = (
  input: any,
  context: ExecutionContext
) => Promise<any>;

// 执行上下文
export interface ExecutionContext {
  objectId: string;
  userId: string;
  sessionId: string;
  environment: 'development' | 'staging' | 'production';
  permissions: string[];
  metadata: Record<string, any>;
}

// Agent工具
export interface AgentTool {
  id: string;
  name: string;
  description: string;
  execute: (params: any, context: ExecutionContext) => Promise<any>;
}

// Agent内存
export interface AgentMemory {
  shortTerm: Record<string, any>;
  longTerm: Record<string, any>;
  episodic: MemoryEpisode[];
  semantic: Record<string, any>;
}

export interface MemoryEpisode {
  id: string;
  timestamp: Date;
  event: string;
  context: Record<string, any>;
  outcome: any;
}

// AI模型配置
export interface AIModel {
  provider: 'openai' | 'anthropic' | 'local';
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
  tools?: AgentTool[];
}

// 对象Agent
export interface ObjectAgent {
  id: string;
  objectId: string;
  model: AIModel;
  capabilities: AgentCapability[];
  memory: AgentMemory;
  tools: AgentTool[];
  isActive: boolean;
  execute(instruction: Instruction): Promise<ExecutionResult>;
}

// 指令定义
export interface Instruction {
  id: string;
  type: 'query' | 'command' | 'task';
  content: string;
  parameters?: Record<string, any>;
  context: ExecutionContext;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timeout?: number;
}

// 执行结果
export interface ExecutionResult {
  id: string;
  instructionId: string;
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  metadata: {
    startTime: Date;
    endTime: Date;
    resourceUsage?: Record<string, any>;
  };
}

// 统一对象接口
export interface UniversalObject {
  id: string;
  type: ObjectType;
  metadata: ObjectMetadata;
  properties: Record<string, any>;
  capabilities: AgentCapability[];
  relationships: ObjectRelationship[];
  lifecycle: ObjectLifecycle;
  agent: ObjectAgent;
  
  // 核心方法
  execute(instruction: Instruction): Promise<ExecutionResult>;
  addRelationship(relationship: ObjectRelationship): void;
  removeRelationship(relationshipId: string): void;
  updateProperties(properties: Partial<Record<string, any>>): void;
  transitionState(newState: ObjectLifecycleState, reason?: string): void;
  
  // 序列化方法
  toJSON(): Record<string, any>;
  fromJSON(data: Record<string, any>): void;
}

// 对象注册表接口
export interface ObjectRegistry {
  register(object: UniversalObject): Promise<void>;
  unregister(objectId: string): Promise<void>;
  get(objectId: string): Promise<UniversalObject | null>;
  find(criteria: ObjectSearchCriteria): Promise<UniversalObject[]>;
  update(objectId: string, updates: Partial<UniversalObject>): Promise<void>;
  delete(objectId: string): Promise<void>;
}

// 对象搜索条件
export interface ObjectSearchCriteria {
  type?: ObjectType;
  tags?: string[];
  properties?: Record<string, any>;
  relationships?: {
    type: RelationshipType;
    targetId?: string;
  }[];
  lifecycle?: {
    state?: ObjectLifecycleState;
  };
  limit?: number;
  offset?: number;
}

// 事件系统
export interface ObjectEvent {
  id: string;
  type: string;
  objectId: string;
  timestamp: Date;
  data: Record<string, any>;
  source: string;
}

export interface ObjectEventHandler {
  eventType: string;
  handler: (event: ObjectEvent) => Promise<void>;
}

// 对象管理器接口
export interface ObjectManager {
  registry: ObjectRegistry;
  
  // 对象生命周期管理
  createObject(type: ObjectType, metadata: ObjectMetadata, properties?: Record<string, any>): Promise<UniversalObject>;
  cloneObject(objectId: string, newMetadata?: Partial<ObjectMetadata>): Promise<UniversalObject>;
  
  // 关系管理
  createRelationship(sourceId: string, targetId: string, type: RelationshipType, properties?: Record<string, any>): Promise<ObjectRelationship>;
  getRelatedObjects(objectId: string, relationshipType?: RelationshipType): Promise<UniversalObject[]>;
  
  // 事件管理
  addEventListener(handler: ObjectEventHandler): void;
  removeEventListener(eventType: string, handler: ObjectEventHandler): void;
  emitEvent(event: ObjectEvent): Promise<void>;
  
  // 查询和搜索
  query(criteria: ObjectSearchCriteria): Promise<UniversalObject[]>;
  search(query: string): Promise<UniversalObject[]>;
  
  // 批量操作
  batchCreate(objects: Array<{type: ObjectType, metadata: ObjectMetadata, properties?: Record<string, any>}>): Promise<UniversalObject[]>;
  batchUpdate(updates: Array<{id: string, updates: Partial<UniversalObject>}>): Promise<void>;
  batchDelete(objectIds: string[]): Promise<void>;
}