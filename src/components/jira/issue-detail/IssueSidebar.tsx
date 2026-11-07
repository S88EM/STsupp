"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Calendar,
  Clock,
  ChevronDown,
  Search,
  Check,
} from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { getUserInitials, getUserRoleBadge } from "./types";

interface IssueSidebarProps {
  task: any;
  projectId: string;
  canChangeAssignee: boolean;
  currentUser?: any;
  storyPoints: number;
  onUpdateField: (fields: Record<string, any>) => void;
}

export function IssueSidebar({
  task,
  projectId,
  canChangeAssignee,
  currentUser,
  storyPoints,
  onUpdateField,
}: IssueSidebarProps) {
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [clientUsers, setClientUsers] = useState<any[]>([]);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (canChangeAssignee && projectId) {
      fetch(`/api/projects/${projectId}/assignees`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) {
            setStaffUsers(data.staff || []);
            setClientUsers(data.projectClients || []);
          }
        })
        .catch(console.error);
    }
  }, [canChangeAssignee, projectId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        assigneeDropdownRef.current &&
        !assigneeDropdownRef.current.contains(e.target as Node)
      ) {
        setIsAssigneeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="lg:col-span-4 p-5 space-y-6 bg-card/20">
      {/* People Section */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          Люди
        </h4>

        {/* Assignee */}
        <div className="space-y-1 relative" ref={assigneeDropdownRef}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground block">Виконавець:</span>
            {canChangeAssignee && (
              <span className="text-[10px] text-primary/80 font-medium">
                (Клікніть для зміни)
              </span>
            )}
          </div>

          {canChangeAssignee ? (
            <div>
              <button
                type="button"
                onClick={() => {
                  setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen);
                  setAssigneeSearch("");
                }}
                className={`w-full flex items-center justify-between p-2 rounded-lg border text-left transition-all ${
                  isAssigneeDropdownOpen
                    ? "bg-secondary border-primary/60 shadow-sm"
                    : "bg-secondary/40 border-border hover:bg-secondary hover:border-border/80 cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${
                    task.assignee
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}>
                    {task.assignee ? getUserInitials(task.assignee.name, task.assignee.email) : "?"}
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-semibold text-foreground block truncate">
                      {task.assignee ? task.assignee.name : "Не призначено"}
                    </span>
                    {task.assignee?.email && (
                      <span className="text-[10px] text-muted-foreground block truncate font-mono">
                        {task.assignee.email}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform flex-shrink-0 ml-1 ${
                  isAssigneeDropdownOpen ? "rotate-180 text-primary" : ""
                }`} />
              </button>

              {isAssigneeDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-72 rounded-xl bg-card border border-border shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95">
                  {/* Search box */}
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Пошук користувача..."
                      value={assigneeSearch}
                      onChange={(e) => setAssigneeSearch(e.target.value)}
                      autoFocus
                      className="w-full text-xs pl-8 pr-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-0.5">
                    {/* Option: Unassigned */}
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateField({ assigneeId: null });
                        setIsAssigneeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        !task.assigneeId
                          ? "bg-primary/15 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px]">
                          ?
                        </div>
                        <span>Не призначено</span>
                      </div>
                      {!task.assigneeId && <Check className="w-3.5 h-3.5 text-primary" />}
                    </button>

                    {/* Quick option: Assign to Me */}
                    {currentUser && task.assigneeId !== currentUser.userId && (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateField({ assigneeId: currentUser.userId });
                          setIsAssigneeDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[9px]">
                            {getUserInitials(currentUser.name, currentUser.email)}
                          </div>
                          <span className="font-semibold">Призначити мені ({currentUser.name})</span>
                        </div>
                      </button>
                    )}

                    <div className="my-1 border-t border-border/60" />

                    {/* Section 1: Staff (Admins & Engineers) */}
                    <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1 flex items-center justify-between">
                      <span>Співробітники (Підтримка/Адмін)</span>
                      <span className="text-[9px] font-normal text-muted-foreground">({staffUsers.length})</span>
                    </div>

                    {staffUsers
                      .filter((u) => {
                        if (!assigneeSearch.trim()) return true;
                        const query = assigneeSearch.toLowerCase();
                        return (
                          u.name?.toLowerCase().includes(query) ||
                          u.email?.toLowerCase().includes(query)
                        );
                      })
                      .map((u) => {
                        const isSelected = task.assigneeId === u.id;
                        const roleBadge = getUserRoleBadge(u.role);
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              onUpdateField({ assigneeId: u.id });
                              setIsAssigneeDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                              isSelected
                                ? "bg-primary/15 text-foreground font-medium"
                                : "text-foreground hover:bg-secondary"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-[10px] text-foreground flex-shrink-0">
                                {getUserInitials(u.name, u.email)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold truncate block">{u.name}</span>
                                  <span className={`text-[9px] px-1 py-0.2 rounded border ${roleBadge.color}`}>
                                    {roleBadge.label}
                                  </span>
                                </div>
                                <span className="text-[10px] text-muted-foreground truncate block font-mono">
                                  {u.email}
                                </span>
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-primary flex-shrink-0 ml-1.5" />
                            )}
                          </button>
                        );
                      })}

                    {/* Section 2: Clients of THIS project only */}
                    <div className="my-1 border-t border-border/60" />
                    <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1 flex items-center justify-between">
                      <span>Клієнти цього проєкту</span>
                      <span className="text-[9px] font-normal text-muted-foreground">({clientUsers.length})</span>
                    </div>

                    {clientUsers.length === 0 ? (
                      <div className="px-2 py-1.5 text-[11px] text-muted-foreground/60 italic">
                        Клієнтів до цього проєкту не підключено
                      </div>
                    ) : (
                      clientUsers
                        .filter((u) => {
                          if (!assigneeSearch.trim()) return true;
                          const query = assigneeSearch.toLowerCase();
                          return (
                            u.name?.toLowerCase().includes(query) ||
                            u.email?.toLowerCase().includes(query)
                          );
                        })
                        .map((u) => {
                          const isSelected = task.assigneeId === u.id;
                          const roleBadge = getUserRoleBadge(u.role);
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                onUpdateField({ assigneeId: u.id });
                                setIsAssigneeDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                                isSelected
                                  ? "bg-primary/15 text-foreground font-medium"
                                  : "text-foreground hover:bg-secondary"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-[10px] text-foreground flex-shrink-0">
                                  {getUserInitials(u.name, u.email)}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold truncate block">{u.name}</span>
                                    <span className={`text-[9px] px-1 py-0.2 rounded border ${roleBadge.color}`}>
                                      {roleBadge.label}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground truncate block font-mono">
                                    {u.email}
                                  </span>
                                </div>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-primary flex-shrink-0 ml-1.5" />
                              )}
                            </button>
                          );
                        })
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Read-only for Client */
            <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border/60 cursor-default">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                {task.assignee ? getUserInitials(task.assignee.name, task.assignee.email) : "?"}
              </div>
              <div className="truncate">
                <span className="text-xs font-semibold text-foreground truncate block">
                  {task.assignee ? task.assignee.name : "Не призначено"}
                </span>
                {task.assignee?.email && (
                  <span className="text-[10px] text-muted-foreground truncate block font-mono">
                    {task.assignee.email}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Reporter / Creator */}
        <div className="space-y-1">
          <span className="text-[11px] text-muted-foreground block">Автор (Reporter):</span>
          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-secondary/20">
            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center font-bold text-[10px] text-foreground">
              {task.creator ? task.creator.name[0].toUpperCase() : "A"}
            </div>
            <span className="text-xs font-medium text-foreground truncate">
              {task.creator ? task.creator.name : "Адміністратор"}
            </span>
          </div>
        </div>
      </div>

      {/* Dates Section */}
      <div className="space-y-2.5 pt-3 border-t border-border/60">
        <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          Дати
        </h4>

        <div className="flex items-center justify-between text-xs py-0.5">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Створено:</span>
          </span>
          <span className="font-medium text-foreground">
            {new Date(task.createdAt).toLocaleDateString("uk-UA")}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs py-0.5">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Оновлено:</span>
          </span>
          <span className="font-medium text-foreground">
            {formatTimeAgo(task.updatedAt)}
          </span>
        </div>

        {/* Due date */}
        <div className="space-y-1 pt-1">
          <span className="text-[11px] text-muted-foreground block">
            Термін виконання:
          </span>
          <input
            type="date"
            value={
              task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
            }
            onChange={(e) =>
              onUpdateField({ dueDate: e.target.value ? e.target.value : null })
            }
            className="w-full text-xs p-1.5 rounded-lg bg-secondary/40 border border-border text-foreground"
          />
        </div>
      </div>

      {/* Time Tracking Section */}
      <div className="space-y-3 pt-3 border-t border-border/60">
        <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          Облік часу
        </h4>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 rounded-lg bg-secondary/30 border border-border/60">
            <span className="text-[10px] text-muted-foreground block">Оцінка</span>
            <span className="font-bold text-foreground font-mono">2d</span>
          </div>
          <div className="p-2 rounded-lg bg-secondary/30 border border-border/60">
            <span className="text-[10px] text-muted-foreground block">Витрачено</span>
            <span className="font-bold text-emerald-400 font-mono">1d</span>
          </div>
          <div className="p-2 rounded-lg bg-secondary/30 border border-border/60">
            <span className="text-[10px] text-muted-foreground block">Залишилось</span>
            <span className="font-bold text-blue-400 font-mono">1d</span>
          </div>
        </div>

        {/* Time progress bar */}
        <div className="space-y-1">
          <div className="w-full h-2 rounded-full bg-secondary overflow-hidden flex">
            <div className="h-full bg-emerald-500" style={{ width: "50%" }} />
            <div className="h-full bg-blue-500" style={{ width: "50%" }} />
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Витрачено 50%</span>
            <span>Загалом 2 дні</span>
          </div>
        </div>
      </div>

      {/* Agile Section */}
      <div className="space-y-3 pt-3 border-t border-border/60">
        <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          Оцінка (Story Points)
        </h4>

        <div className="flex items-center justify-between text-xs py-1 border-b border-border/40">
          <span className="text-muted-foreground">Story Points:</span>
          <span className="px-2 py-0.5 rounded-full bg-secondary font-mono font-bold text-foreground text-xs border border-border">
            {storyPoints}
          </span>
        </div>
      </div>
    </div>
  );
}
