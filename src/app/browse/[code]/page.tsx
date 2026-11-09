"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ShieldAlert,
  ArrowLeft,
  Home,
  Loader2,
  FolderKanban,
  CheckSquare,
} from "lucide-react";
import { normalizeTaskCode } from "@/lib/taskUrl";

interface TaskResponse {
  task?: {
    id: string;
    code: string;
    title: string;
    projectId: string;
    projectKey: string;
    projectName: string;
  };
  userRole?: string;
  error?: string;
}

export default function BrowseTaskPage() {
  const params = useParams();
  const router = useRouter();
  const rawCode = params?.code as string;
  const taskCode = normalizeTaskCode(rawCode);

  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [projectKey, setProjectKey] = useState<string>("");

  useEffect(() => {
    if (!taskCode) {
      setLoading(false);
      setErrorStatus(400);
      setErrorMessage("Код задачі не вказано");
      return;
    }

    let isMounted = true;

    async function resolveTask() {
      try {
        setLoading(true);
        const res = await fetch(`/api/tasks/by-code/${encodeURIComponent(taskCode)}`);

        if (!isMounted) return;

        if (res.status === 401) {
          // Unauthenticated -> redirect to login with callbackUrl
          const callbackUrl = encodeURIComponent(`/browse/${taskCode}`);
          router.replace(`/login?callbackUrl=${callbackUrl}`);
          return;
        }

        if (res.status === 403) {
          const data: TaskResponse = await res.json().catch(() => ({}));
          setErrorStatus(403);
          setErrorMessage(data.error || "У вас немає прав для перегляду цієї задачі.");
          setProjectKey(data.task?.projectKey || taskCode.split("-")[0] || "");
          setLoading(false);
          return;
        }

        if (res.status === 404) {
          const data: TaskResponse = await res.json().catch(() => ({}));
          setErrorStatus(404);
          setErrorMessage(data.error || `Задачу ${taskCode} не знайдено.`);
          setLoading(false);
          return;
        }

        if (res.ok) {
          const data: TaskResponse = await res.json();
          if (data.task) {
            // Role-based routing: Clients use /portal, staff use 3-panel Jira /projects/[id]
            if (data.userRole === "CLIENT") {
              router.replace(
                `/portal?ticketId=${data.task.id}&projectId=${data.task.projectId}`
              );
            } else {
              router.replace(
                `/projects/${data.task.projectId}?taskId=${data.task.id}&section=issues`
              );
            }
            return;
          }
        }

        // Other errors
        const errData = await res.json().catch(() => ({}));
        setErrorStatus(res.status || 500);
        setErrorMessage(errData.error || "Не вдалося отримати дані задачі");
      } catch (err: any) {
        if (!isMounted) return;
        setErrorStatus(500);
        setErrorMessage(err.message || "Помилка зв'язку із сервером");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    resolveTask();

    return () => {
      isMounted = false;
    };
  }, [taskCode, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center animate-in fade-in duration-200">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-foreground">
              Пошук задачі <span className="font-mono text-primary font-bold">{taskCode || "..."}</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Перевірка прав доступу та відкриття контексту проєкту...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 403 Forbidden Error Screen
  if (errorStatus === 403) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-xl p-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <div className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              403 Forbidden
            </div>
            <h1 className="text-lg font-bold text-foreground">Доступ обмежено</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {errorMessage || `У вас немає прав для перегляду задачі ${taskCode}.`}
              {projectKey && (
                <span className="block mt-1 font-medium text-foreground/80">
                  Зверніться до адміністратора для надання доступу до проєкту {projectKey}.
                </span>
              )}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-xl text-xs font-medium border border-border bg-secondary hover:bg-secondary/80 text-foreground flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Повернутися назад</span>
            </button>
            <button
              onClick={() => router.push("/projects/all")}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Мої проєкти</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 404 Not Found Screen
  if (errorStatus === 404 || errorStatus === 400) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-xl p-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <div className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-destructive/15 text-destructive border border-destructive/30">
              404 Not Found
            </div>
            <h1 className="text-lg font-bold text-foreground">Задачу не знайдено</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Задачу з номером <span className="font-mono font-bold text-foreground">{taskCode}</span> не знайдено в системі або її було видалено.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-xl text-xs font-medium border border-border bg-secondary hover:bg-secondary/80 text-foreground flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Назад</span>
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>На головну</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Generic Error Fallback
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-xl p-6 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
        <h2 className="text-base font-bold text-foreground">Помилка завантаження</h2>
        <p className="text-xs text-muted-foreground">{errorMessage || "Невідома помилка"}</p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground cursor-pointer"
        >
          На головну
        </button>
      </div>
    </div>
  );
}
