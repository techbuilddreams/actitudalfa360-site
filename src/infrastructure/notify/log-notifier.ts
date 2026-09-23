import type { Logger } from '@/application/ports/logger';
import type { Notifier } from '@/application/ports/notifier';

/** Notificador base: deja registro. Stripe ya envía el recibo al cliente y el aviso de venta a ti. */
export class LogNotifier implements Notifier {
  constructor(private readonly logger: Logger) {}
  async orderPaid(order: Parameters<Notifier['orderPaid']>[0]) {
    this.logger.info('Nueva venta', { orderId: order.id, total: order.total.cents, items: order.lines.length });
  }
  async fulfillmentFailed(order: Parameters<Notifier['fulfillmentFailed']>[0], reason: string) {
    this.logger.error('Crear pedido en Printify a mano', { orderId: order.id, reason });
  }
}
