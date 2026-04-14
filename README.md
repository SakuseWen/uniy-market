# 🎓 Uniy Market — 校园二手交易平台

**University Second-Hand Trading Platform**

Uniy Market 是一个面向大学校园的二手商品交易平台，支持中文、英文、泰文三语界面，集成 Meilisearch 智能搜索引擎，提供实时聊天、交易管理、教育认证等完整的 C2C 交易功能。

Uniy Market is a campus-oriented second-hand trading platform supporting Chinese, English, and Thai interfaces. It integrates Meilisearch for intelligent search, real-time chat via WebSocket, deal management, and education verification for a complete C2C trading experience.

---

## ✨ 核心亮点 / Key Highlights

- **🔍 Meilisearch 智能搜索** — 同义词三语互通（搜"电脑"="computer"="คอมพิวเตอร์"），拼写容错，毫秒级响应，SQL 自动回退
- **🌐 三语支持 (i18n)** — 中文 / English / ไทย 全站切换，包括搜索同义词、UI 文案、错误提示
- **💬 实时聊天** — WebSocket 驱动，支持文本/图片消息、已读回执、在线状态、消息翻译
- **🔒 双重认证** — 邮箱验证 + 教育邮箱认证（.edu/.ac.*），确保卖家身份可信
- **📊 管理后台** — 用户管理（暂停/激活/删除）、商品审核、举报处理、审计日志
- **🔄 搜索双写** — 商品 CRUD 自动同步 Meilisearch，失败不影响核心交易流程

---

## 🛠 技术栈 / Tech Stack

### 后端 / Backend
| 技术 | 用途 |
|------|------|
| **Node.js + Express** | HTTP 服务框架 |
| **TypeScript** | 类型安全 |
| **SQLite3 + sqlite** | 轻量级关系数据库 |
| **Meilisearch** | 全文搜索引擎（同义词、容错、过滤、排序） |
| **Socket.IO** | WebSocket 实时通信 |
| **JSON Web Token** | 身份认证 |
| **bcryptjs** | 密码加密 |
| **Passport + Google OAuth** | 第三方登录 |
| **Sharp** | 图片压缩处理 |
| **Multer** | 文件上传 |
| **Resend** | 邮件发送（验证码） |
| **Google Cloud Translate** | 消息翻译 |
| **Helmet + CORS + express-rate-limit** | 安全防护 |

### 前端 / Frontend
| 技术 | 用途 |
|------|------|
| **React 18** | UI 框架 |
| **Vite** | 构建工具 |
| **React Router v7** | 路由管理 |
| **Tailwind CSS** | 样式框架 |
| **Radix UI** | 无障碍组件库（Dialog, Dropdown, Tabs 等） |
| **Axios** | HTTP 客户端 |
| **Socket.IO Client** | WebSocket 客户端 |
| **Leaflet + React-Leaflet** | 地图组件 |
| **Lucide React** | 图标库 |
| **Sonner** | Toast 通知 |
| **Recharts** | 数据图表 |
| **React Easy Crop** | 头像裁剪 |

---

## 📁 项目结构 / Project Structure

```
uniy-market/
├── src/                          # 后端源码 / Backend source
│   ├── index.ts                  # Express 入口，挂载路由、中间件、WebSocket
│   ├── config/
│   │   ├── database.ts           # SQLite 数据库初始化与 Schema 定义
│   │   ├── auth.ts               # Passport OAuth 配置
│   │   ├── production.ts         # 生产环境配置
│   │   ├── upload.ts             # Multer 文件上传配置
│   │   └── synonyms.json         # 🔍 Meilisearch 同义词字典（三语互通）
│   ├── routes/
│   │   ├── auth.ts               # OAuth 登录、用户信息、Token 刷新
│   │   ├── authPassword.ts       # 密码登录、注册、验证码、忘记密码、教育认证
│   │   ├── product.ts            # 商品 CRUD + Meilisearch 双写 + 搜索
│   │   ├── search.ts             # 专用搜索 API（Meilisearch 优先，SQL 回退）
│   │   ├── chat.ts               # 聊天房间、消息收发、翻译、已读
│   │   ├── deal.ts               # 交易流程（创建→接受→确认→完成）
│   │   ├── admin.ts              # 管理后台（用户/商品/举报/全量同步）
│   │   ├── report.ts             # 举报系统
│   │   ├── review.ts             # 评价系统
│   │   ├── comment.ts            # 商品评论
│   │   ├── favorite.ts           # 收藏功能
│   │   └── ...                   # location, language, reputation 等
│   ├── services/
│   │   ├── MeilisearchService.ts # 搜索引擎封装（初始化、双写、全量同步）
│   │   ├── AuthService.ts        # JWT 验证、Session 管理
│   │   ├── AdminService.ts       # 管理操作（暂停/激活/硬删除用户）
│   │   ├── WebSocketService.ts   # Socket.IO 服务
│   │   ├── TranslationService.ts # Google Translate 翻译
│   │   ├── NotificationService.ts# 通知服务
│   │   ├── emailService.ts       # Resend 邮件发送
│   │   └── ...                   # Cache, Reputation, Location 等
│   ├── models/                   # 数据模型层（SQLite CRUD 封装）
│   │   ├── BaseModel.ts          # 基类（query, execute, generateId）
│   │   ├── UserModel.ts          # 用户模型
│   │   ├── ProductModel.ts       # 商品模型（含搜索、图片、分类）
│   │   ├── ChatModel.ts          # 聊天模型
│   │   ├── DealModel.ts          # 交易模型
│   │   └── ...                   # Report, Review, Favorite, AuditLog
│   ├── middleware/                # Express 中间件
│   │   ├── auth.ts               # JWT 认证、角色检查、活跃状态检查
│   │   ├── security.ts           # CSRF、CSP、安全头
│   │   ├── rateLimiter.ts        # 请求频率限制
│   │   ├── contentModeration.ts  # 内容审核
│   │   ├── imageProcessing.ts    # 图片处理
│   │   └── ...                   # 错误处理、日志、验证等
│   ├── types/                    # TypeScript 类型定义
│   └── utils/                    # 工具函数（Logger, Validation）
│
├── Product Retrieval Main Page/  # 前端源码 / Frontend source
│   ├── src/
│   │   ├── App.tsx               # 根组件（Provider 嵌套）
│   │   ├── routes.ts             # React Router 路由表
│   │   ├── main.tsx              # Vite 入口
│   │   ├── pages/                # 页面组件
│   │   │   ├── MainPage.tsx      # 首页（商品列表、搜索、筛选）
│   │   │   ├── LoginPage.tsx     # 登录/注册
│   │   │   ├── ForgotPasswordPage.tsx # 忘记密码（三步流程）
│   │   │   ├── ChatPage.tsx      # 聊天页（WebSocket 实时消息）
│   │   │   ├── MyPage.tsx        # 个人中心（商品/交易/收藏/评价）
│   │   │   ├── AdminPage.tsx     # 管理后台
│   │   │   ├── HelpCenterPage.tsx# 帮助中心（三语）
│   │   │   └── ...               # Product, Create, Edit, Seller 等
│   │   ├── components/           # 可复用组件
│   │   │   ├── Header.tsx        # 全局导航栏（通知铃铛、语言切换）
│   │   │   ├── SearchFilterBar.tsx# 搜索筛选栏
│   │   │   ├── ProductCard.tsx   # 商品卡片
│   │   │   ├── LocationPicker.tsx# 地图选点（Leaflet + Nominatim）
│   │   │   ├── TranslateButton.tsx# 翻译按钮
│   │   │   ├── ui/              # shadcn/ui 基础组件
│   │   │   └── ...
│   │   ├── services/             # API 服务层
│   │   │   ├── api.ts            # Axios 实例（拦截器、错误处理）
│   │   │   ├── productService.ts # 商品 API
│   │   │   ├── chatService.ts    # 聊天 API
│   │   │   ├── authContext.tsx    # 认证 Context
│   │   │   └── ...
│   │   ├── hooks/                # 自定义 Hooks
│   │   ├── lib/                  # 工具库（i18n、Context、图片处理）
│   │   └── styles/               # 全局样式
│   └── package.json
│
├── data/                         # SQLite 数据库文件
├── public/uploads/               # 用户上传文件（头像、商品图片、消息图片）
├── deployment/                   # 部署配置（Docker, Nginx）
├── tests/                        # 测试文件
├── scripts/                      # 脚本（测试数据初始化）
└── .env.example                  # 环境变量模板
```

---

## 🚀 本地启动指南 / Getting Started

### 前置要求 / Prerequisites

- **Node.js** >= 20.x
- **npm** >= 10.x
- **Meilisearch** >= 1.x（本地运行在 `http://localhost:7700`）

### 1. 安装 Meilisearch / Install Meilisearch

```bash
# macOS (Homebrew)
brew install meilisearch
meilisearch --http-addr 127.0.0.1:7700

# 或使用 Docker / Or use Docker
docker run -p 7700:7700 getmeili/meilisearch:latest
```

确认运行：`curl http://localhost:7700/health` 应返回 `{"status":"available"}`

### 2. 克隆项目 / Clone

```bash
git clone https://github.com/SakuseWen/uniy-market.git
cd uniy-market
```

### 3. 配置环境变量 / Configure Environment

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入必要的配置：

```env
# 必填 / Required
PORT=3000
NODE_ENV=development
DATABASE_URL=./data/uniy_market.db
JWT_SECRET=your-secret-key-at-least-32-chars
SESSION_SECRET=your-session-secret-at-least-32-chars

# 邮件服务（验证码发送）/ Email service (verification codes)
RESEND_API_KEY=your-resend-api-key

# 翻译服务（可选）/ Translation service (optional)
GOOGLE_TRANSLATE_API_KEY=your-google-translate-api-key

# Meilisearch（可选，不配置则回退 SQL）/ Meilisearch (optional, falls back to SQL)
MEILI_HOST=http://localhost:7700
MEILI_API_KEY=
```

### 4. 安装依赖并初始化 / Install & Initialize

```bash
# 后端依赖 / Backend dependencies
npm install

# 前端依赖 / Frontend dependencies
cd "Product Retrieval Main Page"
npm install
cd ..
```

数据库会在首次启动时自动创建并初始化 Schema。

### 5. 启动服务 / Start Services

```bash
# 终端 1：启动后端 / Terminal 1: Start backend
npm run dev
# 输出: 🚀 Uniy Market server running on port 3000
# 输出: [Meilisearch] 索引初始化完成 / Index initialized

# 终端 2：启动前端 / Terminal 2: Start frontend
cd "Product Retrieval Main Page"
npm run dev
# 输出: Local: http://localhost:5173/
```

### 6. 同步搜索索引 / Sync Search Index

首次启动后，需要将现有商品数据同步到 Meilisearch：

```bash
# 用管理员账号登录获取 token，然后调用同步接口
# Login as admin to get token, then call sync endpoint
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@university.edu","password":"admin123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

curl -X POST http://localhost:3000/api/admin/sync-search \
  -H "Authorization: Bearer $TOKEN"
# 输出: {"success":true,"data":{"synced":10},...}
```

之后新增/修改/删除商品会自动双写同步，无需手动操作。

### 7. 自定义搜索同义词 / Customize Search Synonyms

编辑 `src/config/synonyms.json`，格式为：

```json
{
  "搜索词": ["同义词1", "synonym2", "คำพ้อง3"],
  "keyword": ["关键词", "synonym", "คำพ้อง"]
}
```

修改后重启后端即可生效。当前已配置 90+ 组三语互通同义词，覆盖手机、电脑、平板、耳机、书籍、家具等 20+ 品类。

---

## 📡 API 概览 / API Overview

| 端点 | 说明 |
|------|------|
| `GET /api/products?q=&category=&minPrice=&maxPrice=&sortBy=` | 商品搜索（Meilisearch 优先） |
| `GET /api/search?q=&category=&sortBy=&page=&limit=` | 专用搜索 API（含 processingTimeMs） |
| `POST /api/auth/login` | 密码登录 |
| `POST /api/auth/register` | 注册 |
| `POST /api/auth/forgot-password/send-code` | 忘记密码 |
| `POST /api/chats` | 创建聊天 |
| `POST /api/chats/:id/messages` | 发送消息 |
| `POST /api/deals` | 创建交易 |
| `POST /api/admin/sync-search` | 全量同步搜索索引 |
| `POST /api/admin/users/:id/suspend` | 暂停用户 |
| `DELETE /api/admin/users/:id` | 删除用户（硬删除） |

完整 API 列表请访问 `http://localhost:3000/api`。

---

## 👥 默认账号 / Default Accounts

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 / Admin | admin@university.edu | admin123 |

---

## 📄 License

MIT License © Uniy Market Team
