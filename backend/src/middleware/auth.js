const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');

// 认证中间件
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    req.user = user.toSafeObject();
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '令牌已过期' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: '无效的令牌' });
    }
    return res.status(500).json({ error: '认证失败' });
  }
};

// 可选认证中间件（不强制要求认证）
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findByPk(decoded.id);
      if (user) {
        req.user = user.toSafeObject();
      }
    }
    next();
  } catch (error) {
    // 忽略认证错误，继续处理请求
    next();
  }
};

// 管理员权限中间件
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: '需要管理员权限' });
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin
};
