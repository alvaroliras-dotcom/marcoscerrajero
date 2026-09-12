/* ==============================================================
   Marcos Cerrajeros · capa de movimiento (gyf-fx)
   Sin dependencias. Mejora progresiva: sin JS la web se ve entera.
   Respeta prefers-reduced-motion.
   ============================================================== */
(function () {
  'use strict';
  var raiz = document.documentElement;
  var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var movil = window.matchMedia('(max-width: 768px)');
  raiz.classList.add('fx-js');
  if (quieto) raiz.classList.add('fx-quieto');

  /* --- 1 · acordeón: despliega la altura en vez de dar el salto --- */
  document.querySelectorAll('.faq details').forEach(function (d) {
    var cuerpo = d.querySelector('p');
    if (!cuerpo) return;
    var caja = document.createElement('div');
    caja.className = 'faq__cuerpo';
    cuerpo.parentNode.insertBefore(caja, cuerpo);
    caja.appendChild(cuerpo);

    var cab = d.querySelector('summary');
    cab.addEventListener('click', function (e) {
      if (quieto) return;                       // sin animación: comportamiento nativo
      e.preventDefault();
      if (d.hasAttribute('open')) {
        caja.style.height = caja.scrollHeight + 'px';
        requestAnimationFrame(function () {
          caja.style.height = '0px';
          caja.addEventListener('transitionend', function fin() {
            caja.removeEventListener('transitionend', fin);
            d.removeAttribute('open');
            caja.style.height = '';
          });
        });
      } else {
        d.setAttribute('open', '');
        var alto = caja.scrollHeight;
        caja.style.height = '0px';
        requestAnimationFrame(function () {
          caja.style.height = alto + 'px';
          caja.addEventListener('transitionend', function fin() {
            caja.removeEventListener('transitionend', fin);
            caja.style.height = '';
          });
        });
      }
    });
  });

  /* --- 2 · entradas al hacer scroll, escalonadas por grupo -------- */
  var GRUPOS = [
    '.seccion > .contenedor > .antetitulo, .seccion > .contenedor > h2, .seccion > .contenedor > .medida',
    '.banda li', '.cifras li', '.caso', '.tarjeta', '.resena', '.tipos li', '.ventajas li',
    '.pasos li', '.faq details', '.faq-intro > *', '.texto-foto > div',
    '.pasos-foto > div, .pasos-foto > figure', '.partido > div', '.cta > *',
    '.opiniones__cab > *', '.opiniones__pie'
  ];
  var entran = [];
  GRUPOS.forEach(function (sel) {
    var grupo = [].slice.call(document.querySelectorAll(sel));
    grupo.forEach(function (el, i) {
      if (el.closest('.hero')) return;          // el hero entra con la página, no al bajar
      el.classList.add('fx-entra');
      el.style.setProperty('--fx-esp', Math.min(i, 5) * 70 + 'ms');
      entran.push(el);
    });
  });

  if (!('IntersectionObserver' in window) || quieto) {
    entran.forEach(function (el) { el.classList.add('fx-dentro'); });
  } else {
    var obs = new IntersectionObserver(function (filas) {
      filas.forEach(function (f) {
        if (!f.isIntersecting) return;
        f.target.classList.add('fx-dentro');
        obs.unobserve(f.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    entran.forEach(function (el) { obs.observe(el); });
  }

  /* --- 3 · contadores: la nota y las cifras suben al aparecer ----- */
  function contar(el) {
    var fin = parseFloat((el.getAttribute('data-fx-a') || el.textContent).replace(',', '.'));
    if (isNaN(fin)) return;
    var dec = (el.getAttribute('data-fx-a') || el.textContent).indexOf(',') > -1 ? 1 : 0;
    var dur = 1200, t0 = null;
    function paso(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var v = fin * (1 - Math.pow(1 - p, 3));
      el.textContent = v.toFixed(dec).replace('.', ',');
      if (p < 1) requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  }
  var cifras = [].slice.call(document.querySelectorAll('.hero__nota b, .opiniones__nota b, .nota b, .cifras b[data-fx-cifra]'));
  if (cifras.length && !quieto && 'IntersectionObserver' in window) {
    var obs2 = new IntersectionObserver(function (filas) {
      filas.forEach(function (f) {
        if (!f.isIntersecting) return;
        contar(f.target); obs2.unobserve(f.target);
      });
    }, { threshold: 0.6 });
    cifras.forEach(function (el) {
      el.setAttribute('data-fx-a', el.textContent.trim());
      obs2.observe(el);
    });
  }

  /* --- 4 · parallax suave de la foto del hero (solo escritorio) --- */
  var foto = document.querySelector('.hero__foto');
  var barra = document.querySelector('.fx-progreso');
  var pedido = false;
  function alScroll() {
    if (pedido) return;
    pedido = true;
    requestAnimationFrame(function () {
      pedido = false;
      var y = window.pageYOffset || 0;
      if (foto && !quieto && !movil.matches) {
        foto.style.transform = 'translate3d(0,' + (y * 0.14).toFixed(1) + 'px,0) scale(1.06)';
      }
      if (barra) {
        var alto = document.documentElement.scrollHeight - window.innerHeight;
        barra.style.transform = 'scaleX(' + (alto > 0 ? (y / alto).toFixed(4) : 0) + ')';
      }
    });
  }
  if (foto || barra) {
    window.addEventListener('scroll', alScroll, { passive: true });
    window.addEventListener('resize', alScroll, { passive: true });
    alScroll();
  }
})();

/* --- 5 · carrusel de opiniones (sin librería) ------------------ */
(function () {
  'use strict';
  document.querySelectorAll('[data-carrusel]').forEach(function (c) {
    var pista = c.querySelector('.carrusel__pista');
    var botones = c.querySelectorAll('[data-carrusel-ir]');
    if (!pista) return;
    function paso() {
      var t = pista.querySelector('.resena');
      return t ? t.offsetWidth + 24 : pista.clientWidth;
    }
    function estado() {
      var fin = pista.scrollWidth - pista.clientWidth - 2;
      botones.forEach(function (b) {
        var d = parseInt(b.getAttribute('data-carrusel-ir'), 10);
        b.disabled = d < 0 ? pista.scrollLeft <= 2 : pista.scrollLeft >= fin;
      });
    }
    botones.forEach(function (b) {
      b.addEventListener('click', function () {
        pista.scrollBy({ left: paso() * parseInt(b.getAttribute('data-carrusel-ir'), 10), behavior: 'smooth' });
      });
    });
    pista.addEventListener('scroll', estado, { passive: true });
    window.addEventListener('resize', estado, { passive: true });
    estado();

    /* avance automático: pausa al pasar el ratón, al enfocar con el
       teclado y si el sistema pide menos movimiento */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var reloj = null, parado = false;
    function avanza() {
      if (parado) return;
      var fin = pista.scrollWidth - pista.clientWidth - 2;
      if (pista.scrollLeft >= fin) pista.scrollTo({ left: 0, behavior: 'smooth' });
      else pista.scrollBy({ left: paso(), behavior: 'smooth' });
    }
    function arranca() { if (!reloj) reloj = setInterval(avanza, 5000); }
    function para() { clearInterval(reloj); reloj = null; }
    ['mouseenter', 'focusin', 'touchstart'].forEach(function (e) {
      c.addEventListener(e, function () { parado = true; para(); }, { passive: true });
    });
    ['mouseleave', 'focusout'].forEach(function (e) {
      c.addEventListener(e, function () { parado = false; arranca(); });
    });
    document.addEventListener('visibilitychange', function () {
      document.hidden ? para() : arranca();
    });
    /* solo empieza a girar cuando el bloque está a la vista */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (f) {
        f.forEach(function (x) { x.isIntersecting ? arranca() : para(); });
      }, { threshold: 0.3 }).observe(c);
    } else { arranca(); }
  });
})();

/* --- 6 · la cinta se duplica para que el bucle no corte -------- */
(function () {
  'use strict';
  document.querySelectorAll('[data-cinta]').forEach(function (c) {
    var g = c.firstElementChild;
    if (g && !c.dataset.listo) { c.appendChild(g.cloneNode(true)); c.dataset.listo = '1'; }
  });
})();
