# Cuquita Restaurant

Sitio web de [Cuquita Restaurant](https://cuquitarestaurant.co) — cocina colombiana de
todas las regiones, en 960 Broadway, Fountain Hill, Pensilvania.

Sustituye un WordPress con Elementor que enviaba 300 KB de HTML y veinte archivos de
JavaScript para mostrar texto y fotos. Este sitio es estático, bilingüe y su carta se
genera desde la API pública de MenuUnfolded, que es donde el restaurante ya la mantiene.

## Empezar

```bash
pnpm install
pnpm dev
```

| Comando      | Qué hace                                          |
| ------------ | ------------------------------------------------- |
| `pnpm dev`   | Servidor de desarrollo                            |
| `pnpm build` | Build de producción en `dist/`                    |
| `pnpm check` | Formato, lint, tipos y tests — lo mismo que el CI |
| `pnpm test`  | Tests unitarios                                   |

## Cómo está montado

- **Astro 7** en modo estático, sin JavaScript salvo donde hace falta
- **Español en la raíz**, inglés bajo `/en/`
- **La carta vive fuera**: se lee de MenuUnfolded en el build y se cachea en disco, así
  que un fallo de su API nunca publica una carta vacía
- **Diseño por tokens** en `src/styles/tokens.css`, con los colores muestreados del logo

Los detalles están en [PLAN-DESARROLLO.md](PLAN-DESARROLLO.md). Las decisiones de
contenido y la dirección de arte, en el documento de análisis.

## Presupuesto

El CI bloquea el merge si un cambio se pasa de aquí:

|                 | Límite |
| --------------- | ------ |
| HTML por página | 40 KB  |
| CSS total       | 25 KB  |
| JS total        | 15 KB  |

## Contribuir

`main` está protegida: todo entra por pull request con el CI en verde. Ramas cortas con
prefijo `feat/`, `fix/`, `chore/`, `docs/`, `refactor/` o `test/`, y commits siguiendo
[Conventional Commits](https://www.conventionalcommits.org/es/).
