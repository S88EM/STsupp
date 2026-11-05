"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { IssueDetailPane } from "@/components/jira/IssueDetailPane";
import { JiraCreateIssueModal } from "@/components/jira/JiraCreateIssueModal";
import { getTaskTypeInfo, getPriorityIcon } from "@/components/jira/IssueListPane";
import {
  Search,
  Filter,
  CheckCircle2,
  User,
  Layers,
  Inbox,
  Plus,
  FolderGit2,
  ChevronRight,
  Check,
} from "lucide-react";

type FilterType = "all" | "my" | "open";

function IssuesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlFilter = (searchParams.get("filter") as FilterType) || "all";
  const urlTaskId = searchParams.get("taskId");

  const [filterMode, setFilterMode] = useState<FilterType>(urlFilter);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
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
  }, [filterMode, selectedProjectId]);

  const handleFilterChange = (mode: FilterType) => {
    setFilterMode(mode);
    const params = new URLSearchParams(window.location.search);
    params.set("filter", mode);
    router.replace(`/issues?${params.toString()}`);
  };

  const activeTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0] || null;

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const q = searchQuery.toLowerCase().trim();
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.project?.name?.toLowerCase().includes(q) ||
        t.assignee?.name?.toLowerCase().includes(q)
    );
  }, [tasks, searchQuery]);

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
        <div className="w-56 md:w-64 border-r border-border bg-card/60 flex flex-col flex-shrink-0 select-none">
          <div className="p-3 border-b border-border/80">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2 px-2">
              Фільтри задач
            </span>
            <div className="space-y-1">
              <button
                onClick={() => handleFilterChange("all")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  filterMode === "all"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Всі задачі</span>
                </div>
                {filterMode === "all" && (
                  <span className="text-[10px] font-mono bg-primary-foreground/20 px-1.5 py-0.2 rounded-full">
                    {tasks.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleFilterChange("my")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  filterMode === "my"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  <span>Призначені мені</span>
                </div>
                {filterMode === "my" && (
                  <span className="text-[10px] font-mono bg-primary-foreground/20 px-1.5 py-0.2 rounded-full">
                    {tasks.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleFilterChange("open")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  filterMode === "open"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Відкриті задачі</span>
                </div>
                {filterMode === "open" && (
                  <span className="text-[10px] font-mono bg-primary-foreground/20 px-1.5 py-0.2 rounded-full">
                    {tasks.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Project Scope Filter */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2 px-2">
              Проєкти
            </span>

            <button
              onClick={() => setSelectedProjectId("")}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                selectedProjectId === ""
                  ? "bg-secondary text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <span className="truncate">Всі дозволені проєкти</span>
              {selectedProjectId === "" && <Check className="w-3 h-3 text-primary" />}
            </button>

            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  selectedProjectId === p.id
                    ? "bg-secondary text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-mono text-[10px] text-primary">[{p.key}]</span>
                  <span className="truncate">{p.name}</span>
                </div>
                {selectedProjectId === p.id && <Check className="w-3 h-3 text-primary" />}
              </button>
            ))}
          </div>
        </div>

        {/* Middle Column: Task List */}
        <div className="w-80 md:w-96 flex flex-col border-r border-border bg-card/40 flex-shrink-0 select-none">
          {/* Header & Search */}
          <div className="p-3 border-b border-border/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-foreground tracking-tight">
                  {filterMode === "my"
                    ? "Призначені мені"
                    : filterMode === "open"
                    ? "Відкриті задачі"
                    : "Всі задачі"}
                </h3>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full bg-secondary text-muted-foreground border border-border">
                  {filteredTasks.length}
                </span>
              </div>

              {/* Quick Tab Switcher */}
              <div className="flex items-center gap-1 text-[10px] bg-secondary/60 p-0.5 rounded-md border border-border/70">
                <button
                  onClick={() => handleFilterChange("all")}
                  className={`px-2 py-0.5 rounded transition-all ${
                    filterMode === "all"
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Всі
                </button>
                <button
                  onClick={() => handleFilterChange("my")}
                  className={`px-2 py-0.5 rounded transition-all ${
                    filterMode === "my"
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Мої
                </button>
                <button
                  onClick={() => handleFilterChange("open")}
                  className={`px-2 py-0.5 rounded transition-all ${
                    filterMode === "open"
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Відкриті
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Пошук за кодом, назвою, проєктом..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/50">
            {loading ? (
              <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
                Завантаження задач...
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="py-16 px-4 text-center text-xs text-muted-foreground space-y-2">
                <Inbox className="w-8 h-8 mx-auto text-muted-foreground/40" />
                <p>Задач за обраним фільтром не знайдено</p>
              </div>
            ) : (
              filteredTasks.map((t) => {
                const typeInfo = getTaskTypeInfo(t.aiContext, t.title);
                const isSelected = activeTask?.id === t.id;

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTaskId(t.id)}
                    className={`p-3 text-xs cursor-pointer transition-colors border-l-2 ${
                      isSelected
                        ? "bg-primary/10 border-primary"
                        : "border-transparent hover:bg-secondary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {typeInfo.icon}
                        <span className="font-mono font-bold text-primary text-[11px]">
                          {t.code}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate font-medium">
                          ({t.project?.key})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {getPriorityIcon(t.priority)}
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-semibold text-white"
                          style={{ backgroundColor: t.column?.color || "#3b82f6" }}
                        >
                          {t.column?.name}
                        </span>
                      </div>
                    </div>

                    <h4 className="font-medium text-foreground text-xs line-clamp-2 leading-snug mb-1.5">
                      {t.title}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="truncate max-w-[140px] text-[10px]">
                        {t.project?.name}
                      </span>
                      {t.assignee ? (
                        <span className="text-[10px] font-medium text-foreground">
                          {t.assignee.name.split(" ")[0]}
                        </span>
                      ) : (
                        <span className="text-[9px] text-muted-foreground italic">
                          не призначено
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

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
