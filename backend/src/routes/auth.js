const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
router.post('/register', [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  body('role').isIn(['Admin', 'Manager', 'Developer', 'CloudEngineer']),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const user = await User.create(req.body);
    res.status(201).json({ token: signToken(user), user });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const user = await User.findOne({ where: { email: req.body.email } });
    if (!user || !(await user.validatePassword(req.body.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.status === 'Inactive') {
      return res.status(403).json({ error: 'Account is inactive' });
    }
    res.json({ token: signToken(user), user });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => res.json(req.user));

// PATCH /api/auth/change-password — authenticated user sets a new password
router.patch('/change-password', authenticate, [
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.password = req.body.newPassword;
    user.mustChangePassword = false;
    await user.save();

    res.json({ message: 'Password updated successfully', user });
  } catch (err) { next(err); }
});

module.exports = router;
