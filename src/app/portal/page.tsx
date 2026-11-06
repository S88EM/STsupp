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
  AlertCircle,
  RefreshCw,
  FolderGit2,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Layers,
  Sparkles,
} from "lucide-react";
import { ClientCreateTicketModal } from "@/components/portal/ClientCreateTicketModal";
import { ClientTicketDetailModal } from "@/components/portal/ClientTicketDetailModal";
import { ThemeSwitcherButton } from "@/components/theme/ThemeSwitcher";
import { formatTimeAgo } from "@/lib/utils";

interface ProjectItem {
  id: string;
  name: string;
  key: string;
  columns?: Array<{ id: string; name: string; color?: string; isDoneColumn?: boolean }>;
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
  assignee?: { id: string; name: string; email: string; avatarUrl?: string | null } | null;
  creator?: { id: string; name: string; email: string } | null;
  column?: { id: string; name: string; color?: string; isDoneColumn?: boolean } | null;
  project?: { id: string; name: string; key: string } | null;
  attachments?: any[];
  _count?: { comments: number; attachments: number; subtasks: number };
}

export default function ClientPortalPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "resolved">("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [scopeFilter, setScopeFilter] = useState<"my" | "all">("my");
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
          // If engineer or admin, default scope to 'all' so they see project tickets, else 'my'
          if (data.user.role === "ADMIN" || data.user.role === "ENGINEER") {
            setScopeFilter("all");
          }
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
          // Keep empty string as "Всі проєкти" or default to first if single
          if (data.length === 1) {
            setSelectedProjectId(data[0].id);
          }
        }
      }
    } catch (err) {
      console.error("Error loading projects:", err);
    }
  }, [selectedProjectId]);

  // Load tickets
  const loadTickets = useCallback(
    async (showLoadingSpinner = false) => {
      if (showLoadingSpinner) setLoading(true);
      else setRefreshing(true);

      try {
        const queryParams = new URLSearchParams();
        if (statusFilter !== "all") queryParams.set("filter", statusFilter);
        if (priorityFilter !== "all") queryParams.set("priority", priorityFilter);
        if (selectedProjectId) queryParams.set("projectId", selectedProjectId);
        if (searchQuery.trim()) queryParams.set("search", searchQuery.trim());
        if (scopeFilter === "my") queryParams.set("scope", "my");

        const res = await fetch(`/api/tasks?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setTickets(data.tasks || []);
        }
      } catch (err) {
        console.error("Error loading tickets:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [statusFilter, priorityFilter, selectedProjectId, searchQuery, scopeFilter]
  );

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    loadTickets(true);
  }, [loadTickets]);

  // Global hotkey 'c' for new ticket
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "c" || e.key === "C") &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        setIsCreateModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  // Metrics computation
  const metrics = useMemo(() => {
    const total = tickets.length;
    let inProgress = 0;
    let resolved = 0;
    let withComments = 0;

    for (const t of tickets) {
      const isDone =
        t.column?.isDoneColumn ||
        ["Готово", "Done", "Resolved", "Вирішено", "Закрито"].some(
          (name) => t.column?.name?.toLowerCase() === name.toLowerCase()
        );

      if (isDone) {
        resolved++;
      } else {
        inProgress++;
      }

      if ((t._count?.comments || 0) > 0) {
        withComments++;
      }
    }

    return { total, inProgress, resolved, withComments };
  }, [tickets]);

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
          <button
            onClick={() => setStatusFilter("all")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              statusFilter === "all"
                ? "bg-primary/10 border-primary/40 shadow-sm"
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

          <button
            onClick={() => setStatusFilter("open")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              statusFilter === "open"
                ? "bg-blue-500/15 border-blue-500/40 shadow-sm"
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

          <button
            onClick={() => setStatusFilter("resolved")}
            className={`p-4 rounded-2xl border text-left transition-all ${
              statusFilter === "resolved"
                ? "bg-emerald-500/15 border-emerald-500/40 shadow-sm"
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

          <div className="p-4 rounded-2xl border bg-card/70 border-border text-left">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">З діалогом</span>
              <MessageSquare className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-purple-400">{metrics.withComments}</div>
            <span className="text-[11px] text-muted-foreground mt-1 block">Тікети з коментарями</span>
          </div>
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
            <div className="flex items-center p-1 rounded-xl bg-secondary/50 border border-border text-xs font-medium">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === "all"
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Всі
              </button>
              <button
                onClick={() => setStatusFilter("open")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === "open"
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                В роботі
              </button>
              <button
                onClick={() => setStatusFilter("resolved")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === "resolved"
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Вирішені
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

              {/* Scope Switcher: My vs All */}
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-muted-foreground">Відображати:</span>
                <select
                  value={scopeFilter}
                  onChange={(e) => setScopeFilter(e.target.value as "my" | "all")}
                  className="text-xs px-2.5 py-1 rounded-lg bg-secondary/50 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="my">Тільки мої звернення</option>
                  <option value="all">Всі звернення проєкту</option>
                </select>
              </div>
            </div>

            <div className="text-muted-foreground text-[11px]">
              Знайдено: <strong className="text-foreground">{tickets.length}</strong> звернень
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
          ) : tickets.length === 0 ? (
            <div className="p-16 text-center rounded-2xl border border-border bg-card flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-secondary/60 text-muted-foreground flex items-center justify-center">
                <LifeBuoy className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Звернень не знайдено</h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {searchQuery || priorityFilter !== "all" || statusFilter !== "all"
                    ? "Немає звернень за обраними критеріями фільтрації. Спробуйте скинути фільтри."
                    : "У вас ще немає створених звернень. Створіть перше звернення, і наша служба підтримки обов'язково допоможе вам!"}
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Створити перше звернення</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => {
                    setSelectedTicketId(ticket.id);
                    setSelectedTicketProjectId(ticket.projectId);
                  }}
                  className="p-4 rounded-2xl bg-card hover:bg-secondary/30 border border-border transition-all cursor-pointer group hover:shadow-md hover:border-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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

                      {getPriorityBadge(ticket.priority)}
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

                    {/* Assigned Engineer */}
                    <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[9px]">
                        {ticket.assignee ? ticket.assignee.name.slice(0, 2).toUpperCase() : "?"}
                      </div>
                      <span className="truncate max-w-[120px]">
                        {ticket.assignee ? ticket.assignee.name : "Не призначено"}
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
              ))}
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
