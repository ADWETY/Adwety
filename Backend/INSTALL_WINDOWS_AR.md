# تشغيل الباك إند على Windows

تم تنظيف `package-lock.json` من روابط سجل الحزم الداخلي وإجبار المشروع على استخدام سجل npm الرسمي.

من داخل مجلد `Backend` افتح PowerShell ونفذ:

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

الباك إند يعمل افتراضيًا على:

`http://localhost:6500`
