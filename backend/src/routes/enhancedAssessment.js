const express = require('express');
const { MentalHealthTest, DiaryEntry, ChatHistory } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const aiService = require('../services/ai-service');
const assessmentService = require('../services/assessment-service');
const analysisService = require('../services/analysis-service');

const router = express.Router();

// 获取量表题目
router.get('/scale/:type', authenticateToken, (req, res) => {
  try {
    const { type } = req.params;
    const questions = assessmentService.getQuestions(type);
    
    if (!questions) {
      return res.status(400).json({ error: '不支持的量表类型' });
    }

    res.json({
      success: true,
      scale: type,
      ...questions
    });
  } catch (error) {
    console.error('获取量表失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 提交PHQ-9测评
router.post('/phq9', authenticateToken, async (req, res) => {
  try {
    const { answers } = req.body;

    if (!answers || answers.length !== 9) {
      return res.status(400).json({ error: '请完成所有9道题目' });
    }

    const result = assessmentService.scorePHQ9(answers);

    // 保存测试结果
    await MentalHealthTest.create({
      userId: req.user.id,
      testType: 'phq9',
      scl90Answers: answers,
      riskResult: {
        finalScore: result.totalScore / 27,
        riskLevel: result.riskLevel,
        phq9Result: result,
        timestamp: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('PHQ-9测评失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 提交GAD-7测评
router.post('/gad7', authenticateToken, async (req, res) => {
  try {
    const { answers } = req.body;

    if (!answers || answers.length !== 7) {
      return res.status(400).json({ error: '请完成所有7道题目' });
    }

    const result = assessmentService.scoreGAD7(answers);

    // 保存测试结果
    await MentalHealthTest.create({
      userId: req.user.id,
      testType: 'gad7',
      scl90Answers: answers,
      riskResult: {
        finalScore: result.totalScore / 21,
        riskLevel: result.riskLevel,
        gad7Result: result,
        timestamp: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('GAD-7测评失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 综合评估
router.post('/comprehensive', authenticateToken, async (req, res) => {
  try {
    const { scl90Answers, phq9Answers, gad7Answers, textInput } = req.body;

    // 文本分析
    let textAnalysis = null;
    if (textInput) {
      const emotion = aiService.analyzeEmotion(textInput);
      const risk = aiService.assessRisk(textInput, emotion);
      textAnalysis = { ...emotion, riskScore: risk.score, hasCrisis: risk.hasCrisis };
    }

    // 综合评估
    const result = assessmentService.comprehensiveAssessment(
      scl90Answers,
      phq9Answers,
      gad7Answers,
      textAnalysis
    );

    // 保存测试结果
    await MentalHealthTest.create({
      userId: req.user.id,
      testType: 'comprehensive',
      scl90Answers: scl90Answers || [],
      riskResult: {
        finalScore: result.overallScore,
        riskLevel: result.overallRisk,
        comprehensiveResult: result,
        timestamp: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('综合评估失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 增强版AI对话
router.post('/enhanced-chat', authenticateToken, async (req, res) => {
  try {
    const { message, sessionId, role } = req.body;

    if (!message) {
      return res.status(400).json({ error: '消息不能为空' });
    }

    const sid = sessionId || `session-${req.user.id}-${Date.now()}`;

    // 使用新的AI服务
    const result = await aiService.chat(message, sid, role || 'psychologist');

    // 分析情绪
    const emotion = aiService.analyzeEmotion(message);
    const risk = aiService.assessRisk(message, emotion);

    // 保存对话记录
    await ChatHistory.create({
      userId: req.user.id,
      sessionId: sid,
      moduleType: 'enhanced-chat',
      userMessage: message,
      aiResponse: result.response
    });

    res.json({
      success: true,
      response: result.response,
      sessionId: sid,
      analysis: {
        emotion: {
          score: emotion.score,
          label: emotion.label
        },
        risk: {
          level: risk.level,
          score: risk.score,
          hasCrisis: risk.hasCrisis
        }
      },
      context: result.context,
      fallback: result.fallback || false
    });
  } catch (error) {
    console.error('增强对话失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取综合报告
router.get('/report', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 获取测试历史
    const testResults = await MentalHealthTest.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    // 获取日记历史
    const diaryEntries = await DiaryEntry.findAll({
      where: { userId },
      order: [['entryDate', 'DESC']],
      limit: 30
    });

    // 获取对话历史
    const chatHistory = await ChatHistory.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    // 生成综合报告
    const report = analysisService.generateComprehensiveReport(
      userId,
      testResults,
      diaryEntries,
      chatHistory,
      [] // 行为数据
    );

    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('生成报告失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取情绪趋势
router.get('/emotion-trend', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const userId = req.user.id;

    // 获取日记情绪数据
    const diaryEntries = await DiaryEntry.findAll({
      where: { userId },
      order: [['entryDate', 'DESC']],
      limit: parseInt(days)
    });

    const emotionHistory = diaryEntries
      .filter(d => d.emotionAnalysis)
      .map(d => ({
        date: d.entryDate,
        score: d.emotionAnalysis.emotionScore || 0.5
      }));

    const trend = analysisService.analyzeEmotionTrend(emotionHistory, parseInt(days));

    res.json({
      success: true,
      trend
    });
  } catch (error) {
    console.error('获取情绪趋势失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取用户测评历史
router.get('/assessment-history', authenticateToken, async (req, res) => {
  try {
    const { type, limit = 20 } = req.query;
    const userId = req.user.id;

    const whereClause = { userId };
    if (type) {
      whereClause.testType = type;
    }

    const tests = await MentalHealthTest.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      tests
    });
  } catch (error) {
    console.error('获取测评历史失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
