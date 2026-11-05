"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Trash2,
  CheckSquare,
  Plus,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Clock,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Send,
  Bot,
  Paperclip,
  Film,
  FileText,
} from "lucide-react";
import { ColumnItem } from "./ColumnCard";
import { formatTimeAgo } from "@/lib/utils";

interface TaskDetailModalProps {
  taskId: string | null;
  projectId: string;
  columns: ColumnItem[];
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
  onTaskDeleted: (taskId: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  taskId,
  projectId,
  columns,
  isOpen,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}) => {
  const [task, setTask] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [projectClientUsers, setProjectClientUsers] = useState<any[]>([]);

  const canChangeAssignee = Boolean(
    currentUser && (currentUser.role === "ADMIN" || currentUser.role === "ENGINEER")
  );

  useEffect(() => {
    if (canChangeAssignee && projectId) {
      fetch(`/api/projects/${projectId}/assignees`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setStaffUsers(data.staff || []);
            setProjectClientUsers(data.projectClients || []);
            setUsers(data.all || []);
          }
        })
        .catch(() => {});
    }
  }, [canChangeAssignee, projectId]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (taskId && isOpen) {
      loadTaskDetails();
    } else {
      setTask(null);
    }
  }, [taskId, isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !taskId) return;

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
      e.target.value = "";
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!taskId) return;
    try {
      const res = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/attachments?attachmentId=${attachmentId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setTask((prev: any) => ({
          ...prev,
          attachments: (prev.attachments || []).filter((a: any) => a.id !== attachmentId),
        }));
        onTaskUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadTaskDetails = async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data);
        setTitle(data.title);
        setDescription(data.description || "");
      }
    } catch (err) {
      console.error("Failed to load task:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateField = async (field: string, value: any) => {
    if (!taskId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTask((prev: any) => ({ ...prev, ...updated }));
        onTaskUpdated();
      }
    } catch (err) {
      console.error(err);
    }
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
        const item = await res.json();
        setTask((prev: any) => ({
          ...prev,
          subtasks: [...(prev.subtasks || []), item],
        }));
        setNewSubtask("");
        onTaskUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, current: boolean) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/subtasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtaskId, isCompleted: !current }),
      });
      if (res.ok) {
        setTask((prev: any) => ({
          ...prev,
          subtasks: prev.subtasks.map((s: any) =>
            s.id === subtaskId ? { ...s, isCompleted: !current } : s
          ),
        }));
        onTaskUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/subtasks?subtaskId=${subtaskId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setTask((prev: any) => ({
          ...prev,
          subtasks: prev.subtasks.filter((s: any) => s.id !== subtaskId),
        }));
        onTaskUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !taskId) return;

    try {
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
    }
  };

  const handleTriggerAiRecommendation = async (postComment = false) => {
    if (!taskId) return;
    try {
      setAiLoading(true);
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/ai-recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postAsComment: postComment }),
      });
      if (res.ok) {
        await loadTaskDetails();
        onTaskUpdated();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskId) return;
    if (confirm(`Видалити задачу ${task?.code}?`)) {
      try {
        const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          onTaskDeleted(taskId);
          onClose();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Screenshot / clipboard paste handler
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            // Append markdown image
            const imageMarkdown = `\n![Скріншот](${base64})\n`;
            setDescription((prev) => prev + imageMarkdown);
            handleUpdateField("description", description + imageMarkdown);
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="bg-card border border-border w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        {/* Modal Top Bar */}
        <div className="h-14 border-b border-border/80 px-6 flex items-center justify-between bg-secondary/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-primary text-sm tracking-wide">
              {task?.code || "..."}
            </span>
            {task?.column && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full border border-border"
                style={{ backgroundColor: `${task.column.color}15`, color: task.column.color }}
              >
                {task.column.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentUser?.role === "ADMIN" && (
              <button
                onClick={handleDeleteTask}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Видалити задачу (доступно лише адміністратору)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        {loading && !task ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Завантаження...
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Main Column: Title, Description, Subtasks, AI, Comments */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 border-b md:border-b-0 md:border-r border-border/80">
              {/* Title */}
              <div>
                {isEditingTitle ? (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => {
                      setIsEditingTitle(false);
                      if (title.trim() && title !== task.title) {
                        handleUpdateField("title", title.trim());
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setIsEditingTitle(false);
                        if (title.trim() && title !== task.title) {
                          handleUpdateField("title", title.trim());
                        }
                      }
                    }}
                    autoFocus
                    className="w-full text-lg font-bold bg-secondary/40 px-2 py-1 rounded border border-primary focus:outline-none text-foreground"
                  />
                ) : (
                  <h2
                    onClick={() => setIsEditingTitle(true)}
                    className="text-lg font-bold text-foreground cursor-pointer hover:bg-secondary/30 p-1 -ml-1 rounded transition-colors"
                    title="Натисніть для редагування"
                  >
                    {task?.title}
                  </h2>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Опис
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => {
                    if (description !== (task?.description || "")) {
                      handleUpdateField("description", description);
                    }
                  }}
                  onPaste={handlePaste}
                  rows={4}
                  placeholder="Додайте детальний опис... (підтримується вставка скріншотів через Ctrl+V)"
                  className="w-full text-sm bg-secondary/20 rounded-xl p-3 border border-border/70 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/50 resize-y"
                />
              </div>

              {/* Subtasks / Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <CheckSquare className="w-4 h-4 text-primary" />
                    <span>Підзадачі / Чек-лист</span>
                  </div>
                  {task?.subtasks?.length > 0 && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {task.subtasks.filter((s: any) => s.isCompleted).length}/{task.subtasks.length}
                    </span>
                  )}
                </div>

                {/* Subtask items */}
                <div className="space-y-1.5">
                  {task?.subtasks?.map((subtask: any) => (
                    <div
                      key={subtask.id}
                      className="flex items-center justify-between group p-2 rounded-lg bg-secondary/30 border border-border/40 hover:border-border transition-colors text-sm"
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={subtask.isCompleted}
                          onChange={() => handleToggleSubtask(subtask.id, subtask.isCompleted)}
                          className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                        />
                        <span
                          className={`truncate ${
                            subtask.isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                          }`}
                        >
                          {subtask.title}
                        </span>
                      </label>
                      <button
                        onClick={() => handleDeleteSubtask(subtask.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Add subtask form */}
                  <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Додати підзадачу..."
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      className="flex-1 text-xs bg-secondary/40 border border-border/80 rounded-lg py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    />
                    <button
                      type="submit"
                      disabled={!newSubtask.trim()}
                      className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>

              {/* AI & Confluence Recommendations Block (MCP Ready) */}
              <div className="p-4 rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 via-background to-background space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs tracking-wide">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>AI Рекомендації (Confluence MCP)</span>
                  </div>
                  <button
                    onClick={() => handleTriggerAiRecommendation(false)}
                    disabled={aiLoading}
                    className="text-xs px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-medium border border-indigo-500/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{aiLoading ? "Аналіз..." : "Запитати базу знань"}</span>
                  </button>
                </div>

                {task?.aiRecommendations?.length > 0 ? (
                  <div className="space-y-3 pt-1">
                    {task.aiRecommendations.map((rec: any) => (
                      <div key={rec.id} className="text-xs space-y-2 bg-indigo-950/10 p-3 rounded-lg border border-indigo-500/20">
                        <p className="text-foreground/90 leading-relaxed">{rec.summary}</p>
                        {Array.isArray(rec.confluencePages) && rec.confluencePages.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <span className="text-[11px] text-muted-foreground font-semibold">
                              Знайдена документація у Confluence:
                            </span>
                            {rec.confluencePages.map((page: any, idx: number) => (
                              <a
                                key={idx}
                                href={page.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 hover:underline text-[11px]"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>{page.title}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/80">
                    Натисніть кнопку вище, щоб штучний інтелект перевірив базу знань Confluence на наявність інструкцій, регламентів та порад для цієї задачі.
                  </p>
                )}
              </div>

              {/* Attachments Section (Screenshots, Videos, Materials) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Paperclip className="w-4 h-4 text-primary" />
                    <span>Матеріали та скріншоти ({task?.attachments?.length || 0})</span>
                  </div>

                  <label className="text-xs px-2.5 py-1 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-medium border border-border cursor-pointer transition-colors flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>{uploadingFile ? "Завантаження..." : "Додати файл / скріншот"}</span>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      className="hidden"
                      accept="image/*,video/*,.pdf,.doc,.docx,.zip,.txt"
                    />
                  </label>
                </div>

                {task?.attachments?.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {task.attachments.map((att: any) => {
                      const isImage = att.mimeType?.startsWith("image/");
                      const isVideo = att.mimeType?.startsWith("video/");

                      return (
                        <div
                          key={att.id}
                          className="group relative p-2 rounded-xl bg-secondary/30 border border-border/60 hover:border-border transition-all flex flex-col justify-between"
                        >
                          <a
                            href={att.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="space-y-1.5 block"
                          >
                            {isImage ? (
                              <div className="w-full h-24 rounded-lg bg-black/40 overflow-hidden flex items-center justify-center">
                                <img
                                  src={att.fileUrl}
                                  alt={att.fileName}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              </div>
                            ) : isVideo ? (
                              <div className="w-full h-24 rounded-lg bg-black/40 overflow-hidden flex flex-col items-center justify-center text-primary">
                                <Film className="w-6 h-6 mb-1" />
                                <span className="text-[10px] text-muted-foreground">Відеофайл</span>
                              </div>
                            ) : (
                              <div className="w-full h-24 rounded-lg bg-secondary/50 flex flex-col items-center justify-center text-muted-foreground">
                                <FileText className="w-6 h-6 mb-1" />
                                <span className="text-[10px]">Документ</span>
                              </div>
                            )}
                            <span className="text-[11px] font-medium text-foreground truncate block" title={att.fileName}>
                              {att.fileName}
                            </span>
                          </a>

                          {(currentUser?.role === "ADMIN" || currentUser?.role === "ENGINEER") && (
                            <button
                              onClick={() => handleDeleteAttachment(att.id)}
                              className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 rounded-md bg-background/80 text-muted-foreground hover:text-destructive shadow-sm transition-opacity"
                              title="Видалити вкладення"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span>Коментарі та обговорення</span>
                </div>

                {/* Comment Input */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Написати коментар..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 text-xs bg-secondary/40 border border-border/80 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Надіслати</span>
                  </button>
                </form>

                {/* Comment List */}
                <div className="space-y-2 pt-2">
                  {task?.comments?.map((comment: any) => (
                    <div
                      key={comment.id}
                      className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                        comment.authorType === "AI_ASSISTANT"
                          ? "bg-indigo-950/20 border-indigo-500/30"
                          : "bg-secondary/20 border-border/60"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 font-semibold text-foreground">
                          {comment.authorType === "AI_ASSISTANT" ? (
                            <>
                              <Bot className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="text-indigo-400">
                                {comment.authorName || "Confluence AI"}
                              </span>
                            </>
                          ) : (
                            <span>{comment.author?.name || "Користувач"}</span>
                          )}
                        </div>
                        <span className="text-muted-foreground">
                          {formatTimeAgo(comment.createdAt)}
                        </span>
                      </div>
                      <div className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                        {comment.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Meta Sidebar: Status, Priority, Due Date, Info */}
            <div className="w-full md:w-72 bg-secondary/10 p-6 space-y-5 flex-shrink-0 text-xs">
              {/* Assignee Selector */}
              <div>
                <label className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider block mb-1.5">
                  Виконавець
                </label>
                {canChangeAssignee ? (
                  <select
                    value={task?.assigneeId || ""}
                    onChange={(e) => handleUpdateField("assigneeId", e.target.value || null)}
                    className="w-full bg-secondary/60 border border-border rounded-lg py-1.5 px-2.5 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="">Не призначено</option>
                    {staffUsers.length > 0 && (
                      <optgroup label={`Співробітники (${staffUsers.length})`}>
                        {staffUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role === "ADMIN" ? "Адмін" : "Інженер"})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {projectClientUsers.length > 0 && (
                      <optgroup label={`Клієнти цього проєкту (${projectClientUsers.length})`}>
                        {projectClientUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} (Клієнт)
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                ) : (
                  <div className="w-full bg-secondary/30 border border-border/60 rounded-lg py-1.5 px-2.5 font-medium text-foreground">
                    {task?.assignee?.name || "Не призначено"}
                  </div>
                )}
              </div>

              {/* Status Selector */}
              <div>
                <label className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider block mb-1.5">
                  Статус
                </label>
                <select
                  value={task?.columnId || ""}
                  onChange={(e) => handleUpdateField("columnId", e.target.value)}
                  className="w-full bg-secondary/60 border border-border rounded-lg py-1.5 px-2.5 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  {columns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Selector */}
              <div>
                <label className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider block mb-1.5">
                  Пріоритет
                </label>
                <select
                  value={task?.priority || "MEDIUM"}
                  onChange={(e) => handleUpdateField("priority", e.target.value)}
                  className="w-full bg-secondary/60 border border-border rounded-lg py-1.5 px-2.5 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="LOW">Низький</option>
                  <option value="MEDIUM">Середній</option>
                  <option value="HIGH">Високий</option>
                  <option value="URGENT">Терміновий ⚡</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider block mb-1.5">
                  Дедлайн
                </label>
                <input
                  type="date"
                  value={task?.dueDate ? task.dueDate.split("T")[0] : ""}
                  onChange={(e) => handleUpdateField("dueDate", e.target.value || null)}
                  className="w-full bg-secondary/60 border border-border rounded-lg py-1.5 px-2.5 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                />
              </div>

              {/* Meta Info */}
              <div className="pt-4 border-t border-border/60 space-y-2 text-[11px] text-muted-foreground">
                <div className="flex justify-between">
                  <span>Створено:</span>
                  <span className="font-medium text-foreground">
                    {task?.createdAt ? new Date(task.createdAt).toLocaleDateString("uk-UA") : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Автор:</span>
                  <span className="font-medium text-foreground">
                    {task?.creator?.name || "Admin"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
