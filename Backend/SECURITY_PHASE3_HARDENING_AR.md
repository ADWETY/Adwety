# تقرير إغلاق ثغرات المسارات والاختبارات الأمنية – المرحلة الثالثة

## النطاق

تمت معالجة توسع سطح الهجوم الناتج عن تعدد المسارات، وتقوية الاختبارات الأمنية، وإغلاق الملاحظات الخاصة بمسار التحليلات والتسجيل والإشعارات وطبقة صلاحيات Legacy وإعداد `TRUST_PROXY` ومحتوى Gemini غير الموثوق.

## 1. توحيد نسخة الـAPI

النسخة الرسمية الوحيدة أصبحت:

```text
/api/v1
```

ومسارات تطبيق الموبايل أصبحت جزءًا منها:

```text
/api/v1/mobile
```

أما `/api` و`/v1` و`/api/v1/dashboard` وLegacy Dashboard فهي معطلة افتراضيًا. عند تفعيلها مؤقتًا للمهاجرة فإنها تعيد ترويسات Deprecation/Sunset وتستخدم نفس Routers والـRate Limits المركزية، وعند تعطيلها تعيد `410 Gone`.

تم تحويل ملفات Flutter الأحادية القديمة إلى Compatibility exports فقط، بحيث لا تحتوي على Business Logic مكرر.

## 2. إغلاق كشف التحليلات

تم تأمين:

```text
GET /api/v1/mobile/analytics
```

بـ:

- تسجيل دخول إلزامي؛
- دور `admin` فقط؛
- MFA حديثة للأدمن.

## 3. إغلاق تجاوز Rate Limit للتسجيل

كل مسارات التسجيل، بما فيها أي Alias يتم تفعيله، تستخدم نفس Redis prefixes ونفس الحدود. الانتقال بين `/api/v1/mobile/auth/register` و`/v1/auth/register` لا ينشئ Bucket جديدًا ولا يتجاوز الحد.

## 4. إصلاح Notification Read

تم حذف الـstub الذي كان يعيد نجاحًا وهميًا. عملية القراءة الآن:

- تتحقق من ObjectId؛
- تطبق Access Filter حسب المستخدم والدور والصيدلية؛
- تحدث `readBy` فعليًا داخل MongoDB؛
- تعيد 404 إذا لم يكن الإشعار موجودًا أو غير مسموح للمستخدم.

## 5. Defense in Depth لمسارات Legacy

تمت إضافة `auth.authorize(['admin'])` على مستوى الراوتر لمسارات الأدمن، ومنها:

- `/admins`؛
- `/approval-requests`؛
- `/analytics` مع MFA حديثة.

تبقى Guards داخل Controllers كطبقة إضافية، وليس كطبقة وحيدة.

## 6. حماية TRUST_PROXY

في Production:

- `TRUST_PROXY=true` مرفوض ويمنع تشغيل السيرفر؛
- تعطيله مع `TRUST_PROXY_REQUIRED=true` يمنع التشغيل؛
- المسموح هو رقم Hops دقيق من 1 إلى 99؛
- Docker يفرض `TRUST_PROXY_REQUIRED=true` ويستخدم العدد المحدد.

هذا يمنع الاعتماد على IP البروكسي لكل المستخدمين أو قبول `X-Forwarded-For` غير موثوق.

## 7. تقوية Gemini ضد Prompt Injection والمخرجات غير الموثوقة

- عزل مدخل المستخدم داخل JSON كبيانات غير موثوقة؛
- System Instruction صريح يمنع تنفيذ تعليمات الوصفة؛
- حد أقصى لطول الإدخال؛
- إزالة HTML وControl/Bidi characters؛
- Structured JSON schema؛
- Zod validation صارمة للمخرجات؛
- تنقية أسماء الأدوية والنص قبل الإرجاع والتخزين؛
- API key داخل Header بدل Query string؛
- Timeout وCircuit Breaker وQuota ما زالت مفعلة.

تظل القاعدة للفرونت: عرض النصوص باستخدام text nodes، وليس `dangerouslySetInnerHTML`.

## 8. الاختبارات الأمنية الجديدة

### اختبارات سريعة بدون قاعدة حية

`scripts/security-phase3-check.js` يغطي:

- Lifecycle للمسارات الرسمية والقديمة؛
- منع Patient من التحليلات؛
- مشاركة Rate Limit بين Aliases؛
- ObjectId validation للإشعارات؛
- تحديث Notification فعلي عبر Service؛
- فشل Production عند إعداد Proxy غير آمن؛
- تنقية مدخلات ومخرجات AI والتحقق من JSON schema.

### Integration Tests بقاعدة MongoDB اختبار

`tests/security.integration.test.js` ينشئ:

- Admin مع MFA؛
- Pharmacist A وصيدلية A؛
- Pharmacist B وصيدلية B؛
- Patient.

ويختبر:

- ID swapping وعزل الصيدليات؛
- Mass Assignment على المسارات الرسمية وأي Aliases مؤقتة؛
- منع اعتماد الصيدلية ذاتيًا؛
- صلاحيات التحليلات؛
- ملكية الإشعارات والتحديث الدائم؛
- فصل Sessions بين المستخدمين.

يعمل تلقائيًا في GitHub Actions باستخدام MongoDB معزولة، أو محليًا عند تعيين `TEST_MONGODB_URI`.

## 9. بوابات CI/CD

تمت إضافة:

- CodeQL SAST؛
- Gitleaks Secret Scanning؛
- `npm audit`؛
- Integration Tests؛
- OWASP ZAP DAST يدويًا على Staging؛
- اختبارات رفع الملفات من المرحلة الثانية؛
- وثيقة Independent Pentest Release Gate.

لا يُعتبر نجاح الاختبارات الآلية بديلًا عن Pentest مستقل قبل الإطلاق العام.

## أوامر التحقق

```bash
npm ci
npm run check
npm run security:check
TEST_MONGODB_URI=mongodb://127.0.0.1:27017/adwety_security_test npm run test:security:integration
npm audit --audit-level=high
```
