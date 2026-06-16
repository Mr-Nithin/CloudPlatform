const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID },
  action: { type: DataTypes.STRING, allowNull: false, comment: 'e.g. REQUEST_CREATED, ACCOUNT_UPDATED' },
  entity: { type: DataTypes.STRING, comment: 'Entity type: Request, Account, User, etc.' },
  entityId: { type: DataTypes.UUID },
  before: { type: DataTypes.JSONB },
  after: { type: DataTypes.JSONB },
  metadata: { type: DataTypes.JSONB, defaultValue: {} },
  ipAddress: { type: DataTypes.STRING },
}, {
  updatedAt: false,
});

module.exports = AuditLog;
