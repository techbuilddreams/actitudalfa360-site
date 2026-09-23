import type { Money } from './money';

export type OrderStatus = 'paid' | 'fulfillment_pending' | 'fulfillment_created' | 'fulfillment_failed';

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
