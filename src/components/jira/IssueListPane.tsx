"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Bug,
  CheckSquare,
  Bookmark,
  Zap,
  Wrench,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertCircle,
  Filter,
} from "lucide-react";
import { TaskItem } from "@/components/board/TaskCard";

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

export function getTaskTypeInfo(aiContext: any, title = ""): JiraTaskType {
  const typeKey = (aiContext?.type || "").toUpperCase();
  if (JIRA_TASK_TYPES[typeKey]) return JIRA_TASK_TYPES[typeKey];

  const lower = title.toLowerCase();
  if (lower.includes("баг") || lower.includes("bug") || lower.includes("помилка") || lower.includes("fix")) {
    return JIRA_TASK_TYPES.BUG;
  }
  if (lower.includes("покращити") || lower.includes("імпрув") || lower.includes("оптиміз")) {
    return JIRA_TASK_TYPES.IMPROVEMENT;
  }
  if (lower.includes("підтримка") || lower.includes("налаштув") || lower.includes("інструкц")) {
    return JIRA_TASK_TYPES.SUPPORT;
  }
  if (lower.includes("історія") || lower.includes("story") || lower.includes("фіча") || lower.includes("feat")) {
    return JIRA_TASK_TYPES.STORY;
  }
  return JIRA_TASK_TYPES.TASK;
}

export function getPriorityIcon(priority: string) {
  switch (priority) {
    case "URGENT":
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

interface IssueListPaneProps {
  tasks: Array<
    TaskItem & {
      columnName?: string;
      columnColor?: string;
      aiContext?: any;
    }
  >;
  selectedTaskId: string | null;
  onSelectTask: (task: any) => void;
  onOpenCreateTask: () => void;
  currentUserId?: string;
}

export const IssueListPane: React.FC<IssueListPaneProps> = ({
  tasks,
  selectedTaskId,
  onSelectTask,
  onOpenCreateTask,
  currentUserId,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "my" | "open">("all");

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCode = t.code.toLowerCase().includes(q);
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesAssignee = t.assignee?.name.toLowerCase().includes(q);
        if (!matchesCode && !matchesTitle && !matchesAssignee) return false;
      }

      // 2. Tab Filter
      if (filterMode === "my" && currentUserId) {
        if (t.assignee?.id !== currentUserId) return false;
      } else if (filterMode === "open") {
        const col = (t.columnName || "").toLowerCase();
        if (col.includes("done") || col.includes("готов") || col.includes("виріш")) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, searchQuery, filterMode, currentUserId]);

  return (
    <div className="w-80 md:w-96 flex flex-col border-r border-border bg-card/40 flex-shrink-0 select-none">
      {/* Header */}
      <div className="p-3 border-b border-border/80 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-foreground tracking-tight">
              {filterMode === "my"
                ? "Призначені мені"
                : filterMode === "open"
                ? "Відкриті задачі"
                : "Всі задачі"}
            </h3>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full bg-secondary text-muted-foreground border border-border">
              {filteredTasks.length}
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 text-[10px] bg-secondary/60 p-0.5 rounded-md border border-border/70">
            <button
              onClick={() => setFilterMode("all")}
              className={`px-1.5 py-0.5 rounded ${
                filterMode === "all"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Всі
            </button>
            <button
              onClick={() => setFilterMode("my")}
              className={`px-1.5 py-0.5 rounded ${
                filterMode === "my"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Мої
            </button>
            <button
              onClick={() => setFilterMode("open")}
              className={`px-1.5 py-0.5 rounded ${
                filterMode === "open"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Відкриті
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Швидкий пошук (ключ, назва)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg bg-secondary/40 border border-border/80 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/40">
        {filteredTasks.length === 0 ? (
          <div className="py-12 px-4 text-center text-xs text-muted-foreground space-y-1.5">
            <p>Задач не знайдено</p>
            <p className="text-[11px] text-muted-foreground/70">
              Спробуйте змінити фільтр або створіть нову задачу
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isSelected = selectedTaskId === task.id;
            const typeInfo = getTaskTypeInfo(task.aiContext, task.title);

            return (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className={`p-3 cursor-pointer transition-all flex flex-col gap-1.5 ${
                  isSelected
                    ? "bg-primary/10 border-l-4 border-primary text-foreground shadow-xs"
                    : "hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                {/* Top line: Type Icon + Key + Priority */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span title={typeInfo.label} className="flex-shrink-0">
                      {typeInfo.icon}
                    </span>
                    <span
                      className={`font-mono text-[11px] font-bold ${
                        isSelected ? "text-primary" : "text-foreground/90"
                      }`}
                    >
                      {task.code}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {getPriorityIcon(task.priority)}
                    {task.columnName && (
                      <span
                        className="text-[9px] px-1.5 py-0.2 rounded font-medium border"
                        style={{
                          backgroundColor: `${task.columnColor || "#64748b"}15`,
                          borderColor: `${task.columnColor || "#64748b"}40`,
                          color: task.columnColor || "#94a3b8",
                        }}
                      >
                        {task.columnName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h4
                  className={`text-xs leading-snug line-clamp-2 ${
                    isSelected ? "font-semibold text-foreground" : "font-normal text-foreground/80"
                  }`}
                  title={task.title}
                >
                  {task.title}
                </h4>

                {/* Footer: Assignee & Subtasks count */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                  <div className="flex items-center gap-1.5">
                    {task.assignee ? (
                      <span className="flex items-center gap-1 font-medium text-foreground/80">
                        <span className="w-4 h-4 rounded-full bg-secondary flex items-center justify-center font-bold text-[9px] border border-border">
                          {task.assignee.name.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="truncate max-w-[100px]">
                          {task.assignee.name.split(" ")[0]}
                        </span>
                      </span>
                    ) : (
                      <span className="italic text-muted-foreground/60">Не призначено</span>
                    )}
                  </div>

                  {task._count && task._count.subtasks > 0 && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      ✓ {task._count.subtasks}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="p-2.5 border-t border-border/80 bg-card/60">
        <button
          onClick={onOpenCreateTask}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 text-xs font-semibold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Створити задачу</span>
        </button>
      </div>
    </div>
  );
};
