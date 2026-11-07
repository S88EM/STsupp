import React from "react";

export interface ProjectItem {
  id: string;
  name: string;
  key: string;
  columns?: Array<{
    id: string;
    name: string;
    color?: string;
    isDoneColumn?: boolean;
    orderIndex?: number;
  }>;
}

export interface AttachmentItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export interface CommentItem {
  id: string;
  content: string;
  authorType: string;
  authorName?: string | null;
  createdAt: string;
  author?: {
    id: string;
    name: string;
    email: string;
    role?: string;
    avatarUrl?: string | null;
  } | null;
}

export interface AuditLogItem {
  id: string;
  actorId?: string | null;
  actorName: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: any;
  createdAt: string;
}

export interface TicketItem {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "URGENT";
  createdAt: string;
  updatedAt: string;
  projectId: string;
  columnId: string;
  creatorId?: string | null;
  assigneeId?: string | null;
  aiContext?: any;
  assignee?: {
    id: string;
    name: string;
    email: string;
    role?: string;
    avatarUrl?: string | null;
  } | null;
  creator?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  } | null;
  column?: {
    id: string;
    name: string;
    color?: string;
    isDoneColumn?: boolean;
    orderIndex?: number;
  } | null;
  project?: {
    id: string;
    name: string;
    key: string;
    columns?: Array<{
      id: string;
      name: string;
      color?: string;
      isDoneColumn?: boolean;
      orderIndex?: number;
    }>;
  } | null;
  attachments?: AttachmentItem[];
  comments?: CommentItem[];
  auditLogs?: AuditLogItem[];
  _count?: {
    comments: number;
    attachments: number;
    subtasks: number;
  };
}

export type PortalStatusFilter =
  | "all"
  | "in_progress"
  | "backlog"
  | "awaiting_response"
  | "resolved";

export interface PortalKpiMetrics {
  total: number;
  inProgress: number;
  resolved: number;
  backlog: number;
  awaitingResponse: number;
}

export interface PortalCurrentUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "ENGINEER" | "CLIENT" | string;
}

export function isTaskResolved(t: TicketItem | any): boolean {
  if (!t) return false;
  if (t.column?.isDoneColumn) return true;
  const colName = (t.column?.name || "").trim().toLowerCase();
  if (["готово", "done", "resolved", "вирішено", "закрито", "closed"].includes(colName)) {
    return true;
  }
  const aiCtx = (t.aiContext || {}) as Record<string, any>;
  if (aiCtx.isClosed === true) return true;
  if (
    aiCtx.resolution &&
    ["вирішено", "resolved", "done", "закрито", "closed"].includes(
      String(aiCtx.resolution).toLowerCase()
    )
  ) {
    return true;
  }
  return false;
}

export function isTaskBacklog(t: TicketItem | any): boolean {
  if (!t || isTaskResolved(t)) return false;
  const colName = (t.column?.name || "").trim().toLowerCase();
  if (
    [
      "беклог",
      "backlog",
      "новий",
      "нові",
      "new",
      "to do",
      "todo",
      "відкрито",
      "в черзі",
      "черга",
      "backlog (новий)",
    ].includes(colName)
  ) {
    return true;
  }
  if (t.column && t.project?.columns && t.project.columns.length > 0) {
    const firstCol = t.project.columns[0];
    if (
      firstCol &&
      t.column.id === firstCol.id &&
      !colName.includes("робот") &&
      !colName.includes("progress") &&
      !colName.includes("тест")
    ) {
      return true;
    }
  }
  return false;
}

export function isTaskInProgress(t: TicketItem | any): boolean {
  if (!t || isTaskResolved(t)) return false;
  if (isTaskBacklog(t)) return false;
  return true;
}

export function isAwaitingClientResponse(t: TicketItem | any, currentUserId?: string): boolean {
  if (!t || isTaskResolved(t)) return false;
  // If explicitly flagged in aiContext
  if (t.aiContext?.awaitingClient === true) return true;
  // If the task is assigned to the current client user
  if (currentUserId && (t.assigneeId === currentUserId || t.assignee?.id === currentUserId)) {
    return true;
  }
  // Or if the assignee has the CLIENT role
  if (t.assignee && t.assignee.role === "CLIENT") {
    return true;
  }
  // Or if column name indicates awaiting response
  const colName = (t.column?.name || "").toLowerCase();
  if (
    colName.includes("очікує відповіді") ||
    colName.includes("очікує клієнт") ||
    colName.includes("waiting")
  ) {
    return true;
  }
  return false;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getUserInitials(name?: string, email?: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(" ");
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return email ? email.slice(0, 2).toUpperCase() : "U";
}

export function isImageFile(url: string, mime?: string): boolean {
  if (mime?.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(url);
}
