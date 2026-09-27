/* ═══════════════════════════════════════════════════════════════════════
   LERI Schreinerei AG — Bewegung der Website
   Motor propio, sin librerías externas: nada que pueda no cargar.
   1 · Laden wie im Kino      4 · Vorhang zwischen den Seiten
   2 · Zeilen erscheinen      5 · Galerie, Formular, Kopfzeile
   3 · Bewegung beim Scrollen
   Wenn JavaScript ausfällt, bleibt die Seite vollständig sichtbar.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var doc = document, html = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var facil = 'cubic-bezier(.19,1,.22,1)';

  /* ══ 1 · TITULARES EN LÍNEAS (para que suban una a una) ══════════════ */
  function partirEnLineas(el) {
    var unidades = [];
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var palabras = n.textContent.split(/\s+/).filter(Boolean);
        palabras.forEach(function (p, i) {
          var s = doc.createElement('span');
          s.className = 'palabra';
          s.textContent = p;
          el.insertBefore(s, n);
          if (i < palabras.length - 1) el.insertBefore(doc.createTextNode(' '), n);
          unidades.push(s);
        });
        el.removeChild(n);
      } else if (n.nodeType === 1 && n.tagName === 'BR') {
        unidades.push(n);
      } else if (n.nodeType === 1) {
        n.classList.add('palabra');
        unidades.push(n);
      }
    });

    var lineas = [], linea = null;
    unidades.forEach(function (u) {
      if (u.tagName === 'BR') { linea = null; u.parentNode.removeChild(u); return; }
      var t = u.offsetTop;
      if (!linea || Math.abs(t - linea.top) > 6) { linea = { top: t, items: [] }; lineas.push(linea); }
      linea.items.push(u);
    });

    lineas.forEach(function (l) {
      var mascara = doc.createElement('span');
      mascara.className = 'linea-mask';
      var dentro = doc.createElement('span');
      dentro.className = 'linea-int';
      el.appendChild(mascara);
      mascara.appendChild(dentro);
      l.items.forEach(function (u, i) {
        dentro.appendChild(u);
        if (i < l.items.length - 1) dentro.appendChild(doc.createTextNode(' '));
      });
    });

    // Fuera los espacios sueltos que quedan colgando: si no, al leer el texto
    // (Google, lectores de pantalla) las palabras salían pegadas («wirüber»).
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3 && !n.textContent.trim()) el.removeChild(n);
    });
    return $$('.linea-mask', el);
  }

  /* Los titulares se dividen DESPUÉS de que el navegador sepa medir de verdad.
     (Error real del 27.09: se dividían al leer el archivo, antes de que el CSS
     hubiera colocado la página, y salían partidos en tres líneas donde iban dos.
     Ahora: al terminar el documento, otra vez al cargar del todo, y otra vez si
     se cambia el tamaño de la ventana.) */
  var titulares = $$('[data-lineas]').map(function (el) { return { el: el, lineas: [] }; });

  function dividirTitulares(conAnimacion) {
    if (quieto) return;
    titulares.forEach(function (t) {
      var yaVisto = t.el.dataset.revelado === '1';
      if (t.el.dataset.htmlOriginal) t.el.innerHTML = t.el.dataset.htmlOriginal;
      else t.el.dataset.htmlOriginal = t.el.innerHTML;
      t.lineas = partirEnLineas(t.el);
      var enPantalla = t.el.getBoundingClientRect().top < window.innerHeight * 0.92;
      t.lineas.forEach(function (l) {
        if (yaVisto) { l.style.transitionDuration = '0s'; l.classList.add('dentro'); return; }
        if (!enPantalla && !t.el.closest('.hero')) { vigilar(l); return; }
        if (!conAnimacion) { l.style.transitionDuration = '0s'; l.classList.add('dentro'); }
        // si es el hero con animación, lo revela animarHero()
      });
    });
  }

  /* aparición por clase (la transición la hace el CSS) */
  var observador = null;
  if ('IntersectionObserver' in window) {
    observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('dentro');
        var titular = e.target.closest ? e.target.closest('[data-lineas]') : null;
        if (titular) titular.dataset.revelado = '1';
        observador.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
  }

  function vigilar(el, retraso) {
    if (retraso) el.style.transitionDelay = retraso + 'ms';
    if (observador) observador.observe(el);
    else el.classList.add('dentro');
  }

  /* ══ 2 · ARRANQUE: CARGA + HERO ══════════════════════════════════════ */
  function mostrarTodo() {
    $$('[data-anim]').forEach(function (el) { el.classList.add('dentro'); });
    titulares.forEach(function (t) {
      t.el.dataset.revelado = '1';
      t.lineas.forEach(function (l) { l.style.transitionDuration = '0s'; l.classList.add('dentro'); });
    });
  }

  function animarHero() {
    var lineas = [];
    titulares.forEach(function (t) {
      if (t.el.closest('.hero')) { t.el.dataset.revelado = '1'; lineas = lineas.concat(t.lineas); }
    });
    lineas.forEach(function (l, i) {
      l.style.transitionDuration = '1.15s';
      l.style.transitionDelay = (120 + i * 110) + 'ms';
      l.classList.add('dentro');
    });
    $$('.hero [data-anim]').forEach(function (el, i) {
      el.style.transitionDelay = (480 + i * 110) + 'ms';
      el.classList.add('dentro');
    });
    var pie = $('.hero__pie');
    if (pie) { pie.style.transition = 'opacity 1s ' + facil + ' .9s'; pie.style.opacity = '1'; }
    var media = $('.hero__media');
    if (media) {
      media.style.transform = 'scale(1.06)';
      media.style.transition = 'transform 3s ' + facil;
      requestAnimationFrame(function () { media.style.transform = 'scale(1)'; });
    }
    var v = $('#heroVideo');
    if (v) { v.play().catch(function () {}); }
  }

  function carga() {
    var caja = $('#carga'), barra = $('#cargaBarra'), num = $('#cargaNum'), capa = $('#cargaCapa');
    var velo = $('#velo');
    if (!caja) { animarHero(); return; }
    caja.hidden = false;

    if (velo && html.classList.contains('viene-de-transicion')) {
      // ya venimos de otra página: no repetimos la carga
      html.classList.remove('viene-de-transicion');
      caja.remove();
      $$('#velo span').forEach(function (c) { c.style.transform = 'translateY(0)'; });
      salirDelVelo(0);
      animarHero();
      return;
    }

    // Si ya vio la animación de entrada en esta visita, no se la repetimos:
    // solo la primera página del recorrido se abre como el cine.
    var yaVisto = false;
    try { yaVisto = sessionStorage.getItem('leri-visto') === '1'; } catch (e) {}
    if (yaVisto && !quieto) { caja.remove(); animarHero(); return; }

    var contador = { v: 0 }, t0 = performance.now(), DUR = 950;
    function paso(t) {
      var p = Math.min(1, (t - t0) / DUR);
      var suave = 1 - Math.pow(1 - p, 3);
      contador.v = Math.round(suave * 100);
      if (num) num.textContent = contador.v;
      if (barra) barra.style.width = contador.v + '%';
      if (p < 1) requestAnimationFrame(paso);
      else salir();
    }
    function salir() {
      var caja2 = $('#cargaCaja');
      if (caja2) caja2.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-18px)' }],
        { duration: 380, easing: 'ease-in', fill: 'forwards' });
      var a1 = capa ? capa.animate([{ transform: 'translateY(101%)' }, { transform: 'translateY(0)' }],
        { duration: 520, delay: 180, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'forwards' }) : null;
      var lista = a1 ? a1.finished : Promise.resolve();
      lista.catch(function () {}).then(function () {
        var a2 = caja.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }],
          { duration: 820, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'forwards' });
        animarHero();
        a2.finished.catch(function () {}).then(function () {
          caja.remove();
          try { sessionStorage.setItem('leri-visto', '1'); } catch (e) {}
        });
      });
    }
    if (quieto) { caja.remove(); animarHero(); return; }
    requestAnimationFrame(paso);
  }

  /* ══ 3 · EL VELO ENTRE PÁGINAS ═══════════════════════════════════════ */
  function salirDelVelo(retraso) {
    var capas = $$('#velo span');
    if (!capas.length) return;
    var max = 0;
    capas.forEach(function (c, i) {
      c.style.transform = 'translateY(0)';
      var a = c.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-101%)' }],
        { duration: 720, delay: retraso + i * 60, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'forwards' });
      max = Math.max(max, retraso + i * 60 + 720);
    });
    setTimeout(function () {
      capas.forEach(function (c) { c.style.transform = 'translateY(101%)'; c.getAnimations().forEach(function (a) { a.cancel(); }); });
      var v = $('#velo'); if (v) v.classList.remove('activo');
    }, max + 60);
  }

  function entrarEnVelo(destino) {
    var capas = $$('#velo span');
    var v = $('#velo');
    if (v) v.classList.add('activo');
    capas.forEach(function (c, i) {
      c.animate([{ transform: 'translateY(101%)' }, { transform: 'translateY(0)' }],
        { duration: 560, delay: i * 55, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'forwards' });
    });
    try { sessionStorage.setItem('leri-transicion', '1'); } catch (e) {}
    setTimeout(function () { location.href = destino; }, capas.length * 55 + 620);
  }

  function esInterna(a) {
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return false;
    var href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#' || /^(mailto|tel|https?:)/i.test(href)) return false;
    return /\.html(\?|#|$)/i.test(href);
  }

  doc.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.charAt(0) === '#' && href.length > 1) {
      var destino = $(href);
      if (destino) {
        e.preventDefault();
        window.scrollTo({ top: destino.getBoundingClientRect().top + window.pageYOffset - 70, behavior: quieto ? 'auto' : 'smooth' });
      }
      return;
    }
    if (!esInterna(a)) return;
    var actual = location.pathname.split('/').pop() || 'index.html';
    if (href.split('#')[0] === actual) return;          // misma página: navegador normal
    if (quieto) return;
    e.preventDefault();
    entrarEnVelo(href);
  });

  /* ══ 4 · AL HACER SCROLL: barra, paralaje, vídeos ════════════════════ */
  var barra = $('#barra'), progreso = $('#progreso'), heroTexto = $('.hero__texto');
  var paralajes = $$('[data-paralaje]');
  var pidiendo = false;

  function alScroll() {
    var y = window.pageYOffset || doc.documentElement.scrollTop;
    if (barra) barra.classList.toggle('barra--solida', y > 60);
    if (progreso) {
      var alto = doc.documentElement.scrollHeight - window.innerHeight;
      progreso.style.width = (alto > 0 ? (y / alto) * 100 : 0) + '%';
    }
    if (heroTexto && y < window.innerHeight * 1.2) {
      heroTexto.style.transform = 'translateY(' + (y * -0.12) + 'px)';
      heroTexto.style.opacity = String(Math.max(0, 1 - y / (window.innerHeight * 0.85)));
    }
    paralajes.forEach(function (img) {
      var r = img.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > window.innerHeight + 100) return;
      var centro = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
      img.style.transform = 'translate3d(0,' + (centro * -46).toFixed(1) + 'px,0) scale(1.14)';
    });
    pidiendo = false;
  }
  addEventListener('scroll', function () {
    if (!pidiendo) { pidiendo = true; requestAnimationFrame(alScroll); }
  }, { passive: true });

  /* vídeos que arrancan cuando se ven */
  var vistos = [];
  if ('IntersectionObserver' in window) {
    var obsVideo = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { v.play().catch(function () {}); }
        else { v.pause(); }
      });
    }, { threshold: 0.15 });
    $$('[data-reproducir-al-ver]').forEach(function (v) { obsVideo.observe(v); });
  }

  /* ══ 5 · GALERÍA, MENÚ ACTIVO, AÑO, FORMULARIO ═══════════════════════ */
  function galeria() {
    var luz = $('#luz');
    if (!luz) return;
    var img = $('#luzImg'), cap = $('#luzCap');
    function abrir(src, texto, alt) {
      img.src = src; img.alt = alt || texto || '';
      cap.textContent = texto || '';
      luz.hidden = false;
      luz.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out', fill: 'forwards' });
      img.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }],
        { duration: 520, easing: facil, fill: 'forwards' });
      doc.body.style.overflow = 'hidden';
    }
    function cerrar() {
      var a = luz.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: 'forwards' });
      a.finished.catch(function () {}).then(function () { luz.hidden = true; doc.body.style.overflow = ''; img.src = ''; });
    }
    $$('.pieza').forEach(function (p) {
      p.addEventListener('click', function () {
        var i = p.querySelector('img');
        abrir(p.dataset.src, p.dataset.cap, i ? i.alt : '');
      });
    });
    $('#luzCerrar').addEventListener('click', cerrar);
    luz.addEventListener('click', function (e) { if (e.target === luz) cerrar(); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && !luz.hidden) cerrar(); });
  }

  function menuActivo() {
    var pag = (location.pathname.split('/').pop() || 'index.html').replace('.html', '') || 'index';
    if (pag === '' || pag === 'index') pag = 'index';
    $$('#menu a').forEach(function (a) {
      if (a.dataset.pagina === pag) a.classList.add('activo');
    });
  }

  function formulario() {
    var form = $('#form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var boton = form.querySelector('button[type=submit]');
      var original = boton.innerHTML;
      var datos = {};
      new FormData(form).forEach(function (v, k) { datos[k] = v; });
      if (!datos.nombre || !datos.email || !datos.mensaje) {
        boton.textContent = 'Bitte alle Felder ausfüllen';
        setTimeout(function () { boton.innerHTML = original; }, 3000);
        return;
      }
      datos.pagina = location.href;
      boton.textContent = 'Wird gesendet …';
      boton.disabled = true;
      fetch('https://studio.zentraf.ch/contacto/api/enviar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos)
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        form.reset();
        var ok = $('#formOk');
        if (ok) { ok.hidden = false; ok.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: facil, fill: 'forwards' }); }
        boton.textContent = 'Gesendet ✓';
      }).catch(function () {
        boton.textContent = 'Fehler — bitte anrufen';
        alert('Das hat leider nicht geklappt. Bitte rufen Sie uns an: 044 242 72 66');
      }).then(function () {
        setTimeout(function () { boton.innerHTML = original; boton.disabled = false; }, 4000);
      });
    });
  }

  /* ══ PUESTA EN MARCHA ════════════════════════════════════════════════ */
  function arrancar() {
    window.__leriListo = true;
    menuActivo();
    galeria();
    formulario();
    var anio = $('#anio');
    if (anio) anio.textContent = new Date().getFullYear();

    $$('[data-anim]').forEach(function (el) {
      if (el.closest('.hero')) return;
      var hermanos = el.parentElement ? Array.prototype.slice.call(el.parentElement.children).indexOf(el) : 0;
      vigilar(el, Math.min(hermanos, 3) * 90);
    });
    dividirTitulares(true);

    // segunda pasada: cuando la tipografía propia ya está puesta. Es la causa real
    // del fallo del 27.09: al medir con la letra de reserva salían más líneas de
    // las que hay, y al entrar Inter el texto se recolocaba dentro de las máscaras.
    if (doc.fonts && doc.fonts.ready && doc.fonts.ready.then) {
      doc.fonts.ready.then(function () { dividirTitulares(false); alScroll(); });
    }

    // tercera pasada: ya con imágenes y vídeo cargados
    addEventListener('load', function () { dividirTitulares(false); alScroll(); });

    // y si el navegador cambia el ancho del titular por su cuenta (letra que llega
    // tarde, barra de desplazamiento que aparece), se vuelve a dividir
    if ('ResizeObserver' in window) {
      var anchoAnterior = new WeakMap();
      var obs = new ResizeObserver(function (entradas) {
        entradas.forEach(function (e) {
          var w = Math.round(e.contentRect.width);
          if (anchoAnterior.get(e.target) === w) return;
          anchoAnterior.set(e.target, w);
          clearTimeout(tempoAncho);
          tempoAncho = setTimeout(function () { dividirTitulares(false); }, 120);
        });
      });
      titulares.forEach(function (t) { obs.observe(t.el); });
    }

    // y si se cambia el tamaño de la ventana o se gira el móvil
    var tempo = null, tempoAncho = null;
    addEventListener('resize', function () {
      clearTimeout(tempo);
      tempo = setTimeout(function () { dividirTitulares(false); alScroll(); }, 260);
    });

    alScroll();
    carga();

    // si el navegador vuelve desde la caché (botón atrás), no dejamos el velo encima
    addEventListener('pageshow', function (ev) {
      if (ev.persisted) {
        $$('#velo span').forEach(function (c) { c.style.transform = 'translateY(101%)'; });
        var c = $('#carga'); if (c) c.remove();
        mostrarTodo();
      }
    });
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();
})();
