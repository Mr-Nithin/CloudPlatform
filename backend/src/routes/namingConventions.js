const router = require('express').Router();
const { NamingConvention } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const conventions = await NamingConvention.findAll({ where: { isActive: true } });
    res.json(conventions);
  } catch (err) { next(err); }
});

router.post('/', requireRole('Admin'), async (req, res, next) => {
  try {
    // Deactivate previous version for this entity type
    await NamingConvention.update(
      { isActive: false },
      { where: { entityType: req.body.entityType, isActive: true } }
    );
    const latest = await NamingConvention.max('version', { where: { entityType: req.body.entityType } });
    const convention = await NamingConvention.create({
      ...req.body,
      version: (latest || 0) + 1,
      createdById: req.user.id,
    });
    res.status(201).json(convention);
  } catch (err) { next(err); }
});

// GET history for an entity type
router.get('/:entityType/history', requireRole('Admin'), async (req, res, next) => {
  try {
    const history = await NamingConvention.findAll({
      where: { entityType: req.params.entityType },
      order: [['version', 'DESC']],
    });
    res.json(history);
  } catch (err) { next(err); }
});

module.exports = router;
