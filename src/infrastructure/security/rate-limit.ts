/**
 * Límite por ventana deslizante en memoria (un proceso Node).
 * Si se escala a varias instancias, se cambia por Redis manteniendo esta interfaz.
 */
export interface RateLimiter {
  hit(key: string): { allowed: boolean; retryAfterSec: number };
}

export function createRateLimiter(limit: number, windowMs: number, now: () => number = Date.now): RateLimiter {
  const hits = new Map<string, number[]>();
  return {
    hit(key) {
      const t = now();
      const recent = (hits.get(key) ?? []).filter((x) => x > t - windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return { allowed: false, retryAfterSec: Math.ceil((recent[0] + windowMs - t) / 1000) };
      }
      recent.push(t);
      hits.set(key, recent);
      if (hits.size > 10_000) hits.delete(hits.keys().next().value as string); // tope de memoria
      return { allowed: true, retryAfterSec: 0 };
    },
  };
}
