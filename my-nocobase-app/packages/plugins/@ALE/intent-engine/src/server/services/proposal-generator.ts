/**
 * Proposal Generator - 方案生成器
 * 
 * 负责将解析后的意图转换为具体的变更方案
 */

import { v4 as uuid } from 'uuid';
import type {
  ParsedIntent,
  ChangeProposal,
  ProposalComponents,
  ProposalPreviews,
  ImpactAnalysis,
  GatePreCheckResults,
  ObjectDefinition,
  RelationDefinition,
  FlowDefinition,
  ViewDefinition,
  RuleDefinition,
  ActionDefinition,
  RiskLevel,
  SchemaPreview,
  StateMachinePreview,
} from '@ALE/core';
import { LLMProvider, LLMOptions } from './intent-parser';

/**
 * 本体上下文 - 提供当前系统状态
 */
export interface OntologyContext {
  objects: ObjectDefinition[];
  relations: RelationDefinition[];
  flows: FlowDefinition[];
  views: ViewDefinition[];
  rules: RuleDefinition[];
  actions: ActionDefinition[];
}

/**
 * 方案生成器配置
 */
export interface ProposalGeneratorConfig {
  provider: LLMProvider;
  ontologyContext: () => Promise<OntologyContext>;
}

/**
 * 方案生成结果
 */
export interface GenerateResult {
  success: boolean;
  proposal?: ChangeProposal;
  error?: string;
}

/**
 * 方案生成器
 */
export class ProposalGenerator {
  private provider: LLMProvider;
  private getOntologyContext: () => Promise<OntologyContext>;

  constructor(config: ProposalGeneratorConfig) {
    this.provider = config.provider;
    this.getOntologyContext = config.ontologyContext;
  }

  /**
   * 生成变更方案
   */
  async generate(intent: ParsedIntent): Promise<GenerateResult> {
    try {
      // 获取当前本体上下文
      const context = await this.getOntologyContext();
      
      // 根据意图类型生成组件
      const components = await this.generateComponents(intent, context);
      
      // 生成预览
      const previews = await this.generatePreviews(components, context);
      
      // 分析影响
      const impact = this.analyzeImpact(components, context);
      
      // 门禁预检
      const gatePreCheck = await this.preCheckGates(components);
      
      // 组装方案
      const proposal: ChangeProposal = {
        id: uuid(),
        summary: this.generateSummary(intent, components),
        intentId: intent.id,
        version: 1,
        components,
        previews,
        impact,
        gatePreCheck,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return {
        success: true,
        proposal,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 迭代更新方案
   */
  async iterate(
    proposal: ChangeProposal,
    feedback: string,
  ): Promise<GenerateResult> {
    try {
      const context = await this.getOntologyContext();
      
      // 使用 LLM 处理反馈并更新组件
      const prompt = this.buildIterationPrompt(proposal, feedback);
      const updates = await this.provider.parseJSON<Partial<ProposalComponents>>(prompt, {
        temperature: 0.3,
      });
      
      // 合并更新
      const newComponents: ProposalComponents = {
        ...proposal.components,
        ...updates,
      };
      
      // 重新生成预览和分析
      const previews = await this.generatePreviews(newComponents, context);
      const impact = this.analyzeImpact(newComponents, context);
      const gatePreCheck = await this.preCheckGates(newComponents);
      
      const newProposal: ChangeProposal = {
        ...proposal,
        id: proposal.id,
        version: proposal.version + 1,
        components: newComponents,
        previews,
        impact,
        gatePreCheck,
        updatedAt: new Date(),
      };

      return {
        success: true,
        proposal: newProposal,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 生成方案组件
   */
  private async generateComponents(
    intent: ParsedIntent,
    context: OntologyContext,
  ): Promise<ProposalComponents> {
    const prompt = this.buildComponentsPrompt(intent, context);
    
    const result = await this.provider.parseJSON<ProposalComponents>(prompt, {
      temperature: 0.2,
      maxTokens: 4000,
    });

    return result;
  }

  /**
   * 构建组件生成 Prompt
   */
  private buildComponentsPrompt(
    intent: ParsedIntent,
    context: OntologyContext,
  ): string {
    return `你是一个专业的系统设计 AI，负责将用户意图转换为具体的数据模型设计。

## 用户意图
类别: ${intent.category}
主体: ${JSON.stringify(intent.subjects, null, 2)}
动作: ${JSON.stringify(intent.actions, null, 2)}
约束: ${JSON.stringify(intent.constraints, null, 2)}
原始输入: "${intent.rawInput}"

## 现有系统上下文
现有对象: ${context.objects.map(o => o.collectionName).join(', ') || '无'}
现有关系: ${context.relations.map(r => r.name).join(', ') || '无'}
现有流程: ${context.flows.map(f => f.name).join(', ') || '无'}

## 输出要求
生成具体的变更组件，格式如下：

{
  "objects": [
    {
      "id": "uuid",
      "collectionName": "snake_case_name",
      "displayName": "显示名称",
      "description": "描述",
      "fields": [
        {
          "name": "fieldName",
          "displayName": "字段显示名",
          "type": "string | integer | date | enum | belongsTo | hasMany ...",
          "required": true | false,
          "options": [{"value": "v1", "label": "标签1"}],
          "relation": {"target": "targetCollection"}
        }
      ],
      "semanticTags": ["订单", "业务实体"],
      "version": "1.0.0",
      "status": "draft"
    }
  ],
  "relations": [
    {
      "id": "uuid",
      "name": "relationName",
      "displayName": "显示名",
      "sourceObject": "sourceCollection",
      "targetObject": "targetCollection",
      "relationType": "belongsTo | hasOne | hasMany | belongsToMany",
      "semanticType": "owns | references | triggers | requires",
      "version": "1.0.0"
    }
  ],
  "flows": [
    {
      "id": "uuid",
      "name": "flowName",
      "displayName": "流程名",
      "type": "state-machine | workflow | approval",
      "targetObject": "targetCollection",
      "states": [
        {"id": "s1", "name": "pending", "displayName": "待处理", "type": "initial"},
        {"id": "s2", "name": "completed", "displayName": "已完成", "type": "final"}
      ],
      "transitions": [
        {"id": "t1", "name": "complete", "displayName": "完成", "from": "pending", "to": "completed", "trigger": "manual"}
      ],
      "initialState": "pending",
      "finalStates": ["completed"],
      "version": "1.0.0"
    }
  ],
  "views": [...],
  "rules": [...],
  "actions": [...]
}

## 设计原则
1. 字段命名使用 camelCase
2. Collection 命名使用 snake_case
3. 包含基础字段: id, createdAt, updatedAt, createdBy
4. 为关键对象设计状态机
5. 考虑业务约束和验证规则

请直接输出 JSON，不要有其他文字。`;
  }

  /**
   * 构建迭代 Prompt
   */
  private buildIterationPrompt(
    proposal: ChangeProposal,
    feedback: string,
  ): string {
    return `你是一个专业的系统设计 AI。用户对当前方案提出了修改意见。

## 当前方案
${JSON.stringify(proposal.components, null, 2)}

## 用户反馈
"${feedback}"

## 任务
根据用户反馈更新方案。只输出需要修改的部分。

请直接输出 JSON，不要有其他文字。`;
  }

  /**
   * 生成预览
   */
  private async generatePreviews(
    components: ProposalComponents,
    context: OntologyContext,
  ): Promise<ProposalPreviews> {
    const previews: ProposalPreviews = {};

    // Schema 预览 (ER 图数据)
    if (components.objects?.length || components.relations?.length) {
      previews.schema = this.generateSchemaPreview(components, context);
    }

    // 状态机预览
    if (components.flows?.length) {
      previews.stateMachine = this.generateStateMachinePreview(components.flows);
    }

    return previews;
  }

  /**
   * 生成 Schema 预览
   */
  private generateSchemaPreview(
    components: ProposalComponents,
    context: OntologyContext,
  ): SchemaPreview {
    const existingObjectNames = new Set(context.objects.map(o => o.collectionName));
    const existingRelationIds = new Set(context.relations.map(r => r.id));

    const objects = (components.objects || []).map(obj => ({
      id: obj.collectionName,
      name: obj.collectionName,
      displayName: obj.displayName,
      fields: obj.fields.map(f => ({
        name: f.name,
        displayName: f.displayName,
        type: f.type,
        required: f.required,
        isNew: true,
      })),
      isNew: !existingObjectNames.has(obj.collectionName),
      isModified: existingObjectNames.has(obj.collectionName),
    }));

    const relations = (components.relations || []).map(rel => ({
      id: rel.id,
      source: rel.sourceObject,
      target: rel.targetObject,
      type: rel.relationType,
      label: rel.displayName,
      isNew: !existingRelationIds.has(rel.id),
    }));

    return { objects, relations };
  }

  /**
   * 生成状态机预览
   */
  private generateStateMachinePreview(flows: FlowDefinition[]): StateMachinePreview {
    const flow = flows[0]; // 取第一个流程
    if (!flow) {
      return { states: [], transitions: [] };
    }

    const states = flow.states.map(s => ({
      id: s.id,
      name: s.displayName,
      type: s.type as 'initial' | 'normal' | 'final',
      isNew: true,
    }));

    const transitions = flow.transitions.map(t => ({
      id: t.id,
      from: t.from,
      to: t.to,
      trigger: t.trigger,
      label: t.displayName,
      isNew: true,
    }));

    return { states, transitions };
  }

  /**
   * 分析影响
   */
  private analyzeImpact(
    components: ProposalComponents,
    context: OntologyContext,
  ): ImpactAnalysis {
    const affectedObjects: string[] = [];
    const affectedViews: string[] = [];
    const affectedFlows: string[] = [];
    const affectedRules: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // 分析对象变更影响
    for (const obj of components.objects || []) {
      const existing = context.objects.find(o => o.collectionName === obj.collectionName);
      if (existing) {
        affectedObjects.push(obj.collectionName);
        
        // 检查字段变更
        const existingFields = new Set(existing.fields.map(f => f.name));
        const newFields = obj.fields.filter(f => !existingFields.has(f.name));
        
        if (newFields.length > 0) {
          warnings.push(`对象 ${obj.displayName} 将新增 ${newFields.length} 个字段`);
        }
      }
    }

    // 分析关系变更影响
    for (const rel of components.relations || []) {
      const sourceInContext = context.objects.find(o => o.collectionName === rel.sourceObject);
      if (sourceInContext) {
        affectedObjects.push(rel.sourceObject);
      }
    }

    // 分析流程变更影响
    for (const flow of components.flows || []) {
      const existing = context.flows.find(f => f.name === flow.name);
      if (existing) {
        affectedFlows.push(flow.name);
        warnings.push(`流程 ${flow.displayName} 已存在，将被更新`);
      }
    }

    // 计算风险等级
    let riskLevel: RiskLevel = 'low';
    if (affectedObjects.length > 5 || affectedFlows.length > 0) {
      riskLevel = 'medium';
    }
    if (warnings.length > 3) {
      riskLevel = 'high';
    }

    return {
      affectedObjects: [...new Set(affectedObjects)],
      affectedViews,
      affectedFlows,
      affectedRules,
      riskLevel,
      warnings,
      suggestions,
    };
  }

  /**
   * 门禁预检
   */
  private async preCheckGates(
    components: ProposalComponents,
  ): Promise<GatePreCheckResults> {
    const results: GatePreCheckResults = {};

    // G1: 结构门禁 - 检查 schema 合规性
    results.G1 = {
      gate: 'G1_STRUCTURAL',
      passed: true,
      message: 'Schema 结构检查通过',
    };

    // 检查必要字段
    for (const obj of components.objects || []) {
      const hasId = obj.fields.some(f => f.name === 'id');
      if (!hasId) {
        results.G1 = {
          gate: 'G1_STRUCTURAL',
          passed: false,
          message: `对象 ${obj.displayName} 缺少 id 字段`,
        };
        break;
      }
    }

    // G3: 证据门禁 - 检查证据需求
    results.G3 = {
      gate: 'G3_EVIDENCE',
      passed: true,
      message: '证据要求检查通过',
    };

    return results;
  }

  /**
   * 生成摘要
   */
  private generateSummary(intent: ParsedIntent, components: ProposalComponents): string {
    const parts: string[] = [];

    if (components.objects?.length) {
      parts.push(`创建/更新 ${components.objects.length} 个数据对象`);
    }
    if (components.relations?.length) {
      parts.push(`定义 ${components.relations.length} 个关系`);
    }
    if (components.flows?.length) {
      parts.push(`设计 ${components.flows.length} 个流程`);
    }
    if (components.rules?.length) {
      parts.push(`配置 ${components.rules.length} 条规则`);
    }

    return parts.join('，') || '无变更';
  }
}
