/** Defensa CSRF: la compra solo puede iniciarse desde nuestro propio sitio. */
export function isSameOrigin(headers: Headers, siteUrl: string): boolean {
  const allowed = new URL(siteUrl).origin;
  const origin = headers.get('origin');
  if (origin) return origin === allowed;
  const referer = headers.get('referer');
  if (!referer) return false;
  try {
    return new URL(referer).origin === allowed;
  } catch {
    return false;
  }
}

export function clientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown';
}
