/* ==============================================================
   Marcos Cerrajeros · consentimiento de cookies
   Sin librerías ni servicios de terceros.

   BLOQUEA DE VERDAD. No es un cartel informativo: nada de terceros
   se carga hasta que el visitante lo acepta.

   Cómo se marca lo que hay que bloquear:
     <script type="text/plain" data-consent="estadisticas" src="..."></script>
     <iframe data-src="..." data-consent="externas"></iframe>

   Categorías: necesarias (siempre) · estadisticas · externas.
   Cuando arranquen los anuncios se añade "marketing" a CATEGORIAS y ya está.
   ============================================================== */
(function () {
  'use strict';

  /* Medición (bloque 65): el mismo contenedor de Google Tag Manager que usaba
     el WordPress (GTM-TJB2J2BK), que ya lleva GA4 (G-KFTMX8NC4D) y los eventos
     clave (clic_telefono, boton_flotante_whatsapp). Se carga en todas las
     páginas y SOLO si el visitante acepta «Estadísticas». Vacío = nada. */
  var GTM_ID = 'GTM-TJB2J2BK';

  var CLAVE = 'mc-consentimiento';
  var VERSION = 1;            // súbela si cambian las categorías: se vuelve a preguntar
  var CATEGORIAS = [
    { id: 'estadisticas', titulo: 'Estadísticas',
      texto: 'Nos dicen cuántas personas entran y qué páginas leen, en conjunto y sin identificar a nadie. Nos sirven para saber qué mejorar.' },
    { id: 'externas', titulo: 'Contenido externo',
      texto: 'El mapa de Google que enseña dónde está el taller. Al mostrarlo, Google recibe su dirección IP.' }
  ];

  /* ---- memoria ------------------------------------------------ */
  function leer() {
    try {
      var d = JSON.parse(localStorage.getItem(CLAVE));
      return (d && d.v === VERSION) ? d : null;
    } catch (e) { return null; }
  }
  function guardar(estado) {
    estado.v = VERSION;
    estado.fecha = new Date().toISOString();
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) {}
    aplicar(estado);
    document.dispatchEvent(new CustomEvent('consentimiento', { detail: estado }));
  }

  /* ---- Tag Manager, detrás del consentimiento ------------------ */
  var gtmCargado = false;
  function cargarGTM() {
    if (gtmCargado || !GTM_ID) return;
    gtmCargado = true;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    window.mcMedicion = true;
    var g = document.createElement('script');
    g.async = true;
    g.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(GTM_ID);
    document.head.appendChild(g);
  }

  /* ---- soltar lo que estaba retenido -------------------------- */
  function aplicar(estado) {
    if (estado.estadisticas) cargarGTM();
    document.querySelectorAll('script[type="text/plain"][data-consent]').forEach(function (s) {
      if (!estado[s.getAttribute('data-consent')]) return;
      var n = document.createElement('script');
      [].forEach.call(s.attributes, function (a) {
        if (a.name !== 'type' && a.name !== 'data-consent') n.setAttribute(a.name, a.value);
      });
      n.type = 'text/javascript';
      if (!s.src) n.text = s.textContent;
      s.parentNode.replaceChild(n, s);
    });
    document.querySelectorAll('[data-src][data-consent]').forEach(function (el) {
      if (!estado[el.getAttribute('data-consent')] || el.src) return;
      el.src = el.getAttribute('data-src');
      var caja = el.closest('[data-bloqueado]');
      if (caja) caja.removeAttribute('data-bloqueado');
    });
    document.querySelectorAll('[data-bloqueado]').forEach(function (caja) {
      var cat = caja.getAttribute('data-bloqueado');
      if (estado[cat]) caja.removeAttribute('data-bloqueado');
    });
  }

  var TODO_SI = function () { var e = { necesarias: true }; CATEGORIAS.forEach(function (c) { e[c.id] = true; }); return e; };
  var TODO_NO = function () { var e = { necesarias: true }; CATEGORIAS.forEach(function (c) { e[c.id] = false; }); return e; };

  /* ---- el aviso ----------------------------------------------- */
  var caja = null;

  function filas() {
    return CATEGORIAS.map(function (c) {
      return '<label class="ck__fila">' +
        '<input type="checkbox" name="' + c.id + '">' +
        '<span><b>' + c.titulo + '</b>' + c.texto + '</span></label>';
    }).join('');
  }

  function pinta(abrirDetalle) {
    if (caja) { caja.remove(); caja = null; }
    caja = document.createElement('div');
    caja.className = 'ck';
    caja.setAttribute('role', 'dialog');
    caja.setAttribute('aria-modal', 'false');
    caja.setAttribute('aria-labelledby', 'ck-titulo');
    caja.innerHTML =
      '<button class="ck__x" type="button" aria-label="Cerrar sin aceptar">&times;</button>' +
      '<h2 id="ck-titulo">Cookies</h2>' +
      '<p>Usamos cookies propias, que hacen falta para que la web funcione, y otras de terceros que solo ponemos si usted nos deja. ' +
      'Puede aceptarlas, rechazarlas o elegir una por una. Más detalle en la ' +
      '<a href="/politica-de-cookies/">política de cookies</a> y en la ' +
      '<a href="/politica-privacidad/">política de privacidad</a>.</p>' +
      '<form class="ck__detalle" hidden>' +
        '<label class="ck__fila ck__fila--fija"><input type="checkbox" checked disabled>' +
        '<span><b>Necesarias</b>Hacen que la web funcione y que se recuerde esta misma elección. No se pueden desactivar.</span></label>' +
        filas() +
      '</form>' +
      '<div class="ck__botones">' +
        '<button class="btn ck__si" type="button">Aceptar</button>' +
        '<button class="btn btn--linea ck__no" type="button">Denegar</button>' +
        '<button class="ck__mas" type="button">Ver preferencias</button>' +
      '</div>' +
      '<div class="ck__botones ck__botones--guardar" hidden>' +
        '<button class="btn ck__guardar" type="button">Guardar mis preferencias</button>' +
      '</div>';
    document.body.appendChild(caja);

    var detalle = caja.querySelector('.ck__detalle');
    var previo = leer();
    if (previo) CATEGORIAS.forEach(function (c) {
      var i = detalle.querySelector('[name="' + c.id + '"]');
      if (i) i.checked = !!previo[c.id];
    });

    function verDetalle() {
      detalle.hidden = false;
      caja.querySelector('.ck__mas').hidden = true;
      caja.querySelector('.ck__botones--guardar').hidden = false;
    }
    if (abrirDetalle) verDetalle();
    caja.querySelector('.ck__mas').addEventListener('click', verDetalle);

    function cierra() { caja.remove(); caja = null; }
    caja.querySelector('.ck__si').addEventListener('click', function () { guardar(TODO_SI()); cierra(); });
    caja.querySelector('.ck__no').addEventListener('click', function () { guardar(TODO_NO()); cierra(); });
    caja.querySelector('.ck__x').addEventListener('click', function () { guardar(TODO_NO()); cierra(); });
    caja.querySelector('.ck__guardar').addEventListener('click', function () {
      var e = { necesarias: true };
      CATEGORIAS.forEach(function (c) {
        var i = detalle.querySelector('[name="' + c.id + '"]');
        e[c.id] = !!(i && i.checked);
      });
      guardar(e); cierra();
    });

    requestAnimationFrame(function () { caja.setAttribute('data-visible', ''); });
    caja.querySelector('.ck__si').focus({ preventScroll: true });
  }

  /* ---- arranque ----------------------------------------------- */
  var estado = leer();
  if (estado) aplicar(estado); else aplicar(TODO_NO());
  if (!estado) pinta(false);

  /* volver a abrirlo: enlace del pie y botón del bloque bloqueado */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-cookies-abrir]');
    if (!t) return;
    e.preventDefault();
    pinta(true);
  });

  /* «Ver el mapa» dentro del hueco bloqueado: acepta solo esa categoría */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-consent-permitir]');
    if (!t) return;
    var cat = t.getAttribute('data-consent-permitir');
    var e2 = leer() || TODO_NO();
    e2[cat] = true; e2.necesarias = true;
    guardar(e2);
  });

  window.MCConsentimiento = { abrir: function () { pinta(true); }, estado: leer };
})();
