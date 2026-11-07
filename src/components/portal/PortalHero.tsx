"use client";

import React from "react";
import { LifeBuoy, Plus, RefreshCw } from "lucide-react";

interface PortalHeroProps {
  userName?: string;
  onCreateTicketClick: () => void;
  onRefreshClick: () => void;
  refreshing: boolean;
}

export const PortalHero: React.FC<PortalHeroProps> = ({
  userName,
  onCreateTicketClick,
  onRefreshClick,
  refreshing,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card/90 to-primary/10 border border-border p-6 sm:p-8 shadow-sm">
      <div className="max-w-2xl space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <LifeBuoy className="w-3.5 h-3.5" />
          <span>Центр обслуговування клієнтів</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          Вітаємо, {userName || "Користувач"}!
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Подавайте звернення до служби підтримки, прикріплюйте скріншоти та контролюйте хід виконання онлайн.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          onClick={onCreateTicketClick}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Створити нове звернення</span>
        </button>

        <button
          onClick={onRefreshClick}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-secondary/60 hover:bg-secondary border border-border text-xs font-semibold text-foreground transition-colors cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
          <span>Оновити дані</span>
        </button>
      </div>
    </div>
  );
};
