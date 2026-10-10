const express = require('express');
const { ChatHistory } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const axios = require('axios');
const config = require('../config');

const router = express.Router();

// 发送消息
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { message, sessionId, moduleType } = req.body;

    if (!message) {
      return res.status(400).json({ error: '消息内容不能为空' });
    }

    // 获取对话历史
    const history = await ChatHistory.findAll({
      where: {
        userId: req.user.id,
        sessionId: sessionId || 'default'
      },
      order: [['createdAt', 'ASC']],
      limit: 50
    });

    // 调用AI API获取回复
    const aiResponse = await callAIAPI(message, history, moduleType);

    // 保存对话记录
    const chatRecord = await ChatHistory.create({
      userId: req.user.id,
      sessionId: sessionId || 'default',
      moduleType: moduleType || 'general',
      userMessage: message,
      aiResponse
    });

    res.json({
      success: true,
      response: aiResponse,
      messageId: chatRecord.id,
      timestamp: chatRecord.createdAt
    });
  } catch (error) {
    console.error('发送消息失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取对话历史
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { sessionId, limit } = req.query;
    
    const whereClause = { userId: req.user.id };
    if (sessionId) {
      whereClause.sessionId = sessionId;
    }

    const history = await ChatHistory.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit) || 100
    });

    res.json({ history });
  } catch (error) {
    console.error('获取历史失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 清空对话历史
router.delete('/history', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.query;
    
    const whereClause = { userId: req.user.id };
    if (sessionId) {
      whereClause.sessionId = sessionId;
    }

    await ChatHistory.destroy({
      where: whereClause
    });

    res.json({ message: '历史记录已清空' });
  } catch (error) {
    console.error('清空历史失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取会话列表
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    // 获取用户的所有会话ID
    const sessions = await ChatHistory.findAll({
      attributes: ['sessionId', [require('sequelize').fn('MAX', require('sequelize').col('createdAt')), 'lastMessage']],
      where: { userId: req.user.id },
      group: ['sessionId'],
      order: [[require('sequelize').fn('MAX', require('sequelize').col('createdAt')), 'DESC']]
    });

    res.json({ sessions });
  } catch (error) {
    console.error('获取会话列表失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 辅助函数：清理AI回复中的markdown格式
function cleanMarkdown(text) {
  if (!text) return text;
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// 辅助函数：调用AI API
async function callAIAPI(message, history, moduleType) {
  try {
    // 构建系统提示
    let systemPrompt = '你是心理咨询师，擅长倾听和理解用户感受。用纯文本回复，控制在100字以内。';
    
    if (moduleType === 'mental-health') {
      systemPrompt = '你是心理医生，正在评估用户心理健康。保持专业温暖，用纯文本回复，100字以内。';
    } else if (moduleType === 'astrology') {
      systemPrompt = '你是占星师兼心理学家，将占星与心理学结合提供分析。用纯文本回复，100字以内。';
    } else if (moduleType === 'art-therapy') {
      systemPrompt = '你是艺术治疗师，通过艺术创作帮助用户表达情绪。用纯文本回复，100字以内。';
    } else if (moduleType === 'diary') {
      systemPrompt = '你是情绪分析专家，从文本分析情绪状态并提供建议。用纯文本回复，100字以内。';
    }

    const messages = [
      { role: 'system', content: systemPrompt }
    ];
    
    // 只保留最近6轮对话
    const recentHistory = history.slice(-12);
    recentHistory.forEach(record => {
      messages.push({ role: 'user', content: record.userMessage });
      messages.push({ role: 'assistant', content: record.aiResponse });
    });
    
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

module.exports = router;
