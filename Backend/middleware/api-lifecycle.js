'use strict';

function setLifecycleHeaders(res, { successor, sunset }) {
  res.setHeader('Deprecation', 'true');
  if (sunset) res.setHeader('Sunset', new Date(sunset).toUTCString());
  if (successor) res.setHeader('Link', `<${successor}>; rel="successor-version"`);
  res.setHeader('Warning', '299 - "Deprecated API route; migrate to the successor endpoint"');
}

function deprecated(options) {
  return (_req, res, next) => {
    setLifecycleHeaders(res, options);
    next();
  };
}

function gone(options) {
  return (_req, res) => {
    setLifecycleHeaders(res, options);
    return res.status(410).json({
      success: false,
      error: 'This API route has been retired',
      code: 'API_ROUTE_RETIRED',
      successor: options.successor || null
    });
  };
}

module.exports = { deprecated, gone, setLifecycleHeaders };
