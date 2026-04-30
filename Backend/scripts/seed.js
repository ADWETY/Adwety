const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDatabase = require('../DB/connection');
const env = require('../src/config/env');
const User = require('../DB/Models/user.model');
const Admin = require('../DB/Models/admin.model');
const Category = require('../DB/Models/category.model');
const Drug = require('../DB/Models/drug.model');
const Pharmacy = require('../DB/Models/pharmacy.model');
const Inventory = require('../DB/Models/inventory.model');
const Notification = require('../DB/Models/notification.model');
const OtpChallenge = require('../DB/Models/otp.model');
const ApprovalRequest = require('../DB/Models/pharmacyrequest.model');

const requiredPasswordMessage = `Missing seed password env variables.
Set these in Backend/.env before running seed:
- SEED_OWNER_PASSWORD
- SEED_SUPER_ADMIN_PASSWORD
- SEED_PHARMACY_ADMIN_PASSWORD
- SEED_SUPPORT_ADMIN_PASSWORD
- SEED_DEMO_USER_PASSWORD`;

function requireSeedEnv() {
  const missing = [];
  const required = [
    'seedOwnerEmail', 'seedOwnerPassword',
    'seedSuperAdminEmail', 'seedSuperAdminPassword',
    'seedPharmacyAdminEmail', 'seedPharmacyAdminPassword',
    'seedSupportAdminEmail', 'seedSupportAdminPassword',
    'seedDemoUserEmail', 'seedDemoUserPassword',
  ];
  for (const key of required) if (!env[key]) missing.push(key);
  if (missing.length) throw new Error(`${requiredPasswordMessage}\nMissing keys: ${missing.join(', ')}`);
}

async function clearCollections() {
  await Promise.all([
    User.deleteMany({}), Admin.deleteMany({}), Category.deleteMany({}), Drug.deleteMany({}), Pharmacy.deleteMany({}), Inventory.deleteMany({}), Notification.deleteMany({}), OtpChallenge.deleteMany({}), ApprovalRequest.deleteMany({}),
  ]);
}

async function isDemoDataEmpty() {
  const [categories, drugs, pharmacies, inventory] = await Promise.all([
    Category.countDocuments(), Drug.countDocuments(), Pharmacy.countDocuments(), Inventory.countDocuments(),
  ]);
  return categories === 0 && drugs === 0 && pharmacies === 0 && inventory === 0;
}

async function createDemoInventoryIfEmpty() {
  if (!(await isDemoDataEmpty())) {
    console.log('Inventory seed skipped: database already has medicines/pharmacies data.');
    return null;
  }

  const [pain, antibiotics, diabetes, bloodPressure, respiratory] = await Category.insertMany([
    { name: 'Pain Relief', description: 'Pain relievers and fever reducers' },
    { name: 'Antibiotics', description: 'Anti bacterial medicines' },
    { name: 'Diabetes', description: 'Blood sugar management' },
    { name: 'Blood Pressure', description: 'Hypertension treatment' },
    { name: 'Respiratory', description: 'Asthma and respiratory support' },
  ]);

  const drugs = await Drug.insertMany([
    { categoryId: pain._id, name: 'Panadol Extra', strength: '500mg', form: 'Tablet', description: 'Pain reliever and fever reducer.', imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80' },
    { categoryId: antibiotics._id, name: 'Amoxicillin', strength: '500mg', form: 'Capsule', description: 'Antibiotic used for bacterial infections.', imageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&q=80' },
    { categoryId: diabetes._id, name: 'Insulin Glargine', strength: '100 IU/ml', form: 'Injection', description: 'Long-acting insulin for diabetes management.', imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600&q=80' },
    { categoryId: bloodPressure._id, name: 'Lisinopril', strength: '10mg', form: 'Tablet', description: 'Used for hypertension treatment.', imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80' },
    { categoryId: respiratory._id, name: 'Ventolin', strength: '100 mcg', form: 'Inhaler', description: 'Bronchodilator for asthma symptoms.', imageUrl: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=600&q=80' },
  ]);

  const pharmacies = await Pharmacy.insertMany([
    { name: 'BlueCare Pharmacy', address: '21 Nile Street, Maadi, Cairo', phone: '01010001000', email: 'bluecare@adwety.app', workingHours: 'Daily 9 AM - 11 PM', latitude: 30.0368, longitude: 31.2090, rating: 4.8, imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&q=80', status: 'active', isFeatured: true },
    { name: 'Teal Health Pharmacy', address: '14 Road 9, Dokki, Giza', phone: '01020002000', email: 'teal@adwety.app', workingHours: 'Daily 24 hours', latitude: 30.0399, longitude: 31.2001, rating: 4.6, imageUrl: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=600&q=80', status: 'active', isFeatured: true },
    { name: 'CityMed Pharmacy', address: '7 Abbas El Akkad, Nasr City, Cairo', phone: '01030003000', email: 'citymed@adwety.app', workingHours: 'Daily 10 AM - 12 AM', latitude: 30.0535, longitude: 31.3400, rating: 4.5, imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&q=80', status: 'active', isFeatured: false },
  ]);

  await Inventory.insertMany([
    { pharmacyId: pharmacies[0]._id, drugId: drugs[0]._id, price: 46.5, quantity: 22 },
    { pharmacyId: pharmacies[0]._id, drugId: drugs[1]._id, price: 88.0, quantity: 6 },
    { pharmacyId: pharmacies[0]._id, drugId: drugs[2]._id, price: 312.0, quantity: 0 },
    { pharmacyId: pharmacies[1]._id, drugId: drugs[0]._id, price: 44.0, quantity: 9 },
    { pharmacyId: pharmacies[1]._id, drugId: drugs[3]._id, price: 72.5, quantity: 15 },
    { pharmacyId: pharmacies[1]._id, drugId: drugs[4]._id, price: 95.0, quantity: 4 },
    { pharmacyId: pharmacies[2]._id, drugId: drugs[1]._id, price: 90.0, quantity: 12 },
    { pharmacyId: pharmacies[2]._id, drugId: drugs[2]._id, price: 299.0, quantity: 3 },
    { pharmacyId: pharmacies[2]._id, drugId: drugs[3]._id, price: 68.0, quantity: 0 },
  ]);

  console.log('Inventory demo data created because database was empty.');
  return { drugs, pharmacies };
}

async function upsertAdmin({ fullName, email, password, role, phoneNumber = '', pharmacyId = null }) {
  const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);
  const existing = await Admin.findOne({ email });
  if (existing) {
    existing.role = role;
    existing.isActive = true;
    existing.isEmailVerified = true;
    existing.approvalStatus = 'approved';
    existing.approvedAt = existing.approvedAt || new Date();
    await existing.save();
    console.log('Admin exists and was approved: ' + email + ' (' + role + ')');
    return existing;
  }
  const admin = await Admin.create({ fullName, email, passwordHash, role, phoneNumber, pharmacyId, isActive: true, isEmailVerified: true, approvalStatus: 'approved', approvedAt: new Date() });
  console.log(`Admin created: ${email} (${role})`);
  return admin;
}

async function upsertUser({ fullName, email, password, phoneNumber = '' }) {
  const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`User exists: ${email}`);
    return existing;
  }
  const user = await User.create({ fullName, email, passwordHash, phoneNumber, isActive: true, isEmailVerified: true, isPhoneVerified: Boolean(phoneNumber) });
  console.log(`User created: ${email}`);
  return user;
}

async function createAccountsFromEnv() {
  const user = await upsertUser({ fullName: 'Mona Ahmed', email: env.seedDemoUserEmail, password: env.seedDemoUserPassword, phoneNumber: '01000000000' });
  await upsertAdmin({ fullName: 'System Owner', email: env.seedOwnerEmail, password: env.seedOwnerPassword, role: 'owner', phoneNumber: '01099999999' });
  await upsertAdmin({ fullName: 'Super Admin', email: env.seedSuperAdminEmail, password: env.seedSuperAdminPassword, role: 'super_admin', phoneNumber: '01011111111' });
  await upsertAdmin({ fullName: 'BlueCare Manager', email: env.seedPharmacyAdminEmail, password: env.seedPharmacyAdminPassword, role: 'pharmacy_admin', phoneNumber: '01022222222' });
  await upsertAdmin({ fullName: 'Support Admin', email: env.seedSupportAdminEmail, password: env.seedSupportAdminPassword, role: 'support_admin', phoneNumber: '01033333333' });

  const notificationCount = await Notification.countDocuments({ userId: user._id });
  if (notificationCount === 0) {
    await Notification.insertMany([
      { userId: user._id, type: 'stock_alert', title: 'Panadol Extra available', message: 'A nearby pharmacy has Panadol Extra in stock now.', isRead: false },
      { userId: user._id, type: 'prescription', title: 'Prescription processed', message: 'Your prescription was scanned successfully.', isRead: true },
    ]);
    console.log('Demo notifications created.');
  }
}

async function seed() {
  requireSeedEnv();
  await connectDatabase();

  if (env.seedForceReset) {
    console.log('SEED_FORCE_RESET=true, clearing seed collections first...');
    await clearCollections();
  }

  await createDemoInventoryIfEmpty();
  await createAccountsFromEnv();

  console.log('Seed completed safely. Passwords were read from environment variables only.');
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(async (error) => {
  console.error(error.message || error);
  try { await mongoose.connection.close(); } catch (_) {}
  process.exit(1);
});
