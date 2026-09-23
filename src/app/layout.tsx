import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { connection } from 'next/server';
import copy from '@/content/copy.json';
import { site } from '@/config/site';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import './globals.css';

const display = localFont({ src: './fonts/Anton-Regular.woff2', variable: '--font-display', display: 'swap', preload: true });
const body = localFont({ src: './fonts/Archivo-wght.woff2', variable: '--font-body', weight: '100 900', display: 'swap' });
const mono = localFont({
  src: [
    { path: './fonts/IBMPlexMono-Regular.woff2', weight: '400' },
    { path: './fonts/IBMPlexMono-Medium.woff2', weight: '500' },
  ],
  variable: '--font-mono',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: copy.home.title, template: `%s | ${site.name}` },
  description: copy.home.description,
  applicationName: site.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: site.name,
    locale: site.locale,
    images: [{ url: '/img/og.jpg', width: 1200, height: 630, alt: `${site.name} — ${site.slogan}` }],
  },
  twitter: { card: 'summary_large_image' },
  icons: { icon: [{ url: '/favicon.ico', sizes: '32x32' }, { url: '/img/icon-192.png', type: 'image/png', sizes: '192x192' }], apple: '/img/apple-touch-icon.png' },
  robots: site.isPreview ? { index: false, follow: false } : { index: true, follow: true, 'max-image-preview': 'large' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: site.themeColor, colorScheme: 'dark' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // CSP con nonce por petición ⇒ cada página se renderiza al pedirla (los scripts llevan el nonce).
  await connection();
  return (
    <html lang={site.lang} className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        {site.isPreview && <div className="preview-bar">Preview · no es la tienda real · pagos en modo prueba</div>}
        <a className="skip" href="#main">Ir al contenido</a>
        <SiteHeader />
        <main className="wrap" id="main">{children}</main>
        <div className="wrap"><SiteFooter /></div>
      </body>
    </html>
  );
}
