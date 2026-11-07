"use client";

import React, { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import { ProjectItem, UserItem } from "./types";

interface EditUserProjectsModalProps {
  user: UserItem | null;
  projects: ProjectItem[];
  onClose: () => void;
  onProjectsSaved: () => void;
}

export function EditUserProjectsModal({
  user,
  projects,
  onClose,
  onProjectsSaved,
}: EditUserProjectsModalProps) {
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [projectSearch, setProjectSearch] = useState("");
  const [savingProjects, setSavingProjects] = useState(false);

  useEffect(() => {
    if (user) {
      setSelectedProjectIds(user.projectMembers.map((m) => m.project.id));
      setProjectSearch("");
    }
  }, [user]);

  if (!user) return null;

  const handleSaveProjects = async () => {
    try {
      setSavingProjects(true);
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectIds: selectedProjectIds }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Не вдалося зберегти доступи");
        return;
      }

      onProjectsSaved();
      onClose();
    } catch (err: any) {
      alert(err.message || "Помилка при збереженні");
    } finally {
      setSavingProjects(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Призначення проектів
            </h2>
            <p className="text-xs text-muted-foreground">
              Для користувача: <strong className="text-foreground">{user.name}</strong> ({user.email})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground block">
              Виберіть проекти, до яких користувач матиме доступ:
            </label>
            <span className="text-[10px] text-muted-foreground">
              Обрано: <strong className="text-foreground">{selectedProjectIds.length}</strong> з {projects.length}
            </span>
          </div>

          {projects.length > 4 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Швидкий пошук за назвою чи ключем..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60"
              />
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <button
              type="button"
              onClick={() => setSelectedProjectIds(projects.map((p) => p.id))}
              className="text-primary hover:underline font-medium text-[11px] cursor-pointer"
            >
              Обрати всі ({projects.length})
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setSelectedProjectIds([])}
              className="text-muted-foreground hover:text-foreground hover:underline text-[11px] cursor-pointer"
            >
              Зняти всі
            </button>
          </div>

          <div className="space-y-1 max-h-64 overflow-y-auto p-1.5 rounded-lg bg-secondary/20 border border-border/80">
            {projects
              .filter(
                (p) =>
                  !projectSearch.trim() ||
                  p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
                  p.key.toLowerCase().includes(projectSearch.toLowerCase())
              )
              .map((p) => {
                const isChecked = selectedProjectIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-2.5 text-xs cursor-pointer p-1.5 rounded-lg transition-colors ${
                      isChecked
                        ? "bg-primary/10 border border-primary/20 text-foreground"
                        : "hover:bg-secondary/40 text-muted-foreground"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProjectIds([...selectedProjectIds, p.id]);
                        } else {
                          setSelectedProjectIds(selectedProjectIds.filter((id) => id !== p.id));
                        }
                      }}
                      className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                    <span className="font-mono text-xs font-bold text-primary">[{p.key}]</span>
                    <span className="truncate font-medium">{p.name}</span>
                  </label>
                );
              })}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            Скасувати
          </button>
          <button
            type="button"
            onClick={handleSaveProjects}
            disabled={savingProjects}
            className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {savingProjects ? "Збереження..." : "Зберегти доступи"}
          </button>
        </div>
      </div>
    </div>
  );
}
