"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { ColumnCard, ColumnItem } from "./ColumnCard";
import { TaskItem } from "./TaskCard";
import { TaskDetailModal } from "./TaskDetailModal";
import { NewTaskModal } from "./NewTaskModal";
import { NewColumnModal } from "./NewColumnModal";
import { Plus, Search } from "lucide-react";

interface KanbanBoardProps {
  projectId: string;
  initialColumns: ColumnItem[];
  onRefresh: () => Promise<void>;
  currentUser?: { role?: string; id?: string; email?: string } | null;
}

function mapStageToProjectColumn(task: any, destColId: string) {
  const projectColumns: any[] = task?.project?.columns || [];
  if (projectColumns.length === 0) return null;

  const stageId = destColId.replace("all-", ""); // "backlog", "inprogress", "testing", "done"

  const matched = projectColumns.find((c: any) => {
    if (stageId === "done" && c.isDoneColumn) return true;
    const name = (c.name || "").toLowerCase();
    if (stageId === "done" && (name.includes("done") || name.includes("готов") || name.includes("виріш"))) return true;
    if (stageId === "testing" && (name.includes("тест") || name.includes("review") || name.includes("перевір"))) return true;
    if (stageId === "inprogress" && (name.includes("робот") || name.includes("progress") || name.includes("розроб"))) return true;
    if (stageId === "backlog" && (name.includes("backlog") || name.includes("беклог") || name.includes("черг"))) return true;
    return false;
  });

  if (matched) return matched;
  if (stageId === "done") return projectColumns.find((c: any) => c.isDoneColumn) || projectColumns[projectColumns.length - 1];
  if (stageId === "backlog") return projectColumns[0];
  return projectColumns[1] || projectColumns[0];
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  projectId,
  initialColumns,
  onRefresh,
  currentUser,
}) => {
  const canChangeStatus = Boolean(
    currentUser && (currentUser.role === "ADMIN" || currentUser.role === "ENGINEER")
  );
  const [columns, setColumns] = useState<ColumnItem[]>(initialColumns);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isNewColumnOpen, setIsNewColumnOpen] = useState(false);
  const [activeColumnForNewTask, setActiveColumnForNewTask] = useState<string | undefined>();

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const handleTaskClick = useCallback((task: TaskItem) => {
    setSelectedTask(task);
  }, []);

  const handleAddTaskToColumn = useCallback((colId: string) => {
    setActiveColumnForNewTask(colId);
    setIsNewTaskOpen(true);
  }, []);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!canChangeStatus) return;
    const { source, destination, draggableId } = result;
    if (!destination) return;

    // If position didn't change
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceCol = columns.find((c) => c.id === source.droppableId);
    const destCol = columns.find((c) => c.id === destination.droppableId);
    if (!sourceCol || !destCol) return;

    // Moving within the same column
    if (source.droppableId === destination.droppableId) {
      const reorderedTasks = Array.from(sourceCol.tasks);
      const [movedTask] = reorderedTasks.splice(source.index, 1);
      reorderedTasks.splice(destination.index, 0, movedTask);

      // Update local state optimistically
      const newColumns = columns.map((col) =>
        col.id === sourceCol.id ? { ...col, tasks: reorderedTasks } : col
      );
      setColumns(newColumns);

      // Send update to server
      const updatedTasksPayload = reorderedTasks.map((t, idx) => ({
        id: t.id,
        columnId: sourceCol.id,
        orderIndex: idx,
      }));

      try {
        await fetch(`/api/projects/${projectId}/tasks/reorder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: draggableId,
            destinationColumnId: sourceCol.id,
            updatedTasks: updatedTasksPayload,
          }),
        });
      } catch (err) {
        console.error("Failed to sync task reorder:", err);
        onRefresh();
      }
      return;
    }

    // Moving between different columns
    const sourceTasks = Array.from(sourceCol.tasks);
    const destTasks = Array.from(destCol.tasks);
    const [movedTask] = sourceTasks.splice(source.index, 1);
    const updatedMovedTask = { ...movedTask, columnId: destCol.id };
    destTasks.splice(destination.index, 0, updatedMovedTask);

    // Update local state optimistically
    const newColumns = columns.map((col) => {
      if (col.id === sourceCol.id) return { ...col, tasks: sourceTasks };
      if (col.id === destCol.id) return { ...col, tasks: destTasks };
      return col;
    });
    setColumns(newColumns);

    if (projectId === "all") {
      const targetCol = mapStageToProjectColumn(movedTask, destCol.id);
      if (targetCol && (movedTask as any).projectId) {
        try {
          const res = await fetch(`/api/projects/${(movedTask as any).projectId}/tasks/${movedTask.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ columnId: targetCol.id }),
          });
          if (!res.ok) {
            onRefresh();
          }
        } catch (err) {
          console.error("Failed to sync global move:", err);
          onRefresh();
        }
      }
      return;
    }

    // Send payload
    const updatedTasksPayload = [
      ...sourceTasks.map((t, idx) => ({ id: t.id, columnId: sourceCol.id, orderIndex: idx })),
      ...destTasks.map((t, idx) => ({ id: t.id, columnId: destCol.id, orderIndex: idx })),
    ];

    try {
      await fetch(`/api/projects/${projectId}/tasks/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: draggableId,
          destinationColumnId: destCol.id,
          updatedTasks: updatedTasksPayload,
        }),
      });
    } catch (err) {
      console.error("Failed to sync cross-column move:", err);
      onRefresh();
    }
  }, [canChangeStatus, columns, projectId, onRefresh]);

  const handleCreateTask = useCallback(async (taskData: any) => {
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });
    if (res.ok) {
      await onRefresh();
    }
  }, [projectId, onRefresh]);

  const handleCreateColumn = useCallback(async (columnData: any) => {
    const res = await fetch(`/api/projects/${projectId}/columns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(columnData),
    });
    if (res.ok) {
      await onRefresh();
    }
  }, [projectId, onRefresh]);

  const handleUpdateColumn = useCallback(async (columnId: string, updates: any) => {
    const res = await fetch(`/api/projects/${projectId}/columns/${columnId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      await onRefresh();
    }
  }, [projectId, onRefresh]);

  const handleDeleteColumn = useCallback(async (columnId: string) => {
    const res = await fetch(`/api/projects/${projectId}/columns/${columnId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await onRefresh();
    }
  }, [projectId, onRefresh]);

  // Filter tasks by search query with memoization
  const filteredColumns = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return columns;

    return columns.map((col) => ({
      ...col,
      tasks: col.tasks.filter((t) => {
        return (
          t.title.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
        );
      }),
    }));
  }, [columns, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Sub-header Controls */}
      <div className="px-6 py-2.5 border-b border-border/60 bg-card/40 flex items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-64 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Швидкий пошук задач..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg bg-secondary/50 border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Board actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewColumnOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground bg-secondary/60 hover:bg-secondary border border-border/80 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-primary" />
            <span>Нова колонка</span>
          </button>
        </div>
      </div>

      {/* Kanban Drag Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 h-full items-start">
            {filteredColumns.map((col) => (
              <ColumnCard
                key={col.id}
                column={col}
                onTaskClick={handleTaskClick}
                onAddTaskToColumn={handleAddTaskToColumn}
                onUpdateColumn={handleUpdateColumn}
                onDeleteColumn={handleDeleteColumn}
                isDragDisabled={!canChangeStatus}
                canManageColumns={canChangeStatus}
              />
            ))}

            {/* Quick Add Column Button at Board End (Admin/Engineer only) */}
            {canChangeStatus && projectId !== "all" && (
              <button
                onClick={() => setIsNewColumnOpen(true)}
                className="w-72 flex-shrink-0 h-32 rounded-xl border-2 border-dashed border-border/60 hover:border-primary/50 text-muted-foreground hover:text-foreground flex flex-col items-center justify-center gap-2 transition-all hover:bg-secondary/20"
              >
                <Plus className="w-5 h-5 text-primary" />
                <span className="text-xs font-semibold">Додати нову колонку</span>
              </button>
            )}
          </div>
        </DragDropContext>
      </div>

      {/* Modals */}
      <NewTaskModal
        isOpen={isNewTaskOpen}
        onClose={() => {
          setIsNewTaskOpen(false);
          setActiveColumnForNewTask(undefined);
        }}
        columns={columns}
        defaultColumnId={activeColumnForNewTask}
        canChangeStatus={canChangeStatus}
        onCreateTask={handleCreateTask}
      />

      <NewColumnModal
        isOpen={isNewColumnOpen}
        onClose={() => setIsNewColumnOpen(false)}
        onCreateColumn={handleCreateColumn}
      />

      <TaskDetailModal
        taskId={selectedTask?.id || null}
        projectId={selectedTask?.projectId || projectId}
        columns={selectedTask?.project?.columns || columns}
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        onTaskUpdated={onRefresh}
        onTaskDeleted={async () => {
          setSelectedTask(null);
          await onRefresh();
        }}
      />
    </div>
  );
};
