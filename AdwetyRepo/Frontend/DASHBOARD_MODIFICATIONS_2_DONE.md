# Dashboard Modifications 2 - Done

Applied requested changes from `تعديلات 2.docx`:

1. Removed the camera barcode scanner UI from POS.
   - No camera block, no camera start button, no video scanner UI.
   - Barcode-reader input still works by typing/scanning barcode and pressing Enter.

2. Added POS cancel invoice button.
   - New `Cancel invoice` / `إلغاء الفاتورة` button clears the current invoice draft, items, discount, paid amount, notes, and print preview.

3. Improved Arabic localization across MATGR dashboard pages.
   - Retail dashboard tabs are bilingual.
   - Retail module page titles/descriptions translate to Arabic.
   - Dashboard cards, POS, products, invoices, returns, transfers, stocktake, treasury, and reports use Arabic labels when Arabic is selected.
   - Removed old AI/prescription wording from visible translation strings.

4. Converted invoice actions to icons.
   - Invoice list actions now use icon-only buttons for details, edit, cancel invoice, and delete.

5. Removed horizontal scrolling from retail tables.
   - Added responsive table wrapping.
   - Removed `overflow-x-auto` usage inside retail dashboard tables.

Build check:
- `npm run build` completed successfully.
