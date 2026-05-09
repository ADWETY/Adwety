module.exports = {
  ...require('./schemas'),
  ...require('./auth.controller'),
  ...require('./profile.controller'),
  ...require('./pharmacies.controller'),
  ...require('./medicines.controller'),
  ...require('./search.controller'),
  ...require('./notifications.controller'),
  ...require('./analytics.controller'),
  ...require('./prescription.controller')
};
