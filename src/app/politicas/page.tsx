import type { Metadata } from 'next';
import copy from '@/content/copy.json';
import { site } from '@/config/site';
import { env } from '@/config/env';
import { formatMoney } from '@/domain/money';

export const metadata: Metadata = {
  title: { absolute: copy.politicas.title },
  description: copy.politicas.description,
  alternates: { canonical: '/politicas' },
};

export default function Politicas() {
  const ship = formatMoney({ cents: env().SHIPPING_FLAT_CENTS, currency: 'usd' });
  const { handlingDays: h, transitDays: t } = site.shipping;
  return (
    <article className="doc">
      <span className="mono">Actualizado: septiembre 2026</span>
      <h1>Políticas</h1>

      <h2 id="envios">Envíos</h2>
      <p>Cada producto se imprime a pedido en EE. UU. La producción toma <strong>{h.min}–{h.max} días hábiles</strong> y la entrega <strong>{t.min}–{t.max} días hábiles</strong> más. El envío cuesta <strong>{ship}</strong> por pedido y se muestra antes de pagar. Por ahora enviamos solo dentro de Estados Unidos. Cuando tu pedido salga, recibirás el número de rastreo por correo.</p>

      <h2 id="devoluciones">Devoluciones y cambios</h2>
      <p>Como cada pieza se hace especialmente para ti, no aceptamos devoluciones por cambio de opinión. Si tu producto llega <strong>dañado, defectuoso o equivocado</strong>, escríbenos dentro de los <strong>{site.returns.days} días</strong> siguientes a la entrega con una foto y tu número de pedido, y te enviamos un reemplazo o te devolvemos el dinero sin costo para ti.</p>

      <h2 id="privacidad">Privacidad</h2>
      <p>Solo pedimos los datos necesarios para procesar y enviar tu pedido: nombre, correo, teléfono y dirección de envío. Los pagos los procesa <strong>Stripe</strong>; nunca vemos ni guardamos los datos de tu tarjeta. Compartimos tu nombre y dirección únicamente con nuestro socio de impresión y la compañía de envío para entregar tu pedido. No vendemos tus datos. Para pedir que borremos tu información, escríbenos.</p>

      <h2 id="terminos">Términos</h2>
      <p>{site.name} es una marca de {site.legalName} (Nueva York, EE. UU.). Los precios están en dólares estadounidenses y pueden cambiar sin aviso; el precio que pagas es el que ves al confirmar. Los colores pueden variar ligeramente entre la pantalla y el producto impreso. El nombre, el sello y los diseños de {site.name} son propiedad de la marca.</p>

      <h2 id="contacto">Contacto</h2>
      <p><strong>{site.email}</strong></p>
    </article>
  );
}
