"use client";

import React, { useState } from "react";
import { UserPlus, X, Check, Search } from "lucide-react";
import { ProjectItem, UserRole } from "./types";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectItem[];
  onUserCreated: () => void;
}

export function CreateUserModal({
  isOpen,
  onClose,
  projects,
  onUserCreated,
}: CreateUserModalProps) {
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createCity, setCreateCity] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<UserRole>("CLIENT");
  const [createProjectIds, setCreateProjectIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createProjectSearch, setCreateProjectSearch] = useState("");

  if (!isOpen) return null;

  const resetForm = () => {
    setCreateName("");
    setCreateEmail("");
    setCreateCity("");
    setCreatePassword("");
    setCreateRole("CLIENT");
    setCreateProjectIds([]);
    setCreateProjectSearch("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim() || !createEmail.trim() || !createCity.trim() || !createPassword) return;

    try {
      setCreating(true);
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName.trim(),
          email: createEmail.trim(),
          city: createCity.trim(),
          password: createPassword,
          role: createRole,
          projectIds: createProjectIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Не вдалося створити користувача");
        return;
      }

      resetForm();
      onUserCreated();
      onClose();
    } catch (err: any) {
      alert(err.message || "Помилка створення користувача");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            <span>Створити нового користувача</span>
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] flex items-center gap-2">
            <Check className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              Акаунт активується автоматично — користувачу не потрібне підтвердження пошти.
            </span>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Повне ім&apos;я
            </label>
            <input
              type="text"
              placeholder="Олександр Коваль"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              required
              autoFocus
              className="w-full text-xs py-2 px-3 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Email адреса
            </label>
            <input
              type="email"
              placeholder="user@company.com"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              required
              className="w-full text-xs py-2 px-3 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Місто <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              placeholder="напр. Вінниця, Київ, Львів"
              value={createCity}
              onChange={(e) => setCreateCity(e.target.value)}
              required
              className="w-full text-xs py-2 px-3 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Початковий пароль (мінімум 6 символів)
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
              required
              className="w-full text-xs py-2 px-3 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Призначена роль
            </label>
            <select
              value={createRole}
              onChange={(e) => setCreateRole(e.target.value as UserRole)}
              className="w-full text-xs py-2 px-3 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground cursor-pointer"
            >
              <option value="CLIENT">Клієнт (створення задач, додавання матеріалів)</option>
              <option value="ENGINEER">Інженер (виконання задач, зміна статусів, коментарі)</option>
              <option value="ADMIN">Адміністратор (повний доступ до всіх модулів, проєктів та налаштувань)</option>
            </select>
          </div>

          {/* Projects Assignment for roles */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground block">
                Дозволити доступ до проєктів:
              </label>
              <span className="text-[10px] text-muted-foreground">
                Обрано: <strong className="text-foreground">{createProjectIds.length}</strong> з {projects.length}
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground">
              {createRole === "ADMIN"
                ? "⚡ Адміністратор автоматично отримує повний глобальний доступ до всіх проєктів системи."
                : createRole === "ENGINEER"
                ? "Інженер зможе переглядати дошку, брати задачі в роботу та додавати коментарі в обраних проєктах."
                : "Клієнт зможе створювати задачі та відстежувати їх виконання в обраних проєктах."}
            </p>

            {projects.length > 4 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Швидкий пошук проєктів..."
                  value={createProjectSearch}
                  onChange={(e) => setCreateProjectSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60"
                />
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <button
                type="button"
                onClick={() => setCreateProjectIds(projects.map((p) => p.id))}
                className="text-primary hover:underline cursor-pointer"
              >
                Обрати всі ({projects.length})
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setCreateProjectIds([])}
                className="text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
              >
                Зняти всі
              </button>
            </div>

            <div className="space-y-1 max-h-40 overflow-y-auto p-1.5 rounded-lg bg-secondary/20 border border-border/80">
              {projects
                .filter(
                  (p) =>
                    !createProjectSearch.trim() ||
                    p.name.toLowerCase().includes(createProjectSearch.toLowerCase()) ||
                    p.key.toLowerCase().includes(createProjectSearch.toLowerCase())
                )
                .map((p) => {
                  const isChecked = createProjectIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center gap-2 text-xs p-1.5 rounded cursor-pointer transition-colors ${
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
                            setCreateProjectIds([...createProjectIds, p.id]);
                          } else {
                            setCreateProjectIds(createProjectIds.filter((id) => id !== p.id));
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
              onClick={handleClose}
              className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {creating ? "Створення..." : "Створити користувача"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
