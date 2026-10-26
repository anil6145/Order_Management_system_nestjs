import {
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);

  private readonly redis = new Redis({
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    retryStrategy: (times) => Math.min(times * 200, 1000),
  });

  constructor() {
    this.redis.on('error', (error: Error) => {
      this.logger.warn(`Redis connection issue: ${error.message}`);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);

      return value === null ? null : (JSON.parse(value) as T);
    } catch (error) {
      this.logger.warn(
        `Cache read failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  async set(
    key: string,
    value: unknown,
    ttlSeconds = 60,
  ): Promise<void> {
    try {
      await this.redis.set(
        key,
        JSON.stringify(value),
        'EX',
        ttlSeconds,
      );
    } catch (error) {
      this.logger.warn(
        `Cache write failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async deleteByPattern(pattern: string): Promise<void> {
    try {
      let cursor = '0';

      do {
        const [nextCursor, keys] = await this.redis.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );

        cursor = nextCursor;

        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } while (cursor !== '0');
    } catch (error) {
      this.logger.warn(
        `Cache invalidation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.redis.disconnect();
  }
}