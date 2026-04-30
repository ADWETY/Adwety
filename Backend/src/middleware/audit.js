const AuditLog = require('../../DB/Models/auditlog.model');

function auditAction(action) {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 400) return;
      AuditLog.create({
        actorId: req.authUser?._id || null,
        actorType: req.authMeta?.type || 'unknown',
        actorRole: req.authMeta?.role || req.authUser?.role || 'user',
        action,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        ip: req.ip || req.socket.remoteAddress || '',
      }).catch(() => {});
    });
    next();
  };
}

module.exports = auditAction;
