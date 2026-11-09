"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, FolderPlus, Sparkles, AlertCircle, Users, Check, Shield } from "lucide-react";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated?: (project: any) => void;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onProjectCreated,
}: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setKey("");
      setDescription("");
      setKeyManuallyEdited(false);
      setSelectedUserIds([]);
      setError(null);

      // Fetch users for member assignment
      setLoadingUsers(true);
      Promise.all([
        fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/users").then((r) => (r.ok ? r.json() : [])),
      ])
        .then(([meData, data]) => {
          if (Array.isArray(data)) {
            const currentUserId = meData?.user?.id || meData?.user?.userId;
            // Exclude current creator (already automatically owner/admin)
            setAvailableUsers(
              data.filter((u: any) => u.id !== currentUserId)
            );
          }
        })
        .catch(() => {})
        .finally(() => setLoadingUsers(false));
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);

    if (!keyManuallyEdited) {
      const trimmed = val.trim();
      if (!trimmed) {
        setKey("");
        return;
      }
      const words = trimmed.split(/[\s_-]+/).filter(Boolean);
      let generated = "";
      if (words.length > 1) {
        generated = words.map((w) => w[0]).join("");
      } else {
        generated = words[0].slice(0, 4);
      }
      setKey(generated.toUpperCase().replace(/[^A-Z0-9]/g, ""));
    }
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyManuallyEdited(true);
    setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim() || submitting) return;

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          key: key.trim().toUpperCase(),
          description: description.trim() || undefined,
          memberIds: selectedUserIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не вдалося створити проект");
        return;
      }

      if (onProjectCreated) {
        onProjectCreated(data);
      }

      onClose();
      // Navigate to the newly created project
      window.location.href = `/projects/${data.id}`;
    } catch (err: any) {
      setError(err.message || "Помилка зв'язку із сервером");
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Адміністратор
          </span>
        );
      case "ENGINEER":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Інженер
          </span>
        );
      case "CLIENT":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Клієнт
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-muted-foreground border border-border">
            {role}
          </span>
        );
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">
                Створення нового проекту
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Введіть параметри проекту та оберіть команду
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

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Назва проекту <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              placeholder="напр. Розробка клієнтського порталу"
              value={name}
              onChange={handleNameChange}
              required
              autoFocus
              className="w-full text-xs px-3 py-2.5 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-foreground">
                Ключ проекту (префікс задач) <span className="text-destructive">*</span>
              </label>
              <span className="text-[10px] text-muted-foreground">
                Задачі матимуть вигляд: {key || "KEY"}-1, {key || "KEY"}-2
              </span>
            </div>
            <input
              type="text"
              placeholder="напр. PORTAL, CRM, APP"
              value={key}
              onChange={handleKeyChange}
              required
              maxLength={10}
              className="w-full text-xs px-3 py-2.5 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary font-mono font-semibold tracking-wider text-foreground placeholder:text-muted-foreground/60 uppercase"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">
              Опис проекту <span className="text-muted-foreground font-normal">(необов&apos;язково)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Короткий опис цілей та завдань проекту..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60 resize-none"
            />
          </div>

          {/* Members assignment */}
          <div>
            <div className="flex items-center justify-between mb-2 pt-1 border-t border-border">
              <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Надати доступ команді</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Обрано: {selectedUserIds.length}
              </span>
            </div>

            {loadingUsers ? (
              <div className="text-[11px] text-muted-foreground py-2 text-center">
                Завантаження користувачів...
              </div>
            ) : availableUsers.length === 0 ? (
              <div className="text-[11px] text-muted-foreground py-2 px-3 bg-secondary/20 rounded-lg border border-border/50 text-center">
                Немає зареєстрованих інженерів або клієнтів (адміністратори мають доступ за замовчуванням).
              </div>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1 rounded-lg border border-border/70 p-1.5 bg-secondary/20">
                {availableUsers.map((u) => {
                  const isChecked = selectedUserIds.includes(u.id);
                  return (
                    <label
                      key={u.id}
                      onClick={() => toggleUser(u.id)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-primary/10 border border-primary/20 text-foreground"
                          : "hover:bg-secondary/60 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                            isChecked
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border bg-card"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="font-medium text-foreground truncate">
                          {u.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          ({u.email})
                        </span>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        {getRoleBadge(u.role)}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !key.trim() || submitting}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none rounded-lg shadow-sm shadow-primary/20 transition-all hover:shadow"
            >
              <FolderPlus className="w-4 h-4" />
              <span>{submitting ? "Створення..." : "Створити проект"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
