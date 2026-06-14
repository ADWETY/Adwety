const fs = require('fs');

function readSecret(path) {
  return fs.readFileSync(path, 'utf8').trim();
}

const appUser = readSecret('/run/secrets/mongo_app_username');
const appPassword = readSecret('/run/secrets/mongo_app_password');
const appDbName = process.env.MONGO_INITDB_DATABASE || 'adwety';
const appDb = db.getSiblingDB(appDbName);

if (!appDb.getUser(appUser)) {
  appDb.createUser({
    user: appUser,
    pwd: appPassword,
    roles: [{ role: 'readWrite', db: appDbName }]
  });
}
