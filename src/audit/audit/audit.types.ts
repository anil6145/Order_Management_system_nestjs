export interface AuditEvent {
  userId: string | null;

  entityType: 'PRODUCT' | 'ORDER';

  entityId: string;

  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE';

  oldValues: Record<string, unknown> | null;

  newValues: Record<string, unknown> | null;
}