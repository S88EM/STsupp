"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Bug,
  CheckSquare,
  Bookmark,
  Zap,
  Wrench,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Paperclip,
  Calendar,
  User,
  Layers,
  ChevronDown,
  Check,
} from "lucide-react";
import { ColumnItem } from "@/components/board/ColumnCard";

interface JiraCreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName?: string;
  projectKey?: string;
  columns: ColumnItem[];
  allProjects?: Array<{ id: string; name: string; key: string }>;
  currentUser?: any;
  onIssueCreated: (createdTask: any) => void;
}

interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  isHeader?: boolean;
}

interface CustomSelectProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (val: string) => void;
  options: DropdownOption[];
  placeholder?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  required = false,
  value,
  onChange,
  options,
  placeholder = "Оберіть зі списку...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <label className="text-xs font-medium text-foreground block mb-1">
        {label} {required && <span className="text-destructive">*</span>}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-xs py-2 px-3 rounded-lg bg-secondary/40 hover:bg-secondary/60 border border-border text-foreground font-medium flex items-center justify-between transition-colors focus:outline-none focus:ring-1 focus:ring-primary select-none cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate pr-1">
          {selectedOption?.icon}
          <span className="truncate">{selectedOption?.label || placeholder}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground flex-shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl bg-card border border-border shadow-2xl p-1 z-50 max-h-56 overflow-y-auto animate-in fade-in-50 zoom-in-95">
          {options.map((opt, idx) => {
            if (opt.isHeader) {
              return (
                <div
                  key={`header-${idx}`}
                  className="px-2.5 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-secondary/30 rounded mt-1.5 first:mt-0 select-none"
                >
                  {opt.label}
                </div>
              );
            }
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                  isSelected
                    ? "bg-primary/15 text-primary font-semibold"
                    : "text-foreground hover:bg-secondary/70"
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  {opt.icon}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

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
  const [storyPoints, setStoryPoints] = useState<number>(3);
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [clientUsers, setClientUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canChangeAssignee = Boolean(
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
      setStoryPoints(3);
      setAssigneeId("");
      setError(null);
    }
  }, [isOpen, projectId, columns]);

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

      const targetCol = columnId || columns[0]?.id;
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
            storyPoints: Number(storyPoints) || 0,
            sprint: "Спринт 1",
            resolution: "Не вирішено",
            components: ["Core"],
            labels: [issueType.toLowerCase()],
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
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">
                Створення задачі
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Введіть інформацію про задачу, оберіть тип та виконавця
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

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
              onChange={(val) => setSelectedProjectId(val)}
              options={projectOptions}
            />

            <CustomSelect
              label="Тип задачі"
              required
              value={issueType}
              onChange={(val) => setIssueType(val)}
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
            <CustomSelect
              label="Статус (Колонка)"
              value={columnId}
              onChange={(val) => setColumnId(val)}
              options={columnOptions}
            />

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

          {/* Story Points */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Story Points (Складність)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={storyPoints}
              onChange={(e) => setStoryPoints(parseInt(e.target.value) || 0)}
              className="w-28 text-xs py-2 px-3 rounded-lg bg-secondary/40 border border-border text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

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
