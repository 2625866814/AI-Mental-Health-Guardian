const express = require('express');
const { AstrologyAnalysis } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const axios = require('axios');
const config = require('../config');

const router = express.Router();

// MBTI到星座特征的映射
const MBTI_ASTROLOGY_MAPPING = {
  'INTJ': { 
    '水瓶座': 0.85, '天蝎座': 0.78, '摩羯座': 0.72,
    traits: ['开放性高', '理性分析', '战略思维']
  },
  'INTP': { 
    '水瓶座': 0.88, '双子座': 0.75, '天秤座': 0.68,
    traits: ['开放性极高', '逻辑推理', '创新思维']
  },
  'ENTJ': { 
    '狮子座': 0.82, '白羊座': 0.76, '射手座': 0.70,
    traits: ['外向领导', '果断决策', '目标导向']
  },
  'ENTP': { 
    '双子座': 0.85, '白羊座': 0.78, '射手座': 0.72,
    traits: ['外向创新', '辩论能力', '灵活思维']
  },
  'INFJ': { 
    '双鱼座': 0.86, '巨蟹座': 0.79, '天蝎座': 0.74,
    traits: ['同理心强', '直觉洞察', '理想主义']
  },
  'INFP': { 
    '双鱼座': 0.84, '巨蟹座': 0.77, '天秤座': 0.71,
    traits: ['情感丰富', '价值观驱动', '创造性']
  },
  'ENFJ': { 
    '狮子座': 0.80, '天秤座': 0.75, '射手座': 0.69,
    traits: ['社交魅力', '组织能力', '激励他人']
  },
  'ENFP': { 
    '射手座': 0.83, '狮子座': 0.76, '双子座': 0.73,
    traits: ['热情洋溢', '创意无限', '人际敏感']
  },
  'ISTJ': { 
    '摩羯座': 0.87, '金牛座': 0.80, '处女座': 0.75,
    traits: ['责任心强', '细节导向', '传统稳定']
  },
  'ISFJ': { 
    '巨蟹座': 0.85, '金牛座': 0.78, '处女座': 0.72,
    traits: ['照顾他人', '忠诚可靠', '务实细致']
  },
  'ESTJ': { 
    '摩羯座': 0.82, '白羊座': 0.76, '狮子座': 0.70,
    traits: ['管理能力', '效率优先', '结构化思维']
  },
  'ESFJ': { 
    '天秤座': 0.84, '狮子座': 0.77, '巨蟹座': 0.71,
    traits: ['社交组织', '关怀他人', '和谐导向']
  },
  'ISTP': { 
    '水瓶座': 0.79, '天蝎座': 0.73, '摩羯座': 0.68,
    traits: ['动手能力', '逻辑分析', '适应变化']
  },
  'ISFP': { 
    '金牛座': 0.82, '巨蟹座': 0.75, '天秤座': 0.70,
    traits: ['艺术感知', '价值敏感', '温和友善']
  },
  'ESTP': { 
    '白羊座': 0.85, '射手座': 0.78, '狮子座': 0.72,
    traits: ['行动力强', '现实导向', '冒险精神']
  },
  'ESFP': { 
    '狮子座': 0.86, '射手座': 0.79, '双子座': 0.74,
    traits: ['表现力强', '享受当下', '人际活跃']
  }
};

// 星座心理特征
const ASTROLOGY_TRAITS = {
  '白羊座': { 
    '开放性': 0.85, '外向性': 0.90, '尽责性': 0.70,
    '宜人性': 0.60, '神经质': 0.40,
    description: '积极主动，充满活力，喜欢冒险和挑战'
  },
  '金牛座': { 
    '开放性': 0.55, '外向性': 0.65, '尽责性': 0.85,
    '宜人性': 0.80, '神经质': 0.45,
    description: '稳定可靠，注重实际，享受感官体验'
  },
  '双子座': { 
    '开放性': 0.90, '外向性': 0.85, '尽责性': 0.55,
    '宜人性': 0.70, '神经质': 0.50,
    description: '好奇心强，善于沟通，思维敏捷多变'
  },
  '巨蟹座': { 
    '开放性': 0.65, '外向性': 0.55, '尽责性': 0.75,
    '宜人性': 0.90, '神经质': 0.75,
    description: '情感丰富，照顾他人，重视安全感'
  },
  '狮子座': { 
    '开放性': 0.75, '外向性': 0.95, '尽责性': 0.70,
    '宜人性': 0.65, '神经质': 0.40,
    description: '自信热情，喜欢表现，天生领导者'
  },
  '处女座': { 
    '开放性': 0.70, '外向性': 0.60, '尽责性': 0.95,
    '宜人性': 0.75, '神经质': 0.70,
    description: '细致完美，注重细节，服务他人'
  },
  '天秤座': { 
    '开放性': 0.75, '外向性': 0.80, '尽责性': 0.65,
    '宜人性': 0.85, '神经质': 0.45,
    description: '追求和谐，善于协调，审美感强'
  },
  '天蝎座': { 
    '开放性': 0.80, '外向性': 0.65, '尽责性': 0.85,
    '宜人性': 0.55, '神经质': 0.80,
    description: '深度思考，情感强烈，洞察力强'
  },
  '射手座': { 
    '开放性': 0.88, '外向性': 0.85, '尽责性': 0.55,
    '宜人性': 0.70, '神经质': 0.35,
    description: '乐观开朗，追求自由，哲学思考'
  },
  '摩羯座': { 
    '开放性': 0.60, '外向性': 0.55, '尽责性': 0.95,
    '宜人性': 0.65, '神经质': 0.50,
    description: '务实稳重，目标明确，自律性强'
  },
  '水瓶座': { 
    '开放性': 0.95, '外向性': 0.70, '尽责性': 0.60,
    '宜人性': 0.75, '神经质': 0.40,
    description: '创新独立，人道主义，思维前卫'
  },
  '双鱼座': { 
    '开放性': 0.85, '外向性': 0.50, '尽责性': 0.60,
    '宜人性': 0.90, '神经质': 0.85,
    description: '富有同情心，直觉敏锐，艺术气质'
  }
};

// MBTI星座特征分析
router.post('/mbti', authenticateToken, async (req, res) => {
  try {
    const { mbtiType, userText } = req.body;

    if (!mbtiType) {
      return res.status(400).json({ error: 'MBTI类型不能为空' });
    }

    const mbtiUpper = mbtiType.toUpperCase();
    const mbtiData = MBTI_ASTROLOGY_MAPPING[mbtiUpper];

    if (!mbtiData) {
      return res.status(400).json({ 
        error: '不支持的MBTI类型',
        supportedTypes: Object.keys(MBTI_ASTROLOGY_MAPPING)
      });
    }

    // 计算匹配度
    const matches = Object.entries(mbtiData)
      .filter(([key]) => key !== 'traits')
      .map(([sign, score]) => ({
        sign,
        probability: Math.round(score * 100),
        traits: ASTROLOGY_TRAITS[sign]
      }))
      .sort((a, b) => b.probability - a.probability);

    const dominantSign = matches[0];
    const dominantTraits = ASTROLOGY_TRAITS[dominantSign.sign];

    const result = {
      mbtiType: mbtiUpper,
      topMatches: matches.slice(0, 3),
      dominantSign: dominantSign.sign,
      personalityTraits: mbtiData.traits,
      psychologicalProfile: {
        openness: dominantTraits.开放性,
        extraversion: dominantTraits.外向性,
        conscientiousness: dominantTraits.尽责性,
        agreeableness: dominantTraits.宜人性,
        neuroticism: dominantTraits.神经质
      },
      recommendation: `基于您的MBTI类型${mbtiUpper}，我们推荐关注${dominantSign.sign}的心理特质。您的主要优势是${mbtiData.traits.join('、')}，建议在${dominantTraits.description}方向发展。`
    };

    // 保存分析结果
    await AstrologyAnalysis.create({
      userId: req.user.id,
      mbtiType: mbtiUpper,
      analysisResult: result,
      analysisType: 'mbti-astrology'
    });

    res.json({
      success: true,
      data: result,
      message: 'MBTI星座特征分析完成'
    });
  } catch (error) {
    console.error('MBTI分析失败:', error);
    res.status(500).json({ error: '分析失败' });
  }
});

// 星盘测试
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const { birthDate, birthTime, birthPlace } = req.body;

    if (!birthDate || !birthTime || !birthPlace) {
      return res.status(400).json({ error: '请提供完整的出生信息' });
    }

    // 调用AI API生成星盘分析
    const analysis = await generateAstrologyAnalysis(birthDate, birthTime, birthPlace);

    // 保存分析结果
    await AstrologyAnalysis.create({
      userId: req.user.id,
      birthDate,
      birthTime,
      birthPlace,
      analysisResult: { analysis },
      analysisType: 'astrology-test'
    });

    res.json({
      success: true,
      data: { analysis },
      message: '星盘测试完成'
    });
  } catch (error) {
    console.error('星盘测试失败:', error);
    res.status(500).json({ error: '星盘测试失败' });
  }
});

// 获取分析历史
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const analyses = await AstrologyAnalysis.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json({ analyses });
  } catch (error) {
    console.error('获取历史失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 辅助函数：生成星盘分析
async function generateAstrologyAnalysis(birthDate, birthTime, birthPlace) {
  try {
    const response = await axios.post(config.ai.apiEndpoint, {
      model: config.ai.model,
      messages: [
        {
          role: 'system',
          content: '你是一位专业的占星师和心理学家，擅长将占星学与心理学结合，提供科学、有趣的分析。请基于用户的出生信息，生成一份详细的星盘分析报告，包括性格特点、优势、挑战和建议。'
        },
        {
          role: 'user',
          content: `请根据以下出生信息生成星盘分析：\n出生日期：${birthDate}\n出生时间：${birthTime}\n出生地点：${birthPlace}`
        }
      ],
      temperature: 0.7,
      max_completion_tokens: 1000
    }, {
      headers: {
        'api-key': config.ai.apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    }

    return '基于您的出生信息，我为您生成了星盘分析。您的性格特点包括...';
  } catch (error) {
    console.error('AI API调用失败:', error);
    return '基于您的出生信息，我为您生成了星盘分析。您的性格特点包括...';
  }
}

module.exports = router;
