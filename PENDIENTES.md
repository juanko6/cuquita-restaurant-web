# Cuquita Web 2026 — pendientes

Documento de análisis: https://claude.ai/code/artifact/56576e41-37aa-47a4-a296-c12218bcea65
Plan de desarrollo: [PLAN-DESARROLLO.md](PLAN-DESARROLLO.md)
Repositorio: https://github.com/juanko6/cuquita-restaurant-web

Estado a 4 de septiembre de 2026. El análisis está cerrado y la dirección de arte definida.
Lo que queda son estas tareas.

---

## Abiertas

### ~~#1 · Historia real para /nuestra-experiencia~~ — **hecha**

El cuestionario está rellenado y la página escrita: Don Andy y Andrés en la cocina, la
familia en la sala, La Paila (Valle del Cauca), 1999 a Pensilvania, 2015 la apertura, los
cuadros del Eje Cafetero y las lámparas de guadua del Valle del Cocora.

Trajo además una corrección importante: **la parrilla es de gas, no de carbón.** La
portada prometía carbón y ya no.

Sigue sin usarse, por no estar confirmado: qué había en el 960 de Broadway antes de 2015.
Si alguna vez interesa, está en las licencias municipales de Fountain Hill o en la
hemeroteca de The Morning Call.

### #2 · Correo separado del hosting

Se mantiene `info@cuquitarestaurant.co` en un proveedor externo (Zoho Mail tiene plan
gratuito para un dominio; Google Workspace cobra por usuario/mes). Los MX apuntan fuera
del alojamiento. Una cuenta de Gmail queda solo como respaldo y recuperación del perfil
de Google Business.

- **Hay que hacerlo ANTES de mover los DNS a Oracle.**
- **Bloquea:** migración

### #8 · El carrusel de redes se queda esperando fotos

La portada enlaza a Instagram, pero el carrusel de fotos no se puede montar: haría falta
una selección de imágenes descargadas y aprobadas. No se incrusta el feed en vivo (cookies
de terceros y banner de consentimiento). Ver también #6.

### #9 · La historia del chef todavía no se puede escribir

La portada no lleva bloque de historia a propósito: sin los datos de
`docs/historia-cuquita.md` habría que inventarlos. Es lo que bloquea también
`/nuestra-experiencia`. Ver #1.

### #3 · Fotos del local, del equipo y del carbón

Media jornada en servicio. Es lo único que le falta al proyecto.

- **Plan B:** diseño que se sostiene con los 88 platos + tipografía + color.
- **Plan C:** fotos propias ya publicadas en el Facebook y en el perfil de Google del
  restaurante (son del negocio, se pueden reutilizar) + stock con licencia solo para
  textura y ambiente abstracto. **Nunca** una foto de internet haciendo pasar otro local
  por la sala de Cuquita.

### #4 · Confirmar la página de Facebook viva

El sitio actual enlaza a `facebook.com/Cuquita-Restaurant-115248308497887/` y la referencia
nueva es `facebook.com/cuquitarestaurant`. Hay que saber cuál es la buena antes de enlazarla.
Instagram sí está confirmado: `instagram.com/cuquitarestaurant`.

### #5 · Elegir la tipografía de titulares

El manual es una referencia, no una especificación: la web va en dirección nueva, estilo
Sibuya. La letra de titulares se elige por esa dirección y no por herencia. El logotipo y
la C sí se quedan tal cual.

### #6 · Acordar con el cliente reactivar las redes

El carrusel se monta igual con el contenido que ya hay (los platos no han cambiado). El día
que vuelvan a publicar, solo hay que refrescar la selección de fotos.

### #7 · Empezar a responder reseñas de Google

Nunca se ha hecho y hay acceso al perfil. No depende del sitio: se puede empezar hoy.
Guion: agradecer las buenas en el idioma en que estén escritas; en las malas reconocer,
no discutir y ofrecer volver. Arrancar por los últimos seis meses.

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

- [x] ~~Validar el índice de días de los especiales de MenuUnfolded (0 = lunes).~~
      Comprobado un viernes: la home saca "Sancocho costilla de res" y los dos diarios.
      Queda confirmar con el restaurante que el viernes es de verdad el día del sancocho.
- [x] ~~Caché del último JSON bueno de la carta.~~ Hecho al revés y mejor: la caché es
      la fuente del build y `pnpm fetch:menu` la refresca, así que el build nunca toca
      la red y un fallo de MenuUnfolded no puede publicar una carta vacía.
- [ ] Redirecciones 301 desde `/menus/*` y `/contact-us/`.
- [ ] **Caddy tiene que servir comprimido** (`encode zstd gzip`). El presupuesto de peso
      se mide comprimido porque es lo que viaja; sin compresión en el servidor la carta
      pasa de 11 KB a 87 KB y el número deja de significar nada.
- [ ] **Caddy tiene que servir comprimido** (`encode zstd gzip`). El presupuesto de
      peso se mide comprimido porque es lo que viaja; sin compresión en el servidor,
      la carta pasa de 11 KB a 87 KB y el número deja de significar nada.
- [ ] Revisar dónde sale hoy el correo del dominio antes de tocar los DNS.
- [ ] Partir los titulares en líneas durante el build, no con Splitting.js en el navegador.
- [ ] Carruseles con `scroll-snap` nativo, sin librería.
