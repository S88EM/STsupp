"use client";

import React from "react";
import { Search } from "lucide-react";
import { PortalKpiMetrics, PortalStatusFilter } from "./types";

interface PortalFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: PortalStatusFilter;
  onStatusFilterChange: (status: PortalStatusFilter) => void;
  priorityFilter: string;
  onPriorityFilterChange: (priority: string) => void;
  scopeFilter: "all" | "my";
  onScopeFilterChange: (scope: "all" | "my") => void;
  metrics: PortalKpiMetrics;
  totalFound: number;
}

export const PortalFilters: React.FC<PortalFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  scopeFilter,
  onScopeFilterChange,
  metrics,
  totalFound,
}) => {
  return (
    <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Live Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Пошук за назвою або номером звернення (наприклад, ST-101)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-secondary/40 border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
          />
        </div>

        {/* Status Segmented Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-secondary/50 border border-border text-xs font-medium overflow-x-auto">
          <button
            onClick={() => onStatusFilterChange("all")}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === "all"
                ? "bg-card text-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Всі ({metrics.total})
          </button>
          <button
            onClick={() => onStatusFilterChange("in_progress")}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === "in_progress"
                ? "bg-card text-blue-400 font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            В роботі ({metrics.inProgress})
          </button>
          <button
            onClick={() => onStatusFilterChange("backlog")}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === "backlog"
                ? "bg-card text-amber-400 font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            У черзі ({metrics.backlog})
          </button>
          <button
            onClick={() => onStatusFilterChange("awaiting_response")}
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
            onClick={() => onStatusFilterChange("resolved")}
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
              onChange={(e) => onPriorityFilterChange(e.target.value)}
              className="text-xs px-2.5 py-1 rounded-lg bg-secondary/50 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
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
              onChange={(e) => onScopeFilterChange(e.target.value as "all" | "my")}
              className="text-xs px-2.5 py-1 rounded-lg bg-secondary/50 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium cursor-pointer"
            >
              <option value="all">Всі звернення організації / проєкту</option>
              <option value="my">Мої звернення</option>
            </select>
          </div>
        </div>

        <div className="text-muted-foreground text-[11px]">
          Знайдено: <strong className="text-foreground">{totalFound}</strong> звернень
        </div>
      </div>
    </div>
  );
};
