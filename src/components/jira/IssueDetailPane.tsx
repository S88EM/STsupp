"use client";

import React from "react";
import { CheckSquare, AlertCircle } from "lucide-react";
import {
  IssueDetailPaneProps,
  IssueDetailHeader,
  IssueDetailContent,
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
  const taskDetail = useTaskDetail({
    taskId,
    projectId,
    columns,
    isOpen: true,
    onTaskUpdated,
    onTaskDeleted,
    currentUser: initialCurrentUser,
  });

  const {
    task,
    loading,
    error,
    typeInfo,
    effectiveColumns,
    currentColumn,
    currentUser,
    isClosed,
    isDone,
    canChangeAssignee,
    canChangeStatus,
    commentInputRef,
    setIsEditingTitle,
    handleUpdateField,
    handleReturnToClient,
    handleClosePermanently,
    handleChangeStatus,
    handleGetAiRecommendation,
    handleDeleteTask,
  } = taskDetail;

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

  if (error || !task || !typeInfo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-2">
        <AlertCircle className="w-6 h-6 text-destructive" />
        <span className="text-xs text-destructive">{error || "Задачу не знайдено"}</span>
      </div>
    );
  }

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
      <IssueDetailContent
        taskDetail={taskDetail}
        projectId={projectId}
        projectKey={projectKey}
      />
    </div>
  );
};
