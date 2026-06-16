const router = require('express').Router();
const { Request, User, Project, Account, Resource } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');
const provisioningService = require('../services/provisioningService');
const notificationService = require('../services/notificationService');
const { auditLog } = require('../middleware/audit');

router.use(authenticate);

// GET /api/requests — filtered by role
router.get('/', async (req, res, next) => {
  try {
    let where = {};
    if (req.user.role === 'Developer') {
      where.requestedById = req.user.id;
    } else if (req.user.role === 'Manager') {
      // Managers see requests for projects they are members of
      const myProjects = await req.user.getProjects({ attributes: ['id'] });
      where.projectId = myProjects.map((p) => p.id);
    }

    const reqs = await Request.findAll({
      where,
      include: [
        { model: User, as: 'requestedBy', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'approvedBy', attributes: ['id', 'name', 'email'] },
        { model: Project, as: 'project', attributes: ['id', 'name', 'environment', 'region'],
          include: [{ model: Account, as: 'account', attributes: ['id', 'name', 'alias', 'provider'] }] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(reqs);
  } catch (err) { next(err); }
});

// GET /api/requests/:id
router.get('/:id', async (req, res, next) => {
  try {
    const request = await Request.findByPk(req.params.id, {
      include: [
        { model: User, as: 'requestedBy', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'approvedBy', attributes: ['id', 'name', 'email'] },
        { model: Project, as: 'project',
          include: [{ model: Account, as: 'account' }] },
      ],
    });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json(request);
  } catch (err) { next(err); }
});

// PATCH /api/requests/:id/approve
router.patch(
  '/:id/approve',
  requireRole('Manager', 'CloudEngineer', 'Admin'),
  auditLog('REQUEST_APPROVED', 'Request'),
  async (req, res, next) => {
    try {
      const request = await Request.findByPk(req.params.id, {
        include: [
          { model: User, as: 'requestedBy' },
          { model: Project, as: 'project', include: [{ model: Account, as: 'account' }] },
        ],
      });
      if (!request) return res.status(404).json({ error: 'Request not found' });
      if (request.status !== 'PendingApproval') {
        return res.status(400).json({ error: `Cannot approve a request in status: ${request.status}` });
      }

      await request.update({ status: 'Approved', approvedById: req.user.id, approvedAt: new Date() });

      provisioningService.provision(request).catch(console.error);
      await notificationService.requestApproved(request);

      res.json(request);
    } catch (err) { next(err); }
  }
);

// PATCH /api/requests/:id/reject
router.patch(
  '/:id/reject',
  requireRole('Manager', 'CloudEngineer', 'Admin'),
  auditLog('REQUEST_REJECTED', 'Request'),
  async (req, res, next) => {
    try {
      const request = await Request.findByPk(req.params.id, {
        include: [{ model: User, as: 'requestedBy' }],
      });
      if (!request) return res.status(404).json({ error: 'Request not found' });

      await request.update({
        status: 'Rejected',
        approvedById: req.user.id,
        approvedAt: new Date(),
        rejectionReason: req.body.reason,
      });

      await notificationService.requestRejected(request, req.body.reason);
      res.json(request);
    } catch (err) { next(err); }
  }
);

module.exports = router;
