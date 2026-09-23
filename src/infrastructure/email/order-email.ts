import { deliveryPromise, site } from '@/config/site';
import { formatMoney, usd } from '@/domain/money';
import type { Order } from '@/domain/order';
import type { CatalogRepository } from '@/application/ports/catalog';
import type { EmailMessage } from '@/application/ports/mailer';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const shortRef = (o: Order) => o.paymentRef.slice(-8).toUpperCase();

function lineItems(order: Order, catalog: CatalogRepository) {
  return order.lines.map((l) => {
    const found = catalog.findVariant(l.sku);
    const label = found && !found.product.name.includes(found.variant.label) ? ` — ${found.variant.label}` : '';
    const name = found ? `${found.product.name}${label}` : l.sku;
    const cents = found ? found.variant.price.cents * l.quantity : 0;
    return { name, quantity: l.quantity, total: found ? formatMoney(usd(cents)) : '', cents };
  });
}

/** Correo de confirmación al cliente (HTML con estilos en línea + texto plano). */
export function orderConfirmationEmail(order: Order, catalog: CatalogRepository): EmailMessage | null {
  if (!order.email) return null;
  const items = lineItems(order, catalog);
  const subtotal = items.reduce((n, i) => n + i.cents, 0);
  const shipping = Math.max(0, order.total.cents - subtotal); // envío (+ impuestos si aplican)
  const name = order.shipping?.name?.split(' ')[0] ?? '';
  const a = order.shipping;
  const address: string[] = a ? [a.name, a.line1, a.line2 ?? "", `${a.city}, ${a.state} ${a.postalCode}`].filter((x) => x.length > 0) : [];

  const rows = items
    .map((i) => `<tr><td style="padding:10px 0;border-bottom:1px solid #2A2926;color:#ECE8E0">${esc(i.name)} × ${i.quantity}</td><td align="right" style="padding:10px 0;border-bottom:1px solid #2A2926;color:#ECE8E0;font-family:Menlo,monospace">${i.total}</td></tr>`)
    .join('');

  const html = `<!doctype html><html lang="es"><body style="margin:0;background:#0E0E0D;font-family:Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0E0E0D;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding-bottom:24px"><img src="${site.url}/img/icon-192.png" width="64" height="64" alt="${site.name}" style="display:block"></td></tr>
<tr><td style="color:#9C978C;font:12px Menlo,monospace;letter-spacing:2px;text-transform:uppercase">Pedido ${shortRef(order)}</td></tr>
<tr><td style="color:#ECE8E0;font-size:30px;font-weight:bold;line-height:1.15;padding:10px 0 16px;text-transform:uppercase">Gracias${name ? `, ${esc(name)}` : ''}. Tu pedido está confirmado.</td></tr>
<tr><td style="color:#9C978C;font-size:15px;line-height:1.6;padding-bottom:24px">${esc(deliveryPromise)}. Cuando salga te enviaremos el número de rastreo.</td></tr>
<tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:15px">${rows}
<tr><td style="padding:10px 0;border-bottom:1px solid #2A2926;color:#9C978C">Envío</td><td align="right" style="padding:10px 0;border-bottom:1px solid #2A2926;color:#9C978C;font-family:Menlo,monospace">${formatMoney(usd(shipping))}</td></tr>
<tr><td style="padding:14px 0;color:#ECE8E0;font-weight:bold">Total pagado</td><td align="right" style="padding:14px 0;color:#ECE8E0;font-weight:bold;font-family:Menlo,monospace">${formatMoney(order.total)}</td></tr></table></td></tr>
${address.length ? `<tr><td style="padding-top:20px;color:#9C978C;font-size:14px;line-height:1.6"><span style="color:#B89A5E;font:12px Menlo,monospace;letter-spacing:2px;text-transform:uppercase">Envío a</span><br>${address.map(esc).join('<br>')}</td></tr>` : ''}
<tr><td style="padding-top:28px;border-top:1px solid #2A2926;margin-top:28px;color:#9C978C;font-size:13px;line-height:1.6">¿Dudas? Responde a este correo o escríbenos a ${site.email}.<br>${site.name} · ${site.legalName} · <a href="${site.url}" style="color:#B89A5E">${site.url.replace('https://', '')}</a></td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    `Gracias${name ? `, ${name}` : ''}. Tu pedido ${shortRef(order)} está confirmado.`,
    '',
    ...items.map((i) => `- ${i.name} x${i.quantity}  ${i.total}`),
    `Envío: ${formatMoney(usd(shipping))}`,
    `Total pagado: ${formatMoney(order.total)}`,
    '',
    address.length ? `Envío a:\n${address.join('\n')}\n` : '',
    `${deliveryPromise}. Te enviaremos el número de rastreo cuando salga.`,
    '',
    `¿Dudas? ${site.email}`,
  ].join('\n');

  return { to: order.email, subject: `Pedido ${shortRef(order)} confirmado · ${site.name}`, html, text, replyTo: site.email };
}

/** Aviso interno de nueva venta. */
export function newSaleEmail(order: Order, catalog: CatalogRepository, to: string, note?: string): EmailMessage {
  const items = lineItems(order, catalog);
  const text = [
    `Nueva venta ${shortRef(order)} — ${formatMoney(order.total)}`,
    ...items.map((i) => `- ${i.name} x${i.quantity}`),
    `Cliente: ${order.email ?? 's/e'} ${order.phone ?? ''}`,
    note ?? (order.fulfillmentRef ? `Printify: ${order.fulfillmentRef}` : 'Crear el pedido en Printify.'),
  ].join('\n');
  return { to, subject: `💰 Nueva venta ${formatMoney(order.total)} · ${shortRef(order)}`, text, html: `<pre style="font:14px Menlo,monospace">${esc(text)}</pre>` };
}
