import Link from 'next/link';
import { site } from '@/config/site';

export function SiteFooter() {
  return (
    <footer>
      <Link className="brand" href="/">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/sello-68.webp" width={34} height={34} alt="" />
        {site.name.toUpperCase()}
      </Link>
      <nav aria-label="Legal">
        <Link href="/politicas#envios">Envíos y devoluciones</Link>
        <Link href="/politicas#privacidad">Privacidad</Link>
        <Link href="/politicas#terminos">Términos</Link>
        <a href={`mailto:${site.email}`}>{site.email}</a>
      </nav>
      <p>© {new Date().getFullYear()} {site.name} · {site.legalName}</p>
    </footer>
  );
}
