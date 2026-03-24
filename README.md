# 🎓 Uniy Market - 大学二手交易平台

Uniy Market 是一个面向大学生的二手商品交易平台，支持商品发布、搜索、实时聊天和多语言切换。

## 功能概览

- 用户注册/登录（密码认证 + JWT）
- 邮箱验证（通过 Resend API 发送6位验证码）
- 商品发布、编辑、删除、上架/下架
- 商品图片上传（支持多图，自动压缩）
- 商品搜索与分类筛选
- 实时聊天（Socket.io）
- 多语言支持（English / 中文 / ไทย）
- 卖家评价与信誉系统
- 商品收藏与对比
- 举报系统
- 管理员后台

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端框架 | Express.js + TypeScript |
| 数据库 | SQLite3 (sqlite + sqlite3) |
| 认证 | JWT + bcryptjs |
| 实时通信 | Socket.io |
| 邮件服务 | Resend API |
| 图片处理 | Sharp |
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite |
| UI | Tailwind CSS + Radix UI |
| 路由 | React Router 7 |

## 快速开始

### 环境要求

- Node.js v16+
- npm

### 安装

```bash
# 克隆仓库
git clone https://github.com/SakuseWen/uniy-market.git
cd uniy-market

# 安装后端依赖
npm install

# 安装前端依赖
cd "Product Retrieval Main Page"
npm install
cd ..
```

### 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下关键项：

```env
PORT=3000
DATABASE_URL=./data/uniy_market.db
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
RESEND_API_KEY=your-resend-api-key
```

### 启动开发服务器

```bash
# 后端（端口 3000）
npm run dev

# 前端（端口 5173，新终端窗口）
cd "Product Retrieval Main Page"
npm run dev
```

或使用脚本一键启动：
```bash
./start-dev.sh
```

## 项目结构

```
uniy-market/
├── src/                              # 后端源码
│   ├── config/                       # 数据库、认证等配置
│   ├── middleware/                    # Express 中间件（错误处理、图片处理、安全等）
│   ├── models/                       # 数据模型（User, Product 等）
│   ├── routes/                       # API 路由
│   ├── services/                     # 业务逻辑（邮件服务、WebSocket 等）
│   └── index.ts                      # 后端入口
├── Product Retrieval Main Page/      # 前端 React 应用
│   └── src/
│       ├── components/               # 通用组件（Header, ProductCard 等）
│       ├── pages/                    # 页面组件
│       ├── services/                 # API 调用、认证上下文
│       ├── hooks/                    # 自定义 Hooks
│       ├── lib/                      # i18n、工具函数
│       └── App.tsx                   # 前端入口
├── data/                             # SQLite 数据库文件
├── public/uploads/                   # 用户上传的图片
└── package.json
```

## API 接口

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册（自动发送验证码邮件） |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/verify-code` | 验证邮箱验证码 |
| POST | `/api/auth/resend-code` | 重新发送验证码 |

### 商品

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/products` | 获取商品列表 |
| GET | `/api/products/:id` | 获取商品详情 |
| POST | `/api/products` | 发布商品（需认证） |
| PUT | `/api/products/:id` | 编辑商品（需认证） |
| DELETE | `/api/products/:id` | 删除商品（需认证） |
| PATCH | `/api/products/:id/status` | 上架/下架（需认证） |
| GET | `/api/products/categories/all` | 获取所有分类 |

### 其他

| 模块 | 路径前缀 | 说明 |
|------|----------|------|
| 聊天 | `/api/chats` | 实时聊天 |
| 评价 | `/api/reviews` | 买卖双方评价 |
| 信誉 | `/api/reputation` | 用户信誉查询 |
| 交易 | `/api/deals` | 交易管理 |
| 收藏 | `/api/favorites` | 商品收藏 |
| 举报 | `/api/reports` | 举报系统 |
| 管理 | `/api/admin` | 管理员后台 |

## 邮箱验证流程

1. 用户注册时，后端生成6位随机验证码，存入数据库并通过 Resend API 发送到用户邮箱
2. 用户在验证页面输入验证码，后端校验验证码是否正确且未过期（10分钟有效期）
3. 验证成功后自动登录，返回 JWT token

> 注意：Resend 免费版只能发送邮件到你在 Resend 注册时使用的邮箱地址，发件人为 `onboarding@resend.dev`

## 多语言支持

支持三种语言切换：English / 中文 / ไทย

所有 UI 文本集中管理在 `Product Retrieval Main Page/src/lib/i18n.ts`，通过 `LanguageContext` 全局管理语言状态。

## 常用命令

```bash
# 后端
npm run dev              # 启动开发服务器
npm run build            # 编译 TypeScript
npm start                # 运行编译后的代码
npm test                 # 运行测试
npm run lint             # 代码检查

# 前端（在 Product Retrieval Main Page 目录下）
npm run dev              # 启动前端开发服务器
npm run build            # 构建生产版本
```

## 团队

Uniy Market Team

## License

MIT
