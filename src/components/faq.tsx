import type { Faq as FaqItem } from '@/domain/product';

export function Faq({ items }: { items: readonly FaqItem[] }) {
  return (
    <div className="faq">
      {items.map((f) => (
        <details key={f.q}>
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  );
}
