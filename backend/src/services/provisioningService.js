const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { Request, Resource, IacTemplate, Account, Project, User } = require('../models');
const namingService = require('./namingService');
const notificationService = require('./notificationService');
const logger = require('../config/logger');

async function provision(request) {
  let workDir;
  try {
    await request.update({ status: 'Provisioning' });

    const project = await Project.findByPk(request.projectId, {
      include: [{ model: Account, as: 'account' }],
    });
    const account = project.account;
    const region = request.region;
    const requester = await User.findByPk(request.requestedById);
    const approver = request.approvedById ? await User.findByPk(request.approvedById) : null;

    const template = await IacTemplate.findOne({
      where: { resourceType: request.resourceType, isActive: true },
      order: [['version', 'DESC']],
    });
    if (!template) throw new Error(`No active IaC template for resource type: ${request.resourceType}`);

    const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const purpose = slug(request.resourceType);
    const resourceName = slug(await namingService.resolve('Resource', {
      project: slug(project.name),
      env: request.environment,
      purpose,
    }));

    // Unique suffix per request — prevents name conflicts on retries
    const shortId = request.id.replace(/-/g, '').slice(0, 8);
    const uniqueResourceName = `${resourceName}-${shortId}`;

    // Substitute platform {tokens} in template body.
    // These are distinct from Terraform's ${var.name} interpolation.
    const platformTokens = {
      project: slug(project.name),
      env: request.environment,
      purpose,
      resource: uniqueResourceName,
      region,
      owner: requester.email,
      team: '',
    };

    let mainTf = template.body;
    for (const [key, val] of Object.entries(platformTokens)) {
      mainTf = mainTf.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
    }

    // Discover which variables the template declares
    const declaredVars = [...mainTf.matchAll(/^variable\s+"(\w+)"/gm)].map((m) => m[1]);

    // Build the full set of possible variable values
    const allVarValues = {
      bucket_name: uniqueResourceName,
      resource_name: uniqueResourceName,
      region,
      enable_versioning: request.parameters?.EnableVersioning || request.parameters?.enable_versioning || 'Enabled',
      environment: request.environment,
      project: slug(project.name),
      ...Object.fromEntries(
        Object.entries(request.parameters || {}).map(([k, v]) => [
          k.replace(/([A-Z])/g, (m) => `_${m.toLowerCase()}`).replace(/^_/, ''),
          v,
        ])
      ),
    };

    // Only pass vars the template actually declares — avoid "undeclared variable" errors
    const tfVarFlags = declaredVars
      .filter((v) => allVarValues[v] !== undefined)
      .map((v) => `-var="${v}=${String(allVarValues[v]).replace(/"/g, '\\"')}"`)
      .join(' ');

    // Create temp work directory for this provisioning run
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tf-'));

    // provider.tf — auto-generated from account config
    fs.writeFileSync(path.join(workDir, 'provider.tf'), buildProviderTf(account, region));

    // main.tf — template body after platform token substitution
    fs.writeFileSync(path.join(workDir, 'main.tf'), mainTf);

    const execEnv = { ...process.env, TF_IN_AUTOMATION: '1', TF_INPUT: '0', TF_CLI_ARGS: '' };
    const execOpts = { cwd: workDir, env: execEnv };

    logger.info(`Terraform init — request ${request.id}`);
    execSync('terraform init -no-color', execOpts);

    logger.info(`Terraform apply — request ${request.id}`);
    execSync(`terraform apply -auto-approve -no-color ${tfVarFlags}`, execOpts);

    // Parse outputs for ARN
    let arn = uniqueResourceName;
    try {
      const outputJson = execSync('terraform output -json', execOpts).toString();
      const outputs = JSON.parse(outputJson);
      const arnOutput = outputs.resource_arn || outputs.bucket_arn || outputs.arn;
      if (arnOutput?.value) arn = arnOutput.value;
    } catch { /* no outputs defined — use resource name as identifier */ }

    // Persist Terraform state to DB for future updates/destroy
    let tfState = null;
    try {
      const stateFile = path.join(workDir, 'terraform.tfstate');
      if (fs.existsSync(stateFile)) {
        tfState = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      }
    } catch { /* state read failed — continue without it */ }

    const tags = {
      Project: project.name,
      Environment: request.environment,
      Purpose: request.resourceType,
      Owner: requester.email,
      OwnerName: requester.name,
      ApprovedBy: approver?.email || 'system',
      Region: region,
      ManagedBy: 'CloudPlatform',
    };

    const resource = await Resource.create({
      requestId: request.id,
      accountId: account.id,
      resourceType: request.resourceType,
      resourceName: uniqueResourceName,
      arn,
      region,
      tags,
      provisionedAt: new Date(),
      stackId: `tf-${uniqueResourceName}`,
      tfState,
    });

    await request.update({ status: 'Provisioned', templateId: template.id });
    await notificationService.requestProvisioned(request, resource, requester);
    logger.info(`Provisioned ${uniqueResourceName} (${arn}) for request ${request.id}`);

  } catch (err) {
    const message = err.stderr?.toString() || err.stdout?.toString() || err.message || String(err);
    logger.error(`Provisioning failed for request ${request.id}: ${message}`);
    await request.update({ status: 'Failed' });
    await notificationService.requestFailed(request, message.slice(0, 500));
  } finally {
    if (workDir) {
      try { fs.rmSync(workDir, { recursive: true, force: true }); } catch {}
    }
  }
}

function buildProviderTf(account, region) {
  const lines = [
    'terraform {',
    '  required_providers {',
    '    aws = {',
    '      source  = "hashicorp/aws"',
    '      version = "~> 5.0"',
    '    }',
    '  }',
    '}',
    '',
    'provider "aws" {',
    `  region = "${region}"`,
  ];

  if (account.roleArn) {
    lines.push('  assume_role {');
    lines.push(`    role_arn     = "${account.roleArn}"`);
    lines.push('    session_name = "CloudPlatformProvisioning"');
    lines.push('  }');
  }

  lines.push('}');
  return lines.join('\n') + '\n';
}

module.exports = { provision };
