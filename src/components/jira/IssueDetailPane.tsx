"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Paperclip,
  Film,
  FileText,
  Clock,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Check,
  X,
  MessageSquare,
  Bot,
  Send,
  MoreHorizontal,
  Trash2,
  Copy,
  ExternalLink,
  ChevronDown,
  Tag,
  Boxes,
  Zap,
  Bookmark,
  Bug,
  CheckSquare,
  Wrench,
  Layers,
  ArrowUp,
  ArrowDown,
  Minus,
  Search,
  UserX,
} from "lucide-react";
import { ColumnItem } from "@/components/board/ColumnCard";
import { formatTimeAgo } from "@/lib/utils";
import { JIRA_TASK_TYPES, getTaskTypeInfo, getPriorityIcon } from "./IssueListPane";

interface IssueDetailPaneProps {
  taskId: string | null;
  projectId: string;
  projectName: string;
  projectKey: string;
  columns: ColumnItem[];
  onTaskUpdated: () => void;
  onTaskDeleted: (taskId: string) => void;
  currentUser?: any;
}

export const IssueDetailPane: React.FC<IssueDetailPaneProps> = ({
  taskId,
  projectId,
  projectName,
  projectKey,
  columns,
  onTaskUpdated,
  onTaskDeleted,
  currentUser,
}) => {
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState("");

  // Subtasks & Comments
  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [activeActivityTab, setActiveActivityTab] = useState<"comments" | "ai" | "history">("comments");

  // Drag & drop file upload
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // AI recommendations
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);

  // Menus
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);

  // Assignee Management Permissions & State
  const canChangeAssignee = Boolean(
    currentUser && (currentUser.role === "ADMIN" || currentUser.role === "ENGINEER")
  );
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [clientUsers, setClientUsers] = useState<any[]>([]);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (canChangeAssignee && projectId) {
      fetch(`/api/projects/${projectId}/assignees`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) {
            setStaffUsers(data.staff || []);
            setClientUsers(data.projectClients || []);
          }
        })
        .catch(console.error);
    }
  }, [canChangeAssignee, projectId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        assigneeDropdownRef.current &&
        !assigneeDropdownRef.current.contains(e.target as Node)
      ) {
        setIsAssigneeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getUserInitials = (name?: string, email?: string) => {
    if (name?.trim()) {
      const parts = name.trim().split(" ");
      if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    return email ? email.slice(0, 2).toUpperCase() : "U";
  };

  const getUserRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return { label: "Адмін", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
      case "ENGINEER":
        return { label: "Інженер", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
      case "CLIENT":
        return { label: "Клієнт", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
      default:
        return { label: "Користувач", color: "bg-secondary text-foreground border-border" };
    }
  };

  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (taskId) {
      loadTaskDetails();
    } else {
      setTask(null);
    }
  }, [taskId]);

  const loadTaskDetails = async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data);
        setTitleValue(data.title || "");
        setDescValue(data.description || "");
      } else {
        const err = await res.json();
        setError(err.error || "Не вдалося завантажити задачу");
      }
    } catch (err: any) {
      setError(err.message || "Помилка зв'язку із сервером");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateField = async (fields: Record<string, any>) => {
    if (!taskId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });

      if (res.ok) {
        const updated = await res.json();
        setTask((prev: any) => ({ ...prev, ...updated }));
        onTaskUpdated();
      }
    } catch (err) {
      console.error("Update task error:", err);
    }
  };

  const handleSaveTitle = async () => {
    if (!titleValue.trim() || titleValue === task.title) {
      setIsEditingTitle(false);
      return;
    }
    await handleUpdateField({ title: titleValue.trim() });
    setIsEditingTitle(false);
  };

  const handleSaveDescription = async () => {
    await handleUpdateField({ description: descValue });
    setIsEditingDesc(false);
  };

  const handleChangeStatus = async (colId: string) => {
    setShowStatusMenu(false);
    await handleUpdateField({ columnId: colId });
  };

  const handleChangeType = async (typeId: string) => {
    setShowTypeMenu(false);
    const newContext = { ...(task?.aiContext || {}), type: typeId };
    await handleUpdateField({ aiContext: newContext });
  };

  const handleChangePriority = async (prio: string) => {
    setShowPriorityMenu(false);
    await handleUpdateField({ priority: prio });
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim() || !taskId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newSubtask.trim() }),
      });
      if (res.ok) {
        const sub = await res.json();
        setTask((prev: any) => ({
          ...prev,
          subtasks: [...(prev.subtasks || []), sub],
        }));
        setNewSubtask("");
        onTaskUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, isCompleted: boolean) => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/subtasks?subtaskId=${subtaskId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isCompleted }),
        }
      );
      if (res.ok) {
        setTask((prev: any) => ({
          ...prev,
          subtasks: prev.subtasks.map((s: any) =>
            s.id === subtaskId ? { ...s, isCompleted } : s
          ),
        }));
        onTaskUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !taskId || postingComment) return;
    try {
      setPostingComment(true);
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      if (res.ok) {
        const comment = await res.json();
        setTask((prev: any) => ({
          ...prev,
          comments: [comment, ...(prev.comments || [])],
        }));
        setNewComment("");
        onTaskUpdated();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPostingComment(false);
    }
  };

  const handleUploadFile = async (file: File) => {
    if (!taskId || !file) return;
    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/attachments`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const newAttachment = await res.json();
        setTask((prev: any) => ({
          ...prev,
          attachments: [newAttachment, ...(prev.attachments || [])],
        }));
        onTaskUpdated();
      } else {
        const err = await res.json();
        alert(err.error || "Не вдалося завантажити файл");
      }
    } catch (err: any) {
      alert(err.message || "Помилка при завантаженні");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleGetAiRecommendation = async () => {
    if (!taskId) return;
    try {
      setAiLoading(true);
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/ai-recommend`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setAiRecommendation(data.recommendation || "Рекомендацію згенеровано успішно");
        setActiveActivityTab("ai");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskId) return;
    if (!confirm(`Ви дійсно бажаєте видалити задачу ${task.code}?`)) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onTaskDeleted(taskId);
      } else {
        const err = await res.json();
        alert(err.error || "Не вдалося видалити задачу");
      }
    } catch (err: any) {
      alert(err.message || "Помилка видалення");
    }
  };

  if (!taskId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground select-none">
        <CheckSquare className="w-12 h-12 stroke-[1.2] opacity-30 mb-3" />
        <h3 className="text-sm font-semibold text-foreground">Оберіть задачу зі списку</h3>
        <p className="text-xs max-w-sm mt-1">
          Натисніть на будь-який тикет у середній колонці, щоб переглянути повні деталі, опис та історію.
        </p>
      </div>
    );
  }

  if (loading && !task) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-xs text-muted-foreground">
        Завантаження деталей задачі...
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-2">
        <AlertCircle className="w-6 h-6 text-destructive" />
        <span className="text-xs text-destructive">{error || "Задачу не знайдено"}</span>
      </div>
    );
  }

  const typeInfo = getTaskTypeInfo(task.aiContext, task.title);
  const currentColumn = columns.find((c) => c.id === task.columnId) || task.column;
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s: any) => s.isCompleted).length;
  const subtasksPercent = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  // Metadata from aiContext
  const componentsList = task.aiContext?.components || ["Core", "Frontend"];
  const labelsList = task.aiContext?.labels || ["v1.0", "support"];
  const resolution = task.aiContext?.resolution || (currentColumn?.isDoneColumn ? "Вирішено" : "Не вирішено");
  const storyPoints = task.aiContext?.storyPoints ?? 3;
  const sprintName = task.aiContext?.sprint || "Спринт 1 (Поточний)";

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-background/50">
      {/* 1. Breadcrumbs & Top Action Bar */}
      <div className="p-4 border-b border-border/80 flex flex-wrap items-center justify-between gap-3 bg-card/40 sticky top-0 z-10 backdrop-blur-md">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="hover:text-foreground transition-colors font-medium">
            {projectName}
          </span>
          <span>/</span>
          <span className="font-mono font-bold text-primary flex items-center gap-1">
            {typeInfo.icon}
            <span>{task.code}</span>
          </span>
        </div>

        {/* Action Buttons & Transitions */}
        <div className="flex items-center gap-2">
          {/* Quick Action: Edit */}
          <button
            onClick={() => setIsEditingTitle(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-border hover:bg-secondary text-foreground transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Редагувати</span>
          </button>

          {/* Quick Action: Comment */}
          <button
            onClick={() => {
              commentInputRef.current?.focus();
              commentInputRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-border hover:bg-secondary text-foreground transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Коментар</span>
          </button>

          {/* Quick Action: Assign to Me (Only for Admins & Engineers) */}
          {canChangeAssignee && currentUser && task.assigneeId !== currentUser.userId && (
            <button
              onClick={() => handleUpdateField({ assigneeId: currentUser.userId })}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-border hover:bg-secondary text-foreground transition-colors"
              title="Призначити цю задачу мені"
            >
              <User className="w-3.5 h-3.5" />
              <span>Призначити мені</span>
            </button>
          )}

          {/* Quick Action: Unassign from Me */}
          {canChangeAssignee && currentUser && task.assigneeId === currentUser.userId && (
            <button
              onClick={() => handleUpdateField({ assigneeId: null })}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-border/70 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Зняти призначення з себе"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Зняти з мене</span>
            </button>
          )}

          {/* Jira-style Workflow Status Transitions */}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold text-white transition-all shadow-sm"
              style={{ backgroundColor: currentColumn?.color || "#3b82f6" }}
            >
              <span>{currentColumn?.name || "Статус"}</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            </button>

            {showStatusMenu && (
              <div className="absolute right-0 mt-1 w-44 rounded-lg bg-card border border-border shadow-xl py-1 z-30 animate-in fade-in-50 zoom-in-95">
                <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/60">
                  Змінити статус
                </div>
                {columns.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleChangeStatus(c.id)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      <span>{c.name}</span>
                    </span>
                    {c.id === task.columnId && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* More Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Додаткові дії..."
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 mt-1 w-48 rounded-lg bg-card border border-border shadow-xl py-1 z-30 animate-in fade-in-50 zoom-in-95">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setShowMoreMenu(false);
                    alert("Посилання на задачу скопійовано в буфер обміну");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Копіювати посилання</span>
                </button>
                <button
                  onClick={handleGetAiRecommendation}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-primary hover:bg-primary/10 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>AI Аналіз задачі</span>
                </button>
                <div className="my-1 border-t border-border/80" />
                <button
                  onClick={handleDeleteTask}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Видалити задачу</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main 2-Column Split Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* Left Side: Content & Details (8 cols) */}
        <div className="lg:col-span-8 p-6 space-y-6">
          {/* Title block */}
          <div>
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                  autoFocus
                  className="flex-1 text-xl font-bold bg-secondary/50 px-3 py-1.5 rounded-lg border border-primary focus:outline-none text-foreground"
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setTitleValue(task.title);
                    setIsEditingTitle(false);
                  }}
                  className="p-2 rounded-lg border border-border text-muted-foreground hover:bg-secondary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                className="text-xl font-bold text-foreground tracking-tight hover:bg-secondary/40 px-2 py-1 -mx-2 rounded-lg cursor-pointer transition-colors"
                title="Натисніть для редагування назви"
              >
                {task.title}
              </h1>
            )}
          </div>

          {/* Details block (Jira styled table grid) */}
          <div className="rounded-xl border border-border bg-card/60 p-4 space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>Деталі задачі</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
              {/* Type */}
              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Тип:</span>
                <div className="relative">
                  <button
                    onClick={() => setShowTypeMenu(!showTypeMenu)}
                    className="flex items-center gap-1.5 font-semibold text-foreground hover:bg-secondary px-2 py-0.5 rounded transition-colors"
                  >
                    {typeInfo.icon}
                    <span>{typeInfo.label}</span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5" />
                  </button>

                  {showTypeMenu && (
                    <div className="absolute right-0 mt-1 w-36 rounded-lg bg-card border border-border shadow-xl py-1 z-30">
                      {Object.values(JIRA_TASK_TYPES).map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleChangeType(t.id)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-secondary"
                        >
                          {t.icon}
                          <span>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Priority */}
              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Приоритет:</span>
                <div className="relative">
                  <button
                    onClick={() => setShowPriorityMenu(!showPriorityMenu)}
                    className="flex items-center gap-1.5 font-semibold text-foreground hover:bg-secondary px-2 py-0.5 rounded transition-colors"
                  >
                    {getPriorityIcon(task.priority)}
                    <span className="capitalize">{task.priority.toLowerCase()}</span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5" />
                  </button>

                  {showPriorityMenu && (
                    <div className="absolute right-0 mt-1 w-36 rounded-lg bg-card border border-border shadow-xl py-1 z-30">
                      <button
                        onClick={() => handleChangePriority("URGENT")}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-secondary"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                        <span>Терміновий ⚡</span>
                      </button>
                      <button
                        onClick={() => handleChangePriority("HIGH")}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-amber-400 hover:bg-secondary"
                      >
                        <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
                        <span>Високий</span>
                      </button>
                      <button
                        onClick={() => handleChangePriority("MEDIUM")}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-secondary"
                      >
                        <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>Середній</span>
                      </button>
                      <button
                        onClick={() => handleChangePriority("LOW")}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-blue-400 hover:bg-secondary"
                      >
                        <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
                        <span>Низький</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Components */}
              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Компоненти:</span>
                <div className="flex flex-wrap gap-1">
                  {componentsList.map((comp: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.2 rounded bg-secondary text-[11px] font-mono text-muted-foreground border border-border/80"
                    >
                      {comp}
                    </span>
                  ))}
                </div>
              </div>

              {/* Labels */}
              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Мітки:</span>
                <div className="flex flex-wrap gap-1">
                  {labelsList.map((lbl: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.2 rounded bg-primary/10 text-primary text-[11px] font-medium border border-primary/20"
                    >
                      {lbl}
                    </span>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Статус:</span>
                <span
                  className="px-2 py-0.5 rounded text-[11px] font-semibold text-white"
                  style={{ backgroundColor: currentColumn?.color || "#3b82f6" }}
                >
                  {currentColumn?.name}
                </span>
              </div>

              {/* Resolution */}
              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Рішення:</span>
                <span className="font-medium text-foreground">
                  {resolution}
                </span>
              </div>
            </div>
          </div>

          {/* Description Block */}
          <div className="rounded-xl border border-border bg-card/60 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span>Опис</span>
              </h3>
              {!isEditingDesc && (
                <button
                  onClick={() => setIsEditingDesc(true)}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Редагувати
                </button>
              )}
            </div>

            {isEditingDesc ? (
              <div className="space-y-2">
                <textarea
                  rows={6}
                  value={descValue}
                  onChange={(e) => setDescValue(e.target.value)}
                  placeholder="Введіть детальний опис задачі..."
                  className="w-full text-xs p-3 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground resize-y leading-relaxed font-sans"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setDescValue(task.description || "");
                      setIsEditingDesc(false);
                    }}
                    className="px-3 py-1 rounded text-xs border border-border text-muted-foreground hover:bg-secondary"
                  >
                    Скасувати
                  </button>
                  <button
                    onClick={handleSaveDescription}
                    className="px-3.5 py-1 rounded text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  >
                    Зберегти опис
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingDesc(true)}
                className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap p-2 -m-2 rounded-lg hover:bg-secondary/30 cursor-pointer min-h-[4rem]"
                title="Натисніть для редагування опису"
              >
                {task.description ? (
                  task.description
                ) : (
                  <span className="italic text-muted-foreground/60">
                    Немає опису. Натисніть тут, щоб додати детальний опис...
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Attachments / Drag & Drop Dropzone */}
          <div className="rounded-xl border border-border bg-card/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Paperclip className="w-3.5 h-3.5 text-primary" />
                <span>Вкладені файли ({task.attachments?.length || 0})</span>
              </h3>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer ${
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-border/80 hover:border-primary/60 bg-secondary/10"
              }`}
            >
              <input
                type="file"
                id="file-upload-input"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleUploadFile(e.target.files[0]);
                  }
                }}
              />
              <label
                htmlFor="file-upload-input"
                className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
              >
                <Paperclip className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">
                  {uploadingFile ? "Завантаження файлу..." : "Перетягніть файли сюди або натисніть для вибору"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Підтримуються скріншоти, відео (mp4, webm), логи та документи
                </span>
              </label>
            </div>

            {/* Attachments list */}
            {task.attachments && task.attachments.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {task.attachments.map((att: any) => {
                  const isImage = att.mimeType?.startsWith("image/");
                  const isVideo = att.mimeType?.startsWith("video/");

                  return (
                    <a
                      key={att.id}
                      href={att.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group p-2 rounded-lg bg-secondary/30 border border-border/80 hover:border-primary/50 transition-all flex flex-col gap-1.5 overflow-hidden"
                    >
                      <div className="h-20 w-full rounded bg-secondary flex items-center justify-center overflow-hidden">
                        {isImage ? (
                          <img
                            src={att.fileUrl}
                            alt={att.fileName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : isVideo ? (
                          <Film className="w-6 h-6 text-primary" />
                        ) : (
                          <FileText className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-foreground truncate block">
                        {att.fileName}
                      </span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Subtasks block */}
          <div className="rounded-xl border border-border bg-card/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                <span>Підзадачі ({completedSubtasks}/{subtasks.length})</span>
              </h3>
              {subtasks.length > 0 && (
                <span className="text-[11px] font-mono font-medium text-muted-foreground">
                  {subtasksPercent}%
                </span>
              )}
            </div>

            {/* Subtask progress bar */}
            {subtasks.length > 0 && (
              <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${subtasksPercent}%` }}
                />
              </div>
            )}

            {/* Subtask list */}
            <div className="space-y-1.5">
              {subtasks.map((s: any) => (
                <label
                  key={s.id}
                  className="flex items-center gap-2 text-xs p-1.5 rounded hover:bg-secondary/40 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={s.isCompleted}
                    onChange={(e) => handleToggleSubtask(s.id, e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                  />
                  <span
                    className={`flex-1 ${
                      s.isCompleted
                        ? "line-through text-muted-foreground opacity-70"
                        : "text-foreground font-medium"
                    }`}
                  >
                    {s.title}
                  </span>
                </label>
              ))}
            </div>

            {/* Add subtask input */}
            <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="+ Додати нову підзадачу..."
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-secondary/30 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
              <button
                type="submit"
                disabled={!newSubtask.trim()}
                className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 text-xs font-medium disabled:opacity-40 transition-colors"
              >
                Додати
              </button>
            </form>
          </div>

          {/* Activity / Comments Block */}
          <div className="rounded-xl border border-border bg-card/60 p-4 space-y-4">
            {/* Tabs */}
            <div className="flex items-center justify-between border-b border-border/80 pb-2">
              <div className="flex items-center gap-3 text-xs">
                <button
                  onClick={() => setActiveActivityTab("comments")}
                  className={`pb-1 font-semibold transition-colors relative ${
                    activeActivityTab === "comments"
                      ? "text-primary border-b-2 border-primary -mb-2.5"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Коментарі ({task.comments?.length || 0})
                </button>
                <button
                  onClick={() => setActiveActivityTab("ai")}
                  className={`pb-1 font-semibold flex items-center gap-1 transition-colors relative ${
                    activeActivityTab === "ai"
                      ? "text-primary border-b-2 border-primary -mb-2.5"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>ШІ-Асистент</span>
                </button>
                <button
                  onClick={() => setActiveActivityTab("history")}
                  className={`pb-1 font-semibold transition-colors relative ${
                    activeActivityTab === "history"
                      ? "text-primary border-b-2 border-primary -mb-2.5"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Історія
                </button>
              </div>

              {activeActivityTab === "comments" && (
                <button
                  onClick={handleGetAiRecommendation}
                  disabled={aiLoading}
                  className="flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{aiLoading ? "Генерація..." : "AI Рекомендація"}</span>
                </button>
              )}
            </div>

            {/* Tab: Comments */}
            {activeActivityTab === "comments" && (
              <div className="space-y-4">
                {/* New Comment Box */}
                <form onSubmit={handleAddComment} className="space-y-2">
                  <textarea
                    ref={commentInputRef}
                    rows={3}
                    placeholder="Напишіть коментар або питання команді..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full text-xs p-3 rounded-lg bg-secondary/30 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground resize-none"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="submit"
                      disabled={!newComment.trim() || postingComment}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{postingComment ? "Надсилання..." : "Коментувати"}</span>
                    </button>
                  </div>
                </form>

                {/* Comments List */}
                <div className="space-y-3 pt-2 divide-y divide-border/50">
                  {task.comments && task.comments.length > 0 ? (
                    task.comments.map((c: any) => (
                      <div key={c.id} className="pt-3 first:pt-0 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center font-bold text-[10px] border border-border">
                              {c.authorType === "AI_ASSISTANT" ? (
                                <Bot className="w-3.5 h-3.5 text-primary" />
                              ) : (
                                (c.author?.name || c.authorName || "U")[0].toUpperCase()
                              )}
                            </div>
                            <span className="font-semibold text-foreground">
                              {c.authorType === "AI_ASSISTANT"
                                ? "STsup AI Assistant"
                                : c.author?.name || c.authorName || "Користувач"}
                            </span>
                            {c.authorType === "AI_ASSISTANT" && (
                              <span className="px-1.5 py-0.2 rounded bg-primary/20 text-primary font-mono text-[9px] font-bold">
                                AI
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {formatTimeAgo(c.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/90 whitespace-pre-wrap pl-8 leading-relaxed">
                          {c.content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      Коментарів поки немає. Будьте першим, хто залишить коментар!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: AI Assistant */}
            {activeActivityTab === "ai" && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/25 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>Аналіз задачі за допомогою ШІ</span>
                    </span>
                    <button
                      onClick={handleGetAiRecommendation}
                      disabled={aiLoading}
                      className="px-2.5 py-1 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                    >
                      {aiLoading ? "Аналіз..." : "Оновити аналіз"}
                    </button>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {aiRecommendation ||
                      "ШІ-асистент може проаналізувати контекст задачі, помилку або код та надати план вирішення."}
                  </p>
                </div>
              </div>
            )}

            {/* Tab: History */}
            {activeActivityTab === "history" && (
              <div className="space-y-2 text-xs text-muted-foreground py-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>
                    Задачу створено {new Date(task.createdAt).toLocaleString("uk-UA")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>
                    Останнє оновлення: {new Date(task.updatedAt).toLocaleString("uk-UA")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Metadata / Jira Sidebar (4 cols) */}
        <div className="lg:col-span-4 p-5 space-y-6 bg-card/20">
          {/* People Section */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Люди
            </h4>

            {/* Assignee */}
            <div className="space-y-1 relative" ref={assigneeDropdownRef}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground block">Виконавець:</span>
                {canChangeAssignee && (
                  <span className="text-[10px] text-primary/80 font-medium">
                    (Клікніть для зміни)
                  </span>
                )}
              </div>

              {canChangeAssignee ? (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen);
                      setAssigneeSearch("");
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border text-left transition-all ${
                      isAssigneeDropdownOpen
                        ? "bg-secondary border-primary/60 shadow-sm"
                        : "bg-secondary/40 border-border hover:bg-secondary hover:border-border/80 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${
                        task.assignee
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "bg-muted text-muted-foreground border border-border"
                      }`}>
                        {task.assignee ? getUserInitials(task.assignee.name, task.assignee.email) : "?"}
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-semibold text-foreground block truncate">
                          {task.assignee ? task.assignee.name : "Не призначено"}
                        </span>
                        {task.assignee?.email && (
                          <span className="text-[10px] text-muted-foreground block truncate font-mono">
                            {task.assignee.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform flex-shrink-0 ml-1 ${
                      isAssigneeDropdownOpen ? "rotate-180 text-primary" : ""
                    }`} />
                  </button>

                  {isAssigneeDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-72 rounded-xl bg-card border border-border shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95">
                      {/* Search box */}
                      <div className="relative mb-2">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Пошук користувача..."
                          value={assigneeSearch}
                          onChange={(e) => setAssigneeSearch(e.target.value)}
                          autoFocus
                          className="w-full text-xs pl-8 pr-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                        />
                      </div>

                      <div className="max-h-60 overflow-y-auto space-y-0.5">
                        {/* Option: Unassigned */}
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateField({ assigneeId: null });
                            setIsAssigneeDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                            !task.assigneeId
                              ? "bg-primary/15 text-primary font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px]">
                              ?
                            </div>
                            <span>Не призначено</span>
                          </div>
                          {!task.assigneeId && <Check className="w-3.5 h-3.5 text-primary" />}
                        </button>

                        {/* Quick option: Assign to Me */}
                        {currentUser && task.assigneeId !== currentUser.userId && (
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateField({ assigneeId: currentUser.userId });
                              setIsAssigneeDropdownOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[9px]">
                                {getUserInitials(currentUser.name, currentUser.email)}
                              </div>
                              <span className="font-semibold">Призначити мені ({currentUser.name})</span>
                            </div>
                          </button>
                        )}

                        <div className="my-1 border-t border-border/60" />

                        {/* Section 1: Staff (Admins & Engineers) */}
                        <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1 flex items-center justify-between">
                          <span>Співробітники (Підтримка/Адмін)</span>
                          <span className="text-[9px] font-normal text-muted-foreground">({staffUsers.length})</span>
                        </div>

                        {staffUsers
                          .filter((u) => {
                            if (!assigneeSearch.trim()) return true;
                            const query = assigneeSearch.toLowerCase();
                            return (
                              u.name?.toLowerCase().includes(query) ||
                              u.email?.toLowerCase().includes(query)
                            );
                          })
                          .map((u) => {
                            const isSelected = task.assigneeId === u.id;
                            const roleBadge = getUserRoleBadge(u.role);
                            return (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => {
                                  handleUpdateField({ assigneeId: u.id });
                                  setIsAssigneeDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                                  isSelected
                                    ? "bg-primary/15 text-foreground font-medium"
                                    : "text-foreground hover:bg-secondary"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-[10px] text-foreground flex-shrink-0">
                                    {getUserInitials(u.name, u.email)}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-semibold truncate block">{u.name}</span>
                                      <span className={`text-[9px] px-1 py-0.2 rounded border ${roleBadge.color}`}>
                                        {roleBadge.label}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground truncate block font-mono">
                                      {u.email}
                                    </span>
                                  </div>
                                </div>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-primary flex-shrink-0 ml-1.5" />
                                )}
                              </button>
                            );
                          })}

                        {/* Section 2: Clients of THIS project only */}
                        <div className="my-1 border-t border-border/60" />
                        <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1 flex items-center justify-between">
                          <span>Клієнти цього проєкту</span>
                          <span className="text-[9px] font-normal text-muted-foreground">({clientUsers.length})</span>
                        </div>

                        {clientUsers.length === 0 ? (
                          <div className="px-2 py-1.5 text-[11px] text-muted-foreground/60 italic">
                            Клієнтів до цього проєкту не підключено
                          </div>
                        ) : (
                          clientUsers
                            .filter((u) => {
                              if (!assigneeSearch.trim()) return true;
                              const query = assigneeSearch.toLowerCase();
                              return (
                                u.name?.toLowerCase().includes(query) ||
                                u.email?.toLowerCase().includes(query)
                              );
                            })
                            .map((u) => {
                              const isSelected = task.assigneeId === u.id;
                              const roleBadge = getUserRoleBadge(u.role);
                              return (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => {
                                    handleUpdateField({ assigneeId: u.id });
                                    setIsAssigneeDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                                    isSelected
                                      ? "bg-primary/15 text-foreground font-medium"
                                      : "text-foreground hover:bg-secondary"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-[10px] text-foreground flex-shrink-0">
                                      {getUserInitials(u.name, u.email)}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-semibold truncate block">{u.name}</span>
                                        <span className={`text-[9px] px-1 py-0.2 rounded border ${roleBadge.color}`}>
                                          {roleBadge.label}
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-muted-foreground truncate block font-mono">
                                        {u.email}
                                      </span>
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-primary flex-shrink-0 ml-1.5" />
                                  )}
                                </button>
                              );
                            })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Read-only for Client */
                <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border/60 cursor-default">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                    {task.assignee ? getUserInitials(task.assignee.name, task.assignee.email) : "?"}
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-semibold text-foreground truncate block">
                      {task.assignee ? task.assignee.name : "Не призначено"}
                    </span>
                    {task.assignee?.email && (
                      <span className="text-[10px] text-muted-foreground truncate block font-mono">
                        {task.assignee.email}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Reporter / Creator */}
            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground block">Автор (Reporter):</span>
              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-secondary/20">
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center font-bold text-[10px] text-foreground">
                  {task.creator ? task.creator.name[0].toUpperCase() : "A"}
                </div>
                <span className="text-xs font-medium text-foreground truncate">
                  {task.creator ? task.creator.name : "Адміністратор"}
                </span>
              </div>
            </div>
          </div>

          {/* Dates Section */}
          <div className="space-y-2.5 pt-3 border-t border-border/60">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Дати
            </h4>

            <div className="flex items-center justify-between text-xs py-0.5">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Створено:</span>
              </span>
              <span className="font-medium text-foreground">
                {new Date(task.createdAt).toLocaleDateString("uk-UA")}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs py-0.5">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Оновлено:</span>
              </span>
              <span className="font-medium text-foreground">
                {formatTimeAgo(task.updatedAt)}
              </span>
            </div>

            {/* Due date */}
            <div className="space-y-1 pt-1">
              <span className="text-[11px] text-muted-foreground block">
                Термін виконання:
              </span>
              <input
                type="date"
                value={
                  task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
                }
                onChange={(e) =>
                  handleUpdateField({ dueDate: e.target.value ? e.target.value : null })
                }
                className="w-full text-xs p-1.5 rounded-lg bg-secondary/40 border border-border text-foreground"
              />
            </div>
          </div>

          {/* Time Tracking Section */}
          <div className="space-y-3 pt-3 border-t border-border/60">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Облік часу
            </h4>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-secondary/30 border border-border/60">
                <span className="text-[10px] text-muted-foreground block">Оцінка</span>
                <span className="font-bold text-foreground font-mono">2d</span>
              </div>
              <div className="p-2 rounded-lg bg-secondary/30 border border-border/60">
                <span className="text-[10px] text-muted-foreground block">Витрачено</span>
                <span className="font-bold text-emerald-400 font-mono">1d</span>
              </div>
              <div className="p-2 rounded-lg bg-secondary/30 border border-border/60">
                <span className="text-[10px] text-muted-foreground block">Залишилось</span>
                <span className="font-bold text-blue-400 font-mono">1d</span>
              </div>
            </div>

            {/* Time progress bar */}
            <div className="space-y-1">
              <div className="w-full h-2 rounded-full bg-secondary overflow-hidden flex">
                <div className="h-full bg-emerald-500" style={{ width: "50%" }} />
                <div className="h-full bg-blue-500" style={{ width: "50%" }} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Витрачено 50%</span>
                <span>Загалом 2 дні</span>
              </div>
            </div>
          </div>

          {/* Agile Section */}
          <div className="space-y-3 pt-3 border-t border-border/60">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Agile
            </h4>

            <div className="flex items-center justify-between text-xs py-1 border-b border-border/40">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Спринт:</span>
              </span>
              <span className="font-medium text-foreground">
                {sprintName}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-b border-border/40">
              <span className="text-muted-foreground">Story Points:</span>
              <span className="px-2 py-0.5 rounded-full bg-secondary font-mono font-bold text-foreground text-xs border border-border">
                {storyPoints}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
