"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  LifeBuoy,
  LogOut,
  LayoutGrid,
  Filter,
  CheckCircle2,
  Clock,
  MessageSquare,
  Paperclip,
  Shield,
  User,
  UserCheck,
  AlertCircle,
  RefreshCw,
  FolderGit2,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Layers,
  Sparkles,
  Inbox,
} from "lucide-react";
import { ClientCreateTicketModal } from "@/components/portal/ClientCreateTicketModal";
import { ClientTicketDetailModal } from "@/components/portal/ClientTicketDetailModal";
import { ThemeSwitcherButton } from "@/components/theme/ThemeSwitcher";
import { formatTimeAgo } from "@/lib/utils";

interface ProjectItem {
  id: string;
  name: string;
  key: string;
  columns?: Array<{ id: string; name: string; color?: string; isDoneColumn?: boolean; orderIndex?: number }>;
}

interface TicketItem {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  createdAt: string;
  updatedAt: string;
  projectId: string;
  columnId: string;
  creatorId?: string | null;
  assigneeId?: string | null;
  aiContext?: any;
  assignee?: { id: string; name: string; email: string; role?: string; avatarUrl?: string | null } | null;
  creator?: { id: string; name: string; email: string } | null;
  column?: { id: string; name: string; color?: string; isDoneColumn?: boolean; orderIndex?: number } | null;
  project?: {
    id: string;
    name: string;
    key: string;
    columns?: Array<{ id: string; name: string; color?: string; isDoneColumn?: boolean; orderIndex?: number }>;
  } | null;
  attachments?: any[];
  _count?: { comments: number; attachments: number; subtasks: number };
}

type PortalStatusFilter = "all" | "in_progress" | "backlog" | "awaiting_response" | "resolved";

function isTaskResolved(t: TicketItem): boolean {
  if (t.column?.isDoneColumn) return true;
  const colName = (t.column?.name || "").trim().toLowerCase();
  if (["готово", "done", "resolved", "вирішено", "закрито", "closed"].includes(colName)) {
    return true;
  }
  const aiCtx = (t.aiContext || {}) as Record<string, any>;
  if (aiCtx.isClosed === true) return true;
  if (
    aiCtx.resolution &&
    ["вирішено", "resolved", "done", "закрито", "closed"].includes(String(aiCtx.resolution).toLowerCase())
  ) {
    return true;
  }
  return false;
}

function isTaskBacklog(t: TicketItem): boolean {
  if (isTaskResolved(t)) return false;
  const colName = (t.column?.name || "").trim().toLowerCase();
  if (
    [
      "беклог",
      "backlog",
      "новий",
      "нові",
      "new",
      "to do",
      "todo",
      "відкрито",
      "в черзі",
      "черга",
      "backlog (новий)",
    ].includes(colName)
  ) {
    return true;
  }
  if (t.column && t.project?.columns && t.project.columns.length > 0) {
    const firstCol = t.project.columns[0];
    if (
      firstCol &&
      t.column.id === firstCol.id &&
      !colName.includes("робот") &&
      !colName.includes("progress") &&
      !colName.includes("тест")
    ) {
      return true;
    }
  }
  return false;
}

function isTaskInProgress(t: TicketItem): boolean {
  if (isTaskResolved(t)) return false;
  if (isTaskBacklog(t)) return false;
  return true;
}

function isAwaitingClientResponse(t: TicketItem, currentUserId?: string): boolean {
  if (isTaskResolved(t)) return false;
  // If explicitly flagged in aiContext
  if (t.aiContext?.awaitingClient === true) return true;
  // If the task is assigned to the current client user
  if (currentUserId && (t.assigneeId === currentUserId || t.assignee?.id === currentUserId)) {
    return true;
  }
  // Or if the assignee has the CLIENT role
  if (t.assignee && t.assignee.role === "CLIENT") {
    return true;
  }
  // Or if column name indicates awaiting response
  const colName = (t.column?.name || "").toLowerCase();
  if (colName.includes("очікує відповіді") || colName.includes("очікує клієнт") || colName.includes("waiting")) {
    return true;
  }
  return false;
}

export default function ClientPortalPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [allTickets, setAllTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<PortalStatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [scopeFilter, setScopeFilter] = useState<"all" | "my">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicketProjectId, setSelectedTicketProjectId] = useState<string>("");

  // Profile menu
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Load user data
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.replace("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  // Load projects
  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0 && !selectedProjectId) {
          if (data.length === 1) {
            setSelectedProjectId(data[0].id);
          }
        }
      }
    } catch (err) {
      console.error("Error loading projects:", err);
    }
  }, [selectedProjectId]);

  // Load tickets for current project and scope
  const loadTickets = useCallback(
    async (showLoadingSpinner = false) => {
      if (showLoadingSpinner) setLoading(true);
      else setRefreshing(true);

      try {
        const queryParams = new URLSearchParams();
        if (selectedProjectId) queryParams.set("projectId", selectedProjectId);
        if (scopeFilter === "my") queryParams.set("scope", "my");

        const res = await fetch(`/api/tasks?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setAllTickets(data.tasks || []);
        }
      } catch (err) {
        console.error("Error loading tickets:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedProjectId, scopeFilter]
  );

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    loadTickets(true);
  }, [loadTickets]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      window.location.replace("/login");
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name?.trim()) {
      const parts = name.trim().split(" ");
      if (parts.length > 1) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    return email ? email.slice(0, 2).toUpperCase() : "U";
  };

  // Metrics computation across all tickets in current scope/project
  const metrics = useMemo(() => {
    let inProgress = 0;
    let resolved = 0;
    let backlog = 0;
    let awaitingResponse = 0;

    for (const t of allTickets) {
      if (isTaskResolved(t)) {
        resolved++;
      } else {
        if (isAwaitingClientResponse(t, currentUser?.id)) {
          awaitingResponse++;
        }
        if (isTaskInProgress(t)) {
          inProgress++;
        } else if (isTaskBacklog(t)) {
          backlog++;
        }
      }
    }

    return {
      total: allTickets.length,
      inProgress,
      resolved,
      backlog,
      awaitingResponse,
    };
  }, [allTickets, currentUser?.id]);

  // Displayed tickets filtered strictly according to active status, priority, and search query
  const displayedTickets = useMemo(() => {
    let list = allTickets;

    // 1. Status Filter
    if (statusFilter === "in_progress") {
      list = list.filter(isTaskInProgress);
    } else if (statusFilter === "resolved") {
      list = list.filter(isTaskResolved);
    } else if (statusFilter === "backlog") {
      list = list.filter(isTaskBacklog);
    } else if (statusFilter === "awaiting_response") {
      list = list.filter((t) => isAwaitingClientResponse(t, currentUser?.id));
    }

    // 2. Priority Filter
    if (priorityFilter !== "all") {
      list = list.filter((t) => t.priority === priorityFilter);
    }

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    return list;
  }, [allTickets, statusFilter, priorityFilter, searchQuery, currentUser?.id]);

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "CRITICAL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            🔴 Критична
          </span>
        );
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            🟠 Висока
          </span>
        );
      case "LOW":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            🟢 Низька
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            🔵 Звичайна
          </span>
        );
    }
  };

  const isStaffUser = currentUser?.role === "ADMIN" || currentUser?.role === "ENGINEER";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col select-none">
      {/* Top Navigation */}
      <header className="h-14 border-b border-border bg-card/85 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/portal" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
              ST
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-foreground">STsup</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/20">
                Портал підтримки
              </span>
            </div>
          </Link>

          {/* Project selector if client has multiple */}
          {projects.length > 1 && (
            <div className="hidden md:flex items-center gap-1.5 ml-4 pl-4 border-l border-border/80">
              <span className="text-xs text-muted-foreground">Проєкт:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="text-xs px-2.5 py-1 rounded-lg bg-secondary/50 border border-border text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Всі доступні проєкти ({projects.length})</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.key}] {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Switch to Dev/Admin Board if privileged */}
          {isStaffUser && (
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/60 hover:bg-secondary border border-border text-xs font-medium text-foreground transition-colors"
              title="Перейти до інженерної панелі розробника"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-primary" />
              <span>Панель розробника</span>
            </Link>
          )}

          {/* Create Ticket Primary CTA */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Створити звернення</span>
          </button>

          {/* Theme Switcher */}
          <ThemeSwitcherButton />

          {/* User Profile */}
          {currentUser && (
            <div className="relative pl-1 border-l border-border/80">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-secondary transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-bold text-[11px]">
                  {getInitials(currentUser.name, currentUser.email)}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-semibold text-foreground leading-none">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    {currentUser.role === "CLIENT" ? "Клієнт" : currentUser.role}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-muted-foreground hidden lg:block" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 top-11 w-56 rounded-xl bg-card border border-border shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="px-3 py-2 border-b border-border/60">
                    <span className="text-xs font-bold text-foreground block truncate">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {currentUser.email}
                    </span>
                    <span className="text-[10px] font-semibold text-primary mt-1 inline-block">
                      {currentUser.role === "CLIENT" ? "Клієнтський обліковий запис" : currentUser.role}
                    </span>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Вийти з акаунта</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card/90 to-primary/10 border border-border p-6 sm:p-8 shadow-sm">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Центр обслуговування клієнтів</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Вітаємо, {currentUser?.name || "Користувач"}!
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Подавайте звернення до служби підтримки, прикріплюйте скріншоти та контролюйте хід виконання онлайн.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Створити нове звернення</span>
            </button>

            <button
              onClick={() => loadTickets(false)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-secondary/60 hover:bg-secondary border border-border text-xs font-semibold text-foreground transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
              <span>Оновити дані</span>
            </button>
          </div>
        </div>

        {/* Metric / KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Всі звернення */}
          <button
            onClick={() => setStatusFilter("all")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-primary/10 border-primary/50 shadow-sm ring-1 ring-primary/40"
                : "bg-card/70 border-border hover:bg-card"
            }`}
          >
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Всі звернення</span>
              <Layers className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">{metrics.total}</div>
            <span className="text-[11px] text-muted-foreground mt-1 block">У доступних проєктах</span>
          </button>

          {/* Card 2: В роботі */}
          <button
            onClick={() => setStatusFilter("in_progress")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              statusFilter === "in_progress"
                ? "bg-blue-500/15 border-blue-500/50 shadow-sm ring-1 ring-blue-500/40"
                : "bg-card/70 border-border hover:bg-card"
            }`}
          >
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">В роботі</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-blue-400">{metrics.inProgress}</div>
            <span className="text-[11px] text-muted-foreground mt-1 block">Активні задачі інженерів</span>
          </button>

          {/* Card 3: Вирішено */}
          <button
            onClick={() => setStatusFilter("resolved")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              statusFilter === "resolved"
                ? "bg-emerald-500/15 border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/40"
                : "bg-card/70 border-border hover:bg-card"
            }`}
          >
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Вирішено</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400">{metrics.resolved}</div>
            <span className="text-[11px] text-muted-foreground mt-1 block">Успішно закриті тікети</span>
          </button>

          {/* Card 4: Очікує відповіді */}
          <button
            onClick={() => setStatusFilter("awaiting_response")}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
              statusFilter === "awaiting_response"
                ? "bg-purple-500/15 border-purple-500/50 shadow-sm ring-1 ring-purple-500/40 text-purple-400"
                : "bg-card/70 border-border hover:bg-card"
            }`}
          >
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Очікує відповіді</span>
              <AlertCircle
                className={`w-4 h-4 ${
                  metrics.awaitingResponse > 0 ? "text-amber-400 animate-pulse" : "text-purple-400"
                }`}
              />
            </div>
            <div
              className={`text-2xl sm:text-3xl font-bold ${
                metrics.awaitingResponse > 0 ? "text-amber-400" : "text-purple-400"
              }`}
            >
              {metrics.awaitingResponse}
            </div>
            <span className="text-[11px] text-muted-foreground mt-1 block">Призначено на вас інженером</span>
          </button>
        </div>

        {/* Toolbar: Search & Filters */}
        <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Live Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Пошук за назвою або номером звернення (наприклад, ST-101)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-secondary/40 border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              />
            </div>

            {/* Status Segmented Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-secondary/50 border border-border text-xs font-medium overflow-x-auto">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === "all"
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Всі ({metrics.total})
              </button>
              <button
                onClick={() => setStatusFilter("in_progress")}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === "in_progress"
                    ? "bg-card text-blue-400 font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                В роботі ({metrics.inProgress})
              </button>
              <button
                onClick={() => setStatusFilter("backlog")}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === "backlog"
                    ? "bg-card text-amber-400 font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                У черзі ({metrics.backlog})
              </button>
              <button
                onClick={() => setStatusFilter("awaiting_response")}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === "awaiting_response"
                    ? "bg-card text-purple-400 font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Очікує відповіді ({metrics.awaitingResponse})</span>
                {metrics.awaitingResponse > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                )}
              </button>
              <button
                onClick={() => setStatusFilter("resolved")}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === "resolved"
                    ? "bg-card text-emerald-400 font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Вирішені ({metrics.resolved})
              </button>
            </div>
          </div>

          {/* Secondary Filter Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Priority Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Пріоритет:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-secondary/50 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="all">Всі пріоритети</option>
                  <option value="CRITICAL">🔴 Критична</option>
                  <option value="HIGH">🟠 Висока</option>
                  <option value="MEDIUM">🔵 Звичайна</option>
                  <option value="LOW">🟢 Низька</option>
                </select>
              </div>

              {/* Scope Switcher: My vs All Organization/Project */}
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-muted-foreground">Відображати:</span>
                <select
                  value={scopeFilter}
                  onChange={(e) => setScopeFilter(e.target.value as "all" | "my")}
                  className="text-xs px-2.5 py-1 rounded-lg bg-secondary/50 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                >
                  <option value="all">Всі звернення організації / проєкту</option>
                  <option value="my">Мої звернення</option>
                </select>
              </div>
            </div>

            <div className="text-muted-foreground text-[11px]">
              Знайдено: <strong className="text-foreground">{displayedTickets.length}</strong> звернень
            </div>
          </div>
        </div>

        {/* Tickets List View */}
        <div className="space-y-3">
          {loading ? (
            <div className="p-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs">Завантаження списку звернень...</span>
            </div>
          ) : displayedTickets.length === 0 ? (
            <div className="p-16 text-center rounded-2xl border border-border bg-card flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-secondary/60 text-muted-foreground flex items-center justify-center">
                {statusFilter === "resolved" ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : statusFilter === "in_progress" ? (
                  <Clock className="w-6 h-6 text-blue-400" />
                ) : statusFilter === "backlog" ? (
                  <Inbox className="w-6 h-6 text-amber-400" />
                ) : statusFilter === "awaiting_response" ? (
                  <UserCheck className="w-6 h-6 text-purple-400" />
                ) : (
                  <LifeBuoy className="w-6 h-6" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">
                  {statusFilter === "resolved"
                    ? "Немає вирішених звернень"
                    : statusFilter === "in_progress"
                    ? "Немає звернень у роботі"
                    : statusFilter === "backlog"
                    ? "Немає звернень у черзі"
                    : statusFilter === "awaiting_response"
                    ? "Немає звернень, що очікують відповіді"
                    : searchQuery
                    ? "Звернень за запитом не знайдено"
                    : "Звернень не знайдено"}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {statusFilter === "resolved"
                    ? "Тут відображатимуться закриті тікети після завершення робіт нашими інженерами."
                    : statusFilter === "in_progress"
                    ? "Наразі жодне звернення не перебуває в активній розробці. Тікети очікують у черзі або вже вирішені."
                    : statusFilter === "backlog"
                    ? "Усі ваші звернення вже взяті інженерами в активну роботу або вирішені."
                    : statusFilter === "awaiting_response"
                    ? "Чудово! Наразі всі ваші звернення знаходяться в обробці інженерів і не потребують вашої відповіді."
                    : searchQuery
                    ? `За запитом «${searchQuery}» результатів не виявлено. Спробуйте змінити критерії пошуку.`
                    : scopeFilter === "my"
                    ? "У вас ще немає створених звернень. Перемкніть фільтр на «Всі звернення організації / проєкту» або створіть нове звернення."
                    : "У цьому проєкті ще немає зареєстрованих звернень. Створіть перше звернення, і наша служба підтримки допоможе вам!"}
                </p>
              </div>
              {statusFilter === "all" && !searchQuery && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Створити перше звернення</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {displayedTickets.map((ticket) => {
                const isWaitingForClient = isAwaitingClientResponse(ticket, currentUser?.id);

                return (
                  <div
                    key={ticket.id}
                    onClick={() => {
                      setSelectedTicketId(ticket.id);
                      setSelectedTicketProjectId(ticket.projectId);
                    }}
                    className={`p-4 rounded-2xl bg-card hover:bg-secondary/30 border transition-all cursor-pointer group hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isWaitingForClient
                        ? "border-amber-500/50 bg-amber-500/[0.03]"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    {/* Left: Code, Title, Project */}
                    <div className="space-y-1.5 flex-1 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-lg bg-secondary/80 font-mono text-[11px] font-bold text-primary border border-border group-hover:border-primary/40 transition-colors">
                          {ticket.code}
                        </span>

                        {ticket.project && (
                          <span className="text-[11px] text-muted-foreground font-medium">
                            {ticket.project.name}
                          </span>
                        )}

                        {ticket.creator && (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                              ticket.creatorId === currentUser?.id
                                ? "bg-primary/10 text-primary border-primary/25"
                                : "bg-secondary text-muted-foreground border-border/80"
                            }`}
                            title={`Створив(-ла): ${ticket.creator.name} (${ticket.creator.email})`}
                          >
                            <User className="w-3 h-3" />
                            <span>
                              {ticket.creatorId === currentUser?.id
                                ? "Ви (Автор)"
                                : ticket.creator.name}
                            </span>
                          </span>
                        )}

                        {getPriorityBadge(ticket.priority)}

                        {/* Distinctive pill if awaiting client reply */}
                        {isWaitingForClient && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30 shadow-xs animate-pulse">
                            <AlertCircle className="w-3 h-3" />
                            <span>Очікує вашої відповіді</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                        {ticket.title}
                      </h3>

                      {ticket.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                          {ticket.description}
                        </p>
                      )}
                    </div>

                    {/* Right: Status badge, Assignee, Stats & Date */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                      {/* Status Pill */}
                      {ticket.column && (
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold text-white shadow-xs"
                          style={{ backgroundColor: ticket.column.color || "#3b82f6" }}
                        >
                          {ticket.column.name}
                        </span>
                      )}

                      {/* Assigned Engineer / Person */}
                      <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] ${
                            isWaitingForClient
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                              : "bg-primary/20 text-primary"
                          }`}
                        >
                          {ticket.assignee ? ticket.assignee.name.slice(0, 2).toUpperCase() : "?"}
                        </div>
                        <span className="truncate max-w-[130px]">
                          {isWaitingForClient
                            ? "Ви (Відповідальний)"
                            : ticket.assignee
                            ? ticket.assignee.name
                            : "Не призначено"}
                        </span>
                      </div>

                      {/* Counters: Comments & Attachments */}
                      <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                        {(ticket._count?.comments || 0) > 0 && (
                          <span className="flex items-center gap-1" title="Кількість коментарів">
                            <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                            <span>{ticket._count?.comments}</span>
                          </span>
                        )}

                        {(ticket._count?.attachments || 0) > 0 && (
                          <span className="flex items-center gap-1" title="Кількість файлів">
                            <Paperclip className="w-3.5 h-3.5 text-primary" />
                            <span>{ticket._count?.attachments}</span>
                          </span>
                        )}
                      </div>

                      {/* Timeago */}
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap min-w-[70px] text-right">
                        {formatTimeAgo(ticket.updatedAt || ticket.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <ClientCreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projects={projects}
        defaultProjectId={selectedProjectId || undefined}
        onTicketCreated={(created) => {
          loadTickets(false);
          setSelectedTicketId(created.id);
          setSelectedTicketProjectId(created.projectId);
        }}
      />

      <ClientTicketDetailModal
        taskId={selectedTicketId}
        projectId={selectedTicketProjectId}
        isOpen={Boolean(selectedTicketId)}
        onClose={() => setSelectedTicketId(null)}
        onTicketUpdated={() => loadTickets(false)}
        currentUser={currentUser}
      />
    </div>
  );
}
