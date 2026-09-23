import copy from '@/content/copy.json';
import type { CatalogRepository } from '@/application/ports/catalog';
import type { Product } from '@/domain/product';
import { usd } from '@/domain/money';

const t = copy.products['taza-negra-15oz'];
const v = copy.products['vaso-termico-20oz'];

/**
 * Catálogo: única fuente de verdad de productos, precios e IDs de producción.
 * Para crecer, este adaptador se reemplaza por uno que lea de la base de datos o de un CMS,
 * sin tocar el dominio ni las páginas.
 */
const PRODUCTS: readonly Product[] = [
  {
    slug: 'taza-negra-15oz',
    name: 'Taza negra',
    tag: 'Doble cara',
    category: 'Tazas',
    seo: { title: t.title, description: t.description, keywords: t.keywords },
    h1: t.h1,
    shortPitch: t.shortPitch,
    longDescription: t.longDescription,
    bullets: t.bullets,
    faq: t.faq,
    specs: [
      { label: 'Tamaño', value: '15 oz · 0.44 L' },
      { label: 'Material', value: 'Cerámica negra, acabado brillante' },
      { label: 'Cuidado', value: 'Microondas y lavavajillas' },
    ],
    images: [
      { src: '/img/taza-logo.webp', jpg: '/img/taza-logo.jpg', alt: t.imageAlts[0], width: 1200, height: 1200 },
      { src: '/img/taza-frase.webp', jpg: '/img/taza-frase.jpg', alt: t.imageAlts[1], width: 1200, height: 1200 },
    ],
    variants: [
      {
        sku: 'AA360-TAZA-15-NEGRA',
        label: '15 oz',
        price: usd(2499),
        available: true,
        fulfillment: { provider: 'printify', productId: '6ab327c9f4968858080c763d', variantId: 104470 },
      },
    ],
  },
  {
    slug: 'vaso-termico-20oz',
    name: 'Vaso térmico 20 oz',
    subtitle: 'Tumbler de acero',
    tag: 'Cabe en el portavasos',
    category: 'Vasos térmicos',
    seo: { title: v.title, description: v.description, keywords: v.keywords },
    h1: v.h1,
    shortPitch: v.shortPitch,
    longDescription: v.longDescription,
    bullets: v.bullets,
    faq: v.faq,
    specs: [
      { label: 'Tamaño', value: '20 oz · 3.11″ × 8.42″' },
      { label: 'Material', value: 'Acero inoxidable, tapa y popote' },
      { label: 'Cuidado', value: 'Lavar a mano' },
    ],
    images: [
      { src: '/img/tumbler.webp', jpg: '/img/tumbler.jpg', alt: v.imageAlts[0], width: 1200, height: 1200 },
    ],
    variants: [
      {
        sku: 'AA360-VASO-20-NEGRO',
        label: '20 oz',
        price: usd(3499),
        available: true,
        fulfillment: { provider: 'printify', productId: '6ab327cbb4a5ca59a905799e', variantId: 119531 },
      },
    ],
  },
];

export const staticCatalog: CatalogRepository = {
  all: () => PRODUCTS,
  bySlug: (slug) => PRODUCTS.find((p) => p.slug === slug),
  findVariant: (sku) => {
    for (const product of PRODUCTS) {
      const variant = product.variants.find((x) => x.sku === sku);
      if (variant) return { product, variant };
    }
    return undefined;
  },
};
