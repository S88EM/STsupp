"use client";

import React, { useState } from "react";
import {
  Pencil,
  MessageSquare,
  User,
  UserX,
  CheckCircle2,
  Lock,
  ChevronDown,
  Check,
  MoreHorizontal,
  Copy,
  Sparkles,
  Trash2,
} from "lucide-react";
import { ColumnItem } from "@/components/board/ColumnCard";

interface IssueDetailHeaderProps {
  projectName: string;
  task: any;
  typeInfo: { icon: React.ReactNode; label: string; id: string };
  currentColumn: ColumnItem | undefined;
  columns: ColumnItem[];
  canChangeAssignee: boolean;
  canChangeStatus: boolean;
  currentUser?: any;
  isClosed: boolean;
  isDone: boolean;
  onStartEditTitle: () => void;
  onFocusComment: () => void;
  onAssignToMe: () => void;
  onUnassignFromMe: () => void;
  onClosePermanently: () => void;
  onChangeStatus: (columnId: string) => void;
  onGetAiRecommendation: () => void;
  onDeleteTask: () => void;
}

export function IssueDetailHeader({
  projectName,
  task,
  typeInfo,
  currentColumn,
  columns,
  canChangeAssignee,
  canChangeStatus,
  currentUser,
  isClosed,
  isDone,
  onStartEditTitle,
  onFocusComment,
  onAssignToMe,
  onUnassignFromMe,
  onClosePermanently,
  onChangeStatus,
  onGetAiRecommendation,
  onDeleteTask,
}: IssueDetailHeaderProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  return (
    <div className="p-4 border-b border-border/80 flex flex-wrap items-center justify-between gap-3 bg-card/40 sticky top-0 z-10 backdrop-blur-md">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="hover:text-foreground transition-colors font-medium">
          {projectName}
        </span>
        <span>/</span>
        <span className="font-mono font-bold text-primary flex items-center gap-1">
          {typeInfo.icon}
          <span>{task.code}</span>
        </span>
      </div>

      {/* Action Buttons & Transitions */}
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
          <span>Коментар</span>
        </button>

        {/* Quick Action: Assign to Me (Only for Admins & Engineers) */}
        {canChangeAssignee && currentUser && task.assigneeId !== currentUser.userId && (
          <button
            type="button"
            onClick={onAssignToMe}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-border hover:bg-secondary text-foreground transition-colors cursor-pointer"
            title="Призначити цю задачу мені"
          >
            <User className="w-3.5 h-3.5" />
            <span>Призначити мені</span>
          </button>
        )}

        {/* Quick Action: Unassign from Me */}
        {canChangeAssignee && currentUser && task.assigneeId === currentUser.userId && (
          <button
            type="button"
            onClick={onUnassignFromMe}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-border/70 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
            title="Зняти призначення з себе"
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Зняти з мене</span>
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

        {/* Jira-style Workflow Status Transitions */}
        <div className="relative">
          {isClosed ? (
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold text-white shadow-sm bg-slate-700/90 border border-slate-600/80 cursor-not-allowed select-none"
              title="Ця задача повністю закрита. Повторне відкриття заблоковано."
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentColumn?.name || "Готово"} (Закрита 🔒)</span>
            </div>
          ) : canChangeStatus ? (
            <button
              type="button"
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold text-white transition-all shadow-sm hover:opacity-95 cursor-pointer"
              style={{ backgroundColor: currentColumn?.color || "#3b82f6" }}
            >
              <span>{currentColumn?.name || "Статус"}</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            </button>
          ) : (
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold text-white shadow-sm cursor-default"
              style={{ backgroundColor: currentColumn?.color || "#3b82f6" }}
              title="Змінювати статус задачі можуть лише адміністратор та інженер"
            >
              <span>{currentColumn?.name || "Статус"}</span>
            </div>
          )}

          {canChangeStatus && showStatusMenu && (
            <div className="absolute right-0 mt-1 w-44 rounded-lg bg-card border border-border shadow-xl py-1 z-30 animate-in fade-in-50 zoom-in-95">
              <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/60">
                Змінити статус
              </div>
              {columns.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setShowStatusMenu(false);
                    onChangeStatus(c.id);
                  }}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    <span>{c.name}</span>
                  </span>
                  {c.id === task.columnId && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>

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
            <div className="absolute right-0 mt-1 w-48 rounded-lg bg-card border border-border shadow-xl py-1 z-30 animate-in fade-in-50 zoom-in-95">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setShowMoreMenu(false);
                  alert("Посилання на задачу скопійовано в буфер обміну");
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Копіювати посилання</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu(false);
                  onGetAiRecommendation();
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>AI Аналіз задачі</span>
              </button>
              <div className="my-1 border-t border-border/80" />
              <button
                type="button"
                onClick={() => {
                  setShowMoreMenu(false);
                  onDeleteTask();
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Видалити задачу</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
