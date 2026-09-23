import { sql } from 'drizzle-orm';
import { check, char, index, int, json, mysqlEnum, mysqlTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/mysql-core';
import type { OrderLine, OrderStatus, ShippingAddress } from '@/domain/order';

const STATUSES = ['paid', 'fulfillment_pending', 'fulfillment_processing', 'fulfillment_created', 'fulfillment_failed'] as const satisfies readonly OrderStatus[];

export const orders = mysqlTable(
  'orders',
  {
    id: char('id', { length: 36 }).primaryKey(),
    paymentRef: varchar('payment_ref', { length: 255 }).notNull(),
    status: mysqlEnum('status', STATUSES).notNull(),
    lines: json('lines').$type<OrderLine[]>().notNull(),
    totalCents: int('total_cents', { unsigned: true }).notNull(),
    currency: char('currency', { length: 3 }).notNull(),
    email: varchar('email', { length: 320 }),
    phone: varchar('phone', { length: 40 }),
    shipping: json('shipping').$type<ShippingAddress | null>(),
    fulfillmentRef: varchar('fulfillment_ref', { length: 64 }),
    claimedAt: timestamp('claimed_at'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (t) => [
    uniqueIndex('orders_payment_ref_uq').on(t.paymentRef), // idempotencia a nivel de base de datos
    // Índice compuesto: cubre "pedidos por estado, recientes primero" (panel/reintentos) y el filtro por estado.
    index('orders_status_created_idx').on(t.status, t.createdAt),
    index('orders_created_idx').on(t.createdAt),
    check('orders_currency_ck', sql`${t.currency} = 'usd'`),
    check('orders_lines_ck', sql`JSON_LENGTH(${t.lines}) > 0`),
  ],
);
