import type { Order } from '@/domain/order';
import type { CatalogRepository } from '../ports/catalog';
import type { FulfillmentProvider } from '../ports/fulfillment';
import type { Logger } from '../ports/logger';
import type { Notifier } from '../ports/notifier';
import type { OrderRepository } from '../ports/order-repository';
import type { PaidCheckout } from '../ports/payment-gateway';

export interface HandlePaymentDeps {
  orders: OrderRepository;
  catalog: CatalogRepository;
  fulfillment: FulfillmentProvider | null;   // null = crear el pedido de producción a mano
  notifier: Notifier;
  logger: Logger;
  newId: () => string;
  now: () => Date;
}

export type HandlePaymentResult = 'created' | 'duplicate';

/**
 * Caso de uso: registrar un pago confirmado exactamente una vez
 * y (opcionalmente) crear el pedido de producción en espera.
 */
export function makeHandlePayment(deps: HandlePaymentDeps) {
  return async (paid: PaidCheckout): Promise<HandlePaymentResult> => {
    const draft: Order = {
      id: deps.newId(),
      paymentRef: paid.paymentRef,
      status: deps.fulfillment ? 'fulfillment_pending' : 'paid',
      lines: paid.lines,
      total: paid.total,
      email: paid.email,
      phone: paid.phone,
      shipping: paid.shipping,
      fulfillmentRef: null,
      createdAt: deps.now(),
    };

    const { created, order } = await deps.orders.createIfAbsent(draft);
    if (!created) {
      deps.logger.info('Pago duplicado ignorado', { paymentRef: paid.paymentRef });
      return 'duplicate';
    }

    if (deps.fulfillment) {
      try {
        const ref = await deps.fulfillment.createDraftOrder(order, deps.catalog);
        await deps.orders.updateStatus(order.id, 'fulfillment_created', ref);
      } catch (err) {
        const reason = err instanceof Error ? err.message : 'desconocido';
        deps.logger.error('No se pudo crear el pedido de producción', { orderId: order.id, reason });
        await deps.orders.updateStatus(order.id, 'fulfillment_failed');
        await deps.notifier.fulfillmentFailed(order, reason);
      }
    }

    await deps.notifier.orderPaid(order);
    return 'created';
  };
}
