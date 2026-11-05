"use client";

import React from "react";
import Link from "next/link";
import { Plus, LayoutGrid, List, Layers, Sparkles } from "lucide-react";

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
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProject,
  projects = [],
  viewMode = "board",
  onViewModeChange,
  onOpenNewTask,
}) => {
  return (
    <header className="h-14 border-b border-border bg-card/60 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Logo / App Name */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            ST
          </div>
          <span className="font-semibold text-foreground tracking-tight hidden sm:inline">
            STsup
          </span>
        </Link>

        {/* Project Selector */}
        {currentProject && (
          <div className="flex items-center gap-2 border-l border-border pl-4">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <select
              value={currentProject.id}
              onChange={(e) => {
                window.location.href = `/projects/${e.target.value}`;
              }}
              className="bg-secondary/60 hover:bg-secondary text-sm font-medium py-1 px-2.5 rounded-md border border-border/80 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-colors"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-card text-foreground">
                  [{p.key}] {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* View switcher */}
        {onViewModeChange && (
          <div className="flex items-center bg-secondary/50 rounded-lg p-0.5 border border-border/50 text-xs">
            <button
              onClick={() => onViewModeChange("board")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                viewMode === "board"
                  ? "bg-card text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Дошка</span>
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                viewMode === "list"
                  ? "bg-card text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Список</span>
            </button>
          </div>
        )}

        {/* New Task Button */}
        {onOpenNewTask && (
          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm shadow-primary/20 transition-all hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Нова задача</span>
            <kbd className="hidden md:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-white/20 rounded font-mono">
              C
            </kbd>
          </button>
        )}
      </div>
    </header>
  );
};
