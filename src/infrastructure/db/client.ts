import 'server-only';
import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

export type Db = MySql2Database<typeof schema>;

let db: Db | undefined;

/** Pool único por proceso (reutiliza conexiones). */
export function getDb(url: string, poolSize = 5): Db {
  if (!db) {
    const pool = mysql.createPool({ uri: url, connectionLimit: poolSize, maxIdle: poolSize, idleTimeout: 60_000, queueLimit: 50, waitForConnections: true, enableKeepAlive: true });
    db = drizzle(pool, { schema, mode: 'default' }) as unknown as Db;
  }
  return db;
}
