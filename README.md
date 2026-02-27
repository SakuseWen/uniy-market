# Uniy Market - University Trading Platform

A modern university second-hand trading platform built with React, Express.js, and TypeScript.

## 🎯 Features

- 🔐 User authentication with Google OAuth
- 📦 Product listing, search, and filtering
- 💬 Real-time chat between buyers and sellers
- 🌍 Multi-language support (English, Thai, Chinese)
- ⭐ Product reviews and seller ratings
- 🎨 Modern, responsive UI with Tailwind CSS
- 🔍 Advanced search and sorting capabilities

## 🛠️ Tech Stack

### Backend
- **Framework**: Express.js 4.18
- **Language**: TypeScript 5.3
- **Database**: SQLite3
- **Real-time**: Socket.io
- **Auth**: Passport.js + JWT
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React 18.3
- **Language**: TypeScript 5.3
- **Build Tool**: Vite 6.3
- **Styling**: Tailwind CSS + Radix UI
- **HTTP Client**: Axios
- **Routing**: React Router 7

## 🚀 Quick Start

### Prerequisites
- Node.js v16+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd uniy-market
```

2. Install dependencies
```bash
# Backend
npm install

# Frontend
cd "Product Retrieval Main Page"
npm install
cd ..
```

3. Configure environment
```bash
cp .env.example .env
```

4. Start development servers
```bash
# Option 1: Start both servers
./start-dev.sh

# Option 2: Start separately
npm run dev                    # Backend on localhost:3000
cd "Product Retrieval Main Page" && npm run dev  # Frontend on localhost:5173
```

## 📁 Project Structure

```
.
├── src/                          # Backend source
│   ├── config/                   # Configuration
│   ├── middleware/               # Express middleware
│   ├── models/                   # Database models
│   ├── routes/                   # API routes
│   ├── services/                 # Business logic
│   └── index.ts                  # Entry point
├── Product Retrieval Main Page/  # Frontend React app
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── pages/                # Page components
│   │   ├── hooks/                # Custom hooks
│   │   ├── services/             # API services
│   │   └── App.tsx               # Main component
│   └── package.json
├── data/                         # SQLite database
├── public/                       # Static assets
└── package.json
```

## 📡 API Endpoints

### Products
```
GET    /api/products              # List products
GET    /api/products/:id          # Get product details
POST   /api/products              # Create product (auth required)
PUT    /api/products/:id          # Update product (auth required)
DELETE /api/products/:id          # Delete product (auth required)
```

### Categories
```
GET    /api/products/categories/all  # Get all categories
```

## 🔧 Development

### Run Tests
```bash
npm test
```

### Build for Production
```bash
npm run build
```

### Code Quality
```bash
npm run lint
npm run lint:fix
npm run format
```

## 📝 Environment Variables

### Backend (.env)
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=./data/unity_market.db
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000
```

## 📦 Available Scripts

### Backend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm test` - Run tests
- `npm run lint` - Check code quality

### Frontend
- `npm run dev` - Start dev server
- `npm run build` - Build for production

## 🚢 Deployment

See `deployment/` directory for Docker and production setup instructions.

## 📄 License

MIT License - see LICENSE file for details

## 👥 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
