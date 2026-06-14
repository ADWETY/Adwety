# مراجعة تنفيذ تقرير Adwety Security Assessment

تاريخ المراجعة: 14 يونيو 2026

تمت مقارنة آخر نسخة من الـBackend مع البنود الستة الواردة في تقرير التقييم الأمني المؤرخ 24 مايو 2026.

## النتيجة

جميع المتطلبات الستة أصبحت منفذة، مع إضافة اختبارات Regression لمنع عودة الثغرات.

## حالة كل بند

### 1. Mass Assignment عند التسجيل

- التسجيل العام لا يقبل حقل `role`.
- أي محاولة لإرسال `role: admin` أو `role: pharmacist` تُرفض بـValidation Error.
- الحساب العام يُنشأ دائمًا بدور `patient`.
- تم تطبيق الحماية على المسارات:
  - `POST /api/auth/register`
  - `POST /v1/register`
  - `POST /v1/auth/register`
  - `POST /api/v1/auth/register`

### 2. BOLA / IDOR في تعديل الأدوية العامة

- `PUT /api/drugs/:id` للأدمن فقط.
- يوجد RBAC في الـRoute وGuard إضافي داخل الـController.
- المسارات القديمة `/api/v1/medicines/:id` أصبحت تستخدم Middleware صريحًا يسمح للأدمن فقط.

### 3. تسريب بيانات الصيدليات

- `GET /api/pharmacies` يستخدم Projection وSerializer عامين.
- لا يرجع `owner_id` أو البريد أو تواريخ الإنشاء والتعديل.
- لا يمكن للزائر استخدام `status=pending/rejected/inactive` لاستعراض صيدليات غير عامة.

### 4. إنشاء دواء عالمي بدون صلاحية

- `POST /api/drugs` للأدمن فقط.
- إنشاء الأدوية في المسارات القديمة للأدمن فقط.
- الصيدلي يستخدم المخزون ويربطه بدواء Master موجود ونشط بدل إنشاء تعريف عالمي.

### 5. اختفاء الدواء بعد الإنشاء أو التعديل

- الإنشاء والتعديل يثبتان `isActive: true`.
- `GET /api/drugs` يعرض كل دواء غير معطل صراحة.
- مزامنة المخزون ترفض الأدوية غير النشطة أو غير الموجودة.

### 6. مخزون خاص وآمن للصيدلي

- `GET /api/pharmacy/my-inventory` للصيدلي فقط.
- لا يقبل `pharmacyId` في Query أو Body أو Params.
- الصيدلية تُستنتج من المستخدم الموثق بالـJWT.
- في `POST /api/inventory/sync` يتم اشتقاق صيدلية الصيدلي من حسابه، وأي `pharmacyId` مختلف يُرفض.
- الأدمن فقط يحتفظ بإمكانية تحديد صيدلية صراحة في مزامنة المخزون.

## تحسينات إضافية

- تحديث Express إلى `4.22.2` و`qs` إلى `6.15.2`.
- نتيجة `npm audit`: صفر ثغرات معروفة.
- إضافة الأمر:

```bash
npm run security:check
```

## نتائج الفحص

```text
Backend syntax check: PASS
Security report regression checks: PASS (6/6)
npm audit: 0 vulnerabilities
```

ملاحظة: اختبار تكامل كامل بالطلبات الحقيقية يحتاج MongoDB عاملة وبيانات مستخدمين بأدوار مختلفة.
