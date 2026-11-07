"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Search,
  RefreshCw,
} from "lucide-react";
import { AuditLogEntry } from "./types";

function getAuditBadge(action: string) {
  switch (action) {
    case "USER_PASSWORD_RESET":
      return {
        label: "Скидання пароля",
        color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      };
    case "USER_EMAIL_UPDATE":
      return {
        label: "Зміна email / логіна",
        color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      };
    case "USER_ROLE_CHANGE":
      return {
        label: "Зміна системної ролі",
        color: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      };
    case "USER_CREATE":
      return {
        label: "Створення користувача",
        color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      };
    case "USER_DELETE":
      return {
        label: "Видалення користувача",
        color: "bg-destructive/10 text-destructive border-destructive/30",
      };
    case "USER_STATUS_CHANGE":
      return {
        label: "Активація акаунту",
        color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
      };
    case "USER_PROJECTS_ASSIGN":
      return {
        label: "Призначення проєктів",
        color: "bg-slate-500/10 text-slate-300 border-slate-500/30",
      };
    case "SETTINGS_SMTP_UPDATE":
      return {
        label: "Налаштування SMTP",
        color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
      };
    case "SETTINGS_TELEGRAM_UPDATE":
      return {
        label: "Налаштування Telegram",
        color: "bg-sky-500/10 text-sky-400 border-sky-500/30",
      };
    case "SETTINGS_DICTIONARY_UPDATE":
      return {
        label: "Оновлення довідників",
        color: "bg-teal-500/10 text-teal-400 border-teal-500/30",
      };
    case "TASK_UPDATE":
      return {
        label: "Редагування задачі",
        color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      };
    default:
      return {
        label: action,
        color: "bg-secondary text-foreground border-border",
      };
  }
}

function renderAuditDetails(log: any) {
  const d = log.details || {};
  if (log.action === "USER_PASSWORD_RESET") {
    return (
      <span className="text-muted-foreground">
        Пароль для користувача{" "}
        <strong className="text-foreground">{d.targetUserEmail || d.targetUserName || log.targetId}</strong> було оновлено
      </span>
    );
  }
  if (log.action === "USER_EMAIL_UPDATE") {
    return (
      <span className="text-muted-foreground">
        Email змінено:{" "}
        <code className="text-amber-400 line-through mr-1 font-mono">{d.previousEmail}</code> ➔{" "}
        <code className="text-emerald-400 ml-1 font-mono font-semibold">{d.newEmail}</code>
      </span>
    );
  }
  if (log.action === "USER_ROLE_CHANGE") {
    return (
      <span className="text-muted-foreground">
        Користувач: <strong className="text-foreground mr-1">{d.targetUserEmail || log.targetId}</strong>
        Роль: <span className="text-zinc-400">{d.previousRole}</span> ➔{" "}
        <span className="text-primary font-semibold">{d.newRole}</span>
      </span>
    );
  }
  if (log.action === "USER_CREATE") {
    return (
      <span className="text-muted-foreground">
        Створено користувача: <strong className="text-foreground">{d.createdEmail}</strong> ({d.createdName}), роль:{" "}
        <span className="text-primary font-semibold">{d.role}</span>
      </span>
    );
  }
  if (log.action === "USER_DELETE") {
    return (
      <span className="text-destructive/90">
        Видалено обліковий запис: <strong className="text-foreground">{d.deletedUserEmail}</strong> ({d.deletedUserName})
      </span>
    );
  }
  if (log.action === "SETTINGS_SMTP_UPDATE") {
    return (
      <span className="text-muted-foreground">
        Оновлено SMTP: <code className="font-mono text-foreground">{d.host}:{d.port}</code>, відправник: <code className="font-mono text-foreground">{d.from}</code>
      </span>
    );
  }
  if (log.action === "SETTINGS_TELEGRAM_UPDATE") {
    return (
      <span className="text-muted-foreground">
        Оновлено Telegram: чат <code className="font-mono text-foreground">{d.chatId}</code>, стан:{" "}
        <span className={d.isEnabled ? "text-emerald-400 font-semibold" : "text-zinc-400"}>
          {d.isEnabled ? "Увімкнено" : "Вимкнено"}
        </span>
      </span>
    );
  }
  if (log.action === "SETTINGS_DICTIONARY_UPDATE") {
    return (
      <span className="text-muted-foreground">
        Оновлено довідники компонентів та міток ({d.labelsCount || 0} міток)
      </span>
    );
  }
  if (log.action === "TASK_UPDATE") {
    const changes = d.changes || {};
    const changedFields = Object.keys(changes);
    const fieldLabels: Record<string, string> = {
      title: "Назва",
      description: "Опис",
      priority: "Критичність",
      columnId: "Статус",
      assigneeId: "Виконавець",
    };
    return (
      <div className="space-y-1">
        <div className="text-muted-foreground">
          Задача: <strong className="text-foreground">{d.taskCode || log.targetId}</strong>
          {d.taskTitle && <span className="ml-1.5 text-zinc-400 font-normal">«{d.taskTitle}»</span>}
        </div>
        <div className="text-[11px] text-muted-foreground flex flex-wrap gap-1.5 pt-0.5">
          {changedFields.map((field) => {
            const ch = changes[field];
            const label = fieldLabels[field] || field;
            return (
              <span key={field} className="px-1.5 py-0.5 rounded bg-secondary/80 border border-border inline-flex items-center gap-1">
                <span className="font-semibold text-foreground/80">{label}:</span>
                <span className="line-through text-zinc-400">{String(ch.old || "—")}</span>
                <span>➔</span>
                <span className="text-primary font-semibold">{String(ch.new || "—")}</span>
              </span>
            );
          })}
        </div>
      </div>
    );
  }
  return <span className="font-mono text-[10px] text-muted-foreground">{JSON.stringify(d)}</span>;
}

interface AuditLogSettingsTabProps {
  isActive: boolean;
}

export function AuditLogSettingsTab({ isActive }: AuditLogSettingsTabProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditFilter, setAuditFilter] = useState("all");

  const loadAuditLogs = async () => {
    try {
      setLoadingAudit(true);
      const res = await fetch("/api/audit-logs");
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (e) {
      console.error("Failed to load audit logs:", e);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (isActive) {
      loadAuditLogs();
    }
  }, [isActive]);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Controls Card */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Журнал аудиту безпеки та дій адміністраторів</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Автоматична фіксація критичних змін: скидання паролів, зміна email, модифікація ролей та оновлення інтеграцій
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Пошук у журналі..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="w-48 text-xs pl-8 pr-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>

          {/* Filter */}
          <select
            value={auditFilter}
            onChange={(e) => setAuditFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg bg-secondary/50 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="all">Усі події</option>
            <option value="USER_PASSWORD_RESET">Скидання паролів</option>
            <option value="USER_EMAIL_UPDATE">Зміна email / логінів</option>
            <option value="USER_ROLE_CHANGE">Зміна ролей</option>
            <option value="USER_CREATE">Створення користувачів</option>
            <option value="USER_DELETE">Видалення користувачів</option>
            <option value="SETTINGS">Системні налаштування</option>
          </select>

          {/* Refresh */}
          <button
            type="button"
            onClick={loadAuditLogs}
            disabled={loadingAudit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-xs font-medium text-foreground transition-all cursor-pointer disabled:opacity-50"
            title="Оновити журнал"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? "animate-spin" : ""}`} />
            <span>Оновити</span>
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
        {loadingAudit ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            Завантаження журналу аудиту...
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
            <ShieldCheck className="w-8 h-8 mx-auto text-muted-foreground/40" />
            <p>Записи в журналі аудиту відсутні</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 border-b border-border text-muted-foreground font-medium">
                <tr>
                  <th className="py-3 px-4">Час</th>
                  <th className="py-3 px-4">Адміністратор</th>
                  <th className="py-3 px-4">Дія</th>
                  <th className="py-3 px-4">Об&apos;єкт</th>
                  <th className="py-3 px-4">Деталі зміни</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {auditLogs
                  .filter((log) => {
                    if (auditFilter !== "all") {
                      if (auditFilter === "SETTINGS") {
                        if (!log.action.startsWith("SETTINGS_")) return false;
                      } else if (log.action !== auditFilter) {
                        return false;
                      }
                    }
                    if (auditSearch) {
                      const q = auditSearch.toLowerCase();
                      const matchActor =
                        (log.actorName || "").toLowerCase().includes(q) ||
                        (log.actorEmail || "").toLowerCase().includes(q);
                      const matchAction = (log.action || "").toLowerCase().includes(q);
                      const matchTarget = (log.targetId || "").toLowerCase().includes(q);
                      const matchDetails = JSON.stringify(log.details || {}).toLowerCase().includes(q);
                      return matchActor || matchAction || matchTarget || matchDetails;
                    }
                    return true;
                  })
                  .map((log) => {
                    const badge = getAuditBadge(log.action);
                    return (
                      <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("uk-UA")}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-foreground">{log.actorName}</div>
                          <span className="text-[10px] text-muted-foreground font-mono">{log.actorEmail}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                          <span className="px-1.5 py-0.5 rounded bg-secondary/80 border border-border">
                            {log.targetType}
                            {log.targetId ? `: ${log.targetId}` : ""}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {renderAuditDetails(log)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
