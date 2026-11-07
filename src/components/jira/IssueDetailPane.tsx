"use client";

import React from "react";
import { CheckSquare, AlertCircle } from "lucide-react";
import { getTaskTypeInfo } from "./IssueListPane";
import {
  IssueDetailPaneProps,
  IssueDetailHeader,
  IssueTitle,
  IssueDetailsCard,
  IssueDescriptionCard,
  IssueAttachmentsCard,
  IssueSubtasksCard,
  IssueActivityTabs,
  IssueSidebar,
} from "./issue-detail";
import { useTaskDetail } from "@/hooks/useTaskDetail";

export type { IssueDetailPaneProps };

export const IssueDetailPane: React.FC<IssueDetailPaneProps> = ({
  taskId,
  projectId,
  projectName,
  projectKey,
  columns,
  onTaskUpdated,
  onTaskDeleted,
  currentUser: initialCurrentUser,
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
    isOpen: true,
    onTaskUpdated,
    onTaskDeleted,
    currentUser: initialCurrentUser,
  });

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

          {/* Details block with interactive status dropdown badge */}
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

        {/* Right Side: Metadata / Jira Sidebar (4 cols) with internal time tracking */}
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
