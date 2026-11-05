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
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // SMTP Settings
  const [host, setHost] = useState("");
  const [port, setPort] = useState<number>(587);
  const [secure, setSecure] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [hasSavedPass, setHasSavedPass] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [from, setFrom] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);

  // Test email
  const [testEmail, setTestEmail] = useState("");
  const [testSuccess, setTestSuccess] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [meRes, smtpRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/settings/smtp"),
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
        setIsConfigured(Boolean(smtpData.isConfigured));
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
      </main>
    </div>
  );
}
