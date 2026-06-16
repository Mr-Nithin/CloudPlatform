const Anthropic = require('@anthropic-ai/sdk');
const { Request, Project, Account, Team, IacTemplate } = require('../models');
const namingService = require('./namingService');
const notificationService = require('./notificationService');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a cloud infrastructure assistant embedded in a resource request platform.
Your job is to help developers raise cloud resource requests by:
1. Understanding what resource they want (e.g. S3 bucket, CloudFront distribution, RDS instance)
2. Asking for any missing required parameters based on the available IaC template parameters
3. Validating against the user's project context (account, region, environment)
4. Presenting a summary and asking for confirmation before raising a formal request

When a developer confirms, output ONLY this block at the END of your message:
<REQUEST_JSON>
{
  "resourceType": "S3",
  "projectId": "<uuid from user context>",
  "environment": "dev",
  "parameters": {
    "EnableVersioning": "Enabled"
  }
}
</REQUEST_JSON>

Rules:
- Never provision without explicit confirmation ("yes", "confirm", "go ahead", "do it")
- accountId and region are derived automatically from the chosen project — do NOT include them in REQUEST_JSON
- Always reference the project by name when confirming with the user
- Be concise and technical`;

async function chat(user, conversation, userMessage) {
  // Load user's teams, then derive accessible projects through those teams
  const teams = await user.getTeams({
    include: [{
      model: Project,
      as: 'projects',
      include: [{ model: Account, as: 'account', attributes: ['id', 'name', 'alias', 'allowedRegions', 'provider'] }],
    }],
  });

  // Deduplicate projects across teams
  const seen = new Set();
  const projects = [];
  for (const team of teams) {
    for (const p of team.projects || []) {
      if (!seen.has(p.id)) { seen.add(p.id); projects.push(p); }
    }
  }

  const contextBlock = [
    `User: ${user.name} (${user.role})`,
    `Teams: ${teams.map((t) => t.name).join(', ') || 'none'}`,
    `Projects:`,
    ...projects.map((p) =>
      `  - ${p.name} | id:${p.id} | env:${p.environment} | region:${p.region} | account:${p.account?.alias || p.account?.name}`
    ),
  ].join('\n');

  const history = (conversation.messages || []).map((m) => ({ role: m.role, content: m.content }));
  history.push({ role: 'user', content: userMessage });

  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL,
    max_tokens: 1024,
    system: `${SYSTEM_PROMPT}\n\n--- USER CONTEXT ---\n${contextBlock}`,
    messages: history,
  });

  const reply = response.content[0].text;

  // Parse and create Request if AI confirmed
  const requestMatch = reply.match(/<REQUEST_JSON>([\s\S]*?)<\/REQUEST_JSON>/);
  let raisedRequest = null;

  if (requestMatch) {
    try {
      const params = JSON.parse(requestMatch[1].trim());

      // Check that an active IaC template exists before creating the request
      const template = await IacTemplate.findOne({
        where: { resourceType: params.resourceType, isActive: true },
      });
      if (!template) {
        notificationService.missingTemplate(params.resourceType, user).catch(console.error);
        const noTemplateMsg = `I'm unable to raise this request — there is no active IaC template configured for **${params.resourceType}** resources. Your Admin has been notified and will upload one. Please try again once it's available.`;
        return { reply: noTemplateMsg, request: null };
      }

      // Derive account and region from the project
      const project = await Project.findByPk(params.projectId, {
        include: [{ model: Account, as: 'account' }],
      });
      if (!project) throw new Error(`Project not found: ${params.projectId}`);

      raisedRequest = await Request.create({
        resourceType: params.resourceType,
        projectId: project.id,
        accountId: project.accountId,
        region: project.region,
        environment: project.environment,
        parameters: params.parameters || {},
        requestedById: user.id,
        status: 'PendingApproval',
        conversationId: conversation.id,
      });

      await notificationService.requestRaised(raisedRequest, user, project);
    } catch (err) {
      console.error('Failed to create request from AI output:', err.message);
    }
  }

  return { reply, request: raisedRequest };
}

module.exports = { chat };
