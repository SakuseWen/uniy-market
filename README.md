# 🎓 Uniy Market — 校园二手交易平台 / Campus Second-Hand Trading Platform

> 泰国玛希隆大学信息与通信技术学院（ICT）**UniyMarket 团队**毕业设计项目  
> A Senior Project by the **UniyMarket Team**, Faculty of ICT, Mahidol University

**在线演示 / Live Demo:** [https://uniymarket.com](https://uniymarket.com)

---

## 📖 项目简介 / Overview

Uniy Market 是一个面向大学校园的 C2C 二手商品交易平台，为大学生提供安全、可信的校园内买卖环境。

Uniy Market is a full-stack C2C second-hand trading platform designed for university students, providing a safe and verified environment for buying and selling used goods within campus communities.

**核心特性 / Key Features:**

- 🌐 **三语界面** — 中文 / English / ไทย 全站切换，覆盖 UI、搜索同义词、错误提示、帮助中心
- 🔍 **Meilisearch 智能搜索** — 330+ 组三语同义词互通，拼写容错，毫秒级响应，SQL 自动回退
- 💬 **实时聊天** — Socket.IO 驱动，文本/图片消息、已读回执、在线状态、消息翻译
- 🔒 **双重认证** — 邮箱验证 + 教育邮箱认证（.edu / .ac.*），确保卖家身份可信
- 🛒 **完整交易流程** — 请求 → 接受 → 双方确认 → 完成，含评价系统
- 📊 **管理后台** — 用户管理（暂停/激活/硬删除）、商品审核、举报处理、审计日志
- 🗺️ **地图定位** — Leaflet + OpenStreetMap，商品发布时可选点标注位置
- 📱 **移动端适配** — Tailwind CSS v4 JIT 响应式设计
- 🔑 **忘记密码** — 邮箱验证码三步重置流程
- 💱 **汇率换算** — 泰铢实时转换人民币/美元（ExchangeRate-API）

---

## 🛠 技术栈 / Tech Stack

### 后端 / Backend

| 技术 / Technology | 用途 / Purpose |
|------------------|---------------|
| Node.js + Express 4 | HTTP 服务框架 / HTTP server framework |
| TypeScript 5 | 类型安全 / Type safety |
| SQLite3 | 轻量级关系数据库 / Lightweight relational database |
| Meilisearch | 全文搜索引擎（同义词、容错、过滤、排序）/ Full-text search engine |
| Socket.IO 4 | WebSocket 实时通信 / Real-time communication |
| JWT (jsonwebtoken) | 身份认证与会话管理 / Authentication & sessions |
| bcryptjs | 密码哈希加密 / Password hashing |
| Sharp | 图片压缩与处理 / Image compression |
| Multer | 文件上传处理 / File upload handling |
| Resend | 邮件发送（验证码）/ Email service |
| Google Cloud Translate | 聊天消息翻译 / Chat message translation |
| Helmet + CORS + express-rate-limit | 安全防护与限流 / Security & rate limiting |

### 前端 / Frontend

| 技术 / Technology | 用途 / Purpose |
|------------------|---------------|
| React 18 | UI 框架 / UI framework |
| Vite 6 | 构建工具 / Build tool |
| Tailwind CSS v4 | 原子化样式（JIT 编译）/ Utility-first CSS with JIT |
| React Router v7 | 客户端路由 / Client-side routing |
| Radix UI | 无障碍组件库（20+ 组件）/ Accessible component primitives |
| Socket.IO Client | WebSocket 客户端 / WebSocket client |
| Axios | HTTP 客户端（含拦截器）/ HTTP client with interceptors |
| Leaflet + React-Leaflet | 交互式地图 / Interactive maps |
| Recharts | 数据可视化 / Data visualization |
| Sonner | Toast 通知 / Toast notifications |

### 基础设施 / Infrastructure

| 技术 / Technology | 用途 / Purpose |
|------------------|---------------|
| AWS EC2 (Singapore) | 云服务器 / Cloud hosting |
| Nginx | 反向代理、静态文件、SSL / Reverse proxy & SSL |
| Cloudflare | CDN、DNS、DDoS 防护 / CDN & DNS & protection |
| PM2 | 进程管理 / Process manager |

---

## 📁 项目结构 / Project Structure

```
uniy-market/
├── src/                          # 后端源码 / Backend source
│   ├── index.ts                  # 入口（路由、中间件、WebSocket、Meilisearch 初始化）
│   ├── config/
│   │   ├── database.ts           # SQLite 数据库 Schema 与迁移
│   │   ├── upload.ts             # Multer 文件上传配置
│   │   └── synonyms.json         # Meilisearch 同义词字典（330+ 组）
│   ├── routes/
│   │   ├── authPassword.ts       # 登录、注册、忘记密码、教育认证
│   │   ├── product.ts            # 商品 CRUD + Meilisearch 双写 + 搜索
│   │   ├── search.ts             # 专用搜索 API（Meilisearch 优先）
│   │   ├── chat.ts               # 聊天房间、消息、翻译、已读回执
│   │   ├── deal.ts               # 交易流程 + 批量状态查询
│   │   ├── admin.ts              # 管理后台（用户/商品/举报/索引同步）
│   │   ├── report.ts             # 举报系统（含证据图片）
│   │   ├── review.ts             # 评价系统（含图片）
│   │   └── ...                   # favorite, comment, dealNotification
│   ├── services/
│   │   ├── MeilisearchService.ts # 搜索引擎封装（初始化、同义词、双写）
│   │   ├── AdminService.ts       # 管理操作（暂停/激活/硬删除）
│   │   ├── WebSocketService.ts   # Socket.IO 服务（聊天、通知、已读回执）
│   │   ├── AuthService.ts        # JWT 验证、会话管理
│   │   └── emailService.ts       # Resend 邮件发送
│   ├── models/                   # 数据模型（SQLite CRUD 封装）
│   ├── middleware/               # Express 中间件
│   │   ├── auth.ts               # JWT 认证 + requireActiveUser
│   │   ├── rateLimiter.ts        # 分级请求限流
│   │   ├── contentModeration.ts  # 内容审核
│   │   └── imageProcessing.ts    # Sharp 图片压缩
│   └── locales/                  # 后端多语言文件（en/zh/th）
│
├── Product Retrieval Main Page/  # 前端源码 / Frontend source
│   ├── src/
│   │   ├── pages/                # 页面组件（14 个路由）
│   │   ├── components/           # 可复用组件 + ui/ (shadcn 40+)
│   │   ├── services/             # API 服务层
│   │   ├── hooks/                # 自定义 Hooks（WebSocket、商品列表）
│   │   ├── lib/                  # 工具库（i18n、config、imageUtils）
│   │   └── styles/globals.css    # Tailwind v4 源文件 + 主题变量
│   ├── vite.config.ts
│   └── package.json
│
├── data/                         # SQLite 数据库文件（运行时自动创建）
├── public/uploads/               # 用户上传文件（头像、商品图、消息图、举报证据）
├── deploy.sh                     # 生产部署脚本（rsync 到 AWS）
└── package.json                  # 后端依赖与脚本
```

---

## 🚀 本地启动 / Getting Started

### 前置要求 / Prerequisites
- **Node.js** >= 20.x
- **npm** >= 10.x
- **Meilisearch** >= 1.x（可选，不安装则自动回退 SQL 搜索）

### 1. 克隆与安装 / Clone & Install

```bash
git clone https://github.com/SakuseWen/uniy-market.git
cd uniy-market

# 后端依赖 / Backend
npm install

# 前端依赖 / Frontend
cd "Product Retrieval Main Page"
npm install
cd ..
```

### 2. 配置环境变量 / Environment Variables

```bash
cp .env.example .env
```

编辑 `.env` / Edit `.env`:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=./data/uniy_market.db
JWT_SECRET=your-secret-key-at-least-32-characters
SESSION_SECRET=your-session-secret
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# 邮件服务 / Email (Resend)
RESEND_API_KEY=your-resend-api-key

# Meilisearch（可选 / optional）
MEILI_HOST=http://localhost:7700
MEILI_API_KEY=

# Google 翻译（可选 / optional）
GOOGLE_TRANSLATE_API_KEY=your-key
```

### 3. 启动开发服务 / Start Development

```bash
# 终端 1：后端 / Terminal 1: Backend
npm run dev
# ✅ 🚀 Uniy Market server running on port 3000

# 终端 2：前端 / Terminal 2: Frontend
cd "Product Retrieval Main Page"
npm run dev
# ✅ Local: http://localhost:5173/
```

### 4. 可选：启动 Meilisearch / Optional: Start Meilisearch

```bash
# macOS
brew install meilisearch && meilisearch

# Docker
docker run -d -p 7700:7700 getmeili/meilisearch:latest

# 验证 / Verify
curl http://localhost:7700/health
```

---

## 🌐 生产部署 / Production Deployment

### 部署脚本 / Deploy Script
```bash
bash deploy.sh   # rsync 代码到 AWS EC2
```

### 服务器操作 / On Server (SSH)
```bash
cd ~/uniy-market

# 后端构建与重启 / Backend build & restart
npm run build
cp src/config/synonyms.json dist/config/
cp -r src/locales dist/
pm2 restart uniy-api

# 前端构建 / Frontend build
cd "Product Retrieval Main Page"
npm install
npm run build
```

### 注意事项 / Important Notes
- 前端使用 `VITE_API_URL=/api`（通过 Nginx 同源代理）
- 生产环境 Meilisearch 需要在 `.env` 中配置 `MEILI_API_KEY`
- 每次前端 build 后需清除 Cloudflare 缓存（或设置 Page Rule 绕过 HTML 缓存）
- `deploy.sh` 排除了 `data/`、`.env`、`node_modules`

---

## 🔑 核心功能详解 / Feature Details

### 搜索系统 / Search System
- **Meilisearch 优先**：所有搜索请求先走 Meilisearch，失败自动回退 SQL LIKE
- **330+ 同义词组**：三语互通（搜"手机" = "phone" = "โทรศัพท์"）
- **双写同步**：商品增删改自动同步 Meilisearch 索引
- **批量状态查询**：`POST /api/deals/batch-status` 替代 N+1 查询

### 认证与安全 / Authentication & Security
- 邮箱验证码注册（6 位数字，通过 Resend 发送）
- 教育邮箱认证（.edu / .ac.* 域名）
- 管理员可撤销教育认证（被撤销用户无法自行重新认证）
- 被暂停用户可登录但所有写操作被阻止
- 分级 IP 限流：API 10000/15min、认证 50/15min、上传 100/hr
- 支持 Nginx 反向代理（`X-Real-IP` / `X-Forwarded-For`）

### 实时聊天 / Real-time Chat
- Socket.IO WebSocket + JWT 认证
- 文本与图片消息（上传前客户端自动压缩）
- 实时已读回执（对方在聊天页面时自动标记已读并推送）
- Google Cloud Translate 消息翻译
- 正在输入状态提示

### 管理后台 / Admin Dashboard
- 用户管理：暂停、激活、硬删除、教育认证授予/撤销
- 商品管理：查看所有商品、硬删除（同步从数据库 + Meilisearch 移除）
- 举报管理：显示商品标题（已删除商品显示三语"已删除"提示）、解决/驳回
- 搜索索引全量同步

### 交易流程 / Deal Lifecycle
1. 买家发起购买请求
2. 卖家接受/拒绝
3. 双方分别确认交易完成
4. 交易完成，双方可互评

---

## 📡 API 端点概览 / API Endpoints

| 方法 | 端点 | 说明 / Description |
|------|------|-------------------|
| POST | `/api/auth/login` | 登录 / Login |
| POST | `/api/auth/register` | 注册 + 发送验证码 / Register |
| POST | `/api/auth/verify-code` | 验证邮箱 / Verify email |
| POST | `/api/auth/forgot-password/send-code` | 忘记密码 / Forgot password |
| POST | `/api/auth/edu-verify/send-code` | 教育认证 / Education verification |
| GET | `/api/products?q=&category=&sortBy=` | 搜索商品 / Search products |
| GET | `/api/products/:id` | 商品详情（含卖家统计）/ Product detail |
| POST | `/api/products` | 创建商品 / Create product |
| POST | `/api/chats` | 创建/获取聊天房间 / Create/get chat |
| POST | `/api/chats/:id/messages` | 发送消息 / Send message |
| PUT | `/api/chats/:id/read` | 标记已读（触发 WebSocket）/ Mark read |
| POST | `/api/deals` | 创建交易请求 / Create deal |
| PUT | `/api/deals/:id/accept` | 卖家接受 / Seller accepts |
| PUT | `/api/deals/:id/confirm` | 确认完成 / Confirm completion |
| POST | `/api/reports` | 提交举报 / Submit report |
| POST | `/api/reviews` | 提交评价 / Submit review |
| POST | `/api/admin/products/:id/remove` | 管理员删除商品 / Admin delete product |
| PATCH | `/api/admin/users/:id/verify` | 教育认证授予/撤销 / Toggle edu verification |
| POST | `/api/admin/sync-search` | 全量同步搜索索引 / Sync search index |

---

## 👥 团队 / Team

**UniyMarket Team** — 玛希隆大学 ICT 学院 / Faculty of ICT, Mahidol University

---

## 📄 许可证 / License

MIT License © 2026 UniyMarket Team
