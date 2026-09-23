import 'server-only';
import { and, eq, lt, or } from 'drizzle-orm';
import { usd } from '@/domain/money';
import type { Order, OrderStatus } from '@/domain/order';
import type { OrderRepository } from '@/application/ports/order-repository';
import type { Db } from './client';
import { orders } from './schema';


type Row = typeof orders.$inferSelect;

const toDomain = (r: Row): Order => ({
  id: r.id,
  paymentRef: r.paymentRef,
  status: r.status as OrderStatus,
  lines: r.lines,
  total: usd(r.totalCents),
  email: r.email,
  phone: r.phone,
  shipping: r.shipping ?? null,
  fulfillmentRef: r.fulfillmentRef,
  createdAt: r.createdAt,
});

function isDuplicateKey(e: unknown, depth = 0): boolean {
  if (typeof e !== 'object' || e === null || depth > 3) return false;
  if ((e as { code?: string }).code === 'ER_DUP_ENTRY') return true;
  return isDuplicateKey((e as { cause?: unknown }).cause, depth + 1);
}

export class MySqlOrderRepository implements OrderRepository {
  constructor(private readonly db: Db) {}

  async createIfAbsent(order: Order) {
    try {
      await this.db.insert(orders).values({
        id: order.id,
        paymentRef: order.paymentRef,
        status: order.status,
        lines: [...order.lines],
        totalCents: order.total.cents,
        currency: order.total.currency,
        email: order.email,
        phone: order.phone,
        shipping: order.shipping,
        fulfillmentRef: order.fulfillmentRef,
        createdAt: order.createdAt,
      });
      return { created: true, order };
    } catch (e) {
      if (!isDuplicateKey(e)) throw e;
      const existing = await this.findByPaymentRef(order.paymentRef);
      if (!existing) throw e;
      return { created: false, order: existing };
    }
  }

  /** UPDATE condicional (compare-and-set): gana solo quien cambia 1 fila. */
  async claimForFulfillment(id: string, now: Date, staleBefore: Date) {
    const [res] = await this.db
      .update(orders)
      .set({ status: 'fulfillment_processing', claimedAt: now })
      .where(
        and(
          eq(orders.id, id),
          or(
            eq(orders.status, 'fulfillment_pending'),
            and(eq(orders.status, 'fulfillment_processing'), lt(orders.claimedAt, staleBefore)),
          ),
        ),
      );
    return res.affectedRows === 1;
  }

  async completeFulfillment(id: string, result: { status: 'fulfillment_created'; ref: string } | { status: 'fulfillment_failed' }) {
    await this.db
      .update(orders)
      .set({ status: result.status, ...(result.status === 'fulfillment_created' ? { fulfillmentRef: result.ref } : {}) })
      .where(and(eq(orders.id, id), eq(orders.status, 'fulfillment_processing')));
  }

  async findByPaymentRef(paymentRef: string) {
    const rows = await this.db.select().from(orders).where(eq(orders.paymentRef, paymentRef)).limit(1);
    return rows[0] ? toDomain(rows[0]) : undefined;
  }
}
