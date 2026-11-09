"use client";

import React from "react";
import Link from "next/link";
import {
  Settings,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  X,
  Mail,
  Tag,
  Send,
  ShieldCheck,
  Database,
} from "lucide-react";
import { SettingsTab, TelegramStatus } from "./types";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

interface SettingsHeaderProps {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  isSmtpConfigured: boolean;
  telegramStatus: TelegramStatus;
}

export function SettingsHeader({
  activeTab,
  onTabChange,
  isSmtpConfigured,
  telegramStatus,
}: SettingsHeaderProps) {
  const { dict } = useI18n();

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{dict.common.back}</span>
            </Link>
            <span className="text-muted-foreground text-xs">/</span>
            <span className="text-xs font-medium text-foreground">{dict.nav.settings}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-primary" />
            <span>{dict.settings.title}</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Indicator */}
          {activeTab === "telegram" ? (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                telegramStatus.enabled && telegramStatus.hasToken && telegramStatus.chatId
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : telegramStatus.enabled
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  : "bg-secondary text-muted-foreground border-border"
              }`}
            >
              {telegramStatus.enabled && telegramStatus.hasToken && telegramStatus.chatId ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{dict.settings.telegramActive}</span>
                </>
              ) : telegramStatus.enabled ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>{dict.settings.telegramNeedsSetup}</span>
                </>
              ) : (
                <>
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{dict.settings.telegramDisabled}</span>
                </>
              )}
            </span>
          ) : (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                isSmtpConfigured
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              }`}
            >
              {isSmtpConfigured ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{dict.settings.smtpActive}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>{dict.settings.smtpSimulation}</span>
                </>
              )}
            </span>
          )}

          {/* Quick Language Toggle */}
          <LanguageSwitcher variant="toggle" />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto">
        <button
          type="button"
          onClick={() => onTabChange("smtp")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "smtp"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>{dict.settings.tabSmtp}</span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange("dictionaries")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "dictionaries"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>{dict.settings.tabDictionaries}</span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange("telegram")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "telegram"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Send className="w-4 h-4" />
          <span>{dict.settings.tabTelegram}</span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange("audit")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "audit"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>{dict.settings.tabAudit}</span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange("backup")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "backup"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>{dict.settings.tabBackup}</span>
        </button>
      </div>
    </div>
  );
}
