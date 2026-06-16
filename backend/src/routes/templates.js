const router = require('express').Router();
const { IacTemplate } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.get('/', requireRole('Admin', 'CloudEngineer'), async (req, res, next) => {
  try {
    const templates = await IacTemplate.findAll({ where: { isActive: true } });
    res.json(templates);
  } catch (err) { next(err); }
});

router.post('/', requireRole('Admin', 'CloudEngineer'), async (req, res, next) => {
  try {
    // Version up on new upload for same resource type
    await IacTemplate.update({ isActive: false }, { where: { resourceType: req.body.resourceType, isActive: true } });
    const latest = await IacTemplate.max('version', { where: { resourceType: req.body.resourceType } });
    const template = await IacTemplate.create({
      ...req.body,
      version: (latest || 0) + 1,
      createdById: req.user.id,
    });
    res.status(201).json(template);
  } catch (err) { next(err); }
});

router.get('/:id', requireRole('Admin', 'CloudEngineer'), async (req, res, next) => {
  try {
    const template = await IacTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (err) { next(err); }
});

router.patch('/:id', requireRole('Admin', 'CloudEngineer'), async (req, res, next) => {
  try {
    const template = await IacTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    const { body, parameters, resourceType, provider, engine } = req.body;
    await template.update({ body, parameters, resourceType, provider, engine });
    res.json(template);
  } catch (err) { next(err); }
});

router.delete('/:id', requireRole('Admin', 'CloudEngineer'), async (req, res, next) => {
  try {
    const template = await IacTemplate.findByPk(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    const { Request } = require('../models');
    const linked = await Request.count({ where: { templateId: template.id } });
    if (linked > 0) {
      return res.status(409).json({ error: `Cannot delete: ${linked} request(s) reference this template.` });
    }
    await template.destroy();
    res.json({ message: 'Template deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
