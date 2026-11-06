"use client";

import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
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
    avatarUrl?: string | null;
  } | null;
}

interface ClientTicketDetailModalProps {
  taskId: string | null;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onTicketUpdated?: () => void;
  currentUser?: any;
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
  const [uploadingFile, setUploadingFile] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const loadTask = async () => {
    if (!taskId || !projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data);
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
    } else {
      setTask(null);
    }
  }, [isOpen, taskId, projectId]);

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

            {/* Title & Description */}
            <div className="space-y-2">
              <h1 className="text-lg font-bold text-foreground leading-snug">{task.title}</h1>
              <div className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed p-3.5 rounded-xl bg-secondary/30 border border-border/80">
                {task.description || "Без додаткового опису"}
              </div>
            </div>

            {/* Assigned Engineer Card */}
            <div className="p-3 rounded-xl bg-secondary/20 border border-border/60 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                  {task.assignee ? (
                    task.assignee.name.slice(0, 2).toUpperCase()
                  ) : (
                    <User className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                    Відповідальний спеціаліст
                  </div>
                  <div className="font-semibold text-foreground">
                    {task.assignee ? task.assignee.name : "Очікує призначення інженера"}
                  </div>
                </div>
              </div>

              {task.assignee && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>Інженер підтримки</span>
                </span>
              )}
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

            {/* Conversation Timeline (Comments) */}
            <div className="space-y-3 pt-2 border-t border-border/80">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-primary" />
                <span>Діалог з підтримкою ({task.comments?.length || 0})</span>
              </span>

              <div className="space-y-3">
                {task.comments && task.comments.length > 0 ? (
                  task.comments.map((comment: CommentItem) => {
                    const isStaff = comment.authorType === "USER" && comment.author?.id !== currentUser?.id;
                    const isClientMe = comment.author?.id === currentUser?.id;
                    const isAi = comment.authorType === "AI_ASSISTANT";

                    return (
                      <div
                        key={comment.id}
                        className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-colors ${
                          isStaff
                            ? "bg-primary/5 border-primary/20 shadow-xs"
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
                                : isAi
                                ? "AI Асистент"
                                : comment.author?.name || "Служба підтримки"}
                            </span>
                            {isStaff && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/20 text-primary">
                                Служба підтримки
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
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    Натисніть <kbd className="px-1 py-0.5 rounded bg-secondary font-mono text-[9px]">Ctrl+V</kbd> щоб вставити скріншот
                  </span>
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
