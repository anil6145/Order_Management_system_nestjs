import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { concatMap } from 'rxjs/operators';

import { AuditEvent } from './audit.types.js';
import { AuditService } from './audit-queue.service.js';

type RequestWithAuditEvent = Request & {
  auditEvent?: AuditEvent;
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly auditService: AuditService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithAuditEvent>();

    return next.handle().pipe(
      concatMap(async (response) => {
        const event = request.auditEvent;

        if (event) {
          try {
            await this.auditService.saveAuditLog(event);
          } catch (error) {
            this.logger.error(
              `Failed to save audit log for ${event.entityType} ${event.entityId}`,
              error instanceof Error ? error.stack : String(error),
            );

            // The business operation may already have succeeded.
            // Re-throw so the failure is visible to the caller.
            throw error;
          }
        }

        return response;
      }),
    );
  }
}