"use client";

import React from "react";
import { ColumnItem } from "../ColumnCard";

interface TaskDetailSidebarProps {
  task?: any;
  columns: ColumnItem[];
  staffUsers: any[];
  projectClientUsers: any[];
  canChangeAssignee: boolean;
  canChangeStatus: boolean;
  onUpdateField: (field: string, value: any) => void;
}

export const TaskDetailSidebar: React.FC<TaskDetailSidebarProps> = ({
  task,
  columns,
  staffUsers,
  projectClientUsers,
  canChangeAssignee,
  canChangeStatus,
  onUpdateField,
}) => {
  return (
    <div className="w-full md:w-72 bg-secondary/10 p-6 space-y-5 flex-shrink-0 text-xs">
      {/* Assignee Selector */}
      <div>
        <label className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider block mb-1.5">
          Виконавець
        </label>
        {canChangeAssignee ? (
          <select
            value={task?.assigneeId || ""}
            onChange={(e) => onUpdateField("assigneeId", e.target.value || null)}
            className="w-full bg-secondary/60 border border-border rounded-lg py-1.5 px-2.5 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="">Не призначено</option>
            {staffUsers.length > 0 && (
              <optgroup label={`Співробітники (${staffUsers.length})`}>
                {staffUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role === "ADMIN" ? "Адмін" : "Інженер"})
                  </option>
                ))}
              </optgroup>
            )}
            {projectClientUsers.length > 0 && (
              <optgroup label={`Клієнти цього проєкту (${projectClientUsers.length})`}>
                {projectClientUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} (Клієнт)
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        ) : (
          <div className="w-full bg-secondary/30 border border-border/60 rounded-lg py-1.5 px-2.5 font-medium text-foreground">
            {task?.assignee?.name || "Не призначено"}
          </div>
        )}
      </div>

      {/* Status Selector */}
      <div>
        <label className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider block mb-1.5">
          Статус
        </label>
        {canChangeStatus ? (
          <select
            value={task?.columnId || ""}
            onChange={(e) => onUpdateField("columnId", e.target.value)}
            className="w-full bg-secondary/60 border border-border rounded-lg py-1.5 px-2.5 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="w-full bg-secondary/40 border border-border/60 rounded-lg py-1.5 px-2.5 font-medium text-foreground flex items-center justify-between cursor-default">
            <span>
              {columns.find((c) => c.id === task?.columnId)?.name || task?.column?.name || "—"}
            </span>
            <span className="text-[10px] text-muted-foreground">Тільки читання</span>
          </div>
        )}
      </div>

      {/* Priority Selector */}
      <div>
        <label className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider block mb-1.5">
          Пріоритет
        </label>
        <select
          value={task?.priority || "MEDIUM"}
          onChange={(e) => onUpdateField("priority", e.target.value)}
          className="w-full bg-secondary/60 border border-border rounded-lg py-1.5 px-2.5 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
        >
          <option value="LOW">Низький</option>
          <option value="MEDIUM">Середній</option>
          <option value="HIGH">Високий</option>
          <option value="URGENT">Терміновий ⚡</option>
        </select>
      </div>

      {/* Due Date */}
      <div>
        <label className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider block mb-1.5">
          Дедлайн
        </label>
        <input
          type="date"
          value={task?.dueDate ? task.dueDate.split("T")[0] : ""}
          onChange={(e) => onUpdateField("dueDate", e.target.value || null)}
          className="w-full bg-secondary/60 border border-border rounded-lg py-1.5 px-2.5 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
        />
      </div>

      {/* Meta Info */}
      <div className="pt-4 border-t border-border/60 space-y-2 text-[11px] text-muted-foreground">
        <div className="flex justify-between">
          <span>Створено:</span>
          <span className="font-medium text-foreground">
            {task?.createdAt ? new Date(task.createdAt).toLocaleDateString("uk-UA") : "-"}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Автор:</span>
          <span className="font-medium text-foreground">
            {task?.creator?.name || "Admin"}
          </span>
        </div>
      </div>
    </div>
  );
};
