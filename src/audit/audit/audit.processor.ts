import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';


import { AuditEvent } from './audit.types';
import { AuditLog } from './entities/audit-log.entity';

@Processor('audit-logs')
export class AuditProcessor extends WorkerHost {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {
    super();
  }

  async process(job: Job<AuditEvent>): Promise<void> {
    if (job.name !== 'save-audit-log') {
      throw new Error(`Unknown audit job: ${job.name}`);
    }

    const event = job.data;

    const auditLog = this.auditRepository.create({
      userId: event.userId,
      entityType: event.entityType,
      entityId: event.entityId,
      action: event.action,
      oldValues: event.oldValues,
      newValues: event.newValues,
    });

    await this.auditRepository.save(auditLog);
  }
}