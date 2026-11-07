import fs from "fs";
import path from "path";
import zlib from "zlib";
import { prisma } from "@/lib/prisma";
import { getMailConfig, saveMailConfig } from "@/lib/email";
import { getTelegramConfig, saveTelegramConfig } from "@/lib/telegram";
import { getTaskDictionaries, saveTaskDictionaries } from "@/lib/dictionaries";
import { logAuditEvent, AUDIT_ACTIONS } from "@/lib/audit";

export interface BackupActor {
  userId?: string | null;
  email: string;
  name?: string | null;
  role?: string;
}

export interface BackupSummary {
  usersCount: number;
  projectsCount: number;
  tasksCount: number;
  subtasksCount: number;
  commentsCount: number;
  attachmentsCount: number;
  auditLogsCount: number;
  filesCount: number;
  totalFileSizeBytes: number;
  hasSmtpConfig: boolean;
  hasTelegramConfig: boolean;
  hasDictionaries: boolean;
}

export interface BackupFileEntry {
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  fileSize?: number;
  dataBase64: string;
}

export interface SystemBackupPackage {
  version: "1.0.0";
  system: "STsup";
  createdAt: string;
  exportedBy: {
    userId?: string | null;
    email: string;
    name?: string | null;
  };
  summary: BackupSummary;
  data: {
    users: any[];
    projects: any[];
    projectMembers: any[];
    columns: any[];
    tasks: any[];
    subtasks: any[];
    comments: any[];
    attachments: any[];
    aiRecommendations: any[];
    taskWatchers: any[];
    auditLogs: any[];
  };
  settings: {
    smtp: any;
    telegram: any;
    dictionaries: any;
  };
  files: BackupFileEntry[];
}

export interface BackupValidationResult {
  isValid: boolean;
  error?: string;
  version?: string;
  createdAt?: string;
  exportedBy?: {
    userId?: string | null;
    email: string;
    name?: string | null;
  };
  summary?: BackupSummary;
  package?: SystemBackupPackage;
}

export function getUploadsDir(): string {
  if (process.env.UPLOAD_DIR) return process.env.UPLOAD_DIR;
  if (fs.existsSync("/data/uploads")) return "/data/uploads";
  return path.join(process.cwd(), "public", "uploads");
}

/**
 * Creates a complete system backup package:
 * - All DB models (Users, Projects, Columns, Tasks, Comments, Subtasks, Attachments, AuditLogs, etc.)
 * - System configs (SMTP, Telegram, Dictionaries)
 * - Physical attachment files (base64 encoded)
 * Compressed with gzip for compact, single-file transfer.
 */
export async function createSystemBackup(actor: BackupActor): Promise<{
  buffer: Buffer;
  filename: string;
  summary: BackupSummary;
  package: SystemBackupPackage;
}> {
  // 1. Fetch all database tables
  const [
    users,
    projects,
    projectMembers,
    columns,
    tasks,
    subtasks,
    comments,
    attachments,
    aiRecommendations,
    taskWatchers,
    auditLogs,
  ] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.project.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.projectMember.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.column.findMany({ orderBy: { orderIndex: "asc" } }),
    prisma.task.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.subtask.findMany({ orderBy: { orderIndex: "asc" } }),
    prisma.comment.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.attachment.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.aiRecommendation.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.taskWatcher.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 5000 }),
  ]);

  // 2. Fetch configurations
  const smtpConfig = getMailConfig();
  const telegramConfig = getTelegramConfig();
  const dictionaries = getTaskDictionaries();

  // 3. Collect physical attachment files
  const uploadDir = getUploadsDir();
  const files: BackupFileEntry[] = [];
  let totalFileSizeBytes = 0;

  for (const att of attachments) {
    if (!att.fileUrl) continue;
    const fileNameOnDisk = path.basename(att.fileUrl);
    const filePath = path.join(uploadDir, fileNameOnDisk);

    if (fs.existsSync(filePath)) {
      try {
        const fileBuf = fs.readFileSync(filePath);
        totalFileSizeBytes += fileBuf.length;
        files.push({
          fileName: att.fileName,
          fileUrl: att.fileUrl,
          mimeType: att.mimeType || undefined,
          fileSize: att.fileSize || fileBuf.length,
          dataBase64: fileBuf.toString("base64"),
        });
      } catch (err) {
        console.warn(`[BACKUP WARNING] Could not read file ${filePath}:`, err);
      }
    }
  }

  const summary: BackupSummary = {
    usersCount: users.length,
    projectsCount: projects.length,
    tasksCount: tasks.length,
    subtasksCount: subtasks.length,
    commentsCount: comments.length,
    attachmentsCount: attachments.length,
    auditLogsCount: auditLogs.length,
    filesCount: files.length,
    totalFileSizeBytes,
    hasSmtpConfig: Boolean(smtpConfig.host),
    hasTelegramConfig: Boolean(telegramConfig.botToken && telegramConfig.chatId),
    hasDictionaries: Boolean(dictionaries.labels?.length > 0),
  };

  const backupPackage: SystemBackupPackage = {
    version: "1.0.0",
    system: "STsup",
    createdAt: new Date().toISOString(),
    exportedBy: {
      userId: actor.userId,
      email: actor.email,
      name: actor.name,
    },
    summary,
    data: {
      users,
      projects,
      projectMembers,
      columns,
      tasks,
      subtasks,
      comments,
      attachments,
      aiRecommendations,
      taskWatchers,
      auditLogs,
    },
    settings: {
      smtp: smtpConfig,
      telegram: telegramConfig,
      dictionaries,
    },
    files,
  };

  // 4. Compress with gzip
  const jsonString = JSON.stringify(backupPackage);
  const buffer = zlib.gzipSync(Buffer.from(jsonString, "utf8"));

  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `stsup-backup-${dateStr}.stsup`;

  // 5. Log audit event
  await logAuditEvent({
    actor,
    action: AUDIT_ACTIONS.BACKUP_EXPORT,
    targetType: "SYSTEM",
    targetId: "BACKUP",
    details: {
      filename,
      uncompressedBytes: Buffer.byteLength(jsonString, "utf8"),
      compressedBytes: buffer.length,
      ...summary,
    },
  });

  return {
    buffer,
    filename,
    summary,
    package: backupPackage,
  };
}

/**
 * Validates a backup buffer (decompresses if gzip, verifies integrity and schema).
 */
export function validateSystemBackup(rawBuffer: Buffer): BackupValidationResult {
  try {
    let jsonString: string;

    // Check if buffer is gzip compressed (magic bytes 0x1f 0x8b)
    if (rawBuffer.length >= 2 && rawBuffer[0] === 0x1f && rawBuffer[1] === 0x8b) {
      const decompressed = zlib.gunzipSync(rawBuffer);
      jsonString = decompressed.toString("utf8");
    } else {
      jsonString = rawBuffer.toString("utf8");
    }

    const pkg: SystemBackupPackage = JSON.parse(jsonString);

    if (!pkg || typeof pkg !== "object") {
      return { isValid: false, error: "Файл не містить валідного JSON об'єкта" };
    }

    if (pkg.system !== "STsup") {
      return {
        isValid: false,
        error: `Несумісний тип резервної копії (знайдено: "${(pkg as any).system || "невідомо"}", очікується: "STsup")`,
      };
    }

    if (!pkg.version || pkg.version !== "1.0.0") {
      return {
        isValid: false,
        error: `Непідтримувана версія бекапу: "${pkg.version || "не вказано"}". Підтримується: "1.0.0"`,
      };
    }

    if (!pkg.data || typeof pkg.data !== "object") {
      return { isValid: false, error: "Архів пошкоджено: відсутній розділ даних (data)" };
    }

    if (!Array.isArray(pkg.data.users) || !Array.isArray(pkg.data.projects)) {
      return { isValid: false, error: "Архів пошкоджено: відсутні списки користувачів або проєктів" };
    }

    const summary: BackupSummary = pkg.summary || {
      usersCount: pkg.data.users.length,
      projectsCount: pkg.data.projects.length,
      tasksCount: pkg.data.tasks?.length || 0,
      subtasksCount: pkg.data.subtasks?.length || 0,
      commentsCount: pkg.data.comments?.length || 0,
      attachmentsCount: pkg.data.attachments?.length || 0,
      auditLogsCount: pkg.data.auditLogs?.length || 0,
      filesCount: pkg.files?.length || 0,
      totalFileSizeBytes: (pkg.files || []).reduce((acc, f) => acc + (f.fileSize || 0), 0),
      hasSmtpConfig: Boolean(pkg.settings?.smtp?.host),
      hasTelegramConfig: Boolean(pkg.settings?.telegram?.botToken),
      hasDictionaries: Boolean(pkg.settings?.dictionaries?.labels?.length > 0),
    };

    return {
      isValid: true,
      version: pkg.version,
      createdAt: pkg.createdAt,
      exportedBy: pkg.exportedBy,
      summary,
      package: pkg,
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: `Помилка розбору архіву: ${err?.message || "некоректний файл"}`,
    };
  }
}

/**
 * Restores the system from a verified backup package.
 * Performs database purge and restoration in strict transactional foreign-key order,
 * restores system settings (SMTP, Telegram, Dictionaries),
 * and unpacks physical attachment files into the upload directory.
 */
export async function restoreSystemBackup(
  pkg: SystemBackupPackage,
  actor: BackupActor
): Promise<{ success: boolean; summary: BackupSummary }> {
  const { data, settings, files } = pkg;

  // 1. Database restoration in a transaction
  await prisma.$transaction(
    async (tx) => {
      // 1.1 Purge existing records in reverse dependency order
      await tx.aiRecommendation.deleteMany({});
      await tx.taskWatcher.deleteMany({});
      await tx.comment.deleteMany({});
      await tx.attachment.deleteMany({});
      await tx.subtask.deleteMany({});
      await tx.task.deleteMany({});
      await tx.column.deleteMany({});
      await tx.projectMember.deleteMany({});
      await tx.project.deleteMany({});
      await tx.auditLog.deleteMany({});
      await tx.user.deleteMany({});

      // 1.2 Insert records in dependency order
      // Users
      if (Array.isArray(data.users) && data.users.length > 0) {
        const usersMapped = data.users.map((u) => ({
          ...u,
          createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
          updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date(),
          resetTokenExpires: u.resetTokenExpires ? new Date(u.resetTokenExpires) : null,
          verificationTokenExpires: u.verificationTokenExpires
            ? new Date(u.verificationTokenExpires)
            : null,
        }));
        await tx.user.createMany({ data: usersMapped });
      }

      // Projects
      if (Array.isArray(data.projects) && data.projects.length > 0) {
        const projectsMapped = data.projects.map((p) => ({
          ...p,
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
          updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        }));
        await tx.project.createMany({ data: projectsMapped });
      }

      // Project Members
      if (Array.isArray(data.projectMembers) && data.projectMembers.length > 0) {
        const membersMapped = data.projectMembers.map((m) => ({
          ...m,
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
        }));
        await tx.projectMember.createMany({ data: membersMapped });
      }

      // Columns
      if (Array.isArray(data.columns) && data.columns.length > 0) {
        const columnsMapped = data.columns.map((c) => ({
          ...c,
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
          updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
        }));
        await tx.column.createMany({ data: columnsMapped });
      }

      // Tasks
      if (Array.isArray(data.tasks) && data.tasks.length > 0) {
        const tasksMapped = data.tasks.map((t) => ({
          ...t,
          dueDate: t.dueDate ? new Date(t.dueDate) : null,
          createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
          updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
        }));
        await tx.task.createMany({ data: tasksMapped });
      }

      // Subtasks
      if (Array.isArray(data.subtasks) && data.subtasks.length > 0) {
        const subtasksMapped = data.subtasks.map((s) => ({
          ...s,
          createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
          updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
        }));
        await tx.subtask.createMany({ data: subtasksMapped });
      }

      // Comments
      if (Array.isArray(data.comments) && data.comments.length > 0) {
        const commentsMapped = data.comments.map((c) => ({
          ...c,
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
          updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
        }));
        await tx.comment.createMany({ data: commentsMapped });
      }

      // Attachments
      if (Array.isArray(data.attachments) && data.attachments.length > 0) {
        const attachmentsMapped = data.attachments.map((a) => ({
          ...a,
          createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
        }));
        await tx.attachment.createMany({ data: attachmentsMapped });
      }

      // AI Recommendations
      if (Array.isArray(data.aiRecommendations) && data.aiRecommendations.length > 0) {
        const recsMapped = data.aiRecommendations.map((r) => ({
          ...r,
          createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
        }));
        await tx.aiRecommendation.createMany({ data: recsMapped });
      }

      // Task Watchers
      if (Array.isArray(data.taskWatchers) && data.taskWatchers.length > 0) {
        const watchersMapped = data.taskWatchers.map((w) => ({
          ...w,
          createdAt: w.createdAt ? new Date(w.createdAt) : new Date(),
        }));
        await tx.taskWatcher.createMany({ data: watchersMapped });
      }

      // Audit Logs
      if (Array.isArray(data.auditLogs) && data.auditLogs.length > 0) {
        const logsMapped = data.auditLogs.map((l) => ({
          ...l,
          createdAt: l.createdAt ? new Date(l.createdAt) : new Date(),
        }));
        await tx.auditLog.createMany({ data: logsMapped });
      }
    },
    {
      timeout: 120000, // 2 minutes timeout for large datasets
    }
  );

  // 2. Restore System Settings
  if (settings) {
    if (settings.smtp && typeof settings.smtp === "object") {
      try {
        saveMailConfig(settings.smtp);
      } catch (e) {
        console.warn("[RESTORE WARNING] Failed to restore SMTP config:", e);
      }
    }

    if (settings.telegram && typeof settings.telegram === "object") {
      try {
        saveTelegramConfig(settings.telegram);
      } catch (e) {
        console.warn("[RESTORE WARNING] Failed to restore Telegram config:", e);
      }
    }

    if (settings.dictionaries && typeof settings.dictionaries === "object") {
      try {
        saveTaskDictionaries(settings.dictionaries);
      } catch (e) {
        console.warn("[RESTORE WARNING] Failed to restore Dictionaries config:", e);
      }
    }
  }

  // 3. Restore Physical Files
  const uploadDir = getUploadsDir();
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  if (Array.isArray(files) && files.length > 0) {
    for (const f of files) {
      if (!f.fileUrl || !f.dataBase64) continue;
      const fileNameOnDisk = path.basename(f.fileUrl);
      const targetPath = path.join(uploadDir, fileNameOnDisk);
      try {
        const buf = Buffer.from(f.dataBase64, "base64");
        fs.writeFileSync(targetPath, buf);
      } catch (err) {
        console.warn(`[RESTORE WARNING] Failed to write file ${targetPath}:`, err);
      }
    }
  }

  // 4. Log Audit Event
  await logAuditEvent({
    actor,
    action: AUDIT_ACTIONS.BACKUP_RESTORE,
    targetType: "SYSTEM",
    targetId: "RESTORE",
    details: {
      backupCreatedAt: pkg.createdAt,
      backupExportedBy: pkg.exportedBy,
      summary: pkg.summary,
    },
  });

  return {
    success: true,
    summary: pkg.summary,
  };
}
