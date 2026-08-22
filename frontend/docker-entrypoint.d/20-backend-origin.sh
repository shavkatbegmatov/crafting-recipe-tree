#!/bin/sh
# Nginx konfiguratsiyasini shablondan yasaydi va backend manzilini BACKEND_ORIGIN dan oladi.
#
# Nega env orqali: `backend` kabi umumiy nom Coolify'ning yassi umumiy tarmog'ida boshqa
# loyihaning konteyneriga hal bo'lib ketishi mumkin. Manzilni sozlanadigan qilib, sukut
# qiymatini loyihaga xos nom qilib qo'yamiz.
set -eu

: "${BACKEND_ORIGIN:=http://crafttree-backend:8080}"

# Manzilni tekshiramiz: sxema majburiy, aks holda nginx konfiguratsiyasi buziladi.
case "$BACKEND_ORIGIN" in
    http://*|https://*) ;;
    *)
        echo "BACKEND_ORIGIN 'http://' yoki 'https://' bilan boshlanishi shart: $BACKEND_ORIGIN" >&2
        exit 1
        ;;
esac

sed "s|__BACKEND_ORIGIN__|${BACKEND_ORIGIN}|g" \
    /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf

echo "nginx: backend manzili -> ${BACKEND_ORIGIN}"
