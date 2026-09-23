import type { Logger } from '@/application/ports/logger';

/** Logs JSON de una línea (visibles en "Runtime logs" de Hostinger). Nunca registrar secretos ni datos de tarjeta. */
const write = (level: string, msg: string, meta?: Record<string, unknown>) =>
  console[level === 'error' ? 'error' : 'log'](JSON.stringify({ level, msg, ...meta, ts: new Date().toISOString() }));

export const consoleLogger: Logger = {
  info: (m, meta) => write('info', m, meta),
  warn: (m, meta) => write('warn', m, meta),
  error: (m, meta) => write('error', m, meta),
};
