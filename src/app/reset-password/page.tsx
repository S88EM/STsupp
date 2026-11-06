"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Mail,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  User,
  ShieldAlert,
  KeyRound,
} from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  // Token validation state
  const [validatingToken, setValidatingToken] = useState(Boolean(token));
  const [tokenError, setTokenError] = useState<string | null>(!token ? "Токен відновлення пароля відсутній у посиланні." : null);
  const [userName, setUserName] = useState<string>("");
  const [isPrimaryAdminUser, setIsPrimaryAdminUser] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    const checkToken = async () => {
      try {
        setValidatingToken(true);
        setTokenError(null);
        const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token.trim())}`);
        const data = await res.json();

        if (!isMounted) return;

        if (res.ok && data.valid) {
          setEmail(data.email || "");
          setUserName(data.name || "");
          setIsPrimaryAdminUser(Boolean(data.isPrimaryAdmin));
        } else {
          setTokenError(data.error || "Посилання для зміни пароля недійсне або термін його дії закінчився.");
        }
      } catch (err: any) {
        if (!isMounted) return;
        setTokenError(err.message || "Помилка зв'язку із сервером під час перевірки посилання.");
      } finally {
        if (isMounted) {
          setValidatingToken(false);
        }
      }
    };

    checkToken();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleGeneratePassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
    let gen = "";
    for (let i = 0; i < 10; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(gen);
    setConfirmPassword(gen);
    setShowPassword(true);
    setShowConfirmPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Токен відновлення відсутній або недійсний");
      return;
    }

    if (!email.trim()) {
      setError("Email адреса (логін) обов'язкова для заповнення");
      return;
    }

    if (password !== confirmPassword) {
      setError("Паролі не співпадають");
      return;
    }

    if (password.length < 6) {
      setError("Пароль має містити щонайменше 6 символів");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim(),
          newPassword: password,
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не вдалося оновити облікові дані");
        return;
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Помилка зв'язку із сервером");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Brand */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-blue-500/25 mx-auto">
          ST
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Зміна облікових даних
        </h1>
        <p className="text-xs text-muted-foreground">
          Встановіть новий логін та надійний пароль для вашого акаунту
        </p>
      </div>

      {/* Card */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-4">
        {validatingToken ? (
          <div className="text-center py-8 space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground">
              Перевірка безпечного посилання для відновлення...
            </p>
          </div>
        ) : tokenError ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{tokenError}</span>
            </div>

            <div className="text-xs text-muted-foreground leading-relaxed">
              Посилання для скидання пароля дійсне протягом 1 години. Якщо термін дії закінчився, ви можете запросити нове посилання.
            </div>

            <Link
              href="/forgot-password"
              className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-md shadow-primary/20"
            >
              <span>Замовити нове посилання</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="pt-2 border-t border-border/50 text-center">
              <Link href="/login" className="text-xs text-primary hover:underline">
                Повернутися до входу
              </Link>
            </div>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium space-y-2">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>Облікові дані успішно оновлено!</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Новий пароль встановлено. Ви вже авторизовані в системі та можете переходити до роботи.
              </p>
            </div>

            <Link
              href="/"
              className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-md shadow-primary/20"
            >
              <span>Перейти до системи STsup</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {userName && (
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs flex items-center gap-2">
                <User className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  Користувач: <strong className="text-white">{userName}</strong>
                </span>
              </div>
            )}

            {/* Email / Login */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Логін (Email адреса) <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isPrimaryAdminUser}
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-60 disabled:cursor-not-allowed font-mono"
                />
              </div>
              {isPrimaryAdminUser ? (
                <span className="text-[10px] text-amber-400 mt-1 block">
                  ⚠️ Email Головного адміністратора задається у Home Assistant
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  Використовується як логін для входу в систему
                </span>
              )}
            </div>

            {/* New Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Новий пароль <span className="text-destructive">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[10px] text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Згенерувати пароль</span>
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full text-xs pl-9 pr-9 py-2.5 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 block">
                Мінімум 6 символів
              </span>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Підтвердження нового пароля <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`w-full text-xs pl-9 pr-9 py-2.5 rounded-lg bg-secondary/40 border focus:outline-none focus:ring-1 font-mono text-foreground ${
                    confirmPassword && confirmPassword !== password
                      ? "border-destructive focus:ring-destructive"
                      : "border-border focus:ring-primary"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== password && (
                <span className="text-[10px] text-destructive mt-1 block">
                  Паролі не співпадають
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password || password !== confirmPassword}
              className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Збереження даних...</span>
                </>
              ) : (
                <>
                  <span>Зберегти облікові дані та увійти</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 border-t border-border/50 text-center">
              <Link href="/login" className="text-xs text-primary hover:underline">
                Повернутися до входу
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Suspense fallback={<div className="text-xs text-muted-foreground">Завантаження...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
