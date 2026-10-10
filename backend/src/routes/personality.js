const express = require('express');
const { PersonalitySession } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const axios = require('axios');
const config = require('../config');

const router = express.Router();

// 压力场景定义
const STRESS_SCENARIOS = {
  'work-pressure': {
    name: '工作压力',
    description: '面对紧迫的工作截止日期和高要求的上司',
    initialStress: 0.6,
    personalityTypes: ['ISTJ', 'ESTJ', 'INTJ', 'ENTJ']
  },
  'social-anxiety': {
    name: '社交焦虑',
    description: '在大型社交场合中感到不适应和紧张',
    initialStress: 0.7,
    personalityTypes: ['INTP', 'INFP', 'ISTP', 'ISFP']
  },
  'academic-stress': {
    name: '学业压力',
    description: '面对重要的考试和学业挑战',
    initialStress: 0.65,
    personalityTypes: ['ENTP', 'ENFP', 'INTJ', 'INFJ']
  },
  'relationship-issues': {
    name: '人际关系',
    description: '处理复杂的人际关系和冲突',
    initialStress: 0.55,
    personalityTypes: ['ENFJ', 'ESFJ', 'INFJ', 'INFP']
  },
  'life-transitions': {
    name: '生活转变',
    description: '面对重大的生活变化和不确定性',
    initialStress: 0.75,
    personalityTypes: ['ISFJ', 'ISTJ', 'ESFJ', 'ESTJ']
  }
};

// 创建会话
router.post('/session', authenticateToken, async (req, res) => {
  try {
    const { scenario, personalityType } = req.body;

    if (!scenario) {
      return res.status(400).json({ error: '请选择压力场景' });
    }

    const scenarioData = STRESS_SCENARIOS[scenario];
    if (!scenarioData) {
      return res.status(400).json({ error: '无效的场景' });
    }

    // 创建新会话
    const session = await PersonalitySession.create({
      userId: req.user.id,
      scenario: scenarioData.name,
      personalityType: personalityType || 'INTJ',
      conversation: [],
      stressScore: scenarioData.initialStress,
      decisionPath: []
    });

    // 生成初始AI响应
    const initialResponse = await generateScenarioResponse(
      scenarioData,
      personalityType || 'INTJ',
      [],
      scenarioData.initialStress
    );

    res.json({
      success: true,
      sessionId: session.id,
      scenario: scenarioData,
      initialResponse,
      stressScore: scenarioData.initialStress
    });
  } catch (error) {
    console.error('创建会话失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取AI响应
router.post('/response', authenticateToken, async (req, res) => {
  try {
    const { sessionId, userResponse, decision } = req.body;

    if (!sessionId || !userResponse) {
      return res.status(400).json({ error: '会话ID和用户响应不能为空' });
    }

    // 获取会话
    const session = await PersonalitySession.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ error: '会话不存在' });
    }

    // 验证权限
    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: '无权访问' });
    }

    // 更新对话历史
    const conversation = session.conversation || [];
    conversation.push({
      role: 'user',
      content: userResponse,
      timestamp: new Date().toISOString()
    });

    // 更新决策路径
    const decisionPath = session.decisionPath || [];
    if (decision) {
      decisionPath.push({
        decision,
        timestamp: new Date().toISOString()
      });
    }

    // 计算新的压力分数
    const newStressScore = calculateStressScore(
      session.stressScore,
      userResponse,
      decision
    );

    // 生成AI响应
    const scenarioData = Object.values(STRESS_SCENARIOS).find(s => s.name === session.scenario);
    const aiResponse = await generateScenarioResponse(
      scenarioData,
      session.personalityType,
      conversation,
      newStressScore
    );

    // 更新会话
    conversation.push({
      role: 'ai',
      content: aiResponse,
      timestamp: new Date().toISOString()
    });

    session.conversation = conversation;
    session.decisionPath = decisionPath;
    session.stressScore = newStressScore;
    await session.save();

    res.json({
      success: true,
      response: aiResponse,
      stressScore: newStressScore,
      decisionPath,
      conversationLength: conversation.length
    });
  } catch (error) {
    console.error('获取响应失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取会话历史
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const sessions = await PersonalitySession.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json({ sessions });
  } catch (error) {
    console.error('获取历史失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取场景列表
router.get('/scenarios', authenticateToken, (req, res) => {
  try {
    const scenarios = Object.entries(STRESS_SCENARIOS).map(([key, value]) => ({
      id: key,
      ...value
    }));

    res.json({ scenarios });
  } catch (error) {
    console.error('获取场景失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 辅助函数：生成场景响应
async function generateScenarioResponse(scenario, personalityType, conversation, stressScore) {
  try {
    // 构建系统提示
    const systemPrompt = `你是一位专业的心理咨询师，正在帮助用户应对压力场景。
    
场景：${scenario.name} - ${scenario.description}
用户人格类型：${personalityType}
当前压力水平：${Math.round(stressScore * 100)}%

请根据用户的人格类型和当前压力水平，提供个性化的建议和支持。
保持温暖、同理心和专业性。`;

    const messages = [
      { role: 'system', content: systemPrompt }
    ];
    
    // 添加对话历史
    conversation.forEach(msg => {
      messages.push({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.content
      });
    });

    // 如果是第一次对话，添加初始提示
    if (conversation.length === 0) {
      messages.push({
        role: 'user',
        content: `我正在面对${scenario.name}的压力场景，${scenario.description}。我感到${stressScore > 0.7 ? '非常' : stressScore > 0.5 ? '有些' : '轻微'}的压力。`
      });
    }

    const response = await axios.post(config.ai.apiEndpoint, {
      model: config.ai.model,
      messages,
      temperature: 0.7,
      max_completion_tokens: 500
    }, {
      headers: {
        'api-key': config.ai.apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    }

    return `我理解您在面对${scenario.name}时的感受。让我们一起探讨如何更好地应对这个挑战。`;
  } catch (error) {
    console.error('AI API调用失败:', error);
    return `我理解您在面对${scenario.name}时的感受。让我们一起探讨如何更好地应对这个挑战。`;
  }
}

// 辅助函数：计算压力分数
function calculateStressScore(currentScore, userResponse, decision) {
  let newScore = currentScore;
  
  // 基于用户响应调整压力分数
  const lowerResponse = userResponse.toLowerCase();
  
  // 正面关键词降低压力
  const positiveKeywords = ['放松', '冷静', '自信', '积极', '乐观', '解决'];
  positiveKeywords.forEach(keyword => {
    if (lowerResponse.includes(keyword)) {
      newScore -= 0.05;
    }
  });
  
  // 负面关键词增加压力
  const negativeKeywords = ['焦虑', '害怕', '担心', '紧张', '压力', '崩溃'];
  negativeKeywords.forEach(keyword => {
    if (lowerResponse.includes(keyword)) {
      newScore += 0.05;
    }
  });
  
  // 基于决策调整压力分数
  if (decision) {
    if (decision === 'positive' || decision === 'constructive') {
      newScore -= 0.1;
    } else if (decision === 'negative' || decision === 'avoidant') {
      newScore += 0.1;
    }
  }
  
  // 确保分数在0-1范围内
  return Math.max(0, Math.min(1, newScore));
}

module.exports = router;
