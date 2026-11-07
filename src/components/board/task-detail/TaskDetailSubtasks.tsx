"use client";

import React from "react";
import { CheckSquare, Trash2, Plus } from "lucide-react";
import { TaskDetailSubtask } from "./types";

interface TaskDetailSubtasksProps {
  subtasks?: TaskDetailSubtask[];
  newSubtask: string;
  onChangeNewSubtask: (val: string) => void;
  onAddSubtask: (e: React.FormEvent) => void;
  onToggleSubtask: (subtaskId: string, current: boolean) => void;
  onDeleteSubtask: (subtaskId: string) => void;
}

export const TaskDetailSubtasks: React.FC<TaskDetailSubtasksProps> = ({
  subtasks = [],
  newSubtask,
  onChangeNewSubtask,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}) => {
  const completedCount = subtasks.filter((s) => s.isCompleted).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <CheckSquare className="w-4 h-4 text-primary" />
          <span>Підзадачі / Чек-лист</span>
        </div>
        {subtasks.length > 0 && (
          <span className="text-xs text-muted-foreground font-mono">
            {completedCount}/{subtasks.length}
          </span>
        )}
      </div>

      {/* Subtask items */}
      <div className="space-y-1.5">
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className="flex items-center justify-between group p-2 rounded-lg bg-secondary/30 border border-border/40 hover:border-border transition-colors text-sm"
          >
            <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
              <input
                type="checkbox"
                checked={subtask.isCompleted}
                onChange={() => onToggleSubtask(subtask.id, subtask.isCompleted)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
              />
              <span
                className={`truncate ${
                  subtask.isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                }`}
              >
                {subtask.title}
              </span>
            </label>
            <button
              onClick={() => onDeleteSubtask(subtask.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity cursor-pointer"
              title="Видалити підзадачу"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Add subtask form */}
        <form onSubmit={onAddSubtask} className="flex items-center gap-2 mt-2">
          <input
            type="text"
            placeholder="Додати підзадачу..."
            value={newSubtask}
            onChange={(e) => onChangeNewSubtask(e.target.value)}
            className="flex-1 text-xs bg-secondary/40 border border-border/80 rounded-lg py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          />
          <button
            type="submit"
            disabled={!newSubtask.trim()}
            className="p-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs disabled:opacity-50 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
