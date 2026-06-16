const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NamingConvention = sequelize.define('NamingConvention', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  entityType: {
    type: DataTypes.ENUM('Team', 'Project', 'Resource', 'Tag'),
    allowNull: false,
  },
  pattern: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'e.g. {team}-{env}-{resource}',
  },
  version: { type: DataTypes.INTEGER, defaultValue: 1 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  createdById: { type: DataTypes.UUID },
});

module.exports = NamingConvention;
