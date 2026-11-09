"use client";

import React, { useState, useEffect } from "react";
import {
  HardDrive,
  ShieldAlert,
  Save,
  CheckCircle2,
  AlertTriangle,
  Plus,
  X,
  RefreshCw,
  FileUp,
  FileCode,
  Info,
} from "lucide-react";
import { DEFAULT_BLOCKED_EXTENSIONS } from "@/lib/system-settings-constants";

export function GeneralSettingsTab() {
  const [maxSizeMb, setMaxSizeMb] = useState<number>(25);
  const [blockedExtensions, setBlockedExtensions] = useState<string[]>(DEFAULT_BLOCKED_EXTENSIONS);
  const [newExtInput, setNewExtInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchGeneralSettings = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/settings/general");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setMaxSizeMb(data.settings.maxAttachmentSizeMb || 25);
            setBlockedExtensions(data.settings.blockedExtensions || DEFAULT_BLOCKED_EXTENSIONS);
          }
        }
      } catch (err: any) {
        console.error("Failed to load general settings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGeneralSettings();
  }, []);

  const handleAddExtension = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExtInput.trim()) return;
    let clean = newExtInput.trim().toLowerCase();
    if (!clean.startsWith(".")) clean = `.${clean}`;
    if (!blockedExtensions.includes(clean)) {
      setBlockedExtensions([...blockedExtensions, clean]);
    }
    setNewExtInput("");
  };

  const handleRemoveExtension = (ext: string) => {
    setBlockedExtensions(blockedExtensions.filter((e) => e !== ext));
  };

  const handleResetExtensions = () => {
    setBlockedExtensions(DEFAULT_BLOCKED_EXTENSIONS);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const safeMb = Math.min(Math.max(1, Math.round(Number(maxSizeMb) || 25)), 500);

    try {
      const res = await fetch("/api/settings/general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxAttachmentSizeMb: safeMb,
          blockedExtensions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Помилка збереження налаштувань");
      } else {
        setMaxSizeMb(data.settings.maxAttachmentSizeMb);
        setBlockedExtensions(data.settings.blockedExtensions);
        setSuccessMsg("Загальні налаштування системи успішно збережено!");
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Помилка зв'язку із сервером");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-primary" />
        <span>Завантаження загальних налаштувань...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: File upload limit & policies */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: File Upload Limit */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border bg-secondary/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <FileUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">
                    Ліміт розміру файлів для вкладень
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Керування допустимим обсягом одного завантажуваного файлу
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Максимальний розмір одного файлу (МБ):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={maxSizeMb}
                    onChange={(e) => setMaxSizeMb(Number(e.target.value))}
                    className="w-32 text-xs px-3 py-2 rounded-xl bg-secondary/40 border border-border text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-xs text-muted-foreground font-medium">МБ (мегабайт)</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                  Файли, що перевищують цей розмір, автоматично відхилятимуться сервером до зчитування в оперативну пам&apos;ять (захист від вичерпання RAM).
                </p>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[11px] text-muted-foreground font-medium block mb-1.5">
                  Швидкі пресети:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[10, 25, 50, 100, 250].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setMaxSizeMb(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        maxSizeMb === preset
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/60 hover:bg-secondary text-foreground border-border"
                      }`}
                    >
                      {preset} МБ {preset === 25 ? "(стандарт)" : ""}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card: Blocked Extensions Security Policy */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border bg-secondary/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">
                    Політика безпеки розширень файлів
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Заблоковані формати (виконувані файли та скрипти)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetExtensions}
                className="text-[11px] text-muted-foreground hover:text-foreground underline transition-colors cursor-pointer"
              >
                Скинути за замовчуванням
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Завантаження файлів із зазначеними розширеннями суворо блокується сервером для захисту користувачів від шкідливого ПЗ:
              </p>

              {/* Badges list */}
              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-secondary/30 border border-border min-h-[48px]">
                {blockedExtensions.map((ext) => (
                  <span
                    key={ext}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-mono font-medium"
                  >
                    <span>{ext}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExtension(ext)}
                      className="hover:text-red-300 ml-0.5 cursor-pointer"
                      title={`Видалити ${ext} зі списку заборонених`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add custom extension */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder=".ext (наприклад: .vbs, .bin)..."
                  value={newExtInput}
                  onChange={(e) => setNewExtInput(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl bg-secondary/40 border border-border text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary flex-1 max-w-xs"
                />
                <button
                  type="button"
                  onClick={handleAddExtension}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Додати розширення</span>
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 transition-all cursor-pointer disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Збереження..." : "Зберегти налаштування"}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Information & Storage Recommendations */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs">
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>Рекомендації щодо сховища STsup</span>
            </div>

            <div className="text-xs text-muted-foreground space-y-3 leading-relaxed">
              <p>
                <strong>25 МБ</strong> є рекомендованим оптимальним лімітом для більшості робочих процесів (дозволяє додавати детальні PDF-документи, скріншоти та логи без перевантаження бази даних і сервера).
              </p>
              <p>
                При встановленні ліміту <strong>понад 100 МБ</strong> переконайтеся, що ваш сервер має достатній обсяг вільної RAM та дискового простору, оскільки файли зберігаються в локальній директорії <code className="text-foreground font-mono bg-secondary px-1 py-0.5 rounded text-[10px]">public/uploads</code> або вказаній <code className="text-foreground font-mono bg-secondary px-1 py-0.5 rounded text-[10px]">UPLOAD_DIR</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
