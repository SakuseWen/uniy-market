# 认证和个人页面测试指南

## 🔐 测试账号

使用以下任何账号进行测试：

| 邮箱 | 密码 | 角色 |
|------|------|------|
| john.doe@university.edu | john123 | 用户 |
| jane.smith@university.edu | jane123 | 用户 |
| mike.wilson@university.edu | mike123 | 用户 |
| sarah.johnson@university.edu | sarah123 | 用户 |
| admin@university.edu | admin123 | 管理员 |

## 🚀 测试流程

### 1. 登录测试
1. 打开前端应用 `http://localhost:5173`
2. 点击右上角头像按钮
3. 应该看到登录/注册页面
4. 输入上面的任何账号邮箱和密码
5. 点击"Login"按钮
6. 应该自动跳转到首页

### 2. 已登录状态测试
1. 登录成功后，点击右上角头像按钮
2. 应该看到下拉菜单，包含：
   - "My Page" - 个人页面
   - "Logout" - 退出登录
3. 点击"My Page"进入个人页面

### 3. 个人页面测试
1. 在个人页面应该看到你的商品列表
2. 如果没有商品，会显示"No products yet"提示
3. 可以点击"+ Create New Product"创建新商品
4. 可以点击"Edit"编辑商品
5. 可以点击"Delete"删除商品

### 4. 退出登录测试
1. 点击右上角头像按钮
2. 点击"Logout"
3. 应该返回首页
4. 再次点击头像按钮应该看到登录页面

## 🐛 常见问题

### 问题：点击"My Page"后出现错误
**解决方案**：
- 检查浏览器控制台是否有错误信息
- 确保后端服务正在运行
- 检查 API 端点是否正确

### 问题：登录后头像按钮没有反应
**解决方案**：
- 刷新页面
- 清除浏览器缓存
- 检查 localStorage 中是否有 authToken

### 问题：个人页面显示"Failed to load your products"
**解决方案**：
- 确保后端 `/api/products/seller/{userId}` 端点正常工作
- 检查用户 ID 是否正确
- 查看浏览器控制台的网络请求

## 📝 技术细节

### 认证流程
1. 用户输入邮箱和密码
2. 前端发送 POST 请求到 `/api/auth/login`
3. 后端返回 token 和用户信息
4. 前端保存 token 到 localStorage
5. 后续请求自动添加 Authorization header

### 状态管理
- 使用 React Context (AuthContext) 管理全局认证状态
- 自动从 localStorage 恢复认证状态
- 支持自动登出（token 过期时）

### 错误处理
- 添加了 ErrorBoundary 组件捕获运行时错误
- API 错误会显示 toast 提示
- 401 错误会自动重定向到登录页面

## 🔗 相关文件

- `src/services/authContext.tsx` - 认证上下文
- `src/pages/LoginPage.tsx` - 登录页面
- `src/pages/UserProfilePage.tsx` - 个人页面
- `src/components/Header.tsx` - 头部组件（包含头像按钮）
- `src/components/ErrorBoundary.tsx` - 错误边界
- `src/services/api.ts` - API 客户端
- `src/services/productService.ts` - 商品服务

## ✅ 检查清单

- [ ] 能够使用测试账号登录
- [ ] 登录后头像按钮显示下拉菜单
- [ ] 能够进入个人页面
- [ ] 个人页面显示用户的商品列表
- [ ] 能够创建新商品
- [ ] 能够编辑商品
- [ ] 能够删除商品
- [ ] 能够退出登录
- [ ] 退出登录后头像按钮恢复为登录状态
