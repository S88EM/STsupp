"use client";

import React from "react";
import { Zap, Package, BarChart3, Boxes, Layers, Plus, ExternalLink, Calendar, CheckCircle2 } from "lucide-react";
import { ColumnItem } from "@/components/board/ColumnCard";
import { TaskItem } from "@/components/board/TaskCard";

interface AgileViewProps {
  section: "sprints" | "releases" | "reports" | "components";
  projectId: string;
  projectKey: string;
  projectName: string;
  columns: ColumnItem[];
  tasks: TaskItem[];
  onOpenCreateTask: () => void;
}

export const AgileViews: React.FC<AgileViewProps> = ({
  section,
  projectKey,
  projectName,
  columns,
  tasks,
  onOpenCreateTask,
}) => {
  if (section === "sprints") {
    const totalPoints = tasks.reduce((sum, t: any) => sum + (t.aiContext?.storyPoints || 3), 0);
    const completedTasks = tasks.filter((t) => {
      const col = columns.find((c) => c.id === t.columnId);
      return col?.isDoneColumn;
    });

    return (
      <div className="flex-1 p-6 overflow-y-auto space-y-6 max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-bold text-foreground">Активні спринти</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Поточний спринт: <strong className="text-foreground">Спринт 1 ({projectKey})</strong> • Завершення через 7 днів
            </p>
          </div>

          <button
            onClick={onOpenCreateTask}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Додати задачу в спринт</span>
          </button>
        </div>

        {/* Sprint Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-border bg-card/60 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Задач у спринті</span>
            <div className="text-2xl font-bold text-foreground font-mono">{tasks.length}</div>
            <span className="text-[10px] text-muted-foreground">{completedTasks.length} завершено</span>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card/60 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Загальні Story Points</span>
            <div className="text-2xl font-bold text-amber-400 font-mono">{totalPoints} SP</div>
            <span className="text-[10px] text-muted-foreground">Швидкість команди (Velocity): ~25 SP</span>
          </div>
          <div className="p-4 rounded-xl border border-border bg-card/60 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Прогрес виконання</span>
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
            </div>
            <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden mt-2">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{
                  width: `${tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Sprint Tasks Table */}
        <div className="rounded-xl border border-border bg-card/60 overflow-hidden">
          <div className="p-3 bg-secondary/30 border-b border-border text-xs font-bold text-foreground">
            Задачі поточного спринту
          </div>
          <div className="divide-y divide-border/60">
            {tasks.map((t) => {
              const col = columns.find((c) => c.id === t.columnId);
              return (
                <div key={t.id} className="p-3 flex items-center justify-between text-xs hover:bg-secondary/20">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-primary">{t.code}</span>
                    <span className="font-medium text-foreground">{t.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded font-medium text-white"
                      style={{ backgroundColor: col?.color || "#64748b" }}
                    >
                      {col?.name || "Статус"}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {(t as any).aiContext?.storyPoints || 3} SP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (section === "releases") {
    return (
      <div className="flex-1 p-6 overflow-y-auto space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-foreground">Релізи та версії</h2>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-sm text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                  v1.0.0
                </span>
                <span className="font-semibold text-foreground text-sm">Базовий реліз системи підтримки</span>
              </div>
              <span className="text-xs text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                Заплановано до випуску
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Включає повноцінний трипанельний інтерфейс у стилі Jira, керування проєктами, розділення прав доступу для Головного адміністратора, створених адміністраторів, інженерів та клієнтів.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (section === "reports") {
    return (
      <div className="flex-1 p-6 overflow-y-auto space-y-6 max-w-5xl">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl font-bold text-foreground">Звіти та аналітика проєкту</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border border-border bg-card/60 space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Діаграма згоряння задач (Burndown Chart)</h4>
            <p className="text-xs text-muted-foreground">
              Відображає динаміку виконання залишку задач протягом спринту по днях.
            </p>
          </div>
          <div className="p-5 rounded-xl border border-border bg-card/60 space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Швидкість команди (Velocity Chart)</h4>
            <p className="text-xs text-muted-foreground">
              Порівнює заплановані та фактично виконані Story Points за кожний спринт.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Components view
  return (
    <div className="flex-1 p-6 overflow-y-auto space-y-6 max-w-5xl">
      <div className="flex items-center gap-2">
        <Boxes className="w-5 h-5 text-violet-400" />
        <h2 className="text-xl font-bold text-foreground">Компоненти проєкту</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {["Frontend (Next.js)", "Backend (API)", "Database (PostgreSQL)"].map((comp, i) => (
          <div key={i} className="p-4 rounded-xl border border-border bg-card/60 space-y-2">
            <span className="font-semibold text-xs text-foreground block">{comp}</span>
            <p className="text-[11px] text-muted-foreground">
              Підсистема для групування задач та призначення відповідальних модулів.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
