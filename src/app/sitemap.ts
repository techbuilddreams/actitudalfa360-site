import type { MetadataRoute } from 'next';
import { site } from '@/config/site';
import { catalog } from '@/infrastructure/container';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${site.url}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    ...catalog.all().map((p) => ({
      url: `${site.url}/productos/${p.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
      images: p.images.map((i) => `${site.url}${i.jpg}`),
    })),
    { url: `${site.url}/politicas`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
