import { FULFILLMENT_CLAIM_TTL_MS, type Order } from '@/domain/order';
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

    // 1) Registro idempotente (índice único en paymentRef).
    const { created, order } = await deps.orders.createIfAbsent(draft);
    if (created) await deps.notifier.orderPaid(order);
    else deps.logger.info('Pago ya registrado', { paymentRef: paid.paymentRef });

    // 2) Producción: solo el proceso que gana el reclamo atómico la ejecuta.
    //    Un reintento de Stripe recupera pedidos cuyo proceso anterior se cayó a mitad.
    if (deps.fulfillment) {
      const now = deps.now();
      const staleBefore = new Date(now.getTime() - FULFILLMENT_CLAIM_TTL_MS);
      if (await deps.orders.claimForFulfillment(order.id, now, staleBefore)) {
        try {
          const ref = await deps.fulfillment.createDraftOrder(order, deps.catalog);
          await deps.orders.completeFulfillment(order.id, { status: 'fulfillment_created', ref });
        } catch (err) {
          const reason = err instanceof Error ? err.message : 'desconocido';
          deps.logger.error('No se pudo crear el pedido de producción', { orderId: order.id, reason });
          await deps.orders.completeFulfillment(order.id, { status: 'fulfillment_failed' });
          await deps.notifier.fulfillmentFailed(order, reason);
        }
      }
    }

    return created ? 'created' : 'duplicate';
  };
}
