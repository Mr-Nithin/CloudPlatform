const router = require('express').Router();
const { Project, Account, Team } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

// GET /api/projects — scoped by role
router.get('/', async (req, res, next) => {
  try {
    const include = [
      { model: Account, as: 'account', attributes: ['id', 'name', 'alias', 'provider', 'allowedRegions'] },
      { model: Team, as: 'teams', attributes: ['id', 'name'] },
    ];

    let projectList;
    if (['Admin', 'CloudEngineer'].includes(req.user.role)) {
      projectList = await Project.findAll({ include });
    } else {
      // Developers/Managers see projects that belong to any of their teams
      const userTeams = await req.user.getTeams({
        include: [{ model: Project, as: 'projects', include }],
      });
      const seen = new Set();
      projectList = [];
      for (const team of userTeams) {
        for (const p of team.projects || []) {
          if (!seen.has(p.id)) { seen.add(p.id); projectList.push(p); }
        }
      }
    }
    res.json(projectList);
  } catch (err) { next(err); }
});

// POST /api/projects — Admin only
router.post('/', requireRole('Admin'), async (req, res, next) => {
  try {
    const { name, alias, accountId, region, environment, costCapUsd } = req.body;

    const account = await Account.findByPk(accountId);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    if (account.allowedRegions?.length && !account.allowedRegions.includes(region)) {
      return res.status(400).json({
        error: `Region "${region}" is not allowed for this account. Allowed: ${account.allowedRegions.join(', ')}`,
      });
    }

    const project = await Project.create({ name, alias, accountId, region, environment, costCapUsd });
    res.status(201).json(project);
  } catch (err) { next(err); }
});

// PATCH /api/projects/:id — Admin only
router.patch('/:id', requireRole('Admin'), async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    await project.update(req.body);
    res.json(project);
  } catch (err) { next(err); }
});

// PATCH /api/projects/:id/teams — assign teams to a project
router.patch('/:id/teams', requireRole('Admin'), async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    await project.setTeams(req.body.teamIds || []);
    res.json({ message: 'Teams updated' });
  } catch (err) { next(err); }
});

// GET /api/projects/:id/regions — return allowed regions for project's account
router.get('/:id/regions', async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [{ model: Account, as: 'account', attributes: ['allowedRegions'] }],
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project.account?.allowedRegions || []);
  } catch (err) { next(err); }
});

module.exports = router;
