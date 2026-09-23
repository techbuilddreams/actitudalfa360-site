'use client';

import { useEffect, useId, useState } from 'react';
import { MAX_QTY_PER_LINE } from '@/domain/cart';

interface Props { sku: string; label: string }

/** Cantidad + compra. El servidor pone el precio; aquí solo enviamos sku y cantidad. */
export function BuyBox({ sku, label }: Props) {
  const id = useId();
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Al volver de Stripe con "Atrás", el navegador puede restaurar la página congelada.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) setBusy(false); };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  async function buy() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ sku, quantity: qty }] }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'No se pudo iniciar el pago.');
      window.location.assign(data.url);
    } catch (e) {
      setError(`${(e as Error).message} Intenta de nuevo en un momento.`);
      setBusy(false);
    }
  }

  return (
    <>
      <div className="buyrow">
        <label className="qty" htmlFor={id}>
          Cantidad
          <select id={id} value={qty} onChange={(e) => setQty(Number(e.target.value))} disabled={busy}>
            {Array.from({ length: MAX_QTY_PER_LINE }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <button className="btn" type="button" onClick={buy} disabled={busy} aria-busy={busy}>
          {busy ? 'Abriendo pago seguro…' : label}
        </button>
      </div>
      <p className="toast-inline" role="status" aria-live="polite">{error}</p>
    </>
  );
}
