"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { IssueDetailPane } from "@/components/jira/IssueDetailPane";
import { JiraCreateIssueModal } from "@/components/jira/JiraCreateIssueModal";
import { Layers } from "lucide-react";
import {
  FilterType,
  IssuesSidebar,
  IssuesMiddleList,
} from "@/components/jira/issues-page";

function IssuesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlFilter = (searchParams.get("filter") as FilterType) || "all";
  const urlTaskId = searchParams.get("taskId");

  const [filterMode, setFilterMode] = useState<FilterType>(urlFilter);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedComponent, setSelectedComponent] = useState<string>("");
  const [selectedLabel, setSelectedLabel] = useState<string>("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(urlTaskId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Sync with URL query parameter
  useEffect(() => {
    if (urlFilter && ["all", "my", "open"].includes(urlFilter)) {
      setFilterMode(urlFilter);
    }
  }, [urlFilter]);

  useEffect(() => {
    if (urlTaskId) {
      setSelectedTaskId(urlTaskId);
    }
  }, [urlTaskId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("filter", filterMode);
      if (selectedProjectId) {
        params.set("projectId", selectedProjectId);
      }
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }
      if (selectedComponent) {
        params.set("component", selectedComponent);
      }
      if (selectedLabel) {
        params.set("label", selectedLabel);
      }

      const [tasksRes, meRes] = await Promise.all([
        fetch(`/api/tasks?${params.toString()}`),
        fetch("/api/auth/me"),
      ]);

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks || []);
        setProjects(data.projects || []);

        // Auto select first task if none selected or selected task not in list
        const currentList = data.tasks || [];
        if (currentList.length > 0) {
          if (!selectedTaskId || !currentList.some((t: any) => t.id === selectedTaskId)) {
            setSelectedTaskId(currentList[0].id);
          }
        } else {
          setSelectedTaskId(null);
        }
      }

      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUser(meData.user);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filterMode, selectedProjectId, selectedComponent, selectedLabel]);

  const handleFilterChange = (mode: FilterType) => {
    setFilterMode(mode);
    const params = new URLSearchParams(window.location.search);
    params.set("filter", mode);
    router.replace(`/issues?${params.toString()}`);
  };

  // Available components & labels extracted from tasks
  const availableComponents = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      const comps = t.aiContext?.components;
      if (Array.isArray(comps)) {
        comps.forEach((c: string) => {
          if (c && typeof c === "string") set.add(c);
        });
      }
    });
    return Array.from(set).sort();
  }, [tasks]);

  const availableLabels = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      const lbls = t.aiContext?.labels;
      if (Array.isArray(lbls)) {
        lbls.forEach((l: string) => {
          if (l && typeof l === "string") set.add(l);
        });
      }
    });
    return Array.from(set).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCode = t.code.toLowerCase().includes(q);
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesProject = t.project?.name?.toLowerCase().includes(q);
        const matchesAssignee = t.assignee?.name?.toLowerCase().includes(q);
        if (!matchesCode && !matchesTitle && !matchesProject && !matchesAssignee) return false;
      }

      // 2. Component Filter
      if (selectedComponent) {
        const comps = t.aiContext?.components;
        if (!Array.isArray(comps) || !comps.includes(selectedComponent)) return false;
      }

      // 3. Label Filter
      if (selectedLabel) {
        const lbls = t.aiContext?.labels;
        if (!Array.isArray(lbls) || !lbls.includes(selectedLabel)) return false;
      }

      return true;
    });
  }, [tasks, searchQuery, selectedComponent, selectedLabel]);

  const activeTask = filteredTasks.find((t) => t.id === selectedTaskId) || filteredTasks[0] || null;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* 1. Global Navbar */}
      <Navbar
        currentProject={activeTask?.project || projects[0]}
        projects={projects}
        viewMode="list"
        onOpenNewTask={() => setIsCreateOpen(true)}
      />

      {/* 2. Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Filter Nav & Project Filters */}
        <IssuesSidebar
          filterMode={filterMode}
          onFilterChange={handleFilterChange}
          tasksCount={tasks.length}
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          availableComponents={availableComponents}
          selectedComponent={selectedComponent}
          onSelectComponent={setSelectedComponent}
          availableLabels={availableLabels}
          selectedLabel={selectedLabel}
          onSelectLabel={setSelectedLabel}
          onResetAttributes={() => {
            setSelectedComponent("");
            setSelectedLabel("");
          }}
        />

        {/* Middle Column: Task List */}
        <IssuesMiddleList
          filterMode={filterMode}
          onFilterChange={handleFilterChange}
          filteredTasks={filteredTasks}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedComponent={selectedComponent}
          onClearComponent={() => setSelectedComponent("")}
          selectedLabel={selectedLabel}
          onClearLabel={() => setSelectedLabel("")}
          loading={loading}
          activeTaskId={activeTask?.id || null}
          onSelectTask={setSelectedTaskId}
        />

        {/* Right Column: Active Task Details */}
        <div className="flex-1 flex overflow-hidden">
          {activeTask ? (
            <IssueDetailPane
              taskId={activeTask.id}
              projectId={activeTask.projectId}
              projectName={activeTask.project?.name}
              projectKey={activeTask.project?.key}
              columns={activeTask.project?.columns || []}
              onTaskUpdated={fetchTasks}
              onTaskDeleted={async () => {
                setSelectedTaskId(null);
                await fetchTasks();
              }}
              currentUser={currentUser}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-3">
              <Layers className="w-12 h-12 text-muted-foreground/30" />
              <h3 className="text-sm font-semibold text-foreground">Оберіть задачу для перегляду</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Клікніть на будь-яку задачу у списку зліва, щоб переглянути деталі, додати коментарі чи вкладені файли.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Global Create Issue Modal */}
      <JiraCreateIssueModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        projectId={activeTask?.projectId || projects[0]?.id || ""}
        projectName={activeTask?.project?.name || projects[0]?.name || ""}
        projectKey={activeTask?.project?.key || projects[0]?.key || ""}
        columns={activeTask?.project?.columns || projects[0]?.columns || []}
        allProjects={projects}
        currentUser={currentUser}
        onIssueCreated={async (newIssue) => {
          await fetchTasks();
          if (newIssue?.id) {
            setSelectedTaskId(newIssue.id);
          }
        }}
      />
    </div>
  );
}

export default function IssuesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">
          Завантаження задач...
        </div>
      }
    >
      <IssuesPageContent />
    </Suspense>
  );
}
