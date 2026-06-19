# تشغيل الفرونت على Windows

## المشكلة التي تم إصلاحها

كان `package-lock.json` يحتوي على روابط تنزيل داخلية من نطاق غير متاح خارج بيئة التطوير، لذلك كان `npm install` يحاول الاتصال بعنوان يبدأ بـ:

`packages.applied-caas-gateway1.internal.api.openai.org`

وينتهي بخطأ `ETIMEDOUT`.

كما كانت نسخة Vite السابقة تتطلب Node.js أحدث من النسخة المثبتة لديك `v20.11.1`.

## ما تم تعديله

- تحويل جميع روابط الحزم إلى `https://registry.npmjs.org/`.
- إضافة ملف `.npmrc` يثبت استخدام سجل npm الرسمي.
- استخدام `vite 5.4.14` و`@vitejs/plugin-react 4.3.4` المتوافقين مع Node.js `20.11.1`.
- إضافة سكربت تثبيت وفحص تلقائي لنظام Windows.

## التشغيل

من داخل مجلد `Frontend` افتح PowerShell ونفذ:

```powershell
powershell -ExecutionPolicy Bypass -File .\install-windows.ps1
npm run dev
```

أو يدويًا:

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm cache verify
npm ci --registry=https://registry.npmjs.org/ --no-audit --no-fund
npm run dev
```

الفرونت يعمل افتراضيًا على:

`http://localhost:6501`
