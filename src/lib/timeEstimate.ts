/**
 * Time tracking and duration utilities for engineer estimates.
 * Standard working unit conversions:
 * - 1m = 1 minute
 * - 1h = 60 minutes = 1 hour
 * - 1d = 8 hours = 480 minutes (standard working day)
 * - 1w = 5 days = 40 hours = 2400 minutes (standard working week)
 * - 1mo = 4 weeks = 160 hours = 9600 minutes (standard working month)
 */

export const TIME_PRESETS = [
  "30m",
  "1h",
  "2h",
  "4h",
  "1d",
  "2d",
  "1w",
  "1mo",
] as const;

export const MONTH_MINUTES = 9600; // 4 weeks = 160h = 9600m
export const WEEK_MINUTES = 2400;  // 5 days = 40h = 2400m
export const DAY_MINUTES = 480;    // 8h working day = 480m
export const HOUR_MINUTES = 60;    // 60m

/**
 * Parses any duration string into total minutes.
 * Supports:
 * - Minutes: 30m, 15min, 30хв
 * - Hours: 1h, 4h, 2год, 1г
 * - Days: 1d, 2d, 1д, 2дн
 * - Weeks: 1w, 2w, 1тиж, 1т
 * - Months: 1mo, 2mo, 1міс, 1month
 * - Combinations: "4h 30m", "1d 2h", "1w 2d 4h"
 */
export function parseDurationToMinutes(val?: string | null): number {
  if (!val || typeof val !== "string") return 0;
  const clean = val.trim().toLowerCase();
  if (!clean) return 0;

  let totalMinutes = 0;
  let matched = false;

  // IMPORTANT: 'mo' and 'міс' must precede 'm' in alternation!
  // 'min' and 'хв' must precede 'm'!
  const regex = /(\d+(?:\.\d+)?)\s*(mo|міс|month|w|тиж|т|d|дн|д|h|год|г|min|хв|m)/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(clean)) !== null) {
    matched = true;
    const num = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case "mo":
      case "міс":
      case "month":
        totalMinutes += num * MONTH_MINUTES;
        break;
      case "w":
      case "т":
      case "тиж":
        totalMinutes += num * WEEK_MINUTES;
        break;
      case "d":
      case "д":
      case "дн":
        totalMinutes += num * DAY_MINUTES;
        break;
      case "h":
      case "г":
      case "год":
        totalMinutes += num * HOUR_MINUTES;
        break;
      case "m":
      case "min":
      case "хв":
      default:
        totalMinutes += num;
        break;
    }
  }

  // Fallback: If only a bare number was entered, treat as hours (e.g. "4" -> 4h = 240m)
  if (!matched && /^\d+(?:\.\d+)?$/.test(clean)) {
    return parseFloat(clean) * HOUR_MINUTES;
  }

  return Math.round(totalMinutes);
}

/**
 * Parses a duration string into total hours (e.g. "4h" -> 4, "30m" -> 0.5).
 */
export function parseDurationToHours(val?: string | null): number {
  return parseDurationToMinutes(val) / 60;
}

/**
 * Formats total minutes into canonical Jira duration notation:
 * Examples:
 * - 30 -> "30m"
 * - 240 -> "4h"
 * - 210 -> "3h 30m"
 * - 480 -> "1d"
 * - 510 -> "1d 30m"
 * - 2400 -> "1w"
 * - 9600 -> "1mo"
 */
export function formatMinutesToDuration(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return "0h";

  let rem = Math.round(totalMinutes);
  if (rem <= 0) return "0h";

  const parts: string[] = [];

  if (rem >= MONTH_MINUTES) {
    const mo = Math.floor(rem / MONTH_MINUTES);
    parts.push(`${mo}mo`);
    rem %= MONTH_MINUTES;
  }
  if (rem >= WEEK_MINUTES) {
    const w = Math.floor(rem / WEEK_MINUTES);
    parts.push(`${w}w`);
    rem %= WEEK_MINUTES;
  }
  if (rem >= DAY_MINUTES) {
    const d = Math.floor(rem / DAY_MINUTES);
    parts.push(`${d}d`);
    rem %= DAY_MINUTES;
  }
  if (rem >= HOUR_MINUTES) {
    const h = Math.floor(rem / HOUR_MINUTES);
    parts.push(`${h}h`);
    rem %= HOUR_MINUTES;
  }
  if (rem > 0) {
    parts.push(`${rem}m`);
  }

  return parts.length > 0 ? parts.join(" ") : "0h";
}

/**
 * Backward-compatible helper that accepts hours and formats into duration.
 */
export function formatHoursToDuration(hours: number): string {
  return formatMinutesToDuration(Math.round(hours * 60));
}

/**
 * Validates whether the user's input string represents a valid duration.
 */
export function isValidDuration(val: string): boolean {
  if (!val || typeof val !== "string") return false;
  const clean = val.trim().toLowerCase();
  if (!clean) return false;

  const regex = /^(\d+(?:\.\d+)?\s*(mo|міс|month|w|тиж|т|d|дн|д|h|год|г|min|хв|m)\s*)+$/i;
  if (regex.test(clean)) return true;

  if (/^\d+(?:\.\d+)?$/.test(clean)) return true;

  return false;
}

/**
 * Normalizes user input into canonical format (e.g. "30m" -> "30m", "4" -> "4h", "210m" -> "3h 30m").
 */
export function normalizeDurationInput(val: string): string {
  const clean = val.trim();
  if (!clean) return "";
  if (/^\d+(?:\.\d+)?$/.test(clean)) {
    return `${clean}h`;
  }
  const mins = parseDurationToMinutes(clean);
  if (mins > 0) {
    return formatMinutesToDuration(mins);
  }
  return clean.toLowerCase();
}

/**
 * Human-readable duration in Ukrainian (e.g. "4h" -> "4 год", "3h 30m" -> "3 год 30 хв").
 */
export function formatDurationHumanMinutes(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return "0 год";

  let rem = Math.round(totalMinutes);
  const parts: string[] = [];

  if (rem >= MONTH_MINUTES) {
    const mo = Math.floor(rem / MONTH_MINUTES);
    parts.push(mo === 1 ? "1 міс" : `${mo} міс`);
    rem %= MONTH_MINUTES;
  }
  if (rem >= WEEK_MINUTES) {
    const w = Math.floor(rem / WEEK_MINUTES);
    parts.push(w === 1 ? "1 тиж" : `${w} тиж`);
    rem %= WEEK_MINUTES;
  }
  if (rem >= DAY_MINUTES) {
    const d = Math.floor(rem / DAY_MINUTES);
    parts.push(d === 1 ? "1 дн" : `${d} дн`);
    rem %= DAY_MINUTES;
  }
  if (rem >= HOUR_MINUTES) {
    const h = Math.floor(rem / HOUR_MINUTES);
    parts.push(`${h} год`);
    rem %= HOUR_MINUTES;
  }
  if (rem > 0) {
    parts.push(`${rem} хв`);
  }

  return parts.length > 0 ? parts.join(" ") : "0 год";
}

export function formatDurationHuman(val?: string | null): string {
  const mins = parseDurationToMinutes(val);
  return formatDurationHumanMinutes(mins);
}
