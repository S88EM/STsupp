"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { ColumnItem } from "@/components/board/ColumnCard";
import { ProjectSidebar, JiraNavSection } from "@/components/jira/ProjectSidebar";
import { IssueListPane } from "@/components/jira/IssueListPane";
import { IssueDetailPane } from "@/components/jira/IssueDetailPane";
import { JiraCreateIssueModal } from "@/components/jira/JiraCreateIssueModal";
import { AgileViews } from "@/components/jira/AgileViews";
import { ProjectSettingsModal } from "@/components/project/ProjectSettingsModal";
import { getStatusSemantic } from "@/components/jira/issue-detail/types";
import { getCanonicalTaskPath, extractTaskCodeFromPath } from "@/lib/taskUrl";

export interface ProjectWorkspaceProps {
  initialProjectId?: string;
  initialTaskId?: string;
  initialTaskCode?: string;
  initialSection?: JiraNavSection;
  isDirectBrowseMode?: boolean;
}

export function ProjectWorkspace({
  initialProjectId,
  initialTaskId,
  initialTaskCode,
  initialSection,
  isDirectBrowseMode = false,
}: ProjectWorkspaceProps) {
  const params = useParams();
  const searchParams = useSearchParams();

  const projectId = initialProjectId || (params?.projectId as string);
  const urlTaskId = searchParams?.get("taskId");
  const urlSection = searchParams?.get("section") as JiraNavSection | null;

  const [project, setProject] = useState<any>(null);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [columns, setColumns] = useState<ColumnItem[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Jira Navigation & 3-Panel State
  const [activeSection, setActiveSection] = useState<JiraNavSection>(
    initialSection ||
      (urlSection && ["issues", "board", "backlog", "releases", "reports", "components"].includes(urlSection)
        ? urlSection
        : "issues")
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(initialTaskId || urlTaskId || null);

  // Modals
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const fetchProjectData = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        setColumns(data.columns || []);

        try {
          sessionStorage.setItem("stsup_active_project_id", projectId);
        } catch (e) {}

        // Flatten tasks to match requested task or default
        const all = (data.columns || []).flatMap((c: any) => c.tasks || []);

        let taskToSelect: any = null;
        if (initialTaskCode) {
          taskToSelect = all.find(
            (t: any) => t.code && t.code.toUpperCase() === initialTaskCode.toUpperCase()
          );
        }
        if (!taskToSelect && (initialTaskId || urlTaskId)) {
          const targetId = initialTaskId || urlTaskId;
          taskToSelect = all.find((t: any) => t.id === targetId);
        }

        if (taskToSelect) {
          setSelectedTaskId(taskToSelect.id);
          setActiveSection("issues");

          // If accessed via old technical link /projects/...(?taskId=...) or section=issues,
          // replace URL in address bar with canonical /browse/{CODE} without full reload
          if (taskToSelect.code && typeof window !== "undefined") {
            const canonicalPath = getCanonicalTaskPath(taskToSelect.code);
            if (window.location.pathname !== canonicalPath) {
              window.history.replaceState(
                { taskId: taskToSelect.id, code: taskToSelect.code },
                "",
                canonicalPath
              );
            }
          }
        } else if (all.length > 0 && !selectedTaskId) {
          setSelectedTaskId(all[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching project:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId, initialTaskCode, initialTaskId, urlTaskId, selectedTaskId]);

  useEffect(() => {
    if (urlTaskId) {
      setSelectedTaskId(urlTaskId);
      setActiveSection("issues");
    }
  }, [urlTaskId]);

  useEffect(() => {
    if (
      urlSection &&
      ["issues", "board", "backlog", "releases", "reports", "components"].includes(urlSection)
    ) {
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

  // All tasks flattened with column metadata for Issue List
  const allTasks = useMemo(() => {
    return columns.flatMap((c) =>
      (c.tasks || []).map((t) => ({
        ...t,
        columnName: c.name,
        columnColor: c.color,
        isDoneColumn: Boolean(c.isDoneColumn),
      }))
    );
  }, [columns]);

  // Backlog-only tasks: strictly tasks awaiting pickup (not in progress, testing, done or closed)
  const backlogTasks = useMemo(() => {
    return allTasks.filter((t) => {
      const isClosed = Boolean(t.aiContext?.isClosed);
      if (isClosed || t.isDoneColumn) return false;
      const semantic = getStatusSemantic(t.columnName, t.isDoneColumn, isClosed);
      return semantic.key === "backlog";
    });
  }, [allTasks]);

  // Active selected task
  const activeTask = allTasks.find((t) => t.id === selectedTaskId) || allTasks[0] || null;

  // Handle task selection: updates state and synchronizes canonical URL in address bar
  const handleSelectTask = useCallback((task: any) => {
    if (!task) return;
    setSelectedTaskId(task.id);
    setActiveSection("issues");

    if (task.code && typeof window !== "undefined") {
      const canonicalPath = getCanonicalTaskPath(task.code);
      if (window.location.pathname !== canonicalPath) {
        window.history.pushState(
          { taskId: task.id, code: task.code },
          "",
          canonicalPath
        );
      }
    }
  }, []);

  // Handle section navigation (Sidebar / Navbar)
  const handleSelectSection = useCallback(
    (sec: JiraNavSection) => {
      setActiveSection(sec);
      if (typeof window !== "undefined") {
        if (sec === "issues") {
          if (activeTask?.code) {
            const canonicalPath = getCanonicalTaskPath(activeTask.code);
            if (window.location.pathname !== canonicalPath) {
              window.history.pushState(
                { taskId: activeTask.id, code: activeTask.code },
                "",
                canonicalPath
              );
            }
            return;
          }
        }
        // Switch to other section URL
        const newPath = `/projects/${projectId}?section=${sec}`;
        window.history.pushState({ section: sec }, "", newPath);
      }
    },
    [activeTask, projectId]
  );

  // Browser History Back/Forward (popstate) listener
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === "undefined") return;
      const path = window.location.pathname;
      const codeFromPath = extractTaskCodeFromPath(path);

      if (codeFromPath) {
        const matched = allTasks.find(
          (t) => t.code && t.code.toUpperCase() === codeFromPath.toUpperCase()
        );
        if (matched) {
          setSelectedTaskId(matched.id);
          setActiveSection("issues");
        }
      } else if (path.startsWith("/projects/")) {
        const sp = new URLSearchParams(window.location.search);
        const sec = sp.get("section") as JiraNavSection | null;
        if (
          sec &&
          ["issues", "board", "backlog", "releases", "reports", "components"].includes(sec)
        ) {
          setActiveSection(sec);
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [allTasks]);

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

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* 1. Jira Global Header */}
      <Navbar
        currentProject={project}
        projects={allProjects}
        viewMode={activeSection === "board" ? "board" : "list"}
        onViewModeChange={(mode) => handleSelectSection(mode === "board" ? "board" : "issues")}
        onOpenNewTask={() => setIsCreateIssueOpen(true)}
        activeSection={activeSection}
        onSelectSection={(sec) => handleSelectSection(sec as JiraNavSection)}
      />

      {/* Main Workspace: Left Sidebar + Center Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* 2. Left Project Sidebar */}
        <ProjectSidebar
          project={project}
          activeSection={activeSection}
          onSelectSection={(sec) => handleSelectSection(sec)}
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
              onSelectTask={handleSelectTask}
              onOpenCreateTask={() => setIsCreateIssueOpen(true)}
              currentUserId={currentUser?.userId}
            />

            {/* Right Column: Issue Detail View */}
            <IssueDetailPane
              taskId={activeTask?.id || null}
              projectId={activeTask?.projectId || projectId}
              projectName={activeTask?.project?.name || project.name}
              projectKey={activeTask?.project?.key || project.key}
              columns={activeTask?.project?.columns || columns}
              onTaskUpdated={fetchProjectData}
              onTaskDeleted={async () => {
                setSelectedTaskId(null);
                if (typeof window !== "undefined") {
                  window.history.pushState(
                    null,
                    "",
                    `/projects/${projectId}?section=${activeSection}`
                  );
                }
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
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">Беклог проєкту</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-semibold">
                    {backlogTasks.length}
                  </span>
                </div>
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
                {backlogTasks.length === 0 ? (
                  <div className="py-12 text-center text-xs text-muted-foreground">
                    У беклозі цього проєкту немає задач, які очікують на взяття в роботу.
                  </div>
                ) : (
                  backlogTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleSelectTask(t)}
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
        projectId={projectId === "all" ? (allProjects[0]?.id || "all") : projectId}
        projectName={projectId === "all" ? (allProjects[0]?.name || project.name) : project.name}
        projectKey={projectId === "all" ? (allProjects[0]?.key || project.key) : project.key}
        columns={columns}
        allProjects={allProjects}
        currentUser={currentUser}
        onIssueCreated={async (newIssue) => {
          await fetchProjectData();
          if (newIssue?.id) {
            handleSelectTask(newIssue);
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
    </div>
  );
}
