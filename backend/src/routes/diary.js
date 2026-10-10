const express = require('express');
const { DiaryEntry } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const axios = require('axios');
const config = require('../config');
const { Op } = require('sequelize');

const router = express.Router();

// 保存日记
router.post('/save', authenticateToken, async (req, res) => {
  try {
    const { entryDate, morningText, afternoonText, eveningText } = req.body;

    if (!entryDate) {
      return res.status(400).json({ error: '日期不能为空' });
    }

    // 查找或创建日记条目
    const [entry, created] = await DiaryEntry.findOrCreate({
      where: {
        userId: req.user.id,
        entryDate
      },
      defaults: {
        morningText: morningText || '',
        afternoonText: afternoonText || '',
        eveningText: eveningText || ''
      }
    });

    if (!created) {
      // 更新现有条目
      entry.morningText = morningText || entry.morningText;
      entry.afternoonText = afternoonText || entry.afternoonText;
      entry.eveningText = eveningText || entry.eveningText;
      await entry.save();
    }

    res.json({
      success: true,
      entry,
      message: created ? '日记创建成功' : '日记更新成功'
    });
  } catch (error) {
    console.error('保存日记失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取日记历史
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;
    
    const whereClause = { userId: req.user.id };
    
    if (startDate && endDate) {
      whereClause.entryDate = {
        [Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      whereClause.entryDate = {
        [Op.gte]: startDate
      };
    } else if (endDate) {
      whereClause.entryDate = {
        [Op.lte]: endDate
      };
    }

    const entries = await DiaryEntry.findAll({
      where: whereClause,
      order: [['entryDate', 'DESC']],
      limit: parseInt(limit) || 30
    });

    res.json({ entries });
  } catch (error) {
    console.error('获取历史失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 分析日记情绪
router.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const { entryDate, text } = req.body;

    if (!text) {
      return res.status(400).json({ error: '文本内容不能为空' });
    }

    // 调用AI API进行情绪分析
    const analysis = await analyzeDiaryEmotion(text);

    // 更新日记条目的情绪分析
    if (entryDate) {
      const entry = await DiaryEntry.findOne({
        where: {
          userId: req.user.id,
          entryDate
        }
      });

      if (entry) {
        entry.emotionAnalysis = analysis;
        await entry.save();
      }
    }

    res.json({
      success: true,
      analysis,
      message: '情绪分析完成'
    });
  } catch (error) {
    console.error('分析日记失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取情绪趋势
router.get('/trend', authenticateToken, async (req, res) => {
  try {
    const { days } = req.query;
    const numDays = parseInt(days) || 7;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - numDays);
    
    const entries = await DiaryEntry.findAll({
      where: {
        userId: req.user.id,
        entryDate: {
          [Op.gte]: startDate.toISOString().split('T')[0]
        }
      },
      order: [['entryDate', 'ASC']]
    });

    // 计算情绪趋势
    const trend = entries.map(entry => ({
      date: entry.entryDate,
      emotion: entry.emotionAnalysis?.emotion || 'neutral',
      score: entry.emotionAnalysis?.emotionScore || 0.5
    }));

    // 计算平均情绪分数
    const avgScore = trend.length > 0 
      ? trend.reduce((sum, t) => sum + t.score, 0) / trend.length
      : 0.5;

    res.json({
      trend,
      averageScore: avgScore,
      totalEntries: entries.length
    });
  } catch (error) {
    console.error('获取趋势失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 辅助函数：分析日记情绪
async function analyzeDiaryEmotion(text) {
  try {
    const response = await axios.post(config.ai.apiEndpoint, {
      model: config.ai.model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的情绪分析专家，擅长从文本中分析情绪状态。请根据用户的日记内容，分析其情绪状态（positive、negative或neutral），并给出情绪分数（0-1）。'
        },
        {
          role: 'user',
          content: `请分析以下日记内容的情绪状态：\n\n${text}`
        }
      ],
      temperature: 0.3,
      max_completion_tokens: 200
    }, {
      headers: {
        'api-key': config.ai.apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const aiResponse = response.data.choices[0].message.content;
      
      // 解析AI响应
      let emotion = 'neutral';
      let emotionScore = 0.5;

      if (aiResponse.toLowerCase().includes('积极') || aiResponse.toLowerCase().includes('开心')) {
        emotion = 'positive';
        emotionScore = 0.7;
      } else if (aiResponse.toLowerCase().includes('消极') || aiResponse.toLowerCase().includes('难过')) {
        emotion = 'negative';
        emotionScore = 0.3;
      }

      return {
        emotion,
        emotionScore,
        aiAnalysis: aiResponse,
        timestamp: new Date().toISOString()
      };
    }

    // 默认分析
    return analyzeTextLocally(text);
  } catch (error) {
    console.error('AI API调用失败:', error);
    return analyzeTextLocally(text);
  }
}

// 本地文本分析（备用方案）
function analyzeTextLocally(text) {
  const lowerText = text.toLowerCase();
  
  // 关键词词典
  const positiveKeywords = ['开心', '快乐', '高兴', '愉快', '幸福', '满足', '兴奋', '期待'];
  const negativeKeywords = ['难过', '悲伤', '沮丧', '焦虑', '担心', '害怕', '愤怒', '疲惫'];
  
  let positiveCount = 0;
  let negativeCount = 0;

  positiveKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) positiveCount++;
  });

  negativeKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) negativeCount++;
  });

  let emotion = 'neutral';
  let emotionScore = 0.5;

  if (positiveCount > negativeCount) {
    emotion = 'positive';
    emotionScore = 0.5 + (positiveCount * 0.1);
  } else if (negativeCount > positiveCount) {
    emotion = 'negative';
    emotionScore = 0.5 - (negativeCount * 0.1);
  }

  return {
    emotion,
    emotionScore: Math.max(0, Math.min(1, emotionScore)),
    keywords: {
      positive: positiveCount,
      negative: negativeCount
    },
    timestamp: new Date().toISOString()
  };
}

module.exports = router;
