const express = require('express');
const { Artwork } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const axios = require('axios');
const config = require('../config');

const router = express.Router();

// 保存绘画作品
router.post('/drawing', authenticateToken, async (req, res) => {
  try {
    const { imageData, metadata } = req.body;
    
    // 分析绘画作品
    const analysis = analyzeDrawing(imageData, metadata);
    
    // 生成疗愈任务
    const healingTask = generateHealingTask(analysis, 'drawing');
    
    // 保存作品
    const artwork = await Artwork.create({
      userId: req.user.id,
      artworkType: 'drawing',
      content: { imageData },
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString()
      },
      analysisResult: analysis,
      healingTask
    });

    res.json({
      success: true,
      artworkId: artwork.id,
      analysis,
      healingTask,
      message: '绘画作品保存成功'
    });
  } catch (error) {
    console.error('保存绘画作品失败:', error);
    res.status(500).json({ error: '保存作品失败' });
  }
});

// 保存音乐作品
router.post('/music', authenticateToken, async (req, res) => {
  try {
    const { musicData, metadata } = req.body;
    
    // 分析音乐作品
    const analysis = analyzeMusic(musicData, metadata);
    
    // 生成疗愈任务
    const healingTask = generateHealingTask(analysis, 'music');
    
    // 保存作品
    const artwork = await Artwork.create({
      userId: req.user.id,
      artworkType: 'music',
      content: { musicData },
      metadata: {
        ...metadata,
        createdAt: new Date().toISOString()
      },
      analysisResult: analysis,
      healingTask
    });

    res.json({
      success: true,
      artworkId: artwork.id,
      analysis,
      healingTask,
      message: '音乐作品保存成功'
    });
  } catch (error) {
    console.error('保存音乐作品失败:', error);
    res.status(500).json({ error: '保存作品失败' });
  }
});

// 获取用户作品历史
router.get('/history/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 验证权限
    if (parseInt(userId) !== req.user.id) {
      return res.status(403).json({ error: '无权访问' });
    }

    const artworks = await Artwork.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json({ artworks });
  } catch (error) {
    console.error('获取历史失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取分析历史
router.get('/analysis/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 验证权限
    if (parseInt(userId) !== req.user.id) {
      return res.status(403).json({ error: '无权访问' });
    }

    const analyses = await Artwork.findAll({
      where: { 
        userId: req.user.id,
        analysisResult: { [require('sequelize').Op.ne]: null }
      },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json({ analyses });
  } catch (error) {
    console.error('获取分析历史失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 辅助函数：分析绘画作品
function analyzeDrawing(imageData, metadata) {
  // 简化的绘画分析
  const colors = metadata?.colors || [];
  const brushStrokes = metadata?.brushStrokes || 0;
  const complexity = metadata?.complexity || 0;

  // 情绪分析
  let emotion = 'neutral';
  let emotionScore = 0.5;

  // 基于颜色分析情绪
  const warmColors = ['red', 'orange', 'yellow'];
  const coolColors = ['blue', 'green', 'purple'];
  const darkColors = ['black', 'gray', 'brown'];

  const warmCount = colors.filter(c => warmColors.some(wc => c.toLowerCase().includes(wc))).length;
  const coolCount = colors.filter(c => coolColors.some(cc => c.toLowerCase().includes(cc))).length;
  const darkCount = colors.filter(c => darkColors.some(dc => c.toLowerCase().includes(dc))).length;

  if (warmCount > coolCount && warmCount > darkCount) {
    emotion = 'positive';
    emotionScore = 0.7;
  } else if (darkCount > warmCount && darkCount > coolCount) {
    emotion = 'negative';
    emotionScore = 0.3;
  }

  return {
    emotion,
    emotionScore,
    dominantColors: colors.slice(0, 5),
    complexity,
    brushStrokes,
    analysis: `您的绘画作品显示出${emotion === 'positive' ? '积极' : emotion === 'negative' ? '需要关注' : '平衡'}的情绪状态。`,
    timestamp: new Date().toISOString()
  };
}

// 辅助函数：分析音乐作品
function analyzeMusic(musicData, metadata) {
  // 简化的音乐分析
  const tempo = metadata?.tempo || 120;
  const key = metadata?.key || 'C';
  const dynamics = metadata?.dynamics || 'medium';

  // 情绪分析
  let emotion = 'neutral';
  let emotionScore = 0.5;

  // 基于节奏分析情绪
  if (tempo > 120) {
    emotion = 'positive';
    emotionScore = 0.7;
  } else if (tempo < 80) {
    emotion = 'calm';
    emotionScore = 0.6;
  }

  // 基于调性分析情绪
  const majorKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  if (majorKeys.includes(key)) {
    emotionScore += 0.1;
  }

  return {
    emotion,
    emotionScore,
    tempo,
    key,
    dynamics,
    analysis: `您的音乐作品节奏为${tempo}BPM，调性为${key}调，显示出${emotion === 'positive' ? '活力' : emotion === 'calm' ? '平静' : '平衡'}的情绪状态。`,
    timestamp: new Date().toISOString()
  };
}

// 辅助函数：生成疗愈任务
function generateHealingTask(analysis, type) {
  const emotion = analysis.emotion;
  
  const taskTemplates = {
    drawing: {
      positive: {
        title: '积极情绪强化',
        description: '继续通过绘画表达您的积极情绪',
        activities: [
          '尝试使用更多明亮的颜色',
          '创作一系列表达快乐的作品',
          '与朋友分享您的创作'
        ],
        duration: '20-30分钟'
      },
      negative: {
        title: '情绪释放绘画',
        description: '通过绘画释放和表达负面情绪',
        activities: [
          '自由涂鸦，不担心结果',
          '使用冷色调表达内心感受',
          '创作完成后进行深呼吸放松'
        ],
        duration: '15-25分钟'
      },
      neutral: {
        title: '自我探索绘画',
        description: '通过绘画探索内心世界',
        activities: [
          '尝试抽象画，表达潜意识',
          '画出您理想中的自己',
          '记录绘画过程中的感受'
        ],
        duration: '20-30分钟'
      }
    },
    music: {
      positive: {
        title: '音乐情绪提升',
        description: '通过音乐延续和放大积极情绪',
        activities: [
          '创作节奏明快的旋律',
          '尝试即兴演奏',
          '录制您的音乐作品'
        ],
        duration: '25-35分钟'
      },
      negative: {
        title: '音乐疗愈',
        description: '通过音乐释放和转化负面情绪',
        activities: [
          '聆听舒缓的音乐',
          '尝试创作表达内心感受的旋律',
          '进行音乐冥想'
        ],
        duration: '20-30分钟'
      },
      neutral: {
        title: '音乐探索',
        description: '通过音乐探索新的情感体验',
        activities: [
          '尝试不同风格的音乐',
          '学习一首新曲子',
          '创作简单的旋律'
        ],
        duration: '20-30分钟'
      }
    }
  };

  const template = taskTemplates[type]?.[emotion] || taskTemplates[type]?.neutral;
  
  return {
    ...template,
    type,
    emotion,
    timestamp: new Date().toISOString()
  };
}

module.exports = router;
