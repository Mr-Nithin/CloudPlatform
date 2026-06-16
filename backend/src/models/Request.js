const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Request = sequelize.define('Request', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  requestedById: { type: DataTypes.UUID, allowNull: false },
  projectId: { type: DataTypes.UUID, allowNull: false },
  // accountId and region are snapshotted from project at creation time for audit history
  accountId: { type: DataTypes.UUID, allowNull: false },
  region: { type: DataTypes.STRING, allowNull: false },
  resourceType: { type: DataTypes.STRING, allowNull: false, comment: 'e.g. S3, CloudFront, RDS' },
  environment: { type: DataTypes.ENUM('dev', 'staging', 'prod'), allowNull: false },
  parameters: { type: DataTypes.JSONB, defaultValue: {}, comment: 'Resource-specific config from AI chat' },
  status: {
    type: DataTypes.ENUM(
      'Draft', 'PendingApproval', 'Approved', 'Rejected',
      'Provisioning', 'Provisioned', 'Failed'
    ),
    defaultValue: 'Draft',
  },
  approvedById: { type: DataTypes.UUID },
  approvedAt: { type: DataTypes.DATE },
  rejectionReason: { type: DataTypes.TEXT },
  conversationId: { type: DataTypes.UUID },
  templateId: { type: DataTypes.UUID, comment: 'IaC template version used' },
  estimatedCostUsd: { type: DataTypes.DECIMAL(10, 2) },
});

module.exports = Request;
