"use client";

import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { CheckSquare, MessageSquare, AlertCircle, ArrowUp, ArrowDown, Minus, Sparkles } from "lucide-react";

export interface TaskItem {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  columnId: string;
  orderIndex: number;
  projectId?: string;
  project?: any;
  dueDate?: string | null;
  assignee?: { id: string; name: string; avatarUrl?: string | null } | null;
  subtasks?: Array<{ id: string; isCompleted: boolean }>;
  aiContext?: any;
  _count?: {
    comments: number;
    attachments: number;
    subtasks: number;
  };
}

interface TaskCardProps {
  task: TaskItem;
  index: number;
  onClick: (task: TaskItem) => void;
  isDragDisabled?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, index, onClick, isDragDisabled = false }) => {
  const completedSubtasks = task.subtasks?.filter((s) => s.isCompleted).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  const renderPriorityIcon = () => {
    switch (task.priority) {
      case "URGENT":
        return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
      case "HIGH":
        return <ArrowUp className="w-3.5 h-3.5 text-amber-500" />;
      case "LOW":
        return <ArrowDown className="w-3.5 h-3.5 text-slate-400" />;
      default:
        return <Minus className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={isDragDisabled}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          className={`p-3.5 rounded-lg border border-border/80 bg-card hover:border-primary/50 transition-all cursor-pointer shadow-sm group select-none ${
            snapshot.isDragging
              ? "rotate-1 shadow-lg ring-2 ring-primary/40 bg-card/95"
              : "hover:shadow"
          }`}
        >
          {/* Card Header: Code & Priority */}
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-mono text-muted-foreground font-semibold group-hover:text-primary transition-colors">
              {task.code}
            </span>
            <div className="flex items-center gap-1.5" title={`Пріоритет: ${task.priority}`}>
              {task.aiContext && (
                <span title="Є AI рекомендація з Confluence">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                </span>
              )}
              {renderPriorityIcon()}
            </div>
          </div>

          {/* Title */}
          <h4 className="text-sm font-medium text-foreground line-clamp-2 leading-snug mb-3">
            {task.title}
          </h4>

          {/* Card Footer: Metadata badges */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
            <div className="flex items-center gap-3">
              {totalSubtasks > 0 && (
                <span
                  className={`flex items-center gap-1 font-mono text-[11px] ${
                    completedSubtasks === totalSubtasks ? "text-emerald-500" : ""
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  {completedSubtasks}/{totalSubtasks}
                </span>
              )}

              {(task._count?.comments || 0) > 0 && (
                <span className="flex items-center gap-1 text-[11px]">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {task._count?.comments}
                </span>
              )}
            </div>

            {/* Assignee Avatar */}
            {task.assignee ? (
              <div
                className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold text-[10px] flex items-center justify-center border border-primary/30"
                title={task.assignee.name}
              >
                {task.assignee.name.substring(0, 2).toUpperCase()}
              </div>
            ) : (
              <span className="text-[10px] text-muted-foreground/60 italic">не призначено</span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};
