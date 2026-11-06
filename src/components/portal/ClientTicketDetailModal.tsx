"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Send,
  Paperclip,
  CheckCircle2,
  Clock,
  User,
  Shield,
  Bot,
  FileText,
  Download,
  AlertCircle,
  Copy,
  Check,
  Loader2,
  Plus,
  MessageSquare,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
  Pencil,
  ArrowRightLeft,
  History,
  ChevronDown,
} from "lucide-react";
import { TaskHistoryTimeline } from "@/components/common/TaskHistoryTimeline";
import { formatTimeAgo } from "@/lib/utils";

interface AttachmentItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

interface CommentItem {
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

interface AuditLogItem {
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

function renderAuditLogMessage(log: AuditLogItem): { title: string; subtitle?: string } {
  const details = log.details || {};
  const changes = details.changes || {};

  if (changes.action === "RETURNED_TO_SUPPORT_BY_CLIENT") {
    return {
      title: "Повернуто до служби підтримки",
      subtitle: details.replyCommentAdded ? "Надано відповідь та передано інженеру" : "Передано в активну чергу підтримки",
    };
  }

  const items: string[] = [];
  if (changes.priority) {
    const pMap: Record<string, string> = {
      LOW: "Низький",
      MEDIUM: "Середній",
      HIGH: "Високий",
      URGENT: "Терміновий",
      CRITICAL: "Терміновий",
    };
    const oldP = pMap[changes.priority.old] || changes.priority.old;
    const newP = pMap[changes.priority.new] || changes.priority.new;
    items.push(`Змінено критичність: ${oldP} ➔ ${newP}`);
  }
  if (changes.title) {
    items.push(`Змінено назву: «${changes.title.new}»`);
  }
  if (changes.description) {
    items.push("Оновлено опис звернення");
  }
  if (changes.status) {
    items.push(`Змінено статус: ${changes.status.old} ➔ ${changes.status.new}`);
  }

  if (items.length > 0) {
    return {
      title: items[0],
      subtitle: items.length > 1 ? items.slice(1).join(" • ") : undefined,
    };
  }

  return { title: "Оновлено параметри задачі" };
}

interface ClientTicketDetailModalProps {
  taskId: string | null;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onTicketUpdated?: () => void;
  currentUser?: any;
}

function isTicketAwaitingResponse(task: any, currentUserId?: string): boolean {
  if (!task) return false;
  if (task.column?.isDoneColumn) return false;
  const colName = (task.column?.name || "").toLowerCase();
  if (
    colName.includes("готова") ||
    colName.includes("done") ||
    colName.includes("resolved") ||
    colName.includes("вирішено") ||
    colName.includes("закрито") ||
    colName.includes("closed")
  ) {
    return false;
  }
  if (task.aiContext?.isClosed) return false;

  // 1. Explicit flag in aiContext
  if (task.aiContext?.awaitingClient === true) return true;

  // 2. Assigned to current client or someone with role CLIENT
  if (currentUserId && (task.assigneeId === currentUserId || task.assignee?.id === currentUserId)) {
    return true;
  }
  if (task.assignee && task.assignee.role === "CLIENT") {
    return true;
  }

  // 3. Column name indicates awaiting client
  if (
    colName.includes("очікує відповіді") ||
    colName.includes("очікує клієнт") ||
    colName.includes("waiting")
  ) {
    return true;
  }

  return false;
}

export const ClientTicketDetailModal: React.FC<ClientTicketDetailModalProps> = ({
  taskId,
  projectId,
  isOpen,
  onClose,
  onTicketUpdated,
  currentUser,
}) => {
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [returningToSupport, setReturningToSupport] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit ticket state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [savingEdit, setSavingEdit] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const isTaskClosed = Boolean(
    task?.column?.isDoneColumn ||
    task?.aiContext?.isClosed ||
    ["готово", "done", "resolved", "вирішено", "закрито", "closed"].includes((task?.column?.name || "").toLowerCase())
  );

  const isAuthor = Boolean(
    currentUser && (task?.creatorId === currentUser.id || task?.creator?.id === currentUser.id)
  );

  // All client representatives of the project can edit active tickets of their organization
  const canEdit = Boolean(currentUser && !isTaskClosed);

  const isAssigneeClient = useMemo(() => {
    if (!task?.assignee) return false;
    if (task.assignee.role === "CLIENT") return true;
    if (currentUser?.role === "CLIENT" && (task.assignee.id === currentUser.id || task.assigneeId === currentUser.id)) return true;
    if (task.creator?.role === "CLIENT" && task.assignee.id === task.creator.id) return true;
    if (task.creatorId && task.assignee.id === task.creatorId && task.assignee.role !== "ADMIN" && task.assignee.role !== "ENGINEER") return true;
    return false;
  }, [task?.assignee, task?.creator, task?.creatorId, task?.assigneeId, currentUser]);

  const isAssigneeMe = Boolean(
    currentUser && task?.assignee && (task.assignee.id === currentUser.id || task.assigneeId === currentUser.id)
  );

  const isWaitingForResponse = useMemo(() => {
    return isTicketAwaitingResponse(task, currentUser?.id);
  }, [task, currentUser?.id]);

  const sortedComments = useMemo(() => {
    if (!task?.comments || !Array.isArray(task.comments)) return [];
    return [...task.comments].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [task?.comments]);

  const loadTask = async () => {
    if (!taskId || !projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data);
        setEditTitle(data.title || "");
        setEditDescription(data.description || "");
        setEditPriority(data.priority === "CRITICAL" ? "URGENT" : (data.priority || "MEDIUM"));
        setTimeout(() => {
          commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 150);
      }
    } catch (err) {
      console.error("Error loading ticket:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && taskId && projectId) {
      loadTask();
      setReplyText("");
      setError(null);
      setIsEditing(false);
    } else {
      setTask(null);
      setIsEditing(false);
    }
  }, [isOpen, taskId, projectId]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !projectId || !editTitle.trim() || savingEdit) return;

    setSavingEdit(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription,
          priority: editPriority,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Не вдалося зберегти зміни звернення");
      }

      const updated = await res.json();
      setTask((prev: any) => ({
        ...prev,
        title: updated.title,
        description: updated.description,
        priority: updated.priority,
      }));
      setIsEditing(false);
      onTicketUpdated?.();
      await loadTask();
    } catch (err: any) {
      console.error("Save edit error:", err);
      setError(err.message || "Помилка при збереженні змін");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleReturnToSupport = async (includeReply = false) => {
    if (!task || !projectId || returningToSupport) return;

    setReturningToSupport(true);
    setError(null);

    try {
      const commentText = includeReply ? replyText.trim() : "";
      const res = await fetch(`/api/projects/${projectId}/tasks/${task.id}/return-to-support`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: commentText || undefined }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Не вдалося повернути звернення до служби підтримки");
      }

      const result = await res.json();
      if (result.task) {
        setTask(result.task);
      } else {
        await loadTask();
      }

      setReplyText("");
      onTicketUpdated?.();

      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    } catch (err: any) {
      console.error("Return to support error:", err);
      setError(err.message || "Помилка при поверненні звернення до служби підтримки");
    } finally {
      setReturningToSupport(false);
    }
  };

  // Support paste event (Ctrl+V) for replying with screenshots
  useEffect(() => {
    if (!isOpen || !task) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            e.preventDefault();
            const ext = blob.type.split("/")[1] || "png";
            const file = new File([blob], `screenshot-${Date.now()}.${ext}`, { type: blob.type });
            await uploadSingleFile(file);
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen, task]);

  if (!isOpen) return null;

  const uploadSingleFile = async (file: File) => {
    if (!task) return;
    setUploadingFile(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/projects/${projectId}/tasks/${task.id}/attachments`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Не вдалося завантажити файл");
      }

      await loadTask();
      onTicketUpdated?.();
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Помилка завантаження файлу");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !task) return;

    setSendingReply(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyText.trim(),
          authorType: "USER",
        }),
      });

      if (!res.ok) {
        throw new Error("Не вдалося надіслати повідомлення");
      }

      setReplyText("");
      await loadTask();
      onTicketUpdated?.();

      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      console.error("Send reply error:", err);
      setError(err.message || "Помилка відправки повідомлення");
    } finally {
      setSendingReply(false);
    }
  };

  const handleCopyCode = () => {
    if (!task?.code) return;
    navigator.clipboard.writeText(task.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "CRITICAL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            🔴 Критична
          </span>
        );
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            🟠 Висока
          </span>
        );
      case "LOW":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            🟢 Низька
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            🔵 Звичайна
          </span>
        );
    }
  };

  const isImageFile = (url: string, mime?: string) => {
    if (mime?.startsWith("image/")) return true;
    return /\.(png|jpe?g|gif|webp|svg)$/i.test(url);
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border/80 flex items-center justify-between bg-card/60 backdrop-blur-md">
          <div className="flex items-center gap-2.5 flex-wrap">
            {task && (
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary/60 hover:bg-secondary border border-border text-xs font-mono font-bold text-primary transition-colors"
                title="Копіювати номер звернення"
              >
                <span>{task.code}</span>
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 opacity-60" />}
              </button>
            )}

            {task?.column && (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white shadow-xs"
                style={{ backgroundColor: task.column.color || "#3b82f6" }}
              >
                {task.column.name}
              </span>
            )}

            {task && getPriorityBadge(task.priority)}

            {task?.createdAt && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatTimeAgo(task.createdAt)}</span>
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading && !task ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs">Завантаження звернення...</span>
          </div>
        ) : task ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Awaiting response banner with Return to Support action */}
            {isWaitingForResponse && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0 font-bold">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">
                      Служба підтримки очікує вашої відповіді
                    </div>
                    <div className="text-muted-foreground text-[11px] leading-relaxed">
                      Надайте коментар з уточненнями нижче або натисніть кнопку, щоб повернути звернення в роботу
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleReturnToSupport(false)}
                  disabled={returningToSupport || sendingReply}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all flex-shrink-0 disabled:opacity-50"
                  title="Повернути задачу в роботу інженеру підтримки"
                >
                  {returningToSupport ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Повернення...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Повернути в підтримку</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Title & Description */}
            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-4">
                <div className="flex items-center justify-between border-b border-primary/20 pb-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Pencil className="w-4 h-4 text-primary" />
                    <span>Редагування звернення</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Власник звернення може змінити назву, критичність та опис
                  </span>
                </div>

                {/* Title Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <span>Тема / Назва звернення</span>
                    <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Коротко вкажіть суть проблеми..."
                    className="w-full text-sm font-medium px-3 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    required
                  />
                </div>

                {/* Priority Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Критичність (Пріоритет)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "LOW", label: "🟢 Низька", desc: "Дрібне питання" },
                      { id: "MEDIUM", label: "🔵 Звичайна", desc: "Стандартна задача" },
                      { id: "HIGH", label: "🟠 Висока", desc: "Впливає на роботу" },
                      { id: "URGENT", label: "🔴 Критична", desc: "Повна зупинка" },
                    ].map((p) => {
                      const isSelected = editPriority === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setEditPriority(p.id as any)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "bg-primary/15 border-primary text-foreground font-semibold ring-1 ring-primary shadow-xs"
                              : "bg-card/70 border-border/80 text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                          }`}
                        >
                          <div className="text-xs font-bold">{p.label}</div>
                          <div className="text-[10px] opacity-75">{p.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description Textarea */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Детальний опис
                  </label>
                  <textarea
                    rows={4}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Детально опишіть проблему, деталі або запитання..."
                    className="w-full text-xs p-3 rounded-lg bg-card border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground resize-y leading-relaxed"
                  />
                </div>

                {/* Actions: Save & Cancel */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-primary/20">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditTitle(task.title);
                      setEditDescription(task.description || "");
                      setEditPriority(task.priority === "CRITICAL" ? "URGENT" : (task.priority || "MEDIUM"));
                    }}
                    disabled={savingEdit}
                    className="px-3 py-1.5 rounded-lg border border-border hover:bg-secondary text-xs font-medium text-foreground transition-colors"
                  >
                    Скасувати
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit || !editTitle.trim()}
                    className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
                  >
                    {savingEdit ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Збереження...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Зберегти зміни</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h1 className="text-lg font-bold text-foreground leading-snug flex-1">{task.title}</h1>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditTitle(task.title);
                        setEditDescription(task.description || "");
                        setEditPriority(task.priority === "CRITICAL" ? "URGENT" : (task.priority || "MEDIUM"));
                        setIsEditing(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-secondary/80 hover:bg-secondary text-foreground border border-border/80 transition-colors shadow-xs flex-shrink-0 cursor-pointer"
                      title="Редагувати назву, опис та критичність"
                    >
                      <Pencil className="w-3.5 h-3.5 text-primary" />
                      <span>Редагувати</span>
                    </button>
                  )}
                  {isTaskClosed && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Вирішено</span>
                    </span>
                  )}
                </div>
                <div className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed p-3.5 rounded-xl bg-secondary/30 border border-border/80">
                  {task.description || "Без додаткового опису"}
                </div>
              </div>
            )}

            {/* Meta Cards: Creator & Assigned Engineer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Creator Card */}
              <div className="p-3 rounded-xl bg-secondary/20 border border-border/60 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-8 h-8 rounded-full bg-secondary text-foreground flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {task.creator ? task.creator.name.slice(0, 2).toUpperCase() : "К"}
                  </div>
                  <div className="truncate">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Автор звернення
                    </div>
                    <div className="font-semibold text-foreground truncate">
                      {isAuthor ? "Ви (Автор)" : task.creator ? task.creator.name : "Клієнт"}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary text-muted-foreground border border-border flex-shrink-0">
                  {isAuthor ? "Ваше" : "Організація"}
                </span>
              </div>

              {/* Assignee / Responsible Card */}
              <div className="p-3 rounded-xl bg-secondary/20 border border-border/60 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 truncate">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                      isAssigneeClient
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : task.assignee
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-secondary text-muted-foreground border border-border"
                    }`}
                  >
                    {task.assignee ? (
                      task.assignee.name.slice(0, 2).toUpperCase()
                    ) : (
                      <User className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="truncate">
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      {isAssigneeClient
                        ? "Очікує відповіді від"
                        : "Відповідальний інженер"}
                    </div>
                    <div className="font-semibold text-foreground truncate">
                      {task.assignee ? (
                        isAssigneeClient
                          ? (isAssigneeMe ? "Ви (Клієнт)" : `${task.assignee.name} (Клієнт)`)
                          : task.assignee.name
                      ) : (
                        "Очікує призначення інженера"
                      )}
                    </div>
                  </div>
                </div>
                {task.assignee ? (
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-medium flex items-center gap-1 flex-shrink-0 ${
                      isAssigneeClient
                        ? "bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {isAssigneeClient ? (
                      <>
                        <AlertCircle className="w-3 h-3" />
                        <span>Клієнт</span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-3 h-3" />
                        <span>Інженер підтримки</span>
                      </>
                    )}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-secondary text-muted-foreground border border-border flex items-center gap-1 flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>В черзі</span>
                  </span>
                )}
              </div>
            </div>

            {/* Attachments Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-primary" />
                  <span>Вкладені файли та скріншоти ({task.attachments?.length || 0})</span>
                </span>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-colors"
                >
                  {uploadingFile ? (
                    <Loader2 className="w-3 h-3 animate-spin text-primary" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                  <span>Додати файл</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      uploadSingleFile(e.target.files[0]);
                    }
                  }}
                />
              </div>

              {task.attachments && task.attachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {task.attachments.map((att: AttachmentItem) => {
                    const isImg = isImageFile(att.fileUrl, att.mimeType);
                    return (
                      <a
                        key={att.id}
                        href={att.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2 rounded-xl bg-secondary/40 hover:bg-secondary/70 border border-border transition-colors group"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          {isImg ? (
                            <img
                              src={att.fileUrl}
                              alt={att.fileName}
                              className="w-8 h-8 rounded-lg object-cover border border-border flex-shrink-0"
                            />
                          ) : (
                            <FileText className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                          )}
                          <div className="truncate">
                            <span className="font-semibold text-xs text-foreground block truncate group-hover:text-primary transition-colors">
                              {att.fileName}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatFileSize(att.fileSize)} • {formatTimeAgo(att.createdAt)}
                            </span>
                          </div>
                        </div>
                        <Download className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground/80 italic p-3 rounded-xl bg-secondary/15 border border-border/40 text-center">
                  До цього звернення файлів ще не прикріплено. Ви можете додати їх або вставити скріншот через Ctrl+V.
                </div>
              )}
            </div>

            {/* Audit / Activity History Section */}
            <div className="rounded-xl border border-border/70 bg-secondary/15 overflow-hidden">
              <button
                type="button"
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-secondary/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <History className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold text-foreground">
                    Історія активності та змін ({task.auditLogs?.length || 0})
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform ${
                    isHistoryOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isHistoryOpen && (
                <div className="p-3 pt-2 border-t border-border/50">
                  <TaskHistoryTimeline
                    auditLogs={task.auditLogs || []}
                    taskCreatedAt={task.createdAt}
                    taskCreator={task.creator}
                    currentUser={currentUser}
                    compact
                  />
                </div>
              )}
            </div>

            {/* Conversation Timeline (Comments) */}
            <div className="space-y-3 pt-2 border-t border-border/80">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-primary" />
                <span>Діалог з підтримкою ({sortedComments.length})</span>
              </span>

              <div className="space-y-3">
                {sortedComments.length > 0 ? (
                  sortedComments.map((comment: CommentItem) => {
                    const isAi = comment.authorType === "AI_ASSISTANT";
                    const isClientMe = comment.author?.id === currentUser?.id;
                    const isClientColleague = !isClientMe && comment.author?.role === "CLIENT";
                    const isStaff = !isAi && !isClientMe && !isClientColleague;

                    return (
                      <div
                        key={comment.id}
                        className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-colors ${
                          isStaff
                            ? "bg-primary/5 border-primary/20 shadow-xs"
                            : isClientColleague
                            ? "bg-blue-500/[0.04] border-blue-500/20"
                            : isAi
                            ? "bg-purple-500/5 border-purple-500/20"
                            : "bg-secondary/30 border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                isStaff
                                  ? "bg-primary text-primary-foreground"
                                  : isClientColleague
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : isAi
                                  ? "bg-purple-500 text-white"
                                  : "bg-secondary text-foreground"
                              }`}
                            >
                              {isAi ? (
                                <Bot className="w-3.5 h-3.5" />
                              ) : (
                                (comment.author?.name || "К").slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <span className="font-semibold text-foreground">
                              {isClientMe
                                ? "Ви (Клієнт)"
                                : isClientColleague
                                ? comment.author?.name || "Колега"
                                : isAi
                                ? "AI Асистент"
                                : comment.author?.name || "Служба підтримки"}
                            </span>
                            {isStaff && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/20 text-primary">
                                Служба підтримки
                              </span>
                            )}
                            {isClientColleague && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                                Організація
                              </span>
                            )}
                            {isClientMe && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-secondary text-muted-foreground border border-border">
                                Ви
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {formatTimeAgo(comment.createdAt)}
                          </span>
                        </div>
                        <div className="text-foreground/90 whitespace-pre-line leading-relaxed pl-8">
                          {comment.content}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-muted-foreground/80 italic p-4 rounded-xl bg-secondary/15 border border-border/40 text-center">
                    Поки немає коментарів. Напишіть нижче, якщо у вас є уточнення або додаткові питання.
                  </div>
                )}
                <div ref={commentsEndRef} />
              </div>

              {/* Reply Input Form */}
              <form onSubmit={handleSendReply} className="space-y-2 pt-2">
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Напишіть повідомлення команді підтримки (підтримується Ctrl+V для скріншотів)..."
                  className="w-full text-xs p-3 rounded-xl bg-secondary/40 border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary font-normal leading-relaxed resize-y"
                  disabled={sendingReply}
                />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <span className="text-[10px] text-muted-foreground">
                    Натисніть <kbd className="px-1 py-0.5 rounded bg-secondary font-mono text-[9px]">Ctrl+V</kbd> щоб вставити скріншот
                  </span>
                  <div className="flex items-center justify-end gap-2 flex-wrap">
                    {isWaitingForResponse ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleReturnToSupport(Boolean(replyText.trim()))}
                          disabled={returningToSupport || sendingReply}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-all disabled:opacity-50"
                          title="Надіслати відповідь та повернути звернення до служби підтримки"
                        >
                          {returningToSupport ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Повернення...</span>
                            </>
                          ) : (
                            <>
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                              <span>
                                {replyText.trim()
                                  ? "Відповісти та повернути в підтримку"
                                  : "Повернути до підтримки"}
                              </span>
                            </>
                          )}
                        </button>
                        {replyText.trim() && (
                          <button
                            type="submit"
                            disabled={sendingReply || returningToSupport}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-all disabled:opacity-50"
                            title="Надіслати тільки коментар без зміни статусу"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Тільки коментар</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        type="submit"
                        disabled={sendingReply || !replyText.trim()}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingReply ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Відправка...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Надіслати відповідь</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/80 flex items-center justify-between bg-card/60 backdrop-blur-md">
          <span className="text-[11px] text-muted-foreground">
            Статус тікета оновлюється автоматично у режимі реального часу
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
};
