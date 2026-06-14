# تقرير إغلاق الثغرات الأمنية المرتفعة والمتوسطة — ADWETY Backend

## نطاق التنفيذ

تم تنفيذ البنود الأمنية من 6 إلى 11 على جميع مسارات الـBackend الحديثة والقديمة قدر الإمكان، بما يشمل `/api` و`/api/v1` و`/v1` ومسارات لوحة الإدارة.

---

## 6) إلغاء الجلسات وRefresh Token Rotation

### ما تم تنفيذه

- مدة Access Token الافتراضية أصبحت 15 دقيقة.
- إضافة Refresh Token عشوائي قوي لمدة افتراضية 30 يومًا.
- لا يُخزن Refresh Token الخام في قاعدة البيانات؛ يُخزن HMAC فقط.
- إضافة Collection مستقلة للجلسات `sessions` تشمل:
  - المستخدم.
  - عائلة الـRefresh Token.
  - `tokenVersion`.
  - وقت تحقق MFA.
  - IP وUser-Agent.
  - تاريخ الانتهاء والإلغاء وسبب الإلغاء.
- Refresh Token Rotation عند كل تجديد.
- اكتشاف إعادة استخدام Refresh Token قديم، ثم:
  - إلغاء عائلة الجلسة.
  - زيادة `tokenVersion` للمستخدم.
  - إسقاط جميع Access Tokens القديمة فورًا.
- Logout يلغي الجلسة الحالية و/أو Refresh Token المرسل.
- Logout يعمل حتى لو انتهت صلاحية Access Token، بشرط إرسال Refresh Token.
- Logout All يلغي جميع الجلسات ويرفع `tokenVersion`.
- تغيير كلمة المرور، Reset Password، تعطيل الحساب، وتغيير الدور الأمني تلغي الجلسات الحالية.
- Middleware المصادقة يفحص مع كل طلب:
  - Session ID داخل JWT.
  - حالة الجلسة.
  - انتهاء الجلسة.
  - `tokenVersion`.
  - `passwordChangedAt` مقابل `iat`.

### المسارات

```text
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/logout-all

POST /api/admin/auth/refresh
POST /api/admin/auth/logout
POST /api/admin/auth/logout-all
```

Body التجديد:

```json
{ "refresh_token": "..." }
```

Body تسجيل الخروج الموصى به:

```json
{ "refresh_token": "..." }
```

---

## 7) MFA إلزامية لحسابات الأدمن

### ما تم تنفيذه

- أي حساب دوره `admin` لا يحصل على Session بعد كلمة المرور وحدها.
- دعم TOTP القياسي المتوافق مع تطبيقات Authenticator.
- تشفير Secret الخاص بـMFA باستخدام AES-256-GCM.
- إنشاء 10 Recovery Codes عند التفعيل فقط.
- لا تُخزن Recovery Codes خامًا؛ يُخزن HMAC لكل كود.
- Recovery Code يستخدم مرة واحدة ويُحذف ذريًا.
- Challenge عشوائي محدود المدة والمحاولات، ويستخدم مرة واحدة فقط.
- إعادة مصادقة بكلمة المرور + TOTP/Recovery Code قبل العمليات الحساسة.
- جميع عمليات الكتابة داخل لوحة الإدارة تتطلب MFA حديثة.
- عمليات الأدوية العالمية، المخزون الإداري، الصيدليات الإدارية، والدعم محمية أيضًا على المسارات المباشرة والقديمة.
- الوصول إلى البيانات الطبية الحساسة داخل AI Logs يتطلب MFA حديثة وسبب وصول مسجل.
- تسجيل أحداث enrollment/login/re-auth/logout في System Logs.

### تدفق تسجيل دخول الأدمن

1. إرسال البريد وكلمة المرور إلى مسار login.
2. يرجع الباك:

```json
{
  "mfa_required": true,
  "mfa_setup_required": true,
  "challenge_id": "...",
  "setup_secret": "...",
  "provisioning_uri": "otpauth://..."
}
```

`setup_secret` و`provisioning_uri` يظهران فقط عند أول تفعيل.

3. إرسال الكود إلى:

```text
POST /api/auth/mfa/setup/verify
```

أو من لوحة الإدارة:

```text
POST /api/admin/auth/mfa/setup/verify
```

4. في الدخول التالي يرجع `mfa_setup_required: false`، ويتم التحقق عبر:

```text
POST /api/auth/mfa/login/verify
POST /api/admin/auth/mfa/verify
```

5. إعادة التحقق للعمليات الحساسة:

```text
POST /api/auth/mfa/reauth
POST /api/admin/auth/mfa/reauth
```

---

## 8) Redis Rate Limiting وSoft Lockout

### ما تم تنفيذه

- Rate Limiting موزع باستخدام Redis بدل الاعتماد على Map داخل كل Instance.
- في Production يعمل النظام Fail-Closed إذا كان Redis مطلوبًا وغير متاح.
- مفاتيح Rate Limit تُخزن كـSHA-256 ولا تحتوي البريد أو البيانات الخام.
- حدود مستقلة لـ:
  - Login حسب الحساب وIP.
  - Forgot Password حسب الحساب+IP وحسب الحساب منفردًا.
  - OTP وMFA verification.
  - Registration.
  - Refresh Token.
  - AI prescription scans.
- إضافة `Retry-After` وRate Limit headers.
- Progressive Delay ثم Soft Lockout متدرج بعد المحاولات الفاشلة.
- عداد يومي لاستخدام AI لكل مستخدم مع تنبيه للأدمن عند 80% وعند المنع.
- Redis مضاف إلى Docker Compose بشبكة داخلية وكلمة مرور وPersistence.

---

## 9) سياسة كلمات المرور

### ما تم تنفيذه

- الحد الأدنى: 12 حرفًا.
- الحد الأقصى: 128 حرفًا.
- منع كلمات المرور الشائعة والمتوقعة.
- منع التكرار البسيط والتسلسلات الشائعة.
- منع احتواء كلمة المرور على الاسم أو البريد.
- فحص كلمات المرور المسربة باستخدام HIBP k-anonymity؛ لا تُرسل كلمة المرور للخدمة.
- في Production الوضع الافتراضي `required` ويُرفض إنشاء/تغيير كلمة المرور إذا تعذر فحص التسريب.
- HMAC-SHA-512 Pepper قبل bcrypt، ثم bcrypt بعدد rounds مضبوط.
- دعم قراءة Hash القديم للترحيل، لكن الحساب ذو كلمة مرور قديمة ضعيفة يُطلب منه Reset Password بدل استمرار استخدام سياسة ضعيفة.
- جميع مسارات التسجيل، إنشاء المستخدم، تغيير كلمة المرور، وReset Password تستخدم الخدمة المركزية نفسها.

> ملاحظة تشغيل: `PASSWORD_BREACH_CHECK=required` يحتاج اتصال HTTPS صادر إلى خدمة Pwned Passwords. يمكن ضبطه `optional` مؤقتًا عند تعطل الاتصال، لكن ذلك يقلل الحماية.

---

## 10) حماية بيانات الروشتات وسجلات AI

### ما تم تنفيذه

- فصل `AiLog` عن `SystemLog`.
- عدم تخزين نص الروشتة أو أسماء الأدوية Plaintext في السجلات الجديدة.
- التخزين الافتراضي هو Metadata فقط:
  - عدد الأدوية.
  - مستوى الثقة.
  - حالة العملية.
  - مزود AI.
  - Preview عام لا يحتوي النص الطبي.
- تخزين التفاصيل الطبية لا يحدث إلا عند `consent_to_store=true`.
- عند الموافقة تُشفر التفاصيل باستخدام AES-256-GCM.
- TTL تلقائي لسجلات AI، افتراضيًا 30 يومًا.
- Endpoint منفصل للوصول إلى البيانات الحساسة، للأدمن فقط مع MFA حديثة وسبب وصول.
- كل وصول حساس يُسجل في System Logs مع عداد وصول.
- إضافة سكربت لترحيل السجلات القديمة وحذف الحقول النصية القديمة:

```bash
npm run privacy:migrate-ai-logs
```

يجب تشغيل هذا الأمر مرة واحدة بعد أخذ Backup مشفر وقبل اعتبار بيانات السجلات القديمة معالجة بالكامل.

---

## 11) فحص الملفات المرفوعة

### ما تم تنفيذه

- عدم الثقة في MIME Type أو اسم/امتداد الملف.
- اكتشاف النوع عبر Magic Bytes.
- الأنواع المسموحة فقط:
  - JPEG
  - PNG
  - WebP
  - PDF
- حد لحجم الملف وعدد أجزاء Multipart وعدد الملفات.
- فحص Malware عبر ClamAV INSTREAM.
- في Production يتم رفض الرفع إذا كانت خدمة ClamAV غير متاحة.
- الصور:
  - فحص حقيقي باستخدام Sharp.
  - حد لعدد Pixels لمنع Decompression Bombs.
  - تدوير آمن.
  - إعادة Encoding.
  - إزالة Metadata.
- ملفات PDF:
  - فحص Header وEOF.
  - Parsing فعلي باستخدام `pdf-lib`.
  - تحديد عدد الصفحات.
  - رفض PDF المشفر.
  - رفض JavaScript وLaunch actions وEmbedded Files وRichMedia وOpenAction وAA.
- استبدال اسم الملف المرسل باسم عام بعد الفحص.

---

## إعدادات Production المطلوبة

يلزم إنشاء ملفات الأسرار الموضحة في:

```text
secrets/README.md
```

ثم تشغيل:

```bash
npm ci --omit=dev
npm run check
npm run security:check
npm audit --omit=dev
npm run privacy:migrate-ai-logs
```

ثم:

```bash
docker compose up -d --build
```

### تغييرات يجب أن يدعمها الفرونت

- تخزين `refresh_token` بصورة آمنة واستخدام `/auth/refresh` عند انتهاء Access Token.
- إرسال Refresh Token عند Logout.
- دعم شاشة إعداد/إدخال MFA للأدمن.
- حفظ Recovery Codes للمسؤول عند التفعيل وعرضها مرة واحدة فقط.
- التعامل مع الخطأ `MFA_REAUTH_REQUIRED` بفتح نافذة إعادة التحقق.
- كلمات المرور الجديدة يجب أن تكون 12–128 حرفًا وغير شائعة.
- إرسال `consent_to_store=true` فقط بعد موافقة صريحة من المستخدم على الاحتفاظ بالتفاصيل الطبية.

---

## نتائج الفحص المنفذة

```text
Backend JavaScript Syntax Check: PASS
Original Security Regression Checks: PASS
Phase 2 Security Checks: PASS
Runtime Security Smoke Tests: PASS
npm audit --omit=dev: 0 vulnerabilities
Route/Service Loading: PASS
Upload Magic Bytes + Image Re-encode: PASS
PDF Parser + Page Count: PASS
RFC 6238 TOTP Vector: PASS
Docker Compose YAML Parsing: PASS
```

## حدود التحقق

لم يُنفذ اختبار تكامل حي على خدمات MongoDB وRedis وClamAV وSMTP وGemini الخاصة بسيرفر الإنتاج؛ لأن بيانات الاتصال والخدمات الحية غير متاحة داخل بيئة التجهيز. كما لم يتم تشغيل `docker compose` فعليًا لعدم توفر Docker CLI، لكن ملف YAML تم تحليله بنجاح وفحص بنيته. يجب تنفيذ Staging Pentest واختبارات Integration قبل الإطلاق النهائي.
