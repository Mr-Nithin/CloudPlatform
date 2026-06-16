const router = require('express').Router();
const { Resource, Request, Account } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    let where = {};
    if (req.user.role === 'Developer') {
      // Only resources from own requests
      const myRequests = await Request.findAll({ where: { requestedById: req.user.id }, attributes: ['id'] });
      where.requestId = myRequests.map((r) => r.id);
    }
    const resources = await Resource.findAll({
      where,
      include: [{ model: Account, as: 'account', attributes: ['id', 'name', 'alias', 'provider'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(resources);
  } catch (err) { next(err); }
});

module.exports = router;
