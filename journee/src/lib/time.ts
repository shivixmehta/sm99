import { APP_TIMEZONE } from '../config';

/**
 * All "today" logic goes through here so it follows Mauritius local time,
 * not the device's UTC clock. Uses the named IANA zone rather than a fixed
 * +4 offset so it stays correct if the rules ever change (Mauritius trialled
 * DST once, in 2008–09).
 */

/** A YYYY-MM-DD key for the local calendar day. Store this on every dated record. */
export function dayKey(date: Date = new Date(), timeZone = APP_TIMEZONE): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Day key N days before/after the given key (calendar arithmetic, timezone-safe). */
export function shiftDay(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d + days);
  return new Date(t).toISOString().slice(0, 10);
}

/** Local hour (0–23) in the app timezone. */
export function localHour(date: Date = new Date(), timeZone = APP_TIMEZONE): number {
  const h = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hourCycle: 'h23' }).format(date);
  return Number(h);
}

export type PartOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export function partOfDay(date: Date = new Date()): PartOfDay {
  const h = localHour(date);
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
}

/** e.g. "Monday 9 November" */
export function longDate(date: Date = new Date(), locale = 'en-GB', timeZone = APP_TIMEZONE): string {
  return new Intl.DateTimeFormat(locale, { timeZone, weekday: 'long', day: 'numeric', month: 'long' }).format(date);
}
