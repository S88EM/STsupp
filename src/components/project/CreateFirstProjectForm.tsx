"use client";

import React, { useState, useEffect } from "react";
import { Plus, ArrowRight, Clock, LogOut } from "lucide-react";

interface CreateFirstProjectFormProps {
  currentUser: {
    userId: string;
    name: string;
    email: string;
    role: string;
  };
}

export function CreateFirstProjectForm({ currentUser }: CreateFirstProjectFormProps) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Reload if restored from bfcache
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", handlePageShow);

    // Client-side safety: if projects already exist, instantly redirect away
    fetch("/api/projects")
      .then((res) => (res.ok ? res.json() : []))
      .then((projects) => {
        if (Array.isArray(projects) && projects.length > 0) {
          window.location.replace(`/projects/${projects[0].id}`);
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim() || loading) return;

    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, key, description }),
      });

      if (res.ok) {
        const project = await res.json();
        window.location.replace(`/projects/${project.id}`);
      } else {
        const data = await res.json();
        setError(data.error || "Не вдалося створити проект");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const isAdmin = currentUser.role === "ADMIN";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-blue-500/25 mx-auto">
            ST
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Ласкаво просимо до STsup
          </h1>
          <p className="text-xs text-muted-foreground">
            Швидкий self-hosted трекер завдань із гнучкими воркфлоу та ролями
          </p>
        </div>

        {/* If user is Admin, show Project Creation */}
        {isAdmin ? (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground pb-2 border-b border-border">
              <Plus className="w-4 h-4 text-primary" />
              <span>Створити перший проект</span>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Назва проекту
                </label>
                <input
                  type="text"
                  placeholder="напр. Розробка сервісу підтримки"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!key && e.target.value.trim()) {
                      const words = e.target.value.trim().split(" ");
                      const generatedKey = words
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase()
                        .substring(0, 4);
                      setKey(generatedKey || "ST");
                    }
                  }}
                  required
                  className="w-full text-xs bg-secondary/40 border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Ключ проекту (префікс задач)
                </label>
                <input
                  type="text"
                  placeholder="напр. ST, SUP, DEV"
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  maxLength={6}
                  required
                  className="w-full text-xs font-mono bg-secondary/40 border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary text-foreground uppercase"
                />
                <span className="text-[10px] text-muted-foreground block mt-1">
                  Задачі будуть мати вигляд: {key || "KEY"}-1, {key || "KEY"}-2
                </span>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Опис (опціонально)
                </label>
                <textarea
                  placeholder="Короткий опис цілей проекту..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full text-xs bg-secondary/40 border border-border rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary text-foreground resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? "Створення..." : "Створити проект та відкрити дошку"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        ) : (
          /* Non-Admin Client / Engineer without assigned projects */
          <div className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-4 text-center">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-foreground">
              Очікування призначення проекту
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ваш обліковий запис <strong>{currentUser.name}</strong> успішно активовано. Зверніться до адміністратора для надання доступу до вашого проекту.
            </p>
            <div className="pt-2">
              <button
                onClick={handleLogout}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Вийти з облікового запису</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
