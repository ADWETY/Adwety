const jwt = require('jsonwebtoken');
const env = require('../config/env');
function signToken(user) { return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn, issuer: 'adwety-backend', audience: 'adwety-client' }); }
function verifyToken(token) { return jwt.verify(token, env.jwtSecret, { issuer: 'adwety-backend', audience: 'adwety-client' }); }
module.exports = { signToken, verifyToken };
