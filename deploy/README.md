# النشر على Oracle Cloud (Always Free)

سيرفر Oracle المجاني الدائم بيشغّل النظام من غير ما ينام ومن غير تكلفة، وبما
إن السيرفر ملكك بالكامل فـPlaywright بيشتغل عليه طبيعي — مش محتاج أي حيلة زي
اللي بتتعمل على الاستضافات الـserverless.

## 1. إنشاء السيرفر

من لوحة تحكم Oracle Cloud: **Compute → Instances → Create Instance**

| الإعداد | القيمة |
|---|---|
| Shape | **VM.Standard.A1.Flex** (Ampere ARM) — ده اللي ضمن Always Free |
| OCPU / RAM | 4 OCPU / 24 GB (كامل حصة المجاني) |
| Image | Ubuntu 22.04 أو أحدث |
| SSH key | ارفع مفتاحك العام |

بعد الإنشاء، من **Networking → Virtual Cloud Network → Security Lists** ضيف
Ingress Rules تسمح بـ **TCP 80** و **TCP 443** من `0.0.0.0/0`.

> مهم: Oracle بيقفل المنافذ من مكانين — الـSecurity List فوق، و`iptables`
> جوه السيرفر. سكربت `setup.sh` بيتكفّل بالتاني، بس الأول لازم يتعمل يدوي من
> اللوحة.

## 2. تجهيز التطبيق

```bash
ssh ubuntu@<SERVER_IP>

git clone https://github.com/giftable10xd-afk/erp-system.git
cd erp-system

cp deploy/env.example .env
nano .env          # املا القيم الحقيقية

bash deploy/setup.sh
```

`setup.sh` بيعمل: تثبيت Node 22، تنزيل الحزم، تثبيت Chromium بمكتبات النظام،
بناء التطبيق، تركيبه كخدمة `systemd` بتشتغل تلقائي مع كل إقلاع، وفتح المنافذ.

## 3. تشغيل الموقع على الإنترنت

```bash
bash deploy/setup-https.sh erp.example.com   # دومين: HTTPS تلقائي
bash deploy/setup-https.sh <SERVER_IP>       # IP: HTTP بس
```

## 4. أوامر التشغيل اليومية

```bash
sudo systemctl status erp-system      # الحالة
sudo journalctl -u erp-system -f      # السجلات المباشرة
sudo systemctl restart erp-system     # إعادة تشغيل
```

## تحديث النسخة بعد أي تعديل

```bash
cd ~/erp-system
git pull
npm ci
npm run build
sudo systemctl restart erp-system
```

## قاعدة البيانات

قاعدة البيانات على Neon (مجانية ومستقلة عن السيرفر)، فنقل الاستضافة مش
بيأثر على البيانات. أول مرة بس، لو القاعدة فاضية:

```bash
npx prisma migrate deploy
```
