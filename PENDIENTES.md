# Cuquita Web 2026 — pendientes

Documento de análisis: https://claude.ai/code/artifact/56576e41-37aa-47a4-a296-c12218bcea65
Plan de desarrollo: [PLAN-DESARROLLO.md](PLAN-DESARROLLO.md)
Repositorio: https://github.com/juanko6/cuquita-restaurant-web

Estado a 4 de septiembre de 2026. El análisis está cerrado y la dirección de arte definida.
Lo que queda son estas tareas.

---

## Abiertas

### #1 · Sacar el correo del hosting — **bloquea el lanzamiento**

Se mantiene `info@cuquitarestaurant.co` en un proveedor externo (Zoho tiene plan gratuito
para un dominio; Workspace cobra por usuario/mes), con los MX fuera del alojamiento y una
cuenta de Gmail solo como respaldo y recuperación del perfil de Google.

**Hay que hacerlo ANTES de mover los DNS.** Es el único pendiente que puede romper algo
que hoy funciona.

### #2 · Fotos y vídeo del local, de la sala y del equipo

Media jornada en servicio. Ahora hay tres cosas concretas que fotografiar, que salieron
del cuestionario: los cuadros del Eje Cafetero, las lámparas de guadua del Valle del
Cocora y las bandejas parrilleras fundidas por caldereros colombianos. Más la sala llena
y un retrato de Don Andy y Andrés.

Sin ellas el sitio funciona —lo sostienen los 88 platos—, pero pierde justo lo que las
reseñas más elogian: la gente.

**Y hace falta vídeo.** La portada abre con uno de banco de imágenes mientras llega el
propio: diez segundos de la parrilla del restaurante bastan. Está documentado en
`public/video/LICENCIA.md`; se sustituyen los dos archivos con el mismo nombre y ya.

### #3 · Aprobar las reseñas que se publican

En la portada salen cuatro, citadas y atribuidas tal cual las escribieron en Google. Son
palabras de clientes reales con su nombre: el restaurante tiene que dar el visto bueno
antes de publicar.

### #4 · Confirmar la página de Facebook viva

El sitio antiguo enlaza a `facebook.com/Cuquita-Restaurant-115248308497887/` y la
referencia nueva es `facebook.com/cuquitarestaurant`. Hasta saber cuál es la buena, la web
solo enlaza a Instagram, que sí está confirmado.

### #5 · Acordar con el cliente reactivar las redes

El carrusel de fotos de Instagram no se puede montar sin una selección de imágenes
descargadas y aprobadas. No se incrusta el feed en vivo: mete cookies de terceros y
obligaría a poner banner de consentimiento. De momento la web enlaza al perfil.

### #6 · Empezar a responder reseñas de Google

No depende del sitio y se puede empezar hoy. Guion: agradecer las buenas en el idioma en
que estén escritas; en las malas reconocer, no discutir y ofrecer volver. Arrancar por los
últimos seis meses.

---

## Decisiones tomadas que hay que respetar al construir

- **Carta:** fuente única de verdad en MenuUnfolded, vía API pública. Sin CMS.
  No se editan descripciones ni alérgenos ni nombres de categoría.
- **Pedido online:** el botón de Heartland se queda. Funciona desde EE. UU.
  Hay que avisar del salto de dominio antes de sacar al usuario del sitio.
- **Teléfono:** solo llamadas de voz al fijo, 610-868-5252. Ni WhatsApp ni SMS.
  El número se muestra grande y visible, no solo como enlace.
- **Sin reservas, sin catering, sin blog, sin feed de Instagram.**
- **Parqueadero:** amplio, el local está en un centro comercial. Va en el copy de la visita.
- **`menu.cuquitarestaurant.co` se queda como respaldo** por si MenuUnfolded falla.
  Se le añade `noindex` y `rel=canonical` hacia `/carta` para que no compita en Google.
- **Logo:** se queda igual. Existe versión vectorial.
- **Alérgenos:** no se muestran por plato. Aviso general remitiendo al personal.
- **Legal:** privacidad, cookies y accesibilidad AA dentro del alcance.
- **Paleta:** la del logo. Vino `#920526`, vino hondo `#76041E`, oro `#D8A84E`,
  crema `#F4EFE3`. La bandera (`#F3CA02` / `#2A3498` / `#F7171D`) solo como la franja
  diagonal del logo, nunca de fondo ni en botones.
- **Contraste:** oro sobre vino da 4,24:1, insuficiente para texto pequeño. Para texto
  pequeño en oro, o fondo vino hondo (5,33:1) o el oro aclarado `#E8C88A` (5,75:1).
- **Página:** se llama **Nuestra experiencia**, no "Nosotros", con la estructura de la de
  Sibuya. Manifiesto · los detalles · la casa · la semana · la frase · la familia · redes.
- **Redes:** entran con carrusel arrastrable. Fotos descargadas en el build, nunca un
  widget en vivo de Instagram (cookies de terceros y banner de consentimiento).
- **Movimiento:** presupuesto de 15 KB de JS para todo. Sin scroll suave tipo Locomotive.
  Todo respeta `prefers-reduced-motion` y nada nace en opacidad cero.
- **Despliegue:** sitio estático en la instancia de Oracle. Analítica sin cookies.

---

## Aviso sobre este archivo

El repositorio es **público**. Este documento incluye notas internas del proyecto y el
teléfono del restaurante (que ya es público). `docs/` sí quedó fuera del repositorio: el
manual de marca, las capturas de referencia y el cuestionario de la historia son material
de trabajo local.

---

## Comprobaciones técnicas para el desarrollo

Hechas en las fases 1 a 5:

- [x] Índice de días de los especiales de MenuUnfolded (0 = lunes). Comprobado un viernes.
- [x] Caché del último JSON bueno: es la fuente del build, así que el CI construye sin red.
- [x] Titulares partidos en el build, no con Splitting.js en el navegador.
- [x] Carruseles con `scroll-snap` nativo, sin librería.

Pendientes, todas de la fase 6:

- [ ] **Caddy tiene que servir comprimido** (`encode zstd gzip`). El presupuesto de peso se
      mide comprimido porque es lo que viaja; sin compresión en el servidor la carta pasa
      de 12 KB a 90 KB y el número deja de significar nada.
- [ ] Redirecciones 301 desde `/menus/*` y `/contact-us/`.
- [ ] `noindex` y `rel=canonical` en `menu.cuquitarestaurant.co`, que se queda como
      respaldo pero no debe competir en Google con `/carta`.
- [ ] Revisar dónde sale hoy el correo del dominio antes de tocar los DNS (ver #1).
