const jwt = require('jsonwebtoken');
const env = require('../config/env');

const TOKEN_OPTIONS = {
  algorithm: 'HS256',
  issuer: 'adwety-backend',
  audience: 'adwety-client',
};

function signToken(payload) {
  return jwt.sign(payload, env.jwtSecret, { ...TOKEN_OPTIONS, expiresIn: env.jwtExpiresIn });
}

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret, {
    algorithms: ['HS256'],
    issuer: TOKEN_OPTIONS.issuer,
    audience: TOKEN_OPTIONS.audience,
  });
}

module.exports = { signToken, verifyToken };
