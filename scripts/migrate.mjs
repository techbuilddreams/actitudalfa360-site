// Aplica migraciones pendientes al arrancar (si hay DATABASE_URL). Idempotente.
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) {
  console.log(JSON.stringify({ level: 'warn', msg: 'migrate: sin DATABASE_URL, se omite' }));
  process.exit(0);
}
const conn = await mysql.createConnection({ uri: url });
try {
  await migrate(drizzle(conn), { migrationsFolder: './drizzle' });
  console.log(JSON.stringify({ level: 'info', msg: 'migrate: ok' }));
} finally {
  await conn.end();
}
