import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { getDb } from '@/infrastructure/db/client';
import { MySqlOrderRepository } from '@/infrastructure/db/mysql-order-repository';
import { usd } from '@/domain/money';

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('MySqlOrderRepository (integración)', () => {
  it('es idempotente por paymentRef y actualiza estado', async () => {
    const repo = new MySqlOrderRepository(getDb(url!));
    const ref = `cs_test_${randomUUID()}`;
    const base = { paymentRef: ref, status: 'paid' as const, lines: [{ sku: 'X', quantity: 1 }], total: usd(100), email: null, phone: null, shipping: null, fulfillmentRef: null, createdAt: new Date() };
    const a = await repo.createIfAbsent({ ...base, id: randomUUID() });
    const b = await repo.createIfAbsent({ ...base, id: randomUUID() });
    expect(a.created).toBe(true);
    expect(b.created).toBe(false);
    expect(b.order.id).toBe(a.order.id);
    await repo.updateStatus(a.order.id, 'fulfillment_created', 'pf_9');
    const found = await repo.findByPaymentRef(ref);
    expect(found?.status).toBe('fulfillment_created');
    expect(found?.fulfillmentRef).toBe('pf_9');
  });
});
