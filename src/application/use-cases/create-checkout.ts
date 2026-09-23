import { priceCart, type CartLineInput, type PricedCart } from '@/domain/cart';
import type { Money } from '@/domain/money';
import type { CatalogRepository } from '../ports/catalog';
import type { PaymentGateway } from '../ports/payment-gateway';

export interface CreateCheckoutDeps {
  catalog: CatalogRepository;
  payments: PaymentGateway;
  shippingFor: (cart: PricedCart) => Money;
  siteUrl: string;
  newId: () => string;
}

/** Caso de uso: convertir un carrito en una sesión de pago segura. */
export function makeCreateCheckout(deps: CreateCheckoutDeps) {
  return async (lines: readonly CartLineInput[]): Promise<{ url: string }> => {
    const cart = priceCart(lines, (sku) => deps.catalog.findVariant(sku));
    return deps.payments.createCheckout({
      cart,
      shipping: deps.shippingFor(cart),
      successUrl: `${deps.siteUrl}/gracias?pedido={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${deps.siteUrl}/#tienda`,
      idempotencyKey: deps.newId(),
    });
  };
}
