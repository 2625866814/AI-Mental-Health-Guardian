const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 大学生用户档案扩展模型
const StudentProfile = sequelize.define('StudentProfile', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
  grade: { type: DataTypes.STRING(20), defaultValue: '' },  // 年级：大一/大二/大三/大四/研究生
  major: { type: DataTypes.STRING(100), defaultValue: '' },  // 专业
  college: { type: DataTypes.STRING(100), defaultValue: '' }, // 学院
  dormitory: { type: DataTypes.STRING(50), defaultValue: '' }, // 宿舍
  hometown: { type: DataTypes.STRING(100), defaultValue: '' }, // 籍贯
  familySituation: { type: DataTypes.STRING(50), defaultValue: '' }, // 家庭情况
  financialStatus: { type: DataTypes.STRING(50), defaultValue: '' }, // 经济状况
  relationshipStatus: { type: DataTypes.STRING(50), defaultValue: '' }, // 恋爱状态
  academicRank: { type: DataTypes.STRING(50), defaultValue: '' } // 学业排名
}, { tableName: 'student_profiles' });

module.exports = StudentProfile;
