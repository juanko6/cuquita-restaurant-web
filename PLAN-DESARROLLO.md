# Plan de desarrollo — Cuquita Web 2026

Documento técnico. El de contenido y dirección de arte está aparte:
https://claude.ai/code/artifact/56576e41-37aa-47a4-a296-c12218bcea65

Repositorio: https://github.com/juanko6/cuquita-restaurant-web

---

## 1. Stack

| Pieza      | Elección                                        | Por qué                                                                                                                                                              |
| ---------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework  | **Astro 7**                                     | Genera HTML sin JavaScript por defecto. Es exactamente el problema que tenemos: el sitio actual manda 300 KB de HTML y 20 archivos JS para mostrar texto y fotos.    |
| Lenguaje   | **TypeScript** en modo `strict`                 | La carta viene de una API externa. Sin tipos, cualquier cambio de su lado se descubre en producción.                                                                 |
| Estilos    | **CSS propio con custom properties** y `@layer` | La marca tiene una paleta cerrada de cinco colores. Un sistema de tokens la impone; las utilidades la diluyen. Sin dependencia extra y sin clases de mil caracteres. |
| Validación | **Zod**                                         | Valida la respuesta de MenuUnfolded en el borde. Si cambian un campo, falla el build, no la web.                                                                     |
| Imágenes   | **`astro:assets`**                              | Genera AVIF y WebP en varios tamaños desde las fotos descargadas en el build.                                                                                        |
| Paquetes   | **pnpm**                                        | Ya está instalado y bloquea versiones de forma estricta.                                                                                                             |
| Tests      | **Vitest** + **Playwright**                     | Vitest para el adaptador de la carta, Playwright para humo y accesibilidad.                                                                                          |
| CI/CD      | **GitHub Actions**                              | Lint, tipos, tests, build y presupuesto de peso en cada PR. Despliegue solo desde `main`.                                                                            |
| Hosting    | Instancia **Oracle Cloud** + **Caddy**          | Decidido en el análisis (P-12). Estáticos, TLS automático y las 301 en la propia configuración.                                                                      |

**Descartado a propósito:** Tailwind (pelea con una paleta cerrada de cinco colores),
cualquier framework de UI (no hay estado que justificarlo), GSAP, Locomotive Scroll y
Splitting.js (lo que usa Sibuya: más de 150 KB para hacer lo que aquí hacemos con CSS y
15 KB).

---

## 2. Estructura del proyecto

```
cuquita-restaurant-web/
├── src/
│   ├── components/
│   │   ├── ui/              # piezas reutilizables, sin saber de negocio
│   │   │   ├── Button.astro
│   │   │   ├── Card.astro
│   │   │   ├── Carousel.astro
│   │   │   ├── Marquee.astro
│   │   │   ├── Picture.astro
│   │   │   ├── SplitHeading.astro
│   │   │   └── Section.astro
│   │   ├── menu/            # piezas que sí saben de la carta
│   │   │   ├── DishCard.astro
│   │   │   ├── CategoryCarousel.astro
│   │   │   └── PriceTag.astro
│   │   ├── sections/        # bloques de página, componen ui/ y menu/
│   │   │   ├── Hero.astro
│   │   │   ├── TodaySpecial.astro
│   │   │   ├── WeekStrip.astro
│   │   │   ├── Concept.astro
│   │   │   ├── Experience.astro
│   │   │   ├── Reviews.astro
│   │   │   ├── SocialSlider.astro
│   │   │   └── Visit.astro
│   │   └── layout/
│   │       ├── Nav.astro
│   │       ├── NavPanel.astro
│   │       └── Footer.astro
│   ├── layouts/
│   │   └── Base.astro       # <head>, schema.org, hreflang, skip link
│   ├── lib/
│   │   ├── menu/
│   │   │   ├── types.ts     # el modelo del dominio, nuestro, no el de ellos
│   │   │   ├── schema.ts    # zod: forma exacta de la respuesta de MenuUnfolded
│   │   │   ├── client.ts    # fetch + reintentos + timeout
│   │   │   ├── mapper.ts    # respuesta cruda → modelo del dominio
│   │   │   ├── cache.ts     # último JSON bueno en disco
│   │   │   └── index.ts     # única puerta de entrada: getMenu(lang)
│   │   ├── specials.ts      # qué especial toca hoy
│   │   ├── seo.ts           # JSON-LD de Restaurant, Menu y horarios
│   │   └── format.ts        # precios, horas, fechas
│   ├── content/
│   │   ├── copy/            # todos los textos de la web, es.json / en.json
│   │   └── reviews/         # reseñas curadas y aprobadas
│   ├── styles/
│   │   ├── tokens.css       # color, tipografía, espacio, duraciones
│   │   ├── reset.css
│   │   └── motion.css       # las seis animaciones del sistema
│   ├── pages/
│   │   ├── index.astro
│   │   ├── carta.astro
│   │   ├── nuestra-experiencia.astro
│   │   ├── visitanos.astro
│   │   └── en/…             # espejo en inglés
│   └── assets/
│       ├── brand/           # logo, la C, las ilustraciones de línea
│       └── menu/            # fotos descargadas en el build
├── scripts/
│   └── fetch-menu.ts        # descarga carta + fotos antes del build
├── tests/
│   ├── unit/
│   └── e2e/
├── .github/
│   ├── workflows/{ci.yml,deploy.yml}
│   ├── pull_request_template.md
│   └── CODEOWNERS
└── docs/
    ├── ARQUITECTURA.md
    └── CONTRIBUIR.md
```

---

## 3. Patrones de diseño

### Puerto y adaptador para la carta

`lib/menu/index.ts` expone **una sola función**: `getMenu(lang): Promise<Menu>`.
Todo lo demás —el `fetch`, la forma de la respuesta de MenuUnfolded, el mapeo— queda
detrás. Ningún componente sabe que MenuUnfolded existe.

Si mañana se cambia de proveedor, se reescribe el adaptador y no se toca ni un `.astro`.
También es lo que permite tener un `FakeMenuAdapter` en los tests, sin red.

### Validación en el borde

La respuesta cruda pasa por un esquema de Zod (`schema.ts`) antes de convertirse en nada.
Si MenuUnfolded renombra un campo, **el build falla con un mensaje claro** en vez de
publicar una carta rota. El modelo del dominio (`types.ts`) es nuestro y no copia el suyo:
sus `dish_id`, `is_featured` y `recurrence_days` se traducen a nuestros nombres.

### Caché como red de seguridad

`cache.ts` guarda el último JSON válido en disco y lo versiona en el repo. Orden en cada
build: intentar la API → si falla o no valida, usar la caché y avisar en el log → si no
hay caché, romper el build. **Nunca se publica una carta vacía.**

### Un solo origen para el diseño

`tokens.css` es la única fuente de color, tipografía, espacio y duraciones. Ningún
componente escribe un hex ni un tamaño en píxeles a mano. Si un valor no está en los
tokens, o se añade allí o no se usa.

### Composición sobre configuración

Los componentes se combinan con `<slot />`, no se controlan con quince props. `Card` no
sabe si dentro va un plato o una reseña.

Las variantes son uniones de tipos, no booleanos sueltos:

```ts
// bien
type ButtonProps = { variant: 'solid' | 'outline' | 'ghost'; size: 'sm' | 'md' };
// mal
type ButtonProps = { isPrimary?: boolean; isBig?: boolean; isGhost?: boolean };
```

Tres booleanos permiten ocho combinaciones y seis no tienen sentido.

### Los textos, fuera de las plantillas

Ningún literal de copy dentro de un `.astro`. Todo en `content/copy/es.json` y `en.json`,
con las mismas claves. Un test comprueba que las dos versiones tienen exactamente el mismo
juego de claves — así no se puede olvidar traducir un bloque.

---

## 4. Sistema de componentes

**Regla de dependencia:** `sections/` puede usar `menu/` y `ui/`. `menu/` puede usar `ui/`.
`ui/` no usa a nadie. Nunca al revés.

| Componente     | Props                            | Notas                                                                                          |
| -------------- | -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `Button`       | `variant`, `size`, `href?`       | Si hay `href` renderiza `<a>`, si no `<button>`. Nunca un `<div>` con click.                   |
| `Card`         | `as?`, `elevated?`               | Contenedor neutro. El contenido va por slot.                                                   |
| `Picture`      | `src`, `alt`, `sizes`, `loading` | Envuelve `astro:assets`. `alt` es obligatorio: sin texto alternativo no compila.               |
| `SplitHeading` | `text`, `level`                  | Parte el texto en líneas **en el build** y las envuelve para la animación de máscara. Cero JS. |
| `Carousel`     | `label`                          | `scroll-snap` nativo, navegable con teclado, con `aria-label`. Sin librería.                   |
| `Marquee`      | `items`, `speed`                 | La banda horizontal. CSS puro, se detiene con `prefers-reduced-motion`.                        |
| `Section`      | `tone`, `id`                     | Aplica el fondo (vino / vino hondo) y el ritmo vertical.                                       |
| `DishCard`     | `dish: Dish`                     | **Altura fija con o sin descripción** — 41 platos no la tienen en español.                     |
| `PriceTag`     | `amount`                         | Cifras tabulares, formato de dólar, un único sitio donde se decide.                            |

---

## 5. Convenciones de código

- **TypeScript `strict`**, sin `any`. Los tipos del dominio se definen una vez en `lib/menu/types.ts`.
- **Nombres de archivo:** componentes en `PascalCase.astro`, módulos en `camelCase.ts`.
- **Sin lógica en las plantillas.** Si un `.astro` necesita calcular algo más que un
  `map`, eso es una función pura en `lib/` y tiene su test.
- **CSS:** todo dentro de `@layer reset, tokens, base, components, utilities`. Estilos
  con `<style>` de Astro, que ya es scoped. Sin `!important`. Sin anidar más de dos niveles.
- **Accesibilidad, no negociable:** HTML semántico, un solo `<h1>` por página, foco
  visible, contraste AA (ojo con el oro sobre vino, 4,24:1 — ver dirección de arte),
  `prefers-reduced-motion` respetado en las seis animaciones.
- **Comentarios:** explican el porqué, nunca el qué. El caché de la carta lleva comentario;
  un `map` no.

---

## 6. Calidad

| Herramienta      | Qué mira                                                                       | Cuándo          |
| ---------------- | ------------------------------------------------------------------------------ | --------------- |
| `astro check`    | Tipos en plantillas y scripts                                                  | pre-commit y CI |
| ESLint           | JS/TS y reglas de accesibilidad en JSX/Astro                                   | pre-commit y CI |
| Prettier         | Formato                                                                        | pre-commit      |
| Stylelint        | Orden de propiedades y colores fuera de tokens                                 | pre-commit y CI |
| Vitest           | `lib/`: mapper, caché, especial del día, formato                               | CI              |
| Playwright + axe | Las 4 páginas cargan, no hay fallos de accesibilidad, la carta tiene 74 platos | CI              |
| Lighthouse CI    | Presupuestos de peso y rendimiento                                             | CI, bloqueante  |

**Presupuestos que el CI hace cumplir:**

Se mide **comprimido**, que es lo que de verdad viaja: Caddy sirve con `encode` y
ningún navegador de este siglo pide una página sin comprimir. Medir en crudo castigaba a
la carta, que son 88 fichas de markup casi idéntico y por eso baja a la octava parte, y no
decía nada sobre lo que tarda en llegar. El informe da las dos cifras.

- HTML por página: **< 20 KB** comprimido
- CSS total: **< 10 KB** comprimido
- JS total: **< 6 KB** comprimido
- LCP en móvil simulado: **< 1,5 s**
- Accesibilidad en Lighthouse: **100**

Si un PR se pasa del presupuesto, no entra. Es la única forma de que dentro de un año el
sitio siga siendo rápido.

### Móvil, primero y comprobado

Buena parte del tráfico de un restaurante llega desde un teléfono, muchas veces de alguien
parado en la puerta mirando si está abierto. Que la página funcione a 360 px no es un
extra: es el caso principal, y por eso no se deja en una casilla que alguien marca a ojo.

Cada PR corre la misma batería en **tres tamaños** —móvil 360, tableta 768 y escritorio
1280— y falla si:

- la página **se desplaza en horizontal**, con el nombre del elemento que se sale
- el titular **no se lee sin desplazar**
- el salto al contenido **no responde al teclado**
- **axe** encuentra cualquier fallo de WCAG 2.2 AA

Esa última ya se ganó el sueldo: cazó el precio del especial en oro sobre vino, 4,18:1,
justo la regla de contraste que habíamos escrito en la dirección de arte y que rompí al
maquetar.

**Hooks con Husky + lint-staged:** en `pre-commit`, formato y lint solo de lo que cambió.
En `commit-msg`, commitlint.

---

## 7. Git y flujo de trabajo

**Trunk-based con ramas cortas.** Nada vive más de dos o tres días fuera de `main`.

```
main                    siempre desplegable, protegida
 └── feat/hero-home      ramas cortas, un PR cada una
 └── fix/carta-precios
```

**Convenciones de rama:** `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`, `test/`.

**Conventional Commits**, en imperativo y en español:

```
feat(carta): carrusel de categorías con scroll-snap
fix(menu): usar la caché cuando la API responde 500
chore(ci): añadir presupuesto de peso a Lighthouse
```

**Sin líneas de co-autoría ni firmas automáticas en los commits.** El historial va limpio
y a nombre del autor.

**Cada PR incluye:** qué cambia y por qué, capturas si toca la interfaz, y la lista de
comprobación del template. Se revisa y se hace _squash merge_ para que `main` tenga un
commit por cambio.

---

## 8. Protección de `main`

Repositorio **público** (la protección de ramas es gratuita en repos públicos), con estas
reglas sobre `main`:

- ✅ Requiere pull request antes de fusionar — **nadie puede hacer push directo, incluido el dueño**
- ✅ Requiere que pasen los checks: `lint`, `typecheck`, `test`, `build`, `lighthouse`
- ✅ Requiere que la rama esté al día con `main` antes de fusionar
- ✅ Historial lineal (obliga a squash o rebase)
- ✅ Prohibido `force push`
- ✅ Prohibido borrar la rama
- ✅ Las reglas aplican también a administradores
- ✅ `CODEOWNERS` con tu usuario, para que todo PR te pida revisión

Al ser un repo público con un solo mantenedor, la aprobación obligatoria de otro revisor
se deja **desactivada** —te bloquearías a ti mismo— pero el PR y los checks siguen siendo
obligatorios. Si más adelante entra alguien al proyecto, se activa.

**Además:** `.gitignore` con `node_modules`, `dist`, `.env*`. Ningún secreto en el repo;
la clave SSH del despliegue vive en los _secrets_ de Actions. Como el repo es público,
esto se revisa antes del primer push.

---

## 9. CI/CD

**`ci.yml`** — en cada PR y en cada push a `main`:

```
install (pnpm, con caché)
  ├── lint        → eslint + stylelint + prettier --check
  ├── typecheck   → astro check
  ├── test        → vitest
  └── build       → astro build (con la carta cacheada, sin depender de la red)
        └── e2e   → playwright + axe
        └── perf  → lighthouse-ci contra los presupuestos
```

**`deploy.yml`** — solo en `main`, solo si `ci.yml` pasó:

```
build de producción (aquí sí se llama a la API de MenuUnfolded)
  └── rsync a la instancia de Oracle por SSH con clave de despliegue
        └── recarga de Caddy
```

**`refresh-menu.yml`** — cron diario: reconstruye y despliega para recoger cambios de la
carta y los especiales. Si la API falla, el job avisa y no despliega.

---

## 10. Fases

| Fase                | Entregable                                                                     | Cómo se sabe que está                                                    |
| ------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| ~~**0 · Base**~~    | ~~Repo, protección de `main`, CI en verde, Astro arrancando, tokens y reset~~  | **Hecho.** Push directo a `main` rechazado por el servidor y CI en verde |
| ~~**1 · Datos**~~   | ~~`lib/menu` completo: cliente, zod, mapper, caché, descarga de las 88 fotos~~ | **Hecho.** getMenu tipado, caché versionada y 94 fotos normalizadas      |
| ~~**2 · Sistema**~~ | ~~`ui/` y `menu/` con su página de muestra interna~~                           | **Hecho.** Diez componentes y el muestrario en /dev/componentes          |
| ~~**3 · Carta**~~   | ~~`/carta` en los dos idiomas, con las 13 categorías~~                         | **Hecho.** 88 platos y 88 fotos en los dos idiomas, 11,3 KB comprimido   |
| ~~**4 · Home**~~    | ~~Las nueve secciones, con las seis animaciones~~                              | **Hecho.** Nueve bloques, menú animado y 203 bytes de JavaScript         |
| ~~**5 · Resto**~~   | ~~`/nuestra-experiencia`, `/visitanos`, legales, 404~~                         | **Hecho.** Once páginas, todas con schema y hreflang                     |
| **6 · Producción**  | Caddy, DNS, 301, `noindex` del subdominio, analítica                           | El sitio viejo redirige y el nuevo mide                                  |

La fase 1 va antes que la 2 a propósito: con los datos reales tipados, los componentes se
construyen contra platos de verdad y no contra ejemplos inventados que luego no encajan.

---

## 11. Definition of done

Un PR está listo cuando:

- [ ] Los checks del CI están en verde, presupuesto de peso incluido
- [x] Funciona en móvil de 360 px, tableta y escritorio — lo comprueba el CI
- [ ] Se ve bien en español y en inglés
- [ ] Es navegable con teclado y el foco se ve
- [ ] Respeta `prefers-reduced-motion`
- [ ] Ningún color ni tamaño escrito a mano fuera de los tokens
- [ ] Ningún texto escrito dentro de una plantilla
- [ ] Si toca `lib/`, tiene test
