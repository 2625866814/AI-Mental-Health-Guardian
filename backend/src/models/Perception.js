const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 行为感知数据模型
const BehaviorData = sequelize.define('BehaviorData', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  dataType: { type: DataTypes.STRING(50), allowNull: false }, // login_frequency, sleep_pattern, social_activity
  dataValue: { type: DataTypes.JSON, defaultValue: {} },
  recordedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'behavior_data' });

// 多维度感知结果模型
const PerceptionResult = sequelize.define('PerceptionResult', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  textScore: { type: DataTypes.FLOAT, defaultValue: 0 },      // 文本感知分数
  behaviorScore: { type: DataTypes.FLOAT, defaultValue: 0 },  // 行为感知分数
  testScore: { type: DataTypes.FLOAT, defaultValue: 0 },      // 量表感知分数
  socialScore: { type: DataTypes.FLOAT, defaultValue: 0 },    // 社交感知分数
  overallScore: { type: DataTypes.FLOAT, defaultValue: 0 },   // 综合分数
  riskLevel: { type: DataTypes.STRING(20), defaultValue: 'low' },
  analysisReport: { type: DataTypes.JSON, defaultValue: {} },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'perception_results' });

module.exports = { BehaviorData, PerceptionResult };
