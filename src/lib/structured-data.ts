import copy from '@/content/copy.json';
import { site } from '@/config/site';
import { toDecimalString } from '@/domain/money';
import { defaultVariant, type Faq, type Product } from '@/domain/product';

/** Constructores de schema.org: una sola implementación para todas las páginas (DRY). */
const abs = (path: string) => `${site.url}${path}`;
const ORG_ID = abs('/#org');

const returnPolicy = {
  '@type': 'MerchantReturnPolicy',
  applicableCountry: 'US',
  returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
  merchantReturnDays: site.returns.days,
  returnMethod: 'https://schema.org/ReturnByMail',
  returnFees: 'https://schema.org/FreeReturn',
  itemCondition: 'https://schema.org/DamagedCondition',
  url: abs('/politicas#devoluciones'),
};

const shippingDetails = (flatCents: number) => ({
  '@type': 'OfferShippingDetails',
  shippingRate: { '@type': 'MonetaryAmount', value: (flatCents / 100).toFixed(2), currency: 'USD' },
  shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'US' },
  deliveryTime: {
    '@type': 'ShippingDeliveryTime',
    handlingTime: { '@type': 'QuantitativeValue', minValue: site.shipping.handlingDays.min, maxValue: site.shipping.handlingDays.max, unitCode: 'DAY' },
    transitTime: { '@type': 'QuantitativeValue', minValue: site.shipping.transitDays.min, maxValue: site.shipping.transitDays.max, unitCode: 'DAY' },
  },
});

export const organizationLd = () => ({
  '@type': 'Organization',
  '@id': ORG_ID,
  name: site.name,
  url: site.url,
  logo: abs('/img/icon-512.png'),
  email: site.email,
  slogan: copy.organization.slogan,
  description: copy.organization.description,
  parentOrganization: { '@type': 'Organization', name: site.legalName },
  hasMerchantReturnPolicy: returnPolicy,
});

export const websiteLd = () => ({ '@type': 'WebSite', '@id': abs('/#web'), url: site.url, name: site.name, inLanguage: 'es-US', publisher: { '@id': ORG_ID } });

export const productLd = (p: Product, shippingCents: number) => {
  const v = defaultVariant(p);
  return {
    '@type': 'Product',
    '@id': abs(`/productos/${p.slug}#product`),
    name: p.h1,
    description: p.seo.description,
    image: p.images.map((i) => abs(i.jpg)),
    sku: v.sku,
    category: p.category,
    brand: { '@type': 'Brand', name: site.name },
    offers: {
      '@type': 'Offer',
      url: abs(`/productos/${p.slug}`),
      price: toDecimalString(v.price),
      priceCurrency: 'USD',
      availability: v.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': ORG_ID },
      shippingDetails: shippingDetails(shippingCents),
      hasMerchantReturnPolicy: returnPolicy,
    },
  };
};

export const faqLd = (items: readonly Faq[]) => ({
  '@type': 'FAQPage',
  mainEntity: items.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
});

export const breadcrumbLd = (trail: readonly { name: string; path: string }[]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: abs(t.path) })),
});

export const graph = (...nodes: object[]) => ({ '@context': 'https://schema.org', '@graph': nodes });
