import { env } from '@/config/env';
import { json } from '@/lib/http';

export const dynamic = 'force-dynamic';

/** Estado de configuración (sin revelar valores). */
export function GET() {
  const e = env();
  return json(200, {
    ok: true,
    env: e.APP_ENV,
    stripe: Boolean(e.STRIPE_SECRET_KEY),
    stripeMode: e.STRIPE_SECRET_KEY?.includes('_live_') ? 'live' : e.STRIPE_SECRET_KEY ? 'test' : null,
    webhook: Boolean(e.STRIPE_WEBHOOK_SECRET),
    database: Boolean(e.DATABASE_URL),
    printifyAutoOrder: e.PRINTIFY_AUTO_ORDER,
    email: Boolean(e.SMTP_USER && e.SMTP_PASSWORD),
  });
}
