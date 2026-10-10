const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 平行人格剧场会话模型
const PersonalitySession = sequelize.define('PersonalitySession', {
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
  scenario: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  personalityType: {
    type: DataTypes.STRING(50)
  },
  conversation: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  stressScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  decisionPath: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  outcome: {
    type: DataTypes.STRING(50)
  }
}, {
  tableName: 'personality_sessions'
});

module.exports = PersonalitySession;
