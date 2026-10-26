import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
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

    let message = 'Request failed';

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null
    ) {
      const responseMessage = (exceptionResponse as {
        message?: string | string[];
      }).message;

      if (Array.isArray(responseMessage)) {
        message = responseMessage.join(', ');
      } else if (responseMessage) {
        message = responseMessage;
      }
    }

    this.logger.error(
      `[EXCEPTION FILTER] - Exception caught: ${exception.constructor.name} (Status: ${status}) | Path: ${request.method} ${request.originalUrl} | Message: ${message}`,
    );

    this.logger.log(
      `[RESPONSE] Status ${status} for ${request.method} ${request.originalUrl}`,
    );

    response.status(status).json({
      success: false,
      message,
      data: null,
    });
  }
}


// without an exception filter you may need to do this repeatedly 

// try/catch inside every controller/service 
// 1) Repetition : every service needs similar code 
// 2) inconsistent responses : one server might return and another returns another 

// so here a centralized filter solves this 

