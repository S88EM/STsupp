import { prisma } from "@/lib/prisma";

export const AUDIT_ACTIONS = {
  USER_CREATE: "USER_CREATE",
  USER_DELETE: "USER_DELETE",
  USER_PASSWORD_RESET: "USER_PASSWORD_RESET",
  USER_EMAIL_UPDATE: "USER_EMAIL_UPDATE",
  USER_ROLE_CHANGE: "USER_ROLE_CHANGE",
  USER_PROFILE_UPDATE: "USER_PROFILE_UPDATE",
  USER_STATUS_CHANGE: "USER_STATUS_CHANGE",
  USER_PROJECTS_ASSIGN: "USER_PROJECTS_ASSIGN",
  SETTINGS_SMTP_UPDATE: "SETTINGS_SMTP_UPDATE",
  SETTINGS_TELEGRAM_UPDATE: "SETTINGS_TELEGRAM_UPDATE",
  SETTINGS_DICTIONARY_UPDATE: "SETTINGS_DICTIONARY_UPDATE",
} as const;

export interface LogAuditOptions {
  actor: {
    userId?: string | null;
    email: string;
    name?: string | null;
  };
  action: string;
  targetType: "USER" | "PROJECT" | "SETTINGS" | "TASK";
  targetId?: string | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
}

export async function logAuditEvent({
  actor,
  action,
  targetType,
  targetId,
  details,
  ipAddress,
}: LogAuditOptions) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actor.userId || null,
        actorEmail: actor.email,
        actorName: actor.name || actor.email.split("@")[0] || "Користувач",
        action,
        targetType,
        targetId: targetId || null,
        details: details || {},
        ipAddress: ipAddress || null,
      },
    });
  } catch (err: any) {
    // Graceful fallback if table is still being initialized
    console.error(`[AUDIT_LOG ERROR] Failed to record action "${action}":`, err?.message || err);
  }
}
