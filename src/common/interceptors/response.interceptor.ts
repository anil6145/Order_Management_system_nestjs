import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { request, response } from 'express';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { RESPONSE_MESSAGE_KEY } from '../../auth/decorators/response-message.decorator';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger('ResponseInterceptor');

  constructor(
    private readonly reflector : Reflector
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const startTime = Date.now();

    this.logger.log(
      `[INTERCEPTOR] ResponseInterceptor - BEFORE controller execution`,
    );

    const requestUrl = (req.originalUrl ?? req.url ?? '').split('?')[0];

  // CSV downloads must not be converted into JSON.
    if (requestUrl.endsWith('/sales-summary/export')) {
      return next.handle();
    }

    const message =
      this.reflector.getAllAndOverride<string>(
        RESPONSE_MESSAGE_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? 'Request successful';

    this.logger.log(
      `Request started: ${req.method} ${requestUrl}`,
    );

    return next.handle().pipe(
      map((result: any) => {
        // Do not wrap an existing standard response envelope again.
        if (
          result !== null &&
          typeof result === 'object' &&
          !Array.isArray(result) &&
          typeof result.success === 'boolean' &&
          'message' in result &&
          'data' in result
        ) {
          return result;
        }

        // Pagination: keep meta outside data.
        if (
          result !== null &&
          typeof result === 'object' &&
          !Array.isArray(result) &&
          'meta' in result
        ) {
          const { meta, data, items, ...rest } = result;

          return {
            success: true,
            message,
            data: data ?? items ?? rest,
            meta,
          };
        }

        // Standard success response.
        return {
          success: true,
          message,
          data: result ?? null,
        };
      }),
      tap({
        next: () => {
          this.logger.log(
            `Request completed: ${req.method} ${requestUrl} | ` +
            `Status: ${res.statusCode} | Duration: ${Date.now() - startTime}ms`,
          );
        },
        error: (error: unknown) => {
          this.logger.error(
            `Request failed: ${req.method} ${requestUrl} | ` +
            `Duration: ${Date.now() - startTime}ms`,
          );
        },
      }),
    );
  }
}




// advantages :
// 1) less duplicate code 

// 2) centrailzed behaviour : if any change required we can change in the interceptor instead of hundres of controllers 

// 3) seperation :
// controller handles Http related responsibilities
// service handles business logic

// another approaches :

// approach 1 : manual response formating 
// approach 2 : Response DTO 

// export class ApiResponseDto<T> {
//   success: boolean;
//   message: string;
//   data: T;
// }

