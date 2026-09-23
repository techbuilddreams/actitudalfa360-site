import type { Product, ProductVariant } from '@/domain/product';

export interface CatalogRepository {
  all(): readonly Product[];
  bySlug(slug: string): Product | undefined;
  findVariant(sku: string): { product: Product; variant: ProductVariant } | undefined;
}
