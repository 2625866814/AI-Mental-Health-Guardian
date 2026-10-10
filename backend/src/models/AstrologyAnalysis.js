const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 星盘分析模型
const AstrologyAnalysis = sequelize.define('AstrologyAnalysis', {
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
  mbtiType: {
    type: DataTypes.STRING(10)
  },
  birthDate: {
    type: DataTypes.DATEONLY
  },
  birthTime: {
    type: DataTypes.TIME
  },
  birthPlace: {
    type: DataTypes.STRING(100)
  },
  analysisResult: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  analysisType: {
    type: DataTypes.STRING(50),
    defaultValue: 'mbti-astrology'
  }
}, {
  tableName: 'astrology_analyses'
});

module.exports = AstrologyAnalysis;
