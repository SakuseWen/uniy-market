# 🎓 Uniy Market — 校园二手交易平台

**University Second-Hand Trading Platform**

Uniy Market 是一个面向大学校园的二手商品交易平台，支持中文、英文、泰文三语界面，集成 Meilisearch 智能搜索引擎，提供实时聊天、交易管理、教育认证等完整的 C2C 交易功能。

Uniy Market is a campus-oriented C2C second-hand trading platform with trilingual support (Chinese / English / Thai). It features Meilisearch-powered intelligent search, real-time WebSocket chat, deal management, education verification, and a full admin dashboard.

---

## ✨ 核心亮点 / Key Highlights

- **🔍 Meilisearch 智能搜索** — 90+ 组三语同义词互通（搜"电脑"="computer"="คอมพิวเตอร์"），拼写容错，毫秒级响应，SQL 自动回退兜底
- **🌐 三语支持 (i18n)** — 中文 / English / ไทย 全站切换，覆盖搜索同义词、UI 文案、错误提示、帮助中心
- **💬 实时聊天** — Socket.IO 驱动，支持文本/图片消息、已读回执、在线状态、消息翻译
- **🔒 双重认证** — 邮箱验证 + 教育邮箱认证（.edu / .ac.*），确保卖家身份可信
- **📊 管理后台** — 用户管理（暂停/激活/硬删除）、商品审核、举报处理、审计日志、搜索索引全量同步
- **🔄 搜索双写** — 商品 CRUD 自动同步 Meilisearch，失败仅记录日志不影响核心交易流程
- **🗺️ 地图定位** — Leaflet + OpenStreetMap，商品发布时可选点标注位置
- **🔑 忘记密码** — 邮箱验证码三步重置流程

---

## 🛠 技术栈 / Tech Stack

### 后端 / Backend

| 技术 | 用途 |
|------|------|
| **Node.js + Express 4** | HTTP 服务框架 |
| **TypeScript 5** | 类型安全 |
| **SQLite3 + sqlite** | 轻量级关系数据库 |
| **Meilisearch** | 全文搜索引擎（同义词、容错、过滤、排序） |
| **Socket.IO 4** | WebSocket 实时通信（聊天、通知） |
| **JSON Web Token** | 身份认证与会话管理 |
| **bcryptjs** | 密码哈希加密 |
| **Sharp** | 图片压缩与格式转换 |
| **Multer** | 文件上传处理 |
| **Resend** | 邮件发送（验证码、密码重置） |
| **Google Cloud Translate** | 聊天消息实时翻译 |
| **Helmet + CORS + express-rate-limit** | 安全防护与请求限流 |
| **express-validator** | 请求参数校验 |

### 前端 / Frontend

| 技术 | 用途 |
|------|------|
| **React 18** | UI 框架 |
| **Vite 6** | 构建工具与开发服务器 |
| **React Router v7** | 客户端路由 |
| **Tailwind CSS** | 原子化样式框架 |
| **Radix UI** | 无障碍组件库（Dialog, Dropdown, Tabs, Select 等 20+ 组件） |
| **Axios** | HTTP 客户端（含请求/响应拦截器） |
| **Socket.IO Client** | WebSocket 客户端 |
| **Leaflet + React-Leaflet** | 交互式地图组件 |
| **Lucide React** | 图标库 |
| **Sonner** | Toast 通知 |
| **Recharts** | 数据可视化图表 |
| **React Easy Crop** | 头像裁剪 |

---

## 📁 项目结构 / Project Structure

```
uniy-market/
├── src/                            # 后端源码 / Backend source
│   ├── index.ts                    # Express 入口（路由挂载、中间件、WebSocket、Meilisearch 初始化）
│   ├── config/
│   │   ├── database.ts             # SQLite 数据库初始化与 Schema 定义
│   │   ├── auth.ts                 # Passport Google OAuth 配置
│   │   ├── production.ts           # 生产环境配置（CORS、日志、安全）
│   │   ├── upload.ts               # Multer 文件上传配置
│   │   └── synonyms.json           # 🔍 Meilisearch 同义词字典（三语互通，90+ 组）
│   ├── routes/                     # API 路由层
│   │   ├── auth.ts                 # OAuth 登录、用户信息、Token 刷新
│   │   ├── authPassword.ts         # 密码登录/注册、验证码、忘记密码、教育认证
│   │   ├── product.ts              # 商品 CRUD + Meilisearch 双写 + 搜索（SQL 回退）
│   │   ├── search.ts               # 专用搜索 API（Meilisearch 优先，含 processingTimeMs）
│   │   ├── chat.ts                 # 聊天房间、消息收发、图片消息、翻译、已读
│   │   ├── deal.ts                 # 交易流程（创建 → 接受/拒绝 → 双方确认 → 完成）
│   │   ├── admin.ts                # 管理后台（用户/商品/举报管理、全量索引同步）
│   │   ├── report.ts               # 举报系统（含证据图片上传）
│   │   ├── review.ts               # 评价系统（含图片）
│   │   ├── comment.ts              # 商品评论与回复
│   │   ├── favorite.ts             # 收藏功能
│   │   ├── dealNotification.ts     # 交易通知
│   │   ├── location.ts             # 位置隐私指南
│   │   ├── language.ts             # 翻译 API
│   │   └── reputation.ts           # 信誉系统
│   ├── services/                   # 业务逻辑层
│   │   ├── MeilisearchService.ts   # 搜索引擎封装（初始化、同义词加载、双写、全量同步）
│   │   ├── AuthService.ts          # JWT 验证、Session 管理
│   │   ├── AdminService.ts         # 管理操作（暂停/激活/硬删除用户）
│   │   ├── WebSocketService.ts     # Socket.IO 服务（聊天、通知推送）
│   │   ├── TranslationService.ts   # Google Translate 翻译封装
│   │   ├── NotificationService.ts  # 通知创建与查询
│   │   ├── emailService.ts         # Resend 邮件发送（验证码）
│   │   ├── LocationService.ts      # 位置验证与隐私
│   │   ├── ContentModerationService.ts # 内容审核
│   │   ├── ReputationService.ts    # 信誉计算
│   │   ├── UniversityEmailService.ts   # 大学邮箱域名验证
│   │   ├── CacheService.ts         # 内存缓存
│   │   ├── LocalizationService.ts  # 后端本地化
│   │   └── LoggerService.ts        # 结构化日志
│   ├── models/                     # 数据模型层（SQLite CRUD 封装）
│   │   ├── BaseModel.ts            # 基类（query, execute, generateId）
│   │   ├── UserModel.ts            # 用户
│   │   ├── ProductModel.ts         # 商品（含搜索、图片、分类）
│   │   ├── ChatModel.ts            # 聊天
│   │   ├── MessageModel.ts         # 消息
│   │   ├── DealModel.ts            # 交易
│   │   ├── ReviewModel.ts          # 评价
│   │   ├── ReportModel.ts          # 举报
│   │   ├── FavoriteModel.ts        # 收藏
│   │   └── AuditLogModel.ts        # 审计日志
│   ├── middleware/                  # Express 中间件
│   │   ├── auth.ts                 # JWT 认证、角色检查、活跃状态检查（requireActiveUser）
│   │   ├── security.ts             # CSRF、CSP、安全头
│   │   ├── rateLimiter.ts          # 请求频率限制（API / Auth / Admin 分级）
│   │   ├── contentModeration.ts    # 内容审核（商品/评论/聊天）
│   │   ├── imageProcessing.ts      # 图片压缩与格式处理
│   │   ├── errorHandler.ts         # 全局错误处理
│   │   ├── errorBoundary.ts        # 未捕获异常处理
│   │   └── ...                     # 日志、验证、清洗等
│   ├── types/                      # TypeScript 类型定义
│   ├── utils/                      # 工具函数（Logger, Validation）
│   ├── scripts/                    # 数据库种子脚本
│   └── locales/                    # 后端多语言文件（en/zh/th）
│
├── Product Retrieval Main Page/    # 前端源码 / Frontend source (React + Vite)
│   ├── src/
│   │   ├── App.tsx                 # 根组件（Provider 嵌套：Auth → Language → Comparison → Notification）
│   │   ├── routes.ts              # React Router 路由表（12 个页面路由）
│   │   ├── main.tsx               # Vite 入口
│   │   ├── pages/                 # 页面组件
│   │   │   ├── MainPage.tsx       # 首页（商品列表、搜索、筛选、排序）
│   │   │   ├── LoginPage.tsx      # 登录 / 注册
│   │   │   ├── ForgotPasswordPage.tsx  # 忘记密码（三步流程，三语）
│   │   │   ├── ChatPage.tsx       # 聊天页（WebSocket 实时消息、图片、翻译）
│   │   │   ├── MyPage.tsx         # 个人中心（商品/交易/收藏/评价/教育认证/注销）
│   │   │   ├── AdminPage.tsx      # 管理后台（用户/商品/举报三栏）
│   │   │   ├── HelpCenterPage.tsx # 帮助中心（三语，含 FAQ）
│   │   │   ├── ProductPage.tsx    # 商品详情页包装
│   │   │   ├── CreateProductPage.tsx   # 发布商品
│   │   │   ├── EditProductPage.tsx     # 编辑商品
│   │   │   ├── SellerProfilePage.tsx   # 卖家主页
│   │   │   └── EmailVerificationPage.tsx # 邮箱验证
│   │   ├── components/            # 可复用组件
│   │   │   ├── Header.tsx         # 全局导航栏（通知铃铛、语言切换、WebSocket 驱动）
│   │   │   ├── SearchFilterBar.tsx # 搜索筛选栏
│   │   │   ├── ProductCard.tsx    # 商品卡片
│   │   │   ├── ProductDetailPage.tsx # 商品详情（购买、联系卖家、翻译）
│   │   │   ├── LocationPicker.tsx # 地图选点（Leaflet + Nominatim）
│   │   │   ├── TranslateButton.tsx # 翻译按钮
│   │   │   ├── ReportDialog.tsx   # 举报对话框
│   │   │   ├── ui/               # shadcn/ui 基础组件（40+ 个）
│   │   │   └── ...
│   │   ├── services/              # API 服务层
│   │   │   ├── api.ts             # Axios 实例（拦截器：401 清除 token、403 三语禁用提示）
│   │   │   ├── productService.ts  # 商品 API
│   │   │   ├── chatService.ts     # 聊天 API
│   │   │   ├── dealService.ts     # 交易 API
│   │   │   ├── authContext.tsx     # 认证 Context（login/logout/user 状态）
│   │   │   ├── ChatNotificationContext.tsx # 聊天通知 Context
│   │   │   └── ...                # admin, favorite, report, review
│   │   ├── hooks/                 # 自定义 Hooks
│   │   │   ├── useProducts.ts     # 商品列表 Hook
│   │   │   └── useChatSocket.ts   # WebSocket 聊天 Hook
│   │   └── lib/                   # 工具库
│   │       ├── i18n.ts            # 三语翻译函数（1300+ 行，覆盖全部 UI 文案）
│   │       ├── LanguageContext.tsx # 语言切换 Context
│   │       ├── ComparisonContext.tsx # 商品对比 Context
│   │       ├── imageUtils.ts      # 图片压缩工具
│   │       └── mockData.ts        # Product 类型定义 + 示例数据
│   └── package.json
│
├── data/                          # SQLite 数据库文件（运行时自动创建）
├── public/uploads/                # 用户上传文件（头像、商品图片、消息图片、举报证据）
├── deployment/                    # 部署配置
│   ├── Dockerfile                 # Docker 镜像构建
│   ├── docker-compose.yml         # Docker Compose 编排
│   ├── nginx.conf                 # Nginx 反向代理配置
│   └── deploy.sh                  # 部署脚本
├── tests/                         # 测试文件
├── scripts/                       # 工具脚本（测试数据初始化）
├── .env.example                   # 环境变量模板
├── .env.production.example        # 生产环境变量模板
├── tsconfig.json                  # TypeScript 配置
├── package.json                   # 后端依赖与脚本
└── README.md                      # 本文件
```

---

## 🚀 本地启动指南 / Getting Started

### 前置要求 / Prerequisites

- **Node.js** >= 20.x
- **npm** >= 10.x
- **Meilisearch** >= 1.x（可选，不安装则自动回退到 SQL 搜索）

---

### 1. 安装 Meilisearch / Install Meilisearch

Meilisearch 是可选依赖。安装后搜索体验会显著提升（同义词、容错、毫秒响应），不安装则自动使用 SQLite LIKE 模糊查询。

```bash
# macOS (Homebrew)
brew install meilisearch

# 启动 Meilisearch（默认端口 7700，无需 API Key）
meilisearch --http-addr 127.0.0.1:7700

# 或使用 Docker
docker run -d -p 7700:7700 getmeili/meilisearch:latest
```

验证运行状态：
```bash
curl http://localhost:7700/health
# 期望输出: {"status":"available"}
```

---

### 2. 克隆项目 / Clone Repository

```bash
git clone https://github.com/SakuseWen/uniy-market.git
cd uniy-market
```

---

### 3. 配置环境变量 / Configure Environment Variables

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# ─── 服务器配置（必填）/ Server config (required) ───
PORT=3000
NODE_ENV=development
DATABASE_URL=./data/uniy_market.db

# ─── 认证配置（必填）/ Auth config (required) ───
JWT_SECRET=your-secret-key-at-least-32-characters-long
SESSION_SECRET=your-session-secret-at-least-32-characters-long

# ─── 前端地址（必填）/ Frontend URL (required) ───
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# ─── 邮件服务（验证码/密码重置）/ Email service ───
RESEND_API_KEY=your-resend-api-key

# ─── Meilisearch（可选，不配置则回退 SQL）/ Meilisearch (optional) ───
MEILI_HOST=http://localhost:7700
MEILI_API_KEY=

# ─── Google 翻译（可选，聊天翻译功能）/ Google Translate (optional) ───
GOOGLE_TRANSLATE_API_KEY=your-google-translate-api-key

# ─── Google OAuth（可选，第三方登录）/ Google OAuth (optional) ───
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

---

### 4. 安装依赖 / Install Dependencies

```bash
# 后端依赖
npm install

# 前端依赖
cd "Product Retrieval Main Page"
npm install
cd ..
```

---

### 5. 启动服务 / Start Services

```bash
# 终端 1：启动后端（数据库会自动创建并初始化 Schema）
npm run dev
# ✅ Database initialized successfully
# ✅ [Meilisearch] 索引初始化完成 / Index initialized
# ✅ 🚀 Uniy Market server running on port 3000

# 终端 2：启动前端
cd "Product Retrieval Main Page"
npm run dev
# ✅ Local: http://localhost:5173/
```

---

### 6. 同步搜索索引 / Sync Search Index

首次启动后，需要将现有商品数据同步到 Meilisearch（如果已安装）：

```bash
# 登录管理员获取 token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-admin@email","password":"your-password"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

# 执行全量同步
curl -X POST http://localhost:3000/api/admin/sync-search \
  -H "Authorization: Bearer $TOKEN"
# ✅ {"success":true,"data":{"synced":10},"message":"Synced 10 products to Meilisearch"}
```

之后新增/修改/删除商品会自动双写同步，无需手动操作。

---

### 7. 自定义搜索同义词 / Customize Search Synonyms

同义词配置文件位于 `src/config/synonyms.json`，格式为：

```json
{
  "搜索词": ["同义词1", "synonym2", "คำพ้อง3"],
  "keyword": ["关键词", "synonym", "คำพ้อง"]
}
```

当前已配置 **90+ 组三语互通同义词**，覆盖：手机、电脑、平板、耳机、相机、手表、充电器、成色描述、书籍、家具、桌椅、衣服、鞋、运动、票务、游戏、自行车、价格描述等 20+ 品类。

修改后重启后端即可生效。

---

## 📡 API 端点概览 / API Endpoints

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/products?q=&category=&minPrice=&maxPrice=&sortBy=` | GET | 商品搜索（Meilisearch 优先，SQL 回退） |
| `/api/search?q=&category=&sortBy=&page=&limit=` | GET | 专用搜索 API（含 processingTimeMs 和 engine 字段） |
| `/api/auth/login` | POST | 密码登录 |
| `/api/auth/register` | POST | 注册（发送邮箱验证码） |
| `/api/auth/verify-code` | POST | 验证邮箱验证码 |
| `/api/auth/forgot-password/send-code` | POST | 忘记密码（发送验证码） |
| `/api/auth/forgot-password/verify` | POST | 验证重置码 |
| `/api/auth/forgot-password/reset` | POST | 重置密码 |
| `/api/auth/edu-verify/send-code` | POST | 教育邮箱认证（发送验证码） |
| `/api/auth/edu-verify/confirm` | POST | 确认教育认证 |
| `/api/chats` | POST | 创建聊天房间 |
| `/api/chats/:id/messages` | POST | 发送消息（文本/图片） |
| `/api/deals` | POST | 创建交易 |
| `/api/deals/:id/accept` | PUT | 卖家接受交易 |
| `/api/deals/:id/confirm` | PUT | 双方确认完成 |
| `/api/reports` | POST | 提交举报（含证据图片） |
| `/api/reviews` | POST | 提交评价 |
| `/api/favorites` | POST | 添加收藏 |
| `/api/admin/users/:id/suspend` | POST | 暂停用户 |
| `/api/admin/users/:id/activate` | POST | 激活用户 |
| `/api/admin/users/:id` | DELETE | 硬删除用户 |
| `/api/admin/sync-search` | POST | 全量同步搜索索引 |

完整 API 列表：`http://localhost:3000/api`

---

## 📄 License

MIT License © Uniy Market Team
