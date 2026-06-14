# ترويسات أمان واجهة ADWETY

- ملف `public/_headers` يُنسخ تلقائيًا إلى `dist/_headers` ويعمل على منصات الاستضافة التي تدعم صيغة `_headers`.
- ملف `deploy/nginx.conf` مخصص لتقديم مجلد `dist` عبر Nginx.
- قبل النشر، عدّل `connect-src` إذا كان عنوان الـAPI مختلفًا عن `https://api.adwetycare.me`.
- سياسة CSP تمنع السكربتات الخارجية و`unsafe-eval`. أبقينا `style-src 'unsafe-inline'` مؤقتًا لأن الواجهة الحالية تستخدم خصائص `style` داخل React.
- فعّل HSTS فقط على طبقة HTTPS العامة، وليس على خادم HTTP داخلي.
