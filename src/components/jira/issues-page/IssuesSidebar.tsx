"use client";

import React from "react";
import { Layers, User, CheckCircle2, Check } from "lucide-react";

export type FilterType = "all" | "my" | "open";

interface IssuesSidebarProps {
  filterMode: FilterType;
  onFilterChange: (mode: FilterType) => void;
  tasksCount: number;
  projects: any[];
  selectedProjectId: string;
  onSelectProject: (pId: string) => void;
  availableComponents: string[];
  selectedComponent: string;
  onSelectComponent: (comp: string) => void;
  availableLabels: string[];
  selectedLabel: string;
  onSelectLabel: (label: string) => void;
  onResetAttributes: () => void;
}

export const IssuesSidebar: React.FC<IssuesSidebarProps> = ({
  filterMode,
  onFilterChange,
  tasksCount,
  projects,
  selectedProjectId,
  onSelectProject,
  availableComponents,
  selectedComponent,
  onSelectComponent,
  availableLabels,
  selectedLabel,
  onSelectLabel,
  onResetAttributes,
}) => {
  return (
    <div className="w-56 md:w-64 border-r border-border bg-card/60 flex flex-col flex-shrink-0 select-none">
      <div className="p-3 border-b border-border/80">
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2 px-2">
          Фільтри задач
        </span>
        <div className="space-y-1">
          <button
            onClick={() => onFilterChange("all")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
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
                {tasksCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onFilterChange("my")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
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
                {tasksCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onFilterChange("open")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
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
                {tasksCount}
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
          onClick={() => onSelectProject("")}
          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
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
            onClick={() => onSelectProject(p.id)}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
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

      {/* Attributes Filters: Components & Labels */}
      {(availableComponents.length > 0 || availableLabels.length > 0) && (
        <div className="p-3 border-t border-border/80 space-y-3 bg-secondary/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
              Фільтрація полів
            </span>
            {(selectedComponent || selectedLabel) && (
              <button
                type="button"
                onClick={onResetAttributes}
                className="text-[10px] text-muted-foreground hover:text-destructive px-1 rounded transition-colors cursor-pointer"
                title="Скинути фільтри"
              >
                Скинути
              </button>
            )}
          </div>

          {/* Component Filter */}
          {availableComponents.length > 0 && (
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground px-1 block">
                Компонент:
              </label>
              <select
                value={selectedComponent}
                onChange={(e) => onSelectComponent(e.target.value)}
                className="w-full text-xs py-1.5 px-2 rounded-lg bg-secondary/60 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary truncate cursor-pointer"
              >
                <option value="">Всі компоненти</option>
                {availableComponents.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Label Filter */}
          {availableLabels.length > 0 && (
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-muted-foreground px-1 block">
                Мітка:
              </label>
              <select
                value={selectedLabel}
                onChange={(e) => onSelectLabel(e.target.value)}
                className="w-full text-xs py-1.5 px-2 rounded-lg bg-secondary/60 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary truncate cursor-pointer"
              >
                <option value="">Всі мітки</option>
                {availableLabels.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
