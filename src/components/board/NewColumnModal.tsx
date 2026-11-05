"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

interface NewColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateColumn: (data: { name: string; color: string; isDoneColumn: boolean }) => Promise<void>;
}

const PRESET_COLORS = [
  "#64748b", // Slate
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#14b8a6", // Teal
  "#ef4444", // Red
];

export const NewColumnModal: React.FC<NewColumnModalProps> = ({
  isOpen,
  onClose,
  onCreateColumn,
}) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [isDoneColumn, setIsDoneColumn] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || loading) return;

    try {
      setLoading(true);
      await onCreateColumn({
        name: name.trim(),
        color,
        isDoneColumn,
      });
      setName("");
      setColor("#3b82f6");
      setIsDoneColumn(false);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border w-full max-w-sm rounded-xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/80">
            <span className="text-sm font-semibold text-foreground">Нова колонка / статус</span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                Назва колонки
              </label>
              <input
                type="text"
                placeholder="напр. Реліз, UX Review, Блокер..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
                className="w-full text-xs bg-secondary/50 border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>

            {/* Color Selector */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-2">
                Колір статусу
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      color === c ? "scale-125 ring-2 ring-primary ring-offset-2 ring-offset-card" : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Is Done Column Checkbox */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isDoneColumn"
                checked={isDoneColumn}
                onChange={(e) => setIsDoneColumn(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
              <label htmlFor="isDoneColumn" className="text-xs text-foreground cursor-pointer">
                Вважати задачі в цій колонці виконаними (Done)
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border/80 bg-secondary/20">
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-3.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="text-xs px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? "Створення..." : "Додати колонку"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
