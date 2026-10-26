import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditLog } from './entities/audit-log.entity.js';
import { AuditEvent } from './audit.types.js';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async saveAuditLog(event: AuditEvent): Promise<void> {
    const auditLog = this.auditRepository.create({
      userId: event.userId,
      entityType: event.entityType,
      entityId: event.entityId,
      action: event.action,
      oldValues: event.oldValues ?? null,
      newValues: event.newValues ?? null,
    });

    await this.auditRepository.save(auditLog);
  }
}