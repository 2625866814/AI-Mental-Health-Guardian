const axios = require('axios');
const config = require('../config');

// 专业角色定义
const ROLES = {
  psychologist: {
    name: '心理医生',
    system: '你是资深心理医生。通过提问引导用户表达，识别情绪和风险，提供专业支持。用纯文本回复，100字以内。如检测到自杀风险，提供危机干预热线400-161-9995。'
  },
  counselor: {
    name: '心理咨询师',
    system: '你是善于倾听的心理咨询师。积极共情，帮助用户识别情绪，提供建设性应对策略。用纯文本回复，100字以内。'
  },
  artTherapist: {
    name: '艺术治疗师',
    system: '你是艺术治疗师，通过艺术创作帮助用户表达情绪。鼓励创作，关注过程。用纯文本回复，100字以内。'
  },
  dreamAnalyst: {
    name: '梦境分析师',
    system: '你是梦境分析师，结合心理学理论解读梦境。使用探索性语言，尊重用户联想。用纯文本回复，100字以内。'
  }
};

// 对话上下文管理
class ConversationContext {
  constructor(maxHistory = 20) {
    this.messages = [];
    this.maxHistory = maxHistory;
    this.emotionHistory = [];
    this.riskIndicators = [];
  }

  addUserMessage(content) {
    this.messages.push({ role: 'user', content, timestamp: Date.now() });
    this.trimHistory();
  }

  addAssistantMessage(content) {
    this.messages.push({ role: 'assistant', content, timestamp: Date.now() });
    this.trimHistory();
  }

  addEmotionSnapshot(emotion) {
    this.emotionHistory.push({ ...emotion, timestamp: Date.now() });
    if (this.emotionHistory.length > 50) {
      this.emotionHistory = this.emotionHistory.slice(-50);
    }
  }

  addRiskIndicator(risk) {
    this.riskIndicators.push({ ...risk, timestamp: Date.now() });
  }

  getRecentEmotionTrend() {
    if (this.emotionHistory.length < 2) return 'stable';
    const recent = this.emotionHistory.slice(-5);
    const avgScore = recent.reduce((sum, e) => sum + (e.score || 0.5), 0) / recent.length;
    const prevAvg = this.emotionHistory.slice(-10, -5).reduce((sum, e) => sum + (e.score || 0.5), 0) / Math.max(1, this.emotionHistory.slice(-10, -5).length);
    
    if (avgScore < prevAvg - 0.15) return 'declining';
    if (avgScore > prevAvg + 0.15) return 'improving';
    return 'stable';
  }

  hasRecentRisk() {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    return this.riskIndicators.some(r => r.timestamp > fiveMinAgo);
  }

  trimHistory() {
    if (this.messages.length > this.maxHistory) {
      this.messages = this.messages.slice(-this.maxHistory);
    }
  }

  getMessages() {
    return this.messages;
  }

  getContextSummary() {
    return {
      messageCount: this.messages.length,
      emotionTrend: this.getRecentEmotionTrend(),
      hasRecentRisk: this.hasRecentRisk(),
      lastEmotion: this.emotionHistory[this.emotionHistory.length - 1] || null
    };
  }
}

// 会话管理
const sessions = new Map();

function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, new ConversationContext());
  }
  return sessions.get(sessionId);
}

// 调用AI API
async function callAPI(messages, options = {}) {
  const {
    temperature = 0.7,
    maxTokens = 200,
    model = config.ai.model
  } = options;

  try {
    const response = await axios.post(config.ai.apiEndpoint, {
      model,
      messages,
      temperature,
      max_completion_tokens: maxTokens
    }, {
      headers: {
        'api-key': config.ai.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    if (response.data?.choices?.length > 0) {
      return cleanResponse(response.data.choices[0].message.content);
    }
    return null;
  } catch (error) {
    console.error('AI API调用失败:', error.message);
    return null;
  }
}

// 清理AI回复
function cleanResponse(text) {
  if (!text) return text;
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// 主要对话函数
async function chat(message, sessionId, role = 'psychologist', options = {}) {
  const context = getSession(sessionId);
  context.addUserMessage(message);

  const roleConfig = ROLES[role] || ROLES.psychologist;
  const contextSummary = context.getContextSummary();

  // 构建系统提示
  let systemPrompt = roleConfig.system;

  // 添加上下文信息
  if (contextSummary.emotionTrend === 'declining') {
    systemPrompt += '\n注意：用户近期情绪下降，请给予更多关注。';
  }
  if (contextSummary.hasRecentRisk) {
    systemPrompt += '\n重要：用户近期有风险信号，请谨慎回应。';
  }

  // 构建消息列表
  const messages = [{ role: 'system', content: systemPrompt }];
  
  // 只保留最近6轮对话
  const history = context.getMessages().slice(-12);
  history.forEach(msg => {
    messages.push({ role: msg.role, content: msg.content });
  });

  // 调用API
  const response = await callAPI(messages, options);
  
  if (response) {
    context.addAssistantMessage(response);
    return {
      response,
      context: contextSummary,
      sessionId
    };
  }

  // 降级回复
  const fallback = getFallbackResponse(role);
  context.addAssistantMessage(fallback);
  return {
    response: fallback,
    context: contextSummary,
    sessionId,
    fallback: true
  };
}

// 降级回复
function getFallbackResponse(role) {
  const fallbacks = {
    psychologist: [
      '感谢您的分享。能再详细描述一下您的感受吗？',
      '我理解这可能不容易谈论。您愿意多说一些吗？',
      '听起来您正在经历一些困难。您现在最需要什么支持？'
    ],
    counselor: [
      '我在认真倾听。请继续分享您的想法。',
      '您的感受很重要。能告诉我更多吗？',
      '我理解您的感受。您希望我们从哪里开始？'
    ],
    artTherapist: [
      '您的创作很有意义。您在创作时有什么感受？',
      '艺术是表达内心的好方式。您想尝试什么创作？',
      '您的作品传达了很多情感。您愿意分享更多吗？'
    ],
    dreamAnalyst: [
      '这个梦境很有趣。您能描述更多细节吗？',
      '梦境中的元素往往有象征意义。您对哪个部分印象最深？',
      '您的梦境让我想到一些可能的解读。您想听听吗？'
    ]
  };

  const roleFallbacks = fallbacks[role] || fallbacks.psychologist;
  return roleFallbacks[Math.floor(Math.random() * roleFallbacks.length)];
}

// 情绪分析（细粒度多类别词典 + 强度系数 + 上下文修饰）
function analyzeEmotion(text) {
  if (!text || text.trim().length === 0) {
    return { score: 0.5, label: 'neutral', confidence: 0, categories: {}, modifiers: {} };
  }

  const lowerText = text.toLowerCase();

  // 细粒度情绪词典：每类含 (词, 强度1-3) 二元组
  // 强度1=轻度，2=中度，3=重度
  const emotionDict = {
    // 抑郁类
    depression: {
      words: [
        ['绝望', 3], ['无助', 3], ['痛苦', 3], ['悲伤', 2], ['抑郁', 3],
        ['低落', 2], ['消沉', 2], ['灰心', 2], ['低潮', 1], ['闷闷不乐', 2],
        ['高兴不起来', 2], ['兴趣下降', 2], ['兴趣丧失', 3], ['提不起劲', 2],
        ['毫无意义', 3], ['空虚', 2], ['麻木', 2], ['心情差', 1], ['难受', 1], ['想哭', 2]
      ],
      polarity: -1
    },
    // 焦虑类
    anxiety: {
      words: [
        ['焦虑', 2], ['担心', 1], ['害怕', 2], ['紧张', 1], ['不安', 1],
        ['恐惧', 3], ['恐慌', 3], ['烦躁', 1], ['烦躁不安', 2], ['坐立不安', 2],
        ['心慌', 2], ['心神不宁', 2], ['忐忑', 1], ['忧虑', 2], ['忧心忡忡', 2],
        ['压力', 1], ['有压力', 2], ['喘不过气', 3], ['窒息感', 3], ['濒死感', 3]
      ],
      polarity: -1
    },
    // 愤怒类
    anger: {
      words: [
        ['愤怒', 2], ['生气', 1], ['恼火', 2], ['暴怒', 3], ['怒火', 2],
        ['怨恨', 2], ['仇恨', 3], ['厌恶', 2], ['讨厌', 1], ['憎恨', 3],
        ['烦躁', 1], ['抓狂', 2], ['不公', 2], ['委屈', 1], ['不甘', 1]
      ],
      polarity: -1
    },
    // 孤独/疏离类
    loneliness: {
      words: [
        ['孤独', 2], ['孤单', 2], ['寂寞', 2], ['无人理解', 3], ['没人在乎', 3],
        ['被孤立', 2], ['被排斥', 2], ['被抛弃', 3], ['迷茫', 1], ['无助', 3],
        ['没有朋友', 2], ['没人陪我', 2], ['一个人扛', 2], ['独自承受', 2]
      ],
      polarity: -1
    },
    // 疲惫/耗竭类
    burnout: {
      words: [
        ['疲惫', 2], ['疲倦', 2], ['累', 1], ['心力交瘁', 3], ['精疲力尽', 3],
        ['崩溃', 3], ['撑不住', 3], ['耗竭', 3], ['想放弃', 3], ['扛不住', 3],
        ['受不了', 2], ['无力', 2], ['乏力', 1], ['困倦', 1], ['没精神', 1]
      ],
      polarity: -1
    },
    // 自我否定类
    selfDenial: {
      words: [
        ['没用', 2], ['没用的人', 3], ['失败', 2], ['失败者', 3], ['废物', 3],
        ['无能', 3], ['一无是处', 3], ['一无所有', 2], ['不够好', 2], ['差劲', 2],
        ['不值得', 2], ['不配', 2], ['讨厌自己', 3], ['恨自己', 3], ['自责', 2],
        ['内疚', 2], ['自责内疚', 2], ['都是我的错', 2]
      ],
      polarity: -1
    },
    // 正向情绪类
    positive: {
      words: [
        ['开心', 1], ['快乐', 1], ['幸福', 2], ['满足', 1], ['平静', 1],
        ['放松', 1], ['自信', 2], ['希望', 1], ['感恩', 2], ['温暖', 1],
        ['兴奋', 2], ['期待', 1], ['满意', 1], ['安心', 1], ['舒服', 1],
        ['愉快', 1], ['高兴', 1], ['舒心', 1], ['踏实', 1], ['欣慰', 2],
        ['喜悦', 2], ['欢乐', 2], ['感激', 2], ['自豪', 2], ['成就感', 2]
      ],
      polarity: 1
    },
    // 危机/自伤类
    crisis: {
      words: [
        ['自杀', 3], ['想死', 3], ['结束生命', 3], ['活着没意思', 3], ['不想活', 3],
        ['割腕', 3], ['跳楼', 3], ['了结', 3], ['解脱', 3], ['告别世界', 3],
        ['消失', 3], ['从世界上消失', 3], ['安眠药', 3], ['轻生', 3], ['寻死', 3],
        ['没意义活着', 3], ['拖累别人', 3], ['走了一切都好', 3], ['上吊', 3], ['吃药走', 3]
      ],
      polarity: -2
    }
  };

  // 上下文修饰词（否定词/程度副词）
  const modifiers = {
    negation: ['不', '没', '没有', '无', '非', '未', '别', '莫', '勿'],
    intensifier: ['很', '非常', '十分', '极其', '特别', '格外', '相当', '超级', '太', '异常', '极度', '过分'],
    diminisher: ['有点', '稍微', '略微', '有些', '一点', '多少']
  };

  // 计算各类情绪强度
  const categoryScores = {};
  let totalNegativeIntensity = 0;
  let totalPositiveIntensity = 0;
  let hasCrisis = false;
  let crisisCount = 0;
  const matchedEmotions = [];
  const matchedCategories = {};

  Object.entries(emotionDict).forEach(([category, dict]) => {
    let catScore = 0;
    let catMatches = 0;
    matchedCategories[category] = [];

    dict.words.forEach(([word, intensity]) => {
      // 检查是否出现（含上下文修饰）
      const idx = lowerText.indexOf(word);
      if (idx !== -1) {
        // 检查前缀否定（前2-3字符内是否有否定词）
        const prefix = lowerText.substring(Math.max(0, idx - 3), idx);
        const hasNegation = modifiers.negation.some(neg => prefix.includes(neg));
        // 检查程度副词
        const hasIntensifier = modifiers.intensifier.some(adv => prefix.includes(adv));
        const hasDiminisher = modifiers.diminisher.some(adv => prefix.includes(adv));

        // 计算实际强度
        let effectiveIntensity = intensity;
        if (hasNegation) {
          effectiveIntensity = -intensity * 0.5; // 否定反转（部分）
        } else {
          if (hasIntensifier) effectiveIntensity *= 1.5;
          if (hasDiminisher) effectiveIntensity *= 0.6;
        }

        catScore += effectiveIntensity;
        catMatches++;
        matchedCategories[category].push({ word, intensity, negated: hasNegation });
        matchedEmotions.push({ word, category, intensity, negated: hasNegation });
        if (category === 'crisis' && !hasNegation) {
          hasCrisis = true;
          crisisCount++;
        }
      }
    });

    categoryScores[category] = {
      score: catScore,
      matches: catMatches,
      avgIntensity: catMatches > 0 ? catScore / catMatches : 0
    };

    // 累加正负情绪
    if (dict.polarity < 0 && catScore > 0) {
      totalNegativeIntensity += Math.abs(catScore);
    } else if (dict.polarity > 0 && catScore > 0) {
      totalPositiveIntensity += catScore;
    }
  });

  // 标准化分数 (0-1, 0.5为中性)
  // 净情绪 = 正向 - 负向
  const netEmotion = totalPositiveIntensity - totalNegativeIntensity;
  let normalizedScore;
  if (totalPositiveIntensity + totalNegativeIntensity > 0) {
    // 转换：正向多→接近1，负向多→接近0
    const totalIntensity = totalPositiveIntensity + totalNegativeIntensity;
    normalizedScore = 0.5 + (netEmotion / totalIntensity) * 0.5;
    // 危机词加权下压
    if (hasCrisis) {
      normalizedScore = Math.max(0, normalizedScore - 0.25 * crisisCount);
    }
  } else {
    normalizedScore = 0.5;
  }
  normalizedScore = Math.max(0, Math.min(1, normalizedScore));

  // 确定标签
  let label = 'neutral';
  if (normalizedScore < 0.25) label = 'very_negative';
  else if (normalizedScore < 0.42) label = 'negative';
  else if (normalizedScore > 0.75) label = 'very_positive';
  else if (normalizedScore > 0.58) label = 'positive';

  // 主要情绪类别（强度最高的）
  let dominantCategory = null;
  let maxIntensity = 0;
  Object.entries(categoryScores).forEach(([cat, data]) => {
    if (Math.abs(data.avgIntensity) > maxIntensity) {
      maxIntensity = Math.abs(data.avgIntensity);
      dominantCategory = cat;
    }
  });

  // 置信度：基于匹配词数 + 类别一致性
  const totalMatches = Object.values(categoryScores).reduce((sum, d) => sum + d.matches, 0);
  const confidence = Math.min(1, totalMatches / 5);

  return {
    score: normalizedScore,
    label,
    hasCrisis,
    crisisCount,
    dominantCategory,
    categories: categoryScores,
    matchedCategories,
    matchedEmotions,
    confidence,
    modifiers: {
      negation: modifiers.negation.some(n => lowerText.includes(n)),
      intensifier: modifiers.intensifier.some(n => lowerText.includes(n))
    }
  };
}

// 风险评估（多因子：情绪 + 危机词 + 类别强度 + 置信度）
function assessRisk(text, emotionResult) {
  const risks = [];
  const factors = []; // 用于可解释性
  let riskScore = 0;

  // 因子1: 情绪总分
  if (emotionResult.score < 0.25) {
    riskScore += 0.35;
    risks.push({ type: 'emotion', level: 'high', desc: '情绪状态极差' });
    factors.push({ factor: 'emotion_score', value: emotionResult.score, weight: 0.35, contribution: 0.35 });
  } else if (emotionResult.score < 0.42) {
    riskScore += 0.2;
    risks.push({ type: 'emotion', level: 'medium', desc: '情绪偏低落' });
    factors.push({ factor: 'emotion_score', value: emotionResult.score, weight: 0.2, contribution: 0.2 });
  } else if (emotionResult.score < 0.5) {
    riskScore += 0.08;
    risks.push({ type: 'emotion', level: 'low', desc: '情绪略低' });
    factors.push({ factor: 'emotion_score', value: emotionResult.score, weight: 0.08, contribution: 0.08 });
  }

  // 因子2: 危机关键词（高权重）
  if (emotionResult.hasCrisis) {
    const crisisWeight = Math.min(0.5, 0.3 + 0.1 * (emotionResult.crisisCount || 1));
    riskScore += crisisWeight;
    risks.push({
      type: 'crisis',
      level: 'critical',
      desc: `检测到${emotionResult.crisisCount || 1}个危机关键词`,
      detail: emotionResult.matchedCategories?.crisis || []
    });
    factors.push({
      factor: 'crisis_keywords',
      value: emotionResult.crisisCount || 1,
      weight: crisisWeight,
      contribution: crisisWeight
    });
  }

  // 因子3: 主要情绪类别强度（抑郁/焦虑/自我否定加权）
  const highRiskCategories = ['depression', 'anxiety', 'selfDenial', 'burnout', 'loneliness'];
  if (emotionResult.categories) {
    highRiskCategories.forEach(cat => {
      const catData = emotionResult.categories[cat];
      if (catData && catData.matches > 0) {
        // 该类别的平均强度（0-3）映射到 0-0.1 的风险增量
        const catRisk = Math.min(0.1, (catData.avgIntensity / 3) * 0.1);
        if (catRisk > 0.03) {
          riskScore += catRisk;
          risks.push({
            type: 'category',
            category: cat,
            level: catData.avgIntensity > 2 ? 'medium' : 'low',
            desc: `${getCategoryLabel(cat)}信号`,
            intensity: catData.avgIntensity
          });
          factors.push({
            factor: `category_${cat}`,
            value: catData.avgIntensity,
            weight: catRisk,
            contribution: catRisk
          });
        }
      }
    });
  }

  // 因子4: 置信度折扣（匹配词少则风险分折扣，避免误报）
  if (emotionResult.confidence < 0.4 && riskScore > 0.3) {
    const discount = (0.4 - emotionResult.confidence) * 0.5;
    riskScore = Math.max(0, riskScore - discount);
    factors.push({ factor: 'confidence_discount', value: emotionResult.confidence, weight: -discount, contribution: -discount });
  }

  // 标准化
  riskScore = Math.min(1, riskScore);

  // 风险等级（与分层机制对齐）
  let riskLevel = 'low';
  if (riskScore > 0.7) riskLevel = 'critical';
  else if (riskScore > 0.5) riskLevel = 'high';
  else if (riskScore > 0.3) riskLevel = 'medium';

  return {
    score: riskScore,
    level: riskLevel,
    risks,
    factors, // 可解释性：各因子贡献
    hasCrisis: emotionResult.hasCrisis,
    confidence: emotionResult.confidence,
    timestamp: new Date().toISOString()
  };
}

// 情绪类别中文标签
function getCategoryLabel(category) {
  const labels = {
    depression: '抑郁',
    anxiety: '焦虑',
    anger: '愤怒',
    loneliness: '孤独',
    burnout: '耗竭',
    selfDenial: '自我否定',
    positive: '正向',
    crisis: '危机'
  };
  return labels[category] || category;
}

// 生成综合报告
function generateReport(testResults, chatHistory, emotionHistory) {
  const report = {
    summary: '',
    emotionTrend: 'stable',
    riskLevel: 'low',
    recommendations: [],
    attentionAreas: []
  };

  // 分析情绪趋势
  if (emotionHistory && emotionHistory.length > 0) {
    const recent = emotionHistory.slice(-7);
    const avgScore = recent.reduce((sum, e) => sum + e.score, 0) / recent.length;
    
    if (avgScore < 0.35) {
      report.emotionTrend = 'declining';
      report.attentionAreas.push('情绪持续低落');
    } else if (avgScore > 0.65) {
      report.emotionTrend = 'improving';
    }
  }

  // 综合风险评估
  if (testResults && testResults.length > 0) {
    const latestTest = testResults[0];
    if (latestTest.riskResult) {
      report.riskLevel = latestTest.riskResult.riskLevel || 'low';
    }
  }

  // 生成建议
  report.recommendations = generateRecommendations(report);

  // 生成摘要
  report.summary = generateSummary(report);

  return report;
}

function generateRecommendations(report) {
  const recommendations = [];

  if (report.riskLevel === 'critical') {
    recommendations.push({
      priority: 'urgent',
      action: '立即寻求专业帮助',
      description: '建议立即联系精神科医生或拨打心理危机干预热线：400-161-9995'
    });
  } else if (report.riskLevel === 'high') {
    recommendations.push({
      priority: 'high',
      action: '预约专业咨询',
      description: '建议在1周内预约心理咨询师进行评估'
    });
  }

  if (report.emotionTrend === 'declining') {
    recommendations.push({
      priority: 'medium',
      action: '增加社交活动',
      description: '与朋友家人保持联系，参加社交活动有助于改善情绪'
    });
    recommendations.push({
      priority: 'medium',
      action: '规律作息运动',
      description: '保持规律的作息和适量运动对情绪调节很重要'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'low',
      action: '保持良好状态',
      description: '您的心理健康状况良好，请继续保持积极的生活方式'
    });
  }

  return recommendations;
}

function generateSummary(report) {
  const trendText = {
    declining: '近期情绪呈下降趋势',
    improving: '近期情绪有所改善',
    stable: '情绪状态相对稳定'
  };

  const riskText = {
    critical: '存在较高心理风险',
    high: '需要关注心理健康',
    medium: '有轻微心理困扰',
    low: '心理健康状况良好'
  };

  return `${trendText[report.emotionTrend] || '情绪状态稳定'}，${riskText[report.riskLevel] || '状况良好'}。`;
}

// 清理过期会话
function cleanupSessions(maxAge = 3600000) {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    const messages = session.getMessages();
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (now - lastMessage.timestamp > maxAge) {
        sessions.delete(id);
      }
    }
  }
}

// 每小时清理一次过期会话
setInterval(cleanupSessions, 3600000);

module.exports = {
  chat,
  analyzeEmotion,
  assessRisk,
  generateReport,
  getSession,
  ROLES
};
