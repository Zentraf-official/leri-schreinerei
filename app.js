/* ═══════════════════════════════════════════════════════════════════════
   LERI Schreinerei AG — animaciones y comportamiento
   GSAP + ScrollTrigger + Lenis · sin dependencias propias
   Si el JS o el CDN fallan, la web se ve igualmente (modo seguro).
   ═══════════════════════════════════════════════════════════════════════ */
document.documentElement.classList.add('js');

const tieneGSAP = typeof window.gsap !== 'undefined';
const tieneScroll = typeof window.ScrollTrigger !== 'undefined';
const prefiereQuieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── modo seguro: sin GSAP, todo visible y sin animaciones ───────────── */
if (!tieneGSAP) {
  document.querySelectorAll('[data-reveal]').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
  const l = document.getElementById('loader');
  if (l) l.remove();
  document.getElementById('anio').textContent = new Date().getFullYear();
  conectarFormulario();
  conectarLightbox();
  throw new Error('sin GSAP: modo seguro');
}
gsap.registerPlugin(tieneScroll ? ScrollTrigger : {});

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* ══ 1 · CARGA CINEMATOGRÁFICA ═══════════════════════════════════════ */
const loader = $('#loader');
const num = $('#loaderNum');
const bar = $('#loaderBar');
const heroVideo = $('#heroVideo');

function arrancarHero() {
  const lineas = $$('.hero__title [data-line] > *');
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from('.nav', { y: -24, opacity: 0, duration: .9 })
    .from('.hero__kicker', { y: 18, opacity: 0, duration: .8 }, '-=.6')
    .from(lineas, { yPercent: 115, opacity: 0, duration: 1.15, stagger: .12 }, '-=.7')
    .from('.hero__text', { y: 20, opacity: 0, duration: .9 }, '-=.75')
    .from('.hero__cta .btn', { y: 18, opacity: 0, duration: .8, stagger: .09 }, '-=.7')
    .from('.hero__scroll', { opacity: 0, duration: .8 }, '-=.6')
    .from('.hero__video', { scale: 1.12, duration: 2.4, ease: 'power2.out' }, 0);
  if (heroVideo) heroVideo.play().catch(() => {});
}

if (prefiereQuieto) {
  loader?.remove();
  gsap.set('[data-reveal]', { opacity: 1, y: 0 });
  arrancarHero();
} else {
  const contador = { v: 0 };
  const tl = gsap.timeline();
  tl.to(contador, {
      v: 100, duration: 1.5, ease: 'power2.inOut',
      onUpdate: () => {
        if (num) num.textContent = Math.round(contador.v);
        if (bar) bar.style.width = contador.v + '%';
      }
    })
    .to('.loader__inner', { y: -20, opacity: 0, duration: .5, ease: 'power2.in' }, '+=.1')
    .to('.loader', { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '-=.15')
    .add(() => loader?.remove(), '-=.4')
    .add(arrancarHero, '-=.75');
}

/* ══ 2 · SCROLL SUAVE + BARRA DE PROGRESO ════════════════════════════ */
let lenis = null;
if (typeof window.Lenis !== 'undefined' && !prefiereQuieto) {
  lenis = new Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 1 });
  if (tieneScroll) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
}
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const destino = $(a.getAttribute('href'));
  if (!destino) return;
  e.preventDefault();
  lenis ? lenis.scrollTo(destino, { offset: -10 })
        : destino.scrollIntoView({ behavior: 'smooth' });
}));

gsap.to('#progress', {
  width: '100%', ease: 'none',
  scrollTrigger: tieneScroll ? { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: .3 } : undefined
});
if (!tieneScroll) {
  addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    $('#progress').style.width = (scrollY / (h || 1) * 100) + '%';
  }, { passive: true });
}

/* ══ 3 · APARICIONES AL HACER SCROLL ═════════════════════════════════ */
if (tieneScroll && !prefiereQuieto) {
  $$('[data-reveal]').forEach(el => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });

  // un poco de paralaje en las fotos de los servicios
  $$('.service__media img').forEach(img => {
    gsap.fromTo(img, { yPercent: -6 }, {
      yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  // el titular del hero se va alejando
  gsap.to('.hero__content', {
    yPercent: -14, opacity: .25, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });

  // el vídeo del destacado solo se reproduce cuando se ve
  $$('[data-autoplay-on-view]').forEach(v => {
    ScrollTrigger.create({
      trigger: v, start: 'top 85%',
      onEnter: () => v.play().catch(() => {}),
      onLeave: () => v.pause(),
      onEnterBack: () => v.play().catch(() => {})
    });
  });
} else {
  $$('[data-reveal]').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
  $$('[data-autoplay-on-view]').forEach(v => v.play().catch(() => {}));
}

/* ══ 4 · BANDA INFINITA ══════════════════════════════════════════════ */
const pista = $('.marquee__track');
if (pista && !prefiereQuieto) {
  const ancho = pista.scrollWidth / 2;
  gsap.to(pista, { x: -ancho, duration: 26, ease: 'none', repeat: -1,
    modifiers: { x: v => (parseFloat(v) % ancho) + 'px' } });
}

/* ══ 5 · CURSOR PROPIO ═══════════════════════════════════════════════ */
const cursor = $('#cursor');
if (cursor && matchMedia('(hover:hover)').matches && !prefiereQuieto) {
  const x = gsap.quickTo(cursor, 'x', { duration: .18, ease: 'power2.out' });
  const y = gsap.quickTo(cursor, 'y', { duration: .18, ease: 'power2.out' });
  addEventListener('mousemove', e => { x(e.clientX); y(e.clientY); });
  $$('a, button, .tile, .person, summary').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('is-big'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('is-big'));
  });
} else if (cursor) { cursor.remove(); }

/* ══ 6 · GALERÍA (lightbox con transición) ═══════════════════════════ */
function conectarLightbox() {
  const lb = $('#lightbox'), img = $('#lbImg'), cap = $('#lbCap');
  if (!lb) return;
  const abrir = (src, texto) => {
    img.src = src; cap.textContent = texto || '';
    lb.hidden = false;
    gsap.fromTo(lb, { opacity: 0 }, { opacity: 1, duration: .35, ease: 'power2.out' });
    gsap.fromTo(img, { scale: .94, opacity: 0, y: 14 },
      { scale: 1, opacity: 1, y: 0, duration: .6, ease: 'expo.out' });
    document.body.style.overflow = 'hidden';
  };
  const cerrar = () => {
    gsap.to(lb, { opacity: 0, duration: .28, onComplete: () => { lb.hidden = true; document.body.style.overflow = ''; } });
  };
  $$('.tile').forEach(t => t.addEventListener('click', () => abrir(t.dataset.src, t.dataset.cap)));
  $('#lbClose')?.addEventListener('click', cerrar);
  lb.addEventListener('click', e => { if (e.target === lb) cerrar(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !lb.hidden) cerrar(); });
}
conectarLightbox();

/* ══ 7 · FORMULARIO ══════════════════════════════════════════════════ */
function conectarFormulario() {
  const form = $('#form');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const boton = form.querySelector('button[type=submit]');
    const original = boton.textContent;
    boton.textContent = 'Wird gesendet …'; boton.disabled = true;
    const datos = Object.fromEntries(new FormData(form).entries());
    try {
      const r = await fetch('https://studio.zentraf.ch/contacto/api/enviar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos)
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      form.reset();
      $('#formOk').hidden = false;
      boton.textContent = 'Gesendet ✓';
      gsap.fromTo('#formOk', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .5 });
    } catch (err) {
      boton.textContent = 'Fehler — bitte anrufen';
      alert('Das hat leider nicht geklappt. Bitte rufen Sie uns an: 044 242 72 66');
    } finally {
      setTimeout(() => { boton.textContent = original; boton.disabled = false; }, 4000);
    }
  });
}
conectarFormulario();

/* ══ 8 · AÑO EN EL PIE ═══════════════════════════════════════════════ */
const anio = $('#anio');
if (anio) anio.textContent = new Date().getFullYear();
