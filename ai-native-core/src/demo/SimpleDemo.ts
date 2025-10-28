/**
 * AI原生应用平台 - 简单演示
 * 展示如何使用统一对象系统和Agent框架
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ObjectType,
  ObjectMetadata,
  AIModel,
  AgentCapability,
  Instruction,
  ExecutionContext,
  ObjectLifecycleState
} from '../object-system/types';
import { BaseUniversalObject, ObjectFactory } from '../object-system/UniversalObject';
import { BaseObjectAgent } from '../agent-system/BaseAgent';

/**
 * 演示：创建一个智能客户管理对象
 */
export class CustomerManagementDemo {
  
  /**
   * 运行演示
   */
  static async run(): Promise<void> {
    console.log('🚀 AI原生应用平台演示开始');
    console.log('=====================================');

    try {
      // 1. 创建客户数据对象
      const customerObject = await this.createCustomerDataObject();
      console.log('✅ 创建客户数据对象成功');

      // 2. 激活对象
      customerObject.transitionState(ObjectLifecycleState.ACTIVE, '演示激活');
      console.log('✅ 对象激活成功');

      // 3. 执行查询指令
      await this.demonstrateQuery(customerObject);

      // 4. 执行命令指令
      await this.demonstrateCommand(customerObject);

      // 5. 执行任务指令
      await this.demonstrateTask(customerObject);

      console.log('=====================================');
      console.log('🎉 演示完成！');

    } catch (error) {
      console.error('❌ 演示过程中出现错误:', error);
    }
  }

  /**
   * 创建客户数据对象
   */
  private static async createCustomerDataObject(): Promise<BaseUniversalObject> {
    // 定义对象元数据
    const metadata: ObjectMetadata = {
      name: 'CustomerData',
      description: '智能客户数据管理对象',
      version: '1.0.0',
      tags: ['customer', 'data', 'crm'],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'demo-user',
      updatedBy: 'demo-user',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          company: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive', 'prospect'] }
        },
        required: ['id', 'name', 'email']
      }
    };

    // 创建AI模型配置
    const aiModel: AIModel = {
      provider: 'local',
      model: 'demo-model',
      temperature: 0.7,
      maxTokens: 1000,
      systemPrompt: '你是一个智能的客户数据管理助手，能够帮助用户查询、管理和分析客户数据。'
    };

    // 创建Agent能力
    const capabilities: AgentCapability[] = [
      {
        id: uuidv4(),
        name: 'query_customers',
        description: '查询客户数据',
        category: 'query',
        inputSchema: {
          type: 'object',
          properties: {
            filters: { type: 'object' },
            limit: { type: 'number' },
            offset: { type: 'number' }
          }
        },
        outputSchema: {
          type: 'object',
          properties: {
            customers: { type: 'array' },
            total: { type: 'number' }
          }
        },
        executor: async (input: any, context: ExecutionContext) => {
          // 模拟查询客户数据
          const mockCustomers = [
            { id: '1', name: '张三', email: 'zhangsan@example.com', company: 'ABC公司', status: 'active' },
            { id: '2', name: '李四', email: 'lisi@example.com', company: 'XYZ公司', status: 'prospect' },
            { id: '3', name: '王五', email: 'wangwu@example.com', company: 'DEF公司', status: 'active' }
          ];

          const filters = input.filters || {};
          const limit = input.limit || 10;
          const offset = input.offset || 0;

          let filteredCustomers = mockCustomers;
          
          // 应用过滤器
          if (filters.status) {
            filteredCustomers = filteredCustomers.filter(c => c.status === filters.status);
          }
          if (filters.company) {
            filteredCustomers = filteredCustomers.filter(c => 
              c.company.toLowerCase().includes(filters.company.toLowerCase())
            );
          }

          // 应用分页
          const paginatedCustomers = filteredCustomers.slice(offset, offset + limit);

          return {
            customers: paginatedCustomers,
            total: filteredCustomers.length
          };
        },
        dependencies: [],
        metadata: {
          version: '1.0.0',
          author: 'demo',
          createdAt: new Date()
        }
      },
      {
        id: uuidv4(),
        name: 'create_customer',
        description: '创建新客户',
        category: 'command',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            company: { type: 'string' }
          },
          required: ['name', 'email']
        },
        outputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        executor: async (input: any, context: ExecutionContext) => {
          // 模拟创建客户
          const customerId = uuidv4();
          
          console.log(`📝 创建新客户: ${input.name} (${input.email})`);
          
          return {
            id: customerId,
            success: true,
            message: `客户 ${input.name} 创建成功`
          };
        },
        dependencies: [],
        metadata: {
          version: '1.0.0',
          author: 'demo',
          createdAt: new Date()
        }
      },
      {
        id: uuidv4(),
        name: 'analyze_customers',
        description: '分析客户数据',
        category: 'task',
        inputSchema: {
          type: 'object',
          properties: {
            analysisType: { type: 'string', enum: ['status_distribution', 'company_analysis', 'growth_trend'] }
          }
        },
        outputSchema: {
          type: 'object',
          properties: {
            analysis: { type: 'object' },
            insights: { type: 'array' }
          }
        },
        executor: async (input: any, context: ExecutionContext) => {
          // 模拟数据分析
          const analysisType = input.analysisType || 'status_distribution';
          
          let analysis: any = {};
          let insights: string[] = [];

          switch (analysisType) {
            case 'status_distribution':
              analysis = {
                active: 2,
                prospect: 1,
                inactive: 0
              };
              insights = [
                '66.7%的客户处于活跃状态',
                '33.3%的客户是潜在客户',
                '建议加强对潜在客户的跟进'
              ];
              break;
            case 'company_analysis':
              analysis = {
                totalCompanies: 3,
                topCompanies: ['ABC公司', 'XYZ公司', 'DEF公司']
              };
              insights = [
                '客户分布在3家不同公司',
                '客户多样性良好',
                '可以考虑行业细分策略'
              ];
              break;
            default:
              analysis = { message: '分析类型不支持' };
          }

          console.log(`📊 执行${analysisType}分析完成`);

          return { analysis, insights };
        },
        dependencies: ['query_customers'],
        metadata: {
          version: '1.0.0',
          author: 'demo',
          createdAt: new Date()
        }
      }
    ];

    // 创建Agent
    const agent = new BaseObjectAgent('temp-id', aiModel, capabilities);

    // 创建对象
    const customerObject = ObjectFactory.createDataObject(
      metadata,
      metadata.schema,
      agent
    ) as BaseUniversalObject;

    // 更新Agent的objectId
    agent.objectId = customerObject.id;

    return customerObject;
  }

  /**
   * 演示查询功能
   */
  private static async demonstrateQuery(customerObject: BaseUniversalObject): Promise<void> {
    console.log('\n🔍 演示查询功能');
    console.log('-------------------');

    const queryInstruction: Instruction = {
      id: uuidv4(),
      type: 'query',
      content: '查询所有活跃客户',
      parameters: {
        filters: { status: 'active' },
        limit: 10
      },
      context: {
        objectId: customerObject.id,
        userId: 'demo-user',
        sessionId: uuidv4(),
        environment: 'development',
        permissions: ['read'],
        metadata: {}
      },
      priority: 'medium'
    };

    const result = await customerObject.execute(queryInstruction);
    
    if (result.success) {
      console.log('✅ 查询成功:', JSON.stringify(result.result, null, 2));
    } else {
      console.log('❌ 查询失败:', result.error);
    }
  }

  /**
   * 演示命令功能
   */
  private static async demonstrateCommand(customerObject: BaseUniversalObject): Promise<void> {
    console.log('\n⚡ 演示命令功能');
    console.log('-------------------');

    const commandInstruction: Instruction = {
      id: uuidv4(),
      type: 'command',
      content: '创建新客户',
      parameters: {
        name: '赵六',
        email: 'zhaoliu@example.com',
        phone: '13800138000',
        company: 'GHI公司'
      },
      context: {
        objectId: customerObject.id,
        userId: 'demo-user',
        sessionId: uuidv4(),
        environment: 'development',
        permissions: ['write'],
        metadata: {}
      },
      priority: 'high'
    };

    const result = await customerObject.execute(commandInstruction);
    
    if (result.success) {
      console.log('✅ 命令执行成功:', JSON.stringify(result.result, null, 2));
    } else {
      console.log('❌ 命令执行失败:', result.error);
    }
  }

  /**
   * 演示任务功能
   */
  private static async demonstrateTask(customerObject: BaseUniversalObject): Promise<void> {
    console.log('\n🎯 演示任务功能');
    console.log('-------------------');

    const taskInstruction: Instruction = {
      id: uuidv4(),
      type: 'task',
      content: '分析客户状态分布',
      parameters: {
        analysisType: 'status_distribution'
      },
      context: {
        objectId: customerObject.id,
        userId: 'demo-user',
        sessionId: uuidv4(),
        environment: 'development',
        permissions: ['read', 'analyze'],
        metadata: {}
      },
      priority: 'medium'
    };

    const result = await customerObject.execute(taskInstruction);
    
    if (result.success) {
      console.log('✅ 任务执行成功:', JSON.stringify(result.result, null, 2));
    } else {
      console.log('❌ 任务执行失败:', result.error);
    }
  }
}

/**
 * 演示自然语言交互（模拟）
 */
export class NaturalLanguageDemo {
  
  static async run(): Promise<void> {
    console.log('\n🗣️  自然语言交互演示');
    console.log('=====================================');

    const scenarios = [
      {
        input: '帮我查找ABC公司的所有客户',
        expectedAction: 'query',
        expectedParameters: { filters: { company: 'ABC公司' } }
      },
      {
        input: '创建一个新客户，姓名是小明，邮箱是xiaoming@test.com',
        expectedAction: 'command',
        expectedParameters: { name: '小明', email: 'xiaoming@test.com' }
      },
      {
        input: '分析一下客户的状态分布情况',
        expectedAction: 'task',
        expectedParameters: { analysisType: 'status_distribution' }
      }
    ];

    for (const scenario of scenarios) {
      console.log(`\n用户输入: "${scenario.input}"`);
      
      // 模拟NLU处理
      const intent = this.parseIntent(scenario.input);
      console.log(`🧠 意图识别: ${intent.action}`);
      console.log(`📋 参数提取: ${JSON.stringify(intent.parameters)}`);
      
      // 模拟指令生成
      const instruction = this.generateInstruction(intent);
      console.log(`🎯 生成指令: ${instruction.type} - ${instruction.content}`);
    }
  }

  /**
   * 模拟意图解析
   */
  private static parseIntent(input: string): { action: string, parameters: any } {
    // 简单的规则匹配，实际实现会使用NLP模型
    if (input.includes('查找') || input.includes('查询')) {
      const companyMatch = input.match(/(\w+公司)/);
      return {
        action: 'query',
        parameters: companyMatch ? { filters: { company: companyMatch[1] } } : {}
      };
    }
    
    if (input.includes('创建') || input.includes('新增')) {
      const nameMatch = input.match(/姓名是(\w+)/);
      const emailMatch = input.match(/邮箱是([\w@.]+)/);
      return {
        action: 'command',
        parameters: {
          name: nameMatch ? nameMatch[1] : '',
          email: emailMatch ? emailMatch[1] : ''
        }
      };
    }
    
    if (input.includes('分析')) {
      return {
        action: 'task',
        parameters: { analysisType: 'status_distribution' }
      };
    }
    
    return { action: 'unknown', parameters: {} };
  }

  /**
   * 生成指令
   */
  private static generateInstruction(intent: { action: string, parameters: any }): Instruction {
    return {
      id: uuidv4(),
      type: intent.action as any,
      content: `执行${intent.action}操作`,
      parameters: intent.parameters,
      context: {
        objectId: 'demo-object',
        userId: 'demo-user',
        sessionId: uuidv4(),
        environment: 'development',
        permissions: ['read', 'write'],
        metadata: {}
      },
      priority: 'medium'
    };
  }
}

// 如果直接运行此文件，执行演示
if (require.main === module) {
  (async () => {
    await CustomerManagementDemo.run();
    await NaturalLanguageDemo.run();
  })();
}