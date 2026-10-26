
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator.js';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly typeOrmHealthIndicator: TypeOrmHealthIndicator,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'System health check',
    description: 'Checks database connectivity and general system health via Terminus.',
  })
  @ApiResponse({
    status: 200,
    description: 'System and database are healthy',
  })
  @ApiResponse({
    status: 503,
    description: 'Health check failed (database down or timed out)',
  })
  checkDatabase() {
    return this.healthCheckService.check([
      () =>
        this.typeOrmHealthIndicator.pingCheck('database', {
          timeout: 2000,
        }),
    ]);
  }
}
