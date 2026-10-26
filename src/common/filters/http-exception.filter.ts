import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();


    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const body =
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
        ? exceptionResponse as Record<string, unknown>
        : {};

    const rawMessage = body.message ??
      (typeof exceptionResponse === 'string'
        ? exceptionResponse
        : 'Request failed');

    const messages = Array.isArray(rawMessage)
      ? rawMessage.map(String)
      : [String(rawMessage)];

    const isValidationError =
      status === HttpStatus.BAD_REQUEST &&
      Array.isArray(rawMessage);

    const errors = isValidationError
      ? messages.map((message) => {
          // Supports Nest's standard "property must ..." messages.
          const match = message.match(/^(.+?) must (.+)$/);

          if (!match) {
            return { field: '', message };
          }

          const field = match[1].replace(
            /\.(\d+)(?=\.|$)/g,
            '[$1]',
          );

          return {
            field,
            message: `must ${match[2]}`,
          };
        })
      : null;

    const errorCode =
      typeof body.errorCode === 'string'
        ? body.errorCode
        : isValidationError
          ? 'VALIDATION_ERROR'
          : status === HttpStatus.BAD_REQUEST
            ? 'BAD_REQUEST'
            : status === HttpStatus.UNAUTHORIZED
              ? 'UNAUTHORIZED'
              : status === HttpStatus.FORBIDDEN
                ? 'FORBIDDEN'
                : status === HttpStatus.NOT_FOUND
                  ? 'NOT_FOUND'
                  : status === HttpStatus.CONFLICT
                    ? 'CONFLICT'
                    : status >= 500
                      ? 'INTERNAL_SERVER_ERROR'
                      : 'REQUEST_FAILED';

    const message = isValidationError
      ? 'Validation failed'
      : messages[0];

    this.logger.error(
      `[EXCEPTION FILTER] ${exception.constructor.name} | ` +
      `Status: ${status} | Path: ${request.method} ${request.originalUrl} | ` +
      `Message: ${message}`,
    );

    response.status(status).json({
      success: false,
      message,
      errorCode,
      errors,
      data: null,
    });
  }
}


// without an exception filter you may need to do this repeatedly 

// try/catch inside every controller/service 
// 1) Repetition : every service needs similar code 
// 2) inconsistent responses : one server might return and another returns another 

// so here a centralized filter solves this 

