"use client";

import React from "react";
import { Package, BarChart3, Boxes, Layers, Plus, ExternalLink, Calendar, CheckCircle2 } from "lucide-react";
import { ColumnItem } from "@/components/board/ColumnCard";
import { TaskItem } from "@/components/board/TaskCard";

interface AgileViewProps {
  section: "releases" | "reports" | "components";
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
              Відображає динаміку виконання залишку задач проєкту по днях.
            </p>
          </div>
          <div className="p-5 rounded-xl border border-border bg-card/60 space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Швидкість команди (Velocity Chart)</h4>
            <p className="text-xs text-muted-foreground">
              Порівнює заплановані та фактично виконані Story Points за періодами виконання.
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
