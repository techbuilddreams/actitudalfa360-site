import { DomainError } from './errors';
import { addMoney, multiplyMoney, usd, type Money } from './money';
import type { Product, ProductVariant } from './product';

export const MAX_QTY_PER_LINE = 5;
export const MAX_LINES = 10;

export interface CartLineInput { readonly sku: string; readonly quantity: number }

export interface PricedLine {
  readonly product: Product;
  readonly variant: ProductVariant;
  readonly quantity: number;
  readonly lineTotal: Money;
}

export interface PricedCart {
  readonly lines: readonly PricedLine[];
  readonly subtotal: Money;
  readonly itemCount: number;
}

/** Valida y pone precio al carrito. El precio SIEMPRE sale del catálogo, nunca del cliente. */
export function priceCart(
  input: readonly CartLineInput[],
  findVariant: (sku: string) => { product: Product; variant: ProductVariant } | undefined,
): PricedCart {
  if (input.length === 0) throw new DomainError('EMPTY_CART', 'El carrito está vacío.');
  if (input.length > MAX_LINES) throw new DomainError('TOO_MANY_LINES', 'Demasiados productos en un pedido.');

  // Unifica SKUs repetidos para que el límite por línea no se pueda evadir.
  const merged = new Map<string, number>();
  for (const { sku, quantity } of input) merged.set(sku, (merged.get(sku) ?? 0) + quantity);

  const lines: PricedLine[] = [];
  for (const [sku, quantity] of merged) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY_PER_LINE) {
      throw new DomainError('INVALID_QUANTITY', `La cantidad debe ser entre 1 y ${MAX_QTY_PER_LINE}.`);
    }
    const found = findVariant(sku);
    if (!found) throw new DomainError('UNKNOWN_SKU', 'Producto no encontrado.');
    if (!found.variant.available) throw new DomainError('UNAVAILABLE', 'Este producto no está disponible.');
    lines.push({ ...found, quantity, lineTotal: multiplyMoney(found.variant.price, quantity) });
  }

  return {
    lines,
    subtotal: lines.reduce((acc, l) => addMoney(acc, l.lineTotal), usd(0)),
    itemCount: lines.reduce((n, l) => n + l.quantity, 0),
  };
}

/** Política de envío: una sola regla, configurable. */
export const flatShipping = (flatCents: number): ((cart: PricedCart) => Money) => () => usd(flatCents);
