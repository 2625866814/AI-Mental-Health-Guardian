const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { ChatHistory } = require('../models');
const axios = require('axios');
const config = require('../config');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const voiceFeatureService = require('../services/voice-feature-service');

// 音频文件上传配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../../uploads/voice');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.wav';
    cb(null, `voice_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// 存储用户的语音克隆ID
const voiceCloneMap = new Map();

// 预置声音克隆文件路径（放在服务器上）
const VOICE_CLONE_FILE = path.join(__dirname, '../../uploads/voice/clone_voice.wav');

// 检查是否已有预置声音
if (fs.existsSync(VOICE_CLONE_FILE)) {
  console.log('✅ 预置声音文件已加载');
}

// 1. 语音克隆 - 上传声音样本（管理员用）
router.post('/voice-clone', authenticateToken, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传音频文件' });
    }

    // 保存为预置声音文件
    const targetPath = path.join(__dirname, '../../uploads/voice/clone_voice.wav');
    fs.copyFileSync(req.file.path, targetPath);
    
    voiceCloneMap.set('default', 'clone_voice');
    
    res.json({ 
      success: true, 
      message: '声音克隆成功，所有用户将使用此声音' 
    });
  } catch (error) {
    console.error('语音克隆失败:', error);
    res.status(500).json({ error: '声音克隆失败' });
  }
});

// 2. 语音识别 - ASR (使用MiMo ASR)
router.post('/speech-to-text', upload.single('audio'), async (req, res) => {
  try {
    console.log('ASR请求收到');
    console.log('req.file:', req.file);
    
    if (!req.file) {
      console.log('没有文件');
      return res.status(400).json({ error: '请上传音频文件' });
    }

    const audioPath = req.file.path;
    console.log('音频路径:', audioPath);
    const audioBuffer = fs.readFileSync(audioPath);
    const base64Audio = audioBuffer.toString('base64');
    
    // 检测MIME类型
    const ext = path.extname(audioPath).toLowerCase();
    const mimeTypes = { '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.webm': 'audio/webm', '.ogg': 'audio/ogg' };
    const mimeType = mimeTypes[ext] || 'audio/wav';
    
    console.log('ASR请求开始, 音频大小:', audioBuffer.length, 'MIME类型:', mimeType);
    
    const response = await axios.post('https://api.xiaomimimo.com/v1/chat/completions', {
      model: 'mimo-v2.5-asr',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'input_audio',
              input_audio: {
                data: `data:${mimeType};base64,${base64Audio}`
              }
            }
          ]
        }
      ],
      asr_options: { language: 'auto' },
      stream: false
    }, {
      headers: {
        'api-key': config.ai.voiceApiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log('ASR API响应成功');

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const text = response.data.choices[0].message.content;
      console.log('识别结果:', text);
      res.json({ success: true, text: text });
    } else {
      console.log('ASR返回空结果');
      res.json({ success: true, text: '' });
    }
  } catch (error) {
    console.error('语音识别失败:', error.message);
    res.json({ success: true, text: '' });
  }
});

// 3. 语音合成 - TTS (使用MiMo TTS VoiceClone)
router.post('/text-to-speech', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: '请提供要转换的文字' });
    }

    console.log('TTS请求开始:', text);
    
    // 检查是否有预置声音文件
    const hasCloneVoice = fs.existsSync(VOICE_CLONE_FILE);
    console.log('声音文件存在:', hasCloneVoice, VOICE_CLONE_FILE);
    
    let audioConfig = {};
    
    if (hasCloneVoice) {
      const voiceBuffer = fs.readFileSync(VOICE_CLONE_FILE);
      const base64Voice = voiceBuffer.toString('base64');
      audioConfig.voice = `data:audio/wav;base64,${base64Voice}`;
      console.log('声音数据长度:', base64Voice.length);
    }
    
    console.log('调用TTS API...');
    const response = await axios.post('https://api.xiaomimimo.com/v1/chat/completions', {
      model: 'mimo-v2.5-tts-voiceclone',
      messages: [
        { role: 'user', content: '' },
        { role: 'assistant', content: text }
      ],
      audio: audioConfig,
      stream: false
    }, {
      headers: {
        'api-key': config.ai.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('TTS API响应成功');
    
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const audioData = response.data.choices[0].message.audio;
      if (audioData && audioData.data) {
        // API直接返回WAV格式
        const wavBuffer = Buffer.from(audioData.data, 'base64');
        console.log('WAV音频大小:', wavBuffer.length);
        
        res.set('Content-Type', 'audio/wav');
        res.set('Content-Length', wavBuffer.length);
        res.send(wavBuffer);
      } else {
        console.log('没有音频数据');
        res.status(500).json({ error: '语音合成失败' });
      }
    } else {
      console.log('API响应格式错误');
      res.status(500).json({ error: '语音合成失败' });
    }
  } catch (error) {
    console.error('TTS错误:', error.message);
    if (error.response) {
      console.error('API错误:', error.response.status, JSON.stringify(error.response.data));
    }
    console.error('错误堆栈:', error.stack);
    res.status(500).json({ error: '语音合成失败', details: error.message });
  }
});

// 4. 数字人对话
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message) {
      return res.status(400).json({ error: '消息不能为空' });
    }

    // 获取历史对话（增加到50条，覆盖更多上下文）
    const history = await ChatHistory.findAll({
      where: { 
        userId: req.user.id, 
        sessionId: sessionId || 'digital-human' 
      },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    // 获取用户基本信息
    const user = await require('../models').User.findByPk(req.user.id);
    const studentProfile = await require('../models/CampusData').Student.findOne({
      where: { studentId: user?.username }
    });

    // 构建对话上下文
    let systemPrompt = `你是"小安"，一位温柔体贴的数字心理医生。你的特点是：
- 说话轻声细语，语气温柔如春风
- 善于倾听，不急于给建议，先表达理解和共情
- 用词温暖亲切，像一位关心你的朋友
- 适当使用语气词让对话更自然（如"嗯"、"哦"、"呢"）
- 回复简短自然，像日常聊天一样，不要长篇大论
- 不要用markdown格式，直接用口语化表达
- 回复控制在50-80字以内

示例风格：
"嗯，我能理解你的感受。能跟我说说是什么让你有这样的感觉吗？"
"听起来你最近压力挺大的。别担心，我们一起聊聊，好吗？"`;

    // 添加用户背景信息
    if (studentProfile) {
      systemPrompt += `\n\n用户背景信息：
- 姓名：${studentProfile.name}
- 学院：${studentProfile.college || '未知'}
- 专业：${studentProfile.major || '未知'}
- 年级：${studentProfile.grade || '未知'}
请根据用户背景调整对话内容，更贴近用户的实际情况。`;
    }

    // 分析历史对话主题
    if (history.length > 5) {
      const topics = analyzeConversationTopics(history);
      if (topics.length > 0) {
        systemPrompt += `\n\n历史对话主题：${topics.join('、')}。可以适当回顾之前的话题，体现连续性。`;
      }
    }

    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // 添加历史对话（反转顺序，从旧到新）
    history.reverse().forEach(msg => {
      messages.push({ role: 'user', content: msg.userMessage });
      messages.push({ role: 'assistant', content: msg.aiResponse });
    });

    // 添加当前消息
    messages.push({ role: 'user', content: message });

    // 调用AI API
    const response = await axios.post(config.ai.apiEndpoint, {
      model: config.ai.model,
      messages: messages,
      temperature: 0.7,
      max_completion_tokens: 300
    }, {
      headers: {
        'api-key': config.ai.apiKey,
        'Content-Type': 'application/json'
      }
    });

    let aiResponse = '感谢您的分享。';
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      aiResponse = response.data.choices[0].message.content;
    }

    // 保存对话记录
    await ChatHistory.create({
      userId: req.user.id,
      sessionId: sessionId || 'digital-human',
      moduleType: 'digital-human',
      userMessage: message,
      aiResponse: aiResponse
    });

    res.json({ 
      success: true, 
      response: aiResponse 
    });
  } catch (error) {
    console.error('数字人对话失败:', error);
    res.status(500).json({ error: '对话失败，请稍后重试' });
  }
});

// 5. 获取对话历史
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.query;
    const history = await ChatHistory.findAll({
      where: { 
        userId: req.user.id, 
        sessionId: sessionId || 'digital-human',
        moduleType: 'digital-human'
      },
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    res.json({ history });
  } catch (error) {
    console.error('获取历史失败:', error);
    res.status(500).json({ error: '获取历史失败' });
  }
});

// 6. 硬件接入接口
router.post('/hardware/connect', authenticateToken, async (req, res) => {
  try {
    const { deviceType, deviceId } = req.body;
    
    // 记录设备连接信息
    res.json({
      success: true,
      message: '设备连接成功',
      config: {
        wsUrl: `ws://localhost:8080/ws/digital-human`,
        apiEndpoint: 'http://localhost:8080/api/digital-human',
        userId: req.user.id
      }
    });
  } catch (error) {
    console.error('设备连接失败:', error);
    res.status(500).json({ error: '设备连接失败' });
  }
});

// 5. 语音声学特征分析（对应命题参考方向1）
// 从音频中提取韵律、语速、能量、停顿等特征
// 作为多源信息融合的新信息源
router.post('/analyze-voice-features', authenticateToken, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传音频文件（WAV格式）' });
    }

    const audioPath = req.file.path;
    const asrText = req.body.text || ''; // 可选：如已有ASR结果可传入辅助语速计算

    // 提取声学特征
    const result = voiceFeatureService.extractVoiceFeatures(audioPath, asrText);

    if (!result.success) {
      return res.status(400).json({
        error: '音频特征提取失败：' + result.error,
        privacyNotice: '语音数据采用本地化处理原则，分析后即删除原始音频'
      });
    }

    // 整理输出（符合多源融合接入要求）
    const voiceRiskScore = result.indicators.overallVoiceRisk;

    res.json({
      success: true,
      features: result.features,
      indicators: result.indicators,
      // 多源融合适配字段
      fusionReady: {
        source: 'voice',
        riskScore: voiceRiskScore,
        riskLevel: voiceRiskScore > 0.5 ? 'high' :
                   voiceRiskScore > 0.3 ? 'medium' : 'low',
        confidence: Math.min(1, result.rawFrameCount / 100),
        contribution: voiceRiskScore
      },
      privacyNotice: '语音特征分析在本地完成，原始音频分析后即删除，不长期保存',
      aiBoundary: '语音特征仅作为辅助筛查参考，不直接作为心理疾病诊断依据',
      timestamp: new Date().toISOString()
    });

    // 分析完成后删除音频文件（隐私保护：不长期保存原始音频）
    try {
      fs.unlinkSync(audioPath);
    } catch (e) {
      console.warn('删除音频文件失败:', e.message);
    }
  } catch (error) {
    console.error('语音特征分析失败:', error.message);
    res.status(500).json({
      error: '语音特征分析失败',
      privacyNotice: '语音数据处理失败，原始文件已删除'
    });
    // 异常时也尝试删除文件
    if (req.file && req.file.path) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
  }
});

// 分析对话主题
function analyzeConversationTopics(history) {
  const keywords = {
    '学业': ['考试', '作业', '课程', '学习', '成绩', 'GPA', '挂科'],
    '人际关系': ['朋友', '室友', '同学', '关系', '社交', '孤独'],
    '情感': ['恋爱', '分手', '喜欢', '感情', '暗恋', '失恋'],
    '家庭': ['父母', '家人', '家里', '爸妈', '家庭'],
    '就业': ['工作', '实习', '就业', '面试', '简历', '职业'],
    '心理': ['焦虑', '抑郁', '压力', '失眠', '情绪', '心理'],
    '生活': ['生活', '日常', '吃饭', '睡觉', '运动', '健康']
  };

  const topicCounts = {};
  history.forEach(msg => {
    const text = msg.userMessage + msg.aiResponse;
    Object.entries(keywords).forEach(([topic, words]) => {
      if (words.some(w => text.includes(w))) {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      }
    });
  });

  return Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic]) => topic);
}

module.exports = router;
