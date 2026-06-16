const nodemailer = require('nodemailer');
const logger = require('../config/logger');
const { User } = require('../models');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

async function send(to, subject, html) {
  if (!process.env.SMTP_HOST) {
    logger.info(`[EMAIL SKIP] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, html });
  } catch (err) {
    logger.error(`Email failed to ${to}:`, err.message);
  }
}

async function requestRaised(request, requester, project) {
  const manager = await project?.team?.getManager?.();
  const subject = `[Cloud Platform] New request: ${request.resourceType} — ${project?.name}`;
  const html = `
    <h2>New Resource Request</h2>
    <p><strong>Developer:</strong> ${requester.name} (${requester.email})</p>
    <p><strong>Resource:</strong> ${request.resourceType}</p>
    <p><strong>Project:</strong> ${project?.name} (${request.environment})</p>
    <p><strong>Request ID:</strong> ${request.id}</p>
    <p>Please log in to approve or reject this request.</p>
  `;
  // Notify requester + manager
  await send(requester.email, subject, html);
  if (manager) await send(manager.email, `[Action Required] ${subject}`, html);
}

async function requestApproved(request) {
  const requester = await request.getRequestedBy?.();
  if (!requester) return;
  await send(
    requester.email,
    `[Cloud Platform] Request approved — ${request.resourceType}`,
    `<h2>Your request has been approved</h2><p>Request ID: ${request.id}</p><p>Provisioning is now underway.</p>`
  );
}

async function requestRejected(request, reason) {
  const requester = await request.getRequestedBy?.();
  if (!requester) return;
  await send(
    requester.email,
    `[Cloud Platform] Request rejected — ${request.resourceType}`,
    `<h2>Your request was rejected</h2><p>Request ID: ${request.id}</p><p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>`
  );
}

async function requestProvisioned(request, resource, requester) {
  await send(
    requester.email,
    `[Cloud Platform] Resource provisioned — ${resource.resourceName}`,
    `<h2>Your resource is ready</h2>
    <p><strong>Resource:</strong> ${resource.resourceName}</p>
    <p><strong>Type:</strong> ${resource.resourceType}</p>
    <p><strong>ARN:</strong> ${resource.arn}</p>
    <p>Your IAM access has been updated.</p>`
  );
}

async function requestFailed(request, errorMessage) {
  const requester = await request.getRequestedBy?.();
  if (!requester) return;
  await send(
    requester.email,
    `[Cloud Platform] Provisioning FAILED — ${request.resourceType}`,
    `<h2>Provisioning failed</h2><p>Request ID: ${request.id}</p><p><strong>Error:</strong> ${errorMessage}</p><p>The Cloud Engineering team has been notified.</p>`
  );
}

async function missingTemplate(resourceType, requester) {
  const admins = await User.findAll({ where: { role: 'Admin', status: 'Active' } });
  const subject = `[Cloud Platform] Missing IaC Template — ${resourceType}`;
  const html = `
    <h2>IaC Template Required</h2>
    <p><strong>${requester.name}</strong> (${requester.email}) requested a <strong>${resourceType}</strong> resource, but no active IaC template exists for this resource type.</p>
    <p>Please upload a template for <strong>${resourceType}</strong> in the Admin panel so this request can be fulfilled.</p>
    <p style="color:#888;font-size:12px;">The developer has been informed and asked to contact you.</p>
  `;
  await Promise.all(admins.map((admin) => send(admin.email, subject, html)));
  logger.info(`[MISSING TEMPLATE] Admins notified — resourceType: ${resourceType}, requestedBy: ${requester.email}`);
}

async function welcomeUser(user, tempPassword) {
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  await send(
    user.email,
    '[Cloud Platform] Your account has been created',
    `
      <h2>Welcome to the Cloud Resource Platform</h2>
      <p>An admin has created an account for you. Use the credentials below to log in.</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Temporary Password:</strong> <code>${tempPassword}</code></p>
      <p>You will be prompted to set a new password immediately after logging in.</p>
      <p><a href="${loginUrl}">Log in now →</a></p>
      <p style="color:#888;font-size:12px;">If you did not expect this email, please ignore it.</p>
    `
  );
}

module.exports = { requestRaised, requestApproved, requestRejected, requestProvisioned, requestFailed, welcomeUser, missingTemplate };
