import { handlePayment, logger, paymentGateway } from '@/infrastructure/container';
import { json } from '@/lib/http';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const signature = req.headers.get('stripe-signature');
  if (!signature) return json(400, { error: 'missing signature' });

  const raw = await req.text(); // cuerpo crudo: indispensable para verificar la firma
  let paid;
  try {
    paid = await paymentGateway().parseWebhook(raw, signature);
  } catch {
    logger.warn('webhook_signature_invalid');
    return json(400, { error: 'invalid signature' });
  }
  if (!paid) return json(200, { received: true });

  try {
    const result = await handlePayment()(paid);
    return json(200, { received: true, result });
  } catch (err) {
    // 500 → Stripe reintenta; la idempotencia evita pedidos dobles.
    logger.error('webhook_processing_failed', { reason: err instanceof Error ? err.message : 'unknown' });
    return json(500, { error: 'processing failed' });
  }
}
