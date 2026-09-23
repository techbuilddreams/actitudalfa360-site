import { describe, expect, it, vi } from 'vitest';
import { EmailNotifier } from '@/infrastructure/notify/email-notifier';
import { orderConfirmationEmail } from '@/infrastructure/email/order-email';
import { staticCatalog } from '@/infrastructure/catalog/static-catalog';
import { usd } from '@/domain/money';
import type { Order } from '@/domain/order';

const order: Order = {
  id: 'o1', paymentRef: 'cs_test_abcdefgh12345678', status: 'paid',
  lines: [{ sku: 'AA360-TAZA-15-NEGRA', quantity: 2 }], total: usd(5897),
  email: 'cliente@example.com', phone: null,
  shipping: { name: 'Ana <b>Pérez</b>', line1: '1 Main', city: 'Troy', state: 'NY', postalCode: '12182', country: 'US' },
  fulfillmentRef: null, createdAt: new Date(),
};
const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

describe('correo de confirmación', () => {
  it('incluye producto, total y escapa HTML del cliente', () => {
    const m = orderConfirmationEmail(order, staticCatalog)!;
    expect(m.to).toBe('cliente@example.com');
    expect(m.subject).toContain('12345678');
    expect(m.html).toContain('Taza negra');
    expect(m.html).toContain('$58.97');
    expect(m.html).not.toContain('<b>Pérez</b>');
    expect(m.html).toContain('&lt;b&gt;');
    expect(m.text).toContain('Total pagado: $58.97');
  });

  it('sin email del cliente no genera correo', () => {
    expect(orderConfirmationEmail({ ...order, email: null }, staticCatalog)).toBeNull();
  });

  it('si el SMTP falla, no rompe el flujo del pedido', async () => {
    const mailer = { send: vi.fn(async () => { throw new Error('SMTP down'); }) };
    const n = new EmailNotifier(mailer, staticCatalog, logger, 'dueño@example.com');
    await expect(n.orderPaid(order)).resolves.toBeUndefined();
    expect(mailer.send).toHaveBeenCalledTimes(2);
    expect(logger.error).toHaveBeenCalled();
  });
});
