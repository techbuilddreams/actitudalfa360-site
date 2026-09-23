/** Comparación en tiempo constante (evita ataques de tiempo). Sin dependencias de Node: sirve en el proxy. */
export function safeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

/** Valida un header `Authorization: Basic …` contra "usuario:contraseña". */
export function isAuthorized(header: string | null, expected: string): boolean {
  if (!header?.startsWith('Basic ')) return false;
  try {
    return safeEqual(atob(header.slice(6)), expected);
  } catch {
    return false;
  }
}
