import React from "react";
import type { TranslationDictionary } from "@/lib/i18n";
import {
  Bug,
  CheckSquare,
  Bookmark,
  Zap,
  Wrench,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertCircle,
} from "lucide-react";

export interface JiraTaskType {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

export const JIRA_TASK_TYPES: Record<string, JiraTaskType> = {
  BUG: {
    id: "BUG",
    label: "Баг",
    icon: <Bug className="w-3.5 h-3.5 text-red-400" />,
    color: "text-red-400",
  },
  TASK: {
    id: "TASK",
    label: "Задача",
    icon: <CheckSquare className="w-3.5 h-3.5 text-blue-400" />,
    color: "text-blue-400",
  },
  STORY: {
    id: "STORY",
    label: "Історія",
    icon: <Bookmark className="w-3.5 h-3.5 text-emerald-400" />,
    color: "text-emerald-400",
  },
  IMPROVEMENT: {
    id: "IMPROVEMENT",
    label: "Покращення",
    icon: <Zap className="w-3.5 h-3.5 text-violet-400" />,
    color: "text-violet-400",
  },
  SUPPORT: {
    id: "SUPPORT",
    label: "Підтримка",
    icon: <Wrench className="w-3.5 h-3.5 text-amber-400" />,
    color: "text-amber-400",
  },
};

export const TASK_PRIORITIES = [
  { id: "LOW", label: "Низький", color: "text-blue-400" },
  { id: "MEDIUM", label: "Середній", color: "text-muted-foreground" },
  { id: "HIGH", label: "Високий", color: "text-amber-500" },
  { id: "URGENT", label: "Терміновий ⚡", color: "text-red-500" },
] as const;

export function getTaskTypeInfo(aiContext: any, title = ""): JiraTaskType {
  const typeKey = (aiContext?.type || "").toUpperCase();
  if (JIRA_TASK_TYPES[typeKey]) return JIRA_TASK_TYPES[typeKey];

  const lower = title.toLowerCase();
  if (
    lower.includes("баг") ||
    lower.includes("bug") ||
    lower.includes("помилка") ||
    lower.includes("fix")
  ) {
    return JIRA_TASK_TYPES.BUG;
  }
  if (lower.includes("покращити") || lower.includes("імпрув") || lower.includes("оптиміз")) {
    return JIRA_TASK_TYPES.IMPROVEMENT;
  }
  if (lower.includes("підтримка") || lower.includes("налаштув") || lower.includes("інструкц")) {
    return JIRA_TASK_TYPES.SUPPORT;
  }
  if (
    lower.includes("історія") ||
    lower.includes("story") ||
    lower.includes("фіча") ||
    lower.includes("feat")
  ) {
    return JIRA_TASK_TYPES.STORY;
  }
  return JIRA_TASK_TYPES.TASK;
}

export function getPriorityIcon(priority: string) {
  switch (priority) {
    case "URGENT":
    case "CRITICAL":
      return (
        <span title="Терміновий ⚡" className="inline-flex items-center">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 font-bold" />
        </span>
      );
    case "HIGH":
      return (
        <span title="Високий" className="inline-flex items-center">
          <ArrowUp className="w-3.5 h-3.5 text-amber-500" />
        </span>
      );
    case "LOW":
      return (
        <span title="Низький" className="inline-flex items-center">
          <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
        </span>
      );
    case "MEDIUM":
    default:
      return (
        <span title="Середній" className="inline-flex items-center">
          <Minus className="w-3.5 h-3.5 text-muted-foreground" />
        </span>
      );
  }
}

export function getLocalizedStatusName(
  name?: string,
  dict?: TranslationDictionary,
  locale?: string,
  semanticKey?: string
): string {
  if (!name) return "";
  if (locale !== "en" || !dict) return name;
  const lower = name.toLowerCase().trim();
  if (lower === "беклог" || semanticKey === "backlog") return dict.statuses.backlog;
  if (lower === "в роботі" || semanticKey === "inprogress") return dict.statuses.in_progress;
  if (lower === "тестування" || semanticKey === "testing") return dict.statuses.testing;
  if (lower === "готово" || lower === "вирішено" || semanticKey === "done") return dict.statuses.done;
  if (lower === "очікує клієнта" || lower === "очікування клієнта") return dict.statuses.awaiting_client;
  if (lower === "закрита" || lower === "закрито") return dict.issue.closed;
  return name;
}
