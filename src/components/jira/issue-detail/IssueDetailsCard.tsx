"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Layers,
  ChevronDown,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Pencil,
  Check,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { ColumnItem } from "@/components/board/ColumnCard";
import { JIRA_TASK_TYPES, getPriorityIcon } from "../IssueListPane";
import { DictionariesData, getStatusSemantic } from "./types";

interface IssueDetailsCardProps {
  task: any;
  typeInfo: { icon: React.ReactNode; label: string; id: string };
  currentColumn: ColumnItem | undefined;
  columns?: ColumnItem[];
  canChangeStatus?: boolean;
  onChangeStatus?: (columnId: string) => void;
  projectId: string;
  projectKey: string;
  dictionaries: DictionariesData;
  isClosed: boolean;
  isDone: boolean;
  resolution: string;
  onChangeType: (typeId: string) => void;
  onChangePriority: (priority: string) => void;
  onToggleComponent: (component: string) => void;
  onToggleLabel: (label: string) => void;
  onClosePermanently: () => void;
}

export function IssueDetailsCard({
  task,
  typeInfo,
  currentColumn,
  columns = [],
  canChangeStatus = false,
  onChangeStatus,
  projectId,
  projectKey,
  dictionaries,
  isClosed,
  isDone,
  resolution,
  onChangeType,
  onChangePriority,
  onToggleComponent,
  onToggleLabel,
  onClosePermanently,
}: IssueDetailsCardProps) {
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showComponentsMenu, setShowComponentsMenu] = useState(false);
  const [showLabelsMenu, setShowLabelsMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const componentsMenuRef = useRef<HTMLDivElement>(null);
  const labelsMenuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false);
      }
      if (componentsMenuRef.current && !componentsMenuRef.current.contains(e.target as Node)) {
        setShowComponentsMenu(false);
      }
      if (labelsMenuRef.current && !labelsMenuRef.current.contains(e.target as Node)) {
        setShowLabelsMenu(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const componentsList: string[] = Array.isArray(task.aiContext?.components)
    ? task.aiContext.components
    : [];
  const labelsList: string[] = Array.isArray(task.aiContext?.labels)
    ? task.aiContext.labels
    : [];

  const statusConfig = getStatusSemantic(
    currentColumn?.name,
    currentColumn?.isDoneColumn,
    isClosed
  );

  const columnsList: ColumnItem[] =
    columns && columns.length > 0
      ? columns
      : task?.project?.columns && task.project.columns.length > 0
      ? task.project.columns
      : currentColumn
      ? [currentColumn]
      : [];

  return (
    <div className="rounded-xl border border-border bg-card/60 p-4 space-y-3">
      <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
        <Layers className="w-3.5 h-3.5 text-primary" />
        <span>Деталі задачі</span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
        {/* Type */}
        <div className="flex items-center justify-between py-1 border-b border-border/50">
          <span className="text-muted-foreground">Тип:</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTypeMenu(!showTypeMenu)}
              className="flex items-center gap-1.5 font-semibold text-foreground hover:bg-secondary px-2 py-0.5 rounded transition-colors cursor-pointer"
            >
              {typeInfo.icon}
              <span>{typeInfo.label}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5" />
            </button>

            {showTypeMenu && (
              <div className="absolute right-0 mt-1 w-36 rounded-lg bg-card border border-border shadow-xl py-1 z-30">
                {Object.values(JIRA_TASK_TYPES).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setShowTypeMenu(false);
                      onChangeType(t.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-secondary cursor-pointer"
                  >
                    {t.icon}
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Priority */}
        <div className="flex items-center justify-between py-1 border-b border-border/50">
          <span className="text-muted-foreground">Приоритет:</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPriorityMenu(!showPriorityMenu)}
              className="flex items-center gap-1.5 font-semibold text-foreground hover:bg-secondary px-2 py-0.5 rounded transition-colors cursor-pointer"
            >
              {getPriorityIcon(task.priority)}
              <span className="capitalize">{task.priority.toLowerCase()}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5" />
            </button>

            {showPriorityMenu && (
              <div className="absolute right-0 mt-1 w-36 rounded-lg bg-card border border-border shadow-xl py-1 z-30">
                <button
                  type="button"
                  onClick={() => {
                    setShowPriorityMenu(false);
                    onChangePriority("URGENT");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-secondary cursor-pointer"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  <span>Терміновий ⚡</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPriorityMenu(false);
                    onChangePriority("HIGH");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-amber-400 hover:bg-secondary cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5 text-amber-400" />
                  <span>Високий</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPriorityMenu(false);
                    onChangePriority("MEDIUM");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-secondary cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Середній</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPriorityMenu(false);
                    onChangePriority("LOW");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-blue-400 hover:bg-secondary cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
                  <span>Низький</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Components */}
        <div
          className="flex items-center justify-between py-1.5 border-b border-border/50 relative"
          ref={componentsMenuRef}
        >
          <span className="text-muted-foreground">Компоненти:</span>
          <div className="flex items-center gap-1.5">
            <div className="flex flex-wrap gap-1 max-w-[200px] justify-end">
              {componentsList.length === 0 ? (
                <span className="text-[11px] text-muted-foreground/70 italic">Не обрано</span>
              ) : (
                componentsList.map((comp: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.2 rounded bg-secondary text-[11px] font-mono text-muted-foreground border border-border/80"
                  >
                    {comp}
                  </span>
                ))
              )}
            </div>
            {!isClosed && (
              <button
                type="button"
                onClick={() => setShowComponentsMenu(!showComponentsMenu)}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                title="Редагувати компоненти"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}

            {/* Components Popover */}
            {!isClosed && showComponentsMenu && (
              <div className="absolute right-0 top-full mt-1 w-60 rounded-xl bg-card border border-border shadow-2xl p-1 z-40 animate-in fade-in-50 zoom-in-95">
                <div className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/60 flex items-center justify-between">
                  <span>Компоненти ({typeInfo.label})</span>
                  {projectKey && (
                    <span className="font-mono text-primary text-[9px]">[{projectKey}]</span>
                  )}
                </div>
                <div className="max-h-48 overflow-y-auto py-1 space-y-0.5">
                  {(() => {
                    const targetProjectId = task?.projectId || projectId;
                    const availableForProject: string[] =
                      (targetProjectId &&
                        dictionaries.componentsByProject?.[targetProjectId]?.[typeInfo.id]) ||
                      dictionaries.componentsByType?.[typeInfo.id] ||
                      [];

                    if (availableForProject.length === 0) {
                      return (
                        <div className="p-2 text-center text-[11px] text-muted-foreground">
                          Немає компонентів для проєкту та типу {typeInfo.label}
                        </div>
                      );
                    }

                    return availableForProject.map((comp: string) => {
                      const isSelected = componentsList.includes(comp);
                      return (
                        <button
                          key={comp}
                          type="button"
                          onClick={() => onToggleComponent(comp)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                            isSelected
                              ? "bg-primary/15 text-primary font-semibold"
                              : "text-foreground hover:bg-secondary/70"
                          }`}
                        >
                          <span className="truncate pr-1 font-mono text-[11px]">{comp}</span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          )}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Labels */}
        <div
          className="flex items-center justify-between py-1.5 border-b border-border/50 relative"
          ref={labelsMenuRef}
        >
          <span className="text-muted-foreground">Мітки:</span>
          <div className="flex items-center gap-1.5">
            <div className="flex flex-wrap gap-1 max-w-[200px] justify-end">
              {labelsList.length === 0 ? (
                <span className="text-[11px] text-muted-foreground/70 italic">Не обрано</span>
              ) : (
                labelsList.map((lbl: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.2 rounded bg-primary/10 text-primary text-[11px] font-medium border border-primary/20"
                  >
                    {lbl}
                  </span>
                ))
              )}
            </div>
            {!isClosed && (
              <button
                type="button"
                onClick={() => setShowLabelsMenu(!showLabelsMenu)}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                title="Редагувати мітки"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}

            {/* Labels Popover */}
            {!isClosed && showLabelsMenu && (
              <div className="absolute right-0 top-full mt-1 w-52 rounded-xl bg-card border border-border shadow-2xl p-1 z-40 animate-in fade-in-50 zoom-in-95">
                <div className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/60">
                  Довідник міток
                </div>
                <div className="max-h-48 overflow-y-auto py-1 space-y-0.5">
                  {dictionaries.labels.length === 0 ? (
                    <div className="p-2 text-center text-[11px] text-muted-foreground">
                      Довідник міток порожній
                    </div>
                  ) : (
                    dictionaries.labels.map((lbl) => {
                      const isSelected = labelsList.includes(lbl);
                      return (
                        <button
                          key={lbl}
                          type="button"
                          onClick={() => onToggleLabel(lbl)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                            isSelected
                              ? "bg-primary/15 text-primary font-semibold"
                              : "text-foreground hover:bg-secondary/70"
                          }`}
                        >
                          <span className="truncate pr-1 text-[11px]">{lbl}</span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status (Interactive Dropdown Badge) */}
        <div className="flex items-center justify-between py-1 border-b border-border/50">
          <span className="text-muted-foreground font-medium">Статус:</span>
          <div className="relative" ref={statusMenuRef}>
            {isClosed ? (
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border shadow-xs select-none opacity-90 ${statusConfig.badgeClass}`}
                title="Ця задача повністю закрита. Повторне відкриття заблоковано."
              >
                <span className={`w-2 h-2 rounded-full ${statusConfig.dotClass}`} />
                <span className="font-semibold">{currentColumn?.name || statusConfig.label}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700 flex items-center gap-0.5 ml-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Закрита</span>
                </span>
              </div>
            ) : canChangeStatus ? (
              <button
                type="button"
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer shadow-xs hover:shadow hover:brightness-105 active:scale-95 ${statusConfig.badgeClass}`}
                title="Натисніть, щоб змінити статус задачі"
                aria-haspopup="true"
                aria-expanded={showStatusMenu}
              >
                <span className={`w-2 h-2 rounded-full ${statusConfig.dotClass}`} />
                <span className="font-bold tracking-tight">{currentColumn?.name || statusConfig.label}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ml-0.5 opacity-70 group-hover:opacity-100 ${
                    showStatusMenu ? "rotate-180" : ""
                  }`}
                />
              </button>
            ) : (
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border shadow-xs select-none opacity-85 ${statusConfig.badgeClass}`}
                title="Змінювати статус задачі можуть лише адміністратор та інженер"
              >
                <span className={`w-2 h-2 rounded-full ${statusConfig.dotClass}`} />
                <span className="font-semibold">{currentColumn?.name || statusConfig.label}</span>
              </div>
            )}

            {/* Status Dropdown Menu */}
            {!isClosed && canChangeStatus && showStatusMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl bg-card border border-border shadow-2xl p-1 z-40 animate-in fade-in-50 zoom-in-95">
                <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/60">
                  Змінити статус
                </div>
                <div className="max-h-60 overflow-y-auto py-1 space-y-0.5">
                  {columnsList.length === 0 ? (
                    <div className="p-2 text-center text-[11px] text-muted-foreground">
                      Немає доступних статусів
                    </div>
                  ) : (
                    columnsList.map((c) => {
                      const isSelected = c.id === task.columnId;
                      const cSemantic = getStatusSemantic(c.name, c.isDoneColumn);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setShowStatusMenu(false);
                            if (onChangeStatus) onChangeStatus(c.id);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                            isSelected
                              ? `${cSemantic.activeItemClass} border border-border/50`
                              : "text-foreground hover:bg-secondary/80"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${cSemantic.dotClass}`} />
                            <span className={isSelected ? "font-bold" : "font-medium"}>{c.name}</span>
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resolution */}
        <div className="flex items-center justify-between py-1 border-b border-border/50">
          <span className="text-muted-foreground">Рішення:</span>
          <div className="flex items-center gap-2">
            <span
              className={`font-semibold text-xs flex items-center gap-1 ${
                isClosed || resolution === "Вирішено"
                  ? "text-emerald-400"
                  : "text-foreground"
              }`}
            >
              {(isClosed || resolution === "Вирішено") && (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>{resolution}</span>
            </span>
            {isDone && !isClosed && (
              <button
                type="button"
                onClick={onClosePermanently}
                className="text-[10px] px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 font-semibold transition-colors cursor-pointer"
                title="Закрити задачу повністю"
              >
                Закрити повністю
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
