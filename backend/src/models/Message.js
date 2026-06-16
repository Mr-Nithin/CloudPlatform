const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  conversationId: { type: DataTypes.UUID, allowNull: false },
  role: { type: DataTypes.ENUM('user', 'assistant'), allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
}, {
  updatedAt: false,
});

module.exports = Message;
