const { IAMClient, GetUserPolicyCommand, PutUserPolicyCommand } = require('@aws-sdk/client-iam');
const { STSClient, AssumeRoleCommand } = require('@aws-sdk/client-sts');
const logger = require('../config/logger');

/**
 * Grant a developer scoped IAM access to a provisioned resource.
 * Appends a policy statement to the user's inline policy in the target account.
 */
async function grantAccess(user, resource, account) {
  try {
    const sts = new STSClient({ region: resource.region || 'us-east-1' });
    const assumed = await sts.send(new AssumeRoleCommand({
      RoleArn: account.roleArn,
      RoleSessionName: 'CloudPlatformIAM',
    }));
    const creds = assumed.Credentials;
    const iam = new IAMClient({
      region: 'us-east-1', // IAM is global
      credentials: {
        accessKeyId: creds.AccessKeyId,
        secretAccessKey: creds.SecretAccessKey,
        sessionToken: creds.SessionToken,
      },
    });

    const policyName = `CloudPlatform-${user.email.replace(/[^a-zA-Z0-9]/g, '-')}`;
    const iamUsername = user.email; // Assumes IAM username matches email

    // Get existing policy document (if any)
    let existingStatements = [];
    try {
      const existing = await iam.send(new GetUserPolicyCommand({ UserName: iamUsername, PolicyName: policyName }));
      const doc = JSON.parse(decodeURIComponent(existing.PolicyDocument));
      existingStatements = doc.Statement || [];
    } catch (_) {
      // No existing policy — start fresh
    }

    // Build scoped actions based on resource type
    const actions = getActionsForResourceType(resource.resourceType);

    const newStatement = {
      Sid: `Access${resource.id.replace(/-/g, '')}`,
      Effect: 'Allow',
      Action: actions,
      Resource: resource.arn,
    };

    const policyDocument = {
      Version: '2012-10-17',
      Statement: [...existingStatements, newStatement],
    };

    await iam.send(new PutUserPolicyCommand({
      UserName: iamUsername,
      PolicyName: policyName,
      PolicyDocument: JSON.stringify(policyDocument),
    }));

    logger.info(`IAM access granted to ${user.email} for ${resource.arn}`);
  } catch (err) {
    logger.error(`IAM grant failed for ${user.email}:`, err.message);
    // Non-fatal — provisioning succeeded, IAM can be fixed manually
  }
}

function getActionsForResourceType(resourceType) {
  const actionMap = {
    S3: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:ListBucket'],
    CloudFront: ['cloudfront:GetDistribution', 'cloudfront:CreateInvalidation'],
    RDS: ['rds:DescribeDBInstances', 'rds:Connect'],
  };
  return actionMap[resourceType] || ['*'];
}

module.exports = { grantAccess };
