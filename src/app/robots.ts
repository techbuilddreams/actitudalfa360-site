import type { MetadataRoute } from 'next';
import { site } from '@/config/site';

/** Producción: abierto a buscadores y a buscadores con IA (OAI-SearchBot, PerplexityBot…). Preview: cerrado. */
export default function robots(): MetadataRoute.Robots {
  if (site.isPreview) return { rules: [{ userAgent: '*', disallow: '/' }] };
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/gracias'] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
