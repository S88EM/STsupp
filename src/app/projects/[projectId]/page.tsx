"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { ColumnItem } from "@/components/board/ColumnCard";
import { TaskItem } from "@/components/board/TaskCard";
import { TaskDetailModal } from "@/components/board/TaskDetailModal";
import { NewTaskModal } from "@/components/board/NewTaskModal";
import { CheckCircle2, Clock, AlertCircle, ArrowUp, ArrowDown, Minus, Sparkles } from "lucide-react";

export default function ProjectPage() {
  const params = useParams();
  const projectId = params?.projectId as string;

  const [project, setProject] = useState<any>(null);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [columns, setColumns] = useState<ColumnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  const fetchProjectData = async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        setColumns(data.columns || []);
      }
    } catch (err) {
      console.error("Error fetching project:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setAllProjects(data);
      }
    } catch (err) {
      console.error("Error fetching all projects:", err);
    }
  };

  useEffect(() => {
    fetchProjectData();
    fetchAllProjects();
  }, [projectId]);

  const handleCreateTask = async (taskData: any) => {
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    });
    if (res.ok) {
      await fetchProjectData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">
        Завантаження проекту...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-3">
        <h2 className="text-xl font-bold text-foreground">Проект не знайдено</h2>
        <a href="/" className="text-xs text-primary underline">
          Повернутися на головну
        </a>
      </div>
    );
  }

  // All tasks flattened for List view
  const allTasks = columns.flatMap((c) =>
    c.tasks.map((t) => ({ ...t, columnName: c.name, columnColor: c.color }))
  );

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      <Navbar
        currentProject={project}
        projects={allProjects}
        viewMode={viewMode}
        onViewModeChange={(mode) => setViewMode(mode)}
        onOpenNewTask={() => setIsNewTaskOpen(true)}
      />

      {viewMode === "board" ? (
        <KanbanBoard
          projectId={projectId}
          initialColumns={columns}
          onRefresh={fetchProjectData}
        />
      ) : (
        /* List View */
        <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 px-4 py-3 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider bg-secondary/30">
              <div className="col-span-2">Код</div>
              <div className="col-span-5">Назва</div>
              <div className="col-span-2">Статус</div>
              <div className="col-span-2">Пріоритет</div>
              <div className="col-span-1 text-right">Виконавець</div>
            </div>

            <div className="divide-y divide-border/60">
              {allTasks.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  У цьому проекті ще немає задач. Натисніть кнопку «Нова задача» зверху!
                </div>
              ) : (
                allTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTask(t)}
                    className="grid grid-cols-12 px-4 py-3 text-xs items-center hover:bg-secondary/30 cursor-pointer transition-colors"
                  >
                    <div className="col-span-2 font-mono font-semibold text-primary">
                      {t.code}
                    </div>
                    <div className="col-span-5 font-medium text-foreground truncate pr-4">
                      {t.title}
                    </div>
                    <div className="col-span-2">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border"
                        style={{
                          backgroundColor: `${t.columnColor}15`,
                          borderColor: `${t.columnColor}40`,
                          color: t.columnColor,
                        }}
                      >
                        {t.columnName}
                      </span>
                    </div>
                    <div className="col-span-2 text-muted-foreground capitalize">
                      {t.priority.toLowerCase()}
                    </div>
                    <div className="col-span-1 text-right">
                      {t.assignee ? (
                        <span className="text-[11px] font-medium text-foreground">
                          {t.assignee.name.split(" ")[0]}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">-</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Modals for this view */}
      <NewTaskModal
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        columns={columns}
        onCreateTask={handleCreateTask}
      />

      <TaskDetailModal
        taskId={selectedTask?.id || null}
        projectId={projectId}
        columns={columns}
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        onTaskUpdated={fetchProjectData}
        onTaskDeleted={async () => {
          setSelectedTask(null);
          await fetchProjectData();
        }}
      />
    </div>
  );
}
