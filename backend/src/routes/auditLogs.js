const router = require('express').Router();
const { AuditLog, User } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('Admin', 'CloudEngineer'));

router.get('/', async (req, res, next) => {
  try {
    const { entity, entityId, limit = 100, offset = 0 } = req.query;
    const where = {};
    if (entity) where.entity = entity;
    if (entityId) where.entityId = entityId;

    const logs = await AuditLog.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    res.json(logs);
  } catch (err) { next(err); }
});

module.exports = router;
