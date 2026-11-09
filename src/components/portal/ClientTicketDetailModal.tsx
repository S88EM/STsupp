"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Loader2, AlertCircle } from "lucide-react";
import {
  ClientTicketDetailModalProps,
  isTicketAwaitingResponse,
  ClientTicketHeader,
  ClientTicketAlertBanner,
  ClientTicketEditForm,
  ClientTicketOverview,
  ClientTicketMetaCards,
  ClientTicketAttachments,
  ClientTicketHistory,
  ClientTicketDialogue,
} from "./ticket-detail";
import { useI18n } from "@/lib/i18n";

export const ClientTicketDetailModal: React.FC<ClientTicketDetailModalProps> = ({
  taskId,
  projectId,
  isOpen,
  onClose,
  onTicketUpdated,
  currentUser,
}) => {
  const { dict, locale } = useI18n();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [returningToSupport, setReturningToSupport] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit ticket state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [savingEdit, setSavingEdit] = useState(false);

  const commentsEndRef = useRef<HTMLDivElement>(null);

  const isTaskClosed = Boolean(
    task?.column?.isDoneColumn ||
    task?.aiContext?.isClosed ||
    ["готово", "done", "resolved", "вирішено", "закрито", "closed"].includes(
      (task?.column?.name || "").toLowerCase()
    )
  );

  const isAuthor = Boolean(
    currentUser && (task?.creatorId === currentUser.id || task?.creator?.id === currentUser.id)
  );

  const canEdit = Boolean(currentUser && !isTaskClosed);

  const isAssigneeClient = useMemo(() => {
    if (!task?.assignee) return false;
    if (task.assignee.role === "CLIENT") return true;
    if (
      currentUser?.role === "CLIENT" &&
      (task.assignee.id === currentUser.id || task.assigneeId === currentUser.id)
    ) {
      return true;
    }
    if (task.creator?.role === "CLIENT" && task.assignee.id === task.creator.id) return true;
    if (
      task.creatorId &&
      task.assignee.id === task.creatorId &&
      task.assignee.role !== "ADMIN" &&
      task.assignee.role !== "ENGINEER"
    ) {
      return true;
    }
    return false;
  }, [task?.assignee, task?.creator, task?.creatorId, task?.assigneeId, currentUser]);

  const isAssigneeMe = Boolean(
    currentUser &&
    task?.assignee &&
    (task.assignee.id === currentUser.id || task.assigneeId === currentUser.id)
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
        setEditPriority(data.priority === "CRITICAL" ? "URGENT" : data.priority || "MEDIUM");
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
        throw new Error(
          data.error ||
            (locale === "en"
              ? "Failed to save ticket changes"
              : "Не вдалося зберегти зміни звернення")
        );
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
      setError(
        err.message ||
          (locale === "en" ? "Error saving ticket changes" : "Помилка при збереженні змін")
      );
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
        throw new Error(
          data.error ||
            (locale === "en"
              ? "Failed to return ticket to support"
              : "Не вдалося повернути звернення до служби підтримки")
        );
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
      setError(
        err.message ||
          (locale === "en"
            ? "Error returning ticket to support"
            : "Помилка при поверненні звернення до служби підтримки")
      );
    } finally {
      setReturningToSupport(false);
    }
  };

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
        throw new Error(locale === "en" ? "Failed to upload file" : "Не вдалося завантажити файл");
      }

      await loadTask();
      onTicketUpdated?.();
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || (locale === "en" ? "File upload error" : "Помилка завантаження файлу"));
    } finally {
      setUploadingFile(false);
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
        throw new Error(
          locale === "en" ? "Failed to send message" : "Не вдалося надіслати повідомлення"
        );
      }

      setReplyText("");
      await loadTask();
      onTicketUpdated?.();

      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      console.error("Send reply error:", err);
      setError(
        err.message || (locale === "en" ? "Error sending message" : "Помилка відправки повідомлення")
      );
    } finally {
      setSendingReply(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <ClientTicketHeader
          code={task?.code}
          column={task?.column}
          priority={task?.priority}
          createdAt={task?.createdAt}
          onClose={onClose}
        />

        {/* Content */}
        {loading && !task ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs">{dict.portal.loadingTicket}</span>
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
            <ClientTicketAlertBanner
              isWaitingForResponse={isWaitingForResponse}
              returningToSupport={returningToSupport}
              sendingReply={sendingReply}
              onReturnToSupport={() => handleReturnToSupport(false)}
            />

            {/* Title & Description */}
            {isEditing ? (
              <ClientTicketEditForm
                title={editTitle}
                onChangeTitle={setEditTitle}
                description={editDescription}
                onChangeDescription={setEditDescription}
                priority={editPriority}
                onChangePriority={setEditPriority}
                saving={savingEdit}
                onSave={handleSaveEdit}
                onCancel={() => {
                  setIsEditing(false);
                  setEditTitle(task.title);
                  setEditDescription(task.description || "");
                  setEditPriority(
                    task.priority === "CRITICAL" ? "URGENT" : task.priority || "MEDIUM"
                  );
                }}
              />
            ) : (
              <ClientTicketOverview
                title={task.title}
                description={task.description}
                canEdit={canEdit}
                isTaskClosed={isTaskClosed}
                onStartEdit={() => {
                  setEditTitle(task.title);
                  setEditDescription(task.description || "");
                  setEditPriority(
                    task.priority === "CRITICAL" ? "URGENT" : task.priority || "MEDIUM"
                  );
                  setIsEditing(true);
                }}
              />
            )}

            {/* Meta Cards: Creator & Assigned Engineer */}
            <ClientTicketMetaCards
              creator={task.creator}
              assignee={task.assignee}
              isAuthor={isAuthor}
              isAssigneeClient={isAssigneeClient}
              isAssigneeMe={isAssigneeMe}
            />

            {/* Attachments Section */}
            <ClientTicketAttachments
              attachments={task.attachments}
              uploading={uploadingFile}
              onUploadFile={uploadSingleFile}
            />

            {/* Audit / Activity History Section */}
            <ClientTicketHistory
              auditLogs={task.auditLogs}
              taskCreatedAt={task.createdAt}
              taskCreator={task.creator}
              currentUser={currentUser}
            />

            {/* Conversation Timeline (Comments) */}
            <ClientTicketDialogue
              comments={sortedComments}
              currentUserId={currentUser?.id}
              replyText={replyText}
              onChangeReplyText={setReplyText}
              sendingReply={sendingReply}
              returningToSupport={returningToSupport}
              isWaitingForResponse={isWaitingForResponse}
              onSendReply={handleSendReply}
              onReturnToSupport={handleReturnToSupport}
              commentsEndRef={commentsEndRef}
            />
          </div>
        ) : null}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/80 flex items-center justify-between bg-card/60 backdrop-blur-md">
          <span className="text-[11px] text-muted-foreground">
            {dict.portal.realtimeNotice}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors cursor-pointer"
          >
            {dict.common.close}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
};
