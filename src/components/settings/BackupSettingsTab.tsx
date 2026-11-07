"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Database,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileArchive,
  RefreshCw,
  Users,
  FolderGit2,
  CheckSquare,
  Paperclip,
  Mail,
  Send,
  Tag,
  Clock,
  ShieldAlert,
  X,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import { BackupSummaryData, BackupValidationData } from "./types";

export function BackupSettingsTab() {
  // Export states
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Live system stats for export preview
  const [liveStats, setLiveStats] = useState<BackupSummaryData | null>(null);
  const [loadingLiveStats, setLoadingLiveStats] = useState(false);

  // Import / Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<BackupValidationData | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Restore Modal states
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmInputText, setConfirmInputText] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  // Recent backup audit history
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch quick stats and history
  const fetchStatsAndHistory = async () => {
    try {
      setLoadingLiveStats(true);
      setLoadingHistory(true);

      const [logsRes, projectsRes, usersRes] = await Promise.all([
        fetch("/api/audit-logs?limit=30"),
        fetch("/api/projects/all"),
        fetch("/api/users"),
      ]);

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        const logs = Array.isArray(logsData.logs) ? logsData.logs : [];
        const backupLogs = logs.filter(
          (l: any) => l.action === "BACKUP_EXPORT" || l.action === "BACKUP_RESTORE"
        );
        setHistoryLogs(backupLogs);
      }

      let projectsCount = 0;
      let tasksCount = 0;
      let usersCount = 0;

      if (projectsRes.ok) {
        const projData = await projectsRes.json();
        const allTasks = (projData.columns || []).flatMap((c: any) => c.tasks || []);
        tasksCount = allTasks.length;
        // Count distinct project ids
        const projSet = new Set(allTasks.map((t: any) => t.projectId).filter(Boolean));
        projectsCount = projSet.size || (projData.id === "all" ? 1 : 0);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        usersCount = Array.isArray(usersData) ? usersData.length : 0;
      }

      setLiveStats({
        usersCount,
        projectsCount,
        tasksCount,
        subtasksCount: 0,
        commentsCount: 0,
        attachmentsCount: 0,
        auditLogsCount: 0,
        filesCount: 0,
        totalFileSizeBytes: 0,
        hasSmtpConfig: true,
        hasTelegramConfig: true,
        hasDictionaries: true,
      });
    } catch (err) {
      console.error("Error loading stats/history:", err);
    } finally {
      setLoadingLiveStats(false);
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchStatsAndHistory();
  }, []);

  // Handle Export (Download Backup)
  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      setExportError(null);
      setExportSuccess(null);

      const res = await fetch("/api/settings/backup/export", {
        method: "GET",
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Не вдалося створити резервну копію");
      }

      // Extract filename from header or fallback
      const contentDisposition = res.headers.get("Content-Disposition") || "";
      let filename = "stsup-backup.stsup";
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      const sizeKb = Math.round(blob.size / 1024);
      setExportSuccess(`Резервну копію «${filename}» (${sizeKb} КБ) успішно згенеровано та завантажено.`);
      await fetchStatsAndHistory();
    } catch (err: any) {
      setExportError(err.message || "Помилка при створенні резервної копії");
    } finally {
      setIsExporting(false);
    }
  };

  // Handle File Selection & Auto-Validation
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setValidationResult(null);
    setValidationError(null);
    setRestoreSuccess(null);
    setRestoreError(null);

    await runValidation(file);
  };

  const runValidation = async (file: File) => {
    try {
      setIsValidating(true);
      setValidationError(null);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/settings/backup/validate", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.isValid) {
        throw new Error(data.error || "Файл не пройшов валідацію цілісності");
      }

      setValidationResult(data);
    } catch (err: any) {
      setValidationError(err.message || "Помилка перевірки файлу бекапу");
    } finally {
      setIsValidating(false);
    }
  };

  // Handle Restore Execution
  const handleExecuteRestore = async () => {
    if (!selectedFile) return;

    try {
      setIsRestoring(true);
      setRestoreError(null);
      setRestoreSuccess(null);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("confirm", "true");

      const res = await fetch("/api/settings/backup/restore", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Не вдалося відновити дані з резервної копії");
      }

      setIsConfirmModalOpen(false);
      setConfirmInputText("");
      setSelectedFile(null);
      setValidationResult(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      const s = data.summary || {};
      setRestoreSuccess(
        `Систему успішно відновлено! Актуалізовано: ${s.usersCount || 0} користувачів, ${
          s.projectsCount || 0
        } проєктів, ${s.tasksCount || 0} задач, ${s.filesCount || 0} вкладених файлів.`
      );

      await fetchStatsAndHistory();
    } catch (err: any) {
      setRestoreError(err.message || "Помилка при відновленні системи");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* 1. Header Information Banner */}
      <div className="p-5 rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              Резервне копіювання та відновлення системи (Backup & Restore)
            </h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
            Автоматизований інструмент створення повного переносного дампу інстанса STsup (користувачі,
            проєкти, задачі, довідники, конфігурації та вкладені файли) з можливістю розгортання в один
            клік на чистому сервері без консольних команд.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchStatsAndHistory}
          disabled={loadingLiveStats}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/80 hover:bg-secondary text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex-shrink-0"
          title="Оновити статистику"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingLiveStats ? "animate-spin" : ""}`} />
          <span>Оновити стан</span>
        </button>
      </div>

      {/* 2. Grid: Export (Left) and Import (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* =========================================
            CARD A: СТВОРЕННЯ РЕЗЕРВНОЇ КОПІЇ (ЕКСПОРТ)
            ========================================= */}
        <div className="rounded-2xl border border-border bg-card/60 p-6 flex flex-col justify-between space-y-6 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/80">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Створення резервної копії (Експорт)</h3>
                <p className="text-[11px] text-muted-foreground">
                  Формування єдиного стисненого архіву .stsup для збереження
                </p>
              </div>
            </div>

            {/* Checklist of what's inside */}
            <div className="space-y-2 text-xs">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Склад резервної копії:
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                <li className="flex items-center gap-2 p-2 rounded-lg bg-secondary/40 border border-border/50">
                  <Users className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span>Користувачі, ролі, паролі</span>
                </li>
                <li className="flex items-center gap-2 p-2 rounded-lg bg-secondary/40 border border-border/50">
                  <FolderGit2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  <span>Усі проєкти та дошки Kanban</span>
                </li>
                <li className="flex items-center gap-2 p-2 rounded-lg bg-secondary/40 border border-border/50">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Задачі, коментарі, підзадачі</span>
                </li>
                <li className="flex items-center gap-2 p-2 rounded-lg bg-secondary/40 border border-border/50">
                  <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>Оцінка та облік часу інженерів</span>
                </li>
                <li className="flex items-center gap-2 p-2 rounded-lg bg-secondary/40 border border-border/50">
                  <Tag className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                  <span>Довідники компонентів і міток</span>
                </li>
                <li className="flex items-center gap-2 p-2 rounded-lg bg-secondary/40 border border-border/50">
                  <Send className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                  <span>Telegram та SMTP налаштування</span>
                </li>
                <li className="flex items-center gap-2 p-2 rounded-lg bg-secondary/40 border border-border/50 col-span-1 sm:col-span-2">
                  <Paperclip className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                  <span>Вкладені файли (атачменти запаковано в архів)</span>
                </li>
              </ul>
            </div>

            {/* Success / Error banners */}
            {exportSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{exportSuccess}</span>
              </div>
            )}
            {exportError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{exportError}</span>
              </div>
            )}
          </div>

          {/* Action button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleExportBackup}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Генерація повного дампу системи...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Згенерувати та завантажити повний бекап (.stsup)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* =========================================
            CARD B: ВІДНОВЛЕННЯ З РЕЗЕРВНОЇ КОПІЇ (ІМПОРТ)
            ========================================= */}
        <div className="rounded-2xl border border-border bg-card/60 p-6 flex flex-col justify-between space-y-6 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/80">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Відновлення з резервної копії (Імпорт)</h3>
                <p className="text-[11px] text-muted-foreground">
                  Розгортання системи з файлу .stsup або .json із збереженням усіх реляційних зв'язків
                </p>
              </div>
            </div>

            {/* File Upload Zone */}
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".stsup,.json,.gz"
                onChange={handleFileChange}
                className="hidden"
                id="backup-file-input"
              />
              <label
                htmlFor="backup-file-input"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/80 hover:border-primary/50 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-all cursor-pointer text-center group"
              >
                <FileArchive className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                <span className="text-xs font-semibold text-foreground">
                  {selectedFile ? selectedFile.name : "Оберіть файл резервної копії або перетягніть сюди"}
                </span>
                <span className="text-[10px] text-muted-foreground mt-1">
                  Підтримуються формати: .stsup (рекомендовано), .json, .gz
                </span>
              </label>
            </div>

            {/* Validation State / Spinner */}
            {isValidating && (
              <div className="p-3 rounded-xl bg-secondary/50 border border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                <span>Перевірка цілісності та структури архіву...</span>
              </div>
            )}

            {/* Validation Error Banner */}
            {validationError && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Помилка валідації архіву</span>
                </div>
                <p className="text-[11px] leading-relaxed">{validationError}</p>
              </div>
            )}

            {/* Validation Success Preview Card */}
            {validationResult && validationResult.isValid && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <FileCheck className="w-4 h-4" />
                    <span>Архів валідний (Версія {validationResult.version})</span>
                  </div>
                  {validationResult.createdAt && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {new Date(validationResult.createdAt).toLocaleString("uk-UA")}
                    </span>
                  )}
                </div>

                {validationResult.exportedBy?.email && (
                  <p className="text-[11px] text-muted-foreground">
                    Створено адміністратором:{" "}
                    <strong className="text-foreground">{validationResult.exportedBy.email}</strong>
                  </p>
                )}

                {/* Summary Grid */}
                {validationResult.summary && (
                  <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                    <div className="p-2 rounded-lg bg-card/60 border border-border/50 text-center">
                      <span className="text-muted-foreground block text-[10px]">Користувачів</span>
                      <strong className="text-foreground font-mono text-xs">
                        {validationResult.summary.usersCount}
                      </strong>
                    </div>
                    <div className="p-2 rounded-lg bg-card/60 border border-border/50 text-center">
                      <span className="text-muted-foreground block text-[10px]">Проєктів</span>
                      <strong className="text-foreground font-mono text-xs">
                        {validationResult.summary.projectsCount}
                      </strong>
                    </div>
                    <div className="p-2 rounded-lg bg-card/60 border border-border/50 text-center">
                      <span className="text-muted-foreground block text-[10px]">Задач</span>
                      <strong className="text-foreground font-mono text-xs">
                        {validationResult.summary.tasksCount}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Restore Success / Error */}
            {restoreSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{restoreSuccess}</span>
              </div>
            )}
            {restoreError && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{restoreError}</span>
              </div>
            )}
          </div>

          {/* Action Button: Triggers Warning Modal */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsConfirmModalOpen(true)}
              disabled={!validationResult || !validationResult.isValid || isRestoring}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              <span>Розгорнути цю резервну копію...</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Recent Backup & Restore History */}
      <div className="rounded-2xl border border-border bg-card/60 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Журнал операцій резервного копіювання
            </h3>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">
            Останні події експорту та відновлення
          </span>
        </div>

        {loadingHistory ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            Завантаження історії операцій...
          </div>
        ) : historyLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Операцій створення або відновлення резервних копій ще не зафіксовано.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {historyLogs.map((log) => {
              const isExport = log.action === "BACKUP_EXPORT";
              return (
                <div key={log.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isExport
                          ? "bg-blue-500/15 text-blue-400"
                          : "bg-emerald-500/15 text-emerald-400"
                      }`}
                    >
                      {isExport ? <Download className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {isExport ? "Створення резервної копії" : "Відновлення системи з бекапу"}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-secondary text-muted-foreground border border-border">
                          {log.actorEmail}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {isExport
                          ? `Файл: ${log.details?.filename || "stsup-backup"} (Задач: ${
                              log.details?.tasksCount || 0
                            }, Проєктів: ${log.details?.projectsCount || 0})`
                          : `Відновлено користувачів: ${log.details?.summary?.usersCount || 0}, задач: ${
                              log.details?.summary?.tasksCount || 0
                            }`}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("uk-UA")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================
          4. MODAL: WARNING & CONFIRMATION OF RESTORE
          ========================================= */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-destructive/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 relative">
            {/* Close button */}
            <button
              type="button"
              onClick={() => {
                if (!isRestoring) {
                  setIsConfirmModalOpen(false);
                  setConfirmInputText("");
                }
              }}
              disabled={isRestoring}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/15 text-destructive flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  Підтвердження повного відновлення системи
                </h3>
                <p className="text-xs text-muted-foreground">
                  Ця дія незворотна і призведе до повної заміни поточної бази даних.
                </p>
              </div>
            </div>

            {/* Danger Notice Box */}
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 space-y-2 text-xs text-destructive">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>УВАГА: Поточні дані інстанса буде повністю перезаписано!</span>
              </div>
              <p className="text-[11px] leading-relaxed text-destructive/90">
                Усі наявні в системі проєкти, задачі, коментарі та історія будуть замінені вмістом обраного
                файлу резервної копії. Облікові записи та їхні паролі буде синхронізовано з бекапом.
              </p>
            </div>

            {/* Backup stats recap */}
            {validationResult?.summary && (
              <div className="text-xs text-muted-foreground space-y-1 bg-secondary/30 p-3 rounded-xl border border-border">
                <span className="font-semibold text-foreground text-[11px] block">
                  Дані, що будуть завантажені:
                </span>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <span>Користувачі: <strong>{validationResult.summary.usersCount}</strong></span>
                  <span>Проєкти: <strong>{validationResult.summary.projectsCount}</strong></span>
                  <span>Задачі: <strong>{validationResult.summary.tasksCount}</strong></span>
                  <span>Вкладені файли: <strong>{validationResult.summary.filesCount}</strong></span>
                </div>
              </div>
            )}

            {/* Anti-accidental confirmation prompt */}
            <div className="space-y-2">
              <label className="text-xs text-foreground font-medium block">
                Для підтвердження дії введіть слово <strong className="text-destructive font-mono">ВІДНОВИТИ</strong> нижче:
              </label>
              <input
                type="text"
                placeholder="ВІДНОВИТИ"
                value={confirmInputText}
                onChange={(e) => setConfirmInputText(e.target.value)}
                disabled={isRestoring}
                className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border focus:border-destructive focus:ring-1 focus:ring-destructive text-xs font-mono text-foreground placeholder:text-muted-foreground/40 outline-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/80">
              <button
                type="button"
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setConfirmInputText("");
                }}
                disabled={isRestoring}
                className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                Скасувати
              </button>

              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={confirmInputText.trim() !== "ВІДНОВИТИ" || isRestoring}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Відновлення бази даних...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <span>Підтвердити та перезаписати систему</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
