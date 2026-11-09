"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Lock, Mail, AlertCircle, CheckCircle, Send, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const verifiedParam = searchParams.get("verified");
  const { dict } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needVerification, setNeedVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || loading) return;

    try {
      setLoading(true);
      setError(null);
      setNeedVerification(false);
      setResendMessage(null);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Невірний email або пароль");
        if (data.needVerification) {
          setNeedVerification(true);
        }
        return;
      }

      // Successful login - determine landing page based on role if no custom redirect
      let targetUrl = redirect && redirect !== "/login" ? redirect : "/";
      if (!redirect || redirect === "/" || redirect === "/login") {
        if (data.user?.role === "CLIENT") {
          targetUrl = "/portal";
        } else if (data.user?.role === "ADMIN" || data.user?.role === "ENGINEER") {
          targetUrl = "/projects/all";
          try {
            sessionStorage.setItem("stsup_active_project_id", "all");
          } catch (e) {}
        }
      }
      window.location.href = targetUrl;
    } catch (err: any) {
      setError(err.message || "Помилка зв'язку із сервером");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim() || resendLoading) return;
    try {
      setResendLoading(true);
      setResendMessage(null);
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      setResendMessage(data.message || dict.auth.verificationSent);
    } catch (err: any) {
      setError(err.message || "Помилка відправки листа");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Top bar with Language Switcher */}
      <div className="flex items-center justify-between">
        <div className="w-9 h-9" />
        <LanguageSwitcher variant="toggle" />
      </div>

      {/* Brand */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-blue-500/25 mx-auto">
          ST
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {dict.auth.loginTitle}
        </h1>
        <p className="text-xs text-muted-foreground">
          {dict.auth.loginSubtitle}
        </p>
      </div>

      {/* Card */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-4">
        {verifiedParam && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{dict.auth.emailConfirmedSuccess}</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>

            {needVerification && (
              <div className="pt-2 border-t border-destructive/20">
                {resendMessage ? (
                  <span className="text-[11px] text-emerald-400 block">{resendMessage}</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="text-[11px] underline hover:text-white flex items-center gap-1 transition-colors"
                  >
                    {resendLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                    <span>{dict.auth.resendVerification}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              {dict.auth.email}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted-foreground">
                {dict.auth.password}
              </label>
              <Link
                href="/forgot-password"
                className="text-[11px] text-primary hover:underline"
              >
                {dict.auth.forgotPassword}
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? dict.auth.checking : dict.auth.loginBtn}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground">
        {dict.auth.noAccount}{" "}
        <Link href="/register" className="text-primary hover:underline font-semibold">
          {dict.auth.registerLink}
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Suspense fallback={<div className="text-xs text-muted-foreground">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
