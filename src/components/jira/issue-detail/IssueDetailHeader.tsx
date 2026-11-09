"use client";

import React, { useState } from "react";
import {
  Pencil,
  MessageSquare,
  User,
  UserX,
  CheckCircle2,
  MoreHorizontal,
  Copy,
  Sparkles,
  Trash2,
  CornerUpLeft,
  Check,
} from "lucide-react";
import { ColumnItem } from "@/components/board/ColumnCard";
import { FEATURE_FLAGS } from "@/config/features";
import { getCanonicalTaskUrl } from "@/lib/taskUrl";

interface IssueDetailHeaderProps {
  projectName: string;
  task: any;
  typeInfo: { icon: React.ReactNode; label: string; id: string };
  currentColumn: ColumnItem | undefined;
  columns?: ColumnItem[];
  canChangeAssignee: boolean;
  canChangeStatus?: boolean;
  currentUser?: any;
  isClosed: boolean;
  isDone: boolean;
  onStartEditTitle: () => void;
  onFocusComment: () => void;
  onAssignToMe: () => void;
  onUnassignFromMe: () => void;
  onReturnToClient?: () => void;
  onClosePermanently: () => void;
  onChangeStatus?: (columnId: string) => void;
  onGetAiRecommendation: () => void;
  onDeleteTask: () => void;
}

export function IssueDetailHeader({
  projectName,
  task,
  typeInfo,
  canChangeAssignee,
  currentUser,
  isClosed,
  isDone,
  onStartEditTitle,
  onFocusComment,
  onAssignToMe,
  onUnassignFromMe,
  onReturnToClient,
  onClosePermanently,
  onGetAiRecommendation,
  onDeleteTask,
}: IssueDetailHeaderProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  const isAssigneeStaff = Boolean(
    task.assignee && (task.assignee.role === "ADMIN" || task.assignee.role === "ENGINEER")
  );
  const hasCreator = Boolean(task.creatorId || task.creator?.id);
  const isCreatorCurrentAssignee = task.assigneeId === (task.creatorId || task.creator?.id);
  const canReturnToClient =
    canChangeAssignee && isAssigneeStaff && hasCreator && !isCreatorCurrentAssignee && !isClosed;

  const handleCopyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const canonicalUrl = getCanonicalTaskUrl(task.code, origin);
    navigator.clipboard.writeText(canonicalUrl);
    setCopiedToast(true);
    setShowMoreMenu(false);
    setTimeout(() => {
      setCopiedToast(false);
    }, 2500);
  };

  return (
    <div className="p-4 border-b border-border/80 flex flex-wrap items-center justify-between gap-3 bg-card/40 sticky top-0 z-10 backdrop-blur-md relative">
      {/* Breadcrumb with Quick Copy Code Badge */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="hover:text-foreground transition-colors font-medium">
          {projectName}
        </span>
        <span>/</span>
        <button
          type="button"
          onClick={handleCopyLink}
          className="font-mono font-bold text-primary hover:text-primary/80 flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-primary/10 transition-colors cursor-pointer group"
          title={`Скопіювати пряме посилання (${task.code})`}
        >
          {typeInfo.icon}
          <span>{task.code}</span>
          {copiedToast ? (
            <Check className="w-3 h-3 text-emerald-500" />
          ) : (
            <Copy className="w-3 h-3 text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity" />
          )}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Quick Action: Edit */}
        <button
          type="button"
          onClick={onStartEditTitle}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-border hover:bg-secondary text-foreground transition-colors cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Редагувати</span>
        </button>

        {/* Quick Action: Comment */}
        <button
          type="button"
          onClick={onFocusComment}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-border hover:bg-secondary text-foreground transition-colors cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Коментувати</span>
        </button>

        {/* Quick Action: Assign to me / Unassign */}
        {canChangeAssignee && (
          currentUser && task.assigneeId === currentUser.userId ? (
            <button
              type="button"
              onClick={onUnassignFromMe}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-border hover:bg-destructive/10 text-destructive transition-colors cursor-pointer"
              title="Зняти себе з виконавців"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Зняти з мене</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onAssignToMe}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-border hover:bg-secondary text-foreground transition-colors cursor-pointer"
              title="Призначити цю задачу на себе"
            >
              <User className="w-3.5 h-3.5" />
              <span>Призначити на мене</span>
            </button>
          )
        )}

        {/* Quick Action: Return to Client */}
        {canReturnToClient && onReturnToClient && (
          <button
            type="button"
            onClick={onReturnToClient}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 hover:text-amber-400 transition-colors cursor-pointer shadow-xs"
            title={`Повернути задачу автору (${task.creator?.name || "клієнту"})`}
          >
            <CornerUpLeft className="w-3.5 h-3.5" />
            <span>Повернути до клієнта</span>
          </button>
        )}

        {/* Action: Permanently Close Task (Workflow: Available when in Done status) */}
        {isDone && !isClosed && (
          <button
            type="button"
            onClick={onClosePermanently}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all cursor-pointer animate-in fade-in"
            title="Закрити задачу повністю (без можливості повторного відкриття)"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Закрити задачу повністю</span>
          </button>
        )}

        {/* More Actions Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            title="Додаткові дії..."
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMoreMenu && (
            <div className="absolute right-0 mt-1 w-52 rounded-lg bg-card border border-border shadow-xl py-1 z-30 animate-in fade-in-50 zoom-in-95">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Скопіювати пряме посилання</span>
              </button>

              {FEATURE_FLAGS.ENABLE_AI_ASSISTANT && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    onGetAiRecommendation();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-primary hover:bg-secondary transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Отримати пораду ШІ</span>
                </button>
              )}

              {currentUser?.role === "ADMIN" && (
                <>
                  <div className="my-1 border-t border-border/60" />
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreMenu(false);
                      onDeleteTask();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    <span>Видалити задачу</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Toast notification */}
      {copiedToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-popover text-foreground shadow-2xl border border-border text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center flex-shrink-0">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <span>
            Пряме посилання на <strong className="font-mono text-primary font-bold">{task.code}</strong> скопійовано!
          </span>
        </div>
      )}
    </div>
  );
}
