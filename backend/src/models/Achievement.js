const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 成就定义
const Achievement = sequelize.define('Achievement', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.TEXT },
  icon: { type: DataTypes.STRING(10) },
  category: { type: DataTypes.STRING(30) },
  points: { type: DataTypes.INTEGER, defaultValue: 10 },
  condition: { type: DataTypes.JSON, defaultValue: {} },
  rarity: { type: DataTypes.STRING(20), defaultValue: 'common' }
}, { tableName: 'achievements' });

// 用户成就记录
const UserAchievement = sequelize.define('UserAchievement', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  achievementId: { type: DataTypes.INTEGER, allowNull: false },
  unlockedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'user_achievements', timestamps: false });

// 用户签到/打卡记录
const CheckIn = sequelize.define('CheckIn', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  checkInDate: { type: DataTypes.DATEONLY, allowNull: false },
  checkInType: { type: DataTypes.STRING(20), defaultValue: 'daily' },
  streak: { type: DataTypes.INTEGER, defaultValue: 1 },
  points: { type: DataTypes.INTEGER, defaultValue: 5 }
}, { tableName: 'check_ins' });

// 用户积分
const UserPoints = sequelize.define('UserPoints', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, unique: true, allowNull: false },
  totalPoints: { type: DataTypes.INTEGER, defaultValue: 0 },
  level: { type: DataTypes.INTEGER, defaultValue: 1 },
  streak: { type: DataTypes.INTEGER, defaultValue: 0 },
  maxStreak: { type: DataTypes.INTEGER, defaultValue: 0 },
  lastCheckIn: { type: DataTypes.DATEONLY }
}, { tableName: 'user_points', timestamps: false });

// 积分历史
const PointsHistory = sequelize.define('PointsHistory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  points: { type: DataTypes.INTEGER, allowNull: false },
  source: { type: DataTypes.STRING(50) },
  description: { type: DataTypes.STRING(200) },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'points_history', updatedAt: false });

module.exports = {
  Achievement,
  UserAchievement,
  CheckIn,
  UserPoints,
  PointsHistory
};
