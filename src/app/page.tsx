import copy from '@/content/copy.json';
import { site } from '@/config/site';
import { catalog } from '@/infrastructure/container';
import { ProductCard } from '@/components/product-card';
import { Faq } from '@/components/faq';
import { JsonLd } from '@/components/json-ld';
import { faqLd, graph, organizationLd, websiteLd } from '@/lib/structured-data';

const PILLARS = [
  { area: 'Cuerpo', bearing: '000°', verb: 'ENTRENA', text: 'Salud como base. Un cuerpo fuerte sostiene una mente fuerte.' },
  { area: 'Mente', bearing: '090°', verb: 'LEE', text: 'Aprender es la ventaja que nadie te puede quitar.' },
  { area: 'Dinero', bearing: '180°', verb: 'PRODUCE', text: 'Construir, vender, emprender. El dinero es una realidad, no un tabú.' },
  { area: 'Carácter', bearing: '270°', verb: 'CUMPLE', text: 'Lo que dices, lo haces. Eso te separa del resto.' },
] as const;

const MARQUEE = [['ENTRENA', 'EL CUERPO'], ['LEE', 'TODOS LOS DÍAS'], ['PRODUCE', 'ANTES DE CONSUMIR'], ['CUMPLE', 'TU PALABRA']] as const;

export default function Home() {
  const h = copy.home;
  const products = catalog.all();
  return (
    <>
      <JsonLd data={graph(organizationLd(), websiteLd(), faqLd(h.faq))} />

      <header className="hero">
        <div>
          <span className="mono">Mentalidad 360°<span className="long"> · Cuerpo · Mente · Dinero · Carácter</span></span>
          <h1>Háblame de hacer dinero, <span className="dim">no de gente.</span></h1>
          <p className="lede">{h.heroLede}</p>
          <div className="ctas">
            <a className="btn" href="#tienda">Ver la colección →</a>
            <a className="btn ghost" href="#pilares">Los 4 pilares</a>
          </div>
        </div>
        <div className="seal">
          <svg viewBox="0 0 400 400" aria-hidden="true">
            <defs><path id="ring" d="M200,200 m-186,0 a186,186 0 1,1 372,0 a186,186 0 1,1 -372,0" /></defs>
            <circle cx="200" cy="200" r="198" fill="none" stroke="#2A2926" />
            <text fontFamily="var(--font-mono), monospace" fontSize="10.5" letterSpacing="3.2" fill="#9C978C">
              <textPath href="#ring">000° ENTRENA · 090° LEE · 180° PRODUCE · 270° CUMPLE · 000° ENTRENA · 090° LEE · 180° PRODUCE · 270° CUMPLE ·</textPath>
            </text>
          </svg>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/sello.webp" width={640} height={640} fetchPriority="high" decoding="async"
            alt="Sello Actitud Alfa 360: ojo dentro de un triángulo sobre una brújula" />
        </div>
      </header>

      <div className="strip" aria-hidden="true">
        <div>
          {[...MARQUEE, ...MARQUEE].map(([b, rest], i) => (<span key={i}><b>{b}</b> {rest}</span>))}
        </div>
      </div>

      <section id="pilares" aria-labelledby="pilares-h">
        <div className="head">
          <div><span className="mono">Los 4 rumbos</span><h2 id="pilares-h">Una vida a 360°</h2></div>
          <p>{h.pillarsIntro}</p>
        </div>
        <div className="pillars">
          {PILLARS.map((p) => (
            <article className="pillar" key={p.verb}>
              <div className="bearing"><span className="area">{p.area}</span><b>{p.bearing}</b></div>
              <h3>{p.verb}</h3>
              <p>{p.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="tienda" aria-labelledby="tienda-h">
        <div className="head">
          <div><span className="mono">Colección 01</span><h2 id="tienda-h">Equipo para el día</h2></div>
          <p>{h.shopIntro}</p>
        </div>
        <div className="products">
          {products.map((p) => <ProductCard key={p.slug} product={p} />)}
        </div>
      </section>

      <section id="manifiesto" className="manifesto" aria-labelledby="manifiesto-h">
        <blockquote id="manifiesto-h">Menos opinión.<br /><em>Más ejecución.</em></blockquote>
        <div className="text">{h.manifesto.map((p) => <p key={p.slice(0, 20)}>{p}</p>)}</div>
      </section>

      <section id="preguntas" aria-labelledby="preguntas-h">
        <div className="head">
          <div><span className="mono">Preguntas frecuentes</span><h2 id="preguntas-h">Lo que te estás preguntando</h2></div>
          <p>¿Algo más? Escríbenos a {site.email}.</p>
        </div>
        <Faq items={h.faq} />
      </section>
    </>
  );
}
