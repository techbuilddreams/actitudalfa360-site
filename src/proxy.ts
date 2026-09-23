import { NextResponse, type NextRequest } from 'next/server';
import { isAuthorized } from '@/infrastructure/security/basic-auth';

/**
 * 1) Staging protegido con usuario/contraseña (STAGING_BASIC_AUTH="usuario:contraseña").
 * 2) CSP estricta con nonce por petición + encabezados de seguridad.
 */
export function proxy(request: NextRequest) {
  const isStaging = process.env.NEXT_PUBLIC_APP_ENV === 'staging';
  const credentials = process.env.STAGING_BASIC_AUTH;
  if (isStaging && credentials && !isAuthorized(request.headers.get('authorization'), credentials)) {
    return new NextResponse('Autenticación requerida', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Actitud Alfa 360 staging", charset="UTF-8"', 'X-Robots-Tag': 'noindex, nofollow' },
    });
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV === 'development';

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self'${isDev ? " 'unsafe-inline'" : ` 'nonce-${nonce}'`}`,
    `img-src 'self' data: blob:`,
    `font-src 'self'`,
    `connect-src 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  if (isStaging) response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

export const config = {
  matcher: [
    {
      // Todo excepto API (Stripe debe poder llegar al webhook), estáticos y archivos públicos.
      source: '/((?!api|_next/static|_next/image|img|fonts|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|llms.txt|\\.well-known).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
