import { buildAuditLogCsv, type AuditLogEntry } from '../web/src/features/admin/audit-log-export';

describe('audit log viewer helpers', () => {
  it('escapes CSV export values with commas, quotes, and line breaks', () => {
    const logs: AuditLogEntry[] = [
      {
        id: 'audit_1',
        action: 'CONTRACT_VOID',
        actorUserId: 'admin,ops',
        actorRole: 'SUPER_ADMIN',
        targetEntityType: 'MatchContract',
        targetEntityId: 'contract_1',
        metadata: { reason: 'Needs "manual"\nreview' },
        createdAt: '2026-06-02T06:00:00.000Z',
      },
    ];

    expect(buildAuditLogCsv(logs)).toBe([
      'ID,Action,ActorUserId,ActorRole,TargetEntityType,TargetEntityId,Metadata,CreatedAt',
      'audit_1,CONTRACT_VOID,"admin,ops",SUPER_ADMIN,MatchContract,contract_1,"{""reason"":""Needs \\""manual\\""\\nreview""}",2026-06-02T06:00:00.000Z',
    ].join('\n'));
  });
});
