const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  accountId: { type: DataTypes.UUID, allowNull: false },
  region: { type: DataTypes.STRING, defaultValue: '', comment: 'Single AWS/Azure/GCP region for this project' },
  environment: { type: DataTypes.ENUM('dev', 'staging', 'prod'), allowNull: false },
});

module.exports = Project;
