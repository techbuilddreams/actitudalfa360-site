import type { OrderRepository } from '@/application/ports/order-repository';
import type { Order } from '@/domain/order';

type Row = Order & { claimedAt: Date | null };

/** Para pruebas y desarrollo local. Mismas garantías que MySQL (JS es de un solo hilo). */
export class InMemoryOrderRepository implements OrderRepository {
  private readonly rows = new Map<string, Row>(); // key: paymentRef

  async createIfAbsent(order: Order) {
    const existing = this.rows.get(order.paymentRef);
    if (existing) return { created: false, order: strip(existing) };
    this.rows.set(order.paymentRef, { ...order, claimedAt: null });
    return { created: true, order };
  }

  async claimForFulfillment(id: string, now: Date, staleBefore: Date) {
    const row = this.byId(id);
    if (!row) return false;
    const claimable = row.status === 'fulfillment_pending'
      || (row.status === 'fulfillment_processing' && row.claimedAt !== null && row.claimedAt < staleBefore);
    if (!claimable) return false;
    this.rows.set(row.paymentRef, { ...row, status: 'fulfillment_processing', claimedAt: now });
    return true;
  }

  async completeFulfillment(id: string, result: { status: 'fulfillment_created'; ref: string } | { status: 'fulfillment_failed' }) {
    const row = this.byId(id);
    if (!row || row.status !== 'fulfillment_processing') return;
    this.rows.set(row.paymentRef, { ...row, status: result.status, fulfillmentRef: 'ref' in result ? result.ref : row.fulfillmentRef });
  }

  async findByPaymentRef(paymentRef: string) {
    const r = this.rows.get(paymentRef);
    return r ? strip(r) : undefined;
  }

  private byId(id: string) {
    for (const r of this.rows.values()) if (r.id === id) return r;
    return undefined;
  }
}

function strip(row: Row): Order {
  const copy: Partial<Row> = { ...row };
  delete copy.claimedAt;
  return copy as Order;
}
