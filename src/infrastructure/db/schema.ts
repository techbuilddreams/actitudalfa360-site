import { index, int, json, mysqlTable, timestamp, uniqueIndex, varchar } from 'drizzle-orm/mysql-core';
import type { OrderLine, ShippingAddress } from '@/domain/order';

export const orders = mysqlTable(
  'orders',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    paymentRef: varchar('payment_ref', { length: 255 }).notNull(),
    status: varchar('status', { length: 32 }).notNull(),
    lines: json('lines').$type<OrderLine[]>().notNull(),
    totalCents: int('total_cents').notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    email: varchar('email', { length: 320 }),
    phone: varchar('phone', { length: 40 }),
    shipping: json('shipping').$type<ShippingAddress | null>(),
    fulfillmentRef: varchar('fulfillment_ref', { length: 64 }),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
  },
  (t) => [
    uniqueIndex('orders_payment_ref_uq').on(t.paymentRef), // idempotencia a nivel de base de datos
    index('orders_status_idx').on(t.status),
    index('orders_created_idx').on(t.createdAt),
  ],
);
