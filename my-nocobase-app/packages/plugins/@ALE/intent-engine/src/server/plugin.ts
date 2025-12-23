/**
 * ALE Intent Engine Plugin - 意图理解引擎插件
 * 
 * 构建态核心组件，提供：
 * - 意图解析服务
 * - 方案生成服务
 * - LLM 集成
 */

import { Plugin, InstallOptions } from '@nocobase/server';
import { IntentParser, ProposalGenerator, createOpenAIProvider, LLMProvider } from './services';
import type { IntentInput, ParsedIntent, ChangeProposal } from '@ALE/core';

/**
 * 意图引擎插件配置
 */
export interface IntentEnginePluginOptions {
  llm?: {
    provider: 'openai' | 'custom';
    apiKey?: string;
    baseURL?: string;
    model?: string;
  };
}

export class ALEIntentEnginePlugin extends Plugin {
  private intentParser!: IntentParser;
  private proposalGenerator!: ProposalGenerator;
  private llmProvider!: LLMProvider;

  async afterAdd() {
    this.app.logger.info('[@ALE/intent-engine] Plugin added');
  }

  async beforeLoad() {
    this.app.logger.info('[@ALE/intent-engine] Before load');
  }

  async load() {
    this.app.logger.info('[@ALE/intent-engine] Loading...');

    // 初始化 LLM Provider
    await this.initializeLLMProvider();

    // 初始化服务
    this.initializeServices();

    // 注册 API 路由
    this.registerResourceActions();

    // 注册 ACL
    this.app.acl.registerSnippet({
      name: 'pm.ale-intent-engine',
      actions: [
        'ale_intent:*',
      ],
    });

    this.app.logger.info('[@ALE/intent-engine] Loaded successfully');
  }

  async install(options?: InstallOptions) {
    this.app.logger.info('[@ALE/intent-engine] Installed');
  }

  /**
   * 初始化 LLM Provider
   */
  private async initializeLLMProvider() {
    const config = this.options as IntentEnginePluginOptions;
    const llmConfig = config?.llm;

    if (llmConfig?.provider === 'openai') {
      this.llmProvider = createOpenAIProvider({
        apiKey: llmConfig.apiKey || process.env.OPENAI_API_KEY || '',
        baseURL: llmConfig.baseURL || process.env.OPENAI_BASE_URL,
        defaultModel: llmConfig.model || 'gpt-4-turbo-preview',
      });
    } else {
      // 默认使用 Mock Provider 用于开发
      this.llmProvider = this.createMockProvider();
    }
  }

  /**
   * 创建 Mock Provider 用于开发测试
   */
  private createMockProvider(): LLMProvider {
    return {
      complete: async (prompt: string) => {
        return '这是一个模拟响应';
      },
      parseJSON: async <T>(prompt: string): Promise<T> => {
        // 返回模拟的意图解析结果
        const mockResult = {
          category: 'create',
          subjects: [
            {
              type: 'object',
              name: 'MockObject',
              inferred: false,
              properties: {},
            },
          ],
          actions: [
            {
              verb: 'create',
              target: 'MockObject',
              parameters: {},
            },
          ],
          constraints: [],
          confidence: 0.85,
          clarifications: [],
          summary: '创建一个模拟对象',
        };
        return mockResult as T;
      },
    };
  }

  /**
   * 初始化服务
   */
  private initializeServices() {
    // 初始化意图解析器
    this.intentParser = new IntentParser({
      provider: this.llmProvider,
      confidenceThreshold: 0.7,
      enableAutoCorrect: true,
    });

    // 初始化方案生成器
    this.proposalGenerator = new ProposalGenerator({
      provider: this.llmProvider,
      ontologyContext: async () => {
        // 从数据库获取当前本体上下文
        const objects = await this.db.getRepository('ale_ontology_objects').find({
          filter: { status: 'active' },
        });
        const relations = await this.db.getRepository('ale_ontology_relations').find();
        const flows = await this.db.getRepository('ale_flows').find({
          filter: { enabled: true },
        });
        const rules = await this.db.getRepository('ale_rules').find({
          filter: { enabled: true },
        });
        const actions = await this.db.getRepository('ale_actions').find({
          filter: { enabled: true },
        });

        return {
          objects: objects || [],
          relations: relations || [],
          flows: flows || [],
          views: [],
          rules: rules || [],
          actions: actions || [],
        };
      },
    });
  }

  /**
   * 注册 API 路由
   */
  private registerResourceActions() {
    this.app.resourcer.define({
      name: 'ale_intent',
      actions: {
        /**
         * 解析意图
         * POST /api/ale_intent:parse
         */
        parse: async (ctx, next) => {
          const { input } = ctx.action.params.values as { input: IntentInput };
          
          if (!input?.content) {
            ctx.throw(400, 'Input content is required');
          }

          const result = await this.intentParser.parse(input);
          
          if (result.success && result.intent) {
            // 保存意图记录
            await this.db.getRepository('ale_intents').create({
              values: {
                sessionId: input.context?.spaceId || 'default',
                input,
                parsedIntent: result.intent,
                confidence: result.intent.confidence,
                status: result.needsClarification ? 'clarification_needed' : 'processed',
                spaceId: input.context?.spaceId,
                createdById: ctx.state.currentUser?.id,
              },
            });
          }

          ctx.body = result;
          await next();
        },

        /**
         * 澄清意图
         * POST /api/ale_intent:clarify
         */
        clarify: async (ctx, next) => {
          const { intentId, clarification } = ctx.action.params.values as {
            intentId: string;
            clarification: Record<string, string>;
          };

          // 获取原始意图
          const intentRecord = await this.db.getRepository('ale_intents').findOne({
            filter: { id: intentId },
          });

          if (!intentRecord) {
            ctx.throw(404, 'Intent not found');
          }

          const result = await this.intentParser.clarify(
            intentRecord.parsedIntent as ParsedIntent,
            clarification,
          );

          if (result.success) {
            // 更新意图记录
            await this.db.getRepository('ale_intents').update({
              filter: { id: intentId },
              values: {
                parsedIntent: result.intent,
                confidence: result.intent?.confidence,
                status: 'processed',
              },
            });
          }

          ctx.body = result;
          await next();
        },

        /**
         * 生成方案
         * POST /api/ale_intent:generateProposal
         */
        generateProposal: async (ctx, next) => {
          const { intentId } = ctx.action.params.values as { intentId: string };

          // 获取意图
          const intentRecord = await this.db.getRepository('ale_intents').findOne({
            filter: { id: intentId },
          });

          if (!intentRecord) {
            ctx.throw(404, 'Intent not found');
          }

          const result = await this.proposalGenerator.generate(
            intentRecord.parsedIntent as ParsedIntent,
          );

          if (result.success && result.proposal) {
            // 保存方案
            await this.db.getRepository('ale_proposals').create({
              values: result.proposal,
            });
          }

          ctx.body = result;
          await next();
        },

        /**
         * 迭代方案
         * POST /api/ale_intent:iterateProposal
         */
        iterateProposal: async (ctx, next) => {
          const { proposalId, feedback } = ctx.action.params.values as {
            proposalId: string;
            feedback: string;
          };

          // 获取方案
          const proposalRecord = await this.db.getRepository('ale_proposals').findOne({
            filter: { id: proposalId },
          });

          if (!proposalRecord) {
            ctx.throw(404, 'Proposal not found');
          }

          const result = await this.proposalGenerator.iterate(
            proposalRecord as unknown as ChangeProposal,
            feedback,
          );

          if (result.success && result.proposal) {
            // 更新方案
            await this.db.getRepository('ale_proposals').update({
              filter: { id: proposalId },
              values: {
                version: result.proposal.version,
                components: result.proposal.components,
                previews: result.proposal.previews,
                impact: result.proposal.impact,
                gatePreCheck: result.proposal.gatePreCheck,
                updatedAt: new Date(),
              },
            });
          }

          ctx.body = result;
          await next();
        },

        /**
         * 确认方案
         * POST /api/ale_intent:confirmProposal
         */
        confirmProposal: async (ctx, next) => {
          const { proposalId } = ctx.action.params.values as { proposalId: string };

          // 更新方案状态
          await this.db.getRepository('ale_proposals').update({
            filter: { id: proposalId },
            values: {
              status: 'confirmed',
              updatedAt: new Date(),
            },
          });

          // 获取更新后的方案
          const proposal = await this.db.getRepository('ale_proposals').findOne({
            filter: { id: proposalId },
          });

          ctx.body = {
            success: true,
            proposal,
            message: '方案已确认，可以生成 ChangeSet',
          };
          await next();
        },
      },
    });
  }

  /**
   * 获取意图解析器实例
   */
  getIntentParser(): IntentParser {
    return this.intentParser;
  }

  /**
   * 获取方案生成器实例
   */
  getProposalGenerator(): ProposalGenerator {
    return this.proposalGenerator;
  }
}

export default ALEIntentEnginePlugin;
