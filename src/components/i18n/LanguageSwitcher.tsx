"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { Locale } from "@/lib/i18n/types";

interface LanguageSwitcherProps {
  variant?: "toggle" | "button" | "menu-inline";
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = "toggle",
  className = "",
}) => {
  const { locale, setLocale, dict } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  if (variant === "toggle") {
    return (
      <div
        className={`inline-flex items-center p-0.5 rounded-lg bg-secondary/60 border border-border/80 text-[11px] font-semibold select-none ${className}`}
        title={dict.nav.language}
      >
        <button
          type="button"
          onClick={() => setLocale("uk")}
          className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
            locale === "uk"
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Українська"
        >
          UA
        </button>
        <button
          type="button"
          onClick={() => setLocale("en")}
          className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
            locale === "en"
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="English"
        >
          EN
        </button>
      </div>
    );
  }

  if (variant === "menu-inline") {
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium mb-1">
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-primary" />
            <span>{dict.nav.language}</span>
          </span>
          <span className="text-[10px] font-mono uppercase text-primary font-bold">
            {locale.toUpperCase()}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setLocale("uk")}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              locale === "uk"
                ? "bg-primary/15 border-primary text-primary font-semibold shadow-xs"
                : "bg-secondary/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span>🇺🇦</span>
              <span>Українська</span>
            </span>
            {locale === "uk" && <Check className="w-3 h-3 text-primary" />}
          </button>
          <button
            type="button"
            onClick={() => setLocale("en")}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              locale === "en"
                ? "bg-primary/15 border-primary text-primary font-semibold shadow-xs"
                : "bg-secondary/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span>🇬🇧</span>
              <span>English</span>
            </span>
            {locale === "en" && <Check className="w-3 h-3 text-primary" />}
          </button>
        </div>
      </div>
    );
  }

  // Variant: "button" with popover
  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer border border-border/60"
        title={dict.nav.language}
      >
        <Globe className="w-3.5 h-3.5 text-primary" />
        <span className="font-mono font-bold text-[11px] uppercase">{locale}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 w-44 rounded-xl bg-card border border-border shadow-2xl p-1.5 z-50 animate-in fade-in-50 zoom-in-95 space-y-1">
          <button
            type="button"
            onClick={() => {
              setLocale("uk");
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              locale === "uk"
                ? "bg-primary/15 text-primary font-bold"
                : "text-foreground hover:bg-secondary"
            }`}
          >
            <span className="flex items-center gap-2">
              <span>🇺🇦</span>
              <span>Українська</span>
            </span>
            {locale === "uk" && <Check className="w-3.5 h-3.5 text-primary" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setLocale("en");
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              locale === "en"
                ? "bg-primary/15 text-primary font-bold"
                : "text-foreground hover:bg-secondary"
            }`}
          >
            <span className="flex items-center gap-2">
              <span>🇬🇧</span>
              <span>English</span>
            </span>
            {locale === "en" && <Check className="w-3.5 h-3.5 text-primary" />}
          </button>
        </div>
      )}
    </div>
  );
};
