import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('LoggerMiddleware');

  use(req: Request, res: Response, next: NextFunction) {

    this.logger.log(
      `[MIDDLEWARE] LoggerMiddleware - Executing for ${req.method} ${req.originalUrl}`,
    );
    this.logger.log(
      `[MIDDLEWARE] LoggerMiddleware - Request passed to next()`,
    );

    res.on('finish', () => {
      this.logger.log(
        `[RESPONSE] Status ${res.statusCode} for ${req.method} ${req.originalUrl}`,
      );
      this.logger.log('\n ====================== Request end =========================\n')
    });

    next();
  }
}
