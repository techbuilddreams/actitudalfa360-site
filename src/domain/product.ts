import type { Money } from './money';

export interface FulfillmentRef {
  readonly provider: 'printify';
  readonly productId: string;
  readonly variantId: number;
}

export interface ProductImage {
  readonly src: string;        // ruta pública optimizada
  readonly jpg: string;        // versión JPG para schema/OG
  readonly alt: string;
  readonly width: number;
  readonly height: number;
}

export interface ProductVariant {
  readonly sku: string;
  readonly label: string;      // "15 oz", "Negro / M"…
  readonly price: Money;
  readonly available: boolean;
  readonly fulfillment: FulfillmentRef;
}

export interface ProductSpec { readonly label: string; readonly value: string }
export interface Faq { readonly q: string; readonly a: string }

export interface Product {
  readonly slug: string;
  readonly name: string;           // nombre corto para tarjeta
  readonly subtitle?: string;
  readonly tag?: string;           // etiqueta visual ("Doble cara")
  readonly seo: { title: string; description: string; keywords: readonly string[] };
  readonly h1: string;
  readonly shortPitch: string;
  readonly longDescription: string;
  readonly bullets: readonly string[];
  readonly specs: readonly ProductSpec[];
  readonly faq: readonly Faq[];
  readonly images: readonly ProductImage[];
  readonly variants: readonly ProductVariant[];
  readonly category: string;
}

export const defaultVariant = (p: Product): ProductVariant => p.variants[0];
