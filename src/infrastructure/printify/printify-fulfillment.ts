import 'server-only';
import type { CatalogRepository } from '@/application/ports/catalog';
import type { FulfillmentProvider } from '@/application/ports/fulfillment';
import type { Order } from '@/domain/order';

/** Crea pedidos en Printify. Sin `send_to_production`: quedan EN ESPERA hasta aprobarlos. */
export class PrintifyFulfillment implements FulfillmentProvider {
  readonly name = 'printify';

  constructor(private readonly opts: { token: string; shopId: string }) {}

  async createDraftOrder(order: Order, catalog: CatalogRepository): Promise<string> {
    if (!order.shipping) throw new Error('Pedido sin dirección de envío');
    const [first, ...rest] = order.shipping.name.trim().split(/\s+/);

    const line_items = order.lines.map((l) => {
      const found = catalog.findVariant(l.sku);
      if (!found) throw new Error(`SKU desconocido: ${l.sku}`);
      const f = found.variant.fulfillment;
      return { product_id: f.productId, variant_id: f.variantId, quantity: l.quantity };
    });

    const res = await fetch(`https://api.printify.com/v1/shops/${this.opts.shopId}/orders.json`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.opts.token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'actitudalfa360',
      },
      body: JSON.stringify({
        external_id: order.paymentRef,
        label: `Web ${order.id.slice(0, 8)}`,
        line_items,
        shipping_method: 1,
        send_shipping_notification: true,
        address_to: {
          first_name: first ?? '',
          last_name: rest.join(' '),
          email: order.email ?? undefined,
          phone: order.phone ?? undefined,
          country: order.shipping.country,
          region: order.shipping.state,
          address1: order.shipping.line1,
          address2: order.shipping.line2 ?? '',
          city: order.shipping.city,
          zip: order.shipping.postalCode,
        },
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`Printify HTTP ${res.status}`);
    const data = (await res.json()) as { id?: string };
    if (!data.id) throw new Error('Printify no devolvió id');
    return data.id;
  }
}
