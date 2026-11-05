"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, AlertCircle, ArrowRight, Mail, Loader2, Send } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const errorParam = searchParams.get("error");
  const successParam = searchParams.get("success");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "idle">(
    successParam ? "success" : token ? "loading" : errorParam ? "error" : "idle"
  );
  const [message, setMessage] = useState<string>(
    errorParam === "expired"
      ? "Термін дії посилання закінчився. Замовте новий лист підтвердження."
      : errorParam
      ? "Посилання для підтвердження недійсне."
      : ""
  );
  const [emailToResend, setEmailToResend] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [resendPreviewUrl, setResendPreviewUrl] = useState<string | null>(null);

  const isVerifyingRef = useRef(false);
  const verifiedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token || successParam) {
      if (!token && !errorParam && !successParam) {
        setStatus("idle");
      }
      return;
    }

    if (verifiedTokenRef.current === token || isVerifyingRef.current) {
      return;
    }
    isVerifyingRef.current = true;

    const verifyToken = async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: token.trim() }),
        });

        const data = await res.json();
        verifiedTokenRef.current = token;

        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Вашу пошту успішно підтверджено!");
        } else {
          setStatus("error");
          setMessage(data.error || "Недійсне або прострочене посилання підтвердження.");
        }
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Помилка зв'язку із сервером.");
      } finally {
        isVerifyingRef.current = false;
      }
    };

    verifyToken();
  }, [token, successParam, errorParam]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailToResend.trim() || resendLoading) return;

    try {
      setResendLoading(true);
      setResendSuccess(null);
      setResendPreviewUrl(null);

      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToResend.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.alreadyVerified) {
          setStatus("success");
          setMessage(data.message || "Цей обліковий запис уже підтверджено. Ви можете увійти до системи.");
        } else {
          setResendSuccess(data.message || "Лист надіслано на вашу пошту.");
          if (data.previewUrl) {
            setResendPreviewUrl(data.previewUrl);
          }
        }
      } else {
        setMessage(data.error || "Не вдалося надіслати лист.");
      }
    } catch (err: any) {
      setMessage(err.message || "Помилка сервера.");
    } finally {
      setResendLoading(false);
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
          Активація акаунту
        </h1>
        <p className="text-xs text-muted-foreground">
          Підтвердження електронної пошти для роботи в STsup
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-5">
        {status === "loading" && (
          <div className="text-center py-8 space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground">
              Перевірка безпечного токена підтвердження...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium space-y-2">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>Email успішно підтверджено!</span>
              </div>
              <p className="text-slate-300">
                {message || "Ваш обліковий запис активовано. Тепер ви можете увійти до системи."}
              </p>
            </div>

            <Link
              href="/"
              className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-md shadow-primary/20"
            >
              <span>Перейти до роботи в STsup</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {(status === "error" || status === "idle") && (
          <div className="space-y-4">
            {status === "error" && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              {status === "error"
                ? "Введіть вашу email адресу, щоб отримати нове посилання для активації:"
                : "Введіть вашу пошту для відправки листа з підтвердженням:"}
            </div>

            {resendSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{resendSuccess}</span>
              </div>
            )}

            {resendPreviewUrl && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-1.5">
                <span className="text-[11px] font-semibold text-blue-400 block">
                  Тестове посилання (SMTP симуляція):
                </span>
                <Link
                  href={resendPreviewUrl}
                  className="text-xs text-primary hover:underline break-all block"
                >
                  {resendPreviewUrl}
                </Link>
              </div>
            )}

            <form onSubmit={handleResend} className="space-y-3">
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={emailToResend}
                  onChange={(e) => setEmailToResend(e.target.value)}
                  required
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg bg-secondary/40 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60"
                />
              </div>

              <button
                type="submit"
                disabled={resendLoading}
                className="w-full py-2.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold border border-border flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {resendLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Надіслати лист повторно</span>
              </button>
            </form>

            <div className="pt-2 border-t border-border/50 text-center">
              <Link href="/login" className="text-xs text-primary hover:underline">
                Повернутися до входу
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Suspense fallback={<div className="text-xs text-muted-foreground">Завантаження...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
