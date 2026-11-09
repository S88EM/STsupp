import fs from "fs";
import path from "path";
import {
  SystemSettings,
  DEFAULT_BLOCKED_EXTENSIONS,
  DEFAULT_SYSTEM_SETTINGS,
} from "./system-settings-constants";

export * from "./system-settings-constants";

let cachedSettings: SystemSettings | null = null;

function getSystemSettingsFilePath(): string {
  if (fs.existsSync("/data")) {
    return "/data/system_settings.json";
  }
  return path.join(process.cwd(), "data", "system_settings.json");
}

export function clearSystemSettingsCache(): void {
  cachedSettings = null;
}

export function getSystemSettings(): SystemSettings {
  if (cachedSettings) {
    return cachedSettings;
  }

  const filePath = getSystemSettingsFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = JSON.parse(raw);
      cachedSettings = {
        maxAttachmentSizeMb:
          typeof parsed.maxAttachmentSizeMb === "number" && parsed.maxAttachmentSizeMb > 0
            ? parsed.maxAttachmentSizeMb
            : Number(process.env.MAX_ATTACHMENT_SIZE_MB) || DEFAULT_SYSTEM_SETTINGS.maxAttachmentSizeMb,
        blockedExtensions: Array.isArray(parsed.blockedExtensions)
          ? parsed.blockedExtensions.map((e: string) => String(e).toLowerCase().trim())
          : DEFAULT_SYSTEM_SETTINGS.blockedExtensions,
      };
      return cachedSettings;
    }
  } catch (err) {
    console.error("[System Settings] Failed to read settings file:", err);
  }

  // Fallback to environment variables or defaults
  const envSize = Number(process.env.MAX_ATTACHMENT_SIZE_MB);
  cachedSettings = {
    maxAttachmentSizeMb: !isNaN(envSize) && envSize > 0 ? envSize : DEFAULT_SYSTEM_SETTINGS.maxAttachmentSizeMb,
    blockedExtensions: DEFAULT_SYSTEM_SETTINGS.blockedExtensions,
  };
  return cachedSettings;
}

export function saveSystemSettings(updates: Partial<SystemSettings>): SystemSettings {
  const current = getSystemSettings();
  const updated: SystemSettings = {
    maxAttachmentSizeMb:
      typeof updates.maxAttachmentSizeMb === "number" && updates.maxAttachmentSizeMb > 0
        ? Math.min(Math.max(1, Math.round(updates.maxAttachmentSizeMb)), 500)
        : current.maxAttachmentSizeMb,
    blockedExtensions: Array.isArray(updates.blockedExtensions)
      ? Array.from(
          new Set(
            updates.blockedExtensions
              .map((e) => (e.startsWith(".") ? e.toLowerCase().trim() : `.${e.toLowerCase().trim()}`))
              .filter((e) => e.length > 1)
          )
        )
      : current.blockedExtensions,
  };

  const filePath = getSystemSettingsFilePath();
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), "utf8");
    cachedSettings = updated;
  } catch (err) {
    console.error("[System Settings] Failed to save settings file:", err);
  }

  return updated;
}

export function getMaxAttachmentSizeBytes(): number {
  const settings = getSystemSettings();
  return (settings.maxAttachmentSizeMb || 25) * 1024 * 1024;
}

export function isBlockedExtension(fileName: string): boolean {
  if (!fileName) return false;
  const ext = (path.extname(fileName) || "").toLowerCase().trim();
  if (!ext) return false;
  const settings = getSystemSettings();
  const blocked = new Set(settings.blockedExtensions || DEFAULT_BLOCKED_EXTENSIONS);
  return blocked.has(ext);
}
