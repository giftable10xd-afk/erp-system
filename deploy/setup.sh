#!/usr/bin/env bash
# ملاحظة: السكربت مكتوب عشان يتشغّل أكتر من مرة من غير أذى — كل خطوة بتتخطى
# نفسها لو خلصت قبل كده، فلو وقف في النص تقدر تعيد تشغيله على طول.
#
# تجهيز سيرفر Oracle Cloud (Ubuntu 22.04+, ARM/aarch64 أو x86) لتشغيل
# نظام الـERP. شغّله على السيرفر نفسه بمستخدم عادي عنده sudo:
#
#   git clone https://github.com/giftable10xd-afk/erp-system.git
#   cd erp-system
#   cp deploy/env.example .env && nano .env
#   bash deploy/setup.sh
#
set -euo pipefail

# لو حد شغّله بـ`sudo bash deploy/setup.sh` هيتركّب كله بمستخدم root وبعدين
# الخدمة متلاقيش المتصفح. نمنع ده من الأول بدل ما نكتشفه بعد النشر.
if [ "$(id -u)" -eq 0 ]; then
  echo "!! متشغّلش السكربت بـsudo. شغّله بمستخدمك العادي — هو بينده sudo لوحده."
  exit 1
fi

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_USER="$USER"
NODE_MAJOR=22

export DEBIAN_FRONTEND=noninteractive

echo "==> المستخدم: $APP_USER"
echo "==> مجلد التطبيق: $APP_DIR"

if [ ! -f "$APP_DIR/.env" ]; then
  echo "!! مفيش ملف .env — انسخ deploy/env.example لـ.env واملاه الأول."
  exit 1
fi

sudo apt-get update -y

# ── Node.js ──────────────────────────────────────────────────────────
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d 'v')" -lt "$NODE_MAJOR" ]; then
  echo "==> تثبيت Node.js $NODE_MAJOR"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "==> Node موجود: $(node -v)"
fi

# ── اعتماديات التطبيق ────────────────────────────────────────────────
echo "==> تثبيت حزم npm"
cd "$APP_DIR"
npm ci

# ── متصفح Playwright ─────────────────────────────────────────────────
# مقسومة عمدًا لخطوتين: مكتبات النظام محتاجة root، لكن المتصفح نفسه لازم
# يتنزّل بمستخدم التطبيق. لو نزّلناه بـsudo هيروح في /root/.cache والخدمة
# (اللي بتشتغل بمستخدم عادي) مش هتلاقيه — وده بالظبط اللي كسر الـPDF قبل كده.
echo "==> تثبيت مكتبات النظام لـChromium"
sudo -E npx --yes playwright install-deps chromium

echo "==> تنزيل Chromium لمستخدم $APP_USER"
npx --yes playwright install chromium

# ── قاعدة البيانات ───────────────────────────────────────────────────
# migrate deploy بيطبّق الناقص بس ومش بيمسح بيانات — آمن يتعاد تشغيله.
echo "==> تطبيق أي migrations ناقصة"
npx prisma migrate deploy

# ── البناء ───────────────────────────────────────────────────────────
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
# صور Ubuntu على Oracle بتيجي بقاعدة REJECT في آخر INPUT، فبندخل قواعدنا
# بـ-I (في الأول) مش -A (في الآخر) وإلا الـREJECT هيسبقها.
echo "==> فتح المنافذ 80 و443"
for port in 80 443; do
  sudo iptables -C INPUT -p tcp --dport "$port" -j ACCEPT 2>/dev/null \
    || sudo iptables -I INPUT -p tcp --dport "$port" -j ACCEPT
done

# iptables-persistent بيسأل سؤالين وقت التثبيت، وdebconf دي بترد عليهم
# مقدمًا عشان السكربت ميقفش مستني إجابة.
if ! dpkg -s iptables-persistent >/dev/null 2>&1; then
  echo iptables-persistent iptables-persistent/autosave_v4 boolean true | sudo debconf-set-selections
  echo iptables-persistent iptables-persistent/autosave_v6 boolean true | sudo debconf-set-selections
  sudo apt-get install -y iptables-persistent
fi
sudo netfilter-persistent save

echo
echo "==> تم. التطبيق شغال على المنفذ 3000."
sudo systemctl --no-pager --lines=0 status erp-system || true
echo
echo "    السجلات: sudo journalctl -u erp-system -f"
echo "    الخطوة الجاية: bash deploy/setup-https.sh <domain-or-ip>"
echo
echo "    فاكر: لازم كمان تفتح 80/443 من لوحة Oracle نفسها"
echo "    (Networking > VCN > Security Lists > Ingress Rules)."
