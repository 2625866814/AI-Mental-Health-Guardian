const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { StudentProfile, BehaviorData, PerceptionResult } = require('../models/Perception');
const { MentalHealthTest, DiaryEntry } = require('../models');

// 保存学生档案
router.post('/student-profile', authenticateToken, async (req, res) => {
  try {
    const { grade, major, college, dormitory, hometown, familySituation, financialStatus, relationshipStatus, academicRank } = req.body;
    
    const [profile, created] = await StudentProfile.findOrCreate({
      where: { userId: req.user.id },
      defaults: { grade, major, college, dormitory, hometown, familySituation, financialStatus, relationshipStatus, academicRank }
    });
    
    if (!created) {
      await profile.update({ grade, major, college, dormitory, hometown, familySituation, financialStatus, relationshipStatus, academicRank });
    }
    
    res.json({ success: true, profile });
  } catch (error) {
    console.error('保存学生档案失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取学生档案
router.get('/student-profile', authenticateToken, async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ where: { userId: req.user.id } });
    res.json({ profile: profile || {} });
  } catch (error) {
    console.error('获取学生档案失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 记录行为数据
router.post('/behavior', authenticateToken, async (req, res) => {
  try {
    const { dataType, dataValue } = req.body;
    
    await BehaviorData.create({
      userId: req.user.id,
      dataType,
      dataValue,
      recordedAt: new Date()
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('记录行为数据失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取多维度感知结果
router.get('/perception', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 1. 量表感知 - 获取最近测试结果
    const latestTest = await MentalHealthTest.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
    const testScore = latestTest?.riskResult?.finalScore || 0;
    
    // 2. 文本感知 - 获取最近日记情绪
    const latestDiary = await DiaryEntry.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
    const textScore = latestDiary?.emotionAnalysis?.emotionScore || 0.5;
    
    // 3. 行为感知 - 获取行为数据
    const behaviorData = await BehaviorData.findAll({
      where: { userId },
      order: [['recordedAt', 'DESC']],
      limit: 10
    });
    const behaviorScore = calculateBehaviorScore(behaviorData);
    
    // 4. 社交感知 - 占位
    const socialScore = 0.5;
    
    // 综合分析
    const overallScore = (testScore * 0.4 + textScore * 0.3 + behaviorScore * 0.2 + socialScore * 0.1);
    const riskLevel = overallScore > 0.7 ? 'high' : overallScore > 0.4 ? 'medium' : 'low';
    
    // 保存结果
    const result = await PerceptionResult.create({
      userId,
      textScore,
      behaviorScore,
      testScore,
      socialScore,
      overallScore,
      riskLevel,
      analysisReport: generateAnalysis(textScore, behaviorScore, testScore, socialScore)
    });
    
    res.json({ perception: result });
  } catch (error) {
    console.error('获取感知结果失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取感知历史
router.get('/perception/history', authenticateToken, async (req, res) => {
  try {
    const results = await PerceptionResult.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 30
    });
    res.json({ results });
  } catch (error) {
    console.error('获取感知历史失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 管理员：获取所有学生感知概览
router.get('/admin/overview', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    
    const { User } = require('../models');
    const users = await User.findAll({ attributes: ['id', 'username'] });
    
    const overview = [];
    for (const user of users.slice(0, 50)) {
      const latest = await PerceptionResult.findOne({
        where: { userId: user.id },
        order: [['createdAt', 'DESC']]
      });
      if (latest) {
        overview.push({
          userId: user.id,
          username: user.username,
          overallScore: latest.overallScore,
          riskLevel: latest.riskLevel,
          testScore: latest.testScore,
          textScore: latest.textScore,
          behaviorScore: latest.behaviorScore,
          socialScore: latest.socialScore,
          date: latest.createdAt
        });
      }
    }
    
    // 按综合分数排序，高风险在前
    overview.sort((a, b) => b.overallScore - a.overallScore);
    
    res.json({ overview });
  } catch (error) {
    console.error('获取概览失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

function calculateBehaviorScore(behaviorData) {
  if (!behaviorData || behaviorData.length === 0) return 0.5;
  // 简化计算：基于行为数据的规律性
  const values = behaviorData.map(d => d.dataValue?.score || 0.5);
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function generateAnalysis(textScore, behaviorScore, testScore, socialScore) {
  const analysis = [];
  if (textScore < 0.3) analysis.push('文本情绪偏低，需关注');
  if (behaviorScore < 0.3) analysis.push('行为模式异常，建议关注作息规律');
  if (testScore > 0.7) analysis.push('量表评估风险较高，建议专业干预');
  if (socialScore < 0.3) analysis.push('社交活跃度低，建议增加社交活动');
  
  return {
    summary: analysis.length > 0 ? analysis.join('；') : '各维度指标正常，继续保持',
    dimensions: { text: textScore, behavior: behaviorScore, test: testScore, social: socialScore }
  };
}

module.exports = router;
