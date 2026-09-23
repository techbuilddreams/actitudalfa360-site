import type { Order } from '@/domain/order';
import type { CatalogRepository } from './catalog';

export interface FulfillmentProvider {
  readonly name: string;
  /** Crea el pedido de producción. Debe quedar EN ESPERA hasta aprobarse. Devuelve id externo. */
  createDraftOrder(order: Order, catalog: CatalogRepository): Promise<string>;
}
