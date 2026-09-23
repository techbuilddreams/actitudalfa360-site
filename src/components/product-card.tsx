import { Fragment } from 'react';
import Link from 'next/link';
import { deliveryPromise } from '@/config/site';
import { formatMoney } from '@/domain/money';
import { defaultVariant, type Product } from '@/domain/product';
import { BuyBox } from './buy-box';
import { ProductGallery } from './product-gallery';

export function Assurances() {
  return (
    <ul className="assure">
      <li>Pago seguro con Stripe · Apple Pay · Google Pay</li>
      <li>¿Llegó dañado? Reemplazo o reembolso en 30 días</li>
    </ul>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const v = defaultVariant(product);
  return (
    <article className="product">
      <ProductGallery images={product.images} tag={product.tag} />
      <div className="pinfo">
        <div className="row">
          <h3><Link href={`/productos/${product.slug}`}>{product.name}</Link></h3>
          <span className="price">{formatMoney(v.price)}</span>
        </div>
        {product.subtitle && <span className="sub">{product.subtitle}</span>}
        <dl className="specs">
          {product.specs.map((s) => (<Fragment key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></Fragment>))}
        </dl>
        <p className="ship">{deliveryPromise}</p>
        <BuyBox sku={v.sku} label={`Comprar ${product.name.split(' ')[0].toLowerCase()}`} />
        <Assurances />
      </div>
    </article>
  );
}
