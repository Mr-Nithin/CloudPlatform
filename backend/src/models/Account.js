const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Account = sequelize.define('Account', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  alias: { type: DataTypes.STRING },
  accountId: { type: DataTypes.STRING, allowNull: false, comment: 'AWS/Azure/GCP account ID' },
  provider: { type: DataTypes.ENUM('AWS', 'Azure', 'GCP'), allowNull: false, defaultValue: 'AWS' },
  environment: { type: DataTypes.ENUM('dev', 'staging', 'prod'), allowNull: false },
  allowedRegions: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  roleArn: { type: DataTypes.STRING, comment: 'IAM Role ARN to assume for provisioning' },
  status: { type: DataTypes.ENUM('Active', 'Inactive'), defaultValue: 'Active' },
});

module.exports = Account;
