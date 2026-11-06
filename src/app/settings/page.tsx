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
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

const TASK_TYPE_TABS = [
  { id: "TASK", label: "Задача", icon: CheckSquare, color: "text-blue-400" },
  { id: "BUG", label: "Баг", icon: Bug, color: "text-red-400" },
  { id: "STORY", label: "Історія", icon: Bookmark, color: "text-emerald-400" },
  { id: "IMPROVEMENT", label: "Покращення", icon: Zap, color: "text-violet-400" },
  { id: "SUPPORT", label: "Підтримка", icon: Wrench, color: "text-amber-400" },
];

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activeTab, setActiveTab] = useState<"smtp" | "dictionaries">("smtp");

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

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [meRes, smtpRes, dictRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/settings/smtp"),
        fetch("/api/settings/dictionaries"),
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
      </main>
    </div>
  );
}
