export interface SystemSettings {
  maxAttachmentSizeMb: number;
  blockedExtensions: string[];
}

export const DEFAULT_BLOCKED_EXTENSIONS = [
  ".exe",
  ".bat",
  ".cmd",
  ".sh",
  ".php",
  ".cgi",
  ".dll",
  ".com",
  ".vbs",
  ".ps1",
  ".msi",
  ".jar",
];

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  maxAttachmentSizeMb: 25,
  blockedExtensions: DEFAULT_BLOCKED_EXTENSIONS,
};
