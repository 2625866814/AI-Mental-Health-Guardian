require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 8080,
    env: process.env.NODE_ENV || 'development'
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'ai_mental_health'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'ai-mental-health-secret-key-2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  ai: {
    apiKey: process.env.AI_API_KEY,
    apiEndpoint: process.env.AI_API_ENDPOINT,
    model: process.env.AI_MODEL || 'mimo-v2-flash',
    voiceApiKey: process.env.VOICE_API_KEY
  },
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760
  },
  knowledge: {
    dir: process.env.KNOWLEDGE_BASE_DIR || './knowledge_base',
    enabled: process.env.ENABLE_KNOWLEDGE_BASE === 'true'
  }
};
