const router = require('express').Router();
const { Account, Project, Resource } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const accounts = await Account.findAll({ where: { status: 'Active' } });
    res.json(accounts);
  } catch (err) { next(err); }
});

router.post('/', requireRole('Admin'), async (req, res, next) => {
  try {
    const body = { ...req.body };
    // Derive a unique system name from alias or accountId if not supplied
    if (!body.name) body.name = (body.alias || body.accountId).toLowerCase().replace(/\s+/g, '-');
    const account = await Account.create(body);
    res.status(201).json(account);
  } catch (err) { next(err); }
});

router.patch('/:id', requireRole('Admin'), async (req, res, next) => {
  try {
    const account = await Account.findByPk(req.params.id);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    const body = { ...req.body };
    if (!body.name) body.name = (body.alias || body.accountId || account.name).toLowerCase().replace(/\s+/g, '-');
    await account.update(body);
    res.json(account);
  } catch (err) { next(err); }
});

router.delete('/:id', requireRole('Admin'), async (req, res, next) => {
  try {
    const account = await Account.findByPk(req.params.id);
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const linkedProjects = await Project.count({ where: { accountId: account.id } });
    if (linkedProjects > 0) {
      return res.status(409).json({ error: `Cannot delete: ${linkedProjects} project(s) are linked to this account. Remove them first.` });
    }

    const linkedResources = await Resource.count({ where: { accountId: account.id } });
    if (linkedResources > 0) {
      return res.status(409).json({ error: `Cannot delete: ${linkedResources} provisioned resource(s) are linked to this account.` });
    }

    await account.destroy();
    res.json({ message: 'Account deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
