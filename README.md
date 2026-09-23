# actitudalfa360.com

Landing y tienda de **Actitud Alfa 360**. HTML/CSS/JS estático + un endpoint PHP para Stripe Checkout. Sin build.

## Despliegue
Hostinger → Websites → actitudalfa360.com → Advanced → **Git**: repo `techbuilddreams/actitudalfa360-site`, rama `main`, directorio vacío (public_html). Activa **Auto Deployment** y pega el webhook en GitHub → Settings → Webhooks. Cada push a `main` publica el sitio.

## Stripe
1. Copia `aa360-config.example.php` a `domains/actitudalfa360.com/aa360-config.php` (UN NIVEL ARRIBA de `public_html`, con el File Manager).
2. Pon tu `sk_live_...` (o `sk_test_...` para probar).
El archivo nunca va a GitHub.

## Pedidos
Stripe cobra (producto + envío). Cada pago trae en `metadata` el `printify_product_id` y `printify_variant_id`. v1: crear el pedido en Printify a mano. v2: webhook `checkout.session.completed` → API de Printify.

## Productos
`api/products.php` — nombre, precio (centavos), imagen, IDs de Printify.
