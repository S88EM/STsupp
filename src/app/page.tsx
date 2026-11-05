"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, FolderGit2, CheckCircle2, ArrowRight, Layers, Sparkles } from "lucide-react";

export default function HomePage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        // If there's already a project, navigate directly to it
        if (data.length > 0) {
          window.location.href = `/projects/${data[0].id}`;
          return;
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;

    try {
      setError(null);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, key, description }),
      });

      if (res.ok) {
        const project = await res.json();
        window.location.href = `/projects/${project.id}`;
      } else {
        const data = await res.json();
        setError(data.error || "Не вдалося створити проект");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

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
          <p className="text-sm text-muted-foreground">
            Швидкий self-hosted трекер завдань із гнучкими воркфлоу та підтримкою AI Confluence
          </p>
        </div>

        {/* Create Project Card */}
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
                  // Auto-generate key if empty
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
              className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Створити проект та відкрити дошку</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
