const router = require('express').Router();
const { User, Team } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const notificationService = require('../services/notificationService');

// All routes require auth
router.use(authenticate);

// POST /api/users — Admin creates a new user and emails them a temp password
router.post('/', requireRole('Admin'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').isIn(['Admin', 'Manager', 'Developer', 'CloudEngineer']).withMessage('Invalid role'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const tempPassword = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
      password: tempPassword,
      mustChangePassword: true,
    });

    await notificationService.welcomeUser(user, tempPassword);

    res.status(201).json(user);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    next(err);
  }
});

// GET /api/users — Admin only
router.get('/', requireRole('Admin'), async (req, res, next) => {
  try {
    const users = await User.findAll({ include: [{ model: Team, as: 'teams', attributes: ['id', 'name'] }] });
    res.json(users);
  } catch (err) { next(err); }
});

// GET /api/users/:id
router.get('/:id', requireRole('Admin'), async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, { include: [{ model: Team, as: 'teams' }] });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
});

// PATCH /api/users/:id
router.patch('/:id', requireRole('Admin'), async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const allowed = ['name', 'role', 'status'];
    allowed.forEach((f) => { if (req.body[f] !== undefined) user[f] = req.body[f]; });
    await user.save();
    res.json(user);
  } catch (err) { next(err); }
});

// PATCH /api/users/:id/teams — set team memberships
router.patch('/:id/teams', requireRole('Admin'), async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.setTeams(req.body.teamIds || []);
    res.json({ message: 'Teams updated' });
  } catch (err) { next(err); }
});

module.exports = router;
