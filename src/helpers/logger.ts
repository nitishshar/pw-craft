/**
 * Small **structured logger** with levels, optional **ANSI** colors, **JSON** lines, in-memory buffer
 * ({@link Logger.getBuffer}), and integration with {@link PwCraftConfig.logging}.
 *
 * @example
 * ```ts
 * import { Logger } from 'pw-craft';
 *
 * const log = new Logger({ level: 'debug', format: 'text' });
 * log.info('Opened page', { url: 'http://localhost:4200' });
 * ```
 */
import type { LoggerLevel } from '../config';

const LEVEL_ORDER: Record<Exclude<LoggerLevel, 'silent'>, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const ANSI = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  debug: '\x1b[36m',
  info: '\x1b[32m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
};

export interface LogEntry {
  level: Exclude<LoggerLevel, 'silent'>;
  message: string;
  meta?: Record<string, unknown>;
  time: string;
}

export class Logger {
  private level: LoggerLevel;
  private colorize: boolean;
  private format: 'text' | 'json';
  private consoleEnabled: boolean;
  private buffer: LogEntry[] = [];
  private maxBuffer = 5000;

  constructor(opts?: {
    level?: LoggerLevel;
    colorize?: boolean;
    format?: 'text' | 'json';
    console?: boolean;
  }) {
    this.level = opts?.level ?? 'info';
    this.colorize = opts?.colorize ?? true;
    this.format = opts?.format ?? 'text';
    this.consoleEnabled = opts?.console ?? true;
  }

  setLevel(level: LoggerLevel): void {
    this.level = level;
  }

  getBuffer(): readonly LogEntry[] {
    return this.buffer;
  }

  clearBuffer(): void {
    this.buffer = [];
  }

  private shouldLog(level: Exclude<LoggerLevel, 'silent'>): boolean {
    if (this.level === 'silent') return false;
    return LEVEL_ORDER[level] >= LEVEL_ORDER[this.level as Exclude<LoggerLevel, 'silent'>];
  }

  private push(entry: LogEntry): void {
    this.buffer.push(entry);
    if (this.buffer.length > this.maxBuffer) {
      this.buffer.splice(0, this.buffer.length - this.maxBuffer);
    }
  }

  private write(level: Exclude<LoggerLevel, 'silent'>, message: string, meta?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;
    const time = new Date().toISOString();
    const entry: LogEntry = { level, message, meta, time };
    this.push(entry);
    if (!this.consoleEnabled) return;
    if (this.format === 'json') {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({ ...entry, meta }));
      return;
    }
    const prefix = `[${time}] [${level.toUpperCase()}]`;
    const colored =
      this.colorize && process.stdout.isTTY
        ? `${ANSI[level]}${prefix}${ANSI.reset} ${message}`
        : `${prefix} ${message}`;
    const line = meta && Object.keys(meta).length ? `${colored} ${JSON.stringify(meta)}` : colored;
    switch (level) {
      case 'debug':
      case 'info':
        // eslint-disable-next-line no-console
        console.log(line);
        break;
      case 'warn':
        // eslint-disable-next-line no-console
        console.warn(line);
        break;
      case 'error':
        // eslint-disable-next-line no-console
        console.error(line);
        break;
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.write('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.write('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.write('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.write('error', message, meta);
  }
}
