import {
  Injectable,
  Logger,
  NestMiddleware,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger('ClientRequest');

  use(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const incomingRequestId = req.headers['x-request-id'];

    const requestId =
      typeof incomingRequestId === 'string' &&
      incomingRequestId.trim().length > 0
        ? incomingRequestId
        : randomUUID();

    (req as any).requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    const userAgent = req.headers['user-agent'] || 'unknown';
   
    this.logger.log(`\n======================= Request ===============================\n`)
    this.logger.log(`[REQUEST START] ${req.method} ${req.originalUrl} `);

    this.logger.log(`[MIDDLEWARE] RequestIdMiddleware - Request ID : ${requestId}`);

    this.logger.log(`[CLIENT] User-Agent: ${userAgent}`);

    next();
  }
}
