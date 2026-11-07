"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  Plus,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { ThemeSwitcherButton } from "@/components/theme/ThemeSwitcher";
import { ProjectItem, PortalCurrentUser, getUserInitials } from "./types";

interface PortalHeaderProps {
  currentUser: PortalCurrentUser | null;
  projects: ProjectItem[];
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
  onCreateTicketClick: () => void;
  onLogout: () => void;
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({
  currentUser,
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateTicketClick,
  onLogout,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const isStaffUser = currentUser?.role === "ADMIN" || currentUser?.role === "ENGINEER";

  return (
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
              onChange={(e) => onSelectProject(e.target.value)}
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
          onClick={onCreateTicketClick}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
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
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center font-bold text-[11px]">
                {getUserInitials(currentUser.name, currentUser.email)}
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
                    onClick={() => {
                      setIsProfileOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
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
  );
};
