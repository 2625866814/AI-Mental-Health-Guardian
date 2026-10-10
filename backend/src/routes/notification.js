const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { Notification, MoodCheckIn, Report } = require('../models/Notification');
const { MentalHealthTest, DiaryEntry, ChatHistory } = require('../models');
const { Student } = require('../models/CampusData');
const { Op, fn, col, literal } = require('sequelize');

// ========== 通知系统 ==========

// 获取通知列表
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const where = { userId: req.user.id };
    if (unreadOnly === 'true') where.isRead = false;

    const { count, rows } = await Notification.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    const unreadCount = await Notification.count({
      where: { userId: req.user.id, isRead: false }
    });

    res.json({ success: true, notifications: rows, total: count, unreadCount });
  } catch (e) {
    console.error('获取通知失败:', e);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 标记通知已读
router.put('/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification || notification.userId !== req.user.id) {
      return res.status(404).json({ error: '通知不存在' });
    }
    notification.isRead = true;
    await notification.save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 全部标记已读
router.put('/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId: req.user.id, isRead: false } }
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 删除通知
router.delete('/notifications/:id', authenticateToken, async (req, res) => {
  try {
    await Notification.destroy({ where: { id: req.params.id, userId: req.user.id } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 发送通知（管理员）
router.post('/notifications/send', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    const { userId, title, content, type, link } = req.body;
    const notification = await Notification.create({
      userId, title, content, type: type || 'system', link, sender: 'admin'
    });
    res.json({ success: true, notification });
  } catch (e) {
    res.status(500).json({ error: '发送失败' });
  }
});

// 批量发送通知（管理员）
router.post('/notifications/broadcast', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    const { title, content, type, link, targetRole } = req.body;
    
    const where = {};
    if (targetRole) where.role = targetRole;
    
    const users = await require('../models').User.findAll({ where, attributes: ['id'] });
    const notifications = users.map(u => ({
      userId: u.id, title, content, type: type || 'system', link, sender: 'admin'
    }));
    
    await Notification.bulkCreate(notifications);
    res.json({ success: true, count: notifications.length });
  } catch (e) {
    res.status(500).json({ error: '发送失败' });
  }
});

// 创建系统通知（内部调用）
async function createNotification(userId, title, content, type = 'system', link = null) {
  try {
    await Notification.create({ userId, title, content, type, link, sender: 'system' });
  } catch (e) {
    console.error('创建通知失败:', e.message);
  }
}

// ========== 心情打卡 ==========

// 获取今日心情
router.get('/mood/today', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const mood = await MoodCheckIn.findOne({
      where: { userId: req.user.id, moodDate: today }
    });
    res.json({ success: true, mood });
  } catch (e) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 心情打卡
router.post('/mood/checkin', authenticateToken, async (req, res) => {
  try {
    const { moodType, moodScore, note, tags } = req.body;
    const today = new Date().toISOString().split('T')[0];

    const [mood, created] = await MoodCheckIn.findOrCreate({
      where: { userId: req.user.id, moodDate: today },
      defaults: { moodType, moodScore: moodScore || 5, note, tags: tags || [] }
    });

    if (!created) {
      mood.moodType = moodType;
      mood.moodScore = moodScore || 5;
      mood.note = note;
      mood.tags = tags || [];
      await mood.save();
    }

    res.json({ success: true, mood, created });
  } catch (e) {
    console.error('心情打卡失败:', e);
    res.status(500).json({ error: '打卡失败' });
  }
});

// 获取心情日历
router.get('/mood/calendar', authenticateToken, async (req, res) => {
  try {
    const { month } = req.query;
    const year = month ? parseInt(month.split('-')[0]) : new Date().getFullYear();
    const mon = month ? parseInt(month.split('-')[1]) : new Date().getMonth() + 1;
    
    const startDate = `${year}-${String(mon).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(mon).padStart(2, '0')}-31`;

    const moods = await MoodCheckIn.findAll({
      where: {
        userId: req.user.id,
        moodDate: { [Op.between]: [startDate, endDate] }
      },
      order: [['moodDate', 'ASC']]
    });

    res.json({ success: true, moods });
  } catch (e) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取心情统计
router.get('/mood/stats', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - parseInt(days) * 86400000).toISOString().split('T')[0];

    const moods = await MoodCheckIn.findAll({
      where: {
        userId: req.user.id,
        moodDate: { [Op.gte]: startDate }
      },
      order: [['moodDate', 'ASC']]
    });

    // 统计各心情类型
    const typeCount = {};
    let totalScore = 0;
    moods.forEach(m => {
      typeCount[m.moodType] = (typeCount[m.moodType] || 0) + 1;
      totalScore += m.moodScore || 5;
    });

    const avgScore = moods.length > 0 ? Math.round(totalScore / moods.length) : 5;

    res.json({
      success: true,
      stats: {
        totalDays: moods.length,
        avgScore,
        typeCount,
        moods
      }
    });
  } catch (e) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// ========== 周报月报 ==========

// 生成个人周报
router.get('/report/weekly', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const startDate = weekStart.toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];

    // 获取本周数据
    const [tests, diaries, moods, chats] = await Promise.all([
      MentalHealthTest.findAll({
        where: { userId, createdAt: { [Op.gte]: startDate } },
        order: [['createdAt', 'DESC']]
      }).catch(() => []),
      DiaryEntry.findAll({
        where: { userId, entryDate: { [Op.between]: [startDate, endDate] } }
      }).catch(() => []),
      MoodCheckIn.findAll({
        where: { userId, moodDate: { [Op.between]: [startDate, endDate] } }
      }).catch(() => []),
      ChatHistory.count({
        where: { userId, createdAt: { [Op.gte]: startDate } }
      }).catch(() => 0)
    ]);

    // 分析情绪趋势
    const emotionScores = diaries.filter(d => d.emotionAnalysis?.emotionScore).map(d => d.emotionAnalysis.emotionScore);
    const avgEmotion = emotionScores.length > 0 ? emotionScores.reduce((a, b) => a + b, 0) / emotionScores.length : 0.5;

    // 分析心情分布
    const moodDist = {};
    moods.forEach(m => { moodDist[m.moodType] = (moodDist[m.moodType] || 0) + 1; });

    // 测试风险
    const latestTest = tests[0];
    const riskLevel = latestTest?.riskResult?.riskLevel || 'low';

    // 生成报告
    const report = {
      period: `${startDate} ~ ${endDate}`,
      summary: {
        testCount: tests.length,
        diaryCount: diaries.length,
        moodCount: moods.length,
        chatCount: chats
      },
      emotion: {
        avgScore: Math.round(avgEmotion * 100),
        trend: emotionScores.length >= 2 ? (emotionScores[0] > emotionScores[emotionScores.length - 1] ? 'improving' : 'declining') : 'stable'
      },
      moodDistribution: moodDist,
      riskLevel,
      recommendations: generateWeeklyRecommendations(avgEmotion, riskLevel, moods.length, diaries.length)
    };

    res.json({ success: true, report });
  } catch (e) {
    console.error('生成周报失败:', e);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 生成个人月报
router.get('/report/monthly', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = now.toISOString().split('T')[0];

    // 获取本月数据
    const [tests, diaries, moods, chats, checkIns] = await Promise.all([
      MentalHealthTest.findAll({
        where: { userId, createdAt: { [Op.gte]: monthStart } },
        order: [['createdAt', 'DESC']]
      }).catch(() => []),
      DiaryEntry.findAll({
        where: { userId, entryDate: { [Op.between]: [monthStart, monthEnd] } }
      }).catch(() => []),
      MoodCheckIn.findAll({
        where: { userId, moodDate: { [Op.between]: [monthStart, monthEnd] } }
      }).catch(() => []),
      ChatHistory.count({
        where: { userId, createdAt: { [Op.gte]: monthStart } }
      }).catch(() => 0),
      require('../models/Achievement').CheckIn.count({
        where: { userId, checkInDate: { [Op.gte]: monthStart } }
      }).catch(() => 0)
    ]);

    // 分析情绪趋势
    const emotionScores = diaries.filter(d => d.emotionAnalysis?.emotionScore).map(d => d.emotionAnalysis.emotionScore);
    const avgEmotion = emotionScores.length > 0 ? emotionScores.reduce((a, b) => a + b, 0) / emotionScores.length : 0.5;

    // 分析心情分布
    const moodDist = {};
    moods.forEach(m => { moodDist[m.moodType] = (moodDist[m.moodType] || 0) + 1; });

    // 测试风险变化
    const riskHistory = tests.map(t => ({
      date: t.createdAt,
      riskLevel: t.riskResult?.riskLevel || 'low',
      score: t.riskResult?.finalScore || 0
    }));

    const latestTest = tests[0];
    const riskLevel = latestTest?.riskResult?.riskLevel || 'low';

    // 生成报告
    const report = {
      period: `${monthStart} ~ ${monthEnd}`,
      summary: {
        testCount: tests.length,
        diaryCount: diaries.length,
        moodCount: moods.length,
        chatCount: chats,
        checkInCount: checkIns
      },
      emotion: {
        avgScore: Math.round(avgEmotion * 100),
        trend: emotionScores.length >= 2 ? (emotionScores[0] > emotionScores[emotionScores.length - 1] ? 'improving' : 'declining') : 'stable'
      },
      moodDistribution: moodDist,
      riskHistory,
      riskLevel,
      recommendations: generateMonthlyRecommendations(avgEmotion, riskLevel, moods.length, diaries.length, checkIns)
    };

    res.json({ success: true, report });
  } catch (e) {
    console.error('生成月报失败:', e);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 生成管理员全局周报
router.get('/report/admin/weekly', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const startDate = weekStart.toISOString().split('T')[0];

    const [totalStudents, activeUsers, totalTests, highRiskUsers] = await Promise.all([
      Student.count().catch(() => 0),
      MentalHealthTest.count({
        distinct: true, col: 'userId',
        where: { createdAt: { [Op.gte]: startDate } }
      }).catch(() => 0),
      MentalHealthTest.count({
        where: { createdAt: { [Op.gte]: startDate } }
      }).catch(() => 0),
      MentalHealthTest.findAll({
        where: { createdAt: { [Op.gte]: startDate } },
        attributes: ['userId', 'riskResult'],
        raw: true
      }).then(tests => {
        const userRisk = {};
        tests.forEach(t => {
          if (!userRisk[t.userId] || new Date(t.createdAt) > new Date(userRisk[t.userId].date)) {
            userRisk[t.userId] = { date: t.createdAt, level: t.riskResult?.riskLevel || 'low' };
          }
        });
        return Object.values(userRisk).filter(u => u.level === 'high' || u.level === 'critical').length;
      }).catch(() => 0)
    ]);

    const report = {
      period: `${startDate} ~ ${now.toISOString().split('T')[0]}`,
      summary: {
        totalStudents,
        activeUsers,
        activeRate: totalStudents > 0 ? Math.round((activeUsers / totalStudents) * 100) : 0,
        totalTests,
        highRiskUsers
      }
    };

    res.json({ success: true, report });
  } catch (e) {
    console.error('生成管理员周报失败:', e);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 辅助函数
function generateWeeklyRecommendations(avgEmotion, riskLevel, moodCount, diaryCount) {
  const recs = [];
  if (avgEmotion < 0.4) recs.push({ type: 'warning', text: '本周情绪偏低，建议增加社交活动和户外运动' });
  if (riskLevel === 'high' || riskLevel === 'critical') recs.push({ type: 'alert', text: '近期测评风险较高，建议预约心理咨询' });
  if (moodCount < 3) recs.push({ type: 'suggestion', text: '坚持每日心情打卡，有助于情绪追踪' });
  if (diaryCount < 2) recs.push({ type: 'suggestion', text: '多写日记记录心情，系统会为您生成更准确的分析' });
  if (recs.length === 0) recs.push({ type: 'positive', text: '本周状态良好，继续保持！' });
  return recs;
}

function generateMonthlyRecommendations(avgEmotion, riskLevel, moodCount, diaryCount, checkInCount) {
  const recs = [];
  if (avgEmotion < 0.4) recs.push({ type: 'warning', text: '本月情绪整体偏低，建议关注自身心理健康' });
  if (riskLevel === 'high' || riskLevel === 'critical') recs.push({ type: 'alert', text: '本月测评显示较高风险，强烈建议寻求专业帮助' });
  if (moodCount < 10) recs.push({ type: 'suggestion', text: '增加心情打卡频率，养成每日记录习惯' });
  if (diaryCount < 8) recs.push({ type: 'suggestion', text: '坚持写日记，有助于情绪调节和自我认知' });
  if (checkInCount < 15) recs.push({ type: 'suggestion', text: '坚持每日签到，获取更多积分和成就' });
  if (recs.length === 0) recs.push({ type: 'positive', text: '本月表现优秀，心理健康状况良好！' });
  return recs;
}

module.exports = router;
