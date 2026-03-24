# 🎓 Uniy Market

**大学二手交易平台 / University Second-hand Trading Platform**

Uniy Market 是一个面向大学生的二手商品交易平台，支持商品发布、搜索、实时聊天和多语言切换。

Uniy Market is a second-hand trading platform for university students, featuring product listing, search, real-time chat, and multi-language support.

---

## 功能概览 / Features

- 用户注册/登录（密码认证 + JWT） / User registration & login (password auth + JWT)
- 邮箱验证（通过 Resend API 发送6位验证码） / Email verification (6-digit code via Resend API)
- 商品发布、编辑、删除、上架/下架 / Product CRUD with list/unlist
- 商品图片上传（支持多图，自动压缩） / Multi-image upload with auto compression
- 商品搜索与分类筛选 / Product search & category filtering
- 实时聊天（Socket.io） / Real-time chat (Socket.io)
- 多语言支持（English / 中文 / ไทย） / Multi-language support (EN / ZH / TH)
- 卖家评价与信誉系统 / Seller reviews & reputation system
- 商品收藏与对比 / Favorites & product comparison
- 举报系统 / Report system
- 管理员后台 / Admin dashboard

---

## 技术栈 / Tech Stack

| 层级 / Layer | 技术 / Technology |
|---|---|
| 后端框架 / Backend | Express.js + TypeScript |
| 数据库 / Database | SQLite3 |
| 认证 / Auth | JWT + bcryptjs |
| 实时通信 / Real-time | Socket.io |
| 邮件服务 / Email | Resend API |
| 图片处理 / Image | Sharp |
| 前端框架 / Frontend | React 18 + TypeScript |
| 构建工具 / Build | Vite |
| UI | Tailwind CSS + Radix UI |
| 路由 / Routing | React Router 7 |

---

## 快速开始 / Quick Start

### 环境要求 / Prerequisites

- Node.js v16+
- npm

### 安装 / Installation

```bash
# 克隆仓库 / Clone repository
git clone https://github.com/SakuseWen/uniy-market.git
cd uniy-market

# 安装后端依赖 / Install backend dependencies
npm install

# 安装前端依赖 / Install frontend dependencies
cd "Product Retrieval Main Page"
npm install
cd ..
```

### 配置环境变量 / Configure Environment

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下关键项 / Edit `.env` with the following key values:

```env
PORT=3000
DATABASE_URL=./data/uniy_market.db
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
RESEND_API_KEY=your-resend-api-key
```

### 启动开发服务器 / Start Dev Servers

```bash
# 后端（端口 3000） / Backend (port 3000)
npm run dev

# 前端（端口 5173，新终端窗口） / Frontend (port 5173, new terminal)
cd "Product Retrieval Main Page"
npm run dev
```

或使用脚本一键启动 / Or use the startup script:
```bash
./start-dev.sh
```

---

## 项目结构 / Project Structure

```
uniy-market/
├── src/                              # 后端源码 / Backend source
│   ├── config/                       # 数据库、认证配置 / DB & auth config
│   ├── middleware/                    # Express 中间件 / Middleware
│   ├── models/                       # 数据模型 / Data models
│   ├── routes/                       # API 路由 / API routes
│   ├── services/                     # 业务逻辑 / Business logic
│   └── index.ts                      # 后端入口 / Backend entry
├── Product Retrieval Main Page/      # 前端 React 应用 / Frontend React app
│   └── src/
│       ├── components/               # 通用组件 / Shared components
│       ├── pages/                    # 页面组件 / Page components
│       ├── services/                 # API 调用、认证 / API calls & auth
│       ├── hooks/                    # 自定义 Hooks / Custom hooks
│       ├── lib/                      # i18n、工具函数 / i18n & utilities
│       └── App.tsx                   # 前端入口 / Frontend entry
├── data/                             # SQLite 数据库 / SQLite database
├── public/uploads/                   # 上传的图片 / Uploaded images
└── package.json
```

---

## API 接口 / API Endpoints

### 认证 / Authentication

| 方法 / Method | 路径 / Path | 说明 / Description |
|---|---|---|
| POST | `/api/auth/register` | 注册（自动发送验证码） / Register (sends verification code) |
| POST | `/api/auth/login` | 登录 / Login |
| POST | `/api/auth/verify-code` | 验证邮箱验证码 / Verify email code |
| POST | `/api/auth/resend-code` | 重新发送验证码 / Resend verification code |

### 商品 / Products

| 方法 / Method | 路径 / Path | 说明 / Description |
|---|---|---|
| GET | `/api/products` | 获取商品列表 / List products |
| GET | `/api/products/:id` | 获取商品详情 / Get product details |
| POST | `/api/products` | 发布商品（需认证） / Create product (auth) |
| PUT | `/api/products/:id` | 编辑商品（需认证） / Update product (auth) |
| DELETE | `/api/products/:id` | 删除商品（需认证） / Delete product (auth) |
| PATCH | `/api/products/:id/status` | 上架/下架（需认证） / List/unlist (auth) |
| GET | `/api/products/categories/all` | 获取所有分类 / Get all categories |

### 其他模块 / Other Modules

| 模块 / Module | 路径前缀 / Prefix | 说明 / Description |
|---|---|---|
| 聊天 / Chat | `/api/chats` | 实时聊天 / Real-time messaging |
| 评价 / Reviews | `/api/reviews` | 买卖双方评价 / Buyer & seller reviews |
| 信誉 / Reputation | `/api/reputation` | 用户信誉 / User reputation |
| 交易 / Deals | `/api/deals` | 交易管理 / Deal management |
| 收藏 / Favorites | `/api/favorites` | 商品收藏 / Product favorites |
| 举报 / Reports | `/api/reports` | 举报系统 / Report system |
| 管理 / Admin | `/api/admin` | 管理员后台 / Admin dashboard |

---

## 邮箱验证流程 / Email Verification Flow

1. 用户注册时，后端生成6位随机验证码，存入数据库并通过 Resend API 发送到用户邮箱
   When a user registers, the backend generates a 6-digit code, stores it in the database, and sends it via Resend API.

2. 用户在验证页面输入验证码，后端校验验证码是否正确且未过期（10分钟有效期）
   The user enters the code on the verification page. The backend checks if the code is valid and not expired (10-minute TTL).

3. 验证成功后自动登录，返回 JWT token
   After successful verification, the user is automatically logged in with a JWT token.

> ⚠️ Resend 免费版只能发送邮件到你在 Resend 注册时使用的邮箱地址，发件人为 `onboarding@resend.dev`
> ⚠️ Resend free tier can only send emails to the address you registered with. Sender is `onboarding@resend.dev`.

---

## 多语言支持 / Multi-language Support

支持三种语言切换 / Supports three languages: **English / 中文 / ไทย**

所有 UI 文本集中管理在 `Product Retrieval Main Page/src/lib/i18n.ts`，通过 `LanguageContext` 全局管理语言状态。

All UI text is centralized in `Product Retrieval Main Page/src/lib/i18n.ts`, with global language state managed via `LanguageContext`.

---

## 常用命令 / Common Commands

```bash
# 后端 / Backend
npm run dev              # 启动开发服务器 / Start dev server
npm run build            # 编译 TypeScript / Compile TypeScript
npm start                # 运行编译后的代码 / Run compiled code
npm test                 # 运行测试 / Run tests
npm run lint             # 代码检查 / Lint code

# 前端（在 Product Retrieval Main Page 目录下）
# Frontend (inside Product Retrieval Main Page/)
npm run dev              # 启动前端开发服务器 / Start frontend dev server
npm run build            # 构建生产版本 / Build for production
```

---

## 团队 / Team

Uniy Market Team

## License

MIT
