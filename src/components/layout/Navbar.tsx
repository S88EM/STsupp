"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Plus,
  LayoutGrid,
  List,
  Layers,
  LogOut,
  Users,
  Shield,
  Settings,
  Search,
  Bell,
  HelpCircle,
  ChevronDown,
  CheckSquare,
  Sparkles,
  FolderGit2,
  Palette,
  LifeBuoy,
} from "lucide-react";
import { CreateProjectModal } from "@/components/project/CreateProjectModal";
import { ProjectSettingsModal } from "@/components/project/ProjectSettingsModal";
import { ThemeSwitcherButton, THEMES, applyTheme } from "@/components/theme/ThemeSwitcher";

interface NavbarProps {
  currentProject?: {
    id: string;
    name: string;
    key: string;
  } | null;
  projects?: Array<{ id: string; name: string; key: string }>;
  viewMode?: "board" | "list";
  onViewModeChange?: (mode: "board" | "list") => void;
  onOpenNewTask?: () => void;
  activeSection?: string;
  onSelectSection?: (section: any) => void;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isPrimaryAdmin?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProject,
  projects = [],
  viewMode = "board",
  onViewModeChange,
  onOpenNewTask,
  activeSection,
  onSelectSection,
}) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      window.location.replace("/login");
    }
  };

  const getInitials = (name: string, email: string) => {
    if (name?.trim()) {
      const parts = name.trim().split(" ");
      if (parts.length > 1) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    return email ? email.slice(0, 2).toUpperCase() : "U";
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Адміністратор";
      case "ENGINEER":
        return "Інженер";
      case "CLIENT":
        return "Клієнт";
      default:
        return "Користувач";
    }
  };

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  return (
    <header ref={headerRef} className="h-13 border-b border-border bg-card/85 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* 1. Left Group: Logo, Switcher & Jira Menus */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Service Switcher (9-dots Atlassian grid icon) */}
        <button
          onClick={() => toggleDropdown("switcher")}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Перемикач сервісів"
        >
          <div className="grid grid-cols-3 gap-0.5 w-4 h-4 p-0.5">
            {[...Array(9)].map((_, i) => (
              <span key={i} className="w-1 h-1 rounded-full bg-current" />
            ))}
          </div>
        </button>

        {openDropdown === "switcher" && (
          <div className="absolute left-3 top-12 w-64 rounded-xl bg-card border border-border shadow-2xl p-3 z-50 animate-in fade-in-50 zoom-in-95">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
              Сервіси STsup
            </span>
            <div className="space-y-1">
              <Link
                href={currentProject ? `/projects/${currentProject.id}` : "/"}
                onClick={() => setOpenDropdown(null)}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-secondary text-xs font-medium text-foreground transition-colors"
              >
                <div className="w-6 h-6 rounded bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                  ST
                </div>
                <div>
                  <div className="font-semibold">STsup Tracker</div>
                  <span className="text-[10px] text-muted-foreground">Трекер задач та проєктів</span>
                </div>
              </Link>

              <Link
                href="/portal"
                onClick={() => setOpenDropdown(null)}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-secondary text-xs font-medium text-foreground transition-colors"
              >
                <div className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  <LifeBuoy className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold">Портал підтримки</div>
                  <span className="text-[10px] text-muted-foreground">Клієнтський сервіс та тікети</span>
                </div>
              </Link>
              {user?.role === "ADMIN" && (
                <>
                  <Link
                    href="/users"
                    onClick={() => setOpenDropdown(null)}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-secondary text-xs font-medium text-foreground transition-colors"
                  >
                    <div className="w-6 h-6 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold">Користувачі та права</div>
                      <span className="text-[10px] text-muted-foreground">Матриця доступів</span>
                    </div>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setOpenDropdown(null)}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-secondary text-xs font-medium text-foreground transition-colors"
                  >
                    <div className="w-6 h-6 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Settings className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold">Налаштування</div>
                    </div>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {/* Logo / Brand */}
        <Link
          href={user?.role === "CLIENT" ? "/portal" : (currentProject ? `/projects/${currentProject.id}` : "/")}
          className="flex items-center gap-2 mr-2 group"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
            ST
          </div>
          <span className="font-bold text-sm tracking-tight text-foreground hidden sm:inline">
            STsup
          </span>
        </Link>

        {/* Menu: Робочий стіл / Портал */}
        <div className="relative hidden md:block">
          {user?.role === "CLIENT" ? (
            <Link
              href="/portal"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-primary hover:bg-secondary/60 transition-colors"
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Портал підтримки</span>
            </Link>
          ) : (
            <Link
              href={currentProject ? `/projects/${currentProject.id}` : "/"}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            >
              <span>Робочий стіл</span>
            </Link>
          )}
        </div>

        {/* Menu: Проєкти (Dropdown) */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown("projects")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              openDropdown === "projects"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            <span>Проєкти</span>
            <ChevronDown className="w-3 h-3 ml-0.5" />
          </button>

          {openDropdown === "projects" && (
            <div className="absolute left-0 top-11 w-72 rounded-xl bg-card border border-border shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95">
              {currentProject && (
                <div className="px-2 py-1.5 border-b border-border/60 mb-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                    Поточний проєкт
                  </span>
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <span className="font-mono text-primary font-bold">[{currentProject.key}]</span>
                    <span className="truncate">{currentProject.name}</span>
                  </div>
                </div>
              )}

              <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Всі проєкти ({projects.length})
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5 my-1">
                {projects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    onClick={() => setOpenDropdown(null)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-secondary transition-colors ${
                      currentProject?.id === p.id ? "bg-primary/10 text-primary font-semibold" : "text-foreground"
                    }`}
                  >
                    <span className="truncate">
                      <strong className="font-mono text-primary mr-1">[{p.key}]</strong> {p.name}
                    </span>
                  </Link>
                ))}
              </div>

              {user?.role === "ADMIN" && (
                <div className="pt-1 border-t border-border/60 space-y-0.5">
                  <button
                    onClick={() => {
                      setOpenDropdown(null);
                      setIsCreateProjectOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Створити новий проєкт...</span>
                  </button>
                  <button
                    onClick={() => {
                      setOpenDropdown(null);
                      setIsSettingsOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Налаштування проєктів...</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Menu: Задачі */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => toggleDropdown("tasks")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              openDropdown === "tasks"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            <span>Задачі</span>
            <ChevronDown className="w-3 h-3 ml-0.5" />
          </button>

          {openDropdown === "tasks" && (
            <div className="absolute left-0 top-11 w-56 rounded-xl bg-card border border-border shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1 block">
                Фільтри задач
              </span>
              <div className="space-y-0.5">
                <Link
                  href="/issues?filter=all"
                  onClick={() => setOpenDropdown(null)}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-foreground hover:bg-secondary transition-colors"
                >
                  <span>Всі задачі</span>
                </Link>
                <Link
                  href="/issues?filter=my"
                  onClick={() => setOpenDropdown(null)}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-foreground hover:bg-secondary transition-colors"
                >
                  <span>Призначені мені</span>
                </Link>
                <Link
                  href="/issues?filter=open"
                  onClick={() => setOpenDropdown(null)}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-foreground hover:bg-secondary transition-colors"
                >
                  <span>Відкриті задачі</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Menu: Дошки */}
        <div className="relative hidden md:block">
          <Link
            href="/boards"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === "board" && !currentProject
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Дошки</span>
          </Link>
        </div>
      </div>

      {/* 2. Right Group: Search, Notifications, Help & Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Search input (Quick search) */}
        <div className="relative hidden lg:block">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Швидкий пошук..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-44 xl:w-56 text-xs pl-8 pr-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border/80 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Theme / Background Switcher */}
        <ThemeSwitcherButton />

        {/* Notifications */}
        <button
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors relative"
          title="Центр сповіщень"
        >
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 absolute top-1.5 right-1.5" />
        </button>

        {/* Help */}
        <button
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors hidden sm:inline-flex"
          title="Довідка та гарячі клавіші"
          onClick={() => alert("STsup Jira Edition v1.0\nГарячі клавіші:\n• 'Esc' — Закрити активне вікно")}
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* User Profile */}
        {user && (
          <div className="relative pl-1 border-l border-border/80">
            <button
              onClick={() => toggleDropdown("profile")}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-secondary transition-colors"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] border shadow-xs ${
                  user.role === "ADMIN"
                    ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                    : user.role === "ENGINEER"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                    : "bg-cyan-500/20 text-cyan-400 border-cyan-500/40"
                }`}
              >
                {getInitials(user.name, user.email)}
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-semibold text-foreground leading-none">
                  {user.name}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                  {getRoleLabel(user.role)}
                </span>
              </div>
            </button>

            {openDropdown === "profile" && (
              <div className="absolute right-0 top-11 w-56 rounded-xl bg-card border border-border shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95">
                <div className="px-3 py-2 border-b border-border/60">
                  <span className="text-xs font-bold text-foreground block truncate">{user.name}</span>
                  <span className="text-[10px] text-muted-foreground block truncate">{user.email}</span>
                  <span className="text-[10px] font-semibold text-primary mt-1 inline-block">
                    {getRoleLabel(user.role)}
                  </span>
                </div>

                {/* Quick Theme Picker */}
                <div className="px-3 py-2 border-b border-border/60 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                    <span className="flex items-center gap-1.5">
                      <Palette className="w-3 h-3 text-primary" />
                      <span>Тема оформлення</span>
                    </span>
                  </div>

                  {/* Dark themes row */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Темні ({THEMES.filter((t) => t.mode === "dark").length})
                    </span>
                    <div className="grid grid-cols-7 gap-1">
                      {THEMES.filter((t) => t.mode === "dark").map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => applyTheme(t.id, true)}
                          className={`w-6 h-6 rounded-md border transition-transform hover:scale-110 cursor-pointer shadow-xs ${t.borderAccent}`}
                          style={{ background: t.gradient }}
                          title={t.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Light themes row */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Світлі ({THEMES.filter((t) => t.mode === "light").length})
                    </span>
                    <div className="grid grid-cols-5 gap-1">
                      {THEMES.filter((t) => t.mode === "light").map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => applyTheme(t.id, true)}
                          className={`w-6 h-6 rounded-md border transition-transform hover:scale-110 cursor-pointer shadow-xs ${t.borderAccent}`}
                          style={{ background: t.gradient }}
                          title={t.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 rounded-lg transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Вийти з системи</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
      />

      <ProjectSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        project={currentProject || null}
        allProjects={projects}
        onProjectUpdated={() => {
          window.location.reload();
        }}
      />
    </header>
  );
};
