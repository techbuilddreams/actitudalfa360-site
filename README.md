# actitudalfa360.com

Landing y tienda de **Actitud Alfa 360**. HTML/CSS/JS estático + PHP mínimo para Stripe. Sin dependencias, sin build.

```
/                 → sitio público (public_html)
api/checkout.php  → crea la sesión de Stripe Checkout
api/webhook.php   → recibe pagos de Stripe (firma verificada)
api/_lib/         → código interno (bloqueado por .htaccess)
```

## Secretos (.env) — nunca en GitHub
En el servidor, **un nivel arriba de `public_html`**:
```
domains/actitudalfa360.com/
├── .env            ← copia de .env.example con tus llaves (permisos 600)
├── storage/        ← pedidos y límites (se crea solo, 700)
└── public_html/    ← este repo
```
El servidor web no puede servir nada fuera de `public_html`.

## Despliegue
Hostinger → Git conectado a `techbuilddreams/actitudalfa360-site`, rama `main`, auto-deploy. Push a `main` = sitio publicado. CI revisa sintaxis PHP y que no se suban llaves.

## Stripe
- Llave **restringida** (`rk_live_…`) solo con *Checkout Sessions: Write*.
- Webhook → `https://actitudalfa360.com/api/webhook.php`, evento `checkout.session.completed`, secreto en `STRIPE_WEBHOOK_SECRET`.
- El precio siempre lo pone el servidor (`api/_lib/products.php`); el navegador solo manda `sku` y `qty`.

## Seguridad incluida
HTTPS + HSTS · CSP estricta · sin iframes (clickjacking) · verificación de origen en el checkout · límite de 10 intentos/min por IP · firma HMAC + ventana de 5 min en el webhook · idempotencia de pedidos · errores sin detalles al cliente · archivos privados bloqueados · `security.txt`.

## Checklist de cuentas
- [ ] 2FA en Stripe, Hostinger y GitHub
- [ ] Protección de rama `main` en GitHub
- [ ] Stripe Radar activo (viene por defecto)
