import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const retailPath = path.join(root, 'src/pages/retail/RetailPages.jsx');
const stylesPath = path.join(root, 'src/styles.css');
const source = fs.readFileSync(retailPath, 'utf8');
const styles = fs.readFileSync(stylesPath, 'utf8');

const checks = [
  ['shared selector handles change events', /function SelectInput[\s\S]*onChange=\{\(event\) => onChange\(event\.target\.value\)\}/],
  ['empty option lists remain visible instead of disabling the field', /!optionCount \? <option value="" disabled>/],
  ['retail pages no longer disable selectors when backend lists are empty', !/disabled=\{!data\./.test(source)],
  ['POS uses the shared warehouse/customer selectors', /export function PosPage[\s\S]*SelectInput label=\{L\('warehouse'\)\}[\s\S]*SelectInput label=\{L\('customer'\)\}/],
  ['Purchases uses the shared warehouse/supplier selectors', /export function PurchasesPage[\s\S]*SelectInput label=\{L\('warehouse'\)\}[\s\S]*SelectInput label=\{L\('supplier'\)\}/],
  ['invoice toolbar uses shared selectors', /Invoices List[\s\S]*<Toolbar[\s\S]*<SelectInput className="w-full xl:max-w-48"/],
  ['selector click styling is present', /\.select-control\s*\{[\s\S]*cursor:\s*pointer/],
];

for (const [label, assertion] of checks) {
  const passed = assertion instanceof RegExp ? assertion.test(label.includes('styling') ? styles : source) : Boolean(assertion);
  if (!passed) {
    console.error(`FAIL: ${label}`);
    process.exit(1);
  }
  console.log(`PASS: ${label}`);
}
