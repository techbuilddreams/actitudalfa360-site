import type { CatalogRepository } from '@/application/ports/catalog';
import type { Logger } from '@/application/ports/logger';
import type { Mailer } from '@/application/ports/mailer';
import type { Notifier } from '@/application/ports/notifier';
import type { Order } from '@/domain/order';
import { newSaleEmail, orderConfirmationEmail } from '../email/order-email';

/**
 * Notificador por correo. Un fallo de correo NUNCA rompe el pedido:
 * el pedido ya está guardado; solo se registra el error.
 */
export class EmailNotifier implements Notifier {
  constructor(
    private readonly mailer: Mailer,
    private readonly catalog: CatalogRepository,
    private readonly logger: Logger,
    private readonly ownerEmail?: string,
  ) {}

  async orderPaid(order: Order) {
    const customer = orderConfirmationEmail(order, this.catalog);
    const jobs: Promise<void>[] = [];
    if (customer) jobs.push(this.safeSend(customer, 'customer_confirmation', order));
    if (this.ownerEmail) jobs.push(this.safeSend(newSaleEmail(order, this.catalog, this.ownerEmail), 'owner_new_sale', order));
    await Promise.all(jobs);
  }

  async fulfillmentFailed(order: Order, reason: string) {
    if (!this.ownerEmail) return;
    await this.safeSend(newSaleEmail(order, this.catalog, this.ownerEmail, `⚠️ Printify falló (${reason}). Crear el pedido a mano.`), 'owner_fulfillment_failed', order);
  }

  private async safeSend(msg: Parameters<Mailer['send']>[0], kind: string, order: Order) {
    try {
      await this.mailer.send(msg);
      this.logger.info('email_sent', { kind, orderId: order.id });
    } catch (err) {
      this.logger.error('email_failed', { kind, orderId: order.id, reason: err instanceof Error ? err.message : 'unknown' });
    }
  }
}
