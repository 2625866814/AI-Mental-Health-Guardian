const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 通知消息
const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  content: { type: DataTypes.TEXT },
  type: { type: DataTypes.STRING(30), defaultValue: 'system' },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
  link: { type: DataTypes.STRING(200) },
  sender: { type: DataTypes.STRING(50), defaultValue: 'system' }
}, { tableName: 'notifications' });

// 心情打卡
const MoodCheckIn = sequelize.define('MoodCheckIn', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  moodDate: { type: DataTypes.DATEONLY, allowNull: false },
  moodType: { type: DataTypes.STRING(20), allowNull: false },
  moodScore: { type: DataTypes.INTEGER, defaultValue: 5 },
  note: { type: DataTypes.TEXT },
  tags: { type: DataTypes.JSON, defaultValue: [] }
}, { tableName: 'mood_checkins' });

// 周报月报
const Report = sequelize.define('Report', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER },
  reportType: { type: DataTypes.STRING(20), allowNull: false },
  period: { type: DataTypes.STRING(20), allowNull: false },
  summary: { type: DataTypes.TEXT },
  data: { type: DataTypes.JSON, defaultValue: {} },
  recommendations: { type: DataTypes.JSON, defaultValue: [] },
  generatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'reports', updatedAt: false });

module.exports = { Notification, MoodCheckIn, Report };
