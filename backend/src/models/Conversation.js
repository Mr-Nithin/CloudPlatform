const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Conversation = sequelize.define('Conversation', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  requestId: { type: DataTypes.UUID, allowNull: true },
  lastUpdated: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

module.exports = Conversation;
