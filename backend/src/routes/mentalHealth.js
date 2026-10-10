const express = require('express');
const { MentalHealthTest, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const axios = require('axios');
const config = require('../config');

const router = express.Router();

// SCL-90量表定义
const SCL90_QUESTIONS = [
  { id: 1, text: "头痛", category: "躯体化" },
  { id: 2, text: "神经过敏，心中不踏实", category: "焦虑" },
  { id: 3, text: "头脑中有不必要的想法或字句盘旋", category: "强迫症状" },
  { id: 4, text: "头晕或昏倒", category: "躯体化" },
  { id: 5, text: "对异性的兴趣减退", category: "抑郁" },
  { id: 6, text: "对旁人责备求全", category: "人际关系敏感" },
  { id: 7, text: "感到别人能控制您的思想", category: "偏执" },
  { id: 8, text: "责怪别人制造麻烦", category: "敌对" },
  { id: 9, text: "忘记性大", category: "抑郁" },
  { id: 10, text: "担心自己的衣饰整齐及仪态的端正", category: "焦虑" },
  { id: 11, text: "容易烦恼和激动", category: "敌对" },
  { id: 12, text: "胸痛", category: "躯体化" },
  { id: 13, text: "害怕空旷的场所或街道", category: "恐怖" },
  { id: 14, text: "感到自己的精力下降，活动减慢", category: "抑郁" },
  { id: 15, text: "想结束自己的生命", category: "抑郁" },
  { id: 16, text: "听到别人听不到的声音", category: "精神病性" },
  { id: 17, text: "发抖", category: "躯体化" },
  { id: 18, text: "感到大多数人都不可信任", category: "偏执" },
  { id: 19, text: "胃口不好", category: "躯体化" },
  { id: 20, text: "容易哭泣", category: "抑郁" },
  { id: 21, text: "同异性相处时感到害羞不自在", category: "人际关系敏感" },
  { id: 22, text: "感到受骗，中了圈套或有人想抓住您", category: "偏执" },
  { id: 23, text: "无缘无故地突然感到害怕", category: "恐怖" },
  { id: 24, text: "自己不能控制地大发脾气", category: "敌对" },
  { id: 25, text: "怕单独出门", category: "恐怖" },
  { id: 26, text: "经常责怪自己", category: "抑郁" },
  { id: 27, text: "腰痛", category: "躯体化" },
  { id: 28, text: "感到难以完成任务", category: "抑郁" },
  { id: 29, text: "感到孤独", category: "抑郁" },
  { id: 30, text: "感到苦闷", category: "抑郁" },
  { id: 31, text: "过分担忧", category: "焦虑" },
  { id: 32, text: "对事物不感兴趣", category: "抑郁" },
  { id: 33, text: "感到害怕", category: "恐怖" },
  { id: 34, text: "您的感情容易受到伤害", category: "人际关系敏感" },
  { id: 35, text: "旁人能知道您的私下想法", category: "精神病性" },
  { id: 36, text: "感到别人不理解您、不同情您", category: "人际关系敏感" },
  { id: 37, text: "感到人们对您不友好，不喜欢您", category: "人际关系敏感" },
  { id: 38, text: "做事必须做得很慢以保证做得正确", category: "强迫症状" },
  { id: 39, text: "心跳得很厉害", category: "躯体化" },
  { id: 40, text: "恶心或胃部不舒服", category: "躯体化" },
  { id: 41, text: "肌肉酸痛", category: "躯体化" },
  { id: 42, text: "感到周围的事物都很陌生", category: "精神病性" },
  { id: 43, text: "感到要赶快把事情做完", category: "焦虑" },
  { id: 44, text: "不能集中注意力", category: "抑郁" },
  { id: 45, text: "感到身体的某一部分软弱无力", category: "躯体化" },
  { id: 46, text: "感到紧张或被激怒", category: "焦虑" },
  { id: 47, text: "感到手或脚发重", category: "躯体化" },
  { id: 48, text: "感到死亡的恐惧", category: "恐怖" },
  { id: 49, text: "吃得太多", category: "躯体化" },
  { id: 50, text: "当别人想到您时感到不愉快", category: "人际关系敏感" },
  { id: 51, text: "入睡困难", category: "睡眠障碍" },
  { id: 52, text: "做事必须反复检查", category: "强迫症状" },
  { id: 53, text: "难以作出决定", category: "抑郁" },
  { id: 54, text: "怕乘电车、公共汽车、地铁或火车", category: "恐怖" },
  { id: 55, text: "呼吸有困难", category: "躯体化" },
  { id: 56, text: "感到一阵阵发冷或发热", category: "躯体化" },
  { id: 57, text: "因为感到害怕而避开某些东西、场合或活动", category: "恐怖" },
  { id: 58, text: "感到身体的某一部分有异样感", category: "躯体化" },
  { id: 59, text: "感到自己有罪", category: "抑郁" },
  { id: 60, text: "生活规律被打乱", category: "睡眠障碍" },
  { id: 61, text: "难以入睡", category: "睡眠障碍" },
  { id: 62, text: "做事必须反复核对", category: "强迫症状" },
  { id: 63, text: "难以集中精力", category: "抑郁" },
  { id: 64, text: "感到身体的某一部分肿胀", category: "躯体化" },
  { id: 65, text: "感到事情变得越来越糟", category: "抑郁" },
  { id: 66, text: "感到自己没有价值", category: "抑郁" },
  { id: 67, text: "感到自己是个负担", category: "抑郁" },
  { id: 68, text: "感到自己是个失败者", category: "抑郁" },
  { id: 69, text: "感到自己没有前途", category: "抑郁" },
  { id: 70, text: "感到自己没有希望", category: "抑郁" },
  { id: 71, text: "感到自己没有能力", category: "抑郁" },
  { id: 72, text: "感到自己没有用", category: "抑郁" },
  { id: 73, text: "感到自己没有吸引力", category: "抑郁" },
  { id: 74, text: "感到自己没有魅力", category: "抑郁" },
  { id: 75, text: "感到自己没有吸引力", category: "抑郁" },
  { id: 76, text: "感到自己没有价值", category: "抑郁" },
  { id: 77, text: "感到自己没有意义", category: "抑郁" },
  { id: 78, text: "感到自己没有方向", category: "抑郁" },
  { id: 79, text: "感到自己没有目标", category: "抑郁" },
  { id: 80, text: "感到自己没有动力", category: "抑郁" },
  { id: 81, text: "感到自己没有精力", category: "抑郁" },
  { id: 82, text: "感到自己没有快乐", category: "抑郁" },
  { id: 83, text: "感到自己没有满足感", category: "抑郁" },
  { id: 84, text: "感到自己没有成就感", category: "抑郁" },
  { id: 85, text: "感到自己没有自尊", category: "抑郁" },
  { id: 86, text: "感到自己没有自信", category: "抑郁" },
  { id: 87, text: "感到自己没有安全感", category: "焦虑" },
  { id: 88, text: "感到自己没有控制感", category: "焦虑" },
  { id: 89, text: "感到自己没有自由感", category: "焦虑" },
  { id: 90, text: "感到自己没有归属感", category: "人际关系敏感" }
];

// 获取SCL-90问题列表
router.get('/questions', authenticateToken, (req, res) => {
  try {
    // 随机选择35个问题
    const shuffled = [...SCL90_QUESTIONS].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, 35);
    res.json({ questions: selectedQuestions });
  } catch (error) {
    console.error('获取问题失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 提交测试
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { 
      scl90Answers, 
      textInput, 
      completionTime,
      userSatisfaction,
      conversationHistory 
    } = req.body;

    // 文本分析
    let textAnalysis = {};
    if (textInput || (conversationHistory && conversationHistory.length > 0)) {
      const analysisText = textInput || conversationHistory.map(msg => msg.text).join('\n');
      textAnalysis = analyzeText(analysisText);
    }

    // 计算SCL-90分数
    const scl90Result = calculateSCL90Score(scl90Answers || []);

    // 综合风险评估
    const riskResult = assessRisk(scl90Result, textAnalysis);

    // 保存测试结果
    const testResult = await MentalHealthTest.create({
      userId: req.user.id,
      testType: 'scl90',
      scl90Answers: scl90Answers || [],
      textAnalysis,
      riskResult,
      completionTime: completionTime || 0,
      userSatisfaction: userSatisfaction || 3
    });

    res.json({
      success: true,
      result: riskResult,
      testId: testResult.id,
      message: '测试完成'
    });
  } catch (error) {
    console.error('提交测试失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取测试历史
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const results = await MentalHealthTest.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json({ results });
  } catch (error) {
    console.error('获取历史失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取测试统计
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const results = await MentalHealthTest.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    if (results.length === 0) {
      return res.json({
        stats: {
          totalTests: 0,
          averageRisk: 0,
          trend: 'stable',
          lastTest: null
        }
      });
    }

    const averageRisk = results.reduce((sum, r) => sum + (r.riskResult?.finalScore || 0), 0) / results.length;
    
    // 计算趋势
    let trend = 'stable';
    if (results.length >= 2) {
      const recent = results[0].riskResult?.finalScore || 0;
      const previous = results[1].riskResult?.finalScore || 0;
      if (recent > previous * 1.1) trend = 'worsening';
      else if (recent < previous * 0.9) trend = 'improving';
    }

    res.json({
      stats: {
        totalTests: results.length,
        averageRisk,
        trend,
        lastTest: results[0]
      }
    });
  } catch (error) {
    console.error('获取统计失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 对话式测试
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    
    // 调用AI API获取回复
    const aiResponse = await callAIAPI(message, conversationHistory);
    
    // 文本分析
    const textAnalysis = analyzeText(message);
    
    // 生成下一步可能的问题选项
    const options = [
      "可以详细说说吗？",
      "您有什么具体的困扰吗？",
      "这种情况多久了？",
      "您尝试过什么应对方法吗？"
    ];
    
    res.json({
      success: true,
      response: aiResponse,
      options,
      analysis: {
        sentiment: textAnalysis.sentiment,
        keywords: textAnalysis.keywords,
        riskLevel: textAnalysis.riskLevel
      }
    });
  } catch (error) {
    console.error('对话测试失败:', error);
    res.status(500).json({ 
      success: false,
      error: '服务器错误',
      response: "抱歉，我暂时无法回复，请稍后再试。"
    });
  }
});

// 辅助函数：文本分析
function analyzeText(text) {
  if (!text || text.trim().length === 0) {
    return {
      riskScore: 0,
      keywords: [],
      sentiment: 'neutral',
      riskLevel: 'low'
    };
  }

  const lowerText = text.toLowerCase();
  
  // 关键词词典
  const depressionKeywords = ['绝望', '无助', '痛苦', '悲伤', '抑郁', '自杀', '结束生命', '疲惫', '无力'];
  const anxietyKeywords = ['担心', '害怕', '紧张', '不安', '焦虑', '恐惧', '惊慌'];
  const somaticKeywords = ['头痛', '头晕', '胃痛', '胸痛', '背痛', '肌肉痛', '疲劳'];
  
  const foundKeywords = [];
  let score = 0;

  // 检查抑郁关键词
  depressionKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      score += 2;
      foundKeywords.push({ word: keyword, category: 'depression' });
    }
  });

  // 检查焦虑关键词
  anxietyKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      score += 1.5;
      foundKeywords.push({ word: keyword, category: 'anxiety' });
    }
  });

  // 检查躯体化关键词
  somaticKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      score += 1;
      foundKeywords.push({ word: keyword, category: 'somatic' });
    }
  });

  // 计算风险分数
  const riskScore = Math.min(1, score / 10);

  // 确定风险等级
  let riskLevel = 'low';
  let sentiment = 'neutral';

  if (riskScore > 0.7) {
    riskLevel = 'high';
    sentiment = 'negative';
  } else if (riskScore > 0.4) {
    riskLevel = 'medium';
    sentiment = 'negative';
  } else if (riskScore > 0.1) {
    sentiment = 'slightly_negative';
  }

  // 检测自杀意念
  const suicideKeywords = ['自杀', '想死', '结束生命', '活着没意思'];
  const hasSuicideIdeation = suicideKeywords.some(keyword => lowerText.includes(keyword));

  if (hasSuicideIdeation) {
    riskLevel = 'critical';
  }

  return {
    riskScore,
    keywords: foundKeywords.slice(0, 10),
    sentiment,
    riskLevel,
    hasSuicideIdeation
  };
}

// 辅助函数：计算SCL-90分数
function calculateSCL90Score(answers) {
  const categories = {
    '躯体化': [],
    '焦虑': [],
    '强迫症状': [],
    '抑郁': [],
    '人际关系敏感': [],
    '偏执': [],
    '敌对': [],
    '恐怖': [],
    '睡眠障碍': [],
    '精神病性': []
  };

  let totalScore = 0;
  let totalItems = 0;

  answers.forEach(answer => {
    const question = SCL90_QUESTIONS.find(q => q.id === answer.questionId);
    if (question && categories[question.category] !== undefined) {
      categories[question.category].push(answer.score);
      totalScore += answer.score;
      totalItems++;
    }
  });

  // 计算各维度分数
  const categoryScores = {};
  let maxCategoryScore = 0;
  let maxCategory = '';

  Object.keys(categories).forEach(cat => {
    const scores = categories[cat];
    if (scores.length > 0) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      categoryScores[cat] = avg;
      if (avg > maxCategoryScore) {
        maxCategoryScore = avg;
        maxCategory = cat;
      }
    } else {
      categoryScores[cat] = 0;
    }
  });

  // 总分标准化（0-1）
  const normalizedScore = totalItems > 0 ? (totalScore / totalItems) / 5 : 0;

  return {
    total: normalizedScore,
    weighted: normalizedScore * 0.8 + maxCategoryScore * 0.2,
    categories: categoryScores,
    dominantCategory: maxCategory,
    maxCategoryScore
  };
}

// 辅助函数：综合风险评估
function assessRisk(scl90Result, textAnalysis) {
  const scores = [];
  const weights = [];

  // SCL-90分数
  if (scl90Result) {
    scores.push(scl90Result.weighted);
    weights.push(0.6);
  }

  // 文本分析分数
  if (textAnalysis && textAnalysis.riskScore) {
    scores.push(textAnalysis.riskScore);
    weights.push(0.4);
  }

  // 计算加权分数
  let finalScore = 0;
  if (scores.length > 0) {
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    finalScore = scores.reduce((sum, score, i) => sum + score * weights[i], 0) / totalWeight;
  }

  // 确定风险等级
  let riskLevel = 'low';
  let riskCategory = '正常';

  if (finalScore > 0.7) {
    riskLevel = 'critical';
    riskCategory = '抑郁高风险';
  } else if (finalScore > 0.5) {
    riskLevel = 'high';
    riskCategory = '抑郁中风险';
  } else if (finalScore > 0.3) {
    riskLevel = 'medium';
    riskCategory = '轻度困扰';
  } else if (finalScore > 0.15) {
    riskLevel = 'low';
    riskCategory = '轻微困扰';
  }

  // 生成推荐
  const recommendations = generateRecommendations(finalScore);

  return {
    finalScore,
    riskLevel,
    riskCategory,
    recommendations,
    scl90Result,
    textAnalysis,
    timestamp: new Date().toISOString()
  };
}

// 辅助函数：生成推荐
function generateRecommendations(finalScore) {
  const recommendations = [];

  if (finalScore > 0.7) {
    recommendations.push({
      priority: 'high',
      action: '立即寻求专业帮助',
      description: '您的综合风险评分较高，建议立即联系精神科医生或心理咨询师进行专业评估。'
    });
    recommendations.push({
      priority: 'high',
      action: '联系危机干预热线',
      description: '如感到极度痛苦或有自杀想法，请立即拨打心理危机干预热线：400-161-9995'
    });
  } else if (finalScore > 0.5) {
    recommendations.push({
      priority: 'medium',
      action: '预约心理咨询',
      description: '建议在1-2周内预约专业心理咨询师进行评估和干预。'
    });
    recommendations.push({
      priority: 'medium',
      action: '定期情绪监测',
      description: '建议每天记录情绪变化，观察症状发展趋势。'
    });
  } else if (finalScore > 0.3) {
    recommendations.push({
      priority: 'low',
      action: '生活方式调整',
      description: '建议调整作息规律，增加运动，保持社交联系。'
    });
    recommendations.push({
      priority: 'low',
      action: '自我关怀练习',
      description: '尝试正念冥想、深呼吸等放松技巧。'
    });
  } else {
    recommendations.push({
      priority: 'low',
      action: '保持良好状态',
      description: '您的心理健康状况良好，请继续保持积极的生活方式。'
    });
  }

  return recommendations;
}

// 辅助函数：清理AI回复中的markdown格式
function cleanMarkdown(text) {
  if (!text) return text;
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')  // 移除 **粗体**
    .replace(/\*(.*?)\*/g, '$1')      // 移除 *斜体*
    .replace(/`(.*?)`/g, '$1')        // 移除 `代码`
    .replace(/#{1,6}\s/g, '')          // 移除 # 标题
    .replace(/\n{3,}/g, '\n\n')       // 压缩多余空行
    .trim();
}

// 辅助函数：调用AI API
async function callAIAPI(message, conversationHistory) {
  try {
    const messages = [
      {
        role: 'system',
        content: '你是心理医生，正在评估用户心理健康。保持专业温暖的语气，用纯文本回复，控制在100字以内。'
      }
    ];
    
    // 只保留最近6轮对话
    if (conversationHistory) {
      const recent = conversationHistory.slice(-12);
      recent.forEach(msg => {
        messages.push({
          role: msg.role === 'ai' ? 'assistant' : 'user',
          content: msg.text
        });
      });
    }
    
    messages.push({ role: 'user', content: message });
    
    const response = await axios.post(config.ai.apiEndpoint, {
      model: config.ai.model,
      messages,
      temperature: 0.7,
      max_completion_tokens: 200
    }, {
      headers: {
        'api-key': config.ai.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      return cleanMarkdown(response.data.choices[0].message.content);
    }

    return '感谢您的分享。能再详细描述一下您的感受吗？';
  } catch (error) {
    console.error('AI API调用失败:', error.message);
    return '感谢您的分享。能再详细描述一下您的感受吗？';
  }
}

// 管理员API：获取高危预警列表
router.get('/admin/alerts', authenticateToken, async (req, res) => {
  try {
    // 检查管理员权限
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const results = await MentalHealthTest.findAll({
      order: [['createdAt', 'DESC']]
    });

    // 筛选高危用户（critical和high级别）
    const highRiskAlerts = [];
    const userMap = new Map();

    results.forEach(result => {
      const riskLevel = result.riskResult?.riskLevel;
      if (riskLevel === 'critical' || riskLevel === 'high') {
        const userId = result.userId;
        if (!userMap.has(userId) || userMap.get(userId).createdAt < result.createdAt) {
          userMap.set(userId, {
            userId,
            testId: result.id,
            riskLevel,
            riskCategory: result.riskResult?.riskCategory,
            finalScore: result.riskResult?.finalScore,
            recommendations: result.riskResult?.recommendations,
            createdAt: result.createdAt
          });
        }
      }
    });

    // 获取用户信息
    const { User } = require('../models');
    for (const [userId, alert] of userMap) {
      const user = await User.findByPk(userId);
      if (user) {
        alert.username = user.username;
        alert.email = user.email;
      }
      highRiskAlerts.push(alert);
    }

    // 按风险等级排序
    highRiskAlerts.sort((a, b) => {
      const order = { critical: 0, high: 1 };
      return (order[a.riskLevel] || 2) - (order[b.riskLevel] || 2);
    });

    res.json({ alerts: highRiskAlerts });
  } catch (error) {
    console.error('获取预警失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 管理员API：获取所有用户列表
router.get('/admin/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const { User } = require('../models');
    
    // 直接返回所有用户
    const users = await User.findAll({
      order: [['createdAt', 'DESC']],
      raw: true
    });
    
    console.log('查询到用户数量:', users.length);

    // 简单统计
    const userIds = users.map(u => u.id);
    const testCounts = await MentalHealthTest.findAll({
      attributes: ['userId', [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']],
      where: { userId: { [require('sequelize').Op.in]: userIds } },
      group: ['userId'],
      raw: true
    });

    const countMap = {};
    testCounts.forEach(t => { countMap[t.userId] = parseInt(t.count); });

    const usersWithStats = users.map(user => ({
      id: user.id,
      username: user.username,
      latestRiskLevel: 'none',
      latestScore: 0,
      testCount: countMap[user.id] || 0
    }));

    usersWithStats.sort((a, b) => b.testCount - a.testCount);

    console.log('返回用户数:', usersWithStats.length);

    res.json({ users: usersWithStats });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 管理员API：添加线下活动记录（心理考古线）
router.post('/admin/activity', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const { userId, activityType, activityName, activityDate, beforeScore, afterScore, notes } = req.body;

    if (!userId || !activityType || !activityName) {
      return res.status(400).json({ error: '请填写必要信息' });
    }

    // 创建活动记录作为测试记录
    const activityRecord = await MentalHealthTest.create({
      userId: parseInt(userId),
      testType: 'offline_activity',
      scl90Answers: [],
      textAnalysis: {
        activityType,
        activityName,
        activityDate: activityDate || new Date().toISOString().split('T')[0],
        notes: notes || '',
        beforeScore: beforeScore || 0,
        afterScore: afterScore || 0,
        scoreChange: afterScore && beforeScore ? ((afterScore - beforeScore) / beforeScore * 100).toFixed(1) : null
      },
      riskResult: {
        finalScore: afterScore || 0,
        riskLevel: afterScore >= 0.7 ? 'critical' : afterScore >= 0.5 ? 'high' : afterScore >= 0.3 ? 'medium' : 'low',
        riskCategory: '线下活动评估',
        timestamp: new Date().toISOString()
      },
      completionTime: 0,
      userSatisfaction: 5
    });

    res.json({ success: true, record: activityRecord });
  } catch (error) {
    console.error('添加活动记录失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 管理员API：获取用户心理考古线（活动历史）
router.get('/admin/archaeology/:userId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const { userId } = req.params;
    
    // 获取该用户的所有记录
    const allTests = await MentalHealthTest.findAll({
      where: { userId: parseInt(userId) },
      order: [['createdAt', 'ASC']]
    });

    // 分离测评记录和活动记录
    const tests = allTests.filter(t => t.testType === 'scl90');
    const activities = allTests.filter(t => t.testType === 'offline_activity');

    // 构建时间线
    const timeline = allTests.map(t => ({
      id: t.id,
      type: t.testType,
      date: t.createdAt,
      score: t.riskResult?.finalScore || 0,
      riskLevel: t.riskResult?.riskLevel || 'low',
      activityName: t.textAnalysis?.activityName || null,
      activityType: t.textAnalysis?.activityType || null,
      beforeScore: t.textAnalysis?.beforeScore || null,
      afterScore: t.textAnalysis?.afterScore || null,
      scoreChange: t.textAnalysis?.scoreChange || null
    }));

    // 计算变化趋势
    const testScores = tests.map(t => t.riskResult?.finalScore || 0);
    const trend = {
      initialScore: testScores[0] || 0,
      latestScore: testScores[testScores.length - 1] || 0,
      totalChange: testScores.length > 1 ? ((testScores[testScores.length - 1] - testScores[0]) / testScores[0] * 100).toFixed(1) : 0,
      testCount: tests.length,
      activityCount: activities.length
    };

    res.json({ timeline, trend });
  } catch (error) {
    console.error('获取心理考古线失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
