const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const config = require('./config');
const { testConnection } = require('./config/database');
const {
  authRoutes,
  mentalHealthRoutes,
  astrologyRoutes,
  artRoutes,
  diaryRoutes,
  chatRoutes,
  personalityRoutes
} = require('./routes');
const dreamRoutes = require('./routes/dream');
const perceptionRoutes = require('./routes/perception');
const digitalHumanRoutes = require('./routes/digitalHuman');
const enhancedAssessmentRoutes = require('./routes/enhancedAssessment');
const campusRoutes = require('./routes/campus');
const achievementRoutes = require('./routes/achievement');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notification');

// 创建Express应用
const app = express();

// 中间件配置
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/mental-health', mentalHealthRoutes);
app.use('/api/astrology', astrologyRoutes);
app.use('/api/art', artRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/personality', personalityRoutes);
app.use('/api/dream', dreamRoutes);
app.use('/api/perception', perceptionRoutes);
app.use('/api/digital-human', digitalHumanRoutes);
app.use('/api/enhanced', enhancedAssessmentRoutes);
app.use('/api/campus', campusRoutes);
app.use('/api/achievement', achievementRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notification', notificationRoutes);

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '请求的资源不存在' });
});

// 全局错误处理
app.use((error, req, res, next) => {
  console.error('全局错误:', error);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ 数据库连接失败，无法启动服务器');
      process.exit(1);
    }

    // 同步数据库模型
    const { sequelize } = require('./config/database');
    await sequelize.sync();
    console.log('✅ 数据库模型同步完成');

    // 初始化管理员用户
    const { User } = require('./models');
    const adminUser = await User.findOne({ where: { username: 'admin' } });
    if (!adminUser) {
      await User.create({
        username: 'admin',
        passwordHash: 'admin123',
        email: 'admin@example.com',
        role: 'admin'
      });
      console.log('✅ 管理员用户创建成功 (admin/admin123)');
    }

    // 启动服务器
    const PORT = config.server.port;
    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log('🚀 AI心理健康卫士服务器启动成功！');
      console.log(`📍 访问地址: http://localhost:${PORT}`);
      console.log(`📊 API接口: http://localhost:${PORT}/api/health`);
      console.log('='.repeat(50));
      console.log('按 Ctrl+C 可停止服务器');
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 启动服务器
startServer();

module.exports = app;
