import type { Notifier } from '@/application/ports/notifier';

/** Reparte cada aviso a varios notificadores (log + correo…). */
export class CompositeNotifier implements Notifier {
  constructor(private readonly notifiers: readonly Notifier[]) {}
  async orderPaid(o: Parameters<Notifier['orderPaid']>[0]) {
    await Promise.all(this.notifiers.map((n) => n.orderPaid(o)));
  }
  async fulfillmentFailed(o: Parameters<Notifier['fulfillmentFailed']>[0], r: string) {
    await Promise.all(this.notifiers.map((n) => n.fulfillmentFailed(o, r)));
  }
}
