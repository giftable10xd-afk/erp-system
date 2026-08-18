#!/usr/bin/env bash
# إعداد Caddy كـreverse proxy قدام التطبيق، مع شهادة HTTPS تلقائية.
#
#   bash deploy/setup-https.sh erp.example.com     # دومين حقيقي + HTTPS تلقائي
#   bash deploy/setup-https.sh 123.45.67.89        # IP بس (HTTP، من غير شهادة)
#
# Caddy مش nginx: بيجيب شهادة Let's Encrypt ويجدّدها لوحده من غير certbot
# ولا cron، وده أقل حاجة ممكن تتعطل بعدين.
set -euo pipefail

HOST="${1:-}"
if [ -z "$HOST" ]; then
  echo "الاستخدام: bash deploy/setup-https.sh <domain-or-ip>"
  exit 1
fi

if ! command -v caddy >/dev/null 2>&1; then
  echo "==> تثبيت Caddy"
  sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | sudo gpg --batch --yes --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    | sudo tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  sudo apt-get update
  sudo apt-get install -y caddy
fi

# لو المستخدم دخّل IP بدل دومين، Let's Encrypt مش بتصدر شهادات لـIP —
# فبنشغّل HTTP بس بدل ما نستنى شهادة عمرها ما هتيجي.
if [[ "$HOST" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  SITE_BLOCK="http://${HOST}"
  echo "==> $HOST عنوان IP — هيتظبط HTTP من غير شهادة."
  echo "    لو عايز HTTPS، وجّه دومين على الـIP ده وأعد تشغيل السكربت بالدومين."
else
  SITE_BLOCK="${HOST}"
  echo "==> $HOST دومين — Caddy هيجيب شهادة HTTPS تلقائيًا."
fi

sudo tee /etc/caddy/Caddyfile >/dev/null <<CADDY
${SITE_BLOCK} {
	encode zstd gzip

	# ملفات Next الثابتة أسماؤها فيها hash، فآمن نكاشها سنة كاملة.
	@immutable path /_next/static/* /fonts/*
	header @immutable Cache-Control "public, max-age=31536000, immutable"

	reverse_proxy 127.0.0.1:3000
}
CADDY

sudo systemctl reload caddy || sudo systemctl restart caddy

echo
echo "==> تم. الموقع شغال على: ${SITE_BLOCK}"
echo "    سجلات Caddy: sudo journalctl -u caddy -f"
