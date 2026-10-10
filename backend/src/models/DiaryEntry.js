const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 日记模型
const DiaryEntry = sequelize.define('DiaryEntry', {
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
  entryDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  morningText: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  afternoonText: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  eveningText: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  emotionAnalysis: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'diary_entries',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'entry_date']
    }
  ]
});

module.exports = DiaryEntry;
