import type { Money } from './money';

/**
 * Máquina de estados del pedido. Las transiciones se hacen con compare-and-set en la base de datos,
 * así dos procesos concurrentes nunca producen el mismo pedido dos veces.
 *
 *   paid                      (sin producción automática)
 *   fulfillment_pending ──claim──▶ fulfillment_processing ──▶ fulfillment_created
 *                                        │ (reclamo vencido ⇒ se puede reintentar)
 *                                        └──────────────▶ fulfillment_failed
 */
export type OrderStatus =
  | 'paid'
  | 'fulfillment_pending'
  | 'fulfillment_processing'
  | 'fulfillment_created'
  | 'fulfillment_failed';

/** Tiempo tras el cual un reclamo `processing` se considera abandonado (proceso caído). */
export const FULFILLMENT_CLAIM_TTL_MS = 5 * 60_000;

export interface OrderLine { readonly sku: string; readonly quantity: number }

export interface ShippingAddress {
  readonly name: string;
  readonly line1: string;
  readonly line2?: string | null;
  readonly city: string;
  readonly state: string;
  readonly postalCode: string;
  readonly country: string;
}

export interface Order {
  readonly id: string;
  readonly paymentRef: string;             // Stripe Checkout Session id (único)
  readonly status: OrderStatus;
  readonly lines: readonly OrderLine[];
  readonly total: Money;
  readonly email: string | null;
  readonly phone: string | null;
  readonly shipping: ShippingAddress | null;
  readonly fulfillmentRef: string | null;
  readonly createdAt: Date;
}

/** Codifica/decodifica líneas en metadata compacta ("sku:qty,sku:qty"). */
export const encodeLines = (lines: readonly OrderLine[]): string =>
  lines.map((l) => `${l.sku}:${l.quantity}`).join(',');

export const decodeLines = (value: string): OrderLine[] =>
  value
    .split(',')
    .map((part) => part.split(':'))
    .filter(([sku, qty]) => sku && /^\d+$/.test(qty ?? ''))
    .map(([sku, qty]) => ({ sku, quantity: Number(qty) }));
