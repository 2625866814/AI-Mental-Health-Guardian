const { Sequelize } = require('sequelize');
const path = require('path');
const bcrypt = require('bcryptjs');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'data/local.db'),
  logging: false
});

async function check() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    const [results] = await sequelize.query('SELECT id, username, role FROM users');
    console.log('用户列表:', JSON.stringify(results, null, 2));
    
    if (results.length === 0) {
      console.log('没有用户，创建管理员...');
      const hash = await bcrypt.hash('admin123', 10);
      await sequelize.query(
        `INSERT INTO users (username, password_hash, role, created_at, updated_at) VALUES ('admin', '${hash}', 'admin', datetime('now'), datetime('now'))`
      );
      console.log('管理员创建成功: admin / admin123');
    } else {
      console.log('已有用户，重置admin密码...');
      const hash = await bcrypt.hash('admin123', 10);
      await sequelize.query(
        `UPDATE users SET password_hash = '${hash}' WHERE username = 'admin'`
      );
      console.log('admin密码已重置为: admin123');
    }
  } catch (e) {
    console.error('错误:', e.message);
  }
  process.exit(0);
}

check();
