"use client";

import React, { useState, useMemo } from "react";
import {
  History,
  User,
  ArrowRight,
  ArrowRightLeft,
  Pencil,
  FileText,
  AlertCircle,
  Tag,
  Boxes,
  Bookmark,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowDownUp,
  Filter,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

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

interface TaskHistoryTimelineProps {
  auditLogs?: AuditLogItem[];
  taskCreatedAt?: string;
  taskCreator?: { id?: string; name?: string; email?: string; role?: string } | null;
  currentUser?: any;
  className?: string;
  compact?: boolean;
}

function formatRoleBadge(role?: string | null, dict?: any) {
  if (!role) return null;
  switch (role) {
    case "ADMIN":
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/20 text-primary border border-primary/30">
          {dict?.roles?.admin || "Адміністратор"}
        </span>
      );
    case "ENGINEER":
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          {dict?.roles?.engineer || "Інженер"}
        </span>
      );
    case "CLIENT":
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30">
          {dict?.roles?.client || "Клієнт"}
        </span>
      );
    default:
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-secondary text-muted-foreground border border-border">
          {role}
        </span>
      );
  }
}

function formatFullDateTime(dateStr: string, locale?: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString(locale === "en" ? "en-US" : "uk-UA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export const TaskHistoryTimeline: React.FC<TaskHistoryTimelineProps> = ({
  auditLogs = [],
  taskCreatedAt,
  taskCreator,
  currentUser,
  className = "",
  compact = false,
}) => {
  const { dict, locale } = useI18n();
  const isEn = locale === "en";

  const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
    LOW: { label: dict.priorities.low, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    MEDIUM: { label: dict.priorities.medium, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    HIGH: { label: dict.priorities.high, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    URGENT: { label: dict.priorities.urgent, color: "text-red-400 bg-red-500/10 border-red-500/20" },
    CRITICAL: { label: dict.priorities.urgent, color: "text-red-400 bg-red-500/10 border-red-500/20" },
  };

  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [filterType, setFilterType] = useState<"all" | "assignee" | "status" | "content" | "priority">("all");
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

  const toggleDescriptionExpand = (logId: string) => {
    setExpandedDescriptions((prev) => ({ ...prev, [logId]: !prev[logId] }));
  };

  // Filter logs by selected facet
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (filterType === "all") return true;
      const changes = log.details?.changes || {};
      if (filterType === "assignee") {
        return Boolean(changes.assignee || changes.assigneeId || changes.action === "RETURNED_TO_SUPPORT_BY_CLIENT");
      }
      if (filterType === "status") {
        return Boolean(changes.status || changes.columnId || changes.action === "RETURNED_TO_SUPPORT_BY_CLIENT");
      }
      if (filterType === "content") {
        return Boolean(changes.title || changes.description);
      }
      if (filterType === "priority") {
        return Boolean(changes.priority);
      }
      return true;
    });
  }, [auditLogs, filterType]);

  // Sort logs
  const sortedLogs = useMemo(() => {
    return [...filteredLogs].sort((a, b) => {
      const tA = new Date(a.createdAt).getTime();
      const tB = new Date(b.createdAt).getTime();
      return sortOrder === "desc" ? tB - tA : tA - tB;
    });
  }, [filteredLogs, sortOrder]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Controls Bar: Sort & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-secondary/30 border border-border/60 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-muted-foreground font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-primary" />
            <span>{isEn ? "Filter:" : "Фільтр:"}</span>
          </span>
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-secondary/60 border border-border/80">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                filterType === "all" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isEn ? "All" : "Всі"} ({auditLogs.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("assignee")}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                filterType === "assignee" ? "bg-card text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isEn ? "Assignees" : "Виконавці"}
            </button>
            <button
              type="button"
              onClick={() => setFilterType("status")}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                filterType === "status" ? "bg-card text-blue-400 shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isEn ? "Statuses" : "Статуси"}
            </button>
            <button
              type="button"
              onClick={() => setFilterType("content")}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                filterType === "content" ? "bg-card text-amber-400 shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isEn ? "Text" : "Текст"}
            </button>
            <button
              type="button"
              onClick={() => setFilterType("priority")}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                filterType === "priority" ? "bg-card text-red-400 shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isEn ? "Priority" : "Пріоритет"}
            </button>
          </div>
        </div>

        {/* Sort Order Toggle */}
        <button
          type="button"
          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary/80 hover:bg-secondary text-foreground text-[11px] font-medium border border-border/80 transition-colors cursor-pointer"
          title={isEn ? "Change sort order" : "Змінити порядок сортування"}
        >
          <ArrowDownUp className="w-3 h-3 text-primary" />
          <span>{sortOrder === "desc" ? (isEn ? "Newest first ↓" : "Спочатку нові ↓") : (isEn ? "Oldest first ↑" : "Спочатку старі ↑")}</span>
        </button>
      </div>

      {/* Timeline List */}
      <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
        {/* Task Creation Initial Event */}
        {taskCreatedAt && (
          <div className="relative flex items-start gap-3 text-xs">
            <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-[9px] shadow-xs">
              ✓
            </div>
            <div className="flex-1 p-3 rounded-xl bg-card border border-border/80 space-y-1 shadow-xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">
                    {taskCreator?.name || (isEn ? "User" : "Користувач")}
                  </span>
                  {formatRoleBadge(taskCreator?.role, dict)}
                  <span className="text-emerald-500 dark:text-emerald-400 font-semibold text-[11px]">
                    {isEn ? "created the ticket" : "створив(-ла) звернення"}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  <span title={formatFullDateTime(taskCreatedAt, locale)}>
                    {formatTimeAgo(taskCreatedAt)}
                  </span>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {isEn
                  ? `Initial ticket registration in system (${formatFullDateTime(taskCreatedAt, locale)})`
                  : `Початкова реєстрація задачі в системі (${formatFullDateTime(taskCreatedAt, locale)})`}
              </div>
            </div>
          </div>
        )}

        {sortedLogs.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground bg-secondary/20 rounded-xl border border-border/60 italic">
            {filterType === "all"
              ? isEn ? "No records of task parameter changes yet." : "Поки що немає записів про зміну параметрів задачі."
              : isEn ? "No changes found for the selected filter." : "Для обраного фільтру змін не знайдено."}
          </div>
        ) : (
          sortedLogs.map((log) => {
            const details = log.details || {};
            const changes = details.changes || {};
            const isActorMe = currentUser && (log.actorId === currentUser.id || log.actorEmail === currentUser.email);
            const actorRole = details.actorRole || (isActorMe ? currentUser?.role : null);

            return (
              <div key={log.id} className="relative flex items-start gap-3 text-xs group">
                {/* Timeline node icon */}
                <div className="absolute -left-6 top-2 w-5 h-5 rounded-full bg-secondary text-primary border border-border flex items-center justify-center text-[10px] shadow-xs">
                  {changes.action === "RETURNED_TO_SUPPORT_BY_CLIENT" ? (
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  ) : changes.assignee || changes.assigneeId ? (
                    <User className="w-2.5 h-2.5 text-primary" />
                  ) : changes.status || changes.columnId ? (
                    <ArrowRightLeft className="w-2.5 h-2.5 text-blue-400" />
                  ) : changes.title || changes.description ? (
                    <Pencil className="w-2.5 h-2.5 text-amber-400" />
                  ) : changes.priority ? (
                    <AlertCircle className="w-2.5 h-2.5 text-red-400" />
                  ) : (
                    <History className="w-2.5 h-2.5 text-muted-foreground" />
                  )}
                </div>

                {/* Log Entry Card */}
                <div className="flex-1 p-3.5 rounded-xl bg-card border border-border space-y-2 shadow-xs transition-colors hover:border-primary/40">
                  {/* Card Header: Actor, Role, Full Date */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
                        {(log.actorName || "C").slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-foreground">
                        {isActorMe ? `${log.actorName} (${isEn ? "You" : "Ви"})` : log.actorName || log.actorEmail}
                      </span>
                      {formatRoleBadge(actorRole, dict)}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="font-medium" title={formatFullDateTime(log.createdAt, locale)}>
                        {formatTimeAgo(log.createdAt)}
                      </span>
                      <span className="hidden sm:inline text-muted-foreground/50">•</span>
                      <span className="hidden sm:inline text-[10px] text-muted-foreground/80 font-mono">
                        {formatFullDateTime(log.createdAt, locale)}
                      </span>
                    </div>
                  </div>

                  {/* Body: Visual Diffs of changes */}
                  <div className="space-y-2 pt-1 border-t border-border/50 text-xs">
                    {/* Return to support action banner */}
                    {changes.action === "RETURNED_TO_SUPPORT_BY_CLIENT" && (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 space-y-1">
                        <div className="font-semibold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{isEn ? "Returned ticket to support" : "Повернено звернення до служби підтримки"}</span>
                        </div>
                        <div className="text-[11px] text-foreground/80">
                          {changes.replyCommentAdded
                            ? isEn
                              ? "Client replied and returned ticket to active support queue."
                              : "Клієнт надав відповідь та повернув задачу в активну чергу інженерів."
                            : isEn
                            ? "Client returned ticket back to support."
                            : "Клієнт перевів звернення назад у підтримку."}
                        </div>
                      </div>
                    )}

                    {/* Assignee change */}
                    {(changes.assignee || changes.assigneeId) && (
                      <div className="flex items-start gap-2 flex-wrap p-2 rounded-lg bg-secondary/30 border border-border/60">
                        <span className="font-medium text-muted-foreground flex items-center gap-1 min-w-[130px]">
                          <User className="w-3.5 h-3.5 text-primary" />
                          <span>{dict.issue.assignee}:</span>
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground line-through opacity-70">
                            {changes.assignee?.old || dict.common.notAssigned}
                          </span>
                          {changes.assignee?.oldRole && formatRoleBadge(changes.assignee.oldRole, dict)}
                          <ArrowRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span className="font-bold text-foreground">
                            {changes.assignee?.new || dict.common.notAssigned}
                          </span>
                          {changes.assignee?.newRole && formatRoleBadge(changes.assignee.newRole, dict)}
                        </div>
                      </div>
                    )}

                    {/* Status / Column change */}
                    {(changes.status || changes.columnId) && (
                      <div className="flex items-start gap-2 flex-wrap p-2 rounded-lg bg-secondary/30 border border-border/60">
                        <span className="font-medium text-muted-foreground flex items-center gap-1 min-w-[130px]">
                          <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
                          <span>{dict.issue.status}:</span>
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-muted-foreground border border-border line-through">
                            {changes.status?.old || changes.columnId?.old || (isEn ? "Initial" : "Початковий")}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                            {changes.status?.new || changes.columnId?.new || (isEn ? "New" : "Новий")}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Priority change */}
                    {changes.priority && (
                      <div className="flex items-start gap-2 flex-wrap p-2 rounded-lg bg-secondary/30 border border-border/60">
                        <span className="font-medium text-muted-foreground flex items-center gap-1 min-w-[130px]">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>{dict.issue.priority}:</span>
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border line-through opacity-70 ${
                              PRIORITY_LABELS[changes.priority.old]?.color || "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {changes.priority.oldLabel || PRIORITY_LABELS[changes.priority.old]?.label || changes.priority.old}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              PRIORITY_LABELS[changes.priority.new]?.color || "bg-secondary text-foreground"
                            }`}
                          >
                            {changes.priority.newLabel || PRIORITY_LABELS[changes.priority.new]?.label || changes.priority.new}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Title change */}
                    {changes.title && (
                      <div className="space-y-1.5 p-2 rounded-lg bg-secondary/30 border border-border/60">
                        <div className="font-medium text-muted-foreground flex items-center gap-1">
                          <Pencil className="w-3.5 h-3.5 text-amber-400" />
                          <span>{isEn ? "Summary updated:" : "Зміна назви звернення:"}</span>
                        </div>
                        <div className="space-y-1 pl-4 text-[11px]">
                          <div className="line-through text-muted-foreground bg-destructive/10 text-destructive/90 px-2 py-1 rounded border border-destructive/20">
                            {changes.title.old}
                          </div>
                          <div className="font-semibold text-foreground bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">
                            {changes.title.new}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Description change */}
                    {changes.description && (
                      <div className="space-y-1.5 p-2 rounded-lg bg-secondary/30 border border-border/60">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-muted-foreground flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-primary" />
                            <span>{isEn ? "Task description updated" : "Оновлено опис задачі"}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleDescriptionExpand(log.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                          >
                            <span>
                              {expandedDescriptions[log.id]
                                ? isEn ? "Hide diff" : "Приховати диф"
                                : isEn ? "Show comparison" : "Показати порівняння"}
                            </span>
                            {expandedDescriptions[log.id] ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        </div>

                        {expandedDescriptions[log.id] && (
                          <div className="space-y-1.5 pt-2 text-[11px]">
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-bold uppercase text-muted-foreground">
                                {isEn ? "Previous version:" : "Попередній варіант:"}
                              </span>
                              <div className="p-2 rounded bg-destructive/5 border border-destructive/20 text-muted-foreground whitespace-pre-line max-h-40 overflow-y-auto">
                                {changes.description.old || (isEn ? "(empty description)" : "(порожній опис)")}
                              </div>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-bold uppercase text-emerald-400">
                                {isEn ? "New version:" : "Новий варіант:"}
                              </span>
                              <div className="p-2 rounded bg-emerald-500/5 border border-emerald-500/20 text-foreground whitespace-pre-line max-h-40 overflow-y-auto">
                                {changes.description.new || (isEn ? "(empty description)" : "(порожній опис)")}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Task Type change */}
                    {changes.type && (
                      <div className="flex items-start gap-2 flex-wrap p-2 rounded-lg bg-secondary/30 border border-border/60">
                        <span className="font-medium text-muted-foreground flex items-center gap-1 min-w-[130px]">
                          <Tag className="w-3.5 h-3.5 text-purple-400" />
                          <span>{dict.issue.type}:</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-secondary line-through">
                            {changes.type.old}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30 font-bold">
                            {changes.type.new}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Resolution change */}
                    {changes.resolution && (
                      <div className="flex items-start gap-2 flex-wrap p-2 rounded-lg bg-secondary/30 border border-border/60">
                        <span className="font-medium text-muted-foreground flex items-center gap-1 min-w-[130px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{dict.issue.resolution}:</span>
                        </span>
                        <div className="flex items-center gap-2">
                          {changes.resolution.old && (
                            <>
                              <span className="line-through text-muted-foreground">{changes.resolution.old}</span>
                              <ArrowRight className="w-3 h-3 text-emerald-400" />
                            </>
                          )}
                          <span className="font-bold text-emerald-400">
                            {changes.resolution.new}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Components change */}
                    {changes.components && (
                      <div className="flex items-start gap-2 flex-wrap p-2 rounded-lg bg-secondary/30 border border-border/60">
                        <span className="font-medium text-muted-foreground flex items-center gap-1 min-w-[130px]">
                          <Boxes className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{dict.issue.components}:</span>
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-muted-foreground">
                            {Array.isArray(changes.components.old) && changes.components.old.length > 0
                              ? changes.components.old.join(", ")
                              : isEn ? "(none)" : "(немає)"}
                          </span>
                          <ArrowRight className="w-3 h-3 text-cyan-400" />
                          <span className="font-semibold text-cyan-400">
                            {Array.isArray(changes.components.new) && changes.components.new.length > 0
                              ? changes.components.new.join(", ")
                              : isEn ? "(none)" : "(немає)"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Labels change */}
                    {changes.labels && (
                      <div className="flex items-start gap-2 flex-wrap p-2 rounded-lg bg-secondary/30 border border-border/60">
                        <span className="font-medium text-muted-foreground flex items-center gap-1 min-w-[130px]">
                          <Bookmark className="w-3.5 h-3.5 text-primary" />
                          <span>{dict.issue.labels}:</span>
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-muted-foreground">
                            {Array.isArray(changes.labels.old) && changes.labels.old.length > 0
                              ? changes.labels.old.join(", ")
                              : isEn ? "(none)" : "(немає)"}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-primary" />
                          <span className="font-semibold text-primary">
                            {Array.isArray(changes.labels.new) && changes.labels.new.length > 0
                              ? changes.labels.new.join(", ")
                              : isEn ? "(none)" : "(немає)"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Due Date change */}
                    {changes.dueDate && (
                      <div className="flex items-start gap-2 flex-wrap p-2 rounded-lg bg-secondary/30 border border-border/60">
                        <span className="font-medium text-muted-foreground flex items-center gap-1 min-w-[130px]">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          <span>{dict.issue.dueDate}:</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="line-through text-muted-foreground">
                            {changes.dueDate.old || (isEn ? "(not set)" : "(не встановлено)")}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-primary" />
                          <span className="font-semibold text-foreground">
                            {changes.dueDate.new || (isEn ? "(not set)" : "(не встановлено)")}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Fallback if no specific diff matched */}
                    {Object.keys(changes).length === 0 && (
                      <div className="text-muted-foreground italic">
                        {isEn ? "Task properties were updated." : "Параметри задачі було оновлено."}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
