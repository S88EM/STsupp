import { Locale, TranslationDictionary } from "./types";
import { uk } from "./dictionaries/uk";
import { en } from "./dictionaries/en";

export * from "./types";
export * from "./context";
export { uk } from "./dictionaries/uk";
export { en } from "./dictionaries/en";

export const dictionaries: Record<Locale, TranslationDictionary> = {
  uk,
  en,
};

export function getDictionary(locale: Locale = "uk"): TranslationDictionary {
  return dictionaries[locale] || dictionaries.uk;
}

export function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  let result = text;
  for (const [key, val] of Object.entries(params)) {
    result = result.replaceAll(`{${key}}`, String(val));
  }
  return result;
}

/**
 * Access nested dictionary property by dot-notation (e.g. "common.save", "nav.issues")
 */
export function translateKey(
  dictOrLocale: TranslationDictionary | Locale,
  path: string,
  params?: Record<string, string | number>
): string {
  const dict = typeof dictOrLocale === "string" ? getDictionary(dictOrLocale) : dictOrLocale;
  const parts = path.split(".");
  let current: any = dict;

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      // Fallback: return path or english fallback
      const fallbackCurrent = (dictionaries.en as any)?.[parts[0]]?.[parts[1]];
      if (typeof fallbackCurrent === "string") {
        return interpolate(fallbackCurrent, params);
      }
      return path;
    }
  }

  if (typeof current === "string") {
    return interpolate(current, params);
  }

  return path;
}
