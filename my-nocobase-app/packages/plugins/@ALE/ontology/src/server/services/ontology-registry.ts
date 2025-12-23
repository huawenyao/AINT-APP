/**
 * Ontology Registry - 本体注册表
 * 
 * 运行态核心组件，管理本体对象的注册、查询、版本控制
 */

import { Database, Repository } from '@nocobase/database';
import { v4 as uuid } from 'uuid';
import * as semver from 'semver';
import type {
  ObjectDefinition,
  RelationDefinition,
  FlowDefinition,
  ActionDefinition,
  RuleDefinition,
  FieldDefinition,
} from '@ALE/core';

/**
 * 本体注册结果
 */
export interface RegisterResult {
  success: boolean;
  objectId?: string;
  version?: string;
  error?: string;
}

/**
 * 本体查询过滤器
 */
export interface OntologyFilter {
  collectionName?: string;
  semanticTags?: string[];
  status?: 'active' | 'deprecated' | 'draft';
  version?: string;
}

/**
 * 本体注册表
 */
export class OntologyRegistry {
  private db: Database;
  private objectRepo: Repository;
  private relationRepo: Repository;
  private flowRepo: Repository;
  private actionRepo: Repository;
  private ruleRepo: Repository;

  constructor(db: Database) {
    this.db = db;
    this.objectRepo = db.getRepository('ale_ontology_objects');
    this.relationRepo = db.getRepository('ale_ontology_relations');
    this.flowRepo = db.getRepository('ale_flows');
    this.actionRepo = db.getRepository('ale_actions');
    this.ruleRepo = db.getRepository('ale_rules');
  }

  // ============================================================================
  // 对象管理
  // ============================================================================

  /**
   * 注册本体对象
   */
  async registerObject(definition: Omit<ObjectDefinition, 'id'>): Promise<RegisterResult> {
    try {
      // 检查是否已存在
      const existing = await this.objectRepo.findOne({
        filter: { collectionName: definition.collectionName },
      });

      if (existing) {
        // 更新现有对象
        const newVersion = this.incrementVersion(existing.version);
        
        await this.objectRepo.update({
          filter: { id: existing.id },
          values: {
            ...definition,
            version: newVersion,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          objectId: existing.id,
          version: newVersion,
        };
      }

      // 创建新对象
      const objectId = uuid();
      await this.objectRepo.create({
        values: {
          id: objectId,
          ...definition,
          version: definition.version || '1.0.0',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        objectId,
        version: definition.version || '1.0.0',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 获取本体对象
   */
  async getObject(collectionName: string): Promise<ObjectDefinition | null> {
    const obj = await this.objectRepo.findOne({
      filter: { collectionName, status: 'active' },
    });
    return obj as ObjectDefinition | null;
  }

  /**
   * 查询本体对象
   */
  async findObjects(filter?: OntologyFilter): Promise<ObjectDefinition[]> {
    const queryFilter: Record<string, unknown> = {};
    
    if (filter?.collectionName) {
      queryFilter.collectionName = filter.collectionName;
    }
    if (filter?.status) {
      queryFilter.status = filter.status;
    }
    if (filter?.semanticTags?.length) {
      // JSONB 包含查询
      queryFilter.semanticTags = { $contains: filter.semanticTags };
    }

    const objects = await this.objectRepo.find({
      filter: queryFilter,
    });

    return objects as ObjectDefinition[];
  }

  /**
   * 废弃本体对象
   */
  async deprecateObject(collectionName: string): Promise<boolean> {
    const result = await this.objectRepo.update({
      filter: { collectionName },
      values: {
        status: 'deprecated',
        updatedAt: new Date(),
      },
    });
    return result.length > 0;
  }

  // ============================================================================
  // 关系管理
  // ============================================================================

  /**
   * 注册关系
   */
  async registerRelation(definition: Omit<RelationDefinition, 'id'>): Promise<RegisterResult> {
    try {
      const existing = await this.relationRepo.findOne({
        filter: {
          sourceObject: definition.sourceObject,
          targetObject: definition.targetObject,
          name: definition.name,
        },
      });

      if (existing) {
        const newVersion = this.incrementVersion(existing.version);
        
        await this.relationRepo.update({
          filter: { id: existing.id },
          values: {
            ...definition,
            version: newVersion,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          objectId: existing.id,
          version: newVersion,
        };
      }

      const relationId = uuid();
      await this.relationRepo.create({
        values: {
          id: relationId,
          ...definition,
          version: definition.version || '1.0.0',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        objectId: relationId,
        version: definition.version || '1.0.0',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 获取对象的关系
   */
  async getRelationsForObject(collectionName: string): Promise<RelationDefinition[]> {
    const relations = await this.relationRepo.find({
      filter: {
        $or: [
          { sourceObject: collectionName },
          { targetObject: collectionName },
        ],
      },
    });
    return relations as RelationDefinition[];
  }

  // ============================================================================
  // 流程管理
  // ============================================================================

  /**
   * 注册流程
   */
  async registerFlow(definition: Omit<FlowDefinition, 'id'>): Promise<RegisterResult> {
    try {
      const existing = await this.flowRepo.findOne({
        filter: { name: definition.name },
      });

      if (existing) {
        const newVersion = this.incrementVersion(existing.version);
        
        await this.flowRepo.update({
          filter: { id: existing.id },
          values: {
            ...definition,
            version: newVersion,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          objectId: existing.id,
          version: newVersion,
        };
      }

      const flowId = uuid();
      await this.flowRepo.create({
        values: {
          id: flowId,
          ...definition,
          version: definition.version || '1.0.0',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        objectId: flowId,
        version: definition.version || '1.0.0',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 获取对象的流程
   */
  async getFlowsForObject(collectionName: string): Promise<FlowDefinition[]> {
    const flows = await this.flowRepo.find({
      filter: {
        targetObject: collectionName,
        enabled: true,
      },
    });
    return flows as FlowDefinition[];
  }

  // ============================================================================
  // 动作管理
  // ============================================================================

  /**
   * 注册动作
   */
  async registerAction(definition: Omit<ActionDefinition, 'id'>): Promise<RegisterResult> {
    try {
      const existing = await this.actionRepo.findOne({
        filter: { name: definition.name },
      });

      if (existing) {
        const newVersion = this.incrementVersion(existing.version);
        
        await this.actionRepo.update({
          filter: { id: existing.id },
          values: {
            ...definition,
            version: newVersion,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          objectId: existing.id,
          version: newVersion,
        };
      }

      const actionId = uuid();
      await this.actionRepo.create({
        values: {
          id: actionId,
          ...definition,
          version: definition.version || '1.0.0',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        objectId: actionId,
        version: definition.version || '1.0.0',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 获取对象的动作
   */
  async getActionsForObject(collectionName: string): Promise<ActionDefinition[]> {
    const actions = await this.actionRepo.find({
      filter: {
        targetObject: collectionName,
        enabled: true,
      },
    });
    return actions as ActionDefinition[];
  }

  // ============================================================================
  // 规则管理
  // ============================================================================

  /**
   * 注册规则
   */
  async registerRule(definition: Omit<RuleDefinition, 'id'>): Promise<RegisterResult> {
    try {
      const existing = await this.ruleRepo.findOne({
        filter: { name: definition.name },
      });

      if (existing) {
        const newVersion = this.incrementVersion(existing.version);
        
        await this.ruleRepo.update({
          filter: { id: existing.id },
          values: {
            ...definition,
            version: newVersion,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          objectId: existing.id,
          version: newVersion,
        };
      }

      const ruleId = uuid();
      await this.ruleRepo.create({
        values: {
          id: ruleId,
          ...definition,
          version: definition.version || '1.0.0',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        objectId: ruleId,
        version: definition.version || '1.0.0',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ============================================================================
  // 同步到 NocoBase Collection
  // ============================================================================

  /**
   * 将本体对象同步到 NocoBase Collection
   */
  async syncToCollection(objectDefinition: ObjectDefinition): Promise<boolean> {
    try {
      const collectionName = objectDefinition.collectionName;
      
      // 检查 Collection 是否存在
      const existingCollection = this.db.getCollection(collectionName);
      
      if (existingCollection) {
        // 更新 Collection 字段
        for (const field of objectDefinition.fields) {
          const fieldConfig = this.convertFieldToNocoBase(field);
          existingCollection.addField(field.name, fieldConfig);
        }
      } else {
        // 创建新 Collection
        const fields = objectDefinition.fields.map(f => this.convertFieldToNocoBase(f));
        
        this.db.collection({
          name: collectionName,
          title: objectDefinition.displayName,
          fields,
        });
      }

      await this.db.sync();
      return true;
    } catch (error) {
      console.error('Failed to sync collection:', error);
      return false;
    }
  }

  /**
   * 转换字段定义为 NocoBase 格式
   */
  private convertFieldToNocoBase(field: FieldDefinition): Record<string, unknown> {
    const baseConfig: Record<string, unknown> = {
      name: field.name,
      type: this.mapFieldType(field.type),
      title: field.displayName,
    };

    // 添加约束
    if (field.required) {
      baseConfig.allowNull = false;
    }
    if (field.unique) {
      baseConfig.unique = true;
    }
    if (field.defaultValue !== undefined) {
      baseConfig.defaultValue = field.defaultValue;
    }

    // 枚举类型
    if (field.type === 'enum' && field.options) {
      baseConfig.enum = field.options.map(o => o.value);
      baseConfig.uiSchema = {
        enum: field.options,
      };
    }

    // 关系类型
    if (['belongsTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(field.type)) {
      baseConfig.target = field.relation?.target;
      baseConfig.foreignKey = field.relation?.foreignKey;
      if (field.type === 'belongsToMany') {
        baseConfig.through = field.relation?.through;
      }
    }

    return baseConfig;
  }

  /**
   * 映射字段类型
   */
  private mapFieldType(type: string): string {
    const typeMap: Record<string, string> = {
      string: 'string',
      text: 'text',
      richText: 'richText',
      integer: 'integer',
      float: 'float',
      decimal: 'decimal',
      boolean: 'boolean',
      date: 'date',
      datetime: 'datetime',
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

  /**
   * 版本号递增
   */
  private incrementVersion(version: string): string {
    const parsed = semver.parse(version);
    if (!parsed) {
      return '1.0.1';
    }
    return semver.inc(version, 'patch') || '1.0.1';
  }

  // ============================================================================
  // 完整本体导出/导入
  // ============================================================================

  /**
   * 导出完整本体
   */
  async exportOntology(): Promise<OntologySnapshot> {
    const objects = await this.objectRepo.find({ filter: { status: 'active' } });
    const relations = await this.relationRepo.find();
    const flows = await this.flowRepo.find({ filter: { enabled: true } });
    const actions = await this.actionRepo.find({ filter: { enabled: true } });
    const rules = await this.ruleRepo.find({ filter: { enabled: true } });

    return {
      version: new Date().toISOString(),
      objects: objects as ObjectDefinition[],
      relations: relations as RelationDefinition[],
      flows: flows as FlowDefinition[],
      actions: actions as ActionDefinition[],
      rules: rules as RuleDefinition[],
    };
  }

  /**
   * 导入本体
   */
  async importOntology(snapshot: OntologySnapshot): Promise<boolean> {
    try {
      // 使用事务确保原子性
      await this.db.sequelize.transaction(async () => {
        for (const obj of snapshot.objects) {
          await this.registerObject(obj);
        }
        for (const rel of snapshot.relations) {
          await this.registerRelation(rel);
        }
        for (const flow of snapshot.flows) {
          await this.registerFlow(flow);
        }
        for (const action of snapshot.actions) {
          await this.registerAction(action);
        }
        for (const rule of snapshot.rules) {
          await this.registerRule(rule);
        }
      });
      return true;
    } catch (error) {
      console.error('Failed to import ontology:', error);
      return false;
    }
  }
}

/**
 * 本体快照
 */
export interface OntologySnapshot {
  version: string;
  objects: ObjectDefinition[];
  relations: RelationDefinition[];
  flows: FlowDefinition[];
  actions: ActionDefinition[];
  rules: RuleDefinition[];
}
