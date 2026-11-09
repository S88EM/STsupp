"use client";

import React, { useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { ColumnItem } from "./ColumnCard";
import {
  IssueDetailHeader,
  IssueDetailContent,
} from "@/components/jira/issue-detail";
import { useTaskDetail } from "@/hooks/useTaskDetail";
import { useI18n } from "@/lib/i18n";

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
  const { dict, locale } = useI18n();
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
    handleChangeStatus,
    handleReturnToClient,
    handleClosePermanently,
    handleGetAiRecommendation,
    handleDeleteTask,
  } = taskDetail;

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
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border w-full max-w-5xl h-[92vh] max-h-[920px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 relative">
        {/* Top Bar with actions and Close X */}
        <div className="flex items-center justify-between border-b border-border/80 bg-card/60 px-4 py-2.5 z-20">
          {task && typeInfo ? (
            <div className="flex-1 min-w-0 pr-4">
              <IssueDetailHeader
                projectName={task.project?.name || (locale === "en" ? "Project" : "Проєкт")}
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
            <div className="text-xs text-muted-foreground">{dict.common.loading}</div>
          )}

          {/* Close Modal Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label={dict.common.close}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer flex-shrink-0"
            title={locale === "en" ? "Close window (Esc)" : "Закрити вікно (Esc)"}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && !task ? (
            <div className="h-full flex items-center justify-center p-8 text-xs text-muted-foreground">
              {locale === "en" ? "Loading issue details..." : "Завантаження деталей задачі..."}
            </div>
          ) : error || !task ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-2">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <span className="text-xs text-destructive">{error || dict.issue.issueNotFound}</span>
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
