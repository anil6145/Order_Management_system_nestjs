import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';
import { Public } from './auth/decorators/public.decorator.js';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Root application greeting',
    description: 'Returns default hello world message.',
  })
  @ApiResponse({
    status: 200,
    description: 'Welcome message returned successfully',
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
