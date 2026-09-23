import type { OrderRepository } from '@/application/ports/order-repository';
import type { Order, OrderStatus } from '@/domain/order';

/** Para pruebas y desarrollo local. Nunca en producción. */
export class InMemoryOrderRepository implements OrderRepository {
  readonly byRef = new Map<string, Order>();

  async createIfAbsent(order: Order) {
    const existing = this.byRef.get(order.paymentRef);
    if (existing) return { created: false, order: existing };
    this.byRef.set(order.paymentRef, order);
    return { created: true, order };
  }

  async updateStatus(id: string, status: OrderStatus, fulfillmentRef?: string | null) {
    for (const [ref, o] of this.byRef) {
      if (o.id === id) this.byRef.set(ref, { ...o, status, fulfillmentRef: fulfillmentRef ?? o.fulfillmentRef });
    }
  }

  async findByPaymentRef(paymentRef: string) {
    return this.byRef.get(paymentRef);
  }
}
