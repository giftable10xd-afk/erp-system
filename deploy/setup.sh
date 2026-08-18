#!/usr/bin/env bash
# ملاحظة: السكربت مكتوب عشان يتشغّل أكتر من مرة من غير أذى — كل خطوة بتتخطى
# نفسها لو خلصت قبل كده، فلو وقف في النص تقدر تعيد تشغيله على طول.
#
# تجهيز سيرفر Oracle Cloud (Ubuntu 22.04+, ARM/aarch64 أو x86) لتشغيل
# نظام الـERP. شغّله على السيرفر نفسه بصلاحية sudo:
#
#   git clone https://github.com/giftable10xd-afk/erp-system.git
#   cd erp-system
#   bash deploy/setup.sh
#
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_USER="${SUDO_USER:-$USER}"
NODE_MAJOR=22

echo "==> تثبيت النظام لمستخدم: $APP_USER"
echo "==> مجلد التطبيق: $APP_DIR"

# ── Node.js ──────────────────────────────────────────────────────────
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d 'v')" -lt "$NODE_MAJOR" ]; then
  echo "==> تثبيت Node.js $NODE_MAJOR"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "==> Node موجود بالفعل: $(node -v)"
fi

# ── اعتماديات التطبيق ────────────────────────────────────────────────
echo "==> تثبيت حزم npm"
cd "$APP_DIR"
npm ci

# ── متصفح Playwright ─────────────────────────────────────────────────
# هنا إحنا root على السيرفر، فـ--with-deps بيشتغل عادي وبيجيب مكتبات النظام
# اللي Chromium محتاجها — وده اللي كان فاشل على Render.
echo "==> تثبيت Chromium ومكتبات النظام"
sudo npx playwright install --with-deps chromium

# ── البناء ───────────────────────────────────────────────────────────
if [ ! -f "$APP_DIR/.env" ]; then
  echo "!! مفيش ملف .env — انسخ deploy/env.example لـ.env واملاه قبل ما تكمل."
  exit 1
fi

echo "==> بناء التطبيق"
npm run build

# ── خدمة systemd ─────────────────────────────────────────────────────
echo "==> تركيب خدمة systemd"
sudo tee /etc/systemd/system/erp-system.service >/dev/null <<UNIT
[Unit]
Description=ERP System (Next.js)
After=network.target

[Service]
Type=simple
User=${APP_USER}
WorkingDirectory=${APP_DIR}
EnvironmentFile=${APP_DIR}/.env
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=$(command -v npm) run start
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable erp-system
sudo systemctl restart erp-system

# ── جدار الحماية ─────────────────────────────────────────────────────
# Oracle بيسيب iptables مقفول افتراضيًا على Ubuntu، فلازم نفتح 80/443 هنا
# *وكمان* في Security List بتاعة الشبكة من لوحة تحكم Oracle نفسها.
echo "==> فتح المنافذ 80 و443"
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save 2>/dev/null || sudo apt-get install -y iptables-persistent

echo
echo "==> تم. التطبيق شغال على المنفذ 3000."
echo "    الحالة:  sudo systemctl status erp-system"
echo "    السجلات: sudo journalctl -u erp-system -f"
echo
echo "    الخطوة الجاية: bash deploy/setup-https.sh <your-domain-or-ip>"
