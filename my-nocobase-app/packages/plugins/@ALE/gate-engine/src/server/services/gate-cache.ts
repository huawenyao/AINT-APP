/**
 * Gate Cache - 门禁结果缓存
 * 
 * 缓存门禁检查结果，提高性能
 */

import { Database } from '@nocobase/database';
import crypto from 'crypto';
import type { GateContext, GateExecutionResult } from '../gates/base-gate';

/**
 * 门禁缓存项
 */
interface GateCacheItem {
  key: string;
  result: GateExecutionResult;
  expiresAt: Date;
}

/**
 * 门禁缓存管理器
 */
export class GateCache {
  private cache: Map<string, GateCacheItem>;
  private defaultTTL: number;

  constructor(defaultTTL = 300) {
    // 5 分钟默认 TTL
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * 生成缓存键
   */
  private generateKey(context: GateContext, gates: string[]): string {
    const keyData = {
      action: context.action,
      subjectType: context.subjectType,
      subjectId: context.subjectId,
      dataHash: this.hashData(context.data),
      gates: gates.sort().join(','),
    };
    const hash = crypto.createHash('md5').update(JSON.stringify(keyData)).digest('hex');
    return `gate:${hash}`;
  }

  /**
   * 哈希数据（用于缓存键）
   */
  private hashData(data: unknown): string {
    return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
  }

  /**
   * 获取缓存
   */
  get(context: GateContext, gates: string[]): GateExecutionResult | null {
    const key = this.generateKey(context, gates);
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    if (new Date() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.result;
  }

  /**
   * 设置缓存
   */
  set(context: GateContext, gates: string[], result: GateExecutionResult, ttl?: number): void {
    const key = this.generateKey(context, gates);
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (ttl || this.defaultTTL));

    this.cache.set(key, {
      key,
      result,
      expiresAt,
    });

    // 清理过期项
    this.cleanup();
  }

  /**
   * 删除缓存
   */
  delete(context: GateContext, gates: string[]): void {
    const key = this.generateKey(context, gates);
    this.cache.delete(key);
  }

  /**
   * 清理过期缓存
   */
  private cleanup(): void {
    const now = new Date();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计
   */
  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // TODO: 实现命中率统计
    };
  }
}
