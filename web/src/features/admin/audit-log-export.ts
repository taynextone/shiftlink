export type AuditLogEntry = {
  id: string;
  action: string;
  actorUserId: string;
  actorRole: string;
  targetEntityType: string | null;
  targetEntityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

function escapeCsvValue(value: unknown) {
  const serialized = value == null ? '' : String(value);
  return /[",\n\r]/.test(serialized) ? `"${serialized.replace(/"/g, '""')}"` : serialized;
}

export function buildAuditLogCsv(logs: AuditLogEntry[]) {
  const rows = [
    ['ID', 'Action', 'ActorUserId', 'ActorRole', 'TargetEntityType', 'TargetEntityId', 'Metadata', 'CreatedAt'],
    ...logs.map((log) => [
      log.id,
      log.action,
      log.actorUserId,
      log.actorRole,
      log.targetEntityType ?? '',
      log.targetEntityId ?? '',
      log.metadata ? JSON.stringify(log.metadata) : '',
      log.createdAt,
    ]),
  ];

  return rows.map((row) => row.map(escapeCsvValue).join(',')).join('\n');
}
