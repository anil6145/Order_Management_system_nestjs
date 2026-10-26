import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity({
  name: 'audit_logs',
  schema: 'order_management',
})
@Index(['entityType', 'entityId'])
@Index(['userId', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'user_id',
    type: 'uuid',
    nullable: true,
  })
  userId: string | null;

  @Column({
    name: 'entity_type',
    type: 'varchar',
    length: 30,
  })
  entityType: string;

  @Column({
    name: 'entity_id',
    type: 'uuid',
  })
  entityId: string;

  @Column({
    type: 'varchar',
    length: 30,
  })
  action: string;

  @Column({
    name: 'old_values',
    type: 'jsonb',
    nullable: true,
  })
  oldValues: Record<string, unknown> | null;

  @Column({
    name: 'new_values',
    type: 'jsonb',
    nullable: true,
  })
  newValues: Record<string, unknown> | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;
}