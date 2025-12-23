/**
 * Cache Manager - 缓存管理器
 * 
 * 提供意图解析结果和方案生成的缓存功能
 */

import { Database } from '@nocobase/database';
import crypto from 'crypto';

/**
 * 缓存项
 */
interface CacheItem<T> {
  key: string;
  value: T;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * 缓存管理器配置
 */
export interface CacheManagerConfig {
  /** 默认 TTL（秒） */
  defaultTTL?: number;
  /** 使用 Redis */
  useRedis?: boolean;
}

/**
 * 缓存管理器
 */
export class CacheManager {
  private db: Database;
  private memoryCache: Map<string, CacheItem<any>>;
  private config: CacheManagerConfig;

  constructor(db: Database, config: CacheManagerConfig = {}) {
    this.db = db;
    this.memoryCache = new Map();
    this.config = {
      defaultTTL: config.defaultTTL ?? 3600, // 1 小时
      useRedis: config.useRedis ?? false,
    };
  }

  /**
   * 生成缓存键
   */
  private generateKey(prefix: string, data: unknown): string {
    const hash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
    return `${prefix}:${hash}`;
  }

  /**
   * 获取缓存
   */
  async get<T>(key: string): Promise<T | null> {
    const item = this.memoryCache.get(key);
    
    if (!item) {
      return null;
    }

    if (new Date() > item.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * 设置缓存
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (ttl || this.config.defaultTTL!));

    this.memoryCache.set(key, {
      key,
      value,
      expiresAt,
      createdAt: new Date(),
    });

    // 清理过期项
    this.cleanup();
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
  }

  /**
   * 清理过期缓存
   */
  private cleanup(): void {
    const now = new Date();
    for (const [key, item] of this.memoryCache.entries()) {
      if (now > item.expiresAt) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * 缓存意图解析结果
   */
  async cacheIntentParse(input: string, result: unknown, ttl = 7200): Promise<string> {
    const key = this.generateKey('intent', input);
    await this.set(key, result, ttl);
    return key;
  }

  /**
   * 获取缓存的意图解析结果
   */
  async getCachedIntentParse(input: string): Promise<unknown | null> {
    const key = this.generateKey('intent', input);
    return this.get(key);
  }

  /**
   * 缓存方案生成结果
   */
  async cacheProposal(intentId: string, result: unknown, ttl = 3600): Promise<string> {
    const key = this.generateKey('proposal', intentId);
    await this.set(key, result, ttl);
    return key;
  }

  /**
   * 获取缓存的方案
   */
  async getCachedProposal(intentId: string): Promise<unknown | null> {
    const key = this.generateKey('proposal', intentId);
    return this.get(key);
  }
}
