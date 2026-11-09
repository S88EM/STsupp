export type SettingsTab = "general" | "smtp" | "dictionaries" | "telegram" | "audit" | "backup";

export interface BackupSummaryData {
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

export interface BackupValidationData {
  isValid: boolean;
  error?: string;
  version?: string;
  createdAt?: string;
  exportedBy?: {
    userId?: string | null;
    email: string;
    name?: string | null;
  };
  summary?: BackupSummaryData;
}

export interface TelegramStatus {
  enabled: boolean;
  hasToken: boolean;
  chatId: string;
}

export interface TelegramEventsConfig {
  taskCreated: boolean;
  statusChanged: boolean;
  commentAdded: boolean;
  assigneeChanged: boolean;
}

export interface ProjectDictOption {
  id: string;
  name: string;
  key: string;
}

export interface AuditLogEntry {
  id: string;
  createdAt: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, any>;
}
