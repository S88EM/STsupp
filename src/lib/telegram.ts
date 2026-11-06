import fs from "fs";
import path from "path";
import { getAppUrl } from "@/lib/email";

export interface TelegramEventsConfig {
  taskCreated: boolean;
  statusChanged?: boolean;
  commentAdded?: boolean;
  assigneeChanged?: boolean;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  isEnabled: boolean;
  events: TelegramEventsConfig;
}

export const DEFAULT_TELEGRAM_CONFIG: TelegramConfig = {
  botToken: "",
  chatId: "",
  isEnabled: false,
  events: {
    taskCreated: true,
    statusChanged: false,
    commentAdded: false,
    assigneeChanged: false,
  },
};

function getTelegramConfigFilePath(): string {
  if (fs.existsSync("/data")) {
    return "/data/telegram.json";
  }
  return path.join(process.cwd(), "data", "telegram.json");
}

export function maskBotToken(token: string): string {
  if (!token) return "";
  const trimmed = token.trim();
  if (trimmed.length <= 10) return "••••••••";
  return `${trimmed.substring(0, 4)}••••••••${trimmed.slice(-4)}`;
}

export function escapeHtml(text: string): string {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function getTelegramConfig(): TelegramConfig {
  let savedConfig: any = {};
  const configPath = getTelegramConfigFilePath();
  try {
    if (fs.existsSync(configPath)) {
      savedConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    }
  } catch (e) {
    // ignore
  }

  let haOptions: any = {};
  try {
    if (fs.existsSync("/data/options.json")) {
      haOptions = JSON.parse(fs.readFileSync("/data/options.json", "utf8"));
    }
  } catch (e) {
    // ignore
  }

  const botToken = (
    savedConfig.botToken ||
    process.env.TELEGRAM_BOT_TOKEN ||
    haOptions.telegram_bot_token ||
    ""
  ).trim();

  const chatId = (
    savedConfig.chatId ||
    process.env.TELEGRAM_CHAT_ID ||
    haOptions.telegram_chat_id ||
    ""
  ).trim();

  const isEnabled =
    savedConfig.isEnabled !== undefined
      ? Boolean(savedConfig.isEnabled)
      : process.env.TELEGRAM_ENABLED !== undefined
      ? process.env.TELEGRAM_ENABLED === "true" || process.env.TELEGRAM_ENABLED === "1"
      : haOptions.telegram_enabled !== undefined
      ? Boolean(haOptions.telegram_enabled)
      : false;

  const events: TelegramEventsConfig = {
    taskCreated:
      savedConfig.events?.taskCreated !== undefined
        ? Boolean(savedConfig.events.taskCreated)
        : DEFAULT_TELEGRAM_CONFIG.events.taskCreated,
    statusChanged: Boolean(savedConfig.events?.statusChanged),
    commentAdded: Boolean(savedConfig.events?.commentAdded),
    assigneeChanged: Boolean(savedConfig.events?.assigneeChanged),
  };

  return {
    botToken,
    chatId,
    isEnabled,
    events,
  };
}

export function saveTelegramConfig(newCfg: {
  botToken?: string;
  chatId?: string;
  isEnabled?: boolean;
  events?: Partial<TelegramEventsConfig>;
}): TelegramConfig {
  const current = getTelegramConfig();
  const filePath = getTelegramConfigFilePath();
  const dir = path.dirname(filePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let updatedToken = current.botToken;
  if (newCfg.botToken !== undefined && newCfg.botToken.trim() !== "") {
    // If user didn't send masked string
    if (!newCfg.botToken.includes("•")) {
      updatedToken = newCfg.botToken.trim();
    }
  }

  const updated: TelegramConfig = {
    botToken: updatedToken,
    chatId: newCfg.chatId !== undefined ? newCfg.chatId.trim() : current.chatId,
    isEnabled: newCfg.isEnabled !== undefined ? Boolean(newCfg.isEnabled) : current.isEnabled,
    events: {
      taskCreated:
        newCfg.events?.taskCreated !== undefined
          ? Boolean(newCfg.events.taskCreated)
          : current.events.taskCreated,
      statusChanged:
        newCfg.events?.statusChanged !== undefined
          ? Boolean(newCfg.events.statusChanged)
          : Boolean(current.events.statusChanged),
      commentAdded:
        newCfg.events?.commentAdded !== undefined
          ? Boolean(newCfg.events.commentAdded)
          : Boolean(current.events.commentAdded),
      assigneeChanged:
        newCfg.events?.assigneeChanged !== undefined
          ? Boolean(newCfg.events.assigneeChanged)
          : Boolean(current.events.assigneeChanged),
    },
  };

  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), "utf8");
  return updated;
}

export async function sendTelegramMessage({
  botToken,
  chatId,
  text,
}: {
  botToken?: string;
  chatId?: string;
  text: string;
}): Promise<{ ok: boolean; messageId?: number; description?: string }> {
  const cfg = getTelegramConfig();
  const token = (botToken || cfg.botToken).trim();
  const targetChatId = (chatId || cfg.chatId).trim();

  if (!token) {
    return { ok: false, description: "Токен Telegram-бота не налаштовано" };
  }
  if (!targetChatId) {
    return { ok: false, description: "ID цільової групи або чату не вказано" };
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: targetChatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        description: data.description || `Помилка Telegram API (HTTP ${res.status})`,
      };
    }

    return {
      ok: true,
      messageId: data.result?.message_id,
    };
  } catch (err: any) {
    if (err.name === "AbortError") {
      return { ok: false, description: "Таймаут підключення до Telegram Bot API (10 с)" };
    }
    return { ok: false, description: err.message || "Помилка зв'язку з сервером Telegram" };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function testTelegramConnection({
  botToken,
  chatId,
}: {
  botToken?: string;
  chatId?: string;
}): Promise<{ ok: boolean; description?: string }> {
  const cfg = getTelegramConfig();
  const token = (botToken || cfg.botToken).trim();
  const targetChatId = (chatId || cfg.chatId).trim();

  if (!token) {
    return { ok: false, description: "Вкажіть токен бота (Bot Token) для тестування" };
  }
  if (!targetChatId) {
    return { ok: false, description: "Вкажіть Chat ID / Group ID для перевірки з'єднання" };
  }

  const testMessage = [
    `🔔 <b>Тестове сповіщення STsup</b>`,
    ``,
    `✅ З'єднання з Telegram Bot API успішно встановлено!`,
    `Бот має права на публікацію повідомлень у цій групі.`,
    ``,
    `⏱ <i>Час: ${new Date().toLocaleString("uk-UA")}</i>`,
  ].join("\n");

  return await sendTelegramMessage({
    botToken: token,
    chatId: targetChatId,
    text: testMessage,
  });
}

export async function notifyTelegramTaskCreated({
  task,
  project,
  creator,
  origin,
}: {
  task: {
    id: string;
    code: string;
    title: string;
    priority: string;
    aiContext?: any;
  };
  project: {
    id: string;
    name: string;
    key: string;
  };
  creator: {
    name?: string | null;
  };
  origin?: string;
}): Promise<{ sent: boolean; reason?: string }> {
  try {
    const cfg = getTelegramConfig();
    if (!cfg.isEnabled) {
      return { sent: false, reason: "Telegram сповіщення вимкнено" };
    }
    if (!cfg.events.taskCreated) {
      return { sent: false, reason: "Тригер 'Створення задачі' вимкнено" };
    }
    if (!cfg.botToken || !cfg.chatId) {
      return { sent: false, reason: "Не налаштовано токен бота або ID групи" };
    }

    // Determine type label and icon
    const typeKey = (task.aiContext?.type || "").toUpperCase();
    let typeLabel = "📋 Задача";
    if (typeKey === "BUG") typeLabel = "🐞 Баг";
    else if (typeKey === "STORY") typeLabel = "📖 Історія";
    else if (typeKey === "IMPROVEMENT") typeLabel = "⚡ Покращення";
    else if (typeKey === "SUPPORT") typeLabel = "🛠 Підтримка";
    else {
      const lower = task.title.toLowerCase();
      if (lower.startsWith("bug:") || lower.includes("помилка") || lower.includes("баг")) {
        typeLabel = "🐞 Баг";
      }
    }

    // Determine priority label
    let priorityLabel = "🟡 Середній";
    const p = (task.priority || "").toUpperCase();
    if (p === "URGENT") priorityLabel = "🔴 Терміновий";
    else if (p === "HIGH") priorityLabel = "🟠 Високий";
    else if (p === "LOW") priorityLabel = "🟢 Низький";

    // Determine baseUrl
    let baseUrl =
      origin && origin.startsWith("http") && !origin.includes("localhost") && !origin.includes("127.0.0.1")
        ? origin.replace(/\/+$/, "")
        : getAppUrl();
    const taskUrl = `${baseUrl}/projects/${project.id}?taskId=${task.id}`;

    const creatorName = creator.name?.trim() || "Користувач системи";

    const lines = [
      `🚀 <b>Нова задача в STsup</b>`,
      ``,
      `📌 <b>Ключ:</b> <code>${escapeHtml(task.code)}</code>`,
      `📝 <b>Назва:</b> ${escapeHtml(task.title)}`,
      `📂 <b>Проєкт:</b> ${escapeHtml(project.name)} (<code>${escapeHtml(project.key)}</code>)`,
      `🏷 <b>Тип:</b> ${typeLabel}`,
      `⚡ <b>Пріоритет:</b> ${priorityLabel}`,
      `👤 <b>Автор:</b> ${escapeHtml(creatorName)}`,
    ];

    const components = Array.isArray(task.aiContext?.components) ? task.aiContext.components : [];
    if (components.length > 0) {
      lines.push(`🧩 <b>Компоненти:</b> ${components.map((c: string) => escapeHtml(c)).join(", ")}`);
    }

    const labels = Array.isArray(task.aiContext?.labels) ? task.aiContext.labels : [];
    if (labels.length > 0) {
      lines.push(`🏷️ <b>Мітки:</b> ${labels.map((l: string) => `<code>#${escapeHtml(l)}</code>`).join(" ")}`);
    }

    lines.push(``);
    lines.push(`🔗 <a href="${taskUrl}">Переглянути задачу в STsup</a>`);

    const result = await sendTelegramMessage({
      botToken: cfg.botToken,
      chatId: cfg.chatId,
      text: lines.join("\n"),
    });

    if (!result.ok) {
      console.error("[Telegram Notification Error]", result.description);
      return { sent: false, reason: result.description };
    }

    return { sent: true };
  } catch (error: any) {
    console.error("[Telegram Notification Exception]", error);
    return { sent: false, reason: error.message };
  }
}
