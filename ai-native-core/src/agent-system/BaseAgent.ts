/**
 * AI原生应用平台 - Agent执行框架基础实现
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ObjectAgent,
  AIModel,
  AgentCapability,
  AgentMemory,
  AgentTool,
  Instruction,
  ExecutionResult,
  ExecutionContext,
  MemoryEpisode
} from '../object-system/types';

/**
 * 基础Agent实现
 */
export class BaseObjectAgent implements ObjectAgent {
  public id: string;
  public objectId: string;
  public model: AIModel;
  public capabilities: AgentCapability[];
  public memory: AgentMemory;
  public tools: AgentTool[];
  public isActive: boolean;

  constructor(
    objectId: string,
    model: AIModel,
    capabilities: AgentCapability[] = [],
    tools: AgentTool[] = []
  ) {
    this.id = uuidv4();
    this.objectId = objectId;
    this.model = model;
    this.capabilities = capabilities;
    this.tools = tools;
    this.isActive = true;
    this.memory = {
      shortTerm: {},
      longTerm: {},
      episodic: [],
      semantic: {}
    };
  }

  /**
   * 执行指令
   */
  async execute(instruction: Instruction): Promise<ExecutionResult> {
    const startTime = new Date();
    const resultId = uuidv4();

    try {
      if (!this.isActive) {
        throw new Error('Agent is not active');
      }

      // 分析指令类型并选择执行策略
      const executionStrategy = this.selectExecutionStrategy(instruction);
      
      // 准备执行上下文
      const enhancedContext = await this.prepareExecutionContext(instruction.context);
      
      // 执行指令
      const result = await executionStrategy.execute(instruction, enhancedContext);
      
      // 更新记忆
      this.updateMemory(instruction, result);
      
      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();

      return {
        id: resultId,
        instructionId: instruction.id,
        success: true,
        result,
        executionTime,
        metadata: {
          startTime,
          endTime,
          resourceUsage: {
            memoryUsed: this.getMemoryUsage(),
            capabilitiesUsed: executionStrategy.getUsedCapabilities()
          }
        }
      };
    } catch (error) {
      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();

      // 记录错误到记忆中
      this.recordError(instruction, error);

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
   * 添加能力
   */
  addCapability(capability: AgentCapability): void {
    // 检查依赖
    for (const dep of capability.dependencies) {
      if (!this.hasCapability(dep)) {
        throw new Error(`Missing dependency: ${dep}`);
      }
    }

    this.capabilities.push(capability);
  }

  /**
   * 移除能力
   */
  removeCapability(capabilityId: string): void {
    // 检查是否有其他能力依赖此能力
    const dependents = this.capabilities.filter(cap => 
      cap.dependencies.includes(capabilityId)
    );

    if (dependents.length > 0) {
      throw new Error(`Cannot remove capability ${capabilityId}: has dependents`);
    }

    this.capabilities = this.capabilities.filter(cap => cap.id !== capabilityId);
  }

  /**
   * 检查是否具有某个能力
   */
  hasCapability(capabilityName: string): boolean {
    return this.capabilities.some(cap => cap.name === capabilityName);
  }

  /**
   * 添加工具
   */
  addTool(tool: AgentTool): void {
    this.tools.push(tool);
  }

  /**
   * 移除工具
   */
  removeTool(toolId: string): void {
    this.tools = this.tools.filter(tool => tool.id !== toolId);
  }

  /**
   * 激活Agent
   */
  activate(): void {
    this.isActive = true;
  }

  /**
   * 停用Agent
   */
  deactivate(): void {
    this.isActive = false;
  }

  /**
   * 选择执行策略
   */
  private selectExecutionStrategy(instruction: Instruction): ExecutionStrategy {
    switch (instruction.type) {
      case 'query':
        return new QueryExecutionStrategy(this);
      case 'command':
        return new CommandExecutionStrategy(this);
      case 'task':
        return new TaskExecutionStrategy(this);
      default:
        return new DefaultExecutionStrategy(this);
    }
  }

  /**
   * 准备执行上下文
   */
  private async prepareExecutionContext(context: ExecutionContext): Promise<EnhancedExecutionContext> {
    // 从记忆中获取相关信息
    const relevantMemories = this.getRelevantMemories(context);
    
    // 获取对象相关信息
    const objectContext = await this.getObjectContext();

    return {
      ...context,
      memories: relevantMemories,
      objectContext,
      availableCapabilities: this.capabilities,
      availableTools: this.tools
    };
  }

  /**
   * 更新记忆
   */
  private updateMemory(instruction: Instruction, result: any): void {
    // 更新短期记忆
    this.memory.shortTerm[`last_instruction_${instruction.type}`] = {
      instruction: instruction.content,
      result,
      timestamp: new Date()
    };

    // 添加情节记忆
    const episode: MemoryEpisode = {
      id: uuidv4(),
      timestamp: new Date(),
      event: `instruction_${instruction.type}`,
      context: {
        instruction: instruction.content,
        parameters: instruction.parameters,
        priority: instruction.priority
      },
      outcome: result
    };

    this.memory.episodic.push(episode);

    // 更新语义记忆（提取关键概念）
    this.updateSemanticMemory(instruction, result);

    // 清理过期的短期记忆
    this.cleanupShortTermMemory();
  }

  /**
   * 记录错误
   */
  private recordError(instruction: Instruction, error: any): void {
    const episode: MemoryEpisode = {
      id: uuidv4(),
      timestamp: new Date(),
      event: 'execution_error',
      context: {
        instruction: instruction.content,
        type: instruction.type
      },
      outcome: {
        error: error instanceof Error ? error.message : String(error)
      }
    };

    this.memory.episodic.push(episode);
  }

  /**
   * 获取相关记忆
   */
  private getRelevantMemories(context: ExecutionContext): MemoryEpisode[] {
    // 简单的相关性匹配，实际实现可以使用向量相似度
    return this.memory.episodic
      .filter(episode => {
        // 基于时间的相关性
        const timeDiff = Date.now() - episode.timestamp.getTime();
        const isRecent = timeDiff < 24 * 60 * 60 * 1000; // 24小时内

        // 基于用户的相关性
        const isSameUser = context.userId === episode.context.userId;

        return isRecent || isSameUser;
      })
      .slice(-10); // 最多返回10条相关记忆
  }

  /**
   * 获取对象上下文
   */
  private async getObjectContext(): Promise<any> {
    // TODO: 从对象管理器获取对象信息
    return {
      objectId: this.objectId,
      relationships: [],
      properties: {}
    };
  }

  /**
   * 更新语义记忆
   */
  private updateSemanticMemory(instruction: Instruction, result: any): void {
    // 提取关键词和概念
    const keywords = this.extractKeywords(instruction.content);
    
    for (const keyword of keywords) {
      if (!this.memory.semantic[keyword]) {
        this.memory.semantic[keyword] = {
          count: 0,
          lastUsed: new Date(),
          contexts: []
        };
      }

      this.memory.semantic[keyword].count++;
      this.memory.semantic[keyword].lastUsed = new Date();
      this.memory.semantic[keyword].contexts.push({
        instruction: instruction.content,
        result,
        timestamp: new Date()
      });

      // 限制上下文数量
      if (this.memory.semantic[keyword].contexts.length > 5) {
        this.memory.semantic[keyword].contexts = 
          this.memory.semantic[keyword].contexts.slice(-5);
      }
    }
  }

  /**
   * 提取关键词
   */
  private extractKeywords(text: string): string[] {
    // 简单的关键词提取，实际实现可以使用NLP库
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word));
  }

  /**
   * 清理短期记忆
   */
  private cleanupShortTermMemory(): void {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1小时

    for (const key in this.memory.shortTerm) {
      const item = this.memory.shortTerm[key];
      if (item.timestamp && now - item.timestamp.getTime() > maxAge) {
        delete this.memory.shortTerm[key];
      }
    }
  }

  /**
   * 获取内存使用情况
   */
  private getMemoryUsage(): any {
    return {
      shortTermSize: Object.keys(this.memory.shortTerm).length,
      episodicSize: this.memory.episodic.length,
      semanticSize: Object.keys(this.memory.semantic).length
    };
  }
}

/**
 * 增强的执行上下文
 */
interface EnhancedExecutionContext extends ExecutionContext {
  memories: MemoryEpisode[];
  objectContext: any;
  availableCapabilities: AgentCapability[];
  availableTools: AgentTool[];
}

/**
 * 执行策略接口
 */
interface ExecutionStrategy {
  execute(instruction: Instruction, context: EnhancedExecutionContext): Promise<any>;
  getUsedCapabilities(): string[];
}

/**
 * 查询执行策略
 */
class QueryExecutionStrategy implements ExecutionStrategy {
  private agent: BaseObjectAgent;
  private usedCapabilities: string[] = [];

  constructor(agent: BaseObjectAgent) {
    this.agent = agent;
  }

  async execute(instruction: Instruction, context: EnhancedExecutionContext): Promise<any> {
    // 查找查询相关的能力
    const queryCapabilities = this.agent.capabilities.filter(cap => 
      cap.category === 'query' || cap.name.includes('query')
    );

    if (queryCapabilities.length === 0) {
      throw new Error('No query capabilities available');
    }

    // 选择最合适的能力
    const capability = this.selectBestCapability(queryCapabilities, instruction);
    this.usedCapabilities.push(capability.name);

    // 执行查询
    return await capability.executor(instruction.parameters, context);
  }

  getUsedCapabilities(): string[] {
    return this.usedCapabilities;
  }

  private selectBestCapability(capabilities: AgentCapability[], instruction: Instruction): AgentCapability {
    // 简单选择第一个，实际实现可以基于指令内容和能力描述的相似度
    return capabilities[0];
  }
}

/**
 * 命令执行策略
 */
class CommandExecutionStrategy implements ExecutionStrategy {
  private agent: BaseObjectAgent;
  private usedCapabilities: string[] = [];

  constructor(agent: BaseObjectAgent) {
    this.agent = agent;
  }

  async execute(instruction: Instruction, context: EnhancedExecutionContext): Promise<any> {
    // 查找命令相关的能力
    const commandCapabilities = this.agent.capabilities.filter(cap => 
      cap.category === 'command' || cap.name.includes('command')
    );

    if (commandCapabilities.length === 0) {
      throw new Error('No command capabilities available');
    }

    const capability = commandCapabilities[0];
    this.usedCapabilities.push(capability.name);

    return await capability.executor(instruction.parameters, context);
  }

  getUsedCapabilities(): string[] {
    return this.usedCapabilities;
  }
}

/**
 * 任务执行策略
 */
class TaskExecutionStrategy implements ExecutionStrategy {
  private agent: BaseObjectAgent;
  private usedCapabilities: string[] = [];

  constructor(agent: BaseObjectAgent) {
    this.agent = agent;
  }

  async execute(instruction: Instruction, context: EnhancedExecutionContext): Promise<any> {
    // 任务可能需要多个能力协作
    const taskCapabilities = this.agent.capabilities.filter(cap => 
      cap.category === 'task' || cap.name.includes('task')
    );

    if (taskCapabilities.length === 0) {
      // 尝试分解任务为多个子任务
      return await this.decomposeAndExecute(instruction, context);
    }

    const capability = taskCapabilities[0];
    this.usedCapabilities.push(capability.name);

    return await capability.executor(instruction.parameters, context);
  }

  getUsedCapabilities(): string[] {
    return this.usedCapabilities;
  }

  private async decomposeAndExecute(instruction: Instruction, context: EnhancedExecutionContext): Promise<any> {
    // TODO: 实现任务分解逻辑
    throw new Error('Task decomposition not implemented');
  }
}

/**
 * 默认执行策略
 */
class DefaultExecutionStrategy implements ExecutionStrategy {
  private agent: BaseObjectAgent;
  private usedCapabilities: string[] = [];

  constructor(agent: BaseObjectAgent) {
    this.agent = agent;
  }

  async execute(instruction: Instruction, context: EnhancedExecutionContext): Promise<any> {
    // 尝试使用任何可用的能力
    if (this.agent.capabilities.length === 0) {
      throw new Error('No capabilities available');
    }

    const capability = this.agent.capabilities[0];
    this.usedCapabilities.push(capability.name);

    return await capability.executor(instruction.parameters, context);
  }

  getUsedCapabilities(): string[] {
    return this.usedCapabilities;
  }
}