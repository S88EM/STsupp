"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  Search,
  Bell,
  HelpCircle,
  LifeBuoy,
} from "lucide-react";
import { CreateProjectModal } from "@/components/project/CreateProjectModal";
import { ProjectSettingsModal } from "@/components/project/ProjectSettingsModal";
import { ThemeSwitcherButton } from "@/components/theme/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/context";
import {
  NavbarServicesMenu,
  NavbarProjectsMenu,
  NavbarTasksMenu,
  NavbarUserMenu,
} from "./nav";

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
}) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { dict } = useI18n();

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

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const isAdmin = user?.role === "ADMIN";

  return (
    <header
      ref={headerRef}
      className="h-13 border-b border-border bg-card/85 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between sticky top-0 z-40 select-none"
    >
      {/* 1. Left Group: Logo, Switcher & Jira Menus */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Service Switcher Menu */}
        <NavbarServicesMenu
          isOpen={openDropdown === "switcher"}
          onToggle={() => toggleDropdown("switcher")}
          onClose={() => setOpenDropdown(null)}
          currentProjectId={currentProject?.id}
          isAdmin={isAdmin}
        />

        {/* Logo / Brand */}
        <Link
          href={
            user?.role === "CLIENT"
              ? "/portal"
              : currentProject
              ? `/projects/${currentProject.id}`
              : "/"
          }
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
              <span>{dict.nav.portal}</span>
            </Link>
          ) : (
            <Link
              href="/projects/all"
              onClick={() => {
                try {
                  sessionStorage.setItem("stsup_active_project_id", "all");
                } catch (e) {}
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                currentProject?.id === "all"
                  ? "bg-secondary text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <span>{dict.nav.allProjects}</span>
            </Link>
          )}
        </div>

        {/* Menu: Проєкти (Dropdown) */}
        <NavbarProjectsMenu
          isOpen={openDropdown === "projects"}
          onToggle={() => toggleDropdown("projects")}
          onClose={() => setOpenDropdown(null)}
          currentProject={currentProject}
          projects={projects}
          isAdmin={isAdmin}
          onOpenCreateProject={() => setIsCreateProjectOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Menu: Задачі (Dropdown) */}
        <NavbarTasksMenu
          isOpen={openDropdown === "tasks"}
          onToggle={() => toggleDropdown("tasks")}
          onClose={() => setOpenDropdown(null)}
        />

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
            <span>{dict.nav.board}</span>
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
            placeholder={dict.common.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-44 xl:w-56 text-xs pl-8 pr-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border/80 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Theme / Background Switcher */}
        <LanguageSwitcher variant="toggle" />
        <ThemeSwitcherButton />

        {/* Notifications */}
        <button
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors relative cursor-pointer"
          title="Центр сповіщень"
        >
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 absolute top-1.5 right-1.5" />
        </button>

        {/* Help */}
        <button
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors hidden sm:inline-flex cursor-pointer"
          title="Довідка та гарячі клавіші"
          onClick={() =>
            alert("STsup Jira Edition v1.0\nГарячі клавіші:\n• 'Esc' — Закрити активне вікно")
          }
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* User Profile */}
        {user && (
          <NavbarUserMenu
            user={user}
            isOpen={openDropdown === "profile"}
            onToggle={() => toggleDropdown("profile")}
            onLogout={handleLogout}
          />
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
