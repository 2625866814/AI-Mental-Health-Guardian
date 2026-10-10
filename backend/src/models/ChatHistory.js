const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 对话历史模型
const ChatHistory = sequelize.define('ChatHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  sessionId: {
    type: DataTypes.STRING(100),
    defaultValue: 'default'
  },
  moduleType: {
    type: DataTypes.STRING(50),
    defaultValue: 'general'
  },
  userMessage: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  aiResponse: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'chat_histories'
});

module.exports = ChatHistory;
