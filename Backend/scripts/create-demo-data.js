// Safe hosted-database seeding script.
// It creates demo inventory only when empty and creates missing env-defined accounts.
process.env.SEED_FORCE_RESET = process.env.SEED_FORCE_RESET || 'false';
require('./seed');
