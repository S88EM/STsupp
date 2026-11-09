"use client";

import React, { useState } from "react";
import { X, Sparkles, Calendar, User, Flag } from "lucide-react";
import { ColumnItem } from "./ColumnCard";
import { useI18n } from "@/lib/i18n";
import { getLocalizedStatusName } from "@/lib/constants/task";

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnItem[];
  defaultColumnId?: string;
  canChangeStatus?: boolean;
  onCreateTask: (taskData: {
    title: string;
    description: string;
    columnId: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    dueDate?: string;
  }) => Promise<void>;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  isOpen,
  onClose,
  columns,
  defaultColumnId,
  canChangeStatus = true,
  onCreateTask,
}) => {
  const { dict, locale } = useI18n();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [columnId, setColumnId] = useState(defaultColumnId || columns[0]?.id || "");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || loading) return;

    try {
      setLoading(true);
      await onCreateTask({
        title: title.trim(),
        description: description.trim(),
        columnId: columnId || columns[0]?.id,
        priority,
        dueDate: dueDate || undefined,
      });
      setTitle("");
      setDescription("");
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/80">
            <span className="text-sm font-semibold text-foreground">
              {dict.board.newTaskModalTitle}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <div className="p-5 space-y-4">
            {/* Title */}
            <div>
              <input
                type="text"
                placeholder={dict.board.taskTitlePlaceholder}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                required
                className="w-full text-base font-medium bg-transparent border-none focus:outline-none placeholder:text-muted-foreground/60 text-foreground"
              />
            </div>

            {/* Description */}
            <div>
              <textarea
                placeholder={dict.board.taskDescPlaceholder}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full text-sm bg-secondary/30 rounded-lg p-3 border border-border/80 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60 resize-none"
              />
            </div>

            {/* Controls row */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {/* Column/Status */}
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  {dict.issue.status}
                </label>
                {canChangeStatus ? (
                  <select
                    value={columnId}
                    onChange={(e) => setColumnId(e.target.value)}
                    className="w-full text-xs bg-secondary/50 border border-border rounded-lg py-1.5 px-2.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground cursor-pointer"
                  >
                    {columns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {getLocalizedStatusName(c.name, dict, locale)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full text-xs bg-secondary/30 border border-border/60 rounded-lg py-1.5 px-2.5 text-muted-foreground">
                    {getLocalizedStatusName(
                      columns.find((c) => c.id === (defaultColumnId || columns[0]?.id))?.name || "Беклог",
                      dict,
                      locale
                    )}
                  </div>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  {dict.issue.priority}
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full text-xs bg-secondary/50 border border-border rounded-lg py-1.5 px-2.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground cursor-pointer"
                >
                  <option value="LOW">{dict.priorities.low}</option>
                  <option value="MEDIUM">{dict.priorities.medium}</option>
                  <option value="HIGH">{dict.priorities.high}</option>
                  <option value="URGENT">{dict.priorities.urgent}</option>
                </select>
              </div>
            </div>

            {/* Due date */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                {dict.board.taskDueDate}
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs bg-secondary/50 border border-border rounded-lg py-1.5 px-2.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border/80 bg-secondary/20">
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-3.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              {dict.common.cancel}
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="text-xs px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? dict.common.saving : dict.board.createTask}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
