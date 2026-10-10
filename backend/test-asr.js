const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const config = require('./src/config');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, 'uploads/voice');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.wav';
    cb(null, 'test_' + Date.now() + ext);
  }
});
const upload = multer({ storage });

const app = express();
app.post('/test-asr', upload.single('audio'), async (req, res) => {
  try {
    console.log('收到请求');
    if (!req.file) {
      return res.status(400).json({ error: '没有文件' });
    }
    console.log('文件:', req.file.path, '大小:', req.file.size);
    const audioBuffer = fs.readFileSync(req.file.path);
    const base64Audio = audioBuffer.toString('base64');
    console.log('Base64长度:', base64Audio.length);
    
    const response = await axios.post('https://api.xiaomimimo.com/v1/chat/completions', {
      model: 'mimo-v2.5-asr',
      messages: [{ role: 'user', content: [{ type: 'input_audio', input_audio: { data: 'data:audio/wav;base64,' + base64Audio } }] }],
      asr_options: { language: 'auto' },
      stream: false
    }, { headers: { 'api-key': config.ai.voiceApiKey, 'Content-Type': 'application/json' } });
    
    console.log('API响应:', response.status);
    res.json({ text: response.data.choices[0].message.content });
  } catch (error) {
    console.error('错误:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(8081, () => console.log('测试服务器启动在8081'));
