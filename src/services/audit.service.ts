import { prisma } from '../config/prisma';

export type AuditAction =
  | 'NURSE_REGISTER'
  | 'HOSPITAL_REGISTER'
  | 'LOGIN'
  | 'LOGOUT'
  | 'SHIFT_IMPORT'
  | 'OFFER_CREATE'
  | 'OFFER_ACCEPT'
  | 'OFFER_DECLINE'
  | 'OFFER_REOPEN'
  | 'OFFER_EXTEND'
  | 'CONTRACT_VOID'
  | 'EXECUTION_SIGN'
  | 'INVOICE_MARK_PAID'
  | 'WHATSAPP_RETRY'
  | 'WEBHOOK_RETRY'
  | 'FAILURE_RESOLVE'
  | 'PROFILE_RELEASE';

export async function recordAuditLog(data: {
  action: AuditAction;
  actorUserId: string;
  actorRole: string;
  targetEntityType?: string;
  targetEntityId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: data.action,
        actorUserId: data.actorUserId,
        actorRole: data.actorRole,
        targetEntityType: data.targetEntityType ?? null,
        targetEntityId: data.targetEntityId ?? null,
        metadataJson: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });
  } catch {
    // Audit logging should not break the main flow
    console.error(`Failed to record audit log: ${data.action}`);
  }
}

export async function getAuditLogs(options?: {
  actorUserId?: string;
  action?: AuditAction;
  targetEntityType?: string;
  targetEntityId?: string;
  limit?: number;
  offset?: number;
}) {
  const where = {
    ...(options?.actorUserId ? { actorUserId: options.actorUserId } : {}),
    ...(options?.action ? { action: options.action } : {}),
    ...(options?.targetEntityType ? { targetEntityType: options.targetEntityType } : {}),
    ...(options?.targetEntityId ? { targetEntityId: options.targetEntityId } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs: logs.map((log) => ({
      id: log.id,
      action: log.action,
      actorUserId: log.actorUserId,
      actorRole: log.actorRole,
      targetEntityType: log.targetEntityType,
      targetEntityId: log.targetEntityId,
      metadata: log.metadataJson ? JSON.parse(log.metadataJson) : null,
      createdAt: log.createdAt.toISOString(),
    })),
    total,
  };
}
