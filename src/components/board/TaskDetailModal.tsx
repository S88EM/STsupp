"use client";

import React, { useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { ColumnItem } from "./ColumnCard";
import {
  IssueDetailHeader,
  IssueDetailContent,
} from "@/components/jira/issue-detail";
import { useTaskDetail } from "@/hooks/useTaskDetail";

export interface TaskDetailModalProps {
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
  const taskDetail = useTaskDetail({
    taskId,
    projectId,
    columns,
    isOpen,
    onTaskUpdated,
    onTaskDeleted: (deletedId) => {
      onTaskDeleted(deletedId);
      onClose();
    },
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
            <IssueDetailContent
              taskDetail={taskDetail}
              projectId={projectId}
              projectKey={task.project?.key || ""}
            />
          )}
        </div>
      </div>
    </div>
  );
};
