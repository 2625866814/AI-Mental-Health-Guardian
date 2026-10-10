const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// SQLite 数据库路径
const sqlitePath = path.join(__dirname, '../../data/local.db');
const sqliteDir = path.dirname(sqlitePath);
if (!fs.existsSync(sqliteDir)) {
  fs.mkdirSync(sqliteDir, { recursive: true });
}

// 创建 SQLite 实例（始终可用）
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: sqlitePath,
  logging: false,
  define: { timestamps: true, underscored: true }
});

// 测试数据库连接
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ SQLite 数据库连接成功');
    console.log('📁 数据库文件:', sqlitePath);
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

module.exports = { sequelize, testConnection };
