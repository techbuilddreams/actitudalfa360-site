'use client';

import { useState } from 'react';
import type { ProductImage } from '@/domain/product';

/** Fotos del producto; si hay dos caras, botones Sello/Frase (táctil y teclado) + hover en desktop. */
export function ProductGallery({ images, tag, priority = false }: { images: readonly ProductImage[]; tag?: string; priority?: boolean }) {
  const [alt, setAlt] = useState(false);
  const [main, second] = images;
  return (
    <div className={`plate${alt ? ' show-alt' : ''}${second ? ' has-alt' : ''}`}>
      {tag && <span className="tag">{tag}</span>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="main" src={main.src} alt={main.alt} width={main.width} height={main.height}
        loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding="async" />
      {second && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="alt" src={second.src} alt={second.alt} width={second.width} height={second.height} loading="lazy" decoding="async" />
          <div className="views" role="group" aria-label="Ver lado">
            <button type="button" aria-pressed={!alt} onClick={() => setAlt(false)}>Sello</button>
            <button type="button" aria-pressed={alt} onClick={() => setAlt(true)}>Frase</button>
          </div>
        </>
      )}
    </div>
  );
}
