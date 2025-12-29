import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  prefix?: string;
}

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private redis: Redis;

  constructor() {
    // Initialize Redis connection
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      // retryDelayOnFailover: 100, // Invalid option, removed
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });
  }

  /**
   * Cache Strategies with TTL rules
   */

  // Employee Profile Caching - 1 hour TTL
  async cacheEmployeeProfile(employeeId: number, profile: any): Promise<void> {
    const key = `employee:profile:${employeeId}`;
    await this.set(key, profile, 3600); // 1 hour
  }

  async getEmployeeProfile(employeeId: number): Promise<any> {
    const key = `employee:profile:${employeeId}`;
    return this.get(key);
  }

  async invalidateEmployeeProfile(employeeId: number): Promise<void> {
    const key = `employee:profile:${employeeId}`;
    await this.delete(key);
  }

  // Site Cost Calculations - 30 minutes TTL
  async cacheSiteCostCalculation(siteId: number, calculation: any): Promise<void> {
    const key = `site:cost:${siteId}`;
    await this.set(key, calculation, 1800); // 30 minutes
  }

  async getSiteCostCalculation(siteId: number): Promise<any> {
    const key = `site:cost:${siteId}`;
    return this.get(key);
  }

  async invalidateSiteCostCalculation(siteId: number): Promise<void> {
    const key = `site:cost:${siteId}`;
    await this.delete(key);
  }

  // Material Usage Analytics - 15 minutes TTL
  async cacheMaterialUsage(materialId: number, usage: any): Promise<void> {
    const key = `material:usage:${materialId}`;
    await this.set(key, usage, 900); // 15 minutes
  }

  async getMaterialUsage(materialId: number): Promise<any> {
    const key = `material:usage:${materialId}`;
    return this.get(key);
  }

  // Active Employees Cache - 5 minutes TTL (frequently changing data)
  async cacheActiveEmployees(siteId: number, employees: any[]): Promise<void> {
    const key = `site:active_employees:${siteId}`;
    await this.set(key, employees, 300); // 5 minutes
  }

  async getActiveEmployees(siteId: number): Promise<any[]> {
    const key = `site:active_employees:${siteId}`;
    return this.get(key) || [];
  }

  // WebSocket Session Management
  async storeWebSocketSession(sessionId: string, data: any): Promise<void> {
    const key = `ws:session:${sessionId}`;
    await this.set(key, data, 86400); // 24 hours
  }

  async getWebSocketSession(sessionId: string): Promise<any> {
    const key = `ws:session:${sessionId}`;
    return this.get(key);
  }

  async removeWebSocketSession(sessionId: string): Promise<void> {
    const key = `ws:session:${sessionId}`;
    await this.delete(key);
  }

  // Background Job State
  async cacheJobState(jobId: string, state: any): Promise<void> {
    const key = `job:state:${jobId}`;
    await this.set(key, state, 3600); // 1 hour
  }

  async getJobState(jobId: string): Promise<any> {
    const key = `job:state:${jobId}`;
    return this.get(key);
  }

  // Search Results Caching - 10 minutes TTL
  async cacheSearchResults(query: string, results: any): Promise<void> {
    const key = `search:${this.hashQuery(query)}`;
    await this.set(key, results, 600); // 10 minutes
  }

  async getSearchResults(query: string): Promise<any> {
    const key = `search:${this.hashQuery(query)}`;
    return this.get(key);
  }

  // Dashboard Statistics - 5 minutes TTL
  async cacheDashboardStats(userId: number, stats: any): Promise<void> {
    const key = `dashboard:stats:${userId}`;
    await this.set(key, stats, 300); // 5 minutes
  }

  async getDashboardStats(userId: number): Promise<any> {
    const key = `dashboard:stats:${userId}`;
    return this.get(key);
  }

  /**
   * Real-time Data with Pub/Sub
   */

  // Attendance Updates
  async publishAttendanceUpdate(siteId: number, data: any): Promise<void> {
    const channel = `attendance:site:${siteId}`;
    await this.redis.publish(channel, JSON.stringify(data));
  }

  async subscribeToAttendanceUpdates(siteId: number, callback: (data: any) => void): Promise<void> {
    const subscriber = this.redis.duplicate();
    const channel = `attendance:site:${siteId}`;
    
    await subscriber.subscribe(channel);
    subscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        callback(JSON.parse(message));
      }
    });
  }

  // Site Cost Updates
  async publishSiteCostUpdate(siteId: number, costData: any): Promise<void> {
    const channel = `cost:site:${siteId}`;
    await this.redis.publish(channel, JSON.stringify(costData));
  }

  // Material Usage Updates
  async publishMaterialUsageUpdate(materialId: number, usageData: any): Promise<void> {
    const channel = `material:usage:${materialId}`;
    await this.redis.publish(channel, JSON.stringify(usageData));
  }

  // Low Stock Alerts
  async publishLowStockAlert(data: any): Promise<void> {
    const channel = 'alerts:low_stock';
    await this.redis.publish(channel, JSON.stringify(data));
  }

  /**
   * Core Redis Operations
   */

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}:`, error);
    }
  }

  // Alias for compatibility
  async setex(key: string, ttl: number, value: string): Promise<void> {
    try {
      await this.redis.setex(key, ttl, value);
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}:`, error);
    }
  }

  // Delete key
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}:`, error);
    }
  }

  async get(key: string): Promise<any> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error(`Error checking cache key existence ${key}:`, error);
      return false;
    }
  }

  async flush(): Promise<void> {
    try {
      await this.redis.flushdb();
      this.logger.log('Redis cache flushed');
    } catch (error) {
      this.logger.error('Error flushing Redis cache:', error);
    }
  }

  // Batch operations for better performance
  async mset(keyValuePairs: Record<string, any>, ttl?: number): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        const serializedValue = JSON.stringify(value);
        if (ttl) {
          pipeline.setex(key, ttl, serializedValue);
        } else {
          pipeline.set(key, serializedValue);
        }
      });
      
      await pipeline.exec();
    } catch (error) {
      this.logger.error('Error in batch set operation:', error);
    }
  }

  async mget(keys: string[]): Promise<Record<string, any>> {
    try {
      const values = await this.redis.mget(...keys);
      const result: Record<string, any> = {};
      
      keys.forEach((key, index) => {
        const value = values[index];
        result[key] = value ? JSON.parse(value) : null;
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error in batch get operation:', error);
      return {};
    }
  }

  // Pattern-based operations
  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      this.logger.error(`Error deleting keys with pattern ${pattern}:`, error);
    }
  }

  // Get Redis connection for advanced operations
  getRedisClient(): Redis {
    return this.redis;
  }

  // Cleanup resources
  async disconnect(): Promise<void> {
    await this.redis.disconnect();
    this.logger.log('Redis disconnected');
  }

  /**
   * Helper Methods
   */

  private hashQuery(query: string): string {
    // Simple hash function for cache keys
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString();
  }
}
