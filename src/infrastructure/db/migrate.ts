import path from 'node:path';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';

const LOCK = 'aa360_migrations';

/**
 * Aplica migraciones pendientes. Idempotente y segura con varias instancias:
 * un lock de MySQL (GET_LOCK) garantiza que solo una las ejecute a la vez.
 */
export async function runMigrations(url: string, log: (msg: string, meta?: Record<string, unknown>) => void) {
  const conn = await mysql.createConnection({ uri: url });
  try {
    const [rows] = await conn.query<mysql.RowDataPacket[]>('SELECT GET_LOCK(?, 60) AS got', [LOCK]);
    if (rows[0]?.got !== 1) throw new Error('No se obtuvo el lock de migraciones');
    try {
      await migrate(drizzle(conn), { migrationsFolder: path.join(process.cwd(), 'drizzle') });
      log('migrations_ok');
    } finally {
      await conn.query('SELECT RELEASE_LOCK(?)', [LOCK]);
    }
  } finally {
    await conn.end();
  }
}
