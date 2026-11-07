"use client";

import React, { useEffect } from "react";
import { X, CheckSquare, AlertCircle } from "lucide-react";
import { TaskDetailModalProps } from "./task-detail/types";
import { getTaskTypeInfo } from "@/lib/constants/task";
import {
  IssueDetailHeader,
  IssueTitle,
  IssueDetailsCard,
  IssueDescriptionCard,
  IssueAttachmentsCard,
  IssueSubtasksCard,
  IssueActivityTabs,
  IssueSidebar,
} from "@/components/jira/issue-detail";
import { useTaskDetail } from "@/hooks/useTaskDetail";

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  taskId,
  projectId,
  columns,
  isOpen,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}) => {
  const {
    task,
    loading,
    error,
    currentUser,
    dictionaries,
    isEditingTitle,
    setIsEditingTitle,
    uploadingFile,
    aiLoading,
    aiRecommendation,
    commentInputRef,
    canChangeAssignee,
    canChangeStatus,
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
    handleDeleteTask,
    handleGetAiRecommendation,
  } = useTaskDetail({
    taskId,
    projectId,
    isOpen,
    onTaskUpdated,
    onTaskDeleted: (deletedId) => {
      onTaskDeleted(deletedId);
      onClose();
    },
  });

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const typeInfo = task ? getTaskTypeInfo(task.aiContext, task.title) : null;
  const effectiveColumns =
    task?.project?.columns && task.project.columns.length > 0
      ? task.project.columns
      : columns && columns.length > 0
      ? columns
      : task?.column
      ? [task.column]
      : [];
  const currentColumn = effectiveColumns.find((c: any) => c.id === task?.columnId) || task?.column;
  const subtasks = task?.subtasks || [];

  const isClosed = Boolean(task?.aiContext?.isClosed);
  const isDone = Boolean(
    currentColumn?.isDoneColumn ||
    ["готово", "done", "вирішено", "resolved"].includes(currentColumn?.name?.toLowerCase().trim())
  );
  const resolution: string = isClosed
    ? "Вирішено"
    : task?.aiContext?.resolution || "Не вирішено";

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-150"
    >
      <div className="bg-card border border-border w-full max-w-5xl h-[92vh] max-h-[920px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 relative">
        {/* Top Bar with actions and Close X */}
        <div className="flex items-center justify-between border-b border-border/80 bg-card/60 px-4 py-2.5 z-20">
          {task && typeInfo ? (
            <div className="flex-1 min-w-0 pr-4">
              <IssueDetailHeader
                projectName={task.project?.name || "Проєкт"}
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
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Завантаження задачі...</div>
          )}

          {/* Close Modal Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрити"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer flex-shrink-0"
            title="Закрити вікно (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && !task ? (
            <div className="h-full flex items-center justify-center p-8 text-xs text-muted-foreground">
              Завантаження деталей задачі...
            </div>
          ) : error || !task ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-2">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <span className="text-xs text-destructive">{error || "Задачу не знайдено"}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border min-h-full">
              {/* Left Side: Content & Details (8 cols) */}
              <div className="lg:col-span-8 p-5 space-y-5">
                {/* Title block */}
                <IssueTitle
                  title={task.title}
                  isEditing={isEditingTitle}
                  onStartEdit={() => setIsEditingTitle(true)}
                  onCancelEdit={() => setIsEditingTitle(false)}
                  onSaveTitle={handleSaveTitle}
                />

                {/* Details block with interactive status dropdown badge */}
                <IssueDetailsCard
                  task={task}
                  typeInfo={typeInfo!}
                  currentColumn={currentColumn}
                  columns={effectiveColumns}
                  canChangeStatus={canChangeStatus}
                  onChangeStatus={handleChangeStatus}
                  projectId={projectId}
                  projectKey={task.project?.key || ""}
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

              {/* Right Side: Metadata / Sidebar (4 cols) with internal time tracking */}
              <div className="lg:col-span-4 bg-card/30">
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
          )}
        </div>
      </div>
    </div>
  );
};
