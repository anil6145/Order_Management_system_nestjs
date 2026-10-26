import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { from, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { RedisCacheService } from './redis-cache.service';

@Injectable()
export class RedisHttpCacheInterceptor
  implements NestInterceptor
{
  constructor(private readonly cache: RedisCacheService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();

    if (request.method !== 'GET') {
      return next.handle();
    }

    // Include the query string so different filters and pages
    // get separate cache entries.
    const key = `oms:http-cache:${request.originalUrl}`;

    const cached = await this.cache.get<unknown>(key);

    if (cached !== null) {
      return of(cached);
    }

    if (cached !== null) {
  console.log(`[CACHE HIT] ${key}`);
  return of(cached);
}

console.log(`[CACHE MISS] ${key}`);

    return next.handle().pipe(
      switchMap((response: unknown) =>
        from(this.cache.set(key, response, 60)).pipe(
          map(() => response),
        ),
      ),
    );
  }
}