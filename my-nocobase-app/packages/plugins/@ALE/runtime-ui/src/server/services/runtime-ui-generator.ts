/**
 * Runtime UI Generator - 运行态 UI 生成器
 * 
 * 运行态核心组件，负责：
 * - 从已发布的本体生成 NocoBase UI Schema
 * - 自动注册 Collection 和资源
 * - 动态生成菜单和页面
 */

import { Database } from '@nocobase/database';
import type {
  ObjectDefinition,
  RelationDefinition,
  FlowDefinition,
  ActionDefinition,
  ViewDefinition,
  FieldDefinition,
} from '@ALE/core';

/**
 * 运行态 UI 生成器配置
 */
export interface RuntimeUIGeneratorConfig {
  /** 是否自动注册 Collection */
  autoRegisterCollection?: boolean;
  /** 是否生成默认视图 */
  generateDefaultViews?: boolean;
  /** 是否生成菜单 */
  generateMenu?: boolean;
}

/**
 * 生成的 UI 配置
 */
export interface GeneratedUIConfig {
  collection: Record<string, unknown>;
  listSchema: Record<string, unknown>;
  formSchema: Record<string, unknown>;
  detailSchema: Record<string, unknown>;
  menuItem?: Record<string, unknown>;
}

/**
 * 运行态 UI 生成器
 */
export class RuntimeUIGenerator {
  private db: Database;
  private config: RuntimeUIGeneratorConfig;

  constructor(db: Database, config: RuntimeUIGeneratorConfig = {}) {
    this.db = db;
    this.config = {
      autoRegisterCollection: config.autoRegisterCollection ?? true,
      generateDefaultViews: config.generateDefaultViews ?? true,
      generateMenu: config.generateMenu ?? true,
    };
  }

  /**
   * 从本体对象生成完整 UI
   */
  async generateFromOntology(collectionName: string): Promise<GeneratedUIConfig> {
    // 获取对象定义
    const objectDef = await this.db.getRepository('ale_ontology_objects').findOne({
      filter: { collectionName, status: 'active' },
    });

    if (!objectDef) {
      throw new Error(`Ontology object not found: ${collectionName}`);
    }

    const object = objectDef as unknown as ObjectDefinition;

    // 获取关联信息
    const relations = await this.db.getRepository('ale_ontology_relations').find({
      filter: {
        $or: [
          { sourceObject: collectionName },
          { targetObject: collectionName },
        ],
      },
    }) as unknown as RelationDefinition[];

    // 获取流程
    const flows = await this.db.getRepository('ale_flows').find({
      filter: { targetObject: collectionName, enabled: true },
    }) as unknown as FlowDefinition[];

    // 获取动作
    const actions = await this.db.getRepository('ale_actions').find({
      filter: { targetObject: collectionName, enabled: true },
    }) as unknown as ActionDefinition[];

    // 生成 Collection 定义
    const collection = this.generateCollection(object, relations);

    // 生成视图 Schema
    const listSchema = this.generateListSchema(object, actions, flows);
    const formSchema = this.generateFormSchema(object, relations);
    const detailSchema = this.generateDetailSchema(object, relations, flows);

    // 生成菜单项
    const menuItem = this.config.generateMenu
      ? this.generateMenuItem(object)
      : undefined;

    return {
      collection,
      listSchema,
      formSchema,
      detailSchema,
      menuItem,
    };
  }

  /**
   * 生成 NocoBase Collection 定义
   */
  generateCollection(
    object: ObjectDefinition,
    relations: RelationDefinition[],
  ): Record<string, unknown> {
    const fields = object.fields.map(field => this.convertField(field, relations));

    return {
      name: object.collectionName,
      title: object.displayName,
      description: object.description,
      logging: true,
      createdBy: true,
      updatedBy: true,
      createdAt: true,
      updatedAt: true,
      sortable: true,
      fields,
    };
  }

  /**
   * 转换字段定义
   */
  private convertField(
    field: FieldDefinition,
    relations: RelationDefinition[],
  ): Record<string, unknown> {
    const baseField: Record<string, unknown> = {
      name: field.name,
      type: this.mapFieldType(field.type),
      interface: this.mapFieldInterface(field.type),
      uiSchema: {
        type: this.mapUISchemaType(field.type),
        title: field.displayName,
        'x-component': this.mapComponent(field.type),
      },
    };

    // 处理必填
    if (field.required) {
      baseField.allowNull = false;
    }

    // 处理唯一
    if (field.unique) {
      baseField.unique = true;
    }

    // 处理默认值
    if (field.defaultValue !== undefined) {
      baseField.defaultValue = field.defaultValue;
    }

    // 处理枚举类型
    if (field.type === 'enum' && field.options) {
      baseField.enum = field.options.map(o => ({
        value: o.value,
        label: o.label,
        color: o.color,
      }));
    }

    // 处理关系类型
    if (['belongsTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(field.type)) {
      const relation = relations.find(r => r.name === field.name);
      if (relation) {
        baseField.target = field.relation?.target || relation.targetObject;
        baseField.foreignKey = field.relation?.foreignKey || relation.foreignKey;
        if (field.type === 'belongsToMany') {
          baseField.through = field.relation?.through || relation.through;
        }
      }
    }

    return baseField;
  }

  /**
   * 生成列表视图 Schema
   */
  generateListSchema(
    object: ObjectDefinition,
    actions: ActionDefinition[],
    flows: FlowDefinition[],
  ): Record<string, unknown> {
    // 选择显示的列
    const displayFields = object.fields
      .filter(f => !['json', 'richText', 'text'].includes(f.type))
      .filter(f => !f.name.endsWith('Id'))
      .slice(0, 8);

    const columns: Record<string, unknown> = {};
    displayFields.forEach((field, index) => {
      columns[`col_${field.name}`] = {
        type: 'void',
        'x-decorator': 'TableV2.Column.Decorator',
        'x-component': 'TableV2.Column',
        'x-component-props': {
          width: 150,
        },
        properties: {
          [field.name]: {
            type: this.mapUISchemaType(field.type),
            'x-component': this.mapComponent(field.type),
            'x-read-pretty': true,
            'x-component-props': {},
          },
        },
      };
    });

    // 添加操作列
    columns.actions = {
      type: 'void',
      title: '操作',
      'x-decorator': 'TableV2.Column.Decorator',
      'x-component': 'TableV2.Column',
      'x-component-props': {
        width: 200,
        fixed: 'right',
      },
      properties: this.generateRowActions(actions, flows),
    };

    return {
      type: 'void',
      'x-component': 'CardItem',
      properties: {
        actions: {
          type: 'void',
          'x-component': 'ActionBar',
          'x-component-props': {
            style: { marginBottom: 16 },
          },
          properties: this.generateTableActions(actions),
        },
        table: {
          type: 'void',
          'x-component': 'TableV2',
          'x-component-props': {
            rowKey: 'id',
            rowSelection: { type: 'checkbox' },
            useProps: '{{ useTableBlockProps }}',
          },
          properties: columns,
        },
      },
    };
  }

  /**
   * 生成表格操作按钮
   */
  private generateTableActions(actions: ActionDefinition[]): Record<string, unknown> {
    const result: Record<string, unknown> = {
      create: {
        type: 'void',
        title: '新增',
        'x-component': 'Action',
        'x-component-props': {
          type: 'primary',
          icon: 'PlusOutlined',
        },
        properties: {
          drawer: {
            type: 'void',
            title: '新增',
            'x-component': 'Action.Drawer',
            'x-component-props': {
              destroyOnClose: true,
            },
          },
        },
      },
      refresh: {
        type: 'void',
        title: '刷新',
        'x-component': 'Action',
        'x-component-props': {
          icon: 'ReloadOutlined',
        },
      },
    };

    // 添加自定义批量操作
    const bulkActions = actions.filter(a => a.type === 'custom');
    bulkActions.forEach(action => {
      result[action.name] = {
        type: 'void',
        title: action.displayName,
        'x-component': 'Action',
        'x-component-props': {
          icon: 'ThunderboltOutlined',
        },
      };
    });

    return result;
  }

  /**
   * 生成行操作按钮
   */
  private generateRowActions(
    actions: ActionDefinition[],
    flows: FlowDefinition[],
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {
      view: {
        type: 'void',
        title: '查看',
        'x-component': 'Action.Link',
        'x-component-props': {},
      },
      edit: {
        type: 'void',
        title: '编辑',
        'x-component': 'Action.Link',
        'x-component-props': {},
      },
      delete: {
        type: 'void',
        title: '删除',
        'x-component': 'Action.Link',
        'x-component-props': {
          confirm: {
            title: '确认删除',
            content: '删除后无法恢复，确认删除吗？',
          },
        },
      },
    };

    // 添加状态转换操作
    if (flows.length > 0) {
      const flow = flows[0];
      flow.transitions.forEach(transition => {
        result[`transition_${transition.id}`] = {
          type: 'void',
          title: transition.displayName,
          'x-component': 'Action.Link',
          'x-component-props': {
            type: 'link',
          },
        };
      });
    }

    return result;
  }

  /**
   * 生成表单视图 Schema
   */
  generateFormSchema(
    object: ObjectDefinition,
    relations: RelationDefinition[],
  ): Record<string, unknown> {
    const editableFields = object.fields.filter(
      f => !['id'].includes(f.name) &&
           !f.name.endsWith('At') &&
           !f.name.endsWith('By'),
    );

    const properties: Record<string, unknown> = {};

    editableFields.forEach(field => {
      properties[field.name] = {
        type: this.mapUISchemaType(field.type),
        title: field.displayName,
        'x-decorator': 'FormItem',
        'x-component': this.mapInputComponent(field.type),
        'x-component-props': this.getComponentProps(field),
        required: field.required,
      };

      // 处理枚举类型的选项
      if (field.type === 'enum' && field.options) {
        properties[field.name] = {
          ...properties[field.name] as Record<string, unknown>,
          enum: field.options.map(o => ({
            value: o.value,
            label: o.label,
          })),
        };
      }
    });

    return {
      type: 'void',
      'x-component': 'FormV2',
      'x-component-props': {
        useProps: '{{ useFormBlockProps }}',
      },
      properties,
    };
  }

  /**
   * 生成详情视图 Schema
   */
  generateDetailSchema(
    object: ObjectDefinition,
    relations: RelationDefinition[],
    flows: FlowDefinition[],
  ): Record<string, unknown> {
    const properties: Record<string, unknown> = {};

    object.fields.forEach(field => {
      properties[field.name] = {
        type: this.mapUISchemaType(field.type),
        title: field.displayName,
        'x-decorator': 'FormItem',
        'x-component': this.mapComponent(field.type),
        'x-read-pretty': true,
      };
    });

    // 添加状态流程图（如果有流程）
    if (flows.length > 0) {
      properties.stateFlow = {
        type: 'void',
        title: '状态流程',
        'x-decorator': 'CardItem',
        'x-component': 'StateFlowGraph',
        'x-component-props': {
          flow: flows[0],
        },
      };
    }

    return {
      type: 'void',
      'x-component': 'FormV2',
      'x-component-props': {
        useProps: '{{ useFormBlockProps }}',
      },
      'x-read-pretty': true,
      properties,
    };
  }

  /**
   * 生成菜单项
   */
  generateMenuItem(object: ObjectDefinition): Record<string, unknown> {
    return {
      title: object.displayName,
      icon: 'TableOutlined',
      type: 'page',
      path: `/${object.collectionName}`,
      component: 'TableBlockProvider',
      componentProps: {
        collection: object.collectionName,
      },
    };
  }

  // ============================================================================
  // 辅助方法
  // ============================================================================

  private mapFieldType(type: string): string {
    const typeMap: Record<string, string> = {
      string: 'string',
      text: 'text',
      richText: 'richText',
      integer: 'bigInt',
      float: 'float',
      decimal: 'decimal',
      boolean: 'boolean',
      date: 'date',
      datetime: 'date',
      time: 'time',
      enum: 'string',
      set: 'set',
      json: 'json',
      array: 'array',
      uuid: 'uuid',
      belongsTo: 'belongsTo',
      hasOne: 'hasOne',
      hasMany: 'hasMany',
      belongsToMany: 'belongsToMany',
    };
    return typeMap[type] || 'string';
  }

  private mapFieldInterface(type: string): string {
    const interfaceMap: Record<string, string> = {
      string: 'input',
      text: 'textarea',
      richText: 'richText',
      integer: 'integer',
      float: 'number',
      decimal: 'number',
      boolean: 'checkbox',
      date: 'datetime',
      datetime: 'datetime',
      enum: 'select',
      belongsTo: 'm2o',
      hasOne: 'o2o',
      hasMany: 'o2m',
      belongsToMany: 'm2m',
    };
    return interfaceMap[type] || 'input';
  }

  private mapUISchemaType(type: string): string {
    const schemaTypeMap: Record<string, string> = {
      string: 'string',
      text: 'string',
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
    return schemaTypeMap[type] || 'string';
  }

  private mapComponent(type: string): string {
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
      belongsTo: 'AssociationField',
      hasOne: 'AssociationField',
      hasMany: 'AssociationField',
      belongsToMany: 'AssociationField',
    };
    return componentMap[type] || 'Input';
  }

  private mapInputComponent(type: string): string {
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
      belongsTo: 'AssociationField',
      hasMany: 'AssociationField',
    };
    return componentMap[type] || 'Input';
  }

  private getComponentProps(field: FieldDefinition): Record<string, unknown> {
    const props: Record<string, unknown> = {};

    if (field.uiConfig?.placeholder) {
      props.placeholder = field.uiConfig.placeholder;
    }

    if (field.type === 'datetime') {
      props.showTime = true;
    }

    return props;
  }
}
