import { describe, expect, it, vi } from 'vitest';
import { makeHandlePayment } from '@/application/use-cases/handle-payment';
import type { FulfillmentProvider } from '@/application/ports/fulfillment';
import type { PaidCheckout } from '@/application/ports/payment-gateway';
import { usd } from '@/domain/money';
import { staticCatalog } from '@/infrastructure/catalog/static-catalog';
import { InMemoryOrderRepository } from '@/infrastructure/memory/in-memory-order-repository';

const paid: PaidCheckout = {
  paymentRef: 'cs_test_123',
  lines: [{ sku: 'AA360-TAZA-15-NEGRA', quantity: 1 }],
  total: usd(3398),
  email: 'a@b.com',
  phone: null,
  shipping: { name: 'Luis Ramos', line1: '1 Main St', city: 'Troy', state: 'NY', postalCode: '12182', country: 'US' },
};

const setup = (fulfillment: FulfillmentProvider | null) => {
  const orders = new InMemoryOrderRepository();
  const notifier = { orderPaid: vi.fn(async () => {}), fulfillmentFailed: vi.fn(async () => {}) };
  let n = 0;
  const handle = makeHandlePayment({
    orders, catalog: staticCatalog, fulfillment, notifier,
    logger: { info: () => {}, warn: () => {}, error: () => {} },
    newId: () => `id-${++n}`, now: () => new Date('2026-09-23T00:00:00Z'),
  });
  return { orders, notifier, handle };
};

describe('handlePayment', () => {
  it('registra el pedido una sola vez aunque Stripe reenvíe el evento', async () => {
    const createDraftOrder = vi.fn(async () => 'pf_1');
    const { orders, handle } = setup({ name: 'fake', createDraftOrder });
    expect(await handle(paid)).toBe('created');
    expect(await handle(paid)).toBe('duplicate');
    expect(createDraftOrder).toHaveBeenCalledTimes(1);
    expect((await orders.findByPaymentRef('cs_test_123'))?.status).toBe('fulfillment_created');
  });

  it('si Printify falla, el pedido queda guardado y se avisa', async () => {
    const { orders, notifier, handle } = setup({ name: 'fake', createDraftOrder: async () => { throw new Error('HTTP 500'); } });
    await handle(paid);
    expect((await orders.findByPaymentRef('cs_test_123'))?.status).toBe('fulfillment_failed');
    expect(notifier.fulfillmentFailed).toHaveBeenCalledOnce();
    expect(notifier.orderPaid).toHaveBeenCalledOnce();
  });

  it('sin proveedor de producción, queda como pagado para crearlo a mano', async () => {
    const { orders, handle } = setup(null);
    await handle(paid);
    expect((await orders.findByPaymentRef('cs_test_123'))?.status).toBe('paid');
  });
});
