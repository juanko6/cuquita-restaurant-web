#!/usr/bin/env bash
#
# deploy/publish.sh — publica el sitio en la instancia Oracle.
#
#   ./deploy/publish.sh              # comprueba, construye y publica
#   ./deploy/publish.sh --dry-run    # igual, pero rsync solo enseña qué haría
#   ./deploy/publish.sh --skip-checks
#
# El build se hace SIEMPRE en local: la instancia tiene 956 MB de RAM y no tiene
# Node. Ver deploy/oracle.md.
#
# Variables de entorno para apuntar a otro sitio sin tocar el script:
#   DEPLOY_HOST (por defecto: mindcheck, el alias de ~/.ssh/config)
#   DEPLOY_PATH (por defecto: /var/www/cuquita)
#   DEPLOY_URL  (por defecto: https://cuquita.juanko.com)

set -euo pipefail

HOST="${DEPLOY_HOST:-mindcheck}"
DEST="${DEPLOY_PATH:-/var/www/cuquita}"
URL="${DEPLOY_URL:-https://cuquita.juanko.com}"

DRY_RUN=0
SKIP_CHECKS=0

while [ $# -gt 0 ]; do
    case "$1" in
        -n | --dry-run) DRY_RUN=1 ;;
        --skip-checks) SKIP_CHECKS=1 ;;
        -h | --help)
            awk 'NR>2 && /^#/ { sub(/^# ?/, ""); print; next } NR>2 { exit }' "$0"
            exit 0
            ;;
        *)
            echo "opción desconocida: $1 (usa --help)" >&2
            exit 2
            ;;
    esac
    shift
done

cd "$(dirname "$0")/.."

step() { printf '\n\033[1m▸ %s\033[0m\n' "$1"; }
fail() { printf '\033[31m✗ %s\033[0m\n' "$1" >&2; exit 1; }

# ---------------------------------------------------------------------------
# 1. Calidad: lo mismo que exige el CI.
# ---------------------------------------------------------------------------
if [ "$SKIP_CHECKS" -eq 0 ]; then
    step "Formato, lint, tipos y tests"
    pnpm check
else
    echo "⚠ comprobaciones saltadas (--skip-checks)"
fi

# ---------------------------------------------------------------------------
# 2. Carta y build
# ---------------------------------------------------------------------------
step "Refrescando la carta desde MenuUnfolded"
pnpm fetch:menu || echo "⚠ no se pudo refrescar; se publica con la caché versionada"

step "Build"
pnpm build

# ---------------------------------------------------------------------------
# 3. Red de seguridad. rsync va con --delete: un build a medias vaciaría el
#    servidor. Se exige que estén las once páginas y los platos de la carta.
# ---------------------------------------------------------------------------
step "Comprobando el build"
for f in index.html 404.html carta/index.html nuestra-experiencia/index.html \
    visitanos/index.html legal/index.html en/index.html en/menu/index.html \
    en/our-experience/index.html en/find-us/index.html en/legal/index.html; do
    [ -s "dist/$f" ] || fail "falta dist/$f — el build no está completo, no publico"
done
[ -d dist/_astro ] || fail "falta dist/_astro — el build no está completo, no publico"

# Se cuenta por plato__nombre y no por la clase de la tarjeta: Card compone las
# clases, así que el atributo acaba siendo "tarjeta tarjeta--raised plato" y un
# grep por 'class="plato' no encuentra nada. Ya pasó una vez.
platos=$(grep -o 'plato__nombre' dist/carta/index.html | wc -l | tr -d ' ')
[ "$platos" -ge 80 ] || fail "la carta solo trae $platos platos — algo pasó con MenuUnfolded"
echo "  las 11 páginas, _astro/ y $platos platos en la carta"

step "Comprobando el acceso a $HOST"
ssh -o BatchMode=yes -o ConnectTimeout=10 "$HOST" "[ -d '$DEST' ] && [ -w '$DEST' ]" \
    || fail "no puedo escribir en $HOST:$DEST — revisa deploy/oracle.md (alta inicial)"
echo "  $HOST:$DEST accesible y escribible"

# ---------------------------------------------------------------------------
# 4. Publicación
# ---------------------------------------------------------------------------
RSYNC_FLAGS=(-az --delete --exclude=".DS_Store" --itemize-changes)
if [ "$DRY_RUN" -eq 1 ]; then
    RSYNC_FLAGS+=(--dry-run)
    step "rsync (EN SECO — no se cambia nada)"
else
    step "rsync → $HOST:$DEST"
fi

rsync "${RSYNC_FLAGS[@]}" dist/ "$HOST:$DEST/"

if [ "$DRY_RUN" -eq 1 ]; then
    printf '\n\033[1mEnsayo terminado.\033[0m Quita --dry-run para publicar de verdad.\n'
    exit 0
fi

# ---------------------------------------------------------------------------
# 5. Comprobación posterior. No hace falta recargar nginx: son estáticos.
# ---------------------------------------------------------------------------
step "Comprobando $URL"
code=$(curl -s -o /dev/null -m 15 -w '%{http_code}' "$URL/" || echo "000")
if [ "$code" != "200" ]; then
    echo "⚠ $URL/ responde $code — revisa la config de nginx"
else
    echo "  portada: 200"
fi

# La compresión no es un detalle: el presupuesto de peso se mide comprimido.
if curl -s -H 'Accept-Encoding: gzip' -o /dev/null -m 15 -w '%{size_download}' "$URL/carta" \
    | awk '{ exit ($1 < 40000) ? 0 : 1 }'; then
    echo "  la carta llega comprimida"
else
    echo "⚠ la carta llega SIN comprimir — falta el bloque gzip en nginx"
fi

if curl -sI -m 15 "$URL/" | grep -qi 'x-robots-tag: *noindex'; then
    echo "  noindex puesto: Google no va a indexar las pruebas"
else
    echo "⚠ falta el X-Robots-Tag noindex — esto es una copia de un negocio real"
fi

printf '\n\033[32m✓ Publicado.\033[0m\n'
