/**
 * Shared **utilities**: deep object merge (used by config and {@link BrowserManager}), **retry** with
 * backoff, **env** parsers for `process.env`, filename/date helpers for screenshots/reports, and small
 * array helpers.
 *
 * @example Merge partial config safely
 * ```ts
 * import { deepMerge, defaultConfig } from 'pw-craft';
 *
 * const cfg = deepMerge(defaultConfig as unknown as Record<string, unknown>, {
 *   baseUrl: 'http://127.0.0.1:4200',
 * } as Record<string, unknown>);
 * ```
 */
import dayjs from 'dayjs';

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function deepMerge<T extends Record<string, unknown>>(base: T, patch: Partial<T>): T {
  const out: Record<string, unknown> = { ...base };
  for (const key of Object.keys(patch) as (keyof T)[]) {
    const pv = patch[key];
    if (pv === undefined) continue;
    const bv = base[key];
    if (isPlainObject(bv) && isPlainObject(pv as unknown)) {
      out[key as string] = deepMerge(bv as Record<string, unknown>, pv as Record<string, unknown>) as unknown;
    } else {
      out[key as string] = pv as unknown;
    }
  }
  return out as T;
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

export async function retry<T>(
  fn: () => Promise<T>,
  opts: { count: number; delay: number; backoff: 'none' | 'linear' | 'exponential' },
): Promise<T> {
  let lastErr: unknown;
  let delay = opts.delay;
  for (let i = 0; i <= opts.count; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i === opts.count) break;
      await sleep(delay);
      if (opts.backoff === 'linear') delay += opts.delay;
      if (opts.backoff === 'exponential') delay *= 2;
    }
  }
  throw lastErr;
}

export function formatDateForFilename(d = new Date()): string {
  return dayjs(d).format('YYYY-MM-DD_HH-mm-ss');
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 200);
}

export function env(key: string, fallback?: string): string | undefined {
  const v = process.env[key];
  if (v === undefined || v === '') return fallback;
  return v;
}

export function envBool(key: string, fallback = false): boolean {
  const v = process.env[key];
  if (v === undefined || v === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
}

export function envInt(key: string, fallback: number): number {
  const v = process.env[key];
  if (v === undefined || v === '') return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function flatten<T>(arr: T[][]): T[] {
  return arr.reduce((a, b) => a.concat(b), []);
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let t: NodeJS.Timeout | undefined;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}
