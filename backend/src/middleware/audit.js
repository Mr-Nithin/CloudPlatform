const { AuditLog } = require('../models');

// Usage: router.post('/', authenticate, auditLog('REQUEST_CREATED', 'Request'), handler)
const auditLog = (action, entity) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = async (body) => {
    if (res.statusCode < 400) {
      try {
        await AuditLog.create({
          userId: req.user?.id,
          action,
          entity,
          entityId: body?.id || body?.data?.id,
          after: body,
          ipAddress: req.ip,
        });
      } catch (e) {
        // Non-fatal — don't block the response
      }
    }
    return originalJson(body);
  };
  next();
};

module.exports = { auditLog };
