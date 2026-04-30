# 🎓 Uniy Market — Campus Second-Hand Trading Platform

> A Senior Project by the **UniyMarket Team**, Faculty of Information and Communication Technology (ICT), Mahidol University

**Live Demo:** [https://uniymarket.com](https://uniymarket.com)

---

## 📖 Overview

Uniy Market is a full-stack C2C second-hand trading platform designed for university students. It provides a safe, verified environment for buying and selling used goods within campus communities.

**Key Features:**
- Trilingual interface (English / 中文 / ไทย) with full i18n coverage
- Meilisearch-powered intelligent search with 330+ trilingual synonym groups
- Real-time WebSocket chat with image messages, read receipts, and translation
- Education email verification (.edu / .ac.*) for trusted seller identity
- Complete deal lifecycle (request → accept → confirm → complete)
- Admin dashboard for user/product/report management
- Mobile-responsive design with Tailwind CSS v4 JIT
- Map-based location tagging for meetup arrangements

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js + Express 4 | HTTP server framework |
| TypeScript 5 | Type safety |
| SQLite3 | Lightweight relational database |
| Meilisearch | Full-text search engine (synonyms, typo-tolerance, filtering) |
| Socket.IO 4 | WebSocket real-time communication |
| JWT (jsonwebtoken) | Authentication & session management |
| bcryptjs | Password hashing |
| Sharp | Image compression & processing |
| Multer | File upload handling |
| Resend | Email service (verification codes, password reset) |
| Google Cloud Translate | Chat message translation |
| Helmet + CORS + express-rate-limit | Security & rate limiting |

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| Vite 6 | Build tool & dev server |
| Tailwind CSS v4 | Utility-first CSS with JIT compilation |
| React Router v7 | Client-side routing |
| Radix UI | Accessible component primitives (20+ components) |
| Socket.IO Client | WebSocket client |
| Axios | HTTP client with interceptors |
| Leaflet + React-Leaflet | Interactive maps |
| Recharts | Data visualization |
| Sonner | Toast notifications |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| AWS EC2 (Singapore) | Cloud hosting |
| Nginx | Reverse proxy, static file serving, SSL termination |
| Cloudflare | CDN, DNS, DDoS protection |
| PM2 | Process manager |
| Let's Encrypt / Cloudflare SSL | HTTPS certificates |

---

## 📁 Project Structure

```
uniy-market/
├── src/                          # Backend source (Node.js + Express)
│   ├── index.ts                  # Entry point (routes, middleware, WebSocket, Meilisearch init)
│   ├── config/
│   │   ├── database.ts           # SQLite schema & migrations
│   │   ├── upload.ts             # Multer file upload config
│   │   └── synonyms.json         # Meilisearch synonym dictionary (330+ groups)
│   ├── routes/
│   │   ├── authPassword.ts       # Login, register, forgot password, edu verification
│   │   ├── product.ts            # Product CRUD + Meilisearch dual-write + search
│   │   ├── search.ts             # Dedicated search API (Meilisearch-first)
│   │   ├── chat.ts               # Chat rooms, messages, translation, read receipts
│   │   ├── deal.ts               # Deal lifecycle + batch status API
│   │   ├── admin.ts              # Admin dashboard (users, products, reports, sync)
│   │   ├── report.ts             # Report system with evidence images
│   │   ├── review.ts             # Review system with images
│   │   ├── favorite.ts           # Favorites/wishlist
│   │   └── ...                   # comment, dealNotification, location, language
│   ├── services/
│   │   ├── MeilisearchService.ts # Search engine wrapper (init, synonyms, dual-write)
│   │   ├── AdminService.ts       # Admin operations (suspend, activate, hard delete)
│   │   ├── WebSocketService.ts   # Socket.IO service (chat, notifications, read receipts)
│   │   ├── AuthService.ts        # JWT validation, session management
│   │   ├── emailService.ts       # Resend email (verification codes)
│   │   └── ...                   # Translation, Notification, Cache, etc.
│   ├── models/                   # Data models (SQLite CRUD)
│   │   ├── UserModel.ts
│   │   ├── ProductModel.ts
│   │   ├── ChatModel.ts
│   │   ├── DealModel.ts
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.ts               # JWT auth + requireActiveUser (blocks suspended)
│   │   ├── rateLimiter.ts        # Per-IP rate limiting (API/auth/upload/search/admin)
│   │   ├── contentModeration.ts  # Automated content moderation
│   │   ├── imageProcessing.ts    # Sharp image compression
│   │   └── sanitization.ts       # Input sanitization
│   └── locales/                  # Backend i18n files (en/zh/th)
│
├── Product Retrieval Main Page/  # Frontend source (React + Vite)
│   ├── src/
│   │   ├── pages/                # Page components (14 routes)
│   │   │   ├── MainPage.tsx      # Homepage (product grid, search, filters)
│   │   │   ├── LoginPage.tsx     # Login & registration
│   │   │   ├── ChatPage.tsx      # Real-time chat with WebSocket
│   │   │   ├── MyPage.tsx        # User profile (products, deals, reviews, favorites)
│   │   │   ├── AdminPage.tsx     # Admin dashboard
│   │   │   ├── HelpCenterPage.tsx
│   │   │   ├── TermsOfServicePage.tsx
│   │   │   ├── PrivacyPolicyPage.tsx
│   │   │   └── ...
│   │   ├── components/           # Reusable components
│   │   │   ├── Header.tsx        # Global nav (notifications, language switch, WebSocket)
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductDetailPage.tsx
│   │   │   ├── SearchFilterBar.tsx
│   │   │   ├── LocationPicker.tsx
│   │   │   └── ui/              # shadcn/ui base components (40+)
│   │   ├── services/             # API service layer
│   │   │   ├── api.ts            # Axios instance with interceptors
│   │   │   ├── productService.ts
│   │   │   ├── chatService.ts
│   │   │   └── ...
│   │   ├── hooks/                # Custom hooks
│   │   │   ├── useChatSocket.ts  # WebSocket chat + read receipts
│   │   │   └── useProducts.ts
│   │   ├── lib/
│   │   │   ├── i18n.ts           # Trilingual translations (1400+ lines)
│   │   │   ├── config.ts         # Backend URL, API URL, image URL helpers
│   │   │   ├── imageUtils.ts     # Client-side image compression
│   │   │   └── ComparisonContext.tsx
│   │   └── styles/
│   │       └── globals.css       # Tailwind v4 source + theme variables
│   ├── vite.config.ts
│   └── package.json
│
├── data/                         # SQLite database (auto-created at runtime)
├── public/uploads/               # User uploads (avatars, products, messages, reports)
├── deploy.sh                     # Production deployment script (rsync to AWS)
└── package.json                  # Backend dependencies & scripts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 20.x
- **npm** >= 10.x
- **Meilisearch** >= 1.x (optional — falls back to SQL search if unavailable)

### 1. Clone & Install

```bash
git clone https://github.com/SakuseWen/uniy-market.git
cd uniy-market

# Backend dependencies
npm install

# Frontend dependencies
cd "Product Retrieval Main Page"
npm install
cd ..
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=./data/uniy_market.db
JWT_SECRET=your-secret-key-at-least-32-characters
SESSION_SECRET=your-session-secret
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Email (Resend)
RESEND_API_KEY=your-resend-api-key

# Meilisearch (optional)
MEILI_HOST=http://localhost:7700
MEILI_API_KEY=

# Google Translate (optional, for chat translation)
GOOGLE_TRANSLATE_API_KEY=your-key
```

### 3. Start Development

```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
cd "Product Retrieval Main Page"
npm run dev
```

Backend: http://localhost:3000  
Frontend: http://localhost:5173

### 4. Optional: Start Meilisearch

```bash
# macOS
brew install meilisearch && meilisearch

# Docker
docker run -d -p 7700:7700 getmeili/meilisearch:latest

# Verify
curl http://localhost:7700/health
```

---

## 🌐 Production Deployment

### Deploy Script
```bash
bash deploy.sh   # rsync to AWS EC2
```

### On Server (SSH)
```bash
cd ~/uniy-market

# Backend
npm run build
cp src/config/synonyms.json dist/config/
cp -r src/locales dist/
pm2 restart uniy-api

# Frontend
cd "Product Retrieval Main Page"
npm install
npm run build
```

### Important Notes
- Frontend uses `VITE_API_URL=/api` (same-origin via Nginx proxy)
- Meilisearch requires `MEILI_API_KEY` in production `.env`
- After each frontend build, purge Cloudflare cache for `index.html`
- `deploy.sh` excludes `data/`, `.env`, and `node_modules`

---

## 🔑 Key Features Detail

### Search System
- **Meilisearch-first**: All searches go through Meilisearch with automatic SQL fallback
- **330+ synonym groups**: Trilingual synonyms (搜"手机"="phone"="โทรศัพท์")
- **Dual-write**: Product CRUD automatically syncs to Meilisearch index
- **Batch deal status**: `POST /api/deals/batch-status` replaces N+1 queries

### Authentication & Security
- Email verification (6-digit code via Resend)
- Education email verification (.edu / .ac.* domains)
- Admin can revoke edu verification (user cannot re-verify without admin approval)
- Suspended users can login but all write operations are blocked
- Per-IP rate limiting: API 10000/15min, auth 50/15min, upload 100/hr
- `X-Real-IP` / `X-Forwarded-For` support for Nginx reverse proxy

### Real-time Chat
- Socket.IO WebSocket with JWT authentication
- Text & image messages (client-side compression before upload)
- Real-time read receipts (auto mark-as-read when recipient is on chat page)
- Message translation via Google Cloud Translate
- Typing indicators

### Admin Dashboard
- User management: suspend, activate, hard delete, toggle edu verification
- Product management: view all products, hard delete (removes from DB + Meilisearch)
- Report management: view reports with product titles, resolve/dismiss
- Full-text search index sync

---

## 📡 API Endpoints (Summary)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register + send verification code |
| POST | `/api/auth/verify-code` | Verify email code |
| POST | `/api/auth/forgot-password/send-code` | Forgot password |
| POST | `/api/auth/edu-verify/send-code` | Education verification |
| GET | `/api/products?q=&category=&sortBy=` | Search products |
| GET | `/api/products/:id` | Product detail (with seller stats) |
| POST | `/api/products` | Create product |
| POST | `/api/chats` | Create/get chat room |
| POST | `/api/chats/:id/messages` | Send message |
| PUT | `/api/chats/:id/read` | Mark as read (triggers WebSocket) |
| POST | `/api/deals` | Create deal request |
| PUT | `/api/deals/:id/accept` | Seller accepts |
| PUT | `/api/deals/:id/confirm` | Confirm completion |
| POST | `/api/reports` | Submit report with evidence |
| POST | `/api/reviews` | Submit review |
| POST | `/api/admin/products/:id/remove` | Admin hard delete product |
| PATCH | `/api/admin/users/:id/verify` | Toggle edu verification |

---

## 👥 Team

**UniyMarket Team** — Faculty of ICT, Mahidol University

---

## 📄 License

MIT License © 2026 UniyMarket Team
