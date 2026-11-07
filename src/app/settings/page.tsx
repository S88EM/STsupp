"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import {
  SettingsHeader,
  SmtpSettingsTab,
  DictionariesSettingsTab,
  TelegramSettingsTab,
  AuditLogSettingsTab,
  SettingsTab,
  TelegramStatus,
} from "@/components/settings";

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SettingsTab>("smtp");
  const [isSmtpConfigured, setIsSmtpConfigured] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatus>({
    enabled: false,
    hasToken: false,
    chatId: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "audit" || tab === "smtp" || tab === "dictionaries" || tab === "telegram") {
        setActiveTab(tab as SettingsTab);
      }
    }

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [meRes, smtpRes, tgRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/settings/smtp"),
          fetch("/api/settings/telegram"),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          setCurrentUser(meData.user);
        }

        if (smtpRes.ok) {
          const smtpData = await smtpRes.json();
          setIsSmtpConfigured(Boolean(smtpData.isConfigured));
        }

        if (tgRes.ok) {
          const tgData = await tgRes.json();
          setTelegramStatus({
            enabled: Boolean(tgData.isEnabled),
            hasToken: Boolean(tgData.hasBotToken),
            chatId: tgData.chatId || "",
          });
        }
      } catch (err) {
        console.error("Failed to load initial settings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
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
        <SettingsHeader
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isSmtpConfigured={isSmtpConfigured}
          telegramStatus={telegramStatus}
        />

        <div className={activeTab === "smtp" ? "block" : "hidden"}>
          <SmtpSettingsTab
            currentUserEmail={currentUser?.email}
            onStatusChange={setIsSmtpConfigured}
          />
        </div>

        <div className={activeTab === "dictionaries" ? "block" : "hidden"}>
          <DictionariesSettingsTab />
        </div>

        <div className={activeTab === "telegram" ? "block" : "hidden"}>
          <TelegramSettingsTab
            onStatusChange={setTelegramStatus}
          />
        </div>

        <div className={activeTab === "audit" ? "block" : "hidden"}>
          <AuditLogSettingsTab isActive={activeTab === "audit"} />
        </div>
      </main>
    </div>
  );
}
