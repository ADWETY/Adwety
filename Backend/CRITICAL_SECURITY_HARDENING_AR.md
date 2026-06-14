# إغلاق الثغرات الحرجة في Backend أدويتي

تم تطبيق الإصلاحات التالية على جميع المسارات الرئيسية والقديمة المتوافقة مع المشروع.

## 1) حماية OTP لاستعادة كلمة المرور وتغيير البريد

- لم يعد OTP موجودًا داخل JWT أو أي Token يرسل للعميل.
- إنشاء OTP بواسطة `crypto.randomInt`.
- تخزين HMAC-SHA256 فقط داخل مجموعة `otp_requests` باستخدام `OTP_HASH_SECRET` مستقل.
- العميل يستلم `request_id` عشوائيًا بطول 256 بت. حقل `otp_token` ما زال موجودًا كاسم توافق قديم، لكن قيمته هي نفس `request_id` العشوائي وليست JWT.
- صلاحية افتراضية 10 دقائق عبر TTL index.
- خمس محاولات افتراضيًا، ثم إغلاق الطلب.
- الطلب صالح للاستخدام مرة واحدة فقط ويستهلك ذريًا قبل تنفيذ التغيير.
- حذف جميع طلبات الغرض نفسه بعد النجاح.
- إرسال الكود فعليًا عبر SMTP. لا يتم إرجاع الكود في الاستجابة.
- مسارات `forgot-password` و`reset-password` وتغيير البريد عليها Rate Limit مستقل.
- رسائل وتوقيت متقارب لحماية النظام من Account Enumeration.
- Tokens الصادرة قبل تغيير كلمة المرور تصبح غير صالحة عبر `passwordChangedAt`.

### عقد API

طلب الكود:

```json
{
  "success": true,
  "data": {
    "request_id": "64-hex-characters",
    "otp_token": "64-hex-characters",
    "expires_in_minutes": 10,
    "delivery": {
      "channel": "email",
      "destination": "mo*****@example.com"
    }
  }
}
```

تأكيد إعادة كلمة المرور:

```json
{
  "request_id": "64-hex-characters",
  "otp": "123456",
  "new_password": "StrongPassword123"
}
```

يمكن للواجهة القديمة إرسال نفس القيمة داخل `otp_token` بدل `request_id`.

## 2) إغلاق IDOR في مسارات المخزون القديمة

تم تأمين:

- `GET /api/v1/inventory`
- `POST /api/v1/inventory/sync`

بالقواعد التالية:

- الأدمن يستطيع تحديد `pharmacyId`، وتحديده إلزامي في المزامنة.
- الصيدلي لا يستطيع اختيار حدود الـTenant.
- الصيدلية تستخرج من المستخدم المصادق عليه والـJWT.
- إرسال `pharmacyId` مختلف عن صيدلية الصيدلي يعيد `403`.
- الصيدلي الذي لا يملك صيدلية معتمدة/نشطة لا يستطيع استخدام المخزون.

## 3) منع الصيدلي من اعتماد صيدليته

- Schema منفصل للأدمن والصيدلي في الإنشاء والتعديل.
- Schema الصيدلي لا يقبل `status` أو `ownerId` أو `owner_id`.
- Controller يستخدم Whitelist دفاعية ولا يستخدم `Object.assign` على Body الصيدلي.
- إنشاء الصيدلية بواسطة الصيدلي يفرض `pending` دائمًا.
- تغيير الحالة متاح للأدمن فقط.
- مسارات الصيدليات القديمة الخاصة بالإنشاء والتعديل والحذف عليها Admin RBAC صريح.

## 4) تأمين مسح الروشتات بالذكاء الاصطناعي

كل المسارات التالية أصبحت تتطلب JWT صالحًا:

- `POST /v1/scan/prescription`
- `POST /v1/ai/prescription`
- `POST /api/ai/prescription`
- `POST /api/prescriptions/scan`
- `POST /api/v1/prescriptions/scan`

الحماية المضافة:

- Authentication إجباري.
- Rate limit مستقل لكل مستخدم وعنوان IP.
- Quota يومي محفوظ ومحتسب من MongoDB.
- تنبيه للأدمن عند 80% وعند بلوغ الحد.
- رفض الطلب دون نص أو ملف.
- Timeout لخدمة Gemini.
- Circuit breaker يوقف الاستدعاءات مؤقتًا بعد تكرار فشل المزود.
- AI logs مرتبطة بالمستخدم المصادق عليه.

## 5) تأمين Docker وMongoDB

- إزالة JWT Secret الثابت من `docker-compose.yml`.
- استخدام Docker Secrets لـJWT وOTP وMongoDB وSMTP وGemini.
- MongoDB لم تعد تنشر أي Port على Host.
- تفعيل MongoDB Authentication.
- إنشاء مستخدم تطبيق محدود بصلاحية `readWrite` على قاعدة `adwety` فقط.
- Root credentials لا تصل إلى Backend.
- Backend يعمل كمستخدم `node` غير Root.
- تفعيل `read_only`, `no-new-privileges`, و`cap_drop: ALL`.
- ربط Backend على `127.0.0.1:6500` ليعمل خلف Reverse Proxy وHTTPS.
- شبكة Mongo داخلية منفصلة، مع شبكة Egress للـSMTP وGemini.
- إضافة سكربت نسخ احتياطي مشفر لا يكتب نسخة Plaintext على القرص:
  `scripts/backup-mongo-encrypted.sh`.

## إعدادات الإنتاج المطلوبة

أنشئ ملفات الأسرار الموضحة داخل `secrets/README.md`، واضبط متغيرات SMTP وCORS في بيئة النشر، ثم شغل:

```bash
docker compose up -d --build
```

ينبغي وضع Nginx أو Caddy مع HTTPS أمام `127.0.0.1:6500`.

## الاختبارات

```bash
npm ci
npm run check
npm run security:check
npm audit
```

آخر نتيجة أثناء التجهيز:

- Syntax check: PASS
- Security regression checks: PASS
- npm audit: 0 vulnerabilities
