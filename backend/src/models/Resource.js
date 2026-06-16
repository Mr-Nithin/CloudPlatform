const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Resource = sequelize.define('Resource', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  requestId: { type: DataTypes.UUID, allowNull: false },
  accountId: { type: DataTypes.UUID, allowNull: false },
  resourceType: { type: DataTypes.STRING, allowNull: false },
  resourceName: { type: DataTypes.STRING, allowNull: false, comment: 'Generated from naming convention' },
  arn: { type: DataTypes.STRING, comment: 'AWS/Azure/GCP resource ARN or ID' },
  region: { type: DataTypes.STRING },
  tags: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Applied tags: Team, Project, Env, Owner, ApprovedBy',
  },
  provisionedAt: { type: DataTypes.DATE },
  stackId: { type: DataTypes.STRING, comment: 'Terraform workspace identifier' },
  tfState: { type: DataTypes.JSONB, comment: 'Terraform state — enables update and destroy' },
  status: { type: DataTypes.ENUM('Active', 'Deleted'), defaultValue: 'Active' },
});

module.exports = Resource;
