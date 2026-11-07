"use client";

import React, { useState } from "react";
import { CheckCircle2, Trash2 } from "lucide-react";

interface SubtaskItem {
  id: string;
  title: string;
  isCompleted?: boolean;
}

interface IssueSubtasksCardProps {
  subtasks: SubtaskItem[];
  onToggleSubtask: (subtaskId: string, isCompleted: boolean) => void;
  onDeleteSubtask: (subtaskId: string) => void;
  onAddSubtask: (title: string) => void;
}

export function IssueSubtasksCard({
  subtasks,
  onToggleSubtask,
  onDeleteSubtask,
  onAddSubtask,
}: IssueSubtasksCardProps) {
  const [newSubtask, setNewSubtask] = useState("");

  const completedSubtasks = subtasks.filter((s) => s.isCompleted).length;
  const subtasksPercent = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    onAddSubtask(newSubtask.trim());
    setNewSubtask("");
  };

  return (
    <div className="rounded-xl border border-border bg-card/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          <span>Підзадачі ({completedSubtasks}/{subtasks.length})</span>
        </h3>
        {subtasks.length > 0 && (
          <span className="text-[11px] font-mono font-medium text-muted-foreground">
            {subtasksPercent}%
          </span>
        )}
      </div>

      {/* Subtask progress bar */}
      {subtasks.length > 0 && (
        <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${subtasksPercent}%` }}
          />
        </div>
      )}

      {/* Subtask list */}
      <div className="space-y-1">
        {subtasks.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between group p-1.5 rounded-lg hover:bg-secondary/40 transition-colors text-xs"
          >
            <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
              <input
                type="checkbox"
                checked={Boolean(s.isCompleted)}
                onChange={(e) => onToggleSubtask(s.id, e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
              />
              <span
                className={`truncate ${
                  s.isCompleted
                    ? "line-through text-muted-foreground opacity-70"
                    : "text-foreground font-medium"
                }`}
              >
                {s.title}
              </span>
            </label>
            <button
              type="button"
              onClick={() => onDeleteSubtask(s.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity cursor-pointer"
              title="Видалити підзадачу"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add subtask input */}
      <form onSubmit={handleAdd} className="flex items-center gap-2 pt-1">
        <input
          type="text"
          placeholder="+ Додати нову підзадачу..."
          value={newSubtask}
          onChange={(e) => setNewSubtask(e.target.value)}
          className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-secondary/30 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
        />
        <button
          type="submit"
          disabled={!newSubtask.trim()}
          className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 text-xs font-medium disabled:opacity-40 transition-colors cursor-pointer"
        >
          Додати
        </button>
      </form>
    </div>
  );
}
