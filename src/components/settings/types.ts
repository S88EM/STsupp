export type SettingsTab = "smtp" | "dictionaries" | "telegram" | "audit";

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
