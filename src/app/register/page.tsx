"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, Mail, User, AlertCircle, CheckCircle, ExternalLink, MapPin } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

export default function RegisterPage() {
  const { dict } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !city.trim() || !password || loading) return;

    if (password !== confirmPassword) {
      setError(dict.auth.confirmPasswordPlaceholder);
      return;
    }

    if (password.length < 6) {
      setError(dict.auth.passwordMinChars);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), city: city.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Помилка при реєстрації");
        return;
      }

      if (data.needVerification) {
        setRegisteredSuccess(true);
        setSuccessMessage(data.message || dict.auth.verificationSent);
        if (data.previewUrl) {
          setPreviewUrl(data.previewUrl);
        }
      } else {
        // First user (Admin) auto-login
        window.location.href = "/";
      }
    } catch (err: any) {
      setError(err.message || "Помилка зв'язку із сервером");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
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
            {dict.auth.registerTitle}
          </h1>
          <p className="text-xs text-muted-foreground">
            {dict.auth.loginSubtitle}
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {registeredSuccess ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400" />
                  <span>{dict.auth.verificationSent}</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {email}
                </p>
              </div>

              {previewUrl && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-1.5">
                  <span className="text-[11px] font-semibold text-blue-400 block">
                    SMTP Simulation:
                  </span>
                  <Link
                    href={previewUrl}
                    className="text-xs text-primary hover:underline break-all inline-flex items-center gap-1"
                  >
                    <span>{dict.auth.loginBtn}</span>
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  </Link>
                </div>
              )}

              <Link
                href="/login"
                className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-md shadow-primary/20"
              >
                <span>{dict.auth.goToLogin}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {dict.auth.name}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={dict.auth.namePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>

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
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {dict.auth.city} <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={dict.auth.cityPlaceholder}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {dict.auth.password}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder={dict.auth.passwordMinChars}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  {dict.auth.confirmPassword}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder={dict.auth.confirmPasswordPlaceholder}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                <span>{loading ? dict.auth.creating : dict.auth.createAccountBtn}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        {!registeredSuccess && (
          <div className="text-center text-xs text-muted-foreground">
            {dict.auth.haveAccount}{" "}
            <Link href="/login" className="text-primary hover:underline font-semibold">
              {dict.auth.loginBtn}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
