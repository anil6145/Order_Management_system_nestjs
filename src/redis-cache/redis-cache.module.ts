import { Global, Module } from '@nestjs/common';
import { RedisCacheService } from './redis-cache.service';
import { RedisHttpCacheInterceptor } from './redis-http-cache.interceptor';

@Global()
@Module({
  providers: [
    RedisCacheService,
    RedisHttpCacheInterceptor,
  ],
  exports: [
    RedisCacheService,
    RedisHttpCacheInterceptor,
  ],
})
export class RedisCacheModule {}