const router = require('express').Router();
const { Team, User } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');
const namingService = require('../services/namingService');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const teams = await Team.findAll({
      include: [
        { model: User, as: 'manager', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'name', 'email', 'role'] },
      ],
    });
    res.json(teams);
  } catch (err) { next(err); }
});

router.post('/', requireRole('Admin'), async (req, res, next) => {
  try {
    const { name, managerId } = req.body;
    const validatedName = await namingService.validate('Team', name);
    const team = await Team.create({ name: validatedName, managerId });
    res.status(201).json(team);
  } catch (err) { next(err); }
});

router.patch('/:id', requireRole('Admin'), async (req, res, next) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    await team.update(req.body);
    res.json(team);
  } catch (err) { next(err); }
});

router.delete('/:id', requireRole('Admin'), async (req, res, next) => {
  try {
    const team = await Team.findByPk(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    await team.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
