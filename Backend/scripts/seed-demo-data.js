const bcrypt = require('bcryptjs');
const connectDatabase = require('../config/database');
const env = require('../config/env');
const { User, Pharmacy, Drug, InventorySnapshot, Category } = require('../models');

const password = 'Password123';

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

async function upsertUser({ fullName, email, role }) {
  const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);
  return User.findOneAndUpdate(
    { email },
    { $set: { fullName, role, passwordHash, isActive: true } },
    { new: true, upsert: true }
  );
}

async function main() {
  await connectDatabase();

  await upsertUser({ fullName: 'Admin User', email: 'admin@adwety.app', role: 'admin' });
  const pharmacist = await upsertUser({ fullName: 'Demo Pharmacist', email: 'pharmacist@adwety.app', role: 'pharmacist' });
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

  console.log('Demo data seeded successfully.');
  console.log('Patient login: mona@adwety.app / Password123');
  console.log('Pharmacist login: pharmacist@adwety.app / Password123');
  console.log('Admin login: admin@adwety.app / Password123');
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
