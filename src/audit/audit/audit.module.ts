import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';

import { AuditProcessor } from './audit.processor';

import { AuditLog } from './entities/audit-log.entity';
import { AuditInterceptor } from './audit.interceptor';
import { AuditService } from './audit-queue.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditLog]),
  ],
  providers: [
    AuditService,
    AuditProcessor,
    AuditInterceptor,
  ],
  exports: [
    AuditService,
    AuditInterceptor,
  ],
  
})
export class AuditModule {}