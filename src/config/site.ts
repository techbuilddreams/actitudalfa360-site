/** Datos públicos de la marca: una sola fuente de verdad (DRY). */
export const site = {
  name: 'Actitud Alfa 360',
  legalName: 'Tech Build Dreams LLC',
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://actitudalfa360.com').replace(/\/$/, ''),
  email: 'hola@actitudalfa360.com',
  locale: 'es_US',
  lang: 'es',
  slogan: 'Háblame de hacer dinero, no de gente.',
  themeColor: '#0E0E0D',
  isPreview: process.env.NEXT_PUBLIC_APP_ENV === 'preview',
  shipping: {
    countries: ['US'] as const,
    handlingDays: { min: 2, max: 5 },
    transitDays: { min: 3, max: 7 },
  },
  returns: { days: 30 },
} as const;

export const deliveryPromise =
  `Se produce en ${site.shipping.handlingDays.min}–${site.shipping.handlingDays.max} días hábiles · ` +
  `entrega en ${site.shipping.transitDays.min}–${site.shipping.transitDays.max} días hábiles (EE. UU.)`;
