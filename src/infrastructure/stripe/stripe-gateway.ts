import 'server-only';
import Stripe from 'stripe';
import { usd } from '@/domain/money';
import { decodeLines, encodeLines, type ShippingAddress } from '@/domain/order';
import type { CheckoutRequest, CheckoutSummary, PaidCheckout, PaymentGateway } from '@/application/ports/payment-gateway';

const HANDLED = new Set(['checkout.session.completed', 'checkout.session.async_payment_succeeded']);

interface Options {
  secretKey: string;
  webhookSecret?: string;
  automaticTax: boolean;
  deliveryDays: { min: number; max: number };
}

/** Adaptador Stripe: traduce entre Stripe y nuestro dominio. Nada fuera de aquí conoce Stripe. */
export class StripeGateway implements PaymentGateway {
  private readonly stripe: Stripe;

  constructor(private readonly opts: Options) {
    this.stripe = new Stripe(opts.secretKey, { maxNetworkRetries: 2, timeout: 20_000, appInfo: { name: 'actitudalfa360' } });
  }

  async createCheckout(req: CheckoutRequest): Promise<{ url: string }> {
    const lines = req.cart.lines.map((l) => ({ sku: l.variant.sku, quantity: l.quantity }));
    const session = await this.stripe.checkout.sessions.create(
      {
        mode: 'payment',
        locale: 'es',
        line_items: req.cart.lines.map((l) => ({
          quantity: l.quantity,
          price_data: {
            currency: l.variant.price.currency,
            unit_amount: l.variant.price.cents,
            product_data: {
              name: `${l.product.name} — ${l.variant.label}`,
              metadata: { sku: l.variant.sku },
            },
          },
        })),
        shipping_address_collection: { allowed_countries: ['US'] },
        shipping_options: [
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              display_name: 'Envío estándar EE. UU.',
              fixed_amount: { amount: req.shipping.cents, currency: req.shipping.currency },
              delivery_estimate: {
                minimum: { unit: 'business_day', value: this.opts.deliveryDays.min },
                maximum: { unit: 'business_day', value: this.opts.deliveryDays.max },
              },
            },
          },
        ],
        phone_number_collection: { enabled: true },
        automatic_tax: { enabled: this.opts.automaticTax },
        success_url: req.successUrl,
        cancel_url: req.cancelUrl,
        metadata: { lines: encodeLines(lines) },
        payment_intent_data: { metadata: { lines: encodeLines(lines) } },
      },
      { idempotencyKey: req.idempotencyKey },
    );
    if (!session.url) throw new Error('Stripe no devolvió URL de checkout');
    return { url: session.url };
  }

  async parseWebhook(rawBody: string, signature: string): Promise<PaidCheckout | null> {
    if (!this.opts.webhookSecret) throw new Error('Falta STRIPE_WEBHOOK_SECRET');
    // Lanza si la firma no es válida o el evento es viejo (tolerancia 300 s por defecto).
    const event = this.stripe.webhooks.constructEvent(rawBody, signature, this.opts.webhookSecret);
    if (!HANDLED.has(event.type)) return null;

    const s = event.data.object as Stripe.Checkout.Session;
    if (s.payment_status !== 'paid') return null;

    return {
      paymentRef: s.id,
      lines: decodeLines(s.metadata?.lines ?? ''),
      total: usd(s.amount_total ?? 0),
      email: s.customer_details?.email ?? null,
      phone: s.customer_details?.phone ?? null,
      shipping: toAddress(s),
    };
  }

  async getCheckoutSummary(paymentRef: string): Promise<CheckoutSummary | null> {
    if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(paymentRef)) return null;
    try {
      const s = await this.stripe.checkout.sessions.retrieve(paymentRef);
      return {
        paymentRef: s.id,
        paid: s.payment_status === 'paid',
        email: s.customer_details?.email ?? null,
        total: s.amount_total != null ? usd(s.amount_total) : null,
      };
    } catch {
      return null;
    }
  }
}

/** La dirección vive en lugares distintos según la versión del API; cubrimos ambos. */
function toAddress(s: Stripe.Checkout.Session): ShippingAddress | null {
  type Ship = { name?: string | null; address?: Stripe.Address | null } | null | undefined;
  const loose = s as unknown as { shipping_details?: Ship; collected_information?: { shipping_details?: Ship } | null };
  const ship = loose.collected_information?.shipping_details ?? loose.shipping_details;
  const a = ship?.address;
  if (!ship || !a) return null;
  return {
    name: ship.name ?? s.customer_details?.name ?? '',
    line1: a.line1 ?? '',
    line2: a.line2 ?? null,
    city: a.city ?? '',
    state: a.state ?? '',
    postalCode: a.postal_code ?? '',
    country: a.country ?? 'US',
  };
}
