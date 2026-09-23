import type { Order } from '@/domain/order';

export interface Notifier {
  orderPaid(order: Order): Promise<void>;
  fulfillmentFailed(order: Order, reason: string): Promise<void>;
}
