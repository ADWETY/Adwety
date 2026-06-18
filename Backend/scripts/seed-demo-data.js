const connectDatabase = require('../config/database');
const { User, Pharmacy, Drug, InventorySnapshot, Category, StoreCategory, StoreWarehouse, StoreProduct, StorePerson, StoreInvoice, StoreTreasuryMovement } = require('../models');

function clean(value, fallback = '') {
  const result = String(value ?? '').trim();
  return result || fallback;
}

function seedPassword(name, fallback = 'AdwetyDemo#2026') {
  return clean(process.env[name], fallback);
}

const defaultPassword = seedPassword('SEED_DEFAULT_PASSWORD');

const demoDrugs = [
  { genericName: 'Panadol Extra', brandNames: ['Panadol'], aliases: ['Paracetamol Extra', 'بنادول'], category: 'Pain relief', dosageForm: 'Tablet', strength: '500mg', description: 'Pain reliever and fever reducer.' },
  { genericName: 'Amoxicillin', brandNames: ['Amoxil'], aliases: ['Amoxicillin 500', 'اموكسيسيلين'], category: 'Antibiotic', dosageForm: 'Capsule', strength: '500mg', description: 'Antibiotic used for bacterial infections.' },
  { genericName: 'Insulin Glargine', brandNames: ['Lantus'], aliases: ['Glargine', 'انسولين'], category: 'Diabetes', dosageForm: 'Injection', strength: '100 IU/ml', description: 'Long-acting insulin for diabetes management.' },
  { genericName: 'Lisinopril', brandNames: ['Zestril'], aliases: ['Lisinopril 10', 'ليزينوبريل'], category: 'Hypertension', dosageForm: 'Tablet', strength: '10mg', description: 'Used for hypertension treatment.' },
  { genericName: 'Ventolin', brandNames: ['Salbutamol'], aliases: ['Albuterol', 'فنتولين'], category: 'Respiratory', dosageForm: 'Inhaler', strength: '100 mcg', description: 'Bronchodilator for asthma symptoms.' }
];

const demoPharmacies = [
  { name: 'BlueCare Pharmacy', address: '21 Nile Street, Maadi, Cairo', latitude: 30.0368, longitude: 31.2090, rating: 4.8, phone: '+201000000001', email: 'bluecare@adwety.app' },
  { name: 'Teal Health Pharmacy', address: '14 Road 9, Dokki, Giza', latitude: 30.0399, longitude: 31.2001, rating: 4.6, phone: '+201000000002', email: 'tealhealth@adwety.app' },
  { name: 'CityMed Pharmacy', address: '7 Abbas El Akkad, Nasr City, Cairo', latitude: 30.0535, longitude: 31.3400, rating: 4.5, phone: '+201000000003', email: 'citymed@adwety.app' }
];

const inventory = [
  ['BlueCare Pharmacy', 'Panadol Extra', 46.5, 22],
  ['BlueCare Pharmacy', 'Amoxicillin', 88.0, 6],
  ['BlueCare Pharmacy', 'Insulin Glargine', 312.0, 0],
  ['Teal Health Pharmacy', 'Panadol Extra', 44.0, 9],
  ['Teal Health Pharmacy', 'Lisinopril', 72.5, 15],
  ['Teal Health Pharmacy', 'Ventolin', 95.0, 4],
  ['CityMed Pharmacy', 'Amoxicillin', 90.0, 12],
  ['CityMed Pharmacy', 'Insulin Glargine', 299.0, 3],
  ['CityMed Pharmacy', 'Lisinopril', 68.0, 0]
];

async function upsertUser({ fullName, email, role, password = defaultPassword, mfaPolicyVersion }) {
  const normalizedEmail = clean(email).toLowerCase();
  if (!normalizedEmail) return null;
  const normalizedFullName = clean(fullName, normalizedEmail.split('@')[0]);
  const { hashPassword } = require('../services/password.service');
  const passwordHash = await hashPassword(password, { email: normalizedEmail, fullName: normalizedFullName });
  const policyVersion = mfaPolicyVersion ?? (role === 'admin' ? 2 : 1);
  return User.findOneAndUpdate(
    { email: normalizedEmail },
    {
      $set: {
        fullName: normalizedFullName,
        role,
        passwordHash,
        passwordPolicyVersion: 2,
        isActive: true,
        mfaPolicyVersion: policyVersion
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

function configuredDashboardUsers() {
  return [
    {
      fullName: clean(process.env.SEED_OWNER_NAME, 'System Owner'),
      email: process.env.SEED_OWNER_EMAIL,
      password: seedPassword('SEED_OWNER_PASSWORD'),
      role: 'admin',
      mfaPolicyVersion: Number(process.env.SEED_ADMIN_MFA_POLICY_VERSION || 2)
    },
    {
      fullName: clean(process.env.SEED_SUPER_ADMIN_NAME, 'Super Admin'),
      email: process.env.SEED_SUPER_ADMIN_EMAIL,
      password: seedPassword('SEED_SUPER_ADMIN_PASSWORD'),
      role: 'admin',
      mfaPolicyVersion: Number(process.env.SEED_ADMIN_MFA_POLICY_VERSION || 2)
    },
    {
      fullName: clean(process.env.SEED_PHARMACY_ADMIN_NAME, 'Main Pharmacist'),
      email: process.env.SEED_PHARMACY_ADMIN_EMAIL,
      password: seedPassword('SEED_PHARMACY_ADMIN_PASSWORD'),
      role: 'pharmacist',
      mfaPolicyVersion: 1
    },
    {
      fullName: clean(process.env.SEED_SUPPORT_ADMIN_NAME, 'Support Administrator'),
      email: process.env.SEED_SUPPORT_ADMIN_EMAIL,
      password: seedPassword('SEED_SUPPORT_ADMIN_PASSWORD'),
      role: 'admin',
      mfaPolicyVersion: Number(process.env.SEED_ADMIN_MFA_POLICY_VERSION || 2)
    }
  ].filter((item, index, rows) => {
    const email = clean(item.email).toLowerCase();
    if (!email) return false;
    return rows.findIndex((row) => clean(row.email).toLowerCase() === email) === index;
  });
}

async function seedRetailDemo(admin, pharmacyId) {
  const categories = [
    { name: 'Beverages', description: 'Drinks and juices', status: 'active' },
    { name: 'Groceries', description: 'Basic grocery items', status: 'active' },
    { name: 'Cleaning', description: 'Household cleaning products', status: 'active' }
  ];
  const warehouses = [
    { name: 'Main Warehouse', code: 'MAIN', address: 'Head office storage', manager: 'Warehouse Manager', phone: '+20 100 000 1111', status: 'active' },
    { name: 'Branch Store', code: 'BR-01', address: 'Retail branch stock room', manager: 'Branch Manager', phone: '+20 100 000 2222', status: 'active' }
  ];
  const customers = [
    { type: 'customer', name: 'Cash Customer', phone: '', email: '', address: '', openingBalance: 0, balanceType: 'debit', status: 'active' },
    { type: 'customer', name: 'Ahmed Market', phone: '+20 101 123 4567', email: 'ahmed.market@example.com', address: 'Cairo', openingBalance: 2500, balanceType: 'debit', status: 'active' }
  ];
  const suppliers = [
    { type: 'supplier', name: 'Delta Supplies', phone: '+20 100 111 7777', email: 'delta@example.com', address: 'Menoufia', openingBalance: 5400, balanceType: 'credit', status: 'active' },
    { type: 'supplier', name: 'Cairo Wholesale', phone: '+20 111 222 8888', email: 'wholesale@example.com', address: 'Cairo', openingBalance: 1200, balanceType: 'debit', status: 'active' }
  ];

  for (const category of categories) await StoreCategory.findOneAndUpdate({ pharmacyId, name: category.name }, { $set: { ...category, pharmacyId } }, { new: true, upsert: true, setDefaultsOnInsert: true });
  for (const warehouse of warehouses) await StoreWarehouse.findOneAndUpdate({ pharmacyId, code: warehouse.code }, { $set: { ...warehouse, pharmacyId } }, { new: true, upsert: true, setDefaultsOnInsert: true });
  for (const person of [...customers, ...suppliers]) await StorePerson.findOneAndUpdate({ pharmacyId, type: person.type, name: person.name }, { $set: { ...person, pharmacyId } }, { new: true, upsert: true, setDefaultsOnInsert: true });

  const cats = await StoreCategory.find({ pharmacyId });
  const whs = await StoreWarehouse.find({ pharmacyId });
  const people = await StorePerson.find({ pharmacyId });
  const categoryByName = new Map(cats.map((c) => [c.name, c]));
  const warehouseByCode = new Map(whs.map((w) => [w.code, w]));
  const personByName = new Map(people.map((p) => [p.name, p]));
  const main = warehouseByCode.get('MAIN');
  const branch = warehouseByCode.get('BR-01');

  const products = [
    { code: 'P-1001', barcode: '6221001001', name: 'Mineral Water 1.5L', categoryId: categoryByName.get('Beverages')?._id, unit: 'Bottle', unitFactor: 1, purchasePrice: 6, salePrice: 10, minStock: 25, stock: { [main._id]: 180, [branch._id]: 65 }, units: [{ name: 'Bottle', factor: 1, salePrice: 10 }, { name: 'Pack 12', factor: 12, salePrice: 115 }], status: 'active' },
    { code: 'P-1002', barcode: '6221001002', name: 'Orange Juice 1L', categoryId: categoryByName.get('Beverages')?._id, unit: 'Carton', unitFactor: 1, purchasePrice: 22, salePrice: 35, minStock: 20, stock: { [main._id]: 90, [branch._id]: 22 }, units: [{ name: 'Carton', factor: 1, salePrice: 35 }, { name: 'Box 6', factor: 6, salePrice: 200 }], status: 'active' },
    { code: 'P-2001', barcode: '6222001001', name: 'Rice 5kg', categoryId: categoryByName.get('Groceries')?._id, unit: 'Bag', unitFactor: 1, purchasePrice: 175, salePrice: 215, minStock: 15, stock: { [main._id]: 42, [branch._id]: 12 }, units: [{ name: 'Bag', factor: 1, salePrice: 215 }], status: 'active' },
    { code: 'P-3001', barcode: '6223001001', name: 'Dish Soap 750ml', categoryId: categoryByName.get('Cleaning')?._id, unit: 'Piece', unitFactor: 1, purchasePrice: 34, salePrice: 52, minStock: 18, stock: { [main._id]: 44, [branch._id]: 9 }, units: [{ name: 'Piece', factor: 1, salePrice: 52 }], status: 'active' }
  ];
  for (const product of products) await StoreProduct.findOneAndUpdate({ pharmacyId, code: product.code }, { $set: { ...product, pharmacyId } }, { new: true, upsert: true, setDefaultsOnInsert: true });

  const productByCode = new Map((await StoreProduct.find({ pharmacyId })).map((p) => [p.code, p]));
  const saleNumber = 'SAL-0001';
  const saleItems = [
    { productId: productByCode.get('P-1001')._id, name: 'Mineral Water 1.5L', code: 'P-1001', barcode: '6221001001', unit: 'Bottle', unitFactor: 1, qty: 20, price: 10, purchasePrice: 6, discount: 0 },
    { productId: productByCode.get('P-2001')._id, name: 'Rice 5kg', code: 'P-2001', barcode: '6222001001', unit: 'Bag', unitFactor: 1, qty: 3, price: 215, purchasePrice: 175, discount: 0 }
  ];
  const saleSubtotal = saleItems.reduce((sum, item) => sum + item.qty * item.price - item.discount, 0);
  const saleTotal = saleSubtotal - 40;
  const salePaid = 900;
  await StoreInvoice.findOneAndUpdate(
    { pharmacyId, number: saleNumber },
    { $set: { pharmacyId, kind: 'sale', number: saleNumber, date: new Date(), warehouseId: branch._id, customerId: personByName.get('Ahmed Market')?._id, paymentMethod: 'cash', discount: 40, paid: salePaid, notes: 'Initial demo invoice', items: saleItems, subtotal: saleSubtotal, total: saleTotal, due: Math.max(0, saleTotal - salePaid), profit: saleItems.reduce((sum, item) => sum + (item.qty * item.price - item.discount) - item.qty * item.purchasePrice, 0) - 40, status: 'active', createdBy: admin?._id } },
    { new: true, upsert: true }
  );
  await StoreTreasuryMovement.findOneAndUpdate(
    { pharmacyId, sourceType: 'opening', category: 'Opening Balance' },
    { $set: { pharmacyId, date: new Date(), type: 'income', category: 'Opening Balance', amount: 15000, description: 'Demo opening balance', warehouseId: main._id, sourceType: 'opening', createdBy: admin?._id } },
    { new: true, upsert: true }
  );
}

async function main() {
  await connectDatabase();

  const configuredUsers = [];
  for (const account of configuredDashboardUsers()) {
    configuredUsers.push(await upsertUser(account));
  }

  const admin = configuredUsers.find((user) => user?.role === 'admin')
    || await upsertUser({ fullName: 'Admin User', email: 'admin@adwety.app', role: 'admin' });
  const pharmacist = configuredUsers.find((user) => user?.role === 'pharmacist')
    || await upsertUser({ fullName: 'Demo Pharmacist', email: 'pharmacist@adwety.app', role: 'pharmacist' });

  // Keep the old demo accounts available when the configured .env emails are different.
  await upsertUser({ fullName: 'Admin User', email: 'admin@adwety.app', role: 'admin' });
  await upsertUser({ fullName: 'Demo Pharmacist', email: 'pharmacist@adwety.app', role: 'pharmacist' });
  await upsertUser({ fullName: 'Mona Ahmed', email: 'mona@adwety.app', role: 'patient' });

  for (const drug of demoDrugs) {
    await Category.findOneAndUpdate({ name: drug.category }, { $setOnInsert: { description: '' } }, { upsert: true });
    await Drug.findOneAndUpdate(
      { genericName: drug.genericName, strength: drug.strength, dosageForm: drug.dosageForm },
      { $set: { ...drug, isActive: true } },
      { new: true, upsert: true }
    );
  }

  for (const pharmacy of demoPharmacies) {
    await Pharmacy.findOneAndUpdate(
      { name: pharmacy.name },
      { $set: { ...pharmacy, status: 'active', ownerId: pharmacist._id } },
      { new: true, upsert: true, runValidators: true }
    );
  }

  const pharmacies = await Pharmacy.find({ name: { $in: demoPharmacies.map((p) => p.name) } });
  const drugs = await Drug.find({ genericName: { $in: demoDrugs.map((d) => d.genericName) } });
  const pharmacyByName = new Map(pharmacies.map((p) => [p.name, p]));
  const drugByName = new Map(drugs.map((d) => [d.genericName, d]));

  for (const [pharmacyName, drugName, price, quantity] of inventory) {
    const pharmacy = pharmacyByName.get(pharmacyName);
    const drug = drugByName.get(drugName);
    if (!pharmacy || !drug) continue;
    await InventorySnapshot.findOneAndUpdate(
      { pharmacyId: pharmacy._id, drugId: drug._id },
      { $set: { price, quantity, updatedAt: new Date(), source: 'demo_seed' } },
      { new: true, upsert: true }
    );
  }

  const primaryPharmacy = pharmacyByName.get('BlueCare Pharmacy') || pharmacies[0];
  if (primaryPharmacy) {
    pharmacist.pharmacyId = primaryPharmacy._id;
    await pharmacist.save();
    await seedRetailDemo(admin, primaryPharmacy._id);
  }

  console.log('Demo data seeded successfully.');
  console.log('Dashboard reset-password emails will be sent only for active admin/pharmacist users created in the users collection.');
  for (const account of configuredDashboardUsers()) {
    console.log(`${account.role} user seeded: ${clean(account.email).toLowerCase()}`);
  }
  console.log('Patient login: mona@adwety.app / AdwetyDemo#2026');
  console.log('Pharmacist login: pharmacist@adwety.app / AdwetyDemo#2026');
  console.log('Admin login: admin@adwety.app / AdwetyDemo#2026');
  await mongooseDisconnect();
}

async function mongooseDisconnect() {
  const mongoose = require('mongoose');
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongooseDisconnect();
  process.exit(1);
});
