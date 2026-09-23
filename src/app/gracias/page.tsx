import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/config/site';
import { formatMoney } from '@/domain/money';
import { paymentGateway } from '@/infrastructure/container';

export const metadata: Metadata = { title: 'Pedido confirmado', robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ pedido?: string }> };

export default async function Gracias({ searchParams }: Props) {
  const ref = (await searchParams).pedido;
  let summary = null;
  if (ref) {
    try { summary = await paymentGateway().getCheckoutSummary(ref); } catch { summary = null; }
  }
  const { handlingDays: h, transitDays: t } = site.shipping;
  return (
    <section className="doc center center-page">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/sello-320.webp" width={160} height={160} alt="" />
      <span className="mono">{summary?.paid ? `Pedido ${summary.paymentRef.slice(-8).toUpperCase()}` : 'Pedido recibido'}</span>
      <h1>Gracias. Tu pedido está confirmado.</h1>
      {summary?.email && <p>Te enviamos el recibo a <strong>{summary.email}</strong>{summary.total ? ` por ${formatMoney(summary.total)}` : ''}.</p>}
      <p>Se produce a pedido en EE. UU. en {h.min}–{h.max} días hábiles y se entrega en {t.min}–{t.max} días hábiles. Cuando salga te mandamos el número de rastreo.</p>
      <p>¿Alguna duda? Escríbenos a <strong>{site.email}</strong>.</p>
      <Link className="btn" href="/">Volver al inicio</Link>
    </section>
  );
}
