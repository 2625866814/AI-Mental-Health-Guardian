const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { Achievement, UserAchievement, CheckIn, UserPoints, PointsHistory } = require('../models/Achievement');
const { MentalHealthTest, DiaryEntry, ChatHistory } = require('../models');
const { Op } = require('sequelize');

// 成就定义
const ACHIEVEMENTS = [
  // 测试相关
  { code: 'first_test', name: '初次探索', description: '完成第一次心理测试', icon: '🧪', category: '测试', points: 20, rarity: 'common', condition: { type: 'test_count', value: 1 } },
  { code: 'test_5', name: '自我关注', description: '完成5次心理测试', icon: '📊', category: '测试', points: 50, rarity: 'uncommon', condition: { type: 'test_count', value: 5 } },
  { code: 'test_10', name: '心理达人', description: '完成10次心理测试', icon: '🏆', category: '测试', points: 100, rarity: 'rare', condition: { type: 'test_count', value: 10 } },
  { code: 'test_all_types', name: '全能测评', description: '完成SCL-90、PHQ-9、GAD-7三种测试', icon: '🌈', category: '测试', points: 80, rarity: 'rare', condition: { type: 'test_types', value: 3 } },
  
  // 日记相关
  { code: 'first_diary', name: '心灵日记', description: '写下第一篇日记', icon: '📝', category: '日记', points: 15, rarity: 'common', condition: { type: 'diary_count', value: 1 } },
  { code: 'diary_7', name: '记录一周', description: '连续7天写日记', icon: '📅', category: '日记', points: 60, rarity: 'uncommon', condition: { type: 'diary_streak', value: 7 } },
  { code: 'diary_30', name: '月度坚持', description: '连续30天写日记', icon: '🌟', category: '日记', points: 200, rarity: 'epic', condition: { type: 'diary_streak', value: 30 } },
  { code: 'diary_100', name: '百日修行', description: '累计写100篇日记', icon: '💎', category: '日记', points: 500, rarity: 'legendary', condition: { type: 'diary_count', value: 100 } },
  
  // 签到相关
  { code: 'first_checkin', name: '每日打卡', description: '第一次签到', icon: '✅', category: '签到', points: 5, rarity: 'common', condition: { type: 'checkin_count', value: 1 } },
  { code: 'checkin_7', name: '周签到达人', description: '连续签到7天', icon: '🔥', category: '签到', points: 40, rarity: 'uncommon', condition: { type: 'checkin_streak', value: 7 } },
  { code: 'checkin_30', name: '月签到王', description: '连续签到30天', icon: '👑', category: '签到', points: 150, rarity: 'epic', condition: { type: 'checkin_streak', value: 30 } },
  { code: 'checkin_100', name: '百日坚持', description: '连续签到100天', icon: '🏆', category: '签到', points: 500, rarity: 'legendary', condition: { type: 'checkin_streak', value: 100 } },
  
  // 对话相关
  { code: 'first_chat', name: '初次对话', description: '第一次与AI对话', icon: '💬', category: '对话', points: 10, rarity: 'common', condition: { type: 'chat_count', value: 1 } },
  { code: 'chat_50', name: '话匣子', description: '与AI对话50次', icon: '🗣️', category: '对话', points: 80, rarity: 'uncommon', condition: { type: 'chat_count', value: 50 } },
  { code: 'chat_200', name: '知心朋友', description: '与AI对话200次', icon: '❤️', category: '对话', points: 200, rarity: 'rare', condition: { type: 'chat_count', value: 200 } },
  
  // 特殊成就
  { code: 'night_owl', name: '夜猫子', description: '在凌晨0-6点使用系统', icon: '🦉', category: '特殊', points: 15, rarity: 'uncommon', condition: { type: 'night_usage' } },
  { code: 'early_bird', name: '早起鸟', description: '在早上5-7点使用系统', icon: '🐦', category: '特殊', points: 15, rarity: 'uncommon', condition: { type: 'morning_usage' } },
  { code: 'weekend_warrior', name: '周末战士', description: '在周末完成测试', icon: '⚔️', category: '特殊', points: 10, rarity: 'common', condition: { type: 'weekend_usage' } },
  { code: 'improving', name: '进步之星', description: '连续两次测试分数提高', icon: '📈', category: '特殊', points: 100, rarity: 'rare', condition: { type: 'improving_trend' } }
];

// 初始化成就数据
async function initAchievements() {
  for (const a of ACHIEVEMENTS) {
    await Achievement.findOrCreate({
      where: { code: a.code },
      defaults: a
    });
  }
}

// 检查并解锁成就
async function checkAchievements(userId) {
  const unlocked = [];
  const existing = await UserAchievement.findAll({ where: { userId } });
  const existingCodes = existing.map(e => e.achievementId);
  const allAchievements = await Achievement.findAll();

  // 获取用户数据
  const [testCount, diaryCount, chatCount, checkInData, pointsData] = await Promise.all([
    MentalHealthTest.count({ where: { userId } }),
    DiaryEntry.count({ where: { userId } }),
    ChatHistory.count({ where: { userId } }),
    CheckIn.findOne({ where: { userId } }),
    UserPoints.findOne({ where: { userId } })
  ]);

  // 获取测试类型
  const testTypes = await MentalHealthTest.findAll({
    where: { userId },
    attributes: ['testType'],
    group: ['testType']
  });

  for (const achievement of allAchievements) {
    if (existingCodes.includes(achievement.id)) continue;

    let earned = false;
    const cond = achievement.condition;

    switch (cond.type) {
      case 'test_count':
        earned = testCount >= cond.value;
        break;
      case 'diary_count':
        earned = diaryCount >= cond.value;
        break;
      case 'chat_count':
        earned = chatCount >= cond.value;
        break;
      case 'checkin_count':
        earned = pointsData && pointsData.streak >= 1;
        break;
      case 'checkin_streak':
        earned = pointsData && pointsData.maxStreak >= cond.value;
        break;
      case 'diary_streak':
        // 检查连续写日记天数
        const recentDiaries = await DiaryEntry.findAll({
          where: { userId },
          order: [['entryDate', 'DESC']],
          limit: cond.value
        });
        if (recentDiaries.length >= cond.value) {
          let streak = true;
          for (let i = 0; i < recentDiaries.length - 1; i++) {
            const d1 = new Date(recentDiaries[i].entryDate);
            const d2 = new Date(recentDiaries[i + 1].entryDate);
            const diff = (d1 - d2) / (1000 * 60 * 60 * 24);
            if (diff !== 1) { streak = false; break; }
          }
          earned = streak;
        }
        break;
      case 'test_types':
        earned = testTypes.length >= cond.value;
        break;
      case 'night_usage':
        const hour = new Date().getHours();
        earned = hour >= 0 && hour < 6;
        break;
      case 'morning_usage':
        const mHour = new Date().getHours();
        earned = mHour >= 5 && mHour < 7;
        break;
      case 'weekend_usage':
        const day = new Date().getDay();
        earned = day === 0 || day === 6;
        break;
      case 'improving_trend':
        const recentTests = await MentalHealthTest.findAll({
          where: { userId },
          order: [['createdAt', 'DESC']],
          limit: 3
        });
        if (recentTests.length >= 3) {
          const s1 = recentTests[0].riskResult?.finalScore || 0;
          const s2 = recentTests[1].riskResult?.finalScore || 0;
          const s3 = recentTests[2].riskResult?.finalScore || 0;
          earned = s1 > s2 && s2 > s3;
        }
        break;
    }

    if (earned) {
      await UserAchievement.create({ userId, achievementId: achievement.id });
      await addPoints(userId, achievement.points, 'achievement', `解锁成就: ${achievement.name}`);
      unlocked.push(achievement);
    }
  }

  return unlocked;
}

// 添加积分
async function addPoints(userId, points, source, description) {
  const [userPoints] = await UserPoints.findOrCreate({
    where: { userId },
    defaults: { totalPoints: 0, level: 1, streak: 0, maxStreak: 0 }
  });

  userPoints.totalPoints += points;
  userPoints.level = Math.floor(Math.sqrt(userPoints.totalPoints / 100)) + 1;
  await userPoints.save();

  await PointsHistory.create({ userId, points, source, description });
}

// ========== API ==========

// 签到
router.post('/checkin', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // 检查今天是否已签到
    const existing = await CheckIn.findOne({
      where: { userId, checkInDate: today }
    });

    if (existing) {
      return res.json({ success: false, message: '今天已经签到过了' });
    }

    // 获取昨天签到记录，计算连续天数
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const lastCheckIn = await CheckIn.findOne({
      where: { userId, checkInDate: yesterday }
    });

    const streak = lastCheckIn ? lastCheckIn.streak + 1 : 1;
    const points = 5 + Math.min(streak, 7) * 2; // 连续签到加分

    await CheckIn.create({
      userId,
      checkInDate: today,
      streak,
      points
    });

    await addPoints(userId, points, 'checkin', `连续签到${streak}天`);

    // 更新用户积分记录
    const [userPoints] = await UserPoints.findOrCreate({
      where: { userId },
      defaults: { totalPoints: 0, level: 1, streak: 0, maxStreak: 0 }
    });
    userPoints.streak = streak;
    userPoints.maxStreak = Math.max(userPoints.maxStreak, streak);
    userPoints.lastCheckIn = today;
    await userPoints.save();

    // 检查成就
    const newAchievements = await checkAchievements(userId);

    res.json({
      success: true,
      streak,
      points,
      newAchievements
    });
  } catch (e) {
    console.error('签到失败:', e);
    res.status(500).json({ error: '签到失败' });
  }
});

// 获取用户积分和等级
router.get('/points', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [userPoints] = await UserPoints.findOrCreate({
      where: { userId },
      defaults: { totalPoints: 0, level: 1, streak: 0, maxStreak: 0 }
    });

    // 获取今日签到状态
    const today = new Date().toISOString().split('T')[0];
    const todayCheckIn = await CheckIn.findOne({
      where: { userId, checkInDate: today }
    });

    // 获取积分历史
    const history = await PointsHistory.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    // 计算下一级所需积分
    const nextLevelPoints = Math.pow(userPoints.level, 2) * 100;
    const currentLevelPoints = Math.pow(userPoints.level - 1, 2) * 100;
    const progress = (userPoints.totalPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints);

    res.json({
      success: true,
      points: {
        ...userPoints.toJSON(),
        todayCheckedIn: !!todayCheckIn,
        nextLevelPoints,
        progress: Math.min(1, Math.max(0, progress))
      },
      history
    });
  } catch (e) {
    console.error('获取积分失败:', e);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取用户成就列表
router.get('/achievements', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 检查新成就
    await checkAchievements(userId);

    const [allAchievements, userAchievements] = await Promise.all([
      Achievement.findAll({ order: [['category', 'ASC'], ['points', 'ASC']] }),
      UserAchievement.findAll({ where: { userId } })
    ]);

    const unlockedIds = userAchievements.map(ua => ua.achievementId);

    const achievements = allAchievements.map(a => ({
      ...a.toJSON(),
      unlocked: unlockedIds.includes(a.id),
      unlockedAt: userAchievements.find(ua => ua.achievementId === a.id)?.unlockedAt
    }));

    // 统计
    const stats = {
      total: allAchievements.length,
      unlocked: unlockedIds.length,
      percentage: Math.round(unlockedIds.length / allAchievements.length * 100)
    };

    res.json({ success: true, achievements, stats });
  } catch (e) {
    console.error('获取成就失败:', e);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取签到日历
router.get('/checkin-calendar', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { month } = req.query; // YYYY-MM

    const startDate = month ? `${month}-01` : new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const endDate = month ? `${month}-31` : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];

    const checkIns = await CheckIn.findAll({
      where: {
        userId,
        checkInDate: { [Op.between]: [startDate, endDate] }
      },
      order: [['checkInDate', 'ASC']]
    });

    res.json({ success: true, checkIns });
  } catch (e) {
    console.error('获取签到日历失败:', e);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 初始化成就数据
initAchievements().catch(console.error);

module.exports = router;
