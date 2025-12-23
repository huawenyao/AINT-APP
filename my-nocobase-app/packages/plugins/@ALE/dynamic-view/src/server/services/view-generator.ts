/**
 * View Generator - 视图生成器
 * 
 * 构建态核心组件，负责：
 * - 从方案生成预览视图
 * - Schema 图生成
 * - 状态机图生成
 * - UI 预览生成
 */

import type {
  ChangeProposal,
  ProposalPreviews,
  SchemaPreview,
  StateMachinePreview,
  UIPreview,
  DataFlowPreview,
  ObjectDefinition,
  FlowDefinition,
  ViewDefinition,
} from '@ALE/core';

/**
 * 视图生成配置
 */
export interface ViewGeneratorConfig {
  /** 是否启用实时更新 */
  enableRealtime?: boolean;
  /** 是否生成模拟数据 */
  generateMockData?: boolean;
}

/**
 * Schema 图节点
 */
export interface SchemaGraphNode {
  id: string;
  type: 'object';
  data: {
    name: string;
    displayName: string;
    fields: Array<{
      name: string;
      type: string;
      required: boolean;
    }>;
    isNew?: boolean;
    isModified?: boolean;
  };
  position: { x: number; y: number };
}

/**
 * Schema 图边
 */
export interface SchemaGraphEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type: string;
  label: string;
  data?: {
    relationType: string;
    isNew?: boolean;
  };
}

/**
 * 状态机图节点
 */
export interface StateMachineNode {
  id: string;
  type: 'state';
  data: {
    name: string;
    stateType: 'initial' | 'normal' | 'final';
    isNew?: boolean;
  };
  position: { x: number; y: number };
}

/**
 * 状态机图边
 */
export interface StateMachineEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  label: string;
  data?: {
    trigger: string;
    conditions?: string[];
    isNew?: boolean;
  };
}

/**
 * 视图生成器
 */
export class ViewGenerator {
  private config: ViewGeneratorConfig;

  constructor(config: ViewGeneratorConfig = {}) {
    this.config = {
      enableRealtime: config.enableRealtime ?? true,
      generateMockData: config.generateMockData ?? true,
    };
  }

  /**
   * 生成所有预览
   */
  generatePreviews(proposal: ChangeProposal): ProposalPreviews {
    const previews: ProposalPreviews = {};

    // 生成 Schema 预览
    if (proposal.components.objects?.length || proposal.components.relations?.length) {
      previews.schema = this.generateSchemaPreview(proposal);
    }

    // 生成状态机预览
    if (proposal.components.flows?.length) {
      previews.stateMachine = this.generateStateMachinePreview(proposal);
    }

    // 生成 UI 预览
    if (proposal.components.views?.length) {
      previews.ui = this.generateUIPreview(proposal);
    }

    // 生成数据流预览
    if (proposal.components.relations?.length) {
      previews.dataFlow = this.generateDataFlowPreview(proposal);
    }

    return previews;
  }

  /**
   * 生成 Schema 预览（ER 图数据）
   */
  generateSchemaPreview(proposal: ChangeProposal): SchemaPreview {
    const objects = (proposal.components.objects || []).map(obj => ({
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
      isNew: true,
      isModified: false,
    }));

    const relations = (proposal.components.relations || []).map(rel => ({
      id: rel.name,
      source: rel.sourceObject,
      target: rel.targetObject,
      type: rel.relationType,
      label: rel.displayName,
      isNew: true,
    }));

    return { objects, relations };
  }

  /**
   * 生成 Schema 图（ReactFlow 格式）
   */
  generateSchemaGraph(proposal: ChangeProposal): {
    nodes: SchemaGraphNode[];
    edges: SchemaGraphEdge[];
  } {
    const nodes: SchemaGraphNode[] = [];
    const edges: SchemaGraphEdge[] = [];

    // 生成节点
    const objects = proposal.components.objects || [];
    const gridSize = Math.ceil(Math.sqrt(objects.length));
    
    objects.forEach((obj, index) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;

      nodes.push({
        id: obj.collectionName,
        type: 'object',
        data: {
          name: obj.collectionName,
          displayName: obj.displayName,
          fields: obj.fields.map(f => ({
            name: f.name,
            type: f.type,
            required: f.required,
          })),
          isNew: true,
        },
        position: {
          x: col * 300 + 50,
          y: row * 250 + 50,
        },
      });
    });

    // 生成边
    (proposal.components.relations || []).forEach(rel => {
      edges.push({
        id: rel.name,
        source: rel.sourceObject,
        target: rel.targetObject,
        type: 'smoothstep',
        label: rel.displayName,
        data: {
          relationType: rel.relationType,
          isNew: true,
        },
      });
    });

    return { nodes, edges };
  }

  /**
   * 生成状态机预览
   */
  generateStateMachinePreview(proposal: ChangeProposal): StateMachinePreview {
    const flows = proposal.components.flows || [];
    if (flows.length === 0) {
      return { states: [], transitions: [] };
    }

    const flow = flows[0];
    
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
   * 生成状态机图（ReactFlow 格式）
   */
  generateStateMachineGraph(flow: FlowDefinition): {
    nodes: StateMachineNode[];
    edges: StateMachineEdge[];
  } {
    const nodes: StateMachineNode[] = [];
    const edges: StateMachineEdge[] = [];

    // 计算状态位置
    const states = flow.states;
    const initialState = states.find(s => s.type === 'initial');
    const finalStates = states.filter(s => s.type === 'final');
    const normalStates = states.filter(s => s.type === 'normal');

    // 初始状态在左侧
    if (initialState) {
      nodes.push({
        id: initialState.id,
        type: 'state',
        data: {
          name: initialState.displayName,
          stateType: 'initial',
          isNew: true,
        },
        position: { x: 50, y: 150 },
      });
    }

    // 普通状态在中间
    normalStates.forEach((state, index) => {
      nodes.push({
        id: state.id,
        type: 'state',
        data: {
          name: state.displayName,
          stateType: 'normal',
          isNew: true,
        },
        position: {
          x: 250 + (index % 3) * 200,
          y: 100 + Math.floor(index / 3) * 150,
        },
      });
    });

    // 最终状态在右侧
    finalStates.forEach((state, index) => {
      nodes.push({
        id: state.id,
        type: 'state',
        data: {
          name: state.displayName,
          stateType: 'final',
          isNew: true,
        },
        position: {
          x: 650,
          y: 100 + index * 150,
        },
      });
    });

    // 生成转换边
    flow.transitions.forEach(t => {
      edges.push({
        id: t.id,
        source: t.from,
        target: t.to,
        type: 'smoothstep',
        label: t.displayName,
        data: {
          trigger: t.trigger,
          conditions: t.conditions?.map(c => c.expression || ''),
          isNew: true,
        },
      });
    });

    return { nodes, edges };
  }

  /**
   * 生成 UI 预览
   */
  generateUIPreview(proposal: ChangeProposal): UIPreview {
    const views = proposal.components.views || [];
    if (views.length === 0) {
      return { type: 'list' };
    }

    const view = views[0];
    const preview: UIPreview = {
      type: view.type as 'list' | 'form' | 'detail',
    };

    // 生成模拟数据
    if (this.config.generateMockData && proposal.components.objects?.length) {
      preview.mockData = this.generateMockData(proposal.components.objects[0]);
    }

    return preview;
  }

  /**
   * 生成数据流预览
   */
  generateDataFlowPreview(proposal: ChangeProposal): DataFlowPreview {
    const nodes: DataFlowPreview['nodes'] = [];
    const edges: DataFlowPreview['edges'] = [];

    // 从关系推断数据流
    const relations = proposal.components.relations || [];
    const objectNames = new Set<string>();

    relations.forEach(rel => {
      objectNames.add(rel.sourceObject);
      objectNames.add(rel.targetObject);
    });

    // 创建节点
    objectNames.forEach(name => {
      nodes.push({
        id: name,
        type: 'source',
        label: name,
      });
    });

    // 创建边
    relations.forEach(rel => {
      edges.push({
        source: rel.sourceObject,
        target: rel.targetObject,
        label: rel.semanticType,
      });
    });

    return { nodes, edges };
  }

  /**
   * 生成模拟数据
   */
  private generateMockData(object: ObjectDefinition): Record<string, unknown>[] {
    const mockData: Record<string, unknown>[] = [];

    for (let i = 0; i < 5; i++) {
      const row: Record<string, unknown> = {
        id: `${i + 1}`,
      };

      for (const field of object.fields) {
        row[field.name] = this.generateMockValue(field.type, field.name, i);
      }

      mockData.push(row);
    }

    return mockData;
  }

  /**
   * 生成模拟值
   */
  private generateMockValue(type: string, fieldName: string, index: number): unknown {
    switch (type) {
      case 'string':
        if (fieldName.toLowerCase().includes('name')) {
          return `示例名称 ${index + 1}`;
        }
        if (fieldName.toLowerCase().includes('email')) {
          return `user${index + 1}@example.com`;
        }
        return `文本值 ${index + 1}`;

      case 'text':
        return `这是一段较长的文本内容，用于展示文本字段的显示效果。第 ${index + 1} 条。`;

      case 'integer':
        return (index + 1) * 100;

      case 'float':
      case 'decimal':
        return parseFloat(((index + 1) * 10.5).toFixed(2));

      case 'boolean':
        return index % 2 === 0;

      case 'date':
        const date = new Date();
        date.setDate(date.getDate() - index);
        return date.toISOString().split('T')[0];

      case 'datetime':
        const datetime = new Date();
        datetime.setHours(datetime.getHours() - index);
        return datetime.toISOString();

      case 'enum':
        const options = ['选项A', '选项B', '选项C'];
        return options[index % options.length];

      case 'json':
        return { key: `value${index + 1}` };

      case 'uuid':
        return `uuid-${index + 1}-mock-value`;

      default:
        return null;
    }
  }

  /**
   * 生成 NocoBase UI Schema
   */
  generateUISchema(object: ObjectDefinition, viewType: 'list' | 'form' | 'detail'): Record<string, unknown> {
    switch (viewType) {
      case 'list':
        return this.generateListSchema(object);
      case 'form':
        return this.generateFormSchema(object);
      case 'detail':
        return this.generateDetailSchema(object);
      default:
        return {};
    }
  }

  /**
   * 生成列表 Schema
   */
  private generateListSchema(object: ObjectDefinition): Record<string, unknown> {
    const columns = object.fields
      .filter(f => !['json', 'richText', 'text'].includes(f.type))
      .slice(0, 6)
      .map(field => ({
        'x-component': 'TableV2.Column',
        'x-component-props': {
          width: 150,
        },
        properties: {
          [field.name]: {
            'x-component': this.getDisplayComponent(field.type),
            'x-read-pretty': true,
          },
        },
      }));

    return {
      type: 'void',
      'x-component': 'TableV2',
      'x-component-props': {
        rowKey: 'id',
        tableLayout: 'fixed',
      },
      properties: Object.fromEntries(
        columns.map((col, index) => [`col${index}`, col]),
      ),
    };
  }

  /**
   * 生成表单 Schema
   */
  private generateFormSchema(object: ObjectDefinition): Record<string, unknown> {
    const fields = object.fields
      .filter(f => f.name !== 'id' && !f.name.endsWith('At') && !f.name.endsWith('By'))
      .map(field => ({
        type: this.getSchemaType(field.type),
        title: field.displayName,
        'x-component': this.getInputComponent(field.type),
        'x-decorator': 'FormItem',
        required: field.required,
      }));

    return {
      type: 'void',
      'x-component': 'Form',
      properties: Object.fromEntries(
        fields.map((f, index) => [object.fields[index].name, f]),
      ),
    };
  }

  /**
   * 生成详情 Schema
   */
  private generateDetailSchema(object: ObjectDefinition): Record<string, unknown> {
    const fields = object.fields.map(field => ({
      type: this.getSchemaType(field.type),
      title: field.displayName,
      'x-component': this.getDisplayComponent(field.type),
      'x-decorator': 'FormItem',
      'x-read-pretty': true,
    }));

    return {
      type: 'void',
      'x-component': 'FormV2',
      'x-read-pretty': true,
      properties: Object.fromEntries(
        fields.map((f, index) => [object.fields[index].name, f]),
      ),
    };
  }

  /**
   * 获取 Schema 类型
   */
  private getSchemaType(fieldType: string): string {
    const typeMap: Record<string, string> = {
      string: 'string',
      text: 'string',
      richText: 'string',
      integer: 'number',
      float: 'number',
      decimal: 'number',
      boolean: 'boolean',
      date: 'string',
      datetime: 'string',
      enum: 'string',
      json: 'object',
      array: 'array',
    };
    return typeMap[fieldType] || 'string';
  }

  /**
   * 获取输入组件
   */
  private getInputComponent(fieldType: string): string {
    const componentMap: Record<string, string> = {
      string: 'Input',
      text: 'Input.TextArea',
      richText: 'RichText',
      integer: 'InputNumber',
      float: 'InputNumber',
      decimal: 'InputNumber',
      boolean: 'Checkbox',
      date: 'DatePicker',
      datetime: 'DatePicker',
      enum: 'Select',
      json: 'Input.JSON',
    };
    return componentMap[fieldType] || 'Input';
  }

  /**
   * 获取展示组件
   */
  private getDisplayComponent(fieldType: string): string {
    const componentMap: Record<string, string> = {
      string: 'Input',
      text: 'Input.TextArea',
      richText: 'RichText',
      integer: 'InputNumber',
      float: 'InputNumber',
      decimal: 'InputNumber',
      boolean: 'Checkbox',
      date: 'DatePicker',
      datetime: 'DatePicker',
      enum: 'Select',
      json: 'Input.JSON',
    };
    return componentMap[fieldType] || 'Input';
  }
}
