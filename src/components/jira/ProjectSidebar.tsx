"use client";

import React from "react";
import {
  LayoutGrid,
  ListTodo,
  CheckSquare,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

export type JiraNavSection =
  | "issues" // 3-panel Jira Issues registry (default active)
  | "board" // Kanban board
  | "backlog" // Backlog list
  | "releases" // Releases
  | "reports" // Reports (admin only)
  | "components"; // Components

interface ProjectSidebarProps {
  project: {
    id: string;
    name: string;
    key: string;
    description?: string | null;
  };
  activeSection: JiraNavSection;
  onSelectSection: (section: JiraNavSection) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenSettings?: () => void;
  isAdmin?: boolean;
}

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  project,
  activeSection,
  onSelectSection,
  isCollapsed,
  onToggleCollapse,
  onOpenSettings,
  isAdmin = false,
}) => {
  const { dict } = useI18n();

  const menuItems: Array<{
    id: JiraNavSection;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [
    {
      id: "issues",
      label: dict.nav.issues,
      icon: <CheckSquare className="w-4 h-4" />,
      badge: dict.nav.threePanels,
    },
    {
      id: "board",
      label: dict.nav.board,
      icon: <LayoutGrid className="w-4 h-4" />,
    },
    {
      id: "backlog",
      label: dict.nav.backlog,
      icon: <ListTodo className="w-4 h-4" />,
    },
    ...(isAdmin
      ? [
          {
            id: "reports" as JiraNavSection,
            label: dict.nav.reports,
            icon: <BarChart3 className="w-4 h-4 text-cyan-400" />,
          },
        ]
      : []),
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-border bg-card/70 backdrop-blur-sm select-none transition-all duration-200 z-20 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Project Header */}
      <div className="p-3 border-b border-border/80 flex items-center justify-between gap-2 min-h-[58px]">
        <div className="flex items-center gap-2.5 overflow-hidden">
          {/* Project Avatar */}
          <div
            className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-sm border border-white/10 ${
              project.id === "all"
                ? "bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 shadow-indigo-500/20"
                : "bg-gradient-to-br from-blue-600 to-indigo-600"
            }`}
            title={`[${project.key}] ${project.name}`}
          >
            {project.id === "all" ? <Layers className="w-4 h-4" /> : project.key.slice(0, 3)}
          </div>

          {!isCollapsed && (
            <div className="overflow-hidden">
              <h2 className="text-xs font-semibold text-foreground truncate leading-tight">
                {project.name}
              </h2>
              <span className="text-[10px] text-muted-foreground font-mono block">
                {project.id === "all"
                  ? dict.nav.globalContext
                  : `[${project.key}] ${dict.nav.softwareProject}`}
              </span>
            </div>
          )}
        </div>

        {/* Collapse button */}
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title={isCollapsed ? dict.nav.expandSidebar : dict.nav.collapseSidebar}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {dict.nav.planningAndWork}
          </div>
        )}

        {menuItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-primary/15 text-primary border border-primary/25 font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              } ${isCollapsed ? "justify-center" : "justify-between"}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <span className={`flex-shrink-0 ${isActive ? "text-primary" : ""}`}>
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </div>

              {!isCollapsed && item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-medium ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground border border-border/80"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer / Project Settings */}
      {isAdmin && onOpenSettings && project.id !== "all" && (
        <div className="p-2 border-t border-border/80">
          <button
            onClick={onOpenSettings}
            title={isCollapsed ? dict.nav.projectSettings : undefined}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>{dict.nav.projectSettings}</span>}
          </button>
        </div>
      )}
    </aside>
  );
};
