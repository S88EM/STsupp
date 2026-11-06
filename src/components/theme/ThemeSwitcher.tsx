"use client";

import React, { useState, useEffect, useRef } from "react";
import { Palette, Check } from "lucide-react";

export type ThemeId =
  | "default"
  | "midnight"
  | "oled"
  | "aurora"
  | "emerald"
  | "nebula"
  | "charcoal";

export interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  gradient: string;
  borderAccent: string;
}

export const THEMES: ThemeOption[] = [
  {
    id: "default",
    name: "Класичний графіт",
    description: "Стандартний темний дизайн STsup",
    gradient: "linear-gradient(135deg, #0e131f, #1e293b)",
    borderAccent: "border-blue-500/40",
  },
  {
    id: "midnight",
    name: "Опівнічний синій",
    description: "Глибокий синій океан з неоновим відливом",
    gradient: "linear-gradient(135deg, #070d18, #1e3a8a)",
    borderAccent: "border-blue-400/50",
  },
  {
    id: "oled",
    name: "OLED Чорний",
    description: "Абсолютна контрастність без підсвічування",
    gradient: "linear-gradient(135deg, #000000, #18181b)",
    borderAccent: "border-zinc-500/50",
  },
  {
    id: "aurora",
    name: "Аврора (Сяйво)",
    description: "Північне сяйво: м'яка дифузія синього та смарагду",
    gradient: "linear-gradient(135deg, #1e40af, #059669)",
    borderAccent: "border-emerald-400/50",
  },
  {
    id: "emerald",
    name: "Смарагдова ніч",
    description: "Темний хвойно-нефритовий градієнт",
    gradient: "linear-gradient(135deg, #04100c, #065f46)",
    borderAccent: "border-emerald-500/50",
  },
  {
    id: "nebula",
    name: "Космічна Небула",
    description: "Ультрастильний індиго-фіолетовий простір",
    gradient: "linear-gradient(135deg, #090514, #581c87)",
    borderAccent: "border-purple-400/50",
  },
  {
    id: "charcoal",
    name: "Тепле вугілля",
    description: "Затишний темний шоколадно-бурштиновий тон",
    gradient: "linear-gradient(135deg, #0c0907, #78350f)",
    borderAccent: "border-amber-500/50",
  },
];

export function applyTheme(themeId: ThemeId, saveToDb = true) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-bg", themeId);
  }
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("stsup_theme", themeId);
      document.cookie = `stsup_theme=${themeId}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {
      // ignore
    }
  }
  if (saveToDb && typeof fetch !== "undefined") {
    fetch("/api/users/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: themeId }),
    }).catch(() => {});
  }
}

export function ThemeSwitcherButton() {
  const [currentTheme, setCurrentTheme] = useState<ThemeId>("default");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Read from data-bg or localStorage
    const saved = (typeof window !== "undefined" && localStorage.getItem("stsup_theme")) as ThemeId;
    const domTheme = (typeof document !== "undefined" && document.documentElement.getAttribute("data-bg")) as ThemeId;
    const active = saved || domTheme || "default";
    setCurrentTheme(active);

    // Sync with /api/auth/me if logged in
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.theme && data.user.theme !== active) {
          setCurrentTheme(data.user.theme as ThemeId);
          applyTheme(data.user.theme as ThemeId, false);
        }
      })
      .catch(() => {});

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (themeId: ThemeId) => {
    setCurrentTheme(themeId);
    applyTheme(themeId, true);
    setIsOpen(false);
  };

  const activeThemeObj = THEMES.find((t) => t.id === currentTheme) || THEMES[0];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors relative flex items-center justify-center cursor-pointer"
        title="Змінити тему фону"
      >
        <Palette className="w-4 h-4" />
        <span
          className="w-1.5 h-1.5 rounded-full absolute top-1 right-1 border border-card shadow-xs"
          style={{ background: activeThemeObj.gradient }}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 w-72 rounded-2xl bg-card border border-border shadow-2xl p-3 z-50 animate-in fade-in-50 zoom-in-95 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-border/60 px-1">
            <div className="flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-foreground">Тема оформлення фону</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              {THEMES.length} стилів
            </span>
          </div>

          <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-0.5">
            {THEMES.map((theme) => {
              const isSelected = theme.id === currentTheme;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleSelect(theme.id)}
                  className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-primary/10 border-primary/40 text-foreground"
                      : "border-transparent hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex-shrink-0 border shadow-inner flex items-center justify-center ${theme.borderAccent}`}
                    style={{ background: theme.gradient }}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white drop-shadow" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold truncate ${
                          isSelected ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {theme.name}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                      {theme.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
