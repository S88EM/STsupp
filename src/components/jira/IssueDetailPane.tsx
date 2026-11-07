"use client";

import React, { useState, useEffect, useRef } from "react";
import { CheckSquare, AlertCircle } from "lucide-react";
import { ColumnItem } from "@/components/board/ColumnCard";
import { getTaskTypeInfo } from "./IssueListPane";
import {
  IssueDetailPaneProps,
  DictionariesData,
  IssueDetailHeader,
  IssueTitle,
  IssueDetailsCard,
  IssueDescriptionCard,
  IssueAttachmentsCard,
  IssueSubtasksCard,
  IssueActivityTabs,
  IssueSidebar,
} from "./issue-detail";

export type { IssueDetailPaneProps };

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

  // Editable title state
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Drag & drop file upload
  const [uploadingFile, setUploadingFile] = useState(false);

  // AI recommendations
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);

  // Components & Labels Dictionaries
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

  useEffect(() => {
    fetch("/api/settings/dictionaries")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setDictionaries(data);
      })
      .catch(() => {});
  }, []);

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
        onTaskUpdated();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Не вдалося оновити задачу");
      }
    } catch (err) {
      console.error("Update task error:", err);
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

  const handleSaveTitle = async (newTitle: string) => {
    await handleUpdateField({ title: newTitle });
    setIsEditingTitle(false);
  };

  const handleSaveDescription = async (newDesc: string) => {
    await handleUpdateField({ description: newDesc });
  };

  const handleChangeStatus = async (colId: string) => {
    if (!canChangeStatus) return;
    await handleUpdateField({ columnId: colId });
  };

  const handleChangeType = async (typeId: string) => {
    const newContext = { ...(task?.aiContext || {}), type: typeId };
    await handleUpdateField({ aiContext: newContext });
  };

  const handleChangePriority = async (prio: string) => {
    await handleUpdateField({ priority: prio });
  };

  const handleClosePermanently = async () => {
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
  };

  const handleToggleComponent = async (comp: string) => {
    const current = Array.isArray(task?.aiContext?.components) ? task.aiContext.components : [];
    const updated = current.includes(comp)
      ? current.filter((c: string) => c !== comp)
      : [...current, comp];
    const newContext = { ...(task?.aiContext || {}), components: updated };
    await handleUpdateField({ aiContext: newContext });
  };

  const handleToggleLabel = async (lbl: string) => {
    const current = Array.isArray(task?.aiContext?.labels) ? task.aiContext.labels : [];
    const updated = current.includes(lbl)
      ? current.filter((l: string) => l !== lbl)
      : [...current, lbl];
    const newContext = { ...(task?.aiContext || {}), labels: updated };
    await handleUpdateField({ aiContext: newContext });
  };

  const handleAddSubtask = async (title: string) => {
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
        onTaskUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, isCompleted: boolean) => {
    try {
      // Optimistic update
      setTask((prev: any) => ({
        ...prev,
        subtasks: (prev.subtasks || []).map((s: any) =>
          s.id === subtaskId ? { ...s, isCompleted } : s
        ),
      }));

      const res = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/subtasks`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subtaskId, isCompleted }),
        }
      );
      if (res.ok) {
        onTaskUpdated();
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
      // Rollback on failure
      setTask((prev: any) => ({
        ...prev,
        subtasks: (prev.subtasks || []).map((s: any) =>
          s.id === subtaskId ? { ...s, isCompleted: !isCompleted } : s
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
          subtasks: (prev.subtasks || []).filter((s: any) => s.id !== subtaskId),
        }));
        onTaskUpdated();
      }
    } catch (err) {
      console.error("Delete subtask error:", err);
    }
  };

  const handleAddComment = async (content: string) => {
    if (!taskId) return;
    const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      const comment = await res.json();
      setTask((prev: any) => ({
        ...prev,
        comments: [...(prev.comments || []), comment],
      }));
      onTaskUpdated();
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
  const effectiveColumns =
    task.project?.columns && task.project.columns.length > 0
      ? task.project.columns
      : columns && columns.length > 0
      ? columns
      : task.column
      ? [task.column]
      : [];
  const currentColumn = effectiveColumns.find((c: any) => c.id === task.columnId) || task.column;
  const subtasks = task.subtasks || [];

  // Metadata from aiContext & workflow
  const isClosed = Boolean(task.aiContext?.isClosed);
  const isDone = Boolean(
    currentColumn?.isDoneColumn ||
    ["готово", "done", "вирішено", "resolved"].includes(currentColumn?.name?.toLowerCase().trim())
  );
  const resolution: string = isClosed
    ? "Вирішено"
    : task.aiContext?.resolution || "Не вирішено";

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-background/50">
      {/* 1. Breadcrumbs & Top Action Bar */}
      <IssueDetailHeader
        projectName={projectName}
        task={task}
        typeInfo={typeInfo}
        currentColumn={currentColumn}
        columns={effectiveColumns}
        canChangeAssignee={canChangeAssignee}
        canChangeStatus={canChangeStatus}
        currentUser={currentUser}
        isClosed={isClosed}
        isDone={isDone}
        onStartEditTitle={() => setIsEditingTitle(true)}
        onFocusComment={() => {
          commentInputRef.current?.focus();
          commentInputRef.current?.scrollIntoView({ behavior: "smooth" });
        }}
        onAssignToMe={() => {
          if (currentUser) handleUpdateField({ assigneeId: currentUser.userId });
        }}
        onUnassignFromMe={() => handleUpdateField({ assigneeId: null })}
        onReturnToClient={handleReturnToClient}
        onClosePermanently={handleClosePermanently}
        onChangeStatus={handleChangeStatus}
        onGetAiRecommendation={handleGetAiRecommendation}
        onDeleteTask={handleDeleteTask}
      />

      {/* Main 2-Column Split Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* Left Side: Content & Details (8 cols) */}
        <div className="lg:col-span-8 p-6 space-y-6">
          {/* Title block */}
          <IssueTitle
            title={task.title}
            isEditing={isEditingTitle}
            onStartEdit={() => setIsEditingTitle(true)}
            onCancelEdit={() => setIsEditingTitle(false)}
            onSaveTitle={handleSaveTitle}
          />

          {/* Details block */}
          <IssueDetailsCard
            task={task}
            typeInfo={typeInfo}
            currentColumn={currentColumn}
            columns={effectiveColumns}
            canChangeStatus={canChangeStatus}
            onChangeStatus={handleChangeStatus}
            projectId={projectId}
            projectKey={projectKey}
            dictionaries={dictionaries}
            isClosed={isClosed}
            isDone={isDone}
            resolution={resolution}
            onChangeType={handleChangeType}
            onChangePriority={handleChangePriority}
            onToggleComponent={handleToggleComponent}
            onToggleLabel={handleToggleLabel}
            onClosePermanently={handleClosePermanently}
          />

          {/* Description Block */}
          <IssueDescriptionCard
            description={task.description}
            onSaveDescription={handleSaveDescription}
          />

          {/* Attachments */}
          <IssueAttachmentsCard
            attachments={task.attachments}
            uploadingFile={uploadingFile}
            onUploadFile={handleUploadFile}
          />

          {/* Subtasks block */}
          <IssueSubtasksCard
            subtasks={subtasks}
            onToggleSubtask={handleToggleSubtask}
            onDeleteSubtask={handleDeleteSubtask}
            onAddSubtask={handleAddSubtask}
          />

          {/* Activity / Comments Block */}
          <IssueActivityTabs
            comments={task.comments}
            auditLogs={task.auditLogs}
            taskCreatedAt={task.createdAt}
            taskCreator={task.creator}
            currentUser={currentUser}
            aiRecommendation={aiRecommendation}
            aiLoading={aiLoading}
            commentInputRef={commentInputRef}
            onAddComment={handleAddComment}
            onGetAiRecommendation={handleGetAiRecommendation}
          />
        </div>

        {/* Right Side: Metadata / Jira Sidebar (4 cols) */}
        <IssueSidebar
          task={task}
          projectId={projectId}
          canChangeAssignee={canChangeAssignee}
          currentUser={currentUser}
          onUpdateField={handleUpdateField}
          onReturnToClient={handleReturnToClient}
        />
      </div>
    </div>
  );
};
