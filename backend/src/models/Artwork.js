const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 艺术疗愈作品模型
const Artwork = sequelize.define('Artwork', {
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
  artworkType: {
    type: DataTypes.ENUM('drawing', 'music'),
    allowNull: false
  },
  content: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  analysisResult: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  healingTask: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'artworks'
});

module.exports = Artwork;
