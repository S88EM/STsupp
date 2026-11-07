"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  TaskDetailModalProps,
  TaskDetailHeader,
  TaskDetailTitleDescription,
  TaskDetailSubtasks,
  TaskDetailAiRecommendations,
  TaskDetailAttachments,
  TaskDetailActivityTabs,
  TaskDetailSidebar,
} from "./task-detail";
import { FEATURE_FLAGS } from "@/config/features";

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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [projectClientUsers, setProjectClientUsers] = useState<any[]>([]);

  const commentsEndRef = useRef<HTMLDivElement>(null);

  const canChangeAssignee = Boolean(
    currentUser && (currentUser.role === "ADMIN" || currentUser.role === "ENGINEER")
  );
  const canChangeStatus = Boolean(
    currentUser && (currentUser.role === "ADMIN" || currentUser.role === "ENGINEER")
  );

  const sortedComments = useMemo(() => {
    if (!task?.comments || !Array.isArray(task.comments)) return [];
    return [...task.comments].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [task?.comments]);

  useEffect(() => {
    if (canChangeAssignee && projectId) {
      fetch(`/api/projects/${projectId}/assignees`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setStaffUsers(data.staff || []);
            setProjectClientUsers(data.projectClients || []);
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
        setTimeout(() => {
          commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 150);
      }
    } catch (err) {
      console.error("Failed to load task:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId && isOpen) {
      loadTaskDetails();
    } else {
      setTask(null);
    }
  }, [taskId, isOpen]);

  const handleUpdateField = async (field: string, value: any) => {
    if (!taskId) return;
    if (field === "columnId" && !canChangeStatus) {
      alert("Клієнти не мають права переводити задачу в інші статуси.");
      return;
    }
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
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Не вдалося оновити задачу");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReturnToClient = async () => {
    if (!taskId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/return-to-client`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setTask((prev: any) => ({ ...prev, ...(data.task || {}) }));
        onTaskUpdated();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Не вдалося повернути задачу клієнту");
      }
    } catch (e: any) {
      console.error("Error returning to client:", e);
      alert(e.message || "Помилка зв'язку із сервером");
    }
  };

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
      setTask((prev: any) => ({
        ...prev,
        subtasks: (prev.subtasks || []).map((s: any) =>
          s.id === subtaskId ? { ...s, isCompleted: !current } : s
        ),
      }));

      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/subtasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtaskId, isCompleted: !current }),
      });
      if (res.ok) {
        onTaskUpdated();
      } else {
        setTask((prev: any) => ({
          ...prev,
          subtasks: (prev.subtasks || []).map((s: any) =>
            s.id === subtaskId ? { ...s, isCompleted: current } : s
          ),
        }));
      }
    } catch (err) {
      console.error(err);
      setTask((prev: any) => ({
        ...prev,
        subtasks: (prev.subtasks || []).map((s: any) =>
          s.id === subtaskId ? { ...s, isCompleted: current } : s
        ),
      }));
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
          comments: [...(prev.comments || []), comment],
        }));
        setNewComment("");
        onTaskUpdated();
        setTimeout(() => {
          commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
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
        <TaskDetailHeader
          code={task?.code}
          column={task?.column}
          isAdmin={currentUser?.role === "ADMIN"}
          onDeleteTask={handleDeleteTask}
          onClose={onClose}
        />

        {/* Modal Content */}
        {loading && !task ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Завантаження...
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Main Column */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 border-b md:border-b-0 md:border-r border-border/80">
              <TaskDetailTitleDescription
                title={title}
                originalTitle={task?.title}
                onChangeTitle={setTitle}
                onSaveTitle={() => {
                  if (title.trim() && title !== task?.title) {
                    handleUpdateField("title", title.trim());
                  }
                }}
                description={description}
                onChangeDescription={setDescription}
                onSaveDescription={() => {
                  if (description !== (task?.description || "")) {
                    handleUpdateField("description", description);
                  }
                }}
                onPasteDescription={handlePaste}
              />

              <TaskDetailSubtasks
                subtasks={task?.subtasks}
                newSubtask={newSubtask}
                onChangeNewSubtask={setNewSubtask}
                onAddSubtask={handleAddSubtask}
                onToggleSubtask={handleToggleSubtask}
                onDeleteSubtask={handleDeleteSubtask}
              />

              {FEATURE_FLAGS.ENABLE_AI_ASSISTANT && (
                <TaskDetailAiRecommendations
                  recommendations={task?.aiRecommendations}
                  aiLoading={aiLoading}
                  onTriggerAi={() => handleTriggerAiRecommendation(false)}
                />
              )}

              <TaskDetailAttachments
                attachments={task?.attachments}
                uploading={uploadingFile}
                canDelete={currentUser?.role === "ADMIN" || currentUser?.role === "ENGINEER"}
                onUpload={handleFileUpload}
                onDelete={handleDeleteAttachment}
              />

              <TaskDetailActivityTabs
                comments={sortedComments}
                auditLogs={task?.auditLogs}
                taskCreatedAt={task?.createdAt}
                taskCreator={task?.creator}
                currentUser={currentUser}
                newComment={newComment}
                onChangeNewComment={setNewComment}
                onAddComment={handleAddComment}
                commentsEndRef={commentsEndRef}
              />
            </div>

            {/* Right Meta Sidebar */}
            <TaskDetailSidebar
              task={task}
              columns={columns}
              staffUsers={staffUsers}
              projectClientUsers={projectClientUsers}
              canChangeAssignee={canChangeAssignee}
              canChangeStatus={canChangeStatus}
              onUpdateField={handleUpdateField}
              onReturnToClient={handleReturnToClient}
            />
          </div>
        )}
      </div>
    </div>
  );
};
