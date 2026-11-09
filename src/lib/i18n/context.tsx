"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { Locale, TranslationDictionary } from "./types";
import { getDictionary, translateKey } from "./index";

interface I18nContextValue {
  locale: Locale;
  setLocale: (newLocale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dict: TranslationDictionary;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function applyLocale(newLocale: Locale, saveToDb = true) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("lang", newLocale);
    try {
      localStorage.setItem("stsup_lang", newLocale);
      document.cookie = `stsup_lang=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {
      // ignore
    }
  }

  if (saveToDb && typeof window !== "undefined") {
    fetch("/api/users/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: newLocale }),
    }).catch(() => {
      // offline or unauthenticated, ignore
    });
  }
}

export const I18nProvider: React.FC<{
  children: React.ReactNode;
  initialLocale?: Locale;
}> = ({ children, initialLocale = "uk" }) => {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // Sync with client-side localStorage or server cookie on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("stsup_lang") as Locale;
      if (saved && (saved === "uk" || saved === "en") && saved !== locale) {
        setLocaleState(saved);
        document.documentElement.setAttribute("lang", saved);
      }
    } catch (e) {}

    // Check if authenticated user has preference in profile
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user?.locale && (data.user.locale === "uk" || data.user.locale === "en")) {
          const userLocale = data.user.locale as Locale;
          setLocaleState(userLocale);
          applyLocale(userLocale, false);
        }
      })
      .catch(() => {});
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    applyLocale(newLocale, true);
  }, []);

  const dict = useMemo(() => getDictionary(locale), [locale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return translateKey(dict, key, params);
    },
    [dict]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      dict,
    }),
    [locale, setLocale, t, dict]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    // Return graceful fallback if used outside provider
    const fallbackDict = getDictionary("uk");
    return {
      locale: "uk",
      setLocale: () => {},
      t: (key: string, params?: Record<string, string | number>) => translateKey(fallbackDict, key, params),
      dict: fallbackDict,
    };
  }
  return context;
}

export const useTranslation = useI18n;
