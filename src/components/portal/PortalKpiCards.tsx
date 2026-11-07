"use client";

import React from "react";
import { Layers, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { PortalKpiMetrics, PortalStatusFilter } from "./types";

interface PortalKpiCardsProps {
  metrics: PortalKpiMetrics;
  statusFilter: PortalStatusFilter;
  onSelectFilter: (filter: PortalStatusFilter) => void;
}

export const PortalKpiCards: React.FC<PortalKpiCardsProps> = ({
  metrics,
  statusFilter,
  onSelectFilter,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Card 1: Всі звернення */}
      <button
        onClick={() => onSelectFilter("all")}
        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
          statusFilter === "all"
            ? "bg-primary/10 border-primary/50 shadow-sm ring-1 ring-primary/40"
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

      {/* Card 2: В роботі */}
      <button
        onClick={() => onSelectFilter("in_progress")}
        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
          statusFilter === "in_progress"
            ? "bg-blue-500/15 border-blue-500/50 shadow-sm ring-1 ring-blue-500/40"
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

      {/* Card 3: Вирішено */}
      <button
        onClick={() => onSelectFilter("resolved")}
        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
          statusFilter === "resolved"
            ? "bg-emerald-500/15 border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/40"
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

      {/* Card 4: Очікує відповіді */}
      <button
        onClick={() => onSelectFilter("awaiting_response")}
        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
          statusFilter === "awaiting_response"
            ? "bg-purple-500/15 border-purple-500/50 shadow-sm ring-1 ring-purple-500/40 text-purple-400"
            : "bg-card/70 border-border hover:bg-card"
        }`}
      >
        <div className="flex items-center justify-between text-muted-foreground mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Очікує відповіді</span>
          <AlertCircle
            className={`w-4 h-4 ${
              metrics.awaitingResponse > 0 ? "text-amber-400 animate-pulse" : "text-purple-400"
            }`}
          />
        </div>
        <div
          className={`text-2xl sm:text-3xl font-bold ${
            metrics.awaitingResponse > 0 ? "text-amber-400" : "text-purple-400"
          }`}
        >
          {metrics.awaitingResponse}
        </div>
        <span className="text-[11px] text-muted-foreground mt-1 block">Призначено на вас інженером</span>
      </button>
    </div>
  );
};
