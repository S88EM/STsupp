"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { ColumnItem } from "@/components/board/ColumnCard";
import { TaskItem } from "@/components/board/TaskCard";
import { ProjectSidebar, JiraNavSection } from "@/components/jira/ProjectSidebar";
import { IssueListPane } from "@/components/jira/IssueListPane";
import { IssueDetailPane } from "@/components/jira/IssueDetailPane";
import { JiraCreateIssueModal } from "@/components/jira/JiraCreateIssueModal";
import { AgileViews } from "@/components/jira/AgileViews";
import { ProjectSettingsModal } from "@/components/project/ProjectSettingsModal";
import { TaskDetailModal } from "@/components/board/TaskDetailModal";

function ProjectPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params?.projectId as string;
  const urlTaskId = searchParams?.get("taskId");
  const urlSection = searchParams?.get("section") as JiraNavSection | null;

  const [project, setProject] = useState<any>(null);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [columns, setColumns] = useState<ColumnItem[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Jira Navigation & 3-Panel State
  const [activeSection, setActiveSection] = useState<JiraNavSection>("issues");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Modals
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [boardDetailTaskId, setBoardDetailTaskId] = useState<string | null>(null);

  const fetchProjectData = async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        setColumns(data.columns || []);

        // Flatten tasks to set default selected task if none selected
        const all = (data.columns || []).flatMap((c: any) => c.tasks || []);
        if (urlTaskId && all.some((t: any) => t.id === urlTaskId)) {
          setSelectedTaskId(urlTaskId);
          setActiveSection("issues");
        } else if (all.length > 0 && !selectedTaskId) {
          setSelectedTaskId(all[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching project:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlTaskId) {
      setSelectedTaskId(urlTaskId);
      setActiveSection("issues");
    }
  }, [urlTaskId]);

  useEffect(() => {
    if (urlSection && ["issues", "board", "backlog", "releases", "reports", "components"].includes(urlSection)) {
      setActiveSection(urlSection);
    }
  }, [urlSection]);

  const fetchInitialData = async () => {
    try {
      const [allProjRes, meRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/auth/me"),
      ]);

      if (allProjRes.ok) {
        const data = await allProjRes.json();
        setAllProjects(data);
      }
      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUser(meData.user);
      }
    } catch (err) {
      console.error("Initial load error:", err);
    }
  };

  useEffect(() => {
    fetchProjectData();
    fetchInitialData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">
        Завантаження проєкту Jira...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-3">
        <h2 className="text-xl font-bold text-foreground">Проєкт не знайдено</h2>
        <a href="/" className="text-xs text-primary underline">
          Повернутися на головну
        </a>
      </div>
    );
  }

  // All tasks flattened with column metadata for Issue List
  const allTasks = columns.flatMap((c) =>
    c.tasks.map((t) => ({ ...t, columnName: c.name, columnColor: c.color }))
  );

  // If selected task is deleted or invalid, fall back to first task
  const activeTask = allTasks.find((t) => t.id === selectedTaskId) || allTasks[0] || null;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* 1. Jira Global Header */}
      <Navbar
        currentProject={project}
        projects={allProjects}
        viewMode={activeSection === "board" ? "board" : "list"}
        onViewModeChange={(mode) => setActiveSection(mode === "board" ? "board" : "issues")}
        onOpenNewTask={() => setIsCreateIssueOpen(true)}
        activeSection={activeSection}
        onSelectSection={(sec) => setActiveSection(sec as JiraNavSection)}
      />

      {/* Main Workspace: Left Sidebar + Center Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* 2. Left Project Sidebar */}
        <ProjectSidebar
          project={project}
          activeSection={activeSection}
          onSelectSection={(sec) => setActiveSection(sec)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isAdmin={currentUser?.role === "ADMIN"}
        />

        {/* 3 & 4. Main Content Area */}
        {activeSection === "issues" ? (
          /* Classical 3-Panel Jira View: Middle Column (Issue List) + Right Column (Issue Detail) */
          <div className="flex-1 flex overflow-hidden">
            {/* Middle Column: Issue List */}
            <IssueListPane
              tasks={allTasks}
              selectedTaskId={activeTask?.id || null}
              onSelectTask={(t) => setSelectedTaskId(t.id)}
              onOpenCreateTask={() => setIsCreateIssueOpen(true)}
              currentUserId={currentUser?.userId}
            />

            {/* Right Column: Issue Detail View */}
            <IssueDetailPane
              taskId={activeTask?.id || null}
              projectId={projectId}
              projectName={project.name}
              projectKey={project.key}
              columns={columns}
              onTaskUpdated={fetchProjectData}
              onTaskDeleted={async () => {
                setSelectedTaskId(null);
                await fetchProjectData();
              }}
              currentUser={currentUser}
            />
          </div>
        ) : activeSection === "board" ? (
          /* Kanban Board View */
          <div className="flex-1 overflow-x-auto flex flex-col">
            <KanbanBoard
              projectId={projectId}
              initialColumns={columns}
              onRefresh={fetchProjectData}
              currentUser={currentUser}
            />
          </div>
        ) : activeSection === "backlog" ? (
          /* Backlog List View */
          <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto w-full space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Беклог проєкту</h2>
                <p className="text-xs text-muted-foreground">
                  Загальний реєстр усіх задач, які очікують на взяття в роботу
                </p>
              </div>
              <button
                onClick={() => setIsCreateIssueOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all"
              >
                + Створити задачу
              </button>
            </div>

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
                    У цьому проєкті ще немає задач. Натисніть кнопку «+ Створити»!
                  </div>
                ) : (
                  allTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTaskId(t.id);
                        setActiveSection("issues");
                      }}
                      className="grid grid-cols-12 px-4 py-3 text-xs items-center hover:bg-secondary/30 cursor-pointer transition-colors"
                    >
                      <div className="col-span-2 font-mono font-bold text-primary">
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
        ) : (
          /* Sprints, Releases, Reports, Components Views */
          <AgileViews
            section={activeSection as any}
            projectId={projectId}
            projectKey={project.key}
            projectName={project.name}
            columns={columns}
            tasks={allTasks}
            onOpenCreateTask={() => setIsCreateIssueOpen(true)}
          />
        )}
      </div>

      {/* Global Jira Quick Create Issue Modal */}
      <JiraCreateIssueModal
        isOpen={isCreateIssueOpen}
        onClose={() => setIsCreateIssueOpen(false)}
        projectId={projectId}
        projectName={project.name}
        projectKey={project.key}
        columns={columns}
        allProjects={allProjects}
        currentUser={currentUser}
        onIssueCreated={async (newIssue) => {
          await fetchProjectData();
          if (newIssue?.id) {
            setSelectedTaskId(newIssue.id);
            setActiveSection("issues");
          }
        }}
      />

      {/* Project Settings Modal */}
      <ProjectSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        project={project}
        allProjects={allProjects}
        onProjectUpdated={fetchProjectData}
        onProjectDeleted={() => {
          window.location.href = "/";
        }}
      />

      {/* Kanban Board Task Detail Modal (if opened from Board) */}
      <TaskDetailModal
        taskId={boardDetailTaskId}
        projectId={projectId}
        columns={columns}
        isOpen={Boolean(boardDetailTaskId)}
        onClose={() => setBoardDetailTaskId(null)}
        onTaskUpdated={fetchProjectData}
        onTaskDeleted={async () => {
          setBoardDetailTaskId(null);
          await fetchProjectData();
        }}
      />
    </div>
  );
}

export default function ProjectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">
          Завантаження проєкту Jira...
        </div>
      }
    >
      <ProjectPageContent />
    </Suspense>
  );
}
