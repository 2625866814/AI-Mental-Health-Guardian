const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { User } = require('../models');
const { Student, AcademicRecord, BehaviorRecord, PsychologicalRecord, LifeRecord } = require('../models/CampusData');
const { MentalHealthTest, DiaryEntry, ChatHistory } = require('../models');
const { Achievement, UserAchievement, CheckIn, UserPoints } = require('../models/Achievement');
const { Op, fn, col, literal } = require('sequelize');

// 大屏概览数据
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    const [
      totalStudents,
      totalUsers,
      todayActive,
      weekActive,
      totalTests,
      totalDiary,
      totalChat,
      riskStats,
      collegeStats,
      recentAlerts
    ] = await Promise.all([
      // 学生总数
      Student.count().catch(() => 0),
      // 用户总数
      User.count().catch(() => 0),
      // 今日活跃（今日有测试/日记/对话的用户）
      MentalHealthTest.count({
        distinct: true,
        col: 'userId',
        where: { createdAt: { [Op.gte]: today } }
      }).catch(() => 0),
      // 本周活跃
      MentalHealthTest.count({
        distinct: true,
        col: 'userId',
        where: { createdAt: { [Op.gte]: weekAgo } }
      }).catch(() => 0),
      // 测试总数
      MentalHealthTest.count().catch(() => 0),
      // 日记总数
      DiaryEntry.count().catch(() => 0),
      // 对话总数
      ChatHistory.count().catch(() => 0),
      // 风险分布
      MentalHealthTest.findAll({
        attributes: [
          [fn('MAX', col('id')), 'latestId'],
          'userId'
        ],
        group: ['userId'],
        raw: true
      }).then(async (latestTests) => {
        const ids = latestTests.map(t => t.latestId);
        if (ids.length === 0) return { low: 0, medium: 0, high: 0, critical: 0 };
        const tests = await MentalHealthTest.findAll({
          where: { id: { [Op.in]: ids } },
          attributes: ['riskResult'],
          raw: true
        });
        const dist = { low: 0, medium: 0, high: 0, critical: 0 };
        tests.forEach(t => {
          const level = t.riskResult?.riskLevel || 'low';
          dist[level] = (dist[level] || 0) + 1;
        });
        return dist;
      }).catch(() => ({ low: 0, medium: 0, high: 0, critical: 0 })),
      // 学院分布
      Student.findAll({
        attributes: ['college', [fn('COUNT', col('id')), 'count']],
        group: ['college'],
        raw: true,
        order: [[literal('count'), 'DESC']],
        limit: 10
      }).catch(() => []),
      // 最近高危预警
      MentalHealthTest.findAll({
        where: {
          createdAt: { [Op.gte]: weekAgo }
        },
        order: [['createdAt', 'DESC']],
        limit: 100,
        raw: true
      }).then(tests => {
        return tests
          .filter(t => t.riskResult?.riskLevel === 'high' || t.riskResult?.riskLevel === 'critical')
          .slice(0, 10);
      }).catch(() => [])
    ]);

    res.json({
      success: true,
      overview: {
        students: totalStudents,
        users: totalUsers,
        todayActive,
        weekActive,
        tests: totalTests,
        diary: totalDiary,
        chat: totalChat
      },
      riskDistribution: riskStats,
      collegeDistribution: collegeStats,
      recentAlerts
    });
  } catch (e) {
    console.error('获取大屏数据失败:', e);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 趋势数据（最近30天）
router.get('/trends', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - parseInt(days) * 86400000).toISOString().split('T')[0];

    // 每日测试数
    const dailyTests = await MentalHealthTest.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('id')), 'count']
      ],
      where: { createdAt: { [Op.gte]: startDate } },
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true
    }).catch(() => []);

    // 每日日记数
    const dailyDiary = await DiaryEntry.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('id')), 'count']
      ],
      where: { createdAt: { [Op.gte]: startDate } },
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true
    }).catch(() => []);

    // 每日对话数
    const dailyChat = await ChatHistory.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('id')), 'count']
      ],
      where: { createdAt: { [Op.gte]: startDate } },
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true
    }).catch(() => []);

    // 每日签到数
    const dailyCheckIn = await CheckIn.findAll({
      attributes: [
        'checkInDate',
        [fn('COUNT', col('id')), 'count']
      ],
      where: { checkInDate: { [Op.gte]: startDate } },
      group: ['checkInDate'],
      order: [['checkInDate', 'ASC']],
      raw: true
    }).catch(() => []);

    res.json({
      success: true,
      trends: {
        tests: dailyTests,
        diary: dailyDiary,
        chat: dailyChat,
        checkIn: dailyCheckIn
      }
    });
  } catch (e) {
    console.error('获取趋势数据失败:', e);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 情绪分布统计
router.get('/emotion-stats', authenticateToken, async (req, res) => {
  try {
    const diaries = await DiaryEntry.findAll({
      where: {
        emotionAnalysis: { [Op.ne]: null }
      },
      attributes: ['emotionAnalysis'],
      raw: true
    }).catch(() => []);

    const emotionDist = { positive: 0, neutral: 0, negative: 0 };
    diaries.forEach(d => {
      const emotion = d.emotionAnalysis?.emotion || 'neutral';
      emotionDist[emotion] = (emotionDist[emotion] || 0) + 1;
    });

    res.json({ success: true, emotionDistribution: emotionDist });
  } catch (e) {
    console.error('获取情绪统计失败:', e);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 学院风险对比
router.get('/college-risk', authenticateToken, async (req, res) => {
  try {
    const students = await Student.findAll({
      attributes: ['id', 'studentId', 'college'],
      raw: true
    }).catch(() => []);

    if (students.length === 0) {
      return res.json({ success: true, collegeRisk: [] });
    }

    const studentIds = students.map(s => s.studentId);
    const collegeMap = {};
    students.forEach(s => {
      collegeMap[s.studentId] = s.college || '未知';
    });

    // 获取每个学生的最新测试
    const latestTests = await MentalHealthTest.findAll({
      where: { userId: { [Op.in]: studentIds } },
      order: [['createdAt', 'DESC']],
      raw: true
    }).catch(() => []);

    // 按学院统计风险
    const collegeRisk = {};
    const processedUsers = new Set();
    latestTests.forEach(t => {
      if (processedUsers.has(t.userId)) return;
      processedUsers.add(t.userId);
      
      const college = collegeMap[t.userId] || '未知';
      if (!collegeRisk[college]) {
        collegeRisk[college] = { total: 0, low: 0, medium: 0, high: 0, critical: 0 };
      }
      collegeRisk[college].total++;
      const level = t.riskResult?.riskLevel || 'low';
      collegeRisk[college][level]++;
    });

    const result = Object.entries(collegeRisk)
      .map(([name, data]) => ({
        name,
        ...data,
        riskRate: Math.round(((data.high + data.critical) / data.total) * 100)
      }))
      .sort((a, b) => b.riskRate - a.riskRate)
      .slice(0, 10);

    res.json({ success: true, collegeRisk: result });
  } catch (e) {
    console.error('获取学院风险数据失败:', e);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 成就统计
router.get('/achievement-stats', authenticateToken, async (req, res) => {
  try {
    const [
      totalAchievements,
      totalUnlocked,
      topUsers
    ] = await Promise.all([
      Achievement.count().catch(() => 0),
      UserAchievement.count().catch(() => 0),
      UserPoints.findAll({
        order: [['totalPoints', 'DESC']],
        limit: 10,
        include: [{ model: User, attributes: ['username'] }],
        raw: true
      }).catch(() => [])
    ]);

    res.json({
      success: true,
      achievementStats: {
        totalAchievements,
        totalUnlocked,
        topUsers
      }
    });
  } catch (e) {
    console.error('获取成就统计失败:', e);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
