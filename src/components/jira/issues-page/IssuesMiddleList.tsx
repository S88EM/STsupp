"use client";

import React from "react";
import { Search, Inbox } from "lucide-react";
import { getTaskTypeInfo, getPriorityIcon } from "@/lib/constants/task";
import { FilterType } from "./IssuesSidebar";

interface IssuesMiddleListProps {
  filterMode: FilterType;
  onFilterChange: (mode: FilterType) => void;
  filteredTasks: any[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedComponent: string;
  onClearComponent: () => void;
  selectedLabel: string;
  onClearLabel: () => void;
  loading: boolean;
  activeTaskId: string | null;
  onSelectTask: (taskId: string) => void;
}

export const IssuesMiddleList: React.FC<IssuesMiddleListProps> = ({
  filterMode,
  onFilterChange,
  filteredTasks,
  searchQuery,
  onSearchChange,
  selectedComponent,
  onClearComponent,
  selectedLabel,
  onClearLabel,
  loading,
  activeTaskId,
  onSelectTask,
}) => {
  return (
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
              onClick={() => onFilterChange("all")}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                filterMode === "all"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Всі
            </button>
            <button
              onClick={() => onFilterChange("my")}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                filterMode === "my"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Мої
            </button>
            <button
              onClick={() => onFilterChange("open")}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
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
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Active Component / Label filter tags */}
        {(selectedComponent || selectedLabel) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {selectedComponent && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-secondary text-foreground border border-border">
                <span>компонент: {selectedComponent}</span>
                <button
                  type="button"
                  onClick={onClearComponent}
                  className="hover:text-destructive font-bold ml-0.5 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}
            {selectedLabel && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                <span>мітка: {selectedLabel}</span>
                <button
                  type="button"
                  onClick={onClearLabel}
                  className="hover:text-destructive font-bold ml-0.5 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
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
            const isSelected = activeTaskId === t.id;

            return (
              <div
                key={t.id}
                onClick={() => onSelectTask(t.id)}
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
  );
};
