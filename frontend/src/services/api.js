import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getUser: () => api.get('/auth/user'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data)
};

// 心理健康测试API
export const mentalHealthAPI = {
  getQuestions: () => api.get('/mental-health/questions'),
  submitTest: (data) => api.post('/mental-health/submit', data),
  getHistory: () => api.get('/mental-health/history'),
  getStats: () => api.get('/mental-health/stats'),
  chat: (data) => api.post('/mental-health/chat', data),
  // 管理员API
  getAdminAlerts: () => api.get('/mental-health/admin/alerts'),
  getAdminUsers: () => api.get('/mental-health/admin/users'),
  addActivity: (data) => api.post('/mental-health/admin/activity', data),
  getArchaeology: (userId) => api.get(`/mental-health/admin/archaeology/${userId}`)
};

// 星盘分析API
export const astrologyAPI = {
  analyzeMBTI: (data) => api.post('/astrology/mbti', data),
  testAstrology: (data) => api.post('/astrology/test', data),
  getHistory: () => api.get('/astrology/history')
};

// 艺术疗愈API
export const artAPI = {
  saveDrawing: (data) => api.post('/art/drawing', data),
  saveMusic: (data) => api.post('/art/music', data),
  getHistory: (userId) => api.get(`/art/history/${userId}`),
  getAnalysis: (userId) => api.get(`/art/analysis/${userId}`)
};

// 日记API
export const diaryAPI = {
  save: (data) => api.post('/diary/save', data),
  getHistory: (params) => api.get('/diary/history', { params }),
  analyze: (data) => api.post('/diary/analyze', data),
  getTrend: (params) => api.get('/diary/trend', { params })
};

// 对话API
export const chatAPI = {
  send: (data) => api.post('/chat/send', data),
  getHistory: (params) => api.get('/chat/history', { params }),
  clearHistory: (params) => api.delete('/chat/history', { params }),
  getSessions: () => api.get('/chat/sessions')
};

// 平行人格剧场API
export const personalityAPI = {
  createSession: (data) => api.post('/personality/session', data),
  getResponse: (data) => api.post('/personality/response', data),
  getHistory: () => api.get('/personality/history'),
  getScenarios: () => api.get('/personality/scenarios')
};

// 梦境解析API
export const dreamAPI = {
  analyze: (data) => api.post('/dream/analyze', data)
};

// 多维度感知API
export const perceptionAPI = {
  saveStudentProfile: (data) => api.post('/perception/student-profile', data),
  getStudentProfile: () => api.get('/perception/student-profile'),
  recordBehavior: (data) => api.post('/perception/behavior', data),
  getPerception: () => api.get('/perception/perception'),
  getPerceptionHistory: () => api.get('/perception/perception/history'),
  getAdminOverview: () => api.get('/perception/admin/overview')
};

// 数字人API
export const digitalHumanAPI = {
  voiceClone: (formData) => api.post('/digital-human/voice-clone', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  speechToText: (formData) => api.post('/digital-human/speech-to-text', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  textToSpeech: (data) => api.post('/digital-human/text-to-speech', data, { responseType: 'blob' }),
  chat: (data) => api.post('/digital-human/chat', data),
  getHistory: (params) => api.get('/digital-human/history', { params }),
  connectHardware: (data) => api.post('/digital-human/hardware/connect', data)
};

// 校园数据API
export const campusAPI = {
  // 学生管理
  getStudents: (params) => api.get('/campus/students', { params }),
  getStudent: (id) => api.get(`/campus/students/${id}`),
  addStudent: (data) => api.post('/campus/students', data),
  updateStudent: (id, data) => api.put(`/campus/students/${id}`, data),
  deleteStudent: (id) => api.delete(`/campus/students/${id}`),
  batchAddStudents: (students) => api.post('/campus/students/batch', { students }),
  
  // 文件导入
  importData: (dataType, formData) => api.post(`/campus/import/${dataType}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getTemplate: (dataType) => api.get(`/campus/template/${dataType}`, { responseType: 'blob' }),
  getImportHistory: () => api.get('/campus/import-history'),
  
  // 统计和选项
  getStats: () => api.get('/campus/stats'),
  getOptions: () => api.get('/campus/options')
};

// 成就系统API
export const achievementAPI = {
  checkIn: () => api.post('/achievement/checkin'),
  getPoints: () => api.get('/achievement/points'),
  getAchievements: () => api.get('/achievement/achievements'),
  getCheckInCalendar: (month) => api.get('/achievement/checkin-calendar', { params: { month } })
};

// 数据大屏API
export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview'),
  getTrends: (days) => api.get('/dashboard/trends', { params: { days } }),
  getEmotionStats: () => api.get('/dashboard/emotion-stats'),
  getCollegeRisk: () => api.get('/dashboard/college-risk'),
  getAchievementStats: () => api.get('/dashboard/achievement-stats')
};

// 通知系统API
export const notificationAPI = {
  getNotifications: (params) => api.get('/notification/notifications', { params }),
  markRead: (id) => api.put(`/notification/notifications/${id}/read`),
  markAllRead: () => api.put('/notification/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notification/notifications/${id}`),
  sendNotification: (data) => api.post('/notification/notifications/send', data),
  broadcast: (data) => api.post('/notification/notifications/broadcast', data)
};

// 心情打卡API
export const moodAPI = {
  getToday: () => api.get('/notification/mood/today'),
  checkIn: (data) => api.post('/notification/mood/checkin', data),
  getCalendar: (month) => api.get('/notification/mood/calendar', { params: { month } }),
  getStats: (days) => api.get('/notification/mood/stats', { params: { days } })
};

// 周报月报API
export const reportAPI = {
  getWeekly: () => api.get('/notification/report/weekly'),
  getMonthly: () => api.get('/notification/report/monthly'),
  getAdminWeekly: () => api.get('/notification/report/admin/weekly')
};

// 增强版评估API
export const enhancedAPI = {
  // 获取量表题目
  getScaleQuestions: (type) => api.get(`/enhanced/scale/${type}`),
  
  // 提交PHQ-9测评
  submitPHQ9: (answers) => api.post('/enhanced/phq9', { answers }),
  
  // 提交GAD-7测评
  submitGAD7: (answers) => api.post('/enhanced/gad7', { answers }),
  
  // 综合评估
  submitComprehensive: (data) => api.post('/enhanced/comprehensive', data),
  
  // 增强版AI对话
  enhancedChat: (data) => api.post('/enhanced/enhanced-chat', data),
  
  // 获取综合报告
  getReport: () => api.get('/enhanced/report'),
  
  // 获取情绪趋势
  getEmotionTrend: (days) => api.get('/enhanced/emotion-trend', { params: { days } }),
  
  // 获取测评历史
  getAssessmentHistory: (type, limit) => api.get('/enhanced/assessment-history', { params: { type, limit } })
};

export default api;
