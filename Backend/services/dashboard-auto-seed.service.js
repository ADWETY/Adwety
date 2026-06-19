'use strict';

const { User, Pharmacy } = require('../models');
const { hashPassword } = require('./password.service');

function clean(value, fallback = '') {
  const result = String(value ?? '').trim();
  return result || fallback;
}

function number(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function seedPassword(name) {
  return clean(process.env[name], clean(process.env.SEED_DEFAULT_PASSWORD, 'AdwetyDemo#2026'));
}

function uniqueDashboardAccounts(accounts) {
  const seen = new Set();
  return accounts
    .map((account) => ({ ...account, email: clean(account.email).toLowerCase() }))
    .filter((account) => {
      if (!account.email || seen.has(account.email)) return false;
      seen.add(account.email);
      return true;
    });
}

function dashboardAccountsFromEnv() {
  const adminMfaPolicyVersion = number(process.env.SEED_ADMIN_MFA_POLICY_VERSION, 1);
  return uniqueDashboardAccounts([
    {
      fullName: clean(process.env.SEED_OWNER_NAME, 'System Owner'),
      email: process.env.SEED_OWNER_EMAIL,
      password: seedPassword('SEED_OWNER_PASSWORD'),
      role: 'admin',
      mfaPolicyVersion: adminMfaPolicyVersion
    },
    {
      fullName: clean(process.env.SEED_SUPER_ADMIN_NAME, 'Super Admin'),
      email: process.env.SEED_SUPER_ADMIN_EMAIL,
      password: seedPassword('SEED_SUPER_ADMIN_PASSWORD'),
      role: 'admin',
      mfaPolicyVersion: adminMfaPolicyVersion
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
      mfaPolicyVersion: adminMfaPolicyVersion
    }
  ]);
}

async function upsertDashboardUser(account) {
  const email = clean(account.email).toLowerCase();
  const fullName = clean(account.fullName, email.split('@')[0]);
  const role = account.role === 'pharmacist' ? 'pharmacist' : 'admin';
  const passwordHash = await hashPassword(account.password, { email, fullName });

  return User.findOneAndUpdate(
    { email },
    {
      $set: {
        fullName,
        email,
        role,
        passwordHash,
        passwordPolicyVersion: 2,
        isActive: true,
        mfaPolicyVersion: number(account.mfaPolicyVersion, 1),
        mfaEnabled: false
      },
      $setOnInsert: {
        tokenVersion: 0,
        phoneNumber: ''
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

function envPharmacyDefaults(user, index = 0) {
  const suffix = index > 0 ? ` ${index + 1}` : '';
  return {
    name: clean(process.env.SEED_PHARMACY_NAME, `${user.fullName || 'Main'} Pharmacy${suffix}`),
    address: clean(process.env.SEED_PHARMACY_ADDRESS, 'Cairo, Egypt'),
    phone: clean(process.env.SEED_PHARMACY_PHONE, user.phoneNumber || ''),
    email: clean(process.env.SEED_PHARMACY_EMAIL, user.email),
    latitude: number(process.env.SEED_PHARMACY_LATITUDE, 30.0444),
    longitude: number(process.env.SEED_PHARMACY_LONGITUDE, 31.2357),
    rating: number(process.env.SEED_PHARMACY_RATING, 0)
  };
}

async function ensureActivePharmacyForPharmacist(user, index = 0) {
  if (!user || user.role !== 'pharmacist') return null;

  let pharmacy = null;
  if (user.pharmacyId) {
    pharmacy = await Pharmacy.findOneAndUpdate(
      { _id: user.pharmacyId },
      { $set: { status: 'active', ownerId: user._id } },
      { new: true, runValidators: true }
    );
  }

  if (!pharmacy) {
    const defaults = envPharmacyDefaults(user, index);
    pharmacy = await Pharmacy.findOneAndUpdate(
      { ownerId: user._id },
      {
        $set: {
          ...defaults,
          ownerId: user._id,
          status: 'active'
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );
  }

  if (!user.pharmacyId || String(user.pharmacyId) !== String(pharmacy._id)) {
    await User.updateOne(
      { _id: user._id },
      { $set: { pharmacyId: pharmacy._id, role: 'pharmacist', isActive: true } }
    );
    user.pharmacyId = pharmacy._id;
  }

  return pharmacy;
}

async function ensureEnvUsersWhenUsersCollectionEmpty() {
  const anyUser = await User.exists({});
  if (anyUser) {
    return { seeded: false, reason: 'users_collection_not_empty', users: [] };
  }

  const accounts = dashboardAccountsFromEnv();
  if (!accounts.length) {
    console.warn('[auto-seed] users collection is empty, but no SEED_*_EMAIL values were found in .env.');
    return { seeded: false, reason: 'no_env_dashboard_accounts', users: [] };
  }

  const users = [];
  for (const account of accounts) {
    users.push(await upsertDashboardUser(account));
  }

  const pharmacies = [];
  const pharmacistUsers = users.filter((user) => user?.role === 'pharmacist');
  for (let index = 0; index < pharmacistUsers.length; index += 1) {
    pharmacies.push(await ensureActivePharmacyForPharmacist(pharmacistUsers[index], index));
  }

  console.log(`[auto-seed] users collection was empty. Seeded ${users.length} dashboard user(s) from .env.`);
  for (const user of users) {
    console.log(`[auto-seed] ${user.role} user ready: ${user.email}`);
  }
  for (const pharmacy of pharmacies.filter(Boolean)) {
    console.log(`[auto-seed] active pharmacy linked: ${pharmacy.name} (${pharmacy._id})`);
  }

  return { seeded: true, reason: 'users_collection_empty', users, pharmacies };
}

module.exports = {
  ensureEnvUsersWhenUsersCollectionEmpty,
  ensureActivePharmacyForPharmacist,
  dashboardAccountsFromEnv
};
