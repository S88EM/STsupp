"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Bug,
  CheckSquare,
  Bookmark,
  Zap,
  Wrench,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  User,
} from "lucide-react";
import {
  JiraCreateIssueModalProps,
  DropdownOption,
  CustomSelect,
  CustomMultiSelect,
  CreateIssueFormHeader,
} from "./create-issue";
import { TIME_PRESETS, normalizeDurationInput } from "@/lib/timeEstimate";

export const JiraCreateIssueModal: React.FC<JiraCreateIssueModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName = "",
  projectKey = "",
  columns,
  allProjects = [],
  currentUser: initialCurrentUser,
  onIssueCreated,
}) => {
  const [mounted, setMounted] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId);
  const [currentUser, setCurrentUser] = useState<any>(initialCurrentUser || null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [issueType, setIssueType] = useState<string>("TASK");
  const [columnId, setColumnId] = useState(columns[0]?.id || "");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [timeEstimate, setTimeEstimate] = useState<string>("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [clientUsers, setClientUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Components & Labels from Admin Dictionary
  const [dictionaries, setDictionaries] = useState<{
    componentsByType: Record<string, string[]>;
    componentsByProject: Record<string, Record<string, string[]>>;
    labels: string[];
  }>({ componentsByType: {}, componentsByProject: {}, labels: [] });
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  const getAvailableComponents = (pId = selectedProjectId, type = issueType): string[] => {
    if (pId && dictionaries.componentsByProject?.[pId]?.[type]) {
      return dictionaries.componentsByProject[pId][type];
    }
    return dictionaries.componentsByType?.[type] || [];
  };

  const canChangeAssignee = Boolean(
    currentUser && (currentUser.role === "ADMIN" || currentUser.role === "ENGINEER")
  );
  const canChangeStatus = Boolean(
    currentUser && (currentUser.role === "ADMIN" || currentUser.role === "ENGINEER")
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!currentUser) {
      fetch("/api/auth/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user) setCurrentUser(data.user);
        })
        .catch(() => {});
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen) {
      setSelectedProjectId(projectId);
      setTitle("");
      setDescription("");
      setIssueType("TASK");
      setColumnId(columns[0]?.id || "");
      setPriority("MEDIUM");
      setDueDate("");
      setTimeEstimate("");
      setAssigneeId("");
      setSelectedComponents([]);
      setSelectedLabels([]);
      setError(null);

      fetch("/api/settings/dictionaries")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setDictionaries(data);
        })
        .catch(() => {});
    }
  }, [isOpen, projectId, columns]);

  const handleIssueTypeChange = (newType: string) => {
    setIssueType(newType);
    const validComps = getAvailableComponents(selectedProjectId, newType);
    setSelectedComponents((prev) => prev.filter((c) => validComps.includes(c)));
  };

  const handleProjectChange = (newProjectId: string) => {
    setSelectedProjectId(newProjectId);
    const validComps = getAvailableComponents(newProjectId, issueType);
    setSelectedComponents((prev) => prev.filter((c) => validComps.includes(c)));
  };

  // Fetch assignees strictly for the selected project
  useEffect(() => {
    const targetProject = selectedProjectId || projectId;
    if (isOpen && canChangeAssignee && targetProject) {
      fetch(`/api/projects/${targetProject}/assignees`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setStaffUsers(data.staff || []);
            setClientUsers(data.projectClients || []);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, canChangeAssignee, selectedProjectId, projectId]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || loading) return;

    try {
      setLoading(true);
      setError(null);

      const targetCol = canChangeStatus ? (columnId || columns[0]?.id) : columns[0]?.id;
      const res = await fetch(`/api/projects/${selectedProjectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          columnId: targetCol,
          priority,
          dueDate: dueDate || undefined,
          assigneeId: canChangeAssignee && assigneeId ? assigneeId : undefined,
          aiContext: {
            type: issueType,
            originalEstimate: timeEstimate.trim() ? normalizeDurationInput(timeEstimate) : undefined,
            resolution: "Не вирішено",
            components: selectedComponents,
            labels: selectedLabels,
            isClosed: false,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Не вдалося створити задачу");
        return;
      }

      const created = await res.json();
      onIssueCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || "Помилка зв'язку із сервером");
    } finally {
      setLoading(false);
    }
  };

  // 1. Projects Options
  const projectOptions: DropdownOption[] =
    allProjects.length > 0
      ? allProjects.map((p) => ({
          value: p.id,
          label: p.name,
          icon: <span className="font-mono text-primary font-bold">[{p.key}]</span>,
        }))
      : [
          {
            value: projectId,
            label: projectName,
            icon: <span className="font-mono text-primary font-bold">[{projectKey}]</span>,
          },
        ];

  // 2. Issue Type Options
  const issueTypeOptions: DropdownOption[] = [
    {
      value: "TASK",
      label: "Задача (Task)",
      icon: <CheckSquare className="w-3.5 h-3.5 text-blue-400" />,
    },
    {
      value: "BUG",
      label: "Баг (Bug)",
      icon: <Bug className="w-3.5 h-3.5 text-red-400" />,
    },
    {
      value: "STORY",
      label: "Історія (Story)",
      icon: <Bookmark className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      value: "IMPROVEMENT",
      label: "Покращення (Improvement)",
      icon: <Zap className="w-3.5 h-3.5 text-violet-400" />,
    },
    {
      value: "SUPPORT",
      label: "Підтримка (Support)",
      icon: <Wrench className="w-3.5 h-3.5 text-amber-400" />,
    },
  ];

  // 3. Status (Column) Options
  const columnOptions: DropdownOption[] = columns.map((c) => ({
    value: c.id,
    label: c.name,
    icon: (
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: c.color || "#3b82f6" }}
      />
    ),
  }));

  // 4. Priority Options
  const priorityOptions: DropdownOption[] = [
    {
      value: "LOW",
      label: "Низький",
      icon: <ArrowDown className="w-3.5 h-3.5 text-blue-400" />,
    },
    {
      value: "MEDIUM",
      label: "Середній",
      icon: <Minus className="w-3.5 h-3.5 text-muted-foreground" />,
    },
    {
      value: "HIGH",
      label: "Високий",
      icon: <ArrowUp className="w-3.5 h-3.5 text-amber-400" />,
    },
    {
      value: "URGENT",
      label: "Терміновий ⚡",
      icon: <AlertCircle className="w-3.5 h-3.5 text-red-500 font-bold" />,
    },
  ];

  // 5. Assignee Options (Filtered strictly by project)
  const assigneeOptions: DropdownOption[] = [
    {
      value: "",
      label: "Не призначено",
      icon: <User className="w-3.5 h-3.5 text-muted-foreground" />,
    },
    ...(staffUsers.length > 0
      ? [
          {
            value: "__staff_header__",
            label: `Співробітники (Підтримка/Адмін) (${staffUsers.length})`,
            isHeader: true,
          },
          ...staffUsers.map((u) => ({
            value: u.id,
            label: `${u.name} (${u.role === "ADMIN" ? "Адмін" : "Інженер"})`,
            icon: (
              <div className="w-4 h-4 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-[9px] flex-shrink-0">
                {(u.name || "U")[0].toUpperCase()}
              </div>
            ),
          })),
        ]
      : []),
    ...(clientUsers.length > 0
      ? [
          {
            value: "__clients_header__",
            label: `Клієнти цього проєкту (${clientUsers.length})`,
            isHeader: true,
          },
          ...clientUsers.map((u) => ({
            value: u.id,
            label: `${u.name} (Клієнт)`,
            icon: (
              <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center font-bold text-[9px] flex-shrink-0">
                {(u.name || "C")[0].toUpperCase()}
              </div>
            ),
          })),
        ]
      : []),
  ];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <CreateIssueFormHeader onClose={onClose} />

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Project & Issue Type Row (Custom Dark Dropdowns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomSelect
              label="Проєкт"
              required
              value={selectedProjectId}
              onChange={handleProjectChange}
              options={projectOptions}
            />

            <CustomSelect
              label="Тип задачі"
              required
              value={issueType}
              onChange={handleIssueTypeChange}
              options={issueTypeOptions}
            />
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Короткий опис (Назва) <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              placeholder="напр. Налаштувати автоматичну авторизацію"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              className="w-full text-sm py-2 px-3 rounded-lg bg-secondary/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Опис
            </label>
            <textarea
              rows={4}
              placeholder="Детальний опис задачі, очікувані результати або кроки для відтворення..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-3 rounded-lg bg-secondary/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-y"
            />
          </div>

          {/* Status & Priority Row (Custom Dark Dropdowns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {canChangeStatus ? (
              <CustomSelect
                label="Статус (Колонка)"
                value={columnId}
                onChange={(val) => setColumnId(val)}
                options={columnOptions}
              />
            ) : (
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">
                  Статус
                </label>
                <div className="w-full bg-secondary/40 border border-border/80 rounded-lg py-2 px-3 text-xs text-foreground flex items-center justify-between">
                  <span>
                    {columns.find((c) => c.id === (columnId || columns[0]?.id))?.name ||
                      columns[0]?.name ||
                      "Беклог"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">(За замовчуванням)</span>
                </div>
              </div>
            )}

            <CustomSelect
              label="Пріоритет"
              value={priority}
              onChange={(val) => setPriority(val as any)}
              options={priorityOptions}
            />
          </div>

          {/* Assignee & Due Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {canChangeAssignee ? (
              <CustomSelect
                label="Виконавець"
                value={assigneeId}
                onChange={(val) => setAssigneeId(val)}
                options={assigneeOptions}
              />
            ) : (
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Виконавець
                </label>
                <div className="w-full text-xs py-2 px-3 rounded-lg bg-secondary/30 border border-border/60 text-muted-foreground flex items-center gap-2 h-[35px]">
                  <User className="w-3.5 h-3.5" />
                  <span>Призначається підтримкою</span>
                </div>
              </div>
            )}

            {/* Due date */}
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Кінцевий термін (Due Date)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg bg-secondary/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Components & Labels Row (Strictly from Admin Dictionaries) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomMultiSelect
              label="Компоненти"
              selectedValues={selectedComponents}
              options={getAvailableComponents(selectedProjectId, issueType)}
              onChange={setSelectedComponents}
              placeholder="Оберіть компонент зі списку..."
              emptyNotice={`Немає налаштованих компонентів для проєкту та типу "${
                issueTypeOptions.find((t) => t.value === issueType)?.label || issueType
              }"`}
              badgeClass="bg-secondary text-foreground font-mono border border-border/80"
            />

            <CustomMultiSelect
              label="Мітки"
              selectedValues={selectedLabels}
              options={dictionaries.labels || []}
              onChange={setSelectedLabels}
              placeholder="Оберіть мітки зі списку..."
              emptyNotice="Немає доступних міток у довіднику"
              badgeClass="bg-primary/10 text-primary border border-primary/20"
            />
          </div>

          {/* Time Estimate (Internal for Staff) */}
          {currentUser?.role !== "CLIENT" && (
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Оцінка часу (h, d, w, m)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="напр. 4h, 1d, 1w"
                  value={timeEstimate}
                  onChange={(e) => setTimeEstimate(e.target.value)}
                  className="w-36 text-xs py-2 px-3 rounded-lg bg-secondary/40 border border-border text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex flex-wrap items-center gap-1">
                  {TIME_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTimeEstimate(preset)}
                      className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors cursor-pointer ${
                        timeEstimate === preset
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

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="px-5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Створення..." : "Створити задачу"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
