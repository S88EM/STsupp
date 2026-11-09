"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Navbar } from "@/components/layout/Navbar";
import { TaskDetailModal } from "@/components/board/TaskDetailModal";
import { JiraCreateIssueModal } from "@/components/jira/JiraCreateIssueModal";
import { getTaskTypeInfo, getPriorityIcon } from "@/components/jira/IssueListPane";
import { getCanonicalTaskPath } from "@/lib/taskUrl";
import { useI18n } from "@/lib/i18n/context";
import {
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Layers,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckSquare,
  MessageSquare,
  FolderGit2,
  ChevronDown,
  Check,
  Sparkles,
} from "lucide-react";

interface StandardStage {
  id: string;
  name: string;
  color: string;
  isDone?: boolean;
}

const STANDARD_STAGES: StandardStage[] = [
  { id: "backlog", name: "Беклог", color: "#64748b" },
  { id: "inprogress", name: "В роботі", color: "#3b82f6" },
  { id: "testing", name: "Тестування", color: "#eab308" },
  { id: "done", name: "Готово", color: "#22c55e", isDone: true },
];

function mapColumnToStageId(columnName?: string, isDoneColumn?: boolean): string {
  if (isDoneColumn) return "done";
  const name = (columnName || "").toLowerCase();
  if (name.includes("done") || name.includes("готов") || name.includes("виріш")) {
    return "done";
  }
  if (name.includes("тест") || name.includes("review") || name.includes("перевір")) {
    return "testing";
  }
  if (name.includes("робот") || name.includes("progress") || name.includes("розроб")) {
    return "inprogress";
  }
  return "backlog";
}

function GlobalBoardsPageContent() {
  const { dict, locale } = useI18n();
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [assigneeFilter, setAssigneeFilter] = useState<"all" | "my">("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Modals
  const [detailTask, setDetailTask] = useState<any | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const canChangeStatus = Boolean(
    currentUser && (currentUser.role === "ADMIN" || currentUser.role === "ENGINEER")
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksRes, meRes] = await Promise.all([
        fetch("/api/tasks?filter=all"),
        fetch("/api/auth/me"),
      ]);

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks || []);
        setProjects(data.projects || []);
      }

      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUser(meData.user);
      }
    } catch (err) {
      console.error("Error loading board data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCode = t.code.toLowerCase().includes(q);
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesProject = t.project?.name?.toLowerCase().includes(q);
        const matchesAssignee = t.assignee?.name?.toLowerCase().includes(q);
        if (!matchesCode && !matchesTitle && !matchesProject && !matchesAssignee) {
          return false;
        }
      }

      // 2. Project filter
      if (selectedProjectId && t.projectId !== selectedProjectId) {
        return false;
      }

      // 3. Assignee filter
      if (assigneeFilter === "my" && currentUser) {
        if (t.assigneeId !== currentUser.userId) return false;
      }

      // 4. Priority filter
      if (priorityFilter !== "all" && t.priority !== priorityFilter) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, selectedProjectId, assigneeFilter, priorityFilter, currentUser]);

  // Group tasks into 4 standard columns
  const columnTasksMap = useMemo(() => {
    const map: Record<string, any[]> = {
      backlog: [],
      inprogress: [],
      testing: [],
      done: [],
    };

    filteredTasks.forEach((t) => {
      const stageId = mapColumnToStageId(t.column?.name, t.column?.isDoneColumn);
      if (map[stageId]) {
        map[stageId].push(t);
      } else {
        map.backlog.push(t);
      }
    });

    return map;
  }, [filteredTasks]);

  // Task selection with canonical URL syncing
  const handleOpenDetailTask = (t: any) => {
    setDetailTask(t);
    if (t.code && typeof window !== "undefined") {
      const canonical = getCanonicalTaskPath(t.code);
      if (window.location.pathname !== canonical) {
        window.history.pushState(
          { taskId: t.id, code: t.code },
          "",
          canonical
        );
      }
    }
  };

  const handleCloseDetailTask = () => {
    setDetailTask(null);
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/browse/")) {
      window.history.pushState(null, "", "/boards");
    }
  };

  // Popstate listener for detail modal
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === "undefined") return;
      if (!window.location.pathname.startsWith("/browse/")) {
        setDetailTask(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Drag and drop handler
  const handleDragEnd = async (result: DropResult) => {
    if (!canChangeStatus) return;
    const { source, destination, draggableId } = result;
    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const movedTask = tasks.find((t) => t.id === draggableId);
    if (!movedTask) return;

    const destStageId = destination.droppableId;
    const projectColumns: any[] = movedTask.project?.columns || [];

    // Find the corresponding column in the task's project
    let targetProjectColumn = projectColumns.find(
      (c) => mapColumnToStageId(c.name, c.isDoneColumn) === destStageId
    );

    // Fallback if not found by name
    if (!targetProjectColumn) {
      if (destStageId === "done") {
        targetProjectColumn = projectColumns.find((c) => c.isDoneColumn) || projectColumns[projectColumns.length - 1];
      } else if (destStageId === "backlog") {
        targetProjectColumn = projectColumns[0];
      } else {
        targetProjectColumn = projectColumns[1] || projectColumns[0];
      }
    }

    if (!targetProjectColumn || targetProjectColumn.id === movedTask.columnId) {
      return;
    }

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === movedTask.id
          ? {
              ...t,
              columnId: targetProjectColumn.id,
              column: {
                ...t.column,
                id: targetProjectColumn.id,
                name: targetProjectColumn.name,
                color: targetProjectColumn.color,
                isDoneColumn: targetProjectColumn.isDoneColumn,
              },
            }
          : t
      )
    );

    try {
      const res = await fetch(`/api/projects/${movedTask.projectId}/tasks/${movedTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnId: targetProjectColumn.id }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Не вдалося перемістити задачу");
        await loadData();
      }
    } catch (err) {
      console.error("Drag end error:", err);
      await loadData();
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* 1. Global Navbar */}
      <Navbar
        projects={projects}
        currentProject={
          selectedProjectId
            ? projects.find((p) => p.id === selectedProjectId) || projects[0]
            : { id: "all", name: "Всі проєкти", key: "ALL" }
        }
        viewMode="board"
        onOpenNewTask={() => setIsCreateOpen(true)}
      />

      {/* 2. Board Controls Header */}
      <div className="border-b border-border bg-card/60 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <span>{dict.board.title}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {dict.board.subtitle}
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder={dict.common.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary w-40 sm:w-52"
            />
          </div>

          {/* Project selector filter */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg bg-secondary/60 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="">{locale === "en" ? `All projects (${projects.length})` : `Усі проєкти (${projects.length})`}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.key}] {p.name}
              </option>
            ))}
          </select>

          {/* Assignee filter */}
          <div className="flex items-center text-[11px] bg-secondary/60 p-0.5 rounded-md border border-border">
            <button
              onClick={() => setAssigneeFilter("all")}
              className={`px-2 py-1 rounded transition-colors ${
                assigneeFilter === "all"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {dict.common.all}
            </button>
            <button
              onClick={() => setAssigneeFilter("my")}
              className={`px-2 py-1 rounded transition-colors ${
                assigneeFilter === "my"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {dict.nav.myTasks}
            </button>
          </div>

          {/* Quick Create Button */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{dict.common.create}</span>
          </button>
        </div>
      </div>

      {/* 3. Large Kanban Board Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 bg-background/50">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 h-full items-start">
            {STANDARD_STAGES.map((stage) => {
              const stageTasks = columnTasksMap[stage.id] || [];

              return (
                <div
                  key={stage.id}
                  className="w-80 md:w-88 flex-shrink-0 flex flex-col max-h-full bg-secondary/30 rounded-xl border border-border/70 p-3 shadow-sm"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <h3 className="text-xs font-bold text-foreground tracking-tight">
                        {stage.id === "backlog"
                          ? dict.statuses.backlog
                          : stage.id === "inprogress"
                          ? dict.statuses.in_progress
                          : stage.id === "testing"
                          ? dict.statuses.testing
                          : stage.id === "done"
                          ? dict.statuses.done
                          : stage.name}
                      </h3>
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                        {stageTasks.length}
                      </span>
                    </div>

                    {!canChangeStatus && (
                      <span className="text-[10px] text-muted-foreground italic">
                        {dict.common.readOnly}
                      </span>
                    )}
                  </div>

                  {/* Droppable Task List */}
                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto min-h-[160px] p-1 flex flex-col gap-2.5 rounded-lg transition-colors ${
                          snapshot.isDraggingOver ? "bg-primary/5 ring-1 ring-primary/30" : ""
                        }`}
                      >
                        {loading && stageTasks.length === 0 ? (
                          <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                            {dict.common.loading}
                          </div>
                        ) : stageTasks.length === 0 ? (
                          <div className="py-10 text-center text-[11px] text-muted-foreground/60 italic border border-dashed border-border/40 rounded-lg">
                            {dict.board.noTasks}
                          </div>
                        ) : (
                          stageTasks.map((t, index) => {
                            const typeInfo = getTaskTypeInfo(t.aiContext, t.title);
                            const totalSubtasks = t.subtasks?.length || 0;
                            const completedSubtasks =
                              t.subtasks?.filter((s: any) => s.isCompleted).length || 0;

                            return (
                              <Draggable
                                key={t.id}
                                draggableId={t.id}
                                index={index}
                                isDragDisabled={!canChangeStatus}
                              >
                                {(dragProvided, dragSnapshot) => (
                                  <div
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                    onClick={() => handleOpenDetailTask(t)}
                                    style={dragProvided.draggableProps.style}
                                    className="select-none outline-none"
                                  >
                                    <div
                                      className={`p-3.5 rounded-xl border bg-card cursor-pointer shadow-sm group ${
                                        dragSnapshot.isDragging
                                          ? "border-primary/50 shadow-2xl ring-2 ring-primary/40 bg-card/95"
                                          : "border-border/80 hover:border-primary/50 hover:shadow-md transition-[border-color,background-color,box-shadow]"
                                      }`}
                                    >
                                      {/* Project Badge & Code */}
                                      <div className="flex items-center justify-between text-xs mb-1.5">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className="font-mono text-[10px] font-bold text-primary px-1.5 py-0.2 rounded bg-primary/10 border border-primary/20">
                                            {t.project?.key}
                                          </span>
                                          <span className="font-mono text-muted-foreground font-semibold group-hover:text-primary transition-colors">
                                            {t.code}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                          {getPriorityIcon(t.priority)}
                                        </div>
                                      </div>

                                      {/* Task Title */}
                                      <h4 className="text-xs font-medium text-foreground line-clamp-2 leading-snug mb-2.5">
                                        {t.title}
                                      </h4>

                                      {/* Card Footer: Metadata badges */}
                                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1.5 border-t border-border/40">
                                        <div className="flex items-center gap-2.5 text-[11px]">
                                          <div className="flex items-center gap-1" title={typeInfo.label}>
                                            {typeInfo.icon}
                                          </div>

                                          {totalSubtasks > 0 && (
                                            <span
                                              className={`flex items-center gap-1 font-mono text-[10px] ${
                                                completedSubtasks === totalSubtasks
                                                  ? "text-emerald-500 font-semibold"
                                                  : ""
                                              }`}
                                            >
                                              <CheckSquare className="w-3 h-3" />
                                              {completedSubtasks}/{totalSubtasks}
                                            </span>
                                          )}

                                          {(t._count?.comments || 0) > 0 && (
                                            <span className="flex items-center gap-1 text-[10px]">
                                              <MessageSquare className="w-3 h-3" />
                                              {t._count.comments}
                                            </span>
                                          )}
                                        </div>

                                        {/* Assignee */}
                                        {t.assignee ? (
                                          <div
                                            className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold text-[9px] flex items-center justify-center border border-primary/30"
                                            title={t.assignee.name}
                                          >
                                            {t.assignee.name.substring(0, 2).toUpperCase()}
                                          </div>
                                        ) : (
                                          <span className="text-[9px] text-muted-foreground/60 italic">
                                            —
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Task Details Modal */}
      {detailTask && (
        <TaskDetailModal
          taskId={detailTask.id}
          projectId={detailTask.projectId}
          columns={detailTask.project?.columns || []}
          isOpen={Boolean(detailTask)}
          onClose={handleCloseDetailTask}
          onTaskUpdated={loadData}
          onTaskDeleted={async () => {
            handleCloseDetailTask();
            await loadData();
          }}
        />
      )}

      {/* Create Issue Modal */}
      <JiraCreateIssueModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        projectId={selectedProjectId || projects[0]?.id || ""}
        projectName={projects.find((p) => p.id === (selectedProjectId || projects[0]?.id))?.name || ""}
        projectKey={projects.find((p) => p.id === (selectedProjectId || projects[0]?.id))?.key || ""}
        columns={projects.find((p) => p.id === (selectedProjectId || projects[0]?.id))?.columns || []}
        allProjects={projects}
        currentUser={currentUser}
        onIssueCreated={async () => {
          await loadData();
        }}
      />
    </div>
  );
}

export default function GlobalBoardsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">
          Завантаження канбан-дошки...
        </div>
      }
    >
      <GlobalBoardsPageContent />
    </Suspense>
  );
}
