import { describe, expect, it } from 'vitest';
import { priceCart } from '@/domain/cart';
import { DomainError } from '@/domain/errors';
import { staticCatalog } from '@/infrastructure/catalog/static-catalog';

const find = (sku: string) => staticCatalog.findVariant(sku);
const TAZA = 'AA360-TAZA-15-NEGRA';
const VASO = 'AA360-VASO-20-NEGRO';

describe('priceCart', () => {
  it('usa el precio del catálogo, no el del cliente', () => {
    const cart = priceCart([{ sku: TAZA, quantity: 2 }, { sku: VASO, quantity: 1 }], find);
    expect(cart.subtotal.cents).toBe(2499 * 2 + 3499);
    expect(cart.itemCount).toBe(3);
  });

  it('une SKUs repetidos para no evadir el límite por línea', () => {
    expect(() => priceCart([{ sku: TAZA, quantity: 3 }, { sku: TAZA, quantity: 3 }], find)).toThrow(DomainError);
  });

  it.each([0, -1, 6, 1.5])('rechaza cantidad %s', (q) => {
    expect(() => priceCart([{ sku: TAZA, quantity: q }], find)).toThrow(DomainError);
  });

  it('rechaza SKU desconocido y carrito vacío', () => {
    expect(() => priceCart([{ sku: 'NOPE', quantity: 1 }], find)).toThrow(/no encontrado/);
    expect(() => priceCart([], find)).toThrow(/vacío/);
  });
});
