"use client";

import React, { useState, useEffect } from "react";
import {
  Tag,
  CheckSquare,
  Bug,
  Bookmark,
  Zap,
  Wrench,
  FolderGit2,
  RotateCcw,
  RefreshCw,
  Save,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { ProjectDictOption } from "./types";

const TASK_TYPE_TABS = [
  { id: "TASK", label: "Задача", icon: CheckSquare, color: "text-blue-400" },
  { id: "BUG", label: "Баг", icon: Bug, color: "text-red-400" },
  { id: "STORY", label: "Історія", icon: Bookmark, color: "text-emerald-400" },
  { id: "IMPROVEMENT", label: "Покращення", icon: Zap, color: "text-violet-400" },
  { id: "SUPPORT", label: "Підтримка", icon: Wrench, color: "text-amber-400" },
];

export function DictionariesSettingsTab() {
  const [projects, setProjects] = useState<ProjectDictOption[]>([]);
  const [selectedProjectForDict, setSelectedProjectForDict] = useState<string>("");
  const [componentsByType, setComponentsByType] = useState<Record<string, string[]>>({});
  const [componentsByProject, setComponentsByProject] = useState<Record<string, Record<string, string[]>>>({});
  const [renames, setRenames] = useState<Array<{ projectId?: string; oldName: string; newName: string }>>([]);
  const [editingComponent, setEditingComponent] = useState<{ originalName: string; currentName: string } | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [activeTaskType, setActiveTaskType] = useState<string>("TASK");
  const [newComponentInput, setNewComponentInput] = useState("");
  const [newLabelInput, setNewLabelInput] = useState("");
  const [dictSaving, setDictSaving] = useState(false);
  const [dictSuccess, setDictSuccess] = useState<string | null>(null);
  const [dictError, setDictError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDictData = async () => {
      try {
        const res = await fetch("/api/settings/dictionaries");
        if (res.ok) {
          const dictData = await res.json();
          setComponentsByType(dictData.componentsByType || {});
          setComponentsByProject(dictData.componentsByProject || {});
          setLabels(dictData.labels || []);
          if (Array.isArray(dictData.projects) && dictData.projects.length > 0) {
            setProjects(dictData.projects);
            setSelectedProjectForDict(dictData.projects[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load dictionaries:", err);
      }
    };

    fetchDictData();
  }, []);

  const getActiveComponents = (typeId = activeTaskType): string[] => {
    if (selectedProjectForDict && componentsByProject[selectedProjectForDict]?.[typeId] !== undefined) {
      return componentsByProject[selectedProjectForDict][typeId];
    }
    return componentsByType[typeId] || [];
  };

  const handleAddComponent = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = newComponentInput.trim();
    if (!val) return;

    const currentComps = getActiveComponents(activeTaskType);
    if (currentComps.includes(val)) {
      alert(`Компонент "${val}" вже є у списку для цього типу задачі та проєкту.`);
      return;
    }

    if (selectedProjectForDict) {
      setComponentsByProject((prev) => ({
        ...prev,
        [selectedProjectForDict]: {
          ...(prev[selectedProjectForDict] || {}),
          [activeTaskType]: [...currentComps, val],
        },
      }));
    } else {
      setComponentsByType((prev) => ({
        ...prev,
        [activeTaskType]: [...currentComps, val],
      }));
    }
    setNewComponentInput("");
  };

  const handleRemoveComponent = (compToRemove: string) => {
    const currentComps = getActiveComponents(activeTaskType);
    const updated = currentComps.filter((c) => c !== compToRemove);

    if (selectedProjectForDict) {
      setComponentsByProject((prev) => ({
        ...prev,
        [selectedProjectForDict]: {
          ...(prev[selectedProjectForDict] || {}),
          [activeTaskType]: updated,
        },
      }));
    } else {
      setComponentsByType((prev) => ({
        ...prev,
        [activeTaskType]: updated,
      }));
    }
    if (editingComponent?.originalName === compToRemove) {
      setEditingComponent(null);
    }
  };

  const handleSaveEditComponent = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingComponent) return;

    const original = editingComponent.originalName;
    const updated = editingComponent.currentName.trim();

    if (!updated) {
      alert("Назва компонента не може бути порожньою.");
      return;
    }

    const currentComps = getActiveComponents(activeTaskType);
    if (updated !== original && currentComps.includes(updated)) {
      alert(`Компонент з назвою "${updated}" вже існує в цьому типі задачі.`);
      return;
    }

    if (updated !== original) {
      const newCompsList = currentComps.map((c) => (c === original ? updated : c));

      if (selectedProjectForDict) {
        setComponentsByProject((prev) => ({
          ...prev,
          [selectedProjectForDict]: {
            ...(prev[selectedProjectForDict] || {}),
            [activeTaskType]: newCompsList,
          },
        }));
        // Track rename to update tasks on save
        setRenames((prev) => [
          ...prev.filter((r) => !(r.projectId === selectedProjectForDict && r.oldName === original)),
          { projectId: selectedProjectForDict, oldName: original, newName: updated },
        ]);
      } else {
        setComponentsByType((prev) => ({
          ...prev,
          [activeTaskType]: newCompsList,
        }));
        setRenames((prev) => [
          ...prev.filter((r) => !r.projectId && r.oldName === original),
          { oldName: original, newName: updated },
        ]);
      }
    }

    setEditingComponent(null);
  };

  const handleAddLabel = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = newLabelInput.trim();
    if (!val) return;

    if (labels.includes(val)) {
      alert(`Мітка "${val}" вже є у довіднику.`);
      return;
    }

    setLabels((prev) => [...prev, val]);
    setNewLabelInput("");
  };

  const handleRemoveLabel = (lblToRemove: string) => {
    setLabels((prev) => prev.filter((l) => l !== lblToRemove));
  };

  const handleSaveDictionaries = async () => {
    try {
      setDictSaving(true);
      setDictSuccess(null);
      setDictError(null);

      const res = await fetch("/api/settings/dictionaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componentsByType,
          componentsByProject,
          labels,
          renames,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setDictError(data.error || "Не вдалося зберегти довідники");
      } else {
        setRenames([]);
        setDictSuccess(data.message || "Довідники компонентів та міток успішно збережено!");
        setTimeout(() => setDictSuccess(null), 4000);
      }
    } catch (err: any) {
      setDictError(err.message || "Помилка зв'язку із сервером");
    } finally {
      setDictSaving(false);
    }
  };

  const handleResetDictionaries = async () => {
    if (!confirm("Ви впевнені, що бажаєте скинути списки компонентів та міток до стандартних значень системи?")) {
      return;
    }

    try {
      setDictSaving(true);
      setDictSuccess(null);
      setDictError(null);

      const res = await fetch("/api/settings/dictionaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        setDictError(data.error || "Не вдалося скинути довідники");
      } else {
        setComponentsByType(data.dictionaries?.componentsByType || {});
        setComponentsByProject(data.dictionaries?.componentsByProject || {});
        setLabels(data.dictionaries?.labels || []);
        setRenames([]);
        setDictSuccess("Довідники успішно скинуто до початкових стандартних значень!");
        setTimeout(() => setDictSuccess(null), 4000);
      }
    } catch (err: any) {
      setDictError(err.message || "Помилка зв'язку із сервером");
    } finally {
      setDictSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Alerts */}
      {dictSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{dictSuccess}</span>
        </div>
      )}
      {dictError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{dictError}</span>
        </div>
      )}

      {/* Top Actions & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            <span>Керування довідниками для задач</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Задайте фіксований перелік компонентів для кожного типу задачі та список глобальних міток. Клієнти зможуть обирати значення лише із цих списків без можливості вільного вводу.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleResetDictionaries}
            disabled={dictSaving}
            className="px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Скинути до стандартних значень"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>За замовчуванням</span>
          </button>
          <button
            type="button"
            onClick={handleSaveDictionaries}
            disabled={dictSaving}
            className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {dictSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Збереження...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Зберегти довідники</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: Components by Task Type (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border bg-secondary/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-border/60">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-400" />
                  <span>Компоненти за типами задач</span>
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Оберіть проєкт та тип задачі для налаштування доступних компонентів
                </p>
              </div>

              {/* Project Selector */}
              {projects.length > 0 && (
                <div className="flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <select
                    value={selectedProjectForDict}
                    onChange={(e) => {
                      setSelectedProjectForDict(e.target.value);
                      setEditingComponent(null);
                    }}
                    className="text-xs py-1.5 px-2.5 rounded-lg bg-secondary/80 hover:bg-secondary border border-border text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer max-w-[220px] truncate"
                    title="Оберіть проєкт для налаштування компонентів"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        [{p.key}] {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Task Type Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {TASK_TYPE_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTaskType === tab.id;
                const count = getActiveComponents(tab.id).length;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTaskType(tab.id);
                      setEditingComponent(null);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-secondary text-foreground border border-border shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/40 border border-transparent"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
                    <span>{tab.label}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-background border border-border/80">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            {/* Components List for active type */}
            <div>
              <span className="text-xs font-semibold text-foreground block mb-2">
                Доступні компоненти для типу «
                {TASK_TYPE_TABS.find((t) => t.id === activeTaskType)?.label || activeTaskType}»
                {projects.find((p) => p.id === selectedProjectForDict) && (
                  <span className="text-primary font-mono ml-1.5">
                    [{projects.find((p) => p.id === selectedProjectForDict)?.key}]
                  </span>
                )}:
              </span>

              {getActiveComponents(activeTaskType).length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                  Для цього типу задачі ще не задано жодного компонента.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {getActiveComponents(activeTaskType).map((comp) => {
                    const isEditingThis = editingComponent?.originalName === comp;
                    if (isEditingThis) {
                      return (
                        <form
                          key={`edit-${comp}`}
                          onSubmit={handleSaveEditComponent}
                          className="inline-flex items-center gap-1 bg-secondary/90 px-2 py-1 rounded-lg border border-primary/50 shadow-xs"
                        >
                          <input
                            type="text"
                            autoFocus
                            value={editingComponent.currentName}
                            onChange={(e) =>
                              setEditingComponent({
                                ...editingComponent,
                                currentName: e.target.value,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Escape") setEditingComponent(null);
                            }}
                            className="text-xs font-mono py-0.5 px-1.5 bg-background text-foreground rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary w-28 sm:w-36"
                            placeholder="Нова назва..."
                          />
                          <button
                            type="submit"
                            className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                            title="Зберегти змінену назву"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingComponent(null)}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title="Скасувати"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      );
                    }

                    return (
                      <span
                        key={comp}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary text-xs font-mono text-foreground border border-border group"
                      >
                        <span>{comp}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingComponent({ originalName: comp, currentName: comp })
                          }
                          className="text-muted-foreground hover:text-primary transition-colors ml-1 cursor-pointer opacity-80 hover:opacity-100"
                          title="Редагувати назву компонента"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveComponent(comp)}
                          className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer opacity-80 hover:opacity-100"
                          title="Видалити компонент"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add Component Form */}
            <form onSubmit={handleAddComponent} className="pt-4 border-t border-border flex items-center gap-2">
              <input
                type="text"
                placeholder={`Новий компонент для ${TASK_TYPE_TABS.find((t) => t.id === activeTaskType)?.label || activeTaskType}...`}
                value={newComponentInput}
                onChange={(e) => setNewComponentInput(e.target.value)}
                className="flex-1 text-xs py-2 px-3 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
              <button
                type="submit"
                disabled={!newComponentInput.trim()}
                className="px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Додати</span>
              </button>
            </form>
          </div>
        </div>

        {/* Card 2: Global Labels (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-border bg-secondary/30">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                <span>Довідник міток (Labels)</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                {labels.length} міток
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Фіксований список міток, доступних для вибору користувачами в задачах
            </p>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            {/* Labels List */}
            <div>
              {labels.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                  У довіднику ще немає жодної мітки.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {labels.map((lbl) => (
                    <span
                      key={lbl}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium border border-primary/20"
                    >
                      <span>{lbl}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLabel(lbl)}
                        className="text-primary/70 hover:text-destructive transition-colors ml-0.5 cursor-pointer"
                        title="Видалити мітку"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Add Label Form */}
            <form onSubmit={handleAddLabel} className="pt-4 border-t border-border flex items-center gap-2">
              <input
                type="text"
                placeholder="Нова мітка (наприклад: urgent, frontend)..."
                value={newLabelInput}
                onChange={(e) => setNewLabelInput(e.target.value)}
                className="flex-1 text-xs py-2 px-3 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
              <button
                type="submit"
                disabled={!newLabelInput.trim()}
                className="px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Додати</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
