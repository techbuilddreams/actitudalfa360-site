import { Fragment } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { deliveryPromise } from '@/config/site';
import { env } from '@/config/env';
import { formatMoney } from '@/domain/money';
import { defaultVariant } from '@/domain/product';
import { catalog } from '@/infrastructure/container';
import { BuyBox } from '@/components/buy-box';
import { Faq } from '@/components/faq';
import { JsonLd } from '@/components/json-ld';
import { Assurances, ProductCard } from '@/components/product-card';
import { ProductGallery } from '@/components/product-gallery';
import { breadcrumbLd, faqLd, graph, productLd } from '@/lib/structured-data';

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return catalog.all().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = catalog.bySlug((await params).slug);
  if (!p) return {};
  const img = p.images[0];
  return {
    title: { absolute: p.seo.title },
    description: p.seo.description,
    keywords: [...p.seo.keywords],
    alternates: { canonical: `/productos/${p.slug}` },
    openGraph: { type: 'website', title: p.seo.title, description: p.seo.description, url: `/productos/${p.slug}`, images: [{ url: img.jpg, width: img.width, height: img.height, alt: img.alt }] },
  };
}

export default async function ProductPage({ params }: Params) {
  const product = catalog.bySlug((await params).slug);
  if (!product) notFound();
  const v = defaultVariant(product);
  const others = catalog.all().filter((p) => p.slug !== product.slug);
  const trail = [{ name: 'Inicio', path: '/' }, { name: 'Tienda', path: '/#tienda' }, { name: product.name, path: `/productos/${product.slug}` }];

  return (
    <>
      <JsonLd data={graph(productLd(product, env().SHIPPING_FLAT_CENTS), breadcrumbLd(trail), faqLd(product.faq))} />
      <nav aria-label="Migas de pan">
        <ol className="crumbs">
          <li><Link href="/">Inicio</Link></li>
          <li><Link href="/#tienda">Tienda</Link></li>
          <li aria-current="page">{product.name}</li>
        </ol>
      </nav>

      <div className="pdp">
        <div className="gallery"><ProductGallery images={product.images} tag={product.tag} priority /></div>
        <div>
          <span className="mono">{product.category}</span>
          <h1>{product.h1}</h1>
          <span className="price">{formatMoney(v.price)}</span>
          <p className="pitch">{product.shortPitch}</p>
          <div className="buybox">
            <p className="ship">{deliveryPromise} · envío fijo {formatMoney({ cents: env().SHIPPING_FLAT_CENTS, currency: 'usd' })}</p>
            <BuyBox sku={v.sku} label="Comprar ahora" />
            <Assurances />
          </div>
          <ul className="bullets">{product.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
          <dl className="specs">
            {product.specs.map((s) => (<Fragment key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></Fragment>))}
          </dl>
          <p className="long">{product.longDescription}</p>
        </div>
      </div>

      <section aria-labelledby="faq-h">
        <div className="head"><div><span className="mono">Preguntas</span><h2 id="faq-h">Sobre este producto</h2></div></div>
        <Faq items={product.faq} />
      </section>

      {others.length > 0 && (
        <section className="related" aria-labelledby="rel-h">
          <div className="head"><div><span className="mono">También te puede servir</span><h2 id="rel-h">Completa el equipo</h2></div></div>
          <div className="products">{others.map((p) => <ProductCard key={p.slug} product={p} />)}</div>
        </section>
      )}
    </>
  );
}
