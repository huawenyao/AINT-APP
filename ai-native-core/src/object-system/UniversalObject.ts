/**
 * AI原生应用平台 - 统一对象基础实现
 */

import { v4 as uuidv4 } from 'uuid';
import {
  UniversalObject,
  ObjectType,
  ObjectMetadata,
  ObjectLifecycle,
  ObjectLifecycleState,
  ObjectLifecycleEvent,
  ObjectRelationship,
  AgentCapability,
  ObjectAgent,
  Instruction,
  ExecutionResult,
  ExecutionContext
} from './types';

export class BaseUniversalObject implements UniversalObject {
  public id: string;
  public type: ObjectType;
  public metadata: ObjectMetadata;
  public properties: Record<string, any>;
  public capabilities: AgentCapability[];
  public relationships: ObjectRelationship[];
  public lifecycle: ObjectLifecycle;
  public agent: ObjectAgent;

  constructor(
    type: ObjectType,
    metadata: ObjectMetadata,
    properties: Record<string, any> = {},
    agent: ObjectAgent
  ) {
    this.id = uuidv4();
    this.type = type;
    this.metadata = {
      ...metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.properties = properties;
    this.capabilities = [];
    this.relationships = [];
    this.lifecycle = {
      state: ObjectLifecycleState.DRAFT,
      history: [],
      transitions: this.getDefaultTransitions()
    };
    this.agent = agent;
    this.agent.objectId = this.id;
  }

  /**
   * 执行指令
   */
  async execute(instruction: Instruction): Promise<ExecutionResult> {
    const startTime = new Date();
    const resultId = uuidv4();

    try {
      // 检查对象是否处于活跃状态
      if (this.lifecycle.state !== ObjectLifecycleState.ACTIVE) {
        throw new Error(`Object ${this.id} is not in active state`);
      }

      // 检查权限
      if (!this.hasPermission(instruction.context)) {
        throw new Error('Insufficient permissions');
      }

      // 委托给Agent执行
      const result = await this.agent.execute(instruction);

      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();

      // 记录执行历史
      this.recordExecution(instruction, result, executionTime);

      return {
        id: resultId,
        instructionId: instruction.id,
        success: true,
        result: result.result,
        executionTime,
        metadata: {
          startTime,
          endTime,
          resourceUsage: result.metadata?.resourceUsage
        }
      };
    } catch (error) {
      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();

      return {
        id: resultId,
        instructionId: instruction.id,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime,
        metadata: {
          startTime,
          endTime
        }
      };
    }
  }

  /**
   * 添加关系
   */
  addRelationship(relationship: ObjectRelationship): void {
    // 检查是否已存在相同关系
    const existing = this.relationships.find(r => 
      r.sourceObjectId === relationship.sourceObjectId &&
      r.targetObjectId === relationship.targetObjectId &&
      r.type === relationship.type
    );

    if (existing) {
      throw new Error('Relationship already exists');
    }

    this.relationships.push(relationship);
    this.updateMetadata();
  }

  /**
   * 移除关系
   */
  removeRelationship(relationshipId: string): void {
    const index = this.relationships.findIndex(r => r.id === relationshipId);
    if (index === -1) {
      throw new Error('Relationship not found');
    }

    this.relationships.splice(index, 1);
    this.updateMetadata();
  }

  /**
   * 更新属性
   */
  updateProperties(properties: Partial<Record<string, any>>): void {
    this.properties = {
      ...this.properties,
      ...properties
    };
    this.updateMetadata();
  }

  /**
   * 状态转换
   */
  transitionState(newState: ObjectLifecycleState, reason?: string): void {
    const currentState = this.lifecycle.state;
    
    // 检查转换是否允许
    const transition = this.lifecycle.transitions.find(t => 
      t.from === currentState && t.to === newState
    );

    if (!transition) {
      throw new Error(`Invalid state transition from ${currentState} to ${newState}`);
    }

    // 检查转换条件
    if (transition.condition && !transition.condition(this)) {
      throw new Error('State transition condition not met');
    }

    // 记录状态变更历史
    const event: ObjectLifecycleEvent = {
      id: uuidv4(),
      fromState: currentState,
      toState: newState,
      timestamp: new Date(),
      triggeredBy: 'system', // TODO: 从执行上下文获取
      reason
    };

    this.lifecycle.history.push(event);
    this.lifecycle.state = newState;

    // 执行转换动作
    if (transition.action) {
      transition.action(this).catch(error => {
        console.error('State transition action failed:', error);
      });
    }

    this.updateMetadata();
  }

  /**
   * 序列化为JSON
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      type: this.type,
      metadata: this.metadata,
      properties: this.properties,
      capabilities: this.capabilities,
      relationships: this.relationships,
      lifecycle: this.lifecycle,
      agent: {
        id: this.agent.id,
        objectId: this.agent.objectId,
        model: this.agent.model,
        isActive: this.agent.isActive
      }
    };
  }

  /**
   * 从JSON反序列化
   */
  fromJSON(data: Record<string, any>): void {
    this.id = data.id;
    this.type = data.type;
    this.metadata = data.metadata;
    this.properties = data.properties;
    this.capabilities = data.capabilities || [];
    this.relationships = data.relationships || [];
    this.lifecycle = data.lifecycle;
    // Agent需要特殊处理，因为包含函数
    // 这里只恢复基本属性，执行能力需要重新注册
  }

  /**
   * 检查权限
   */
  private hasPermission(context: ExecutionContext): boolean {
    // TODO: 实现权限检查逻辑
    return true;
  }

  /**
   * 记录执行历史
   */
  private recordExecution(
    instruction: Instruction,
    result: ExecutionResult,
    executionTime: number
  ): void {
    // 将执行记录存储到Agent内存中
    this.agent.memory.episodic.push({
      id: uuidv4(),
      timestamp: new Date(),
      event: 'instruction_executed',
      context: {
        instruction: instruction.content,
        type: instruction.type,
        priority: instruction.priority
      },
      outcome: {
        success: result.success,
        executionTime,
        result: result.result
      }
    });

    // 限制内存大小，保留最近的1000条记录
    if (this.agent.memory.episodic.length > 1000) {
      this.agent.memory.episodic = this.agent.memory.episodic.slice(-1000);
    }
  }

  /**
   * 更新元数据
   */
  private updateMetadata(): void {
    this.metadata.updatedAt = new Date();
    this.metadata.version = this.incrementVersion(this.metadata.version);
  }

  /**
   * 版本号递增
   */
  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0] || '1'}.${parts[1] || '0'}.${patch}`;
  }

  /**
   * 获取默认状态转换规则
   */
  private getDefaultTransitions() {
    return [
      {
        from: ObjectLifecycleState.DRAFT,
        to: ObjectLifecycleState.ACTIVE,
        condition: (obj: UniversalObject) => {
          // 检查对象是否具备激活条件
          return obj.agent.isActive && obj.agent.capabilities.length > 0;
        }
      },
      {
        from: ObjectLifecycleState.ACTIVE,
        to: ObjectLifecycleState.INACTIVE,
        condition: () => true
      },
      {
        from: ObjectLifecycleState.INACTIVE,
        to: ObjectLifecycleState.ACTIVE,
        condition: () => true
      },
      {
        from: ObjectLifecycleState.ACTIVE,
        to: ObjectLifecycleState.DEPRECATED,
        condition: () => true
      },
      {
        from: ObjectLifecycleState.INACTIVE,
        to: ObjectLifecycleState.DEPRECATED,
        condition: () => true
      },
      {
        from: ObjectLifecycleState.DEPRECATED,
        to: ObjectLifecycleState.DELETED,
        condition: () => true
      }
    ];
  }
}

/**
 * 对象工厂类
 */
export class ObjectFactory {
  /**
   * 创建数据对象
   */
  static createDataObject(
    metadata: ObjectMetadata,
    schema: any,
    agent: ObjectAgent
  ): UniversalObject {
    const properties = {
      schema,
      data: {},
      indexes: [],
      constraints: []
    };

    return new BaseUniversalObject(
      ObjectType.DATA,
      metadata,
      properties,
      agent
    );
  }

  /**
   * 创建UI对象
   */
  static createUIObject(
    metadata: ObjectMetadata,
    component: any,
    agent: ObjectAgent
  ): UniversalObject {
    const properties = {
      component,
      props: {},
      state: {},
      events: []
    };

    return new BaseUniversalObject(
      ObjectType.UI,
      metadata,
      properties,
      agent
    );
  }

  /**
   * 创建工作流对象
   */
  static createWorkflowObject(
    metadata: ObjectMetadata,
    definition: any,
    agent: ObjectAgent
  ): UniversalObject {
    const properties = {
      definition,
      state: 'idle',
      variables: {},
      history: []
    };

    return new BaseUniversalObject(
      ObjectType.WORKFLOW,
      metadata,
      properties,
      agent
    );
  }

  /**
   * 创建用户对象
   */
  static createUserObject(
    metadata: ObjectMetadata,
    profile: any,
    agent: ObjectAgent
  ): UniversalObject {
    const properties = {
      profile,
      preferences: {},
      permissions: [],
      sessions: []
    };

    return new BaseUniversalObject(
      ObjectType.USER,
      metadata,
      properties,
      agent
    );
  }

  /**
   * 创建知识对象
   */
  static createKnowledgeObject(
    metadata: ObjectMetadata,
    content: any,
    agent: ObjectAgent
  ): UniversalObject {
    const properties = {
      content,
      embeddings: [],
      references: [],
      tags: []
    };

    return new BaseUniversalObject(
      ObjectType.KNOWLEDGE,
      metadata,
      properties,
      agent
    );
  }
}