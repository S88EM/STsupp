import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

export interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  appUrl?: string;
  isEnabled?: boolean;
}

function getSmtpConfigFilePath(): string {
  if (fs.existsSync("/data")) {
    return "/data/smtp.json";
  }
  return path.join(process.cwd(), "data", "smtp.json");
}

// Read configuration from persistent config (/data/smtp.json), environment (.env) or Home Assistant options (/data/options.json)
export function getMailConfig(): MailConfig {
  let savedConfig: any = {};
  const configPath = getSmtpConfigFilePath();
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

  const host = (savedConfig.host || process.env.SMTP_HOST || haOptions.smtp_host || "").trim();
  const secureRaw = savedConfig.secure !== undefined
    ? Boolean(savedConfig.secure)
    : process.env.SMTP_SECURE !== undefined
    ? (process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1")
    : Boolean(haOptions.smtp_secure);

  const defaultPort = secureRaw ? 465 : 587;
  const port = Number(savedConfig.port || process.env.SMTP_PORT || haOptions.smtp_port || defaultPort);
  const secure = secureRaw || port === 465;

  const user = (savedConfig.user || process.env.SMTP_USER || haOptions.smtp_user || "").trim();
  const pass = (savedConfig.pass || process.env.SMTP_PASS || process.env.SMTP_PASSWORD || haOptions.smtp_password || "").trim();
  const from = (savedConfig.from || process.env.SMTP_FROM || haOptions.smtp_from || '"STsup" <no-reply@stsup.local>').trim();
  const appUrl = (savedConfig.appUrl || process.env.APP_URL || haOptions.app_url || "").trim();

  const isEnabled = savedConfig.isEnabled !== undefined
    ? Boolean(savedConfig.isEnabled)
    : process.env.SMTP_ENABLED !== undefined
    ? (process.env.SMTP_ENABLED === "true" || process.env.SMTP_ENABLED === "1")
    : haOptions.smtp_enabled !== undefined
    ? Boolean(haOptions.smtp_enabled)
    : true;

  return { host, port, secure, user, pass, from, appUrl, isEnabled };
}


let cachedTransporter: any = null;
let lastTransporterConfigKey = "";

export function getTransporter(cfg: MailConfig): any {
  const configKey = `${cfg.host}:${cfg.port}:${cfg.secure}:${cfg.user}:${cfg.pass}`;
  if (cachedTransporter && lastTransporterConfigKey === configKey) {
    return cachedTransporter;
  }
  cachedTransporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
    pool: true,
    maxConnections: 3,
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  lastTransporterConfigKey = configKey;
  return cachedTransporter;
}

export function saveMailConfig(newCfg: Partial<MailConfig>): MailConfig {
  const current = getMailConfig();
  const updated: MailConfig = {
    host: (newCfg.host !== undefined ? newCfg.host : current.host).trim(),
    port: Number(newCfg.port !== undefined ? newCfg.port : current.port) || 587,
    secure: newCfg.secure !== undefined ? Boolean(newCfg.secure) : current.secure,
    user: (newCfg.user !== undefined ? newCfg.user : current.user).trim(),
    pass: newCfg.pass !== undefined && newCfg.pass !== "" ? newCfg.pass.trim() : current.pass,
    from: (newCfg.from !== undefined && newCfg.from.trim() ? newCfg.from.trim() : current.from).trim(),
    appUrl: newCfg.appUrl !== undefined ? newCfg.appUrl.trim() : current.appUrl,
    isEnabled: newCfg.isEnabled !== undefined ? Boolean(newCfg.isEnabled) : (current.isEnabled ?? true),
  };

  const configPath = getSmtpConfigFilePath();
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(updated, null, 2), "utf8");
  cachedTransporter = null;
  lastTransporterConfigKey = "";
  return updated;
}

/**
 * Returns the effective base URL of the STsup application for links in emails and notifications.
 * Priority:
 * 1. Configured appUrl in /data/smtp.json or Home Assistant options (/data/options.json)
 * 2. APP_URL environment variable
 * 3. Incoming request headers (Origin, Host, X-Forwarded-Host)
 * 4. NEXTAUTH_URL or fallback
 */
export function getAppUrl(req?: Request): string {
  // 1. Check configured appUrl
  const cfg = getMailConfig();
  if (cfg.appUrl && cfg.appUrl.trim()) {
    return cfg.appUrl.trim().replace(/\/+$/, "");
  }

  // 2. Check APP_URL env variable
  if (process.env.APP_URL && process.env.APP_URL.trim()) {
    return process.env.APP_URL.trim().replace(/\/+$/, "");
  }

  // 3. Check incoming request headers
  if (req) {
    const forwardedProto = req.headers.get("x-forwarded-proto") || "http";
    const forwardedHost = req.headers.get("x-forwarded-host");
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");

    if (forwardedHost && !forwardedHost.includes("localhost") && !forwardedHost.includes("127.0.0.1")) {
      return `${forwardedProto}://${forwardedHost}`.replace(/\/+$/, "");
    }
    if (origin && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
      return origin.trim().replace(/\/+$/, "");
    }
    if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
      return `${forwardedProto}://${host}`.replace(/\/+$/, "");
    }
    if (origin) {
      return origin.trim().replace(/\/+$/, "");
    }
    if (host) {
      return `${forwardedProto}://${host}`.replace(/\/+$/, "");
    }
  }

  // 4. Fallback to NEXTAUTH_URL or localhost
  return (process.env.NEXTAUTH_URL || "http://localhost:3000").trim().replace(/\/+$/, "");
}

export async function testMailConnection(testEmail?: string, customCfg?: Partial<MailConfig>) {
  const current = getMailConfig();
  const cfg: MailConfig = {
    host: customCfg?.host?.trim() || current.host,
    port: Number(customCfg?.port) || current.port,
    secure: customCfg?.secure !== undefined ? customCfg.secure : current.secure,
    user: customCfg?.user !== undefined ? customCfg.user.trim() : current.user,
    pass: customCfg?.pass !== undefined && customCfg.pass !== "" ? customCfg.pass.trim() : current.pass,
    from: customCfg?.from?.trim() || current.from,
  };

  if (!cfg.host) {
    throw new Error("SMTP сервер (хост) обов'язковий для перевірки");
  }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  await transporter.verify();

  if (testEmail) {
    await transporter.sendMail({
      from: cfg.from,
      to: testEmail,
      subject: "STsup — Перевірка роботи поштового сервісу (SMTP)",
      text: `Вітаємо!\n\nЦе тестове повідомлення з системи STsup.\nВаш поштовий сервер (${cfg.host}:${cfg.port}) успішно налаштований та працює належним чином.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; padding: 24px; border: 1px solid #334155; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
          <h2 style="color: #38bdf8; margin-top: 0;">✓ Поштовий сервіс STsup успішно налаштовано</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5;">
            Вітаємо! Це тестове повідомлення підтверджує, що конфігурація SMTP сервера працює належним чином.
          </p>
          <div style="background-color: #1e293b; border-radius: 8px; padding: 14px; margin: 16px 0; font-size: 13px; color: #94a3b8; border: 1px solid #334155;">
            <div style="margin-bottom: 6px;"><strong style="color: #f1f5f9;">Сервер (Хост):</strong> ${cfg.host}</div>
            <div style="margin-bottom: 6px;"><strong style="color: #f1f5f9;">Порт:</strong> ${cfg.port}</div>
            <div style="margin-bottom: 6px;"><strong style="color: #f1f5f9;">Захищене з'єднання:</strong> ${cfg.secure ? "SSL/TLS (порт 465)" : "STARTTLS / Звичайне"}</div>
            <div><strong style="color: #f1f5f9;">Відправник:</strong> ${cfg.from}</div>
          </div>
          <p style="color: #64748b; font-size: 11px; margin-bottom: 0;">
            Згенеровано системою STsup Support Tracker.
          </p>
        </div>
      `,
    });
  }

  return { success: true, host: cfg.host, port: cfg.port };
}

export function isMailEnabled(): boolean {
  const cfg = getMailConfig();
  return Boolean(cfg.host && cfg.from && cfg.isEnabled !== false);
}

export function isMailConfigured(): boolean {
  const cfg = getMailConfig();
  if (!cfg.host) return false;
  // If a username is provided, password should be present as well
  if (cfg.user && !cfg.pass) return false;
  return true;
}

export async function sendMail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const cfg = getMailConfig();

  if (!isMailConfigured()) {
    console.log(`\n================== [STsup Email Simulation] ==================`);
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`BODY (Plain text):\n${text || html.replace(/<[^>]+>/g, " ").trim()}`);
    console.log(`==============================================================\n`);
    return { success: true, simulated: true };
  }

  if (!isMailEnabled()) {
    console.log(`[STsup Email] Notifications are currently disabled in settings. Skipping email to ${to}`);
    return { success: true, disabled: true, simulated: true };
  }

  try {
    const transporter = getTransporter(cfg);

    const info = await transporter.sendMail({
      from: cfg.from,
      to,
      subject,
      text: text || html.replace(/<[^>]+>/g, " ").trim(),
      html,
    });

    console.log(`[STsup Email] Message sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[STsup Email Error] Failed to send email to ${to}:`, error);
    return { success: false, error };
  }
}

// ---------------------------------------------------------------------------
// HTML Layout Wrapper
// ---------------------------------------------------------------------------
function renderEmailShell({
  title,
  preheader,
  content,
}: {
  title: string;
  preheader?: string;
  content: string;
}) {
  return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9; }
    .container { max-width: 580px; margin: 32px auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4); }
    .header { padding: 24px; text-align: center; border-bottom: 1px solid #334155; background-color: #0f172a; }
    .logo-badge { display: inline-block; width: 40px; height: 40px; line-height: 40px; border-radius: 10px; background: linear-gradient(135deg, #2563eb, #4f46e5); color: #ffffff; font-weight: 800; font-size: 18px; margin-bottom: 8px; }
    .body { padding: 32px 28px; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; text-align: center; margin: 20px 0; }
    .footer { padding: 20px 28px; border-top: 1px solid #334155; background-color: #0f172a; text-align: center; font-size: 11px; color: #64748b; line-height: 1.5; }
    .task-badge { display: inline-block; font-size: 12px; font-weight: 700; color: #38bdf8; background-color: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 6px; padding: 3px 8px; font-family: monospace; }
  </style>
</head>
<body>
  ${preheader ? `<span style="display:none;font-size:0px;color:transparent;">${preheader}</span>` : ""}
  <div class="container">
    <div class="header">
      <div class="logo-badge">ST</div>
      <div style="font-size: 16px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">STsup</div>
      <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">Система управління задачами та підтримкою</div>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      Це автоматичне сповіщення системи STsup. Будь ласка, не відповідайте на цей лист.<br>
      © ${new Date().getFullYear()} STsup
    </div>
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// 1. Email Verification
// ---------------------------------------------------------------------------
export async function sendVerificationEmail({
  to,
  name,
  verificationUrl,
}: {
  to: string;
  name: string;
  verificationUrl: string;
}) {
  const subject = "Підтвердження реєстрації — STsup";
  const content = `
    <h2 style="color: #ffffff; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">
      Підтвердження вашої електронної адреси
    </h2>
    <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
      Вітаємо, <strong>${name}</strong>! Дякуємо за реєстрацію в системі STsup.
    </p>
    <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
      Для завершення реєстрації та активації вашого облікового запису, будь ласка, натисніть кнопку нижче для підтвердження email:
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${verificationUrl}" class="btn">Підтвердити Email</a>
    </div>
    <p style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
      Якщо кнопка не спрацьовує, скопіюйте посилання та відкрийте його у браузері:<br>
      <a href="${verificationUrl}" style="color: #38bdf8; word-break: break-all;">${verificationUrl}</a>
    </p>
    <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
      Посилання дійсне протягом 24 годин. Якщо ви не реєструвалися в STsup, просто проігноруйте цей лист.
    </p>
  `;

  return sendMail({
    to,
    subject,
    html: renderEmailShell({ title: subject, preheader: "Підтвердіть вашу електронну пошту для активації акаунту", content }),
    text: `Вітаємо, ${name}!\n\nДля підтвердження вашої реєстрації в STsup перейдіть за посиланням:\n${verificationUrl}\n\nПосилання дійсне 24 години.`,
  });
}

// ---------------------------------------------------------------------------
// 2. Password Reset
// ---------------------------------------------------------------------------
export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  const subject = "Відновлення пароля — STsup";
  const content = `
    <h2 style="color: #ffffff; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">
      Запит на скидання пароля
    </h2>
    <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
      Вітаємо, <strong>${name}</strong>!
    </p>
    <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
      Ми отримали запит на відновлення доступу до вашого облікового запису. Натисніть кнопку нижче, щоб встановити новий пароль:
    </p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${resetUrl}" class="btn">Встановити новий пароль</a>
    </div>
    <p style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
      Якщо кнопка не працює, скопіюйте посилання:<br>
      <a href="${resetUrl}" style="color: #38bdf8; word-break: break-all;">${resetUrl}</a>
    </p>
    <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
      Посилання одноразове та дійсне протягом 1 години. Якщо ви не надсилали запит на зміну пароля, просто проігноруйте це повідомлення.
    </p>
  `;

  return sendMail({
    to,
    subject,
    html: renderEmailShell({ title: subject, preheader: "Інструкції зі скидання пароля в STsup", content }),
    text: `Вітаємо, ${name}!\n\nЩоб встановити новий пароль для входу в STsup, перейдіть за посиланням:\n${resetUrl}\n\nПосилання дійсне протягом 1 години.`,
  });
}

// ---------------------------------------------------------------------------
// 3. Notification: Task Status Changed
// ---------------------------------------------------------------------------
export async function sendStatusChangedEmail({
  to,
  recipientName,
  taskCode,
  taskTitle,
  oldStatus,
  newStatus,
  updatedByName,
  taskUrl,
}: {
  to: string;
  recipientName: string;
  taskCode: string;
  taskTitle: string;
  oldStatus: string;
  newStatus: string;
  updatedByName: string;
  taskUrl: string;
}) {
  const subject = `[STsup] Зміна статусу ${taskCode}: ${oldStatus} ➔ ${newStatus}`;
  const content = `
    <div style="margin-bottom: 16px;">
      <span class="task-badge">${taskCode}</span>
    </div>
    <h2 style="color: #ffffff; font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 12px;">
      ${taskTitle}
    </h2>
    <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
      Привіт, <strong>${recipientName}</strong>! Користувач <strong>${updatedByName}</strong> змінив статус цієї задачі:
    </p>
    <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 14px 18px; margin: 20px 0; text-align: center;">
      <span style="color: #94a3b8; font-size: 13px; text-decoration: line-through;">${oldStatus}</span>
      <span style="color: #38bdf8; font-size: 16px; margin: 0 10px; font-weight: bold;">➔</span>
      <span style="color: #22c55e; font-size: 14px; font-weight: 700;">${newStatus}</span>
    </div>
    <div style="text-align: center; margin-top: 24px;">
      <a href="${taskUrl}" class="btn">Переглянути задачу</a>
    </div>
  `;

  return sendMail({
    to,
    subject,
    html: renderEmailShell({ title: subject, preheader: `Статус задачі ${taskCode} змінено на ${newStatus}`, content }),
    text: `Привіт, ${recipientName}!\n\nКористувач ${updatedByName} змінив статус задачі ${taskCode} (${taskTitle}):\n${oldStatus} -> ${newStatus}\n\nПереглянути задачу: ${taskUrl}`,
  });
}

// ---------------------------------------------------------------------------
// 4. Notification: Task Assigned / Re-assigned
// ---------------------------------------------------------------------------
export async function sendTaskAssignedEmail({
  to,
  recipientName,
  taskCode,
  taskTitle,
  assignedByName,
  priority,
  taskUrl,
}: {
  to: string;
  recipientName: string;
  taskCode: string;
  taskTitle: string;
  assignedByName: string;
  priority?: string;
  taskUrl: string;
}) {
  const subject = `[STsup] Вам призначено задачу ${taskCode}: ${taskTitle}`;
  const priorityLabels: Record<string, string> = {
    LOW: "Низький",
    MEDIUM: "Середній",
    HIGH: "Високий",
    URGENT: "Терміновий",
  };
  const prioText = priority ? (priorityLabels[priority] || priority) : "Середній";

  const content = `
    <div style="margin-bottom: 16px;">
      <span class="task-badge">${taskCode}</span>
    </div>
    <h2 style="color: #ffffff; font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 12px;">
      ${taskTitle}
    </h2>
    <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
      Привіт, <strong>${recipientName}</strong>! Користувач <strong>${assignedByName}</strong> призначив вас виконавцем задачі.
    </p>
    <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 12px 16px; margin: 18px 0; font-size: 13px; color: #94a3b8;">
      <div>Пріоритет: <strong style="color: #ffffff;">${prioText}</strong></div>
    </div>
    <div style="text-align: center; margin-top: 24px;">
      <a href="${taskUrl}" class="btn">Відкрити задачу</a>
    </div>
  `;

  return sendMail({
    to,
    subject,
    html: renderEmailShell({ title: subject, preheader: `Вам призначено нову задачу ${taskCode}`, content }),
    text: `Привіт, ${recipientName}!\n\nКористувач ${assignedByName} призначив вас виконавцем задачі ${taskCode} (${taskTitle}).\n\nВідкрити задачу: ${taskUrl}`,
  });
}

// ---------------------------------------------------------------------------
// 5. Notification: New Comment Added
// ---------------------------------------------------------------------------
export async function sendCommentAddedEmail({
  to,
  recipientName,
  taskCode,
  taskTitle,
  commentAuthorName,
  commentSnippet,
  taskUrl,
}: {
  to: string;
  recipientName: string;
  taskCode: string;
  taskTitle: string;
  commentAuthorName: string;
  commentSnippet: string;
  taskUrl: string;
}) {
  const subject = `[STsup] Новий коментар до ${taskCode}: ${taskTitle}`;
  const content = `
    <div style="margin-bottom: 16px;">
      <span class="task-badge">${taskCode}</span>
    </div>
    <h2 style="color: #ffffff; font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 12px;">
      ${taskTitle}
    </h2>
    <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
      Привіт, <strong>${recipientName}</strong>! Користувач <strong>${commentAuthorName}</strong> залишив новий коментар:
    </p>
    <div style="background-color: #0f172a; border-left: 3px solid #3b82f6; border-radius: 6px; padding: 14px 18px; margin: 18px 0; font-size: 14px; color: #f1f5f9; line-height: 1.6; font-style: italic;">
      "${commentSnippet}"
    </div>
    <div style="text-align: center; margin-top: 24px;">
      <a href="${taskUrl}" class="btn">Переглянути та відповісти</a>
    </div>
  `;

  return sendMail({
    to,
    subject,
    html: renderEmailShell({ title: subject, preheader: `${commentAuthorName} прокоментував задачу ${taskCode}`, content }),
    text: `Привіт, ${recipientName}!\n\nКористувач ${commentAuthorName} прокоментував задачу ${taskCode} (${taskTitle}):\n\n"${commentSnippet}"\n\nПереглянути та відповісти: ${taskUrl}`,
  });
}

export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  const subject = "Ласкаво просимо до STsup!";
  const content = `
    <h2 style="color: #ffffff; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">
      Вітаємо у STsup!
    </h2>
    <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
      Привіт, <strong>${name}</strong>!
    </p>
    <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
      Ваш обліковий запис у системі управління завданнями та підтримкою STsup активовано.
    </p>
  `;

  return sendMail({
    to,
    subject,
    html: renderEmailShell({ title: subject, content }),
    text: `Привіт, ${name}!\n\nВаш обліковий запис у системі STsup активовано.`,
  });
}
