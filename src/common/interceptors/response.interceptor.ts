import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { request, response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  private readonly logger = new Logger('ResponseInterceptor');

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

    const requestUrl = request.url ?? '';

  // CSV download: skip the JSON response envelope.
  if (
    requestUrl
      .split('?')[0]
      .endsWith('/sales-summary/export')
  ) {
    return next.handle();
  }

    return next.handle().pipe(
      map((data) => {
        const duration = Date.now() - startTime;
        this.logger.log(
          `[INTERCEPTOR] ResponseInterceptor - AFTER controller execution (Response transformation | Status: ${res.statusCode} | Duration: ${duration}ms)`,
        );

        return {
          success: true,
          message: 'Request successful',
          data : data,
        };
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

