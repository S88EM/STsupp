"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Settings,
  Mail,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Send,
  Eye,
  EyeOff,
  Server,
  ArrowLeft,
  Save,
  RefreshCw,
  Info,
  Globe,
  Tag,
  Plus,
  Trash2,
  RotateCcw,
  CheckSquare,
  Bug,
  Bookmark,
  Zap,
  Wrench,
  Check,
  Pencil,
  X,
  FolderGit2,
  Bot,
  MessageSquare,
  ExternalLink,
  ShieldCheck,
  Search,
  Filter,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

const TASK_TYPE_TABS = [
  { id: "TASK", label: "Задача", icon: CheckSquare, color: "text-blue-400" },
  { id: "BUG", label: "Баг", icon: Bug, color: "text-red-400" },
  { id: "STORY", label: "Історія", icon: Bookmark, color: "text-emerald-400" },
  { id: "IMPROVEMENT", label: "Покращення", icon: Zap, color: "text-violet-400" },
  { id: "SUPPORT", label: "Підтримка", icon: Wrench, color: "text-amber-400" },
];

function getAuditBadge(action: string) {
  switch (action) {
    case "USER_PASSWORD_RESET":
      return {
        label: "Скидання пароля",
        color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      };
    case "USER_EMAIL_UPDATE":
      return {
        label: "Зміна email / логіна",
        color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      };
    case "USER_ROLE_CHANGE":
      return {
        label: "Зміна системної ролі",
        color: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      };
    case "USER_CREATE":
      return {
        label: "Створення користувача",
        color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      };
    case "USER_DELETE":
      return {
        label: "Видалення користувача",
        color: "bg-destructive/10 text-destructive border-destructive/30",
      };
    case "USER_STATUS_CHANGE":
      return {
        label: "Активація акаунту",
        color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
      };
    case "USER_PROJECTS_ASSIGN":
      return {
        label: "Призначення проєктів",
        color: "bg-slate-500/10 text-slate-300 border-slate-500/30",
      };
    case "SETTINGS_SMTP_UPDATE":
      return {
        label: "Налаштування SMTP",
        color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
      };
    case "SETTINGS_TELEGRAM_UPDATE":
      return {
        label: "Налаштування Telegram",
        color: "bg-sky-500/10 text-sky-400 border-sky-500/30",
      };
    case "SETTINGS_DICTIONARY_UPDATE":
      return {
        label: "Оновлення довідників",
        color: "bg-teal-500/10 text-teal-400 border-teal-500/30",
      };
    default:
      return {
        label: action,
        color: "bg-secondary text-foreground border-border",
      };
  }
}

function renderAuditDetails(log: any) {
  const d = log.details || {};
  if (log.action === "USER_PASSWORD_RESET") {
    return (
      <span className="text-muted-foreground">
        Пароль для користувача{" "}
        <strong className="text-foreground">{d.targetUserEmail || d.targetUserName || log.targetId}</strong> було оновлено
      </span>
    );
  }
  if (log.action === "USER_EMAIL_UPDATE") {
    return (
      <span className="text-muted-foreground">
        Email змінено:{" "}
        <code className="text-amber-400 line-through mr-1 font-mono">{d.previousEmail}</code> ➔{" "}
        <code className="text-emerald-400 ml-1 font-mono font-semibold">{d.newEmail}</code>
      </span>
    );
  }
  if (log.action === "USER_ROLE_CHANGE") {
    return (
      <span className="text-muted-foreground">
        Користувач: <strong className="text-foreground mr-1">{d.targetUserEmail || log.targetId}</strong>
        Роль: <span className="text-zinc-400">{d.previousRole}</span> ➔{" "}
        <span className="text-primary font-semibold">{d.newRole}</span>
      </span>
    );
  }
  if (log.action === "USER_CREATE") {
    return (
      <span className="text-muted-foreground">
        Створено користувача: <strong className="text-foreground">{d.createdEmail}</strong> ({d.createdName}), роль:{" "}
        <span className="text-primary font-semibold">{d.role}</span>
      </span>
    );
  }
  if (log.action === "USER_DELETE") {
    return (
      <span className="text-destructive/90">
        Видалено обліковий запис: <strong className="text-foreground">{d.deletedUserEmail}</strong> ({d.deletedUserName})
      </span>
    );
  }
  if (log.action === "SETTINGS_SMTP_UPDATE") {
    return (
      <span className="text-muted-foreground">
        Оновлено SMTP: <code className="font-mono text-foreground">{d.host}:{d.port}</code>, відправник: <code className="font-mono text-foreground">{d.from}</code>
      </span>
    );
  }
  if (log.action === "SETTINGS_TELEGRAM_UPDATE") {
    return (
      <span className="text-muted-foreground">
        Оновлено Telegram: чат <code className="font-mono text-foreground">{d.chatId}</code>, стан:{" "}
        <span className={d.isEnabled ? "text-emerald-400 font-semibold" : "text-zinc-400"}>
          {d.isEnabled ? "Увімкнено" : "Вимкнено"}
        </span>
      </span>
    );
  }
  if (log.action === "SETTINGS_DICTIONARY_UPDATE") {
    return (
      <span className="text-muted-foreground">
        Оновлено довідники компонентів та міток ({d.labelsCount || 0} міток)
      </span>
    );
  }
  return <span className="font-mono text-[10px] text-muted-foreground">{JSON.stringify(d)}</span>;
}

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activeTab, setActiveTab] = useState<"smtp" | "dictionaries" | "telegram" | "audit">("smtp");

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditFilter, setAuditFilter] = useState("all");

  // SMTP Settings
  const [host, setHost] = useState("");
  const [port, setPort] = useState<number>(587);
  const [secure, setSecure] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [hasSavedPass, setHasSavedPass] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [from, setFrom] = useState("");
  const [appUrl, setAppUrl] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);

  // Test email
  const [testEmail, setTestEmail] = useState("");
  const [testSuccess, setTestSuccess] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Telegram Settings
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramMaskedToken, setTelegramMaskedToken] = useState("");
  const [hasSavedTelegramToken, setHasSavedTelegramToken] = useState(false);
  const [showTelegramToken, setShowTelegramToken] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramEvents, setTelegramEvents] = useState({
    taskCreated: true,
    statusChanged: true,
    commentAdded: true,
    assigneeChanged: true,
  });
  const [telegramPreviewTab, setTelegramPreviewTab] = useState<"created" | "status" | "comment" | "assignee">("created");
  const [telegramSaving, setTelegramSaving] = useState(false);
  const [telegramTesting, setTelegramTesting] = useState(false);
  const [telegramSaveSuccess, setTelegramSaveSuccess] = useState<string | null>(null);
  const [telegramSaveError, setTelegramSaveError] = useState<string | null>(null);
  const [telegramTestSuccess, setTelegramTestSuccess] = useState<string | null>(null);
  const [telegramTestError, setTelegramTestError] = useState<string | null>(null);

  // Projects & Dictionaries Settings
  const [projects, setProjects] = useState<Array<{ id: string; name: string; key: string }>>([]);
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

  const loadAuditLogs = async () => {
    try {
      setLoadingAudit(true);
      const res = await fetch("/api/audit-logs");
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (e) {
      console.error("Failed to load audit logs:", e);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "audit" || tab === "smtp" || tab === "dictionaries" || tab === "telegram") {
        setActiveTab(tab as any);
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === "audit") {
      loadAuditLogs();
    }
  }, [activeTab]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [meRes, smtpRes, dictRes, tgRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/settings/smtp"),
        fetch("/api/settings/dictionaries"),
        fetch("/api/settings/telegram"),
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUser(meData.user);
        if (meData.user?.email && !testEmail) {
          setTestEmail(meData.user.email);
        }
      }

      if (smtpRes.ok) {
        const smtpData = await smtpRes.json();
        setHost(smtpData.host || "");
        setPort(smtpData.port || 587);
        setSecure(Boolean(smtpData.secure));
        setUser(smtpData.user || "");
        setHasSavedPass(Boolean(smtpData.hasPass));
        setFrom(smtpData.from || "");
        setAppUrl(smtpData.appUrl || "");
        setIsConfigured(Boolean(smtpData.isConfigured));
      }

      if (dictRes.ok) {
        const dictData = await dictRes.json();
        setComponentsByType(dictData.componentsByType || {});
        setComponentsByProject(dictData.componentsByProject || {});
        setLabels(dictData.labels || []);
        if (Array.isArray(dictData.projects) && dictData.projects.length > 0) {
          setProjects(dictData.projects);
          setSelectedProjectForDict(dictData.projects[0].id);
        }
      }

      if (tgRes.ok) {
        const tgData = await tgRes.json();
        setTelegramEnabled(Boolean(tgData.isEnabled));
        setTelegramChatId(tgData.chatId || "");
        setHasSavedTelegramToken(Boolean(tgData.hasBotToken));
        setTelegramMaskedToken(tgData.maskedBotToken || "");
        if (tgData.events) {
          setTelegramEvents({
            taskCreated: tgData.events.taskCreated !== undefined ? Boolean(tgData.events.taskCreated) : true,
            statusChanged: tgData.events.statusChanged !== undefined ? Boolean(tgData.events.statusChanged) : true,
            commentAdded: tgData.events.commentAdded !== undefined ? Boolean(tgData.events.commentAdded) : true,
            assigneeChanged: tgData.events.assigneeChanged !== undefined ? Boolean(tgData.events.assigneeChanged) : true,
          });
        }
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(null);
    setTestError(null);

    try {
      const res = await fetch("/api/settings/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host,
          port: Number(port),
          secure,
          user,
          pass: pass || undefined,
          from,
          appUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Не вдалося зберегти налаштування");
        return;
      }

      setIsConfigured(Boolean(data.config?.isConfigured));
      setHasSavedPass(Boolean(data.config?.hasPass));
      setPass("");
      setSaveSuccess("Налаштування поштового сервісу успішно збережено!");
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || "Помилка при збереженні");
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!host) {
      alert("Будь ласка, вкажіть хост поштового сервера перед тестуванням");
      return;
    }

    setTesting(true);
    setTestSuccess(null);
    setTestError(null);

    try {
      const res = await fetch("/api/settings/smtp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testEmail,
          host,
          port: Number(port),
          secure,
          user,
          pass: pass || undefined,
          from,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTestError(data.error || "Помилка підключення до поштового сервера");
      } else {
        setTestSuccess(data.message || "Тестовий лист успішно надіслано!");
      }
    } catch (err: any) {
      setTestError(err.message || "Помилка зв'язку із сервером");
    } finally {
      setTesting(false);
    }
  };

  const handleSaveTelegram = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setTelegramSaving(true);
    setTelegramSaveSuccess(null);
    setTelegramSaveError(null);

    try {
      const res = await fetch("/api/settings/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: telegramBotToken || undefined,
          chatId: telegramChatId,
          isEnabled: telegramEnabled,
          events: telegramEvents,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTelegramSaveError(data.error || "Не вдалося зберегти налаштування Telegram");
        return;
      }

      setTelegramEnabled(Boolean(data.config?.isEnabled));
      setTelegramChatId(data.config?.chatId || "");
      setHasSavedTelegramToken(Boolean(data.config?.hasBotToken));
      setTelegramMaskedToken(data.config?.maskedBotToken || "");
      setTelegramBotToken("");
      setTelegramSaveSuccess("Налаштування Telegram успішно збережено!");
      setTimeout(() => setTelegramSaveSuccess(null), 4000);
    } catch (err: any) {
      setTelegramSaveError(err.message || "Помилка при збереженні");
    } finally {
      setTelegramSaving(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!telegramChatId.trim()) {
      alert("Будь ласка, вкажіть Chat ID / Group ID для відправки тестового повідомлення");
      return;
    }
    if (!hasSavedTelegramToken && !telegramBotToken.trim()) {
      alert("Будь ласка, вкажіть токен Telegram-бота для перевірки з'єднання");
      return;
    }

    setTelegramTesting(true);
    setTelegramTestSuccess(null);
    setTelegramTestError(null);

    try {
      const res = await fetch("/api/settings/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: telegramBotToken || undefined,
          chatId: telegramChatId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTelegramTestError(data.error || "Помилка перевірки з'єднання з Telegram");
      } else {
        setTelegramTestSuccess(data.message || "Тестове повідомлення успішно надіслано в Telegram!");
        setTimeout(() => setTelegramTestSuccess(null), 5000);
      }
    } catch (err: any) {
      setTelegramTestError(err.message || "Помилка зв'язку з сервером");
    } finally {
      setTelegramTesting(false);
    }
  };

  const applyPreset = (presetHost: string, presetPort: number, presetSecure: boolean) => {
    setHost(presetHost);
    setPort(presetPort);
    setSecure(presetSecure);
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">
        Завантаження налаштувань системи...
      </div>
    );
  }

  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-3">
        <Shield className="w-10 h-10 text-destructive" />
        <h2 className="text-xl font-bold text-foreground">Доступ заборонено</h2>
        <p className="text-xs text-muted-foreground">
          Цей розділ доступний лише для адміністраторів системи STsup.
        </p>
        <Link href="/" className="text-xs text-primary underline mt-2">
          Повернутися на головну
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Breadcrumb / Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Головна</span>
              </Link>
              <span className="text-muted-foreground text-xs">/</span>
              <span className="text-xs font-medium text-foreground">Налаштування</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <Settings className="w-6 h-6 text-primary" />
              <span>Налаштування системи</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "telegram" ? (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  telegramEnabled && hasSavedTelegramToken && telegramChatId
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : telegramEnabled
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-secondary text-muted-foreground border-border"
                }`}
              >
                {telegramEnabled && hasSavedTelegramToken && telegramChatId ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Telegram активний</span>
                  </>
                ) : telegramEnabled ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Потрібне налаштування</span>
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Telegram вимкнено</span>
                  </>
                )}
              </span>
            ) : (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  isConfigured
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                }`}
              >
                {isConfigured ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Поштовий сервіс активний</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Режим симуляції (SMTP не налаштовано)</span>
                  </>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("smtp")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "smtp"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Поштовий сервер (SMTP)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("dictionaries")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "dictionaries"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Довідники: Компоненти та Мітки</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("telegram")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "telegram"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Інтеграції: Telegram</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === "audit"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Аудит-лог (Безпека)</span>
          </button>
        </div>

        {/* Tab 1: SMTP Settings */}
        {activeTab === "smtp" && (
          <>
            {/* Success Banner */}
            {saveSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{saveSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main SMTP Form (8 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="p-5 border-b border-border bg-secondary/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">
                      Поштовий сервіс (SMTP)
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Параметри підключення для надсилання сповіщень та підтвердження акаунтів
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSave} className="p-5 space-y-4">
                {/* System / App URL */}
                <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    <span>Адреса системи для посилань (App URL)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="http://192.168.1.100:3000 або http://homeassistant.local:3000"
                    value={appUrl}
                    onChange={(e) => setAppUrl(e.target.value)}
                    className="w-full text-xs font-mono py-2 px-3 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Вкажіть адресу вашого Home Assistant або домен (наприклад, <code className="text-blue-400">http://192.168.1.100:3000</code>). Вона автоматично підставлятиметься у всі листи замість localhost.
                  </p>
                </div>

                {/* Presets */}
                <div>
                  <span className="text-[11px] text-muted-foreground font-medium block mb-1.5">
                    Швидкі шаблони:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => applyPreset("smtp.gmail.com", 465, true)}
                      className="px-2.5 py-1 rounded-lg bg-secondary/60 hover:bg-secondary text-xs text-foreground border border-border transition-colors cursor-pointer"
                    >
                      Gmail (465 SSL)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("smtp.gmail.com", 587, false)}
                      className="px-2.5 py-1 rounded-lg bg-secondary/60 hover:bg-secondary text-xs text-foreground border border-border transition-colors cursor-pointer"
                    >
                      Gmail (587 STARTTLS)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("smtp-mail.outlook.com", 587, false)}
                      className="px-2.5 py-1 rounded-lg bg-secondary/60 hover:bg-secondary text-xs text-foreground border border-border transition-colors cursor-pointer"
                    >
                      Outlook / Office 365
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("localhost", 1025, false)}
                      className="px-2.5 py-1 rounded-lg bg-secondary/60 hover:bg-secondary text-xs text-foreground border border-border transition-colors cursor-pointer"
                    >
                      Mailhog / Local
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Host */}
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      SMTP Сервер (Хост) <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <Server className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        placeholder="напр. smtp.gmail.com"
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                        className="w-full text-xs pl-8 pr-3 py-2 rounded-lg bg-secondary/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Port */}
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Порт <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="587"
                      value={port}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPort(val);
                        if (val === 465) setSecure(true);
                      }}
                      className="w-full text-xs px-3 py-2 rounded-lg bg-secondary/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    />
                  </div>
                </div>

                {/* Secure SSL/TLS Checkbox */}
                <div className="flex items-center gap-2 pt-1 pb-1">
                  <input
                    type="checkbox"
                    id="secureSmtp"
                    checked={secure}
                    onChange={(e) => setSecure(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="secureSmtp" className="text-xs text-foreground cursor-pointer select-none">
                    Використовувати пряме шифрування <strong>SSL / TLS</strong> (зазвичай для порту 465)
                  </label>
                </div>

                {/* User & Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Користувач / Логін (User)
                    </label>
                    <input
                      type="text"
                      placeholder="support@company.com"
                      value={user}
                      onChange={(e) => setUser(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg bg-secondary/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-foreground">
                        Пароль (Password)
                      </label>
                      {hasSavedPass && (
                        <span className="text-[10px] text-emerald-400 font-medium">
                          ✓ Пароль збережено
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder={hasSavedPass ? "•••••••••••• (залишіть пустим, щоб не змінювати)" : "Пароль до пошти / App Password"}
                        value={pass}
                        onChange={(e) => setPass(e.target.value)}
                        className="w-full text-xs pl-3 pr-8 py-2 rounded-lg bg-secondary/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* From Address */}
                <div className="pt-1">
                  <label className="text-xs font-semibold text-foreground block mb-1">
                    Відправник (From Address)
                  </label>
                  <input
                    type="text"
                    placeholder='"STsup Support" <noreply@stsup.local>'
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg bg-secondary/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    Ім'я та електронна пошта, які відображатимуться у полі «Від кого» у листах клієнтам.
                  </span>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? "Збереження..." : "Зберегти налаштування"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Testing & Info (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Test Connection Box */}
            <div className="rounded-2xl border border-border bg-card shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">
                  Тестування підключення
                </h3>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Надішліть перевірочний лист, щоб переконатися, що поштовий сервер приймає авторизацію та успішно доставляє пошту.
              </p>

              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground block">
                  Email одержувача для тесту:
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full text-xs px-3 py-2 rounded-lg bg-secondary/40 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {testSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{testSuccess}</span>
                </div>
              )}

              {testError && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Помилка підключення</span>
                  </div>
                  <p className="text-[11px] leading-relaxed break-words font-mono opacity-90">
                    {testError}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={testing}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold border border-border transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? "animate-spin text-primary" : ""}`} />
                <span>{testing ? "Відправка тестового листа..." : "Надіслати тестовий лист"}</span>
              </button>
            </div>

            {/* Info / FAQ Card */}
            <div className="rounded-2xl border border-border bg-card/60 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Info className="w-4 h-4 text-blue-400" />
                <span>Як працюють сповіщення в системі</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed list-disc pl-4">
                <li>
                  <strong className="text-foreground">Реєстрація користувачів:</strong> Користувачі, які реєструються самостійно, обов'язково отримують лист із посиланням для активації акаунту.
                </li>
                <li>
                  <strong className="text-foreground">Створення адміністратором:</strong> Якщо акаунт створює адміністратор у розділі «Користувачі», підтвердження не вимагається — акаунт активується автоматично.
                </li>
                <li>
                  <strong className="text-foreground">Сповіщення по подіях:</strong> Листи надсилаються при призначенні задачі на користувача, зміні статусу та додаванні нових коментарів.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </>
    )}

    {/* Tab 2: Dictionaries Settings */}
    {activeTab === "dictionaries" && (
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
    )}

    {/* Tab 3: Telegram Integration Settings */}
    {activeTab === "telegram" && (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Status Alerts */}
        {telegramSaveSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{telegramSaveSuccess}</span>
          </div>
        )}

        {telegramSaveError && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{telegramSaveError}</span>
          </div>
        )}

        {telegramTestSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{telegramTestSuccess}</span>
          </div>
        )}

        {telegramTestError && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{telegramTestError}</span>
          </div>
        )}

        {/* Intro Header */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              <span>Інтеграція зі сповіщеннями Telegram</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Автоматична відправка структурованих сповіщень у Telegram-групу або канал при створенні нових задач
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSaveTelegram()}
              disabled={telegramSaving}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              {telegramSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Збереження...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Зберегти налаштування</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form & Triggers (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Connection Form */}
            <form onSubmit={handleSaveTelegram} className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary" />
                  <span>Параметри підключення бота</span>
                </h3>

                {/* Main Activity Toggle */}
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <span className="text-xs font-medium text-foreground">
                    {telegramEnabled ? "Увімкнено" : "Вимкнено"}
                  </span>
                  <div
                    onClick={() => setTelegramEnabled(!telegramEnabled)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                      telegramEnabled ? "bg-primary" : "bg-secondary border border-border"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        telegramEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </div>
                </label>
              </div>

              {/* Bot Token Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span>Bot Token (API токен бота)</span>
                    <span className="text-destructive">*</span>
                  </label>
                  {hasSavedTelegramToken && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                      Токен збережено в системі
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showTelegramToken ? "text" : "password"}
                    value={telegramBotToken}
                    onChange={(e) => setTelegramBotToken(e.target.value)}
                    placeholder={hasSavedTelegramToken ? telegramMaskedToken : "123456789:ABCdefGHIjklMNOpqrsTUVwxyz..."}
                    className="w-full text-xs py-2 px-3 pr-10 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTelegramToken(!showTelegramToken)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    title={showTelegramToken ? "Сховати токен" : "Показати токен"}
                  >
                    {showTelegramToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Отримайте HTTP API токен у Telegram-бота <strong className="text-foreground">@BotFather</strong> командою <code className="bg-secondary px-1 py-0.5 rounded text-primary">/newbot</code>.
                </p>
              </div>

              {/* Chat ID / Group ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <span>Chat ID / Group ID (Ідентифікатор групи або каналу)</span>
                  <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="-1001987654321 або @channel_username"
                  className="w-full text-xs py-2 px-3 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  ID групи або каналу (для супергруп зазвичай починається з <code className="bg-secondary px-1 py-0.5 rounded text-foreground">-100...</code>). Бот обов&apos;язково має бути доданий до групи.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleTestTelegram}
                  disabled={telegramTesting || (!hasSavedTelegramToken && !telegramBotToken.trim()) || !telegramChatId.trim()}
                  className="px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border border-border disabled:opacity-40"
                >
                  {telegramTesting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                      <span>Відправка тесту...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-primary" />
                      <span>Перевірити з&apos;єднання</span>
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  disabled={telegramSaving}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{telegramSaving ? "Збереження..." : "Зберегти зміни"}</span>
                </button>
              </div>
            </form>

            {/* Event Subscriptions / Triggers Card */}
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <div className="border-b border-border pb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-primary" />
                  <span>Конфігурація подій (тригерів сповіщень)</span>
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Оберіть, при яких діях у системі STsup бот має надсилати повідомлення у підключену групу
                </p>
              </div>

              <div className="space-y-3">
                {/* Trigger 1: Task Created (Active) */}
                <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                  telegramEvents.taskCreated ? "border-primary/30 bg-primary/5 hover:bg-primary/10" : "border-border bg-card hover:bg-secondary/20"
                }`}>
                  <input
                    type="checkbox"
                    checked={telegramEvents.taskCreated}
                    onChange={(e) =>
                      setTelegramEvents((prev) => ({ ...prev, taskCreated: e.target.checked }))
                    }
                    className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">Створення нової задачі</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        telegramEvents.taskCreated ? "bg-emerald-500/20 text-emerald-400" : "bg-secondary text-muted-foreground"
                      }`}>
                        {telegramEvents.taskCreated ? "Активно" : "Вимкнено"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Надсилати сповіщення при створенні будь-якої задачі, багу, історії чи звернення (ключ, автор, пріоритет, посилання)
                    </p>
                  </div>
                </label>

                {/* Trigger 2: Status Changed (Active) */}
                <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                  telegramEvents.statusChanged ? "border-primary/30 bg-primary/5 hover:bg-primary/10" : "border-border bg-card hover:bg-secondary/20"
                }`}>
                  <input
                    type="checkbox"
                    checked={telegramEvents.statusChanged || false}
                    onChange={(e) =>
                      setTelegramEvents((prev) => ({ ...prev, statusChanged: e.target.checked }))
                    }
                    className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">Зміна статусу задачі</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        telegramEvents.statusChanged ? "bg-emerald-500/20 text-emerald-400" : "bg-secondary text-muted-foreground"
                      }`}>
                        {telegramEvents.statusChanged ? "Активно" : "Вимкнено"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Сповіщати учасників при переміщенні задачі між колонками (наприклад, В процесі → Готово → Закрито)
                    </p>
                  </div>
                </label>

                {/* Trigger 3: New Comment (Active) */}
                <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                  telegramEvents.commentAdded ? "border-primary/30 bg-primary/5 hover:bg-primary/10" : "border-border bg-card hover:bg-secondary/20"
                }`}>
                  <input
                    type="checkbox"
                    checked={telegramEvents.commentAdded || false}
                    onChange={(e) =>
                      setTelegramEvents((prev) => ({ ...prev, commentAdded: e.target.checked }))
                    }
                    className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">Новий коментар у задачі</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        telegramEvents.commentAdded ? "bg-emerald-500/20 text-emerald-400" : "bg-secondary text-muted-foreground"
                      }`}>
                        {telegramEvents.commentAdded ? "Активно" : "Вимкнено"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Публікувати сповіщення, коли користувач або клієнт залишає коментар у задачі
                    </p>
                  </div>
                </label>

                {/* Trigger 4: Assignee Changed (Active) */}
                <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                  telegramEvents.assigneeChanged ? "border-primary/30 bg-primary/5 hover:bg-primary/10" : "border-border bg-card hover:bg-secondary/20"
                }`}>
                  <input
                    type="checkbox"
                    checked={telegramEvents.assigneeChanged || false}
                    onChange={(e) =>
                      setTelegramEvents((prev) => ({ ...prev, assigneeChanged: e.target.checked }))
                    }
                    className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">Призначення виконавця</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        telegramEvents.assigneeChanged ? "bg-emerald-500/20 text-emerald-400" : "bg-secondary text-muted-foreground"
                      }`}>
                        {telegramEvents.assigneeChanged ? "Активно" : "Вимкнено"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Сповіщати групу при призначенні або перепризначенні відповідального співробітника
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Preview & Setup Guide (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Message Preview Card */}
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between">
                <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span>Вигляд сповіщення в Telegram</span>
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                  Live Preview
                </span>
              </div>

              {/* Sub-tabs for Preview */}
              <div className="flex items-center border-b border-border bg-secondary/10 px-3 py-1.5 gap-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setTelegramPreviewTab("created")}
                  className={`text-[10px] font-medium px-2 py-1 rounded-md transition-colors cursor-pointer ${
                    telegramPreviewTab === "created"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Створення
                </button>
                <button
                  type="button"
                  onClick={() => setTelegramPreviewTab("status")}
                  className={`text-[10px] font-medium px-2 py-1 rounded-md transition-colors cursor-pointer ${
                    telegramPreviewTab === "status"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Статус
                </button>
                <button
                  type="button"
                  onClick={() => setTelegramPreviewTab("comment")}
                  className={`text-[10px] font-medium px-2 py-1 rounded-md transition-colors cursor-pointer ${
                    telegramPreviewTab === "comment"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Коментар
                </button>
                <button
                  type="button"
                  onClick={() => setTelegramPreviewTab("assignee")}
                  className={`text-[10px] font-medium px-2 py-1 rounded-md transition-colors cursor-pointer ${
                    telegramPreviewTab === "assignee"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Виконавець
                </button>
              </div>

              {/* Simulated Telegram Chat Bubble */}
              <div className="p-4 bg-[#0e1621] space-y-3 font-sans">
                {/* Bot Profile bar */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shadow-md">
                    ST
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white">STsup Bot</span>
                      <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded font-mono font-medium">
                        BOT
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400">щойно</span>
                  </div>
                </div>

                {/* Message Body */}
                <div className="rounded-xl bg-[#182533] p-3.5 text-xs text-zinc-200 border border-zinc-700/40 space-y-2 shadow-inner">
                  {telegramPreviewTab === "created" && (
                    <>
                      <div className="font-bold text-white text-[13px] flex items-center gap-1.5">
                        <span>🚀 Нова задача в STsup</span>
                      </div>
                      <div className="space-y-1 text-[11px] text-zinc-300">
                        <div><span className="text-zinc-400">📌 Ключ: </span><span className="font-mono bg-[#101921] px-1.5 py-0.5 rounded text-blue-300 font-semibold">ST-101</span></div>
                        <div><span className="text-zinc-400">📝 Назва: </span><span className="text-white font-medium">Налаштування модуля сповіщень Telegram</span></div>
                        <div><span className="text-zinc-400">📂 Проєкт: </span><span>Portal Support (<code>ST</code>)</span></div>
                        <div><span className="text-zinc-400">🏷 Тип: </span><span>📋 Задача</span></div>
                        <div><span className="text-zinc-400">⚡ Пріоритет: </span><span className="text-amber-300">🟡 Середній</span></div>
                        <div><span className="text-zinc-400">👤 Автор: </span><span className="text-white">Євген Щербак</span></div>
                        <div><span className="text-zinc-400">🧩 Компоненти: </span><span>Інтеграція, API</span></div>
                      </div>
                      <div className="pt-2 border-t border-zinc-700/50">
                        <span className="text-blue-400 hover:text-blue-300 underline cursor-pointer flex items-center gap-1 text-[11px] font-medium">
                          <span>Переглянути задачу в STsup</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    </>
                  )}

                  {telegramPreviewTab === "status" && (
                    <>
                      <div className="font-bold text-white text-[13px] flex items-center gap-1.5">
                        <span>🔄 Зміна статусу задачі в STsup</span>
                      </div>
                      <div className="space-y-1 text-[11px] text-zinc-300">
                        <div><span className="text-zinc-400">📌 Ключ: </span><span className="font-mono bg-[#101921] px-1.5 py-0.5 rounded text-blue-300 font-semibold">ST-101</span></div>
                        <div><span className="text-zinc-400">📝 Назва: </span><span className="text-white font-medium">Налаштування модуля сповіщень Telegram</span></div>
                        <div><span className="text-zinc-400">📂 Проєкт: </span><span>Portal Support (<code>ST</code>)</span></div>
                        <div><span className="text-zinc-400">📊 Перехід: </span><span className="font-mono bg-[#101921] px-1.5 py-0.5 rounded text-zinc-300">В процесі</span> ➔ <span className="font-mono bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-semibold">Готово</span></div>
                        <div><span className="text-zinc-400">👤 Оновив(ла): </span><span className="text-white">Євген Щербак</span></div>
                      </div>
                      <div className="pt-2 border-t border-zinc-700/50">
                        <span className="text-blue-400 hover:text-blue-300 underline cursor-pointer flex items-center gap-1 text-[11px] font-medium">
                          <span>Переглянути задачу в STsup</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    </>
                  )}

                  {telegramPreviewTab === "comment" && (
                    <>
                      <div className="font-bold text-white text-[13px] flex items-center gap-1.5">
                        <span>💬 Новий коментар у задачі STsup</span>
                      </div>
                      <div className="space-y-1 text-[11px] text-zinc-300">
                        <div><span className="text-zinc-400">📌 Ключ: </span><span className="font-mono bg-[#101921] px-1.5 py-0.5 rounded text-blue-300 font-semibold">ST-101</span></div>
                        <div><span className="text-zinc-400">📝 Назва: </span><span className="text-white font-medium">Налаштування модуля сповіщень Telegram</span></div>
                        <div><span className="text-zinc-400">👤 Автор коментаря: </span><span className="text-white">Олексій Коваленко</span></div>
                        <div className="pt-1"><span className="text-zinc-400">💬 Текст коментаря:</span></div>
                        <div className="p-2 rounded bg-[#101921] border border-zinc-700/40 text-[11px] italic text-zinc-300">
                          «Усі перевірки пройшли успішно, бот стабільно надсилає повідомлення у групу.»
                        </div>
                      </div>
                      <div className="pt-2 border-t border-zinc-700/50">
                        <span className="text-blue-400 hover:text-blue-300 underline cursor-pointer flex items-center gap-1 text-[11px] font-medium">
                          <span>Переглянути коментар у STsup</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    </>
                  )}

                  {telegramPreviewTab === "assignee" && (
                    <>
                      <div className="font-bold text-white text-[13px] flex items-center gap-1.5">
                        <span>🎯 Призначено виконавця в STsup</span>
                      </div>
                      <div className="space-y-1 text-[11px] text-zinc-300">
                        <div><span className="text-zinc-400">📌 Ключ: </span><span className="font-mono bg-[#101921] px-1.5 py-0.5 rounded text-blue-300 font-semibold">ST-101</span></div>
                        <div><span className="text-zinc-400">📝 Назва: </span><span className="text-white font-medium">Налаштування модуля сповіщень Telegram</span></div>
                        <div><span className="text-zinc-400">👤 Новий виконавець: </span><span className="text-emerald-400 font-semibold">Олексій Коваленко</span></div>
                        <div><span className="text-zinc-400">⚡ Пріоритет: </span><span className="text-amber-300">🟡 Середній</span></div>
                        <div><span className="text-zinc-400">👤 Призначив(ла): </span><span className="text-white">Євген Щербак</span></div>
                      </div>
                      <div className="pt-2 border-t border-zinc-700/50">
                        <span className="text-blue-400 hover:text-blue-300 underline cursor-pointer flex items-center gap-1 text-[11px] font-medium">
                          <span>Переглянути задачу в STsup</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Step-by-step Setup Guide */}
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                <span>Як підключити Telegram-бота за 3 кроки</span>
              </h3>

              <div className="space-y-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <strong className="text-foreground">Створіть бота у @BotFather:</strong>
                    <p className="text-[11px] mt-0.5">
                      Відкрийте бота <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary underline">@BotFather</a> в Telegram, надішліть команду <code className="bg-secondary px-1 py-0.5 rounded text-primary">/newbot</code>, вкажіть назву та отримайте API Token.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <strong className="text-foreground">Додайте бота до групи:</strong>
                    <p className="text-[11px] mt-0.5">
                      Створіть групу або канал, додайте створеного бота та призначте його <strong className="text-foreground">адміністратором</strong> із правом публікувати повідомлення.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <strong className="text-foreground">Вкажіть Chat ID та протестуйте:</strong>
                    <p className="text-[11px] mt-0.5">
                      Вставте ID групи (наприклад, через бота <code className="bg-secondary px-1 py-0.5 rounded text-foreground">@RawDataBot</code>, ID починається з <code className="bg-secondary px-1 py-0.5 rounded text-foreground">-100...</code>) і натисніть «Перевірити з&apos;єднання».
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    {/* Tab 4: Audit Log */}
    {activeTab === "audit" && (
      <div className="space-y-4 animate-in fade-in duration-200">
        {/* Controls Card */}
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Журнал аудиту безпеки та дій адміністраторів</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Автоматична фіксація критичних змін: скидання паролів, зміна email, модифікація ролей та оновлення інтеграцій
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Пошук у журналі..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-48 text-xs pl-8 pr-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>

            {/* Filter */}
            <select
              value={auditFilter}
              onChange={(e) => setAuditFilter(e.target.value)}
              className="text-xs py-1.5 px-2.5 rounded-lg bg-secondary/50 border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="all">Усі події</option>
              <option value="USER_PASSWORD_RESET">Скидання паролів</option>
              <option value="USER_EMAIL_UPDATE">Зміна email / логінів</option>
              <option value="USER_ROLE_CHANGE">Зміна ролей</option>
              <option value="USER_CREATE">Створення користувачів</option>
              <option value="USER_DELETE">Видалення користувачів</option>
              <option value="SETTINGS">Системні налаштування</option>
            </select>

            {/* Refresh */}
            <button
              type="button"
              onClick={loadAuditLogs}
              disabled={loadingAudit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-xs font-medium text-foreground transition-all cursor-pointer disabled:opacity-50"
              title="Оновити журнал"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? "animate-spin" : ""}`} />
              <span>Оновити</span>
            </button>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
          {loadingAudit ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              Завантаження журналу аудиту...
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
              <ShieldCheck className="w-8 h-8 mx-auto text-muted-foreground/40" />
              <p>Записи в журналі аудиту відсутні</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/40 border-b border-border text-muted-foreground font-medium">
                  <tr>
                    <th className="py-3 px-4">Час</th>
                    <th className="py-3 px-4">Адміністратор</th>
                    <th className="py-3 px-4">Дія</th>
                    <th className="py-3 px-4">Об&apos;єкт</th>
                    <th className="py-3 px-4">Деталі зміни</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {auditLogs
                    .filter((log) => {
                      if (auditFilter !== "all") {
                        if (auditFilter === "SETTINGS") {
                          if (!log.action.startsWith("SETTINGS_")) return false;
                        } else if (log.action !== auditFilter) {
                          return false;
                        }
                      }
                      if (auditSearch) {
                        const q = auditSearch.toLowerCase();
                        const matchActor =
                          (log.actorName || "").toLowerCase().includes(q) ||
                          (log.actorEmail || "").toLowerCase().includes(q);
                        const matchAction = (log.action || "").toLowerCase().includes(q);
                        const matchTarget = (log.targetId || "").toLowerCase().includes(q);
                        const matchDetails = JSON.stringify(log.details || {}).toLowerCase().includes(q);
                        return matchActor || matchAction || matchTarget || matchDetails;
                      }
                      return true;
                    })
                    .map((log) => {
                      const badge = getAuditBadge(log.action);
                      return (
                        <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString("uk-UA")}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-foreground">{log.actorName}</div>
                            <span className="text-[10px] text-muted-foreground font-mono">{log.actorEmail}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${badge.color}`}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                            <span className="px-1.5 py-0.5 rounded bg-secondary/80 border border-border">
                              {log.targetType}
                              {log.targetId ? `: ${log.targetId}` : ""}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs">
                            {renderAuditDetails(log)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )}
      </main>
    </div>
  );
}
