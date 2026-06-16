const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const IacTemplate = sequelize.define('IacTemplate', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  resourceType: { type: DataTypes.STRING, allowNull: false, comment: 'e.g. S3, CloudFront' },
  provider: { type: DataTypes.ENUM('AWS', 'Azure', 'GCP'), defaultValue: 'AWS' },
  engine: { type: DataTypes.ENUM('CloudFormation', 'Terraform'), defaultValue: 'CloudFormation' },
  version: { type: DataTypes.INTEGER, defaultValue: 1 },
  body: { type: DataTypes.TEXT, allowNull: false, comment: 'Template body with {token} placeholders' },
  parameters: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'List of required parameters the AI must extract',
  },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  createdById: { type: DataTypes.UUID },
});

module.exports = IacTemplate;
