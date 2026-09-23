import 'server-only';
import { z } from 'zod';

/**
 * Variables de entorno del servidor, validadas con Zod.
 * Los secretos son opcionales al compilar (el build no los necesita);
 * cada adaptador exige los suyos con `requireEnv` al usarse.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_ENV: z.enum(['local', 'staging', 'production']).default('local'),
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),

  STRIPE_SECRET_KEY: z.string().regex(/^(sk|rk)_(test|live)_/).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
  STRIPE_AUTOMATIC_TAX: z.stringbool().default(false),

  DATABASE_URL: z.string().startsWith('mysql://').optional(),
  DB_POOL_SIZE: z.coerce.number().int().min(1).max(20).default(5),

  PRINTIFY_AUTO_ORDER: z.stringbool().default(false),
  PRINTIFY_API_TOKEN: z.string().min(20).optional(),
  PRINTIFY_SHOP_ID: z.string().regex(/^\d+$/).optional(),

  SHIPPING_FLAT_CENTS: z.coerce.number().int().min(0).default(899),
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | undefined;

export function env(): ServerEnv {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      // Nunca imprimimos valores, solo qué variable falló.
      const fields = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
      throw new Error(`Variables de entorno inválidas: ${fields}`);
    }
    cached = parsed.data;
  }
  return cached;
}

export function requireEnv<K extends keyof ServerEnv>(key: K): NonNullable<ServerEnv[K]> {
  const value = env()[key];
  if (value === undefined || value === null || value === '') {
    throw new Error(`Falta la variable de entorno ${String(key)}`);
  }
  return value as NonNullable<ServerEnv[K]>;
}

export const isProduction = () => env().APP_ENV === 'production';
