"use client";

import React, { useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import { TaskCard, TaskItem } from "./TaskCard";
import { Plus, MoreHorizontal, Trash2, Edit2, Check } from "lucide-react";

export interface ColumnItem {
  id: string;
  name: string;
  color: string;
  orderIndex: number;
  isDoneColumn: boolean;
  tasks: TaskItem[];
}

interface ColumnCardProps {
  column: ColumnItem;
  onTaskClick: (task: TaskItem) => void;
  onAddTaskToColumn: (columnId: string) => void;
  onUpdateColumn: (columnId: string, updates: { name?: string; color?: string }) => void;
  onDeleteColumn: (columnId: string) => void;
  isDragDisabled?: boolean;
  canManageColumns?: boolean;
}

export const ColumnCard: React.FC<ColumnCardProps> = ({
  column,
  onTaskClick,
  onAddTaskToColumn,
  onUpdateColumn,
  onDeleteColumn,
  isDragDisabled = false,
  canManageColumns = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(column.name);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSaveName = () => {
    if (name.trim() && name !== column.name) {
      onUpdateColumn(column.id, { name: name.trim() });
    }
    setIsEditing(false);
  };

  return (
    <div className="w-80 flex-shrink-0 flex flex-col max-h-full bg-secondary/30 rounded-xl border border-border/60 p-2.5 backdrop-blur-sm">
      {/* Column Header */}
      <div className="flex items-center justify-between px-2 py-2 mb-1 group relative">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Color Indicator */}
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: column.color }}
          />

          {isEditing && canManageColumns ? (
            <div className="flex items-center gap-1 flex-1">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") {
                    setName(column.name);
                    setIsEditing(false);
                  }
                }}
                autoFocus
                className="w-full text-xs font-semibold bg-background px-2 py-1 rounded border border-primary focus:outline-none"
              />
              <button
                onClick={handleSaveName}
                className="p-1 hover:bg-background rounded text-primary"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <h3
              onClick={() => {
                if (canManageColumns) setIsEditing(true);
              }}
              className={`text-xs font-semibold text-foreground tracking-tight truncate ${
                canManageColumns ? "cursor-pointer hover:underline" : ""
              }`}
              title={canManageColumns ? "Натисніть щоб редагувати назву" : undefined}
            >
              {column.name}
            </h3>
          )}

          {/* Task Counter */}
          <span className="text-[11px] font-mono text-muted-foreground bg-secondary/80 px-1.5 py-0.5 rounded-full font-medium">
            {column.tasks.length}
          </span>
        </div>

        {/* Options Button */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onAddTaskToColumn(column.id)}
            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Додати задачу"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {canManageColumns && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-popover border border-border rounded-lg shadow-lg py-1 z-20 text-xs">
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary text-foreground text-left"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Перейменувати</span>
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      if (confirm(`Видалити колонку "${column.name}"?`)) {
                        onDeleteColumn(column.id);
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-destructive/10 text-destructive text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Видалити</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Droppable Task List */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto min-h-[150px] p-1 flex flex-col gap-2 rounded-lg transition-colors ${
              snapshot.isDraggingOver ? "bg-primary/5 ring-1 ring-primary/30" : ""
            }`}
          >
            {column.tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onClick={onTaskClick}
                isDragDisabled={isDragDisabled}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add Task Button at Bottom */}
      <button
        onClick={() => onAddTaskToColumn(column.id)}
        className="mt-2 w-full py-1.5 px-3 rounded-lg border border-dashed border-border/70 hover:border-border text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/40 flex items-center justify-center gap-1.5 transition-all"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Додати задачу</span>
      </button>
    </div>
  );
};
