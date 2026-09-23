import { describe, expect, it } from 'vitest';
import { createRateLimiter } from '@/infrastructure/security/rate-limit';
import { isSameOrigin } from '@/infrastructure/security/request-guards';
import { decodeLines, encodeLines } from '@/domain/order';

describe('rate limiter', () => {
  it('bloquea después del límite y libera al pasar la ventana', () => {
    let t = 0;
    const rl = createRateLimiter(2, 1000, () => t);
    expect(rl.hit('ip').allowed).toBe(true);
    expect(rl.hit('ip').allowed).toBe(true);
    expect(rl.hit('ip').allowed).toBe(false);
    t = 1001;
    expect(rl.hit('ip').allowed).toBe(true);
  });
});

describe('isSameOrigin', () => {
  const site = 'https://actitudalfa360.com';
  it('acepta el propio origen y rechaza otros', () => {
    expect(isSameOrigin(new Headers({ origin: site }), site)).toBe(true);
    expect(isSameOrigin(new Headers({ origin: 'https://evil.com' }), site)).toBe(false);
    expect(isSameOrigin(new Headers({ referer: `${site}/productos/x` }), site)).toBe(true);
    expect(isSameOrigin(new Headers({}), site)).toBe(false);
  });
});

describe('metadata de líneas', () => {
  it('ida y vuelta', () => {
    const lines = [{ sku: 'A-1', quantity: 2 }, { sku: 'B-2', quantity: 1 }];
    expect(decodeLines(encodeLines(lines))).toEqual(lines);
    expect(decodeLines('basura,:,x:y')).toEqual([]);
  });
});

import { isAuthorized, safeEqual } from '@/infrastructure/security/basic-auth';

describe('staging basic auth', () => {
  it('acepta solo las credenciales correctas', () => {
    expect(isAuthorized(`Basic ${btoa('luis:secreto')}`, 'luis:secreto')).toBe(true);
    expect(isAuthorized(`Basic ${btoa('luis:otra')}`, 'luis:secreto')).toBe(false);
    expect(isAuthorized(null, 'luis:secreto')).toBe(false);
    expect(isAuthorized('Basic !!!', 'luis:secreto')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});
