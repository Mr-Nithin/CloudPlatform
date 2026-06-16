const router = require('express').Router();
const { AccessRule } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('Admin'));

router.get('/', async (req, res, next) => {
  try {
    const rules = await AccessRule.findAll({ where: { isActive: true } });
    res.json(rules);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const rule = await AccessRule.create({ ...req.body, createdById: req.user.id });
    res.status(201).json(rule);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await AccessRule.update({ isActive: false }, { where: { id: req.params.id } });
    res.json({ message: 'Rule deactivated' });
  } catch (err) { next(err); }
});

module.exports = router;
