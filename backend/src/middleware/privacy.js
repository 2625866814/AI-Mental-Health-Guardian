// 隐私保护中间件与工具
// 对应命题方向8：数据安全与隐私保护
// 包含：数据脱标识、最小必要返回、访问控制、操作留痕

const crypto = require('crypto');

// ============ 1. 数据脱标识工具 ============

// 哈希用户ID（单向不可逆，用于日志/统计场景）
function hashUserId(userId, salt = 'mh_salt_2026') {
  if (!userId) return null;
  return crypto.createHash('sha256').update(`${salt}:${userId}`).digest('hex').substring(0, 16);
}

// 脱敏手机号：138****1234
function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone;
  return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
}

// 脱敏邮箱：a***@example.com
function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [name, domain] = email.split('@');
  if (name.length <= 1) return '*@' + domain;
  return name[0] + '***@' + domain;
}

// 脱敏姓名：张** / 欧阳***
function maskName(name) {
  if (!name) return name;
  if (name.length <= 1) return '*';
  if (name.length === 2) return name[0] + '*';
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
}

// 文本内容轻度脱敏：保留语义，删除可能的身份信息（手机号/身份证/邮箱）
function sanitizeText(text) {
  if (!text) return text;
  let sanitized = text;
  // 替换手机号
  sanitized = sanitized.replace(/1[3-9]\d{9}/g, '[手机号已脱敏]');
  // 替换身份证号
  sanitized = sanitized.replace(/\d{17}[\dXx]/g, '[身份证已脱敏]');
  // 替换邮箱
  sanitized = sanitized.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[邮箱已脱敏]');
  return sanitized;
}

// ============ 2. 最小必要数据返回 ============

// 根据访问者角色决定可返回的字段
// 普通用户只能看自己的完整数据；管理员只能看脱敏后的数据；审计员可看更多
const FIELD_ACCESS_POLICY = {
  // 用户对象字段访问策略
  user: {
    self: ['id', 'username', 'email', 'phone', 'role', 'createdAt'],
    admin: ['id', 'username', 'maskedEmail', 'maskedPhone', 'role', 'createdAt'],
    auditor: ['id', 'hashedId', 'maskedName', 'maskedEmail', 'maskedPhone', 'role', 'createdAt']
  },
  // 日记/对话内容访问策略
  diary: {
    self: 'full',          // 自己可见原文
    admin: 'sanitized',    // 管理员默认看脱敏文本（命题要求：原始对话和个人日记不得无差别开放）
    auditor: 'metadata'    // 审计员只看元数据，不看正文
  },
  // 风险评估结果访问策略
  assessment: {
    self: 'full',
    admin: 'full',         // 风险结论可对管理员开放
    auditor: 'summary'
  }
};

// 根据策略过滤用户对象
function filterUserByRole(userObj, accessorRole) {
  if (!userObj) return userObj;
  // 自己访问自己
  if (accessorRole === 'self') {
    return filterFields(userObj, FIELD_ACCESS_POLICY.user.self);
  }
  // 管理员访问
  if (accessorRole === 'admin') {
    const filtered = filterFields(userObj, FIELD_ACCESS_POLICY.user.admin);
    if (filtered.email) filtered.maskedEmail = maskEmail(filtered.email);
    if (filtered.phone) filtered.maskedPhone = maskPhone(filtered.phone);
    delete filtered.email;
    delete filtered.phone;
    return filtered;
  }
  // 审计员访问
  if (accessorRole === 'auditor') {
    const filtered = filterFields(userObj, FIELD_ACCESS_POLICY.user.auditor);
    filtered.hashedId = hashUserId(userObj.id);
    filtered.maskedName = maskName(userObj.username);
    delete filtered.username;
    delete filtered.email;
    delete filtered.phone;
    return filtered;
  }
  return userObj;
}

// 根据策略过滤日记/对话内容
function filterContentByRole(contentObj, accessorRole, contentType = 'diary') {
  if (!contentObj) return contentObj;
  const policy = FIELD_ACCESS_POLICY[contentType]?.[accessorRole] || 'metadata';

  if (policy === 'full') {
    return contentObj;
  }
  if (policy === 'sanitized') {
    return {
      ...contentObj,
      content: contentObj.content ? sanitizeText(contentObj.content) : contentObj.content,
      _privacyNote: '原始内容已脱敏处理，管理员不可无差别查看原文'
    };
  }
  if (policy === 'metadata') {
    return {
      id: contentObj.id,
      userId: hashUserId(contentObj.userId),
      entryDate: contentObj.entryDate || contentObj.createdAt,
      emotionScore: contentObj.emotionAnalysis?.emotionScore,
      riskLevel: contentObj.riskLevel,
      _privacyNote: '审计员仅可见元数据，正文不可见'
    };
  }
  return contentObj;
}

function filterFields(obj, allowedFields) {
  const filtered = {};
  allowedFields.forEach(f => {
    if (obj[f] !== undefined) filtered[f] = obj[f];
  });
  return filtered;
}

// ============ 3. 访问控制中间件 ============

// 中间件：检查访问者是否有权访问目标用户的数据
function requireDataAccess(targetUserIdField = 'userId') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }
    const targetUserId = req.params[targetUserIdField] || req.body[targetUserIdField] || req.query[targetUserIdField];

    // 管理员可访问所有数据（但受字段策略限制）
    if (req.user.role === 'admin' || req.user.role === 'auditor') {
      req.accessRole = req.user.role;
      return next();
    }
    // 普通用户只能访问自己的数据
    if (String(req.user.id) === String(targetUserId)) {
      req.accessRole = 'self';
      return next();
    }
    return res.status(403).json({
      error: '无权访问该用户的数据',
      privacyNotice: '系统执行最小必要原则，用户数据访问受角色权限控制'
    });
  };
}

// ============ 4. 操作留痕（日志审计） ============

// 敏感操作记录（写入内存，正式环境应写入审计表/日志文件）
const auditLog = [];
const MAX_LOG_SIZE = 1000;

function logAccess(operator, action, target, detail = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    operatorId: operator?.id || 'anonymous',
    operatorRole: operator?.role || 'unknown',
    operatorName: operator?.username || 'unknown',
    action,                          // e.g. 'view_diary', 'view_report', 'export_data'
    targetType: target.type,         // e.g. 'user', 'diary', 'report'
    targetUserId: target.userId ? hashUserId(target.userId) : null,
    targetId: target.id,
    detail,
    ipHash: target.ip ? hashUserId(target.ip) : null
  };
  auditLog.push(entry);
  if (auditLog.length > MAX_LOG_SIZE) auditLog.shift();
  return entry;
}

// 中间件：记录敏感数据访问
function auditAccess(action) {
  return (req, res, next) => {
    if (req.user) {
      logAccess(req.user, action, {
        type: req.params.entity || 'unknown',
        userId: req.params.userId || req.params.id,
        id: req.params.id,
        ip: req.ip
      });
    }
    next();
  };
}

// 获取审计日志（仅审计员/管理员）
function getAuditLog(role) {
  if (role !== 'admin' && role !== 'auditor') return [];
  // 返回脱敏后的审计日志
  return auditLog.map(entry => ({
    ...entry,
    operatorName: maskName(entry.operatorName)
  }));
}

// ============ 5. 隐私声明生成 ============

// 为报告/接口附加隐私声明
function generatePrivacyNotice(dataType) {
  const notices = {
    diary: '本数据已按最小必要原则处理，原始内容仅本人可见，管理员仅可见脱敏后内容',
    assessment: '本评估结果仅作为辅助筛查参考，不作为心理疾病诊断依据，结果不向第三方泄露',
    report: '本报告含个人敏感信息，访问受角色权限控制，重要操作已留痕审计',
    voice: '语音数据采用本地化处理原则，原始音频不长期存储，分析后即删除',
    default: '本数据属于敏感信息，访问与使用受隐私保护策略约束'
  };
  return notices[dataType] || notices.default;
}

module.exports = {
  // 脱标识工具
  hashUserId,
  maskPhone,
  maskEmail,
  maskName,
  sanitizeText,
  // 访问控制
  filterUserByRole,
  filterContentByRole,
  requireDataAccess,
  // 审计
  logAccess,
  auditAccess,
  getAuditLog,
  // 隐私声明
  generatePrivacyNotice,
  // 字段策略
  FIELD_ACCESS_POLICY
};
