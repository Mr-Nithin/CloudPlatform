const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Admin-defined access control rules: Team → Account mappings,
// resource type restrictions, environment guards, etc.
const AccessRule = sequelize.define('AccessRule', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  ruleType: {
    type: DataTypes.ENUM(
      'TeamAccount',      // which accounts a team can use
      'ResourceRestriction', // which resource types a team can request
      'EnvironmentGuard', // extra approval requirements per env
      'RegionLock',       // allowed regions per project
      'CostCap'           // max cost per request
    ),
    allowNull: false,
  },
  teamId: { type: DataTypes.UUID },
  accountId: { type: DataTypes.UUID },
  projectId: { type: DataTypes.UUID },
  value: { type: DataTypes.JSONB, defaultValue: {}, comment: 'Rule payload' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  createdById: { type: DataTypes.UUID },
});

module.exports = AccessRule;
