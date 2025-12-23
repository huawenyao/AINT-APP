/**
 * Gate Engine - 门禁引擎
 * 
 * 控制面核心组件，负责：
 * - 门禁注册和管理
 * - 门禁链式执行
 * - 结果聚合和报告
 */

import { Database, Repository } from '@nocobase/database';
import { v4 as uuid } from 'uuid';
import { BaseGate, GateType, GateContext, GateConfig } from '../gates/base-gate';
import { StructuralGate, StructuralGateConfig } from '../gates/implementations/structural-gate';
import { EvidenceGate, EvidenceGateConfig } from '../gates/implementations/evidence-gate';
import { ExecutionGate, ExecutionGateConfig } from '../gates/implementations/execution-gate';
import { EvaluationGate, EvaluationGateConfig } from '../gates/implementations/evaluation-gate';
import { GateCache } from './gate-cache';
import type { GateResult, GateReport } from '@ALE/core';

/**
 * 门禁引擎配置
 */
export interface GateEngineConfig {
  /** 是否启用严格模式（任一失败即停止） */
  strictMode?: boolean;
  /** 是否记录通过的门禁 */
  logPassed?: boolean;
  /** 默认超时时间（毫秒） */
  defaultTimeout?: number;
}

/**
 * 门禁执行结果
 */
export interface GateExecutionResult {
  /** 是否全部通过 */
  passed: boolean;
  /** 门禁结果列表 */
  results: GateResult[];
  /** 报告 ID */
  reportId?: string;
  /** 摘要 */
  summary: string;
  /** 执行时间（毫秒） */
  duration: number;
}

/**
 * 门禁引擎
 */
export class GateEngine {
  private db: Database;
  private gates: Map<string, BaseGate>;
  private config: GateEngineConfig;
  private reportRepo: Repository;
  private cache: GateCache;

  constructor(db: Database, config: GateEngineConfig = {}) {
    this.db = db;
    this.gates = new Map();
    this.config = {
      strictMode: config.strictMode ?? true,
      logPassed: config.logPassed ?? true,
      defaultTimeout: config.defaultTimeout ?? 5000,
    };
    this.reportRepo = db.getRepository('ale_gate_reports');
    this.cache = new GateCache(300); // 5 分钟缓存
  }

  /**
   * 注册门禁
   */
  registerGate(gate: BaseGate): void {
    this.gates.set(gate.name, gate);
  }

  /**
   * 注销门禁
   */
  unregisterGate(name: string): void {
    this.gates.delete(name);
  }

  /**
   * 获取门禁
   */
  getGate(name: string): BaseGate | undefined {
    return this.gates.get(name);
  }

  /**
   * 获取所有门禁
   */
  getAllGates(): BaseGate[] {
    return Array.from(this.gates.values());
  }

  /**
   * 获取特定类型的门禁
   */
  getGatesByType(type: GateType): BaseGate[] {
    return this.getAllGates().filter(g => g.type === type);
  }

  /**
   * 执行门禁链
   */
  async execute(
    context: GateContext,
    gateNames?: string[],
  ): Promise<GateExecutionResult> {
    // 检查缓存
    const cached = this.cache.get(context, gateNames || []);
    if (cached) {
      return cached;
    }

    const startTime = Date.now();
    const results: GateResult[] = [];
    let allPassed = true;

    // 确定要执行的门禁
    const gatesToRun = gateNames
      ? gateNames.map(n => this.gates.get(n)).filter(Boolean) as BaseGate[]
      : this.getAllGates();

    // 按照门禁类型排序（G1 -> G7）
    gatesToRun.sort((a, b) => this.getGateOrder(a.type) - this.getGateOrder(b.type));

    for (const gate of gatesToRun) {
      // 检查门禁是否启用
      if (!gate.isEnabled()) {
        continue;
      }

      // 检查门禁是否适用
      if (!gate.isApplicable(context)) {
        continue;
      }

      try {
        // 执行门禁检查
        const result = await this.executeWithTimeout(
          gate.check(context),
          this.config.defaultTimeout!,
        );

        results.push(result);

        if (!result.passed) {
          allPassed = false;
          
          // 严格模式下立即停止
          if (this.config.strictMode) {
            break;
          }
        }
      } catch (error) {
        // 门禁执行错误
        const errorResult: GateResult = {
          gate: gate.name,
          passed: false,
          message: `门禁执行错误: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error',
          timestamp: new Date(),
        };
        results.push(errorResult);
        allPassed = false;

        if (this.config.strictMode) {
          break;
        }
      }
    }

    const duration = Date.now() - startTime;

    // 生成报告
    const reportId = await this.saveReport(context, results, allPassed);

    // 生成摘要
    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.filter(r => !r.passed).length;
    const summary = allPassed
      ? `所有门禁通过 (${passedCount}/${results.length})`
      : `门禁检查失败: ${failedCount} 个未通过`;

    const executionResult: GateExecutionResult = {
      passed: allPassed,
      results,
      reportId,
      summary,
      duration,
    };

    // 缓存结果（仅缓存通过的结果）
    if (allPassed) {
      this.cache.set(context, gateNames || [], executionResult);
    }

    return executionResult;
  }

  /**
   * 执行预检（不保存报告）
   */
  async preCheck(
    context: GateContext,
    gateTypes: GateType[],
  ): Promise<GateExecutionResult> {
    const startTime = Date.now();
    const results: GateResult[] = [];
    let allPassed = true;

    const gatesToRun = this.getAllGates().filter(
      g => gateTypes.includes(g.type) && g.isEnabled() && g.isApplicable(context),
    );

    for (const gate of gatesToRun) {
      try {
        const result = await gate.check(context);
        results.push(result);
        if (!result.passed) {
          allPassed = false;
        }
      } catch (error) {
        results.push({
          gate: gate.name,
          passed: false,
          message: `预检错误: ${error}`,
          severity: 'error',
          timestamp: new Date(),
        });
        allPassed = false;
      }
    }

    const duration = Date.now() - startTime;
    const summary = allPassed
      ? '预检通过'
      : `预检失败: ${results.filter(r => !r.passed).length} 个问题`;

    return {
      passed: allPassed,
      results,
      summary,
      duration,
    };
  }

  /**
   * 从配置创建门禁
   */
  createGateFromConfig(config: GateConfig): BaseGate {
    switch (config.type) {
      case GateType.G1_STRUCTURAL:
        return new StructuralGate(config as StructuralGateConfig);
      case GateType.G3_EVIDENCE:
        return new EvidenceGate(config as EvidenceGateConfig);
      case GateType.G6_EXECUTION:
        return new ExecutionGate(config as ExecutionGateConfig);
      case GateType.G7_EVALUATION:
        return new EvaluationGate(config as EvaluationGateConfig);
      default:
        throw new Error(`Unknown gate type: ${config.type}`);
    }
  }

  /**
   * 从本体定义加载门禁规则
   */
  async loadGatesFromOntology(collectionName: string): Promise<void> {
    const ontologyRepo = this.db.getRepository('ale_ontology_objects');
    const object = await ontologyRepo.findOne({
      filter: { collectionName, status: 'active' },
    });

    if (!object?.gateRules) {
      return;
    }

    for (const rule of object.gateRules as GateConfig[]) {
      const gate = this.createGateFromConfig({
        ...rule,
        name: `${collectionName}_${rule.name}`,
      });
      this.registerGate(gate);
    }
  }

  /**
   * 带超时的执行
   */
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeout: number,
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Gate execution timeout')), timeout),
      ),
    ]);
  }

  /**
   * 获取门禁执行顺序
   */
  private getGateOrder(type: GateType): number {
    const order: Record<GateType, number> = {
      [GateType.G1_STRUCTURAL]: 1,
      [GateType.G2_SEMANTIC]: 2,
      [GateType.G3_EVIDENCE]: 3,
      [GateType.G4_PERMISSION]: 4,
      [GateType.G5_FLOW]: 5,
      [GateType.G6_EXECUTION]: 6,
      [GateType.G7_EVALUATION]: 7,
    };
    return order[type] || 99;
  }

  /**
   * 保存门禁报告
   */
  private async saveReport(
    context: GateContext,
    results: GateResult[],
    passed: boolean,
  ): Promise<string> {
    const reportId = uuid();
    
    await this.reportRepo.create({
      values: {
        id: reportId,
        subjectType: context.subjectType,
        subjectId: context.subjectId,
        gates: results,
        passed,
        summary: this.generateReportSummary(results),
        createdAt: new Date(),
      },
    });

    return reportId;
  }

  /**
   * 生成报告摘要
   */
  private generateReportSummary(results: GateResult[]): string {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const warnings = results.filter(r => r.severity === 'warning').length;
    const errors = results.filter(r => r.severity === 'error' || r.severity === 'critical').length;

    return `通过: ${passed}, 失败: ${failed}, 警告: ${warnings}, 错误: ${errors}`;
  }
}
