# marcoscerrajeros.es — web estática

Web de Marcos Cerrajeros (Alcorcón). HTML y CSS sin dependencias ni compilación:
lo que hay en el repositorio es exactamente lo que se sube al servidor.

## Estructura

```
/                       index.html (home)
/assets/css/            estilo.css
/assets/fonts/          Barlow y Barlow Condensed, subconjunto latino (woff)
/assets/img/            fotos y logos de marcas
/assets/logo/           logotipo en SVG (positivo y negativo)
favicon.ico · favicon.svg · apple-touch-icon.png
robots.txt · sitemap.xml · 404.html
```

Cada página nueva va en su propia carpeta con un `index.html` dentro, respetando
las URLs de la web actual (`/apertura-de-puertas/`, `/cambio-de-cerraduras/`…).

## Publicar

- **GitHub Pages**: subir el contenido de esta carpeta a la raíz del repositorio y activar
  Pages sobre la rama `main`.
- **Netlify**: arrastrar la carpeta. No hay comando de compilación ni directorio `dist`.
- **Webempresa (producción)**: subir por FTP a la raíz del dominio, con copia de
  seguridad previa de la instalación de WordPress.

## Estado

Hecha la home. Pendiente: las otras 16 páginas, la capa de movimiento (gyf-fx) y los
elementos marcados con el atributo `data-pendiente` en el HTML:

- las tres reseñas reales de la ficha de Google (tarea 37);
- conectar y probar el envío del formulario de contacto.

Los enlaces a las páginas que aún no existen dan 404 hasta que se maqueten.

## Notas técnicas

- Tipografías servidas en local, en formato woff con solo los caracteres del español
  (17 KB por peso). Antes de producción conviene generar también woff2.
- Datos estructurados: `Locksmith` y `FAQPage` en la home. Sin `aggregateRating`:
  Google no admite marcar reseñas propias que no están alojadas en la web.
- Sistema visual y biblioteca de efectos documentados en el proyecto de Claude
  (`claude/sistema_visual_web_nueva.md` y `claude/biblioteca_efectos_gyf.md`).
