const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 心理健康测试模型
const MentalHealthTest = sequelize.define('MentalHealthTest', {
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
  testType: {
    type: DataTypes.STRING(50),
    defaultValue: 'scl90'
  },
  scl90Answers: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  textAnalysis: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  voiceAnalysis: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  expressionAnalysis: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  riskResult: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  completionTime: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  userSatisfaction: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  }
}, {
  tableName: 'mental_health_tests'
});

module.exports = MentalHealthTest;
