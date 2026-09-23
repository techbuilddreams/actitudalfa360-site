import 'server-only';
import { randomUUID } from 'node:crypto';
import { env, isProduction, requireEnv } from '@/config/env';
import { site } from '@/config/site';
import { flatShipping } from '@/domain/cart';
import { makeCreateCheckout } from '@/application/use-cases/create-checkout';
import { makeHandlePayment } from '@/application/use-cases/handle-payment';
import type { OrderRepository } from '@/application/ports/order-repository';
import { staticCatalog } from './catalog/static-catalog';
import { StripeGateway } from './stripe/stripe-gateway';
import { PrintifyFulfillment } from './printify/printify-fulfillment';
import { getDb } from './db/client';
import { MySqlOrderRepository } from './db/mysql-order-repository';
import { InMemoryOrderRepository } from './memory/in-memory-order-repository';
import { consoleLogger } from './notify/console-logger';
import { LogNotifier } from './notify/log-notifier';
import { EmailNotifier } from './notify/email-notifier';
import { CompositeNotifier } from './notify/composite-notifier';
import { SmtpMailer } from './email/smtp-mailer';
import type { Notifier } from '@/application/ports/notifier';
import { createRateLimiter } from './security/rate-limit';

/**
 * Composition root: el ÚNICO lugar que conecta casos de uso con adaptadores concretos.
 * Cambiar Stripe, Printify o la base de datos = cambiar una línea aquí.
 */
let payments: StripeGateway | undefined;
let orders: OrderRepository | undefined;
let notifier: Notifier | undefined;

export const catalog = staticCatalog;
export const logger = consoleLogger;
export const checkoutLimiter = createRateLimiter(10, 60_000);

export function paymentGateway(): StripeGateway {
  payments ??= new StripeGateway({
    secretKey: requireEnv('STRIPE_SECRET_KEY'),
    webhookSecret: env().STRIPE_WEBHOOK_SECRET,
    automaticTax: env().STRIPE_AUTOMATIC_TAX,
    deliveryDays: {
      min: site.shipping.handlingDays.min + site.shipping.transitDays.min,
      max: site.shipping.handlingDays.max + site.shipping.transitDays.max,
    },
  });
  return payments;
}

function orderRepository(): OrderRepository {
  if (orders) return orders;
  const url = env().DATABASE_URL;
  if (url) orders = new MySqlOrderRepository(getDb(url, env().DB_POOL_SIZE));
  else if (isProduction()) throw new Error('DATABASE_URL es obligatoria en producción');
  else {
    logger.warn('Sin DATABASE_URL: pedidos en memoria (solo local)');
    orders = new InMemoryOrderRepository();
  }
  return orders;
}

function notifications(): Notifier {
  if (notifier) return notifier;
  const e = env();
  const list: Notifier[] = [new LogNotifier(logger)];
  if (e.SMTP_USER && e.SMTP_PASSWORD) {
    const mailer = new SmtpMailer({ host: e.SMTP_HOST, port: e.SMTP_PORT, user: e.SMTP_USER, password: e.SMTP_PASSWORD, from: e.MAIL_FROM });
    list.push(new EmailNotifier(mailer, catalog, logger, e.ORDER_NOTIFY_EMAIL));
  } else {
    logger.warn('Correo desactivado: faltan SMTP_USER/SMTP_PASSWORD');
  }
  notifier = new CompositeNotifier(list);
  return notifier;
}

export const createCheckout = () =>
  makeCreateCheckout({
    catalog,
    payments: paymentGateway(),
    shippingFor: flatShipping(env().SHIPPING_FLAT_CENTS),
    siteUrl: env().NEXT_PUBLIC_SITE_URL.replace(/\/$/, ''),
    newId: randomUUID,
  });

export const handlePayment = () =>
  makeHandlePayment({
    orders: orderRepository(),
    catalog,
    fulfillment: env().PRINTIFY_AUTO_ORDER
      ? new PrintifyFulfillment({ token: requireEnv('PRINTIFY_API_TOKEN'), shopId: requireEnv('PRINTIFY_SHOP_ID') })
      : null,
    notifier: notifications(),
    logger,
    newId: randomUUID,
    now: () => new Date(),
  });
