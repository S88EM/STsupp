"use client";

import React from "react";
import { Trash2, X } from "lucide-react";

interface TaskDetailHeaderProps {
  code?: string;
  column?: { name: string; color?: string } | null;
  isAdmin: boolean;
  onDeleteTask: () => void;
  onClose: () => void;
}

export const TaskDetailHeader: React.FC<TaskDetailHeaderProps> = ({
  code,
  column,
  isAdmin,
  onDeleteTask,
  onClose,
}) => {
  return (
    <div className="h-14 border-b border-border/80 px-6 flex items-center justify-between bg-secondary/10 flex-shrink-0">
      <div className="flex items-center gap-3">
        <span className="font-mono font-bold text-primary text-sm tracking-wide">
          {code || "..."}
        </span>
        {column && (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full border border-border"
            style={{ backgroundColor: `${column.color}15`, color: column.color }}
          >
            {column.name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isAdmin && (
          <button
            onClick={onDeleteTask}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            title="Видалити задачу (доступно лише адміністратору)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
