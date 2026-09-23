import type { Order, OrderStatus } from '@/domain/order';

export interface OrderRepository {
  /** Inserta si no existe (idempotente por paymentRef, garantizado por índice único). */
  createIfAbsent(order: Order): Promise<{ created: boolean; order: Order }>;

  /**
   * Reclamo atómico para producir el pedido (compare-and-set):
   * pasa a `fulfillment_processing` solo si está `fulfillment_pending`, o si un reclamo anterior venció.
   * Devuelve true únicamente al proceso que ganó el reclamo.
   */
  claimForFulfillment(id: string, now: Date, staleBefore: Date): Promise<boolean>;

  /** Cierra el reclamo: solo si sigue en `fulfillment_processing`. */
  completeFulfillment(id: string, result: { status: 'fulfillment_created'; ref: string } | { status: 'fulfillment_failed' }): Promise<void>;

  findByPaymentRef(paymentRef: string): Promise<Order | undefined>;
}

export type { OrderStatus };
