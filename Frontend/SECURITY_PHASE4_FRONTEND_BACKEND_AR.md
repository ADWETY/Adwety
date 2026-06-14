# ADWETY — المرحلة الرابعة لتأمين الواجهة والجلسات

## النطاق

تم تطبيق هذه المرحلة على آخر نسخة Frontend وآخر Backend مؤمّن (Phase 3)، مع الحفاظ على Bearer tokens لمسارات الموبايل الرسمية فقط تحت `/api/v1/mobile`.

## الإصلاحات المنفذة

### 1. إزالة Tokens من localStorage

- لم يعد الـFrontend يخزن Access Token أو Refresh Token في `localStorage` أو `sessionStorage`.
- تم حذف وظائف `setStoredToken/getStoredToken`.
- عند بدء التطبيق يتم حذف المفاتيح القديمة تلقائيًا:
  - `adwety_auth_token`
  - `token`
  - `adminToken`
  - `authToken`
  - أي مفاتيح Refresh قديمة.
- التخزين المحلي يحتفظ فقط بعلامة جلسة غير حساسة داخل `sessionStorage`.

### 2. Cookies آمنة للجلسة

الـBackend يصدر للوحة الويب:

- `adwety_access`: `HttpOnly`, `Secure` في الإنتاج، `SameSite=Strict`.
- `adwety_refresh`: `HttpOnly`, `Secure` في الإنتاج، `SameSite=Strict`.
- `adwety_csrf`: Cookie قابلة للقراءة وموقعة للتحقق من CSRF.

لا يعيد Backend Tokens في JSON لمسارات الويب. مسارات الموبايل الرسمية ما زالت تستخدم Bearer Token لتوافق تطبيقات الهاتف.

### 3. CSRF حقيقي

- لكل Session قيمة CSRF عشوائية، ولا يُخزن منها إلا HMAC داخل MongoDB.
- طلبات `POST/PUT/PATCH/DELETE` المصادق عليها بالكوكي تتطلب:
  - Cookie `adwety_csrf`.
  - Header `X-CSRF-Token` بالقيمة نفسها.
  - مطابقة HMAC مع الـSession الفعلية.
- Refresh وLogout محميان كذلك حتى عند انتهاء Access Token.
- `CSRF_COOKIE_DOMAIN` قابل للضبط لعمل الواجهة والـAPI على subdomains مثل `.adwetycare.me`.

### 4. Silent Refresh

- عند استلام 401، يحاول الـFrontend تنفيذ `/auth/refresh` مرة واحدة.
- يتم منع تكرار عدة Refresh requests داخل التبويب نفسه باستخدام Promise مشتركة.
- بعد نجاح Rotation يعاد الطلب الأصلي تلقائيًا.
- عند فشل Refresh تُمسح حالة الواجهة وتعود لتسجيل الدخول.

### 5. ErrorBoundary

زر Reset يقوم الآن بالترتيب التالي:

1. محاولة `/auth/logout` لإبطال الجلسة في الخادم.
2. مسح أي Session marker ومفاتيح Tokens قديمة.
3. فتح صفحة تسجيل الدخول.

### 6. CSV Formula Injection

- أي نص يبدأ بـ `=`, `+`, `-`, `@`, Tab أو CR/LF يتم تحييده بإضافة apostrophe.
- يتم الهروب من علامات الاقتباس.
- تمت إضافة UTF-8 BOM لدعم العربية في Excel.
- القيم الرقمية الحقيقية تظل أرقامًا ولا تتغير.

### 7. Content Security Policy

تمت إضافة:

- `public/_headers` ويظهر داخل `dist/_headers`.
- `deploy/nginx.conf` لتقديم SPA مع CSP وSecurity Headers.
- Dockerfile للـFrontend باستخدام Nginx غير Root.

السياسة تمنع السكربتات الخارجية و`unsafe-eval` وتمنع iframe/object، وتسمح فقط باتصال API المحدد. يجب تعديل `connect-src` إذا تغير Domain الخاص بالـAPI.

### 8. Dependencies

- تحديث `react-router-dom` إلى `6.30.4` لإغلاق advisory الخاص بالـredirect.
- تحديث Vite إلى `8.0.16` وPlugin React المتوافق.
- `npm audit` للفرونت والباك: 0 vulnerabilities.

## إعدادات إنتاج إلزامية

```env
CORS_ORIGINS=https://admin.adwetycare.me
CSRF_SECRET=<random value at least 64 chars>
ACCESS_COOKIE_NAME=adwety_access
REFRESH_COOKIE_NAME=adwety_refresh
CSRF_COOKIE_NAME=adwety_csrf
CSRF_COOKIE_DOMAIN=.adwetycare.me
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict
COOKIE_PATH=/api/v1
```

يجب تقديم الواجهة والـAPI عبر HTTPS. يفضل أن يكونا تحت نفس registrable domain حتى تعمل `SameSite=Strict` وCookie Domain كما هو متوقع.

## الفحوصات

- Frontend production build: PASS.
- Frontend security checks: PASS.
- Backend syntax check: PASS.
- Backend security checks Phase 1–4: PASS.
- Backend npm audit: 0 vulnerabilities.
- Frontend npm audit: 0 vulnerabilities.

لم يتم تشغيل اختبار Browser End-to-End على MongoDB وRedis وخادم HTTPS فعلي داخل بيئة التجهيز. يجب تنفيذه على Staging قبل الإنتاج، خصوصًا Login/MFA/Refresh/Logout عبر subdomains الفعلية.
