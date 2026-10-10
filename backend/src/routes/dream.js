const express = require('express');
const router = express.Router();
const axios = require('axios');
const config = require('../config');
const { authenticateToken } = require('../middleware/auth');

// 梦境符号知识库
const dreamSymbolDB = {
  // 负面风险类
  negative: {
    '坠落': { risk: 'high', label: '失控焦虑', desc: '安全感缺失、生活压力过载' },
    '溺水': { risk: 'high', label: '情感压抑', desc: '情绪无法宣泄、内心内耗' },
    '积水': { risk: 'high', label: '情感压抑', desc: '情绪无法宣泄、内心内耗' },
    '洪水': { risk: 'high', label: '情感压抑', desc: '情绪无法宣泄、内心内耗' },
    '考试': { risk: 'medium', label: '学业焦虑', desc: '自我否定、完美主义执念' },
    '迟到': { risk: 'medium', label: '职场焦虑', desc: '时间压力、自我否定' },
    '失误': { risk: 'medium', label: '完美主义', desc: '自我否定、焦虑' },
    '追逐': { risk: 'high', label: '逃避现实', desc: '人际恐惧、心理紧绷' },
    '躲藏': { risk: 'high', label: '逃避压力', desc: '不敢面对、心理紧绷' },
    '断裂': { risk: 'high', label: '心态失衡', desc: '信念动摇、情绪崩溃' },
    '坍塌': { risk: 'high', label: '心态失衡', desc: '信念动摇、情绪崩溃' },
    '破碎': { risk: 'high', label: '心态失衡', desc: '信念动摇、情绪崩溃' },
    '黑暗': { risk: 'medium', label: '情绪低落', desc: '内心迷茫、缺乏方向' },
    '孤独': { risk: 'medium', label: '社交焦虑', desc: '渴望连接、缺乏归属' },
    '争吵': { risk: 'medium', label: '人际冲突', desc: '沟通障碍、关系紧张' },
    '失败': { risk: 'medium', label: '自我否定', desc: '信心不足、焦虑' },
    '迷路': { risk: 'medium', label: '方向迷失', desc: '人生迷茫、缺乏目标' },
    '被追': { risk: 'high', label: '逃避压力', desc: '恐惧面对、心理紧绷' },
    '跌倒': { risk: 'medium', label: '失控焦虑', desc: '安全感缺失' },
    '被困': { risk: 'high', label: '压抑感', desc: '无法逃脱、情绪压抑' }
  },
  // 中性/正向类
  positive: {
    '阳光': { risk: 'low', label: '心态松弛', desc: '情绪稳定、心理状态良好' },
    '绿植': { risk: 'low', label: '生机勃勃', desc: '内心充满希望' },
    '奔跑': { risk: 'low', label: '释放自由', desc: '积极向上、充满活力' },
    '晴空': { risk: 'low', label: '心态开朗', desc: '心情愉悦、状态良好' },
    '飞翔': { risk: 'low', label: '自由释放', desc: '渴望突破、积极向上' },
    '花开': { risk: 'low', label: '希望萌发', desc: '新的开始、积极期待' },
    '旅行': { risk: 'low', label: '探索渴望', desc: '寻求变化、心态开放' },
    '成功': { risk: 'low', label: '自信满满', desc: '自我肯定、积极心态' },
    '温暖': { risk: 'low', label: '安全感', desc: '内心平和、被关爱' },
    '团聚': { risk: 'low', label: '归属感', desc: '渴望连接、情感满足' }
  }
};

// 文本预处理
function preprocessText(text) {
  // 去除多余空格和标点
  let cleaned = text.replace(/\s+/g, ' ').trim();
  // 去除无意义的语气词
  cleaned = cleaned.replace(/(啊|哦|嗯|呀|吧|呢|吗|啦)/g, '');
  return cleaned;
}

// 关键词识别
function extractKeywords(text) {
  const results = [];
  const allSymbols = { ...dreamSymbolDB.negative, ...dreamSymbolDB.positive };
  
  for (const [keyword, info] of Object.entries(allSymbols)) {
    if (text.includes(keyword)) {
      results.push({ keyword, ...info });
    }
  }
  
  return results;
}

// 风险评估
function assessRisk(keywords) {
  if (keywords.length === 0) {
    return { level: 'low', score: 0.1, label: '未识别明显风险' };
  }
  
  let riskScore = 0;
  keywords.forEach(k => {
    if (k.risk === 'high') riskScore += 0.3;
    else if (k.risk === 'medium') riskScore += 0.15;
    else riskScore += 0.05;
  });
  
  riskScore = Math.min(riskScore, 1);
  
  let level, label;
  if (riskScore >= 0.5) { level = 'high'; label = '重点关注'; }
  else if (riskScore >= 0.25) { level = 'medium'; label = '一般风险'; }
  else { level = 'low'; label = '低风险'; }
  
  return { level, score: riskScore, label };
}

// 生成干预建议
function generateInterventions(riskLevel, keywords) {
  const interventions = [];
  
  if (riskLevel === 'low') {
    interventions.push(
      { type: 'audio', title: '放松冥想音频', desc: '5分钟正念冥想，帮助放松身心' },
      { type: 'tip', title: '情绪调节小贴士', desc: '记录每天三件感恩的事，培养积极心态' }
    );
  } else if (riskLevel === 'medium') {
    interventions.push(
      { type: 'exercise', title: '正念呼吸训练', desc: '10分钟腹式呼吸练习，缓解焦虑' },
      { type: 'exercise', title: '渐进式肌肉放松', desc: '15分钟全身放松训练' },
      { type: 'guide', title: '情绪疏导指南', desc: '识别情绪触发点，学习健康表达方式' }
    );
  } else {
    interventions.push(
      { type: 'course', title: '心理调适专项课程', desc: '系统学习压力管理和情绪调节技巧' },
      { type: 'video', title: '心理科普短视频', desc: '了解焦虑、抑郁的成因与应对' },
      { type: 'alert', title: '温馨提示', desc: '建议持续关注心理状态，必要时可寻求专业心理辅导' }
    );
  }
  
  return interventions;
}

// 梦境解析API
router.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const { dreamText } = req.body;
    
    if (!dreamText || dreamText.trim().length === 0) {
      return res.status(400).json({ error: '请输入梦境内容' });
    }
    
    // 1. 文本预处理
    const cleanedText = preprocessText(dreamText);
    
    // 2. 关键词识别
    const keywords = extractKeywords(cleanedText);
    
    // 3. 风险评估
    const risk = assessRisk(keywords);
    
    // 4. 生成干预建议
    const interventions = generateInterventions(risk.level, keywords);
    
    // 5. 生成分析报告
    const report = {
      dreamText: dreamText,
      cleanedText: cleanedText,
      keywords: keywords,
      risk: risk,
      interventions: interventions,
      analysis: {
        coreElements: keywords.map(k => k.keyword).slice(0, 5),
        psychologicalProjection: keywords.map(k => `${k.keyword}=${k.label}`).join('；'),
        emotionState: risk.level === 'low' ? '情绪稳定' : risk.level === 'medium' ? '存在波动' : '需要关注',
        riskLevel: risk.level,
        riskLabel: risk.label,
        riskScore: Math.round(risk.score * 100)
      },
      timestamp: new Date().toISOString()
    };
    
    res.json({ success: true, report });
  } catch (error) {
    console.error('梦境解析失败:', error);
    res.status(500).json({ error: '解析失败，请稍后重试' });
  }
});

module.exports = router;
