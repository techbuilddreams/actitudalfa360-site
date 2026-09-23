import type { Money } from '@/domain/money';
import type { OrderLine, ShippingAddress } from '@/domain/order';
import type { PricedCart } from '@/domain/cart';

export interface CheckoutRequest {
  readonly cart: PricedCart;
  readonly shipping: Money;
  readonly successUrl: string;
  readonly cancelUrl: string;
  readonly idempotencyKey: string;
}

/** Pago confirmado, ya traducido del proveedor a nuestro lenguaje. */
export interface PaidCheckout {
  readonly paymentRef: string;
  readonly lines: readonly OrderLine[];
  readonly total: Money;
  readonly email: string | null;
  readonly phone: string | null;
  readonly shipping: ShippingAddress | null;
}

export interface CheckoutSummary {
  readonly paymentRef: string;
  readonly paid: boolean;
  readonly email: string | null;
  readonly total: Money | null;
}

export interface PaymentGateway {
  createCheckout(req: CheckoutRequest): Promise<{ url: string }>;
  /** Verifica la firma y devuelve el pago si el evento es un pago completado; null si se ignora. */
  parseWebhook(rawBody: string, signature: string): Promise<PaidCheckout | null>;
  getCheckoutSummary(paymentRef: string): Promise<CheckoutSummary | null>;
}
