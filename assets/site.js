// Actitud Alfa 360 — compra con Stripe Checkout
(function () {
  const toast = document.getElementById('toast');
  let t;
  function say(msg) {
    toast.textContent = msg; toast.hidden = false;
    clearTimeout(t); t = setTimeout(() => { toast.hidden = true; }, 5000);
  }
  document.querySelectorAll('[data-buy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const sku = btn.dataset.buy;
      const qtyEl = document.getElementById('qty-' + sku);
      const qty = qtyEl ? parseInt(qtyEl.value, 10) : 1;
      const label = btn.textContent;
      btn.disabled = true; btn.textContent = 'Abriendo pago seguro…';
      try {
        const res = await fetch('/api/checkout.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sku, qty })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) throw new Error(data.error || 'No se pudo iniciar el pago.');
        window.location.href = data.url;
      } catch (e) {
        say(e.message + ' Intenta de nuevo en un momento.');
        btn.disabled = false; btn.textContent = label;
      }
    });
  });
  // Al volver de Stripe con "Atrás", el navegador restaura la página congelada: recargar.
  window.addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); });

  // Vistas del producto (lado logo / lado frase), funciona en móvil y teclado.
  document.querySelectorAll('[data-view]').forEach((b) => {
    b.addEventListener('click', () => {
      const card = b.closest('.product');
      card.classList.toggle('show-alt', b.dataset.view === 'alt');
      card.querySelectorAll('[data-view]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    });
  });

  const y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
})();
