/**
 * Se ejecuta UNA vez al arrancar el servidor, antes de atender peticiones.
 * Aquí aplicamos las migraciones: funciona en cualquier hosting (no depende de `npm start`).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const url = process.env.DATABASE_URL;
  const log = (msg: string, meta?: Record<string, unknown>) =>
    console.log(JSON.stringify({ level: 'info', msg, ...meta, ts: new Date().toISOString() }));
  if (!url) {
    log('migrations_skipped_no_database_url');
    return;
  }
  const { runMigrations } = await import('./infrastructure/db/migrate');
  try {
    await runMigrations(url, log);
  } catch (err) {
    // No tumbamos el sitio: la tienda sigue mostrando páginas; el webhook devolverá 500 y Stripe reintentará.
    console.error(JSON.stringify({ level: 'error', msg: 'migrations_failed', reason: err instanceof Error ? err.message : 'unknown' }));
  }
}
