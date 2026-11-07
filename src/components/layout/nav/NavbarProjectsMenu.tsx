"use client";

import React from "react";
import Link from "next/link";
import { ChevronDown, Plus, Settings } from "lucide-react";

interface NavbarProjectsMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  currentProject?: { id: string; name: string; key: string } | null;
  projects?: Array<{ id: string; name: string; key: string }>;
  isAdmin: boolean;
  onOpenCreateProject: () => void;
  onOpenSettings: () => void;
}

export const NavbarProjectsMenu: React.FC<NavbarProjectsMenuProps> = ({
  isOpen,
  onToggle,
  onClose,
  currentProject,
  projects = [],
  isAdmin,
  onOpenCreateProject,
  onOpenSettings,
}) => {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
          isOpen
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
        }`}
      >
        <span>Проєкти</span>
        <ChevronDown className="w-3 h-3 ml-0.5" />
      </button>

      {isOpen && (
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
                onClick={onClose}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-secondary transition-colors ${
                  currentProject?.id === p.id
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground"
                }`}
              >
                <span className="truncate">
                  <strong className="font-mono text-primary mr-1">[{p.key}]</strong> {p.name}
                </span>
              </Link>
            ))}
          </div>

          {isAdmin && (
            <div className="pt-1 border-t border-border/60 space-y-0.5">
              <button
                onClick={() => {
                  onClose();
                  onOpenCreateProject();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Створити новий проєкт...</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Налаштування проєктів...</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
