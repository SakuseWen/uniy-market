# 测试账号和密码

## 🔐 密码登录凭证

所有账号都已设置密码，可以使用以下凭证登录：

### 管理员账号

| 邮箱 | 密码 | 角色 | 商品数 |
|------|------|------|--------|
| admin@university.edu | admin123 | 管理员 | 0 |

### 普通用户账号

| 邮箱 | 密码 | 角色 | 商品数 |
|------|------|------|--------|
| john.doe@university.edu | john123 | 用户 | 2 |
| jane.smith@university.edu | jane123 | 用户 | 2 |
| mike.wilson@university.edu | mike123 | 用户 | 2 |
| sarah.johnson@university.edu | sarah123 | 用户 | 2 |

## 🚀 登录方式

### 方式 1: 密码登录（新增）

**端点**: `POST /api/auth/login`

**请求体**:
```json
{
  "email": "john.doe@university.edu",
  "password": "john123"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userID": "USER-2",
      "email": "john.doe@university.edu",
      "name": "John Doe",
      "isVerified": true,
      "isAdmin": false,
      "preferredLanguage": "en"
    }
  },
  "message": "Login successful"
}
```

### 方式 2: 注册新账号

**端点**: `POST /api/auth/register`

**请求体**:
```json
{
  "email": "newuser@university.edu",
  "name": "New User",
  "password": "password123"
}
```

**要求**:
- 邮箱必须是大学邮箱（@university.edu, @student.edu, @alumni.edu）
- 密码至少 6 个字符
- 邮箱不能已被注册

## 📝 使用 Token

登录成功后，使用返回的 token 进行认证请求：

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/products
```

## 🔄 Token 有效期

- **有效期**: 7 天
- **过期后**: 需要重新登录获取新 token

## 🛠️ 开发环境

### 后端启动

```bash
npm run dev
```

后端运行在 `http://localhost:3000`

### 前端启动

```bash
cd "Product Retrieval Main Page"
npm run dev
```

前端运行在 `http://localhost:5173`

## 📡 API 端点

### 认证相关

- `POST /api/auth/login` - 密码登录
- `POST /api/auth/register` - 注册新账号
- `POST /api/auth/google` - Google OAuth 登录（原有）

### 商品相关

- `GET /api/products` - 获取商品列表
- `POST /api/products` - 创建商品
- `GET /api/products/:id` - 获取商品详情
- `PUT /api/products/:id` - 更新商品
- `DELETE /api/products/:id` - 删除商品

### 用户相关

- `GET /api/products/seller/:sellerId` - 获取卖家商品

## ✅ 测试流程

1. **登录**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"john.doe@university.edu","password":"john123"}'
   ```

2. **获取商品列表**
   ```bash
   curl -H "Authorization: Bearer <token>" \
     http://localhost:3000/api/products
   ```

3. **创建商品**
   ```bash
   curl -X POST http://localhost:3000/api/products \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
       "title":"Test Product",
       "description":"Test Description",
       "price":99.99,
       "stock":1,
       "condition":"new",
       "categoryID":1
     }'
   ```

## 🔒 安全说明

- 所有密码都已使用 bcrypt 加密存储
- Token 使用 JWT 签名，有效期 7 天
- 生产环境需要更改 JWT_SECRET
- 建议使用 HTTPS 传输敏感数据

## 📚 相关文件

- `src/routes/authPassword.ts` - 密码认证路由
- `scripts/set-test-passwords.js` - 设置测试密码脚本
- `src/models/UserModel.ts` - 用户模型（已更新支持密码）
- `src/index.ts` - 主应用入口（已注册新路由）

---

**最后更新**: 2026-03-19
**状态**: ✅ 密码认证已启用
