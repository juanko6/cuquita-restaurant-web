# Despliegue en Oracle Cloud

Runbook del sitio de pruebas en `cuquita.juanko.com`. El sitio es estático: Astro compila
en local y `rsync` sube el resultado. En el servidor no hay build, ni Node, ni contenedores.

Comparte instancia con el portafolio de `juanko.com`, así que **cada cambio de nginx puede
tumbar los dos sitios**. Lee la advertencia del apartado siguiente antes de tocar nada.

---

## La instancia

Es la misma del portafolio: `ssh mindcheck`, Ubuntu 22.04, nginx **1.18.0**, 956 MB de RAM
y 2 GB de swap, con los puertos 22, 80 y 443 abiertos. El runbook completo de la máquina
está en el repositorio del portafolio, en `deploy/oracle.md`.

Rutas de este sitio:

```
/var/www/cuquita                          el sitio (ubuntu:www-data, 755)
/etc/nginx/sites-available/cuquita.juanko.com
/etc/letsencrypt/live/cuquita.juanko.com/
/var/log/nginx/cuquita.{access,error}.log
```

### ⚠ La trampa de `http2`

En nginx 1.18 `http2` es una opción **del socket `:443`**, no del bloque `server`. El vhost
de `juanko.com` ya la declara. Si `deploy/nginx.conf` la repitiera, nginx daría
_"duplicate listen options"_ y **se caería la configuración entera, portafolio incluido**.

Por eso este fichero declara `listen 443 ssl;` a secas. El sitio va por HTTP/2 igual.

---

## Alta inicial

**1. El DNS.** Un registro `A` de `cuquita.juanko.com` a la IP de la instancia. Tiene que
resolver **antes** de pedir el certificado: certbot valida por HTTP.

```bash
dig +short cuquita.juanko.com
```

**2. El directorio**, del usuario que publica para no necesitar `sudo` en cada envío:

```bash
ssh mindcheck 'sudo mkdir -p /var/www/cuquita \
  && sudo chown ubuntu:www-data /var/www/cuquita \
  && sudo chmod 755 /var/www/cuquita'
```

**3. Un vhost temporal para que certbot pueda validar.** Sin esto no funciona:
`default-block.conf` devuelve **444 a cualquier host desconocido en el puerto 80**, así que
la petición de validación de certbot se corta antes de llegar a ninguna parte y el
certificado no se emite nunca.

```bash
scp deploy/nginx-alta.conf mindcheck:/tmp/cuquita-alta.conf
ssh mindcheck 'sudo cp /tmp/cuquita-alta.conf /etc/nginx/sites-available/cuquita.juanko.com \
  && sudo ln -sf /etc/nginx/sites-available/cuquita.juanko.com /etc/nginx/sites-enabled/ \
  && sudo nginx -t && sudo systemctl reload nginx'
```

**4. El certificado, y encima la configuración de verdad.**

```bash
ssh mindcheck 'sudo certbot --nginx -d cuquita.juanko.com'

scp deploy/nginx.conf mindcheck:/tmp/cuquita.conf
ssh mindcheck 'sudo cp /tmp/cuquita.conf /etc/nginx/sites-available/cuquita.juanko.com \
  && sudo nginx -t && sudo systemctl reload nginx'
```

`nginx -t` antes de recargar, **siempre**. Una configuración inválida no recarga, pero si el
proceso se reinicia con ella se caen los dos sitios.

Para comprobar la sintaxis de un fichero sin instalarlo —útil si se edita más adelante—:

```bash
scp deploy/nginx.conf mindcheck:/tmp/test.conf
ssh mindcheck 'printf "events {}\nhttp {\n  include /etc/nginx/mime.types;\n  include /tmp/test.conf;\n}\n" > /tmp/nginx-test.conf
  sudo nginx -t -c /tmp/nginx-test.conf; rm -f /tmp/test.conf /tmp/nginx-test.conf'
```

**5. Comprobar que el portafolio sigue vivo.** Es lo primero que hay que mirar después de
tocar nginx:

```bash
curl -sI https://juanko.com/ | head -1
```

---

## Publicar

Desde la raíz del repositorio, en tu máquina:

```bash
pnpm deploy
```

Hace las comprobaciones del CI, refresca la carta desde MenuUnfolded, construye, sube
`dist/` con `rsync --delete` y verifica tres cosas en el servidor: que la portada responde
200, que **la carta llega comprimida** y que está el `noindex`. **No hay que recargar
nginx**: son ficheros estáticos.

Para ensayar sin tocar nada:

```bash
pnpm deploy -- --dry-run
```

El script **se niega a publicar** si falta alguna de las once páginas o si la carta trae
menos de 80 platos. No lo esquives: `rsync --delete` deja el servidor idéntico a `dist/`.

---

## Por qué `noindex`

Esto es una copia de pruebas de un negocio que ya existe en Google con otro dominio. Si se
indexara, competiría consigo mismo y podría salir en una búsqueda de "Cuquita Restaurant"
con una URL que no es la suya.

La cabecera `X-Robots-Tag: noindex, nofollow` está en el vhost y el script de publicación
la comprueba en cada envío. **Se quita el día de la mudanza a `cuquitarestaurant.co`**, no
antes.

---

## Cuando algo va mal

**Se cayeron los dos sitios tras tocar nginx.** Casi seguro es la trampa de `http2`. Quita
el enlace de este vhost y recarga:

```bash
ssh mindcheck 'sudo rm -f /etc/nginx/sites-enabled/cuquita.juanko.com \
  && sudo nginx -t && sudo systemctl reload nginx'
```

**404 en todo.** El `root` apunta a un directorio vacío. Comprueba que
`/var/www/cuquita/index.html` existe y vuelve a publicar.

**La carta llega sin comprimir.** Falta el bloque `gzip` del vhost: el `nginx.conf` global
tiene `gzip_types` comentado. Sin él la carta pasa de 12 KB a 90 KB y el presupuesto de
peso del proyecto deja de significar nada.

**Publico y no cambia nada.** Caché. Los HTML se sirven sin caché agresiva, pero `/_astro/`
va con `immutable` a un año, y por eso Astro pone un hash en cada nombre.

**El certificado no renueva.** Certbot valida por el puerto 80. Repasa que la security list
de Oracle y `ufw` lo sigan permitiendo.

Registros:

```bash
ssh mindcheck 'sudo tail -50 /var/log/nginx/cuquita.error.log'
ssh mindcheck 'sudo tail -50 /var/log/nginx/cuquita.access.log'
```

---

## Lo que falta para la mudanza de verdad

Esto es un sitio de pruebas. Para `cuquitarestaurant.co` quedan:

- Sacar el correo del hosting **antes** de tocar los DNS (PENDIENTES #1).
- Quitar el `noindex`.
- Repetir el alta con el dominio real y su certificado.
- `noindex` y `rel=canonical` en `menu.cuquitarestaurant.co`, que se queda de respaldo.
- Analítica sin cookies, si se decide montarla.
