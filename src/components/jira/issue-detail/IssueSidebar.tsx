"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Calendar,
  Clock,
  ChevronDown,
  Search,
  Check,
  CornerUpLeft,
  Timer,
  AlertCircle,
  X,
} from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { getUserInitials, getUserRoleBadge } from "./types";
import {
  parseDurationToMinutes,
  formatMinutesToDuration,
  formatDurationHumanMinutes,
  isValidDuration,
  normalizeDurationInput,
  formatDurationHuman,
  TIME_PRESETS,
} from "@/lib/timeEstimate";
import { useI18n } from "@/lib/i18n";

interface IssueSidebarProps {
  task: any;
  projectId: string;
  canChangeAssignee: boolean;
  currentUser?: any;
  storyPoints?: number;
  onUpdateField: (fields: Record<string, any>) => void;
  onReturnToClient?: () => void;
}

export function IssueSidebar({
  task,
  projectId,
  canChangeAssignee,
  currentUser,
  onUpdateField,
  onReturnToClient,
}: IssueSidebarProps) {
  const { dict, locale } = useI18n();
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [clientUsers, setClientUsers] = useState<any[]>([]);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);

  // Staff check (Admins and Engineers only)
  const isStaff = Boolean(
    currentUser && (currentUser.role === "ADMIN" || currentUser.role === "ENGINEER")
  );

  // Time tracking states
  const currentEstimate = task.aiContext?.originalEstimate || "";
  const currentTimeSpent = task.aiContext?.timeSpent || "0h";
  const [isEditingEstimate, setIsEditingEstimate] = useState(false);
  const [estimateInput, setEstimateInput] = useState(currentEstimate);
  const [estimateError, setEstimateError] = useState<string | null>(null);

  const [isEditingSpent, setIsEditingSpent] = useState(false);
  const [spentInput, setSpentInput] = useState(currentTimeSpent);
  const [spentError, setSpentError] = useState<string | null>(null);

  useEffect(() => {
    setEstimateInput(task.aiContext?.originalEstimate || "");
  }, [task.aiContext?.originalEstimate]);

  useEffect(() => {
    setSpentInput(task.aiContext?.timeSpent || "0h");
  }, [task.aiContext?.timeSpent]);

  // Derived time metrics (all calculations based on exact minutes)
  const estimateMinutes = parseDurationToMinutes(currentEstimate);
  const spentMinutes = parseDurationToMinutes(currentTimeSpent);
  const remainingMinutes = Math.max(0, estimateMinutes - spentMinutes);
  const calculatedRemaining =
    estimateMinutes > 0
      ? formatMinutesToDuration(remainingMinutes)
      : currentEstimate
      ? currentEstimate
      : "—";

  const isOverspent = spentMinutes > estimateMinutes && estimateMinutes > 0;
  const overspentMinutes = isOverspent ? spentMinutes - estimateMinutes : 0;

  const percentSpent =
    estimateMinutes > 0 ? (spentMinutes / estimateMinutes) * 100 : 0;
  const formattedPercent =
    percentSpent % 1 === 0
      ? `${percentSpent}%`
      : `${(Math.round(percentSpent * 10) / 10).toFixed(1).replace(/\.0$/, "")}%`;

  // Підсумковий показник «Загалом»:
  // Якщо фактично витрачений час <= оцінки, показуємо оцінку.
  // Якщо перевищує, динамічно збільшується до фактично списаного часу.
  const totalEffectiveMinutes = Math.max(estimateMinutes, spentMinutes);
  const totalDurationHuman = formatDurationHumanMinutes(totalEffectiveMinutes);

  const isAssigneeStaff = Boolean(
    task.assignee && (task.assignee.role === "ADMIN" || task.assignee.role === "ENGINEER")
  );
  const hasCreator = Boolean(task.creatorId || task.creator?.id);
  const isCreatorCurrentAssignee = task.assigneeId === (task.creatorId || task.creator?.id);
  const isClosed = Boolean(task.aiContext?.isClosed);
  const canReturnToClient =
    canChangeAssignee && isAssigneeStaff && hasCreator && !isCreatorCurrentAssignee && !isClosed;

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

  const handleSaveEstimate = (customVal?: string) => {
    const val = (customVal !== undefined ? customVal : estimateInput).trim();
    if (!val) {
      const newAiContext = { ...(task.aiContext || {}) };
      delete newAiContext.originalEstimate;
      onUpdateField({ aiContext: newAiContext });
      setIsEditingEstimate(false);
      setEstimateError(null);
      return;
    }

    if (!isValidDuration(val)) {
      setEstimateError("Вкажіть число та одиницю: h, d, w, m (наприклад: 2h, 1d, 1w)");
      return;
    }

    const normalized = normalizeDurationInput(val);
    const newAiContext = {
      ...(task.aiContext || {}),
      originalEstimate: normalized,
    };
    onUpdateField({ aiContext: newAiContext });
    setIsEditingEstimate(false);
    setEstimateError(null);
  };

  const handleSaveSpent = (customVal?: string) => {
    const val = (customVal !== undefined ? customVal : spentInput).trim();
    if (!val) {
      const newAiContext = { ...(task.aiContext || {}), timeSpent: "0h" };
      onUpdateField({ aiContext: newAiContext });
      setIsEditingSpent(false);
      setSpentError(null);
      return;
    }

    if (!isValidDuration(val)) {
      setSpentError("Вкажіть число та одиницю: h, d, w, m (наприклад: 1h, 4h, 1d)");
      return;
    }

    const normalized = normalizeDurationInput(val);
    const newAiContext = {
      ...(task.aiContext || {}),
      timeSpent: normalized,
    };
    onUpdateField({ aiContext: newAiContext });
    setIsEditingSpent(false);
    setSpentError(null);
  };

  return (
    <div className="lg:col-span-4 p-5 space-y-6 bg-card/20">
      {/* People Section */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          {dict.issue.people}
        </h4>

        {/* Assignee */}
        <div className="space-y-1 relative" ref={assigneeDropdownRef}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground block">{dict.issue.assignee}:</span>
            {canReturnToClient && onReturnToClient ? (
              <button
                type="button"
                onClick={onReturnToClient}
                className="text-[10px] font-semibold text-amber-500 hover:text-amber-400 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                title={`Швидко перепризначити на автора (${task.creator?.name || "клієнта"})`}
              >
                <CornerUpLeft className="w-3 h-3" />
                <span>{dict.issue.returnToClient}</span>
              </button>
            ) : canChangeAssignee ? (
              <span className="text-[10px] text-primary/80 font-medium">
                {dict.issue.clickToChange}
              </span>
            ) : null}
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
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary text-muted-foreground border border-border"
                  }`}>
                    {task.assignee ? getUserInitials(task.assignee.name, task.assignee.email) : "?"}
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-semibold text-foreground truncate block">
                      {task.assignee ? task.assignee.name : dict.common.notAssigned}
                    </span>
                    {task.assignee && (
                      <span className="text-[10px] text-muted-foreground truncate block font-mono">
                        {getUserRoleBadge(task.assignee.role).label}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
                  isAssigneeDropdownOpen ? "rotate-180" : ""
                }`} />
              </button>

              {/* Assignee Dropdown Popover */}
              {isAssigneeDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 rounded-xl bg-card border border-border shadow-2xl p-1.5 z-40 animate-in fade-in-50 zoom-in-95 space-y-1">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={dict.issue.searchUser}
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
                        <span>{dict.common.notAssigned}</span>
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
                          <span className="font-semibold">{dict.issue.assignToMe} ({currentUser.name})</span>
                        </div>
                      </button>
                    )}

                    {/* Quick option: Return to Client */}
                    {canReturnToClient && onReturnToClient && task.creator && (
                      <button
                        type="button"
                        onClick={() => {
                          onReturnToClient();
                          setIsAssigneeDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-[9px]">
                            <CornerUpLeft className="w-3 h-3" />
                          </div>
                          <span className="font-semibold">{dict.issue.returnToClient} ({task.creator.name})</span>
                        </div>
                      </button>
                    )}

                    <div className="my-1 border-t border-border/60" />

                    {/* Staff Group */}
                    {staffUsers.length > 0 && (
                      <div className="space-y-0.5">
                        <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          {dict.issue.supportTeam} ({staffUsers.length})
                        </div>
                        {staffUsers
                          .filter((u) =>
                            u.name?.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
                            u.email?.toLowerCase().includes(assigneeSearch.toLowerCase())
                          )
                          .map((u) => {
                            const isSelected = task.assigneeId === u.id;
                            const badge = getUserRoleBadge(u.role);
                            return (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => {
                                  onUpdateField({ assigneeId: u.id });
                                  setIsAssigneeDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                  isSelected
                                    ? "bg-primary/15 text-primary font-semibold"
                                    : "text-foreground hover:bg-secondary"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[9px] flex-shrink-0">
                                    {getUserInitials(u.name, u.email)}
                                  </div>
                                  <div className="truncate text-left">
                                    <span className="truncate block leading-tight">{u.name}</span>
                                    <span className="text-[10px] text-muted-foreground truncate block font-mono">
                                      {u.email}
                                    </span>
                                  </div>
                                </div>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${badge.color}`}>
                                  {badge.label}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    )}

                    {/* Client Users Group */}
                    {clientUsers.length > 0 && (
                      <div className="space-y-0.5 pt-1 border-t border-border/60">
                        <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          {dict.issue.projectClients} ({clientUsers.length})
                        </div>
                        {clientUsers
                          .filter((u) =>
                            u.name?.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
                            u.email?.toLowerCase().includes(assigneeSearch.toLowerCase())
                          )
                          .map((u) => {
                            const isSelected = task.assigneeId === u.id;
                            return (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => {
                                  onUpdateField({ assigneeId: u.id });
                                  setIsAssigneeDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                  isSelected
                                    ? "bg-primary/15 text-primary font-semibold"
                                    : "text-foreground hover:bg-secondary"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[9px] flex-shrink-0">
                                    {getUserInitials(u.name, u.email)}
                                  </div>
                                  <div className="truncate text-left">
                                    <span className="truncate block leading-tight">{u.name}</span>
                                    <span className="text-[10px] text-muted-foreground truncate block font-mono">
                                      {u.email}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[9px] px-1.5 py-0.2 rounded border bg-blue-500/10 text-blue-400 border-blue-500/20 font-mono">
                                  {dict.roles.client}
                                </span>
                              </button>
                            );
                          })}
                      </div>
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
                  {task.assignee ? task.assignee.name : dict.common.notAssigned}
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
          <span className="text-[11px] text-muted-foreground block">{dict.issue.reporter}:</span>
          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-secondary/20">
            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center font-bold text-[10px] text-foreground">
              {task.creator ? task.creator.name[0].toUpperCase() : "A"}
            </div>
            <span className="text-xs font-medium text-foreground truncate">
              {task.creator ? task.creator.name : dict.roles.admin}
            </span>
          </div>
        </div>
      </div>

      {/* Dates Section */}
      <div className="space-y-2.5 pt-3 border-t border-border/60">
        <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          {dict.issue.dates}
        </h4>

        <div className="flex items-center justify-between text-xs py-0.5">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{dict.issue.created}</span>
          </span>
          <span className="font-medium text-foreground">
            {new Date(task.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "uk-UA")}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs py-0.5">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{dict.issue.updated}</span>
          </span>
          <span className="font-medium text-foreground">
            {formatTimeAgo(task.updatedAt, locale)}
          </span>
        </div>

        {/* Due date */}
        <div className="space-y-1 pt-1">
          <span className="text-[11px] text-muted-foreground block">
            {dict.issue.dueDate}:
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

      {/* Time Tracking Section (Internal for Staff: Admins & Engineers) */}
      {isStaff && (
        <div className="space-y-3 pt-3 border-t border-border/60">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-primary" />
              <span>{dict.issue.workTracking}</span>
            </h4>
            <button
              type="button"
              onClick={() => {
                setIsEditingEstimate(!isEditingEstimate);
                setIsEditingSpent(false);
                setEstimateError(null);
              }}
              className="text-[10px] font-semibold text-primary hover:underline cursor-pointer"
            >
              {isEditingEstimate ? dict.common.close : dict.issue.changeEstimate}
            </button>
          </div>

          {/* Quick Edit Form for Original Estimate */}
          {isEditingEstimate && (
            <div className="p-2.5 rounded-xl bg-secondary/40 border border-border space-y-2 animate-in fade-in-50">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {dict.issue.timeEstimateUnitHint}
                </label>
                <button
                  type="button"
                  onClick={() => setIsEditingEstimate(false)}
                  className="text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={estimateInput}
                  onChange={(e) => {
                    setEstimateInput(e.target.value);
                    if (estimateError) setEstimateError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSaveEstimate();
                    }
                  }}
                  placeholder="напр. 4h, 1d, 1w"
                  className="flex-1 text-xs px-2.5 py-1.5 rounded-lg bg-card border border-border font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleSaveEstimate()}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  {dict.common.save}
                </button>
              </div>

              {estimateError && (
                <div className="flex items-center gap-1 text-[10px] text-destructive">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{estimateError}</span>
                </div>
              )}

              {/* Quick Presets */}
              <div className="space-y-1 pt-1 border-t border-border/50">
                <span className="text-[10px] text-muted-foreground block">{dict.issue.quickPreset}</span>
                <div className="flex flex-wrap gap-1">
                  {TIME_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setEstimateInput(preset);
                        handleSaveEstimate(preset);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors cursor-pointer ${
                        currentEstimate === preset
                          ? "bg-primary/20 text-primary border-primary/40 font-bold"
                          : "bg-secondary text-muted-foreground border-border hover:text-foreground"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Edit Form for Time Spent */}
          {isEditingSpent && (
            <div className="p-2.5 rounded-xl bg-secondary/40 border border-border space-y-2 animate-in fade-in-50">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {dict.issue.timeSpentUnitHint}
                </label>
                <button
                  type="button"
                  onClick={() => setIsEditingSpent(false)}
                  className="text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={spentInput}
                  onChange={(e) => {
                    setSpentInput(e.target.value);
                    if (spentError) setSpentError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSaveSpent();
                    }
                  }}
                  placeholder="напр. 2h, 1d"
                  className="flex-1 text-xs px-2.5 py-1.5 rounded-lg bg-card border border-border font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleSaveSpent()}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  {dict.common.save}
                </button>
              </div>

              {spentError && (
                <div className="flex items-center gap-1 text-[10px] text-destructive">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{spentError}</span>
                </div>
              )}
            </div>
          )}

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div
              onClick={() => {
                setIsEditingEstimate(true);
                setIsEditingSpent(false);
              }}
              className="p-2 rounded-lg bg-secondary/30 border border-border/60 hover:border-primary/50 transition-colors cursor-pointer"
              title="Клікніть, щоб змінити часову оцінку"
            >
              <span className="text-[10px] text-muted-foreground block">{dict.issue.originalEstimate}</span>
              <span className="font-bold text-foreground font-mono">
                {currentEstimate || "—"}
              </span>
            </div>
            <div
              onClick={() => {
                setIsEditingSpent(true);
                setIsEditingEstimate(false);
              }}
              className="p-2 rounded-lg bg-secondary/30 border border-border/60 hover:border-emerald-500/50 transition-colors cursor-pointer"
              title="Клікніть, щоб змінити витрачений час"
            >
              <span className="text-[10px] text-muted-foreground block">{dict.issue.loggedTime}</span>
              <span className="font-bold text-emerald-400 font-mono">
                {currentTimeSpent || "0h"}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-secondary/30 border border-border/60">
              <span className="text-[10px] text-muted-foreground block">{dict.issue.remainingTime}</span>
              <span className="font-bold text-blue-400 font-mono">
                {calculatedRemaining}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          {estimateMinutes > 0 && (
            <div className="space-y-1">
              <div className="w-full h-2 rounded-full bg-secondary overflow-hidden flex">
                {isOverspent ? (
                  <div
                    className="h-full bg-rose-500 transition-all duration-300 w-full"
                    title={`Перевитрата: ${formatMinutesToDuration(overspentMinutes)}`}
                  />
                ) : (
                  <>
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, percentSpent)}%` }}
                    />
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${Math.max(0, 100 - percentSpent)}%` }}
                    />
                  </>
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                {isOverspent ? (
                  <span className="text-rose-500 dark:text-rose-400 font-semibold">
                    {dict.issue.loggedTime} {formattedPercent} ({dict.issue.overspent} {formatMinutesToDuration(overspentMinutes)})
                  </span>
                ) : (
                  <span>{dict.issue.loggedTime} {formattedPercent}</span>
                )}
                <span>{dict.issue.totalTime} {totalDurationHuman}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
