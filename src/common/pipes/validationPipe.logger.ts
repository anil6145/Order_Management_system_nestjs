import { ArgumentMetadata, Injectable, Logger, ValidationPipe } from '@nestjs/common';



@Injectable()
export class LoggingValidationPipe extends ValidationPipe {
  private readonly logger = new Logger('ValidationPipe');

  // here replacing/overriding a method that exists in the parent class 
  override async transform(value: any, metadata: ArgumentMetadata)
  // transform() is a method when the pipe processes incoming data 
  {
    const dtoName = metadata.metatype?.name || 'UnknownDto';
    const reqType = metadata.type;

    if (reqType === 'body' || reqType === 'query' || reqType === 'param') {
      this.logger.log(`[PIPE] ValidationPipe - DTO: ${dtoName} and  validation started (${reqType})`);
    }

    try {
      const result = await super.transform(value, metadata);
      if (reqType === 'body' || reqType === 'query' || reqType === 'param') {
        this.logger.log(`[PIPE] ValidationPipe - DTO: ${dtoName}  validation passed`);
      }
      return result;
    } catch (error) {
      if (reqType === 'body' || reqType === 'query' || reqType === 'param') {
        this.logger.warn(`[PIPE] ValidationPipe - DTO: ${dtoName} validation FAILED`);
      }
      throw error;
    }
  }
}
