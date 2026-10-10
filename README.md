# AI 心理健康卫士（AI Mental Health Guardian）

> 基于多源智能感知的心理健康风险筛查与智能预警平台
> 🏆 "青创北京"2026 年"挑战杯"首都大学生创业计划竞赛"青砺基层"社会治理专项赛 **一等奖**（市级）
> 🏆 第五届"京彩大创"北京大学生创新创业大赛人工智能赛道 **三等奖**（市级）

## 项目概述

AI 心理健康卫士是一个综合性的大学生心理健康服务平台，围绕「**筛查 — 分析 — 干预**」闭环构建：

1. **心理健康测试** —— SCL-90 量表评估 + 大模型对话式动态评估
2. **多模态情绪感知** —— 文本 / 语音（ASR + 声学特征）/ 面部表情多源信号融合
3. **智能对话陪伴** —— 基于大模型 API 的情绪疏导与干预建议生成
4. **每日日记** —— 情绪记录 + 大模型情感分析
5. **艺术疗愈工坊** —— 绘画与音乐创作疗愈
6. **平行人格剧场** —— 虚拟化身压力训练与情景演练
7. **校园数据看板** —— 面向辅导员的学生档案、心理测评记录与风险预警管理

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 · Tailwind CSS · React Router v6 · Vite |
| 后端 | Node.js · Express.js · Sequelize ORM · JWT 认证 |
| 数据库 | SQLite（零配置默认）/ MySQL（可选） |
| AI 能力 | 大模型 API（对话评估、情绪分析）、ASR 语音识别、TTS 语音合成 |

## 快速开始

### 前置要求

- Node.js >= 14.0.0
- npm 或 yarn

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/<your-username>/ai-mental-health-guardian.git
   cd ai-mental-health-guardian
   ```

2. **配置环境变量**
   ```bash
   cp .env.example backend/.env
   # 编辑 backend/.env，填入你的 AI API Key 等配置
   ```
   默认使用 SQLite，无需安装数据库即可启动。

3. **安装依赖**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

4. **启动项目**

   Windows 用户可直接双击根目录的 `启动项目.bat`，或手动启动：
   ```bash
   # 终端 1：启动后端（默认 8080 端口）
   cd backend
   npm run dev

   # 终端 2：启动前端（默认 5173 端口）
   cd frontend
   npm run dev
   ```

5. **访问应用**
   - 前端：http://localhost:5173
   - 后端 API：http://localhost:8080

## 项目结构

```
ai-mental-health-guardian/
├── frontend/                    # React 前端
│   └── src/
│       ├── components/          # 通用组件
│       ├── pages/               # 页面组件
│       ├── context/             # Context 状态管理
│       └── services/            # API 服务
├── backend/                     # Express 后端
│   ├── src/
│   │   ├── config/              # 环境配置（dotenv）
│   │   ├── models/              # Sequelize 数据模型
│   │   ├── routes/              # API 路由
│   │   ├── services/            # 业务服务（大模型调用等）
│   │   └── middleware/          # JWT 认证等中间件
│   ├── scripts/                 # 数据初始化脚本
│   └── knowledge_base/          # 心理知识库文件
├── database/                    # 数据库相关
├── docs/                        # 项目文档
└── .env.example                 # 环境变量模板
```

## 核心API

### 认证
- `POST /api/auth/register` —— 用户注册
- `POST /api/auth/login` —— 用户登录
- `GET /api/auth/user` —— 获取用户信息

### 心理健康测试
- `GET /api/mental-health/questions` —— 获取量表题目
- `POST /api/mental-health/submit` —— 提交测试
- `POST /api/mental-health/chat` —— 大模型对话式评估

### 情绪与干预
- `POST /api/diary/analyze` —— 日记情绪分析
- `POST /api/chat/send` —— 智能对话陪伴
- `POST /api/personality/session` —— 平行人格剧场会话

### 校园管理端
- `GET /api/campus/students` —— 学生档案（支持分页/筛选）
- `POST /api/campus/import` —— Excel 批量导入学生数据

## 安全说明

- 所有密钥均通过环境变量（`.env`）注入，仓库中仅保留 `.env.example` 模板
- `.env`、上传文件、用户数据库已被 `.gitignore` 排除
- JWT 密钥、数据库密码请勿使用示例值，部署前务必替换

## 开发说明

### 添加新功能

1. 在 `backend/src/models/` 添加数据模型
2. 在 `backend/src/routes/` 添加 API 路由
3. 在 `frontend/src/pages/` 添加页面组件
4. 在 `frontend/src/services/api.js` 添加 API 调用

## 许可证

MIT License
