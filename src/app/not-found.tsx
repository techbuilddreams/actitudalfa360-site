import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="doc center center-page">
      <span className="mono">Error 404 · rumbo perdido</span>
      <h1>Esta página no existe.</h1>
      <p>El rumbo correcto está en el inicio.</p>
      <Link className="btn" href="/">Volver al inicio</Link>
    </section>
  );
}
