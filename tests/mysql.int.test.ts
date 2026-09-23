import { describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { getDb } from '@/infrastructure/db/client';
import { MySqlOrderRepository } from '@/infrastructure/db/mysql-order-repository';
import { makeHandlePayment } from '@/application/use-cases/handle-payment';
import { staticCatalog } from '@/infrastructure/catalog/static-catalog';
import { usd } from '@/domain/money';

const url = process.env.TEST_DATABASE_URL;
const noop = { info: () => {}, warn: () => {}, error: () => {} };

describe.skipIf(!url)('MySQL (integración, concurrencia real)', () => {
  const repo = () => new MySqlOrderRepository(getDb(url!, 10));

  it('20 webhooks simultáneos del mismo pago ⇒ 1 pedido y 1 producción', async () => {
    const createDraftOrder = vi.fn(async () => { await new Promise((r) => setTimeout(r, 30)); return 'pf_1'; });
    const handle = makeHandlePayment({
      orders: repo(), catalog: staticCatalog, fulfillment: { name: 'fake', createDraftOrder },
      notifier: { orderPaid: async () => {}, fulfillmentFailed: async () => {} }, logger: noop,
      newId: randomUUID, now: () => new Date(),
    });
    const paid = {
      paymentRef: `cs_test_${randomUUID()}`, lines: [{ sku: 'AA360-TAZA-15-NEGRA', quantity: 1 }], total: usd(3398),
      email: null, phone: null,
      shipping: { name: 'A B', line1: '1', city: 'Troy', state: 'NY', postalCode: '12182', country: 'US' },
    };
    const results = await Promise.all(Array.from({ length: 20 }, () => handle(paid)));
    expect(results.filter((r) => r === 'created')).toHaveLength(1);
    expect(createDraftOrder).toHaveBeenCalledTimes(1);
    const order = await repo().findByPaymentRef(paid.paymentRef);
    expect(order?.status).toBe('fulfillment_created');
    expect(order?.fulfillmentRef).toBe('pf_1');
  });

  it('un reclamo vencido (proceso caído) se puede recuperar; uno vigente no', async () => {
    const r = repo();
    const ref = `cs_test_${randomUUID()}`;
    const { order } = await r.createIfAbsent({
      id: randomUUID(), paymentRef: ref, status: 'fulfillment_pending', lines: [{ sku: 'X', quantity: 1 }], total: usd(1),
      email: null, phone: null, shipping: null, fulfillmentRef: null, createdAt: new Date(),
    });
    const t0 = new Date('2026-09-23T10:00:00Z');
    expect(await r.claimForFulfillment(order.id, t0, new Date(t0.getTime() - 300_000))).toBe(true);
    // 1 minuto después: el reclamo sigue vigente
    const t1 = new Date(t0.getTime() + 60_000);
    expect(await r.claimForFulfillment(order.id, t1, new Date(t1.getTime() - 300_000))).toBe(false);
    // 6 minutos después: vencido ⇒ recuperable
    const t2 = new Date(t0.getTime() + 360_000);
    expect(await r.claimForFulfillment(order.id, t2, new Date(t2.getTime() - 300_000))).toBe(true);
  });
});

describe.skipIf(!url)('MySQL constraints', () => {
  it('la base rechaza datos inválidos aunque el código fallara', async () => {
    const db = getDb(url!);
    const { sql } = await import('drizzle-orm');
    await expect(db.execute(sql`INSERT INTO orders (id,payment_ref,status,lines,total_cents,currency,created_at) VALUES (UUID(),'x1','inventado','[{"sku":"A","quantity":1}]',1,'usd',NOW())`)).rejects.toThrow();
    await expect(db.execute(sql`INSERT INTO orders (id,payment_ref,status,lines,total_cents,currency,created_at) VALUES (UUID(),'x2','paid','[]',1,'usd',NOW())`)).rejects.toThrow();
    await expect(db.execute(sql`INSERT INTO orders (id,payment_ref,status,lines,total_cents,currency,created_at) VALUES (UUID(),'x3','paid','[{"sku":"A","quantity":1}]',-5,'usd',NOW())`)).rejects.toThrow();
  });
});
