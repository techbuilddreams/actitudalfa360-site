import Link from 'next/link';
import { site } from '@/config/site';

export function SiteHeader() {
  return (
    <nav aria-label="Principal" className="topnav">
      <div className="wrap">
        <Link className="brand" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/sello-68.webp" width={34} height={34} alt="" />
          {site.name.toUpperCase()}
        </Link>
        <div className="navlinks">
          <Link href="/#pilares">Pilares</Link>
          <Link href="/#tienda">Tienda</Link>
          <Link href="/#preguntas">Preguntas</Link>
          <Link className="btn" href="/#tienda">Ver tienda</Link>
        </div>
      </div>
    </nav>
  );
}
