# actitudalfa360.com

Tienda y sitio de **Actitud Alfa 360**. Next.js 16 (App Router) + TypeScript estricto, Stripe Checkout, MySQL (Drizzle), Printify.

## Arquitectura (limpia / hexagonal)

```
src/
├── domain/            Reglas puras: Money, Product, Cart, Order. Sin frameworks.
├── application/
│   ├── ports/         Interfaces: PaymentGateway, OrderRepository, FulfillmentProvider, CatalogRepository, Notifier, Logger
│   └── use-cases/     createCheckout, handlePayment (idempotente)
├── infrastructure/    Adaptadores: Stripe, Printify, MySQL/Drizzle, memoria, seguridad
│   └── container.ts   Composition root: el único lugar que conecta todo
├── app/               Next.js: páginas + route handlers (delgados: validan y llaman casos de uso)
├── components/        UI
├── content/copy.json  Copy SEO (una sola fuente)
└── config/            env.ts (validado con Zod) · site.ts (datos de marca)
```

- **SOLID:** el dominio no conoce Stripe ni Next (inversión de dependencias). Cambiar Printify→Printful = un adaptador nuevo + una línea en `container.ts`.
- **DRY:** precios/productos en `static-catalog.ts`; datos de marca en `site.ts`; schema.org en `lib/structured-data.ts`.

## Ramas y entornos

| Rama | Entorno | Dominio | Stripe | Indexable |
|---|---|---|---|---|
| `develop` | Preview | preview.actitudalfa360.com | `rk_test_` | No (noindex) |
| `main` | Producción | actitudalfa360.com | `rk_live_` | Sí |

Flujo: rama de trabajo → PR a `develop` → revisar en preview → PR `develop` → `main`. CI (lint, typecheck, tests, build, escaneo de llaves) corre en cada push/PR.

## Variables de entorno

Ver `.env.example`. Se configuran en Hostinger (Web App → Environment variables). **Nunca** en el repo.

## Comandos

```bash
npm run dev          # local
npm run check        # lint + typecheck + tests
npm run build        # build de producción
npm start            # migra la base de datos y arranca
npm run db:generate  # nueva migración tras cambiar src/infrastructure/db/schema.ts
```

Test de integración MySQL: `TEST_DATABASE_URL=mysql://… npm test`.

## Seguridad

- CSP estricta con nonce por petición (`src/proxy.ts`), HSTS, X-Frame-Options DENY, sin `X-Powered-By`.
- Precios siempre del servidor; el cliente solo envía `sku` y `quantity` (validado con Zod).
- Checkout: verificación de origen, rate limit 10/min por IP, tamaño máximo de petición.
- Webhook: firma de Stripe verificada con el SDK; idempotencia por índice único en MySQL; 500 ⇒ Stripe reintenta.
- Llave de Stripe restringida (solo Checkout Sessions, Products, Prices, Shipping Rates).
- Pedidos de Printify se crean **en espera**: nada se produce sin aprobación.
- Dependabot semanal sobre `develop`.
