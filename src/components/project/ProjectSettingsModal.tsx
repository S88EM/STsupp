"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Settings,
  Trash2,
  AlertTriangle,
  Check,
  FolderGit2,
  Layers,
  FileText,
  Users,
  AlertCircle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

interface ProjectItem {
  id: string;
  name: string;
  key: string;
  description?: string | null;
  createdAt?: string;
  _count?: {
    tasks?: number;
    members?: number;
  };
}

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectItem | null;
  allProjects?: ProjectItem[];
  onProjectUpdated?: (updated: ProjectItem) => void;
  onProjectDeleted?: (deletedId: string) => void;
}

export function ProjectSettingsModal({
  isOpen,
  onClose,
  project,
  allProjects = [],
  onProjectUpdated,
  onProjectDeleted,
}: ProjectSettingsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [currentSelectedProject, setCurrentSelectedProject] = useState<ProjectItem | null>(null);

  // Edit form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete confirmation state
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmKey, setDeleteConfirmKey] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const activeProj = project || allProjects[0] || null;
      if (activeProj) {
        setSelectedProjectId(activeProj.id);
        setCurrentSelectedProject(activeProj);
        setName(activeProj.name || "");
        setDescription(activeProj.description || "");
      }
      setError(null);
      setDeleteError(null);
      setSaveSuccess(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmKey("");
    }
  }, [isOpen, project]);

  const handleSelectProject = (projId: string) => {
    setSelectedProjectId(projId);
    const found = allProjects.find((p) => p.id === projId) || null;
    setCurrentSelectedProject(found);
    if (found) {
      setName(found.name || "");
      setDescription(found.description || "");
    }
    setError(null);
    setDeleteError(null);
    setSaveSuccess(false);
    setShowDeleteConfirm(false);
    setDeleteConfirmKey("");
  };

  if (!isOpen || !mounted || !currentSelectedProject) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;

    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);

      const res = await fetch(`/api/projects/${currentSelectedProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не вдалося оновити проект");
        return;
      }

      setSaveSuccess(true);
      setCurrentSelectedProject({
        ...currentSelectedProject,
        name: data.name,
        description: data.description,
      });

      if (onProjectUpdated) {
        onProjectUpdated(data);
      }

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Помилка зв'язку із сервером");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmKey.trim().toUpperCase() !== currentSelectedProject.key.toUpperCase()) {
      setDeleteError(`Введіть точний ключ "${currentSelectedProject.key}" для підтвердження`);
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);

      const res = await fetch(`/api/projects/${currentSelectedProject.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || "Не вдалося видалити проект");
        return;
      }

      if (onProjectDeleted) {
        onProjectDeleted(currentSelectedProject.id);
      }

      onClose();

      // Determine fallback destination
      const remainingProjects = allProjects.filter((p) => p.id !== currentSelectedProject.id);
      if (remainingProjects.length > 0) {
        window.location.replace(`/projects/${remainingProjects[0].id}`);
      } else {
        window.location.replace("/");
      }
    } catch (err: any) {
      setDeleteError(err.message || "Помилка видалення проекту");
    } finally {
      setIsDeleting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-foreground">
                  Налаштування проєкту
                </h3>
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/25 font-bold">
                  [{currentSelectedProject.key}]
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Керування життєвим циклом, назвою, описом та видаленням проєкту
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Project Switcher if multiple projects */}
          {allProjects.length > 1 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Обраний проєкт для налаштування:
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => handleSelectProject(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-lg bg-secondary/50 border border-border text-foreground font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {allProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.key}] {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Success / Error Messages */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2 animate-in fade-in-50">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>Зміни проєкту успішно збережено!</span>
            </div>
          )}

          {/* Edit Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Назва проєкту <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full text-xs px-3 py-2.5 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-foreground">
                  Ключ проєкту (префікс задач)
                </label>
                <span className="text-[10px] text-muted-foreground">
                  Задачі: {currentSelectedProject.key}-1, {currentSelectedProject.key}-2
                </span>
              </div>
              <input
                type="text"
                value={currentSelectedProject.key}
                disabled
                className="w-full text-xs px-3 py-2 rounded-lg bg-secondary/20 border border-border/60 font-mono font-semibold tracking-wider text-muted-foreground opacity-75 cursor-not-allowed uppercase"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Ключ проєкту зафіксовано для забезпечення цілісності номерів задач та посилань.
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Опис проєкту
              </label>
              <textarea
                rows={3}
                placeholder="Короткий опис цілей, задач або специфіки проєкту..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60 resize-none"
              />
            </div>

            <div className="flex items-center justify-end pt-1">
              <button
                type="submit"
                disabled={!name.trim() || saving}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none rounded-lg shadow-sm shadow-primary/20 transition-all hover:shadow"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{saving ? "Збереження..." : "Зберегти зміни"}</span>
              </button>
            </div>
          </form>

          {/* DANGER ZONE: Delete Project */}
          <div className="pt-4 border-t border-destructive/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <span>Небезпечна зона (Видалення проєкту)</span>
            </div>

            <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Видалення проєкту призведе до **незворотного видалення** всіх пов'язаних задач, колонок дошки, коментарів, файлів та налаштувань команди.
              </p>

              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-destructive bg-destructive/10 hover:bg-destructive hover:text-destructive-foreground border border-destructive/30 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Видалити проєкт [{currentSelectedProject.key}]...</span>
                </button>
              ) : (
                <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/30 space-y-3 animate-in fade-in-50">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-destructive">
                      Підтвердження незворотного видалення
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Щоб підтвердити видалення проєкту <strong>"{currentSelectedProject.name}"</strong>, введіть його ключ{" "}
                      <strong className="text-foreground font-mono">[{currentSelectedProject.key}]</strong>:
                    </p>
                  </div>

                  {deleteError && (
                    <div className="p-2 rounded bg-destructive/20 text-destructive text-[11px] font-medium">
                      {deleteError}
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder={`Введіть ${currentSelectedProject.key}`}
                    value={deleteConfirmKey}
                    onChange={(e) => setDeleteConfirmKey(e.target.value)}
                    autoFocus
                    className="w-full text-xs px-3 py-2 rounded-lg bg-card border border-destructive/40 font-mono font-bold uppercase text-foreground focus:outline-none focus:ring-1 focus:ring-destructive placeholder:text-muted-foreground/50"
                  />

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmKey("");
                        setDeleteError(null);
                      }}
                      disabled={isDeleting}
                      className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
                    >
                      Скасувати
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={
                        deleteConfirmKey.trim().toUpperCase() !== currentSelectedProject.key.toUpperCase() ||
                        isDeleting
                      }
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-semibold shadow-sm transition-all disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isDeleting ? "Видалення..." : "Я розумію наслідки, видалити"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-border flex items-center justify-between bg-secondary/20">
          <span className="text-[11px] text-muted-foreground font-mono">
            ID: {currentSelectedProject.id}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
