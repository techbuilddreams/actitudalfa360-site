import type { Order, OrderStatus } from '@/domain/order';

export interface OrderRepository {
  /** Inserta si no existe (idempotente por paymentRef). `created=false` si ya existía. */
  createIfAbsent(order: Order): Promise<{ created: boolean; order: Order }>;
  updateStatus(id: string, status: OrderStatus, fulfillmentRef?: string | null): Promise<void>;
  findByPaymentRef(paymentRef: string): Promise<Order | undefined>;
}
