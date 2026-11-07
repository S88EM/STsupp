"use client";

import React, { useState, useEffect } from "react";
import {
  Send,
  Bot,
  CheckSquare,
  CheckCircle2,
  AlertTriangle,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  MessageSquare,
  ExternalLink,
  Info,
} from "lucide-react";
import { TelegramEventsConfig, TelegramStatus } from "./types";

interface TelegramSettingsTabProps {
  onStatusChange?: (status: TelegramStatus) => void;
}

export function TelegramSettingsTab({ onStatusChange }: TelegramSettingsTabProps) {
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramMaskedToken, setTelegramMaskedToken] = useState("");
  const [hasSavedTelegramToken, setHasSavedTelegramToken] = useState(false);
  const [showTelegramToken, setShowTelegramToken] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramEvents, setTelegramEvents] = useState<TelegramEventsConfig>({
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

  useEffect(() => {
    const fetchTelegramData = async () => {
      try {
        const res = await fetch("/api/settings/telegram");
        if (res.ok) {
          const tgData = await res.json();
          const enabled = Boolean(tgData.isEnabled);
          const hasToken = Boolean(tgData.hasBotToken);
          const chatId = tgData.chatId || "";
          setTelegramEnabled(enabled);
          setTelegramChatId(chatId);
          setHasSavedTelegramToken(hasToken);
          setTelegramMaskedToken(tgData.maskedBotToken || "");
          if (tgData.events) {
            setTelegramEvents({
              taskCreated: tgData.events.taskCreated !== undefined ? Boolean(tgData.events.taskCreated) : true,
              statusChanged: tgData.events.statusChanged !== undefined ? Boolean(tgData.events.statusChanged) : true,
              commentAdded: tgData.events.commentAdded !== undefined ? Boolean(tgData.events.commentAdded) : true,
              assigneeChanged: tgData.events.assigneeChanged !== undefined ? Boolean(tgData.events.assigneeChanged) : true,
            });
          }
          onStatusChange?.({ enabled, hasToken, chatId });
        }
      } catch (err) {
        console.error("Failed to load Telegram settings:", err);
      }
    };

    fetchTelegramData();
  }, []);

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

      const enabled = Boolean(data.config?.isEnabled);
      const chatId = data.config?.chatId || "";
      const hasToken = Boolean(data.config?.hasBotToken);

      setTelegramEnabled(enabled);
      setTelegramChatId(chatId);
      setHasSavedTelegramToken(hasToken);
      setTelegramMaskedToken(data.config?.maskedBotToken || "");
      setTelegramBotToken("");

      onStatusChange?.({ enabled, hasToken, chatId });

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

  return (
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
              {/* Trigger 1: Task Created */}
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

              {/* Trigger 2: Status Changed */}
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

              {/* Trigger 3: New Comment */}
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

              {/* Trigger 4: Assignee Changed */}
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
  );
}
