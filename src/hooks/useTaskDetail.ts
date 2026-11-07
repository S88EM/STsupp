"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ColumnItem } from "@/components/board/ColumnCard";
import { DictionariesData } from "@/components/jira/issue-detail/types";

export interface UseTaskDetailOptions {
  taskId: string | null;
  projectId: string;
  isOpen?: boolean;
  onTaskUpdated?: () => void;
  onTaskDeleted?: (taskId: string) => void;
  currentUser?: any;
}

export function useTaskDetail({
  taskId,
  projectId,
  isOpen = true,
  onTaskUpdated,
  onTaskDeleted,
  currentUser: initialCurrentUser,
}: UseTaskDetailOptions) {
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(initialCurrentUser || null);

  // Editable title state
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);

  // Drag & drop file upload state
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);

  // AI recommendations state
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);

  // Dictionaries state
  const [dictionaries, setDictionaries] = useState<DictionariesData>({
    componentsByType: {},
    componentsByProject: {},
    labels: [],
  });

  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Permissions
  const canChangeAssignee = Boolean(
    currentUser && (currentUser.role === "ADMIN" || currentUser.role === "ENGINEER")
  );
  const canChangeStatus = Boolean(
    currentUser && (currentUser.role === "ADMIN" || currentUser.role === "ENGINEER")
  );

  // Fetch current user if not provided
  useEffect(() => {
    if (!initialCurrentUser) {
      fetch("/api/auth/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user) setCurrentUser(data.user);
        })
        .catch(() => {});
    } else {
      setCurrentUser(initialCurrentUser);
    }
  }, [initialCurrentUser]);

  // Fetch dictionaries
  useEffect(() => {
    fetch("/api/settings/dictionaries")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setDictionaries(data);
      })
      .catch(() => {});
  }, []);

  // Load task details
  const loadTaskDetails = useCallback(async () => {
    if (!taskId || !isOpen) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Не вдалося завантажити задачу");
      }
    } catch (err: any) {
      setError(err.message || "Помилка зв'язку із сервером");
    } finally {
      setLoading(false);
    }
  }, [taskId, projectId, isOpen]);

  useEffect(() => {
    if (taskId && isOpen) {
      loadTaskDetails();
    } else {
      setTask(null);
      setError(null);
    }
  }, [taskId, isOpen, loadTaskDetails]);

  // Update arbitrary fields on task
  const handleUpdateField = useCallback(
    async (fields: Record<string, any>) => {
      if (!taskId) return;
      if (fields.columnId !== undefined && !canChangeStatus) {
        alert("Клієнти не мають права переводити задачу в інші статуси.");
        return;
      }
      try {
        const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        });

        if (res.ok) {
          const updated = await res.json();
          setTask((prev: any) => ({ ...prev, ...updated }));
          onTaskUpdated?.();
        } else {
          const errData = await res.json().catch(() => ({}));
          alert(errData.error || "Не вдалося оновити задачу");
        }
      } catch (err) {
        console.error("Update task error:", err);
      }
    },
    [taskId, projectId, canChangeStatus, onTaskUpdated]
  );

  // Return task to client (reporter)
  const handleReturnToClient = useCallback(async () => {
    if (!taskId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/return-to-client`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setTask((prev: any) => ({ ...prev, ...(data.task || {}) }));
        onTaskUpdated?.();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Не вдалося повернути задачу клієнту");
      }
    } catch (e: any) {
      console.error("Error returning to client:", e);
      alert(e.message || "Помилка зв'язку із сервером");
    }
  }, [taskId, projectId, onTaskUpdated]);

  // Permanently close task
  const handleClosePermanently = useCallback(async () => {
    if (
      !confirm(
        "Ви дійсно бажаєте закрити задачу повністю?\n\nПісля закриття можливість її повторного відкриття або переміщення в іншу колонку буде заблоковано, а рішення набуде значення «Вирішено»."
      )
    ) {
      return;
    }
    const newContext = {
      ...(task?.aiContext || {}),
      isClosed: true,
      resolution: "Вирішено",
      closedAt: new Date().toISOString(),
      closedBy: currentUser?.name || currentUser?.email,
    };
    await handleUpdateField({ aiContext: newContext });
  }, [task?.aiContext, currentUser, handleUpdateField]);

  const handleSaveTitle = useCallback(
    async (newTitle: string) => {
      await handleUpdateField({ title: newTitle });
      setIsEditingTitle(false);
    },
    [handleUpdateField]
  );

  const handleSaveDescription = useCallback(
    async (newDesc: string) => {
      await handleUpdateField({ description: newDesc });
    },
    [handleUpdateField]
  );

  const handleChangeStatus = useCallback(
    async (colId: string) => {
      if (!canChangeStatus) return;
      await handleUpdateField({ columnId: colId });
    },
    [canChangeStatus, handleUpdateField]
  );

  const handleChangeType = useCallback(
    async (typeId: string) => {
      const newContext = { ...(task?.aiContext || {}), type: typeId };
      await handleUpdateField({ aiContext: newContext });
    },
    [task?.aiContext, handleUpdateField]
  );

  const handleChangePriority = useCallback(
    async (prio: string) => {
      await handleUpdateField({ priority: prio });
    },
    [handleUpdateField]
  );

  const handleToggleComponent = useCallback(
    async (comp: string) => {
      const current = Array.isArray(task?.aiContext?.components) ? task.aiContext.components : [];
      const updated = current.includes(comp)
        ? current.filter((c: string) => c !== comp)
        : [...current, comp];
      const newContext = { ...(task?.aiContext || {}), components: updated };
      await handleUpdateField({ aiContext: newContext });
    },
    [task?.aiContext, handleUpdateField]
  );

  const handleToggleLabel = useCallback(
    async (lbl: string) => {
      const current = Array.isArray(task?.aiContext?.labels) ? task.aiContext.labels : [];
      const updated = current.includes(lbl)
        ? current.filter((l: string) => l !== lbl)
        : [...current, lbl];
      const newContext = { ...(task?.aiContext || {}), labels: updated };
      await handleUpdateField({ aiContext: newContext });
    },
    [task?.aiContext, handleUpdateField]
  );

  // Subtask handlers
  const handleAddSubtask = useCallback(
    async (title: string) => {
      if (!taskId) return;
      try {
        const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/subtasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
        if (res.ok) {
          const sub = await res.json();
          setTask((prev: any) => ({
            ...prev,
            subtasks: [...(prev.subtasks || []), sub],
          }));
          onTaskUpdated?.();
        }
      } catch (err) {
        console.error(err);
      }
    },
    [taskId, projectId, onTaskUpdated]
  );

  const handleToggleSubtask = useCallback(
    async (subtaskId: string, isCompleted: boolean) => {
      try {
        setTask((prev: any) => ({
          ...prev,
          subtasks: (prev.subtasks || []).map((s: any) =>
            s.id === subtaskId ? { ...s, isCompleted } : s
          ),
        }));

        const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/subtasks`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subtaskId, isCompleted }),
        });
        if (res.ok) {
          onTaskUpdated?.();
        } else {
          // Rollback on failure
          setTask((prev: any) => ({
            ...prev,
            subtasks: (prev.subtasks || []).map((s: any) =>
              s.id === subtaskId ? { ...s, isCompleted: !isCompleted } : s
            ),
          }));
        }
      } catch (err) {
        console.error("Subtask toggle error:", err);
        setTask((prev: any) => ({
          ...prev,
          subtasks: (prev.subtasks || []).map((s: any) =>
            s.id === subtaskId ? { ...s, isCompleted: !isCompleted } : s
          ),
        }));
      }
    },
    [taskId, projectId, onTaskUpdated]
  );

  const handleDeleteSubtask = useCallback(
    async (subtaskId: string) => {
      try {
        const res = await fetch(
          `/api/projects/${projectId}/tasks/${taskId}/subtasks?subtaskId=${subtaskId}`,
          { method: "DELETE" }
        );
        if (res.ok) {
          setTask((prev: any) => ({
            ...prev,
            subtasks: (prev.subtasks || []).filter((s: any) => s.id !== subtaskId),
          }));
          onTaskUpdated?.();
        }
      } catch (err) {
        console.error("Delete subtask error:", err);
      }
    },
    [taskId, projectId, onTaskUpdated]
  );

  // Comment handler
  const handleAddComment = useCallback(
    async (content: string) => {
      if (!taskId || !content.trim()) return;
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (res.ok) {
        const comment = await res.json();
        setTask((prev: any) => ({
          ...prev,
          comments: [...(prev.comments || []), comment],
        }));
        onTaskUpdated?.();
      }
    },
    [taskId, projectId, onTaskUpdated]
  );

  // Attachment upload & delete
  const handleUploadFile = useCallback(
    async (file: File) => {
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
          onTaskUpdated?.();
        } else {
          const err = await res.json().catch(() => ({}));
          alert(err.error || "Не вдалося завантажити файл");
        }
      } catch (err: any) {
        alert(err.message || "Помилка при завантаженні");
      } finally {
        setUploadingFile(false);
      }
    },
    [taskId, projectId, onTaskUpdated]
  );

  const handleDeleteAttachment = useCallback(
    async (attachmentId: string) => {
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
          onTaskUpdated?.();
        }
      } catch (err) {
        console.error("Delete attachment error:", err);
      }
    },
    [taskId, projectId, onTaskUpdated]
  );

  // Delete task
  const handleDeleteTask = useCallback(async () => {
    if (!taskId) return;
    if (confirm(`Ви дійсно бажаєте видалити задачу ${task?.code}?`)) {
      try {
        const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          onTaskDeleted?.(taskId);
        } else {
          const err = await res.json().catch(() => ({}));
          alert(err.error || "Не вдалося видалити задачу");
        }
      } catch (err) {
        console.error("Delete task error:", err);
      }
    }
  }, [taskId, projectId, task?.code, onTaskDeleted]);

  // AI recommendations
  const handleGetAiRecommendation = useCallback(async () => {
    if (!taskId) return;
    try {
      setAiLoading(true);
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/ai-recommend`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setAiRecommendation(data.recommendation || "Рекомендацію згенеровано успішно");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  }, [taskId, projectId]);

  return {
    task,
    setTask,
    loading,
    error,
    currentUser,
    dictionaries,
    isEditingTitle,
    setIsEditingTitle,
    uploadingFile,
    aiLoading,
    aiRecommendation,
    setAiRecommendation,
    commentInputRef,
    canChangeAssignee,
    canChangeStatus,
    loadTaskDetails,
    handleUpdateField,
    handleReturnToClient,
    handleClosePermanently,
    handleSaveTitle,
    handleSaveDescription,
    handleChangeStatus,
    handleChangeType,
    handleChangePriority,
    handleToggleComponent,
    handleToggleLabel,
    handleAddSubtask,
    handleToggleSubtask,
    handleDeleteSubtask,
    handleAddComment,
    handleUploadFile,
    handleDeleteAttachment,
    handleDeleteTask,
    handleGetAiRecommendation,
  };
}
