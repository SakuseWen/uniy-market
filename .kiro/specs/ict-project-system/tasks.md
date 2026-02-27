# Implementation Plan: Uniy Market / 实施计划：Uniy Market

## Overview / 概述

This implementation plan converts the Uniy Market design into a series of incremental coding tasks using TypeScript for both frontend and backend development. The backend infrastructure is now complete with all core features implemented including authentication, product management, real-time chat, translation services, reputation system, content moderation, and administrative tools. The remaining work focuses on frontend implementation, integration testing, and deployment preparation.

本实施计划将 Uniy Market 设计转换为一系列增量编码任务，使用 TypeScript 进行前端和后端开发。后端基础设施现已完成，所有核心功能已实现，包括认证、商品管理、实时聊天、翻译服务、声誉系统、内容审核和管理工具。剩余工作集中在前端实现、集成测试和部署准备。

**Current Status / 当前状态:**
- ✅ Backend API: Fully implemented with 14 database tables, comprehensive models, and RESTful endpoints
- ✅ Authentication: Google OAuth 2.0 with university email verification
- ✅ Real-time Chat: Socket.IO WebSocket server with translation support
- ✅ Multi-language: Translation service and localization for EN/TH/ZH
- ✅ Content Moderation: Automated filtering and reporting system
- ✅ Testing: Comprehensive unit tests with Jest
- ⏳ Frontend: Minimal placeholder page - needs full implementation
- ⏳ Integration: Backend complete, needs frontend integration
- ⏳ Deployment: Configuration needed for production environment

## Tasks / 任务

- [x] 1. Project Setup and Core Infrastructure / 项目设置和核心基础设施 **COMPLETED**
  - Initialize TypeScript Node.js project with Express.js / 初始化 TypeScript Node.js 项目和 Express.js
  - Set up project structure and testing framework (Jest + fast-check) / 设置项目结构和测试框架
  - Configure database connection (SQLite) / 配置数据库连接
  - _Requirements: 8.1, 8.3_

- [x] 2. Database Schema and Data Models / 数据库架构和数据模型 **COMPLETED**
  - [x] 2.1 Create database migration scripts with 14 tables / 创建包含 14 个表的数据库迁移脚本
  - [x] 2.2 Create TypeScript data models and interfaces / 创建 TypeScript 数据模型和接口
  - [x] 2.3 Implement data access layer with BaseModel / 实现带有 BaseModel 的数据访问层
  - _Requirements: 8.3, 13.1, 13.2_

- [x] 3. Authentication System Implementation / 认证系统实现
  - [x] 3.1 Set up Google OAuth 2.0 integration / 设置 Google OAuth 2.0 集成
    - Install and configure passport-google-oauth20 / 安装和配置 passport-google-oauth20
    - Create OAuth configuration and callback routes / 创建 OAuth 配置和回调路由
    - Implement session management with JWT tokens / 使用 JWT 令牌实现会话管理
    - _Requirements: 1.1, 1.3_

  - [ ]* 3.2 Write property test for OAuth authentication / 为 OAuth 认证编写属性测试
    - **Property 1: Google OAuth Authentication Flow**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

  - [x] 3.3 Implement university email verification system / 实现大学邮箱验证系统
    - Create email domain validation middleware / 创建邮箱域名验证中间件
    - Implement university whitelist management / 实现大学白名单管理
    - Add email verification status tracking / 添加邮箱验证状态跟踪
    - _Requirements: 1.2_

  - [x] 3.4 Create authentication middleware and guards / 创建认证中间件和守卫
    - Implement JWT token validation middleware / 实现 JWT 令牌验证中间件
    - Create role-based authorization guards / 创建基于角色的授权守卫
    - Add session expiration and refresh logic / 添加会话过期和刷新逻辑
    - _Requirements: 1.4, 1.5, 12.1, 13.3_

- [x] 4. Product Management System / 商品管理系统
  - [x] 4.1 Implement product CRUD API endpoints / 实现商品 CRUD API 端点
    - Create product creation endpoint with validation / 创建带验证的商品创建端点
    - Implement product update and deletion endpoints / 实现商品更新和删除端点
    - Add product retrieval with seller information / 添加包含卖家信息的商品检索
    - _Requirements: 2.1, 2.4_

  - [ ]* 4.2 Write property test for product management / 为商品管理编写属性测试
    - **Property 2: Product Listing Management**
    - **Validates: Requirements 2.1, 2.4**

  - [x] 4.3 Implement file upload system for product images / 实现商品图片文件上传系统
    - Set up multer middleware for image uploads / 设置 multer 中间件进行图片上传
    - Add image validation (type, size, dimensions) / 添加图片验证（类型、大小、尺寸）
    - Implement image optimization and storage / 实现图片优化和存储
    - _Requirements: 2.2, 8.2_

  - [ ]* 4.4 Write property test for file upload security / 为文件上传安全编写属性测试
    - **Property 3: File Upload Security and Validation**
    - **Validates: Requirements 2.2, 8.2**

  - [x] 4.5 Implement advanced search and filtering / 实现高级搜索和筛选
    - Create search endpoint with keyword matching / 创建带关键词匹配的搜索端点
    - Add filtering by category, price, condition, location / 添加按类别、价格、状况、位置筛选
    - Implement sorting and pagination / 实现排序和分页
    - _Requirements: 2.3, 7.1, 7.2, 7.3, 7.5_

  - [ ]* 4.6 Write property test for search functionality / 为搜索功能编写属性测试
    - **Property 4: Comprehensive Search and Filtering**
    - **Validates: Requirements 2.3, 7.1, 7.2, 7.3, 7.5**

  - [x] 4.7 Implement product status management / 实现商品状态管理
    - Add "mark as sold" functionality / 添加"标记为已售"功能
    - Implement status change notifications / 实现状态变更通知
    - Update search results based on status / 根据状态更新搜索结果
    - _Requirements: 2.5_

  - [ ]* 4.8 Write property test for product status management / 为商品状态管理编写属性测试
    - **Property 5: Product Status Management**
    - **Validates: Requirements 2.5**

- [x] 5. Multi-Language Support System / 多语言支持系统
  - [x] 5.1 Set up Google Translate API integration / 设置 Google 翻译 API 集成
    - Install and configure Google Cloud Translation client / 安装和配置 Google 云翻译客户端
    - Create translation service with caching / 创建带缓存的翻译服务
    - Implement language detection functionality / 实现语言检测功能
    - _Requirements: 3.2, 3.3, 3.5_

  - [x] 5.2 Implement frontend language switching / 实现前端语言切换
    - Create language preference management / 创建语言偏好管理
    - Add interface localization for EN/TH/ZH / 添加 EN/TH/ZH 界面本地化
    - Implement real-time language switching / 实现实时语言切换
    - _Requirements: 3.1, 3.4_

  - [ ]* 5.3 Write property tests for multi-language support / 为多语言支持编写属性测试
    - **Property 6: Multi-Language Interface Support**
    - **Property 7: Automatic Translation Service Integration**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

- [x] 6. Real-Time Chat System / 实时聊天系统
  - [x] 6.1 Set up Socket.IO WebSocket server / 设置 Socket.IO WebSocket 服务器
    - Configure Socket.IO with Express.js / 配置 Socket.IO 与 Express.js
    - Implement connection management and authentication / 实现连接管理和认证
    - Create room-based chat architecture / 创建基于房间的聊天架构
    - _Requirements: 4.1, 4.2_

  - [x] 6.2 Implement chat functionality / 实现聊天功能
    - Create chat creation and management APIs / 创建聊天创建和管理 API
    - Implement message sending and receiving / 实现消息发送和接收
    - Add support for text and image messages / 添加对文本和图片消息的支持
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 6.3 Write property test for real-time chat / 为实时聊天编写属性测试
    - **Property 8: Real-Time Chat System**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.6**

  - [x] 6.4 Implement chat management features / 实现聊天管理功能
    - Add chat deletion with cascade cleanup / 添加带级联清理的聊天删除
    - Implement message read status tracking / 实现消息已读状态跟踪
    - Create real-time notifications system / 创建实时通知系统
    - _Requirements: 4.5, 4.6, 4.7_

  - [ ]* 6.5 Write property test for chat management / 为聊天管理编写属性测试
    - **Property 9: Chat Management and Deletion**
    - **Validates: Requirements 4.5, 4.7**

  - [x] 6.6 Integrate automatic message translation / 集成自动消息翻译
    - Add translation to chat messages / 为聊天消息添加翻译
    - Implement user language preference handling / 实现用户语言偏好处理
    - Store both original and translated messages / 存储原始和翻译消息
    - _Requirements: 4.4_

- [x] 7. Checkpoint - Core Features / 检查点 - 核心功能
  - Ensure all core feature tests pass, ask the user if questions arise. / 确保所有核心功能测试通过，如有问题询问用户。

- [x] 8. User Reputation System / 用户声誉系统
  - [x] 8.1 Implement bidirectional rating system / 实现双向评价系统
    - Create rating submission API with validation / 创建带验证的评价提交 API
    - Implement rating constraints (1-5 scale) / 实现评价约束（1-5 分制）
    - Add optional comment functionality / 添加可选评论功能
    - _Requirements: 5.1, 5.2_

  - [ ]* 8.2 Write property test for rating system / 为评价系统编写属性测试
    - **Property 10: Bidirectional Rating System**
    - **Validates: Requirements 5.1, 5.2**

  - [x] 8.3 Implement reputation calculation engine / 实现声誉计算引擎
    - Create reputation calculation algorithms / 创建声誉计算算法
    - Implement separate buyer/seller rating tracking / 实现独立的买家/卖家评分跟踪
    - Add real-time reputation updates / 添加实时声誉更新
    - _Requirements: 5.3, 5.4, 5.5_

  - [ ]* 8.4 Write property test for reputation calculation / 为声誉计算编写属性测试
    - **Property 11: Comprehensive Reputation Calculation**
    - **Validates: Requirements 5.3, 5.4, 5.5**

- [x] 9. Location and Privacy Management / 位置和隐私管理
  - [x] 9.1 Implement Google Maps integration / 实现 Google 地图集成
    - Set up Google Maps JavaScript API / 设置 Google 地图 JavaScript API
    - Create location display components / 创建位置显示组件
    - Implement privacy-focused location handling / 实现注重隐私的位置处理
    - _Requirements: 6.2, 6.3_

  - [x] 9.2 Implement location privacy protection / 实现位置隐私保护
    - Add general area input validation / 添加大概区域输入验证
    - Ensure no precise coordinates storage / 确保不存储精确坐标
    - Implement location sharing through chat / 通过聊天实现位置共享
    - _Requirements: 6.1, 6.4, 6.5_

  - [ ]* 9.3 Write property test for location management / 为位置管理编写属性测试
    - **Property 12: Location Privacy Management**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [x] 10. Transaction Management System / 交易管理系统
  - [x] 10.1 Implement deal creation and tracking / 实现交易创建和跟踪
    - Create deal record management / 创建交易记录管理
    - Implement transaction status tracking / 实现交易状态跟踪
    - Add buyer-seller agreement handling / 添加买家-卖家协议处理
    - _Requirements: 9.1, 9.2, 9.4_

  - [x] 10.2 Implement transaction history / 实现交易历史
    - Create transaction history API / 创建交易历史 API
    - Add user transaction count updates / 添加用户交易计数更新
    - Implement deal completion workflows / 实现交易完成工作流程
    - _Requirements: 9.3, 9.5_

  - [ ]* 10.3 Write property test for transaction management / 为交易管理编写属性测试
    - **Property 15: Transaction Management**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

- [x] 11. Content Moderation and Safety / 内容审核和安全
  - [x] 11.1 Implement content filtering system / 实现内容过滤系统
    - Create sensitive word filtering middleware / 创建敏感词过滤中间件
    - Add multilingual content moderation / 添加多语言内容审核
    - Implement automatic content flagging / 实现自动内容标记
    - _Requirements: 10.1, 10.2_

  - [ ]* 11.2 Write property test for content filtering / 为内容过滤编写属性测试
    - **Property 13: Content Filtering and Moderation**
    - **Validates: Requirements 10.1, 10.2**

  - [x] 11.3 Implement reporting system / 实现举报系统
    - Create report submission API / 创建举报提交 API
    - Add report categorization and management / 添加举报分类和管理
    - Implement admin report review tools / 实现管理员举报审查工具
    - _Requirements: 10.3, 10.4, 10.5_

  - [ ]* 11.4 Write property test for reporting mechanism / 为举报机制编写属性测试
    - **Property 14: Reporting Mechanism**
    - **Validates: Requirements 10.3, 10.4, 10.5**

- [x] 12. User Favorites System / 用户收藏系统
  - [x] 12.1 Implement favorites functionality / 实现收藏功能
    - Create add/remove favorites API / 创建添加/移除收藏 API
    - Implement favorites list management / 实现收藏列表管理
    - Add favorites synchronization with product status / 添加收藏与商品状态同步
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 12.2 Write property test for favorites management / 为收藏管理编写属性测试
    - **Property 16: Favorites Management**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

- [x] 13. Administrative Management System / 管理员管理系统
  - [x] 13.1 Implement admin authentication and authorization / 实现管理员认证和授权
    - Create admin role management / 创建管理员角色管理
    - Implement admin panel access controls / 实现管理面板访问控制
    - Add comprehensive audit logging / 添加全面的审计日志
    - _Requirements: 12.1, 12.4_

  - [x] 13.2 Create admin management API endpoints / 创建管理管理 API 端点
    - Build report management API / 构建举报管理 API
    - Implement user and content moderation APIs / 实现用户和内容审核 API
    - Add system monitoring endpoints / 添加系统监控端点
    - _Requirements: 12.2, 12.3, 12.5_

  - [ ]* 13.3 Write property test for admin tools / 为管理工具编写属性测试
    - **Property 17: Administrative Management Tools**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**

- [x] 14. Data Integrity and Security / 数据完整性和安全
  - [x] 14.1 Implement comprehensive error handling / 实现全面的错误处理
    - Create structured error response system / 创建结构化错误响应系统
    - Add comprehensive logging strategy / 添加全面的日志策略
    - Implement graceful error recovery / 实现优雅的错误恢复
    - _Requirements: 8.5_

  - [x] 14.2 Enhance data security measures / 增强数据安全措施
    - Implement authorization checks for sensitive operations / 为敏感操作实现授权检查
    - Add data validation and sanitization / 添加数据验证和清理
    - Ensure proper cascading deletion handling / 确保适当的级联删除处理
    - _Requirements: 13.1, 13.2, 13.3, 13.5_

  - [ ]* 14.3 Write property tests for data integrity / 为数据完整性编写属性测试
    - **Property 18: Data Integrity and Security**
    - **Property 19: Error Handling and Logging**
    - **Validates: Requirements 8.5, 13.1, 13.2, 13.3, 13.5**

- [x] 15. Frontend Implementation / 前端实现
  - [x] 15.1 Create main application pages / 创建主要应用页面
    - Implement home page with product grid and search / 实现带商品网格和搜索的主页
    - Create product detail page with seller info / 创建带卖家信息的商品详情页面
    - Build product posting form with image upload / 构建带图片上传的商品发布表单
    - Implement user authentication flow (Google OAuth) / 实现用户认证流程（Google OAuth）
    - Add language switcher component / 添加语言切换组件
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 7.1, 7.2, 7.3_

  - [x] 15.2 Implement real-time chat interface / 实现实时聊天界面
    - Create chat list view with unread indicators / 创建带未读指示器的聊天列表视图
    - Build real-time message interface with Socket.IO / 使用 Socket.IO 构建实时消息界面
    - Add message translation toggle / 添加消息翻译切换
    - Implement typing indicators / 实现输入指示器
    - Add image message support / 添加图片消息支持
    - Create notification system for new messages / 为新消息创建通知系统
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_

  - [x] 15.3 Create user profile and reputation pages / 创建用户资料和声誉页面
    - Build user profile page with reputation display / 构建带声誉显示的用户资料页面
    - Implement transaction history view / 实现交易历史视图
    - Create favorites list page / 创建收藏列表页面
    - Add rating and review submission interface / 添加评分和评价提交界面
    - _Requirements: 5.3, 5.4, 5.5, 9.3, 11.3, 11.4_

  - [x] 15.4 Create admin dashboard and moderation tools / 创建管理仪表板和审核工具
    - Build admin dashboard with system statistics / 构建带系统统计的管理仪表板
    - Implement report management interface / 实现举报管理界面
    - Create user moderation tools / 创建用户审核工具
    - Add content moderation interface / 添加内容审核界面
    - Implement audit log viewer / 实现审计日志查看器
    - _Requirements: 12.1, 12.2, 12.3, 12.5_

  - [x] 15.5 Implement responsive design and accessibility / 实现响应式设计和可访问性
    - Ensure mobile-responsive layouts / 确保移动响应式布局
    - Add accessibility features (ARIA labels, keyboard navigation) / 添加可访问性功能（ARIA 标签、键盘导航）
    - Implement loading states and error boundaries / 实现加载状态和错误边界
    - Add user feedback mechanisms (toasts, modals) / 添加用户反馈机制（提示、模态框）
    - _Requirements: All UI requirements_

- [x] 16. Integration and Testing / 集成和测试
  - [x] 16.1 Implement end-to-end integration / 实现端到端集成
    - Connect frontend with all backend API endpoints / 连接前端与所有后端 API 端点
    - Integrate WebSocket for real-time features / 集成 WebSocket 实现实时功能
    - Set up production database configuration / 设置生产数据库配置
    - Implement comprehensive error boundaries / 实现全面的错误边界
    - Configure environment variables for production / 配置生产环境变量
    - _Requirements: All requirements_

  - [ ]* 16.2 Write integration tests / 编写集成测试
    - Test complete user workflows (registration, listing, chat, transaction) / 测试完整的用户工作流程（注册、列表、聊天、交易）
    - Verify external API integrations (Google OAuth, Translate, Maps) / 验证外部 API 集成（Google OAuth、翻译、地图）
    - Test multilingual functionality end-to-end / 端到端测试多语言功能
    - Validate WebSocket real-time communication / 验证 WebSocket 实时通信
    - _Requirements: All requirements_

  - [x] 16.3 Performance optimization / 性能优化
    - Implement database query optimization and indexing / 实现数据库查询优化和索引
    - Add caching for frequently accessed data / 为频繁访问的数据添加缓存
    - Optimize image loading and delivery / 优化图片加载和传输
    - Implement lazy loading for frontend components / 为前端组件实现懒加载
    - _Requirements: 8.4_

  - [x] 16.4 Security hardening / 安全加固
    - Implement rate limiting for API endpoints / 为 API 端点实现速率限制
    - Add CSRF protection / 添加 CSRF 保护
    - Implement input sanitization across all endpoints / 在所有端点实现输入清理
    - Add security headers and CSP / 添加安全标头和 CSP
    - Conduct security audit / 进行安全审计
    - _Requirements: 13.1, 13.3, 13.5_

- [x] 17. Deployment and Documentation / 部署和文档
  - [x] 17.1 Prepare deployment configuration / 准备部署配置
    - Create production build scripts / 创建生产构建脚本
    - Set up environment configuration management / 设置环境配置管理
    - Configure production database (PostgreSQL migration) / 配置生产数据库（PostgreSQL 迁移）
    - Set up file storage for production / 设置生产文件存储
    - _Requirements: 8.3_

  - [x] 17.2 Create deployment documentation / 创建部署文档
    - Write deployment guide / 编写部署指南
    - Document environment variables / 记录环境变量
    - Create API documentation / 创建 API 文档
    - Write user manual / 编写用户手册
    - Document admin procedures / 记录管理程序
    - _Requirements: All requirements_

  - [x] 17.3 Final testing and validation / 最终测试和验证
    - Run full test suite / 运行完整测试套件
    - Perform user acceptance testing / 执行用户验收测试
    - Validate all requirements are met / 验证所有需求都已满足
    - Test in production-like environment / 在类生产环境中测试
    - _Requirements: All requirements_

- [x] 18. Final Checkpoint / 最终检查点
  - Ensure all tests pass / 确保所有测试通过
  - Verify all requirements are met / 验证所有需求都已满足
  - Confirm frontend is fully functional / 确认前端完全功能
  - Validate production readiness / 验证生产就绪
  - Ask the user if questions arise / 如有问题询问用户

- [ ] 19. Modern Frontend Integration / 现代前端集成 **NEW**
  - [x] 19.1 Setup and Configuration / 设置和配置
    - Move "Product Retrieval Main Page" to project root as "frontend" / 将"Product Retrieval Main Page"移动到项目根目录作为"frontend"
    - Install frontend dependencies / 安装前端依赖
    - Configure Vite proxy to connect to backend API / 配置 Vite 代理连接后端 API
    - Update environment variables for API endpoints / 更新 API 端点的环境变量
    - _Requirements: All frontend requirements_

  - [x] 19.2 Create API Service Layer / 创建 API 服务层
    - Create API client with axios or fetch / 使用 axios 或 fetch 创建 API 客户端
    - Implement authentication service (Google OAuth integration) / 实现认证服务（Google OAuth 集成）
    - Implement product service (CRUD operations) / 实现商品服务（CRUD 操作）
    - Implement chat service (WebSocket integration) / 实现聊天服务（WebSocket 集成）
    - Implement user service (profile, reputation) / 实现用户服务（资料、声誉）
    - Add error handling and retry logic / 添加错误处理和重试逻辑
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 4.1, 4.2, 5.3_

  - [x] 19.3 Data Model Adaptation / 数据模型适配
    - Create TypeScript interfaces matching backend models / 创建匹配后端模型的 TypeScript 接口
    - Implement data transformation utilities / 实现数据转换工具
    - Map frontend Product interface to backend ProductListing / 将前端 Product 接口映射到后端 ProductListing
    - Map frontend User interface to backend User model / 将前端 User 接口映射到后端 User 模型
    - Handle multilingual content (title, description) / 处理多语言内容（标题、描述）
    - _Requirements: 2.1, 2.4, 3.1, 3.2_

  - [ ] 19.4 Authentication Integration / 认证集成
    - Implement Google OAuth login flow / 实现 Google OAuth 登录流程
    - Add JWT token management (storage, refresh) / 添加 JWT 令牌管理（存储、刷新）
    - Create protected route wrapper / 创建受保护路由包装器
    - Implement session persistence / 实现会话持久化
    - Add logout functionality / 添加注销功能
    - Update Header component with real auth state / 使用真实认证状态更新 Header 组件
    - _Requirements: 1.1, 1.3, 1.4, 1.5_

  - [ ] 19.5 Product Management Integration / 商品管理集成
    - Replace mockData with API calls in App.tsx / 在 App.tsx 中用 API 调用替换 mockData
    - Implement product search and filtering with backend / 使用后端实现商品搜索和筛选
    - Add product creation form with image upload / 添加带图片上传的商品创建表单
    - Implement product edit and delete functionality / 实现商品编辑和删除功能
    - Add loading states and error handling / 添加加载状态和错误处理
    - Implement pagination for product lists / 为商品列表实现分页
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.1, 7.2, 7.3, 7.5_

  - [ ] 19.6 Real-time Chat Integration / 实时聊天集成
    - Install and configure Socket.IO client / 安装和配置 Socket.IO 客户端
    - Create WebSocket connection manager / 创建 WebSocket 连接管理器
    - Implement chat list component with real data / 使用真实数据实现聊天列表组件
    - Implement message sending and receiving / 实现消息发送和接收
    - Add real-time notifications / 添加实时通知
    - Integrate message translation feature / 集成消息翻译功能
    - Handle connection errors and reconnection / 处理连接错误和重新连接
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_

  - [ ] 19.7 User Profile and Reputation Integration / 用户资料和声誉集成
    - Create user profile page with real data / 使用真实数据创建用户资料页面
    - Implement reputation display / 实现声誉显示
    - Add transaction history view / 添加交易历史视图
    - Implement favorites functionality with backend / 使用后端实现收藏功能
    - Add rating and review submission / 添加评分和评价提交
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 11.1, 11.2, 11.3_

  - [ ] 19.8 Admin Dashboard Integration / 管理仪表板集成
    - Create admin dashboard with system statistics / 创建带系统统计的管理仪表板
    - Implement report management interface / 实现举报管理界面
    - Add user moderation tools / 添加用户审核工具
    - Implement content moderation interface / 实现内容审核界面
    - Add audit log viewer / 添加审计日志查看器
    - _Requirements: 12.1, 12.2, 12.3, 12.5_

  - [ ] 19.9 Testing and Optimization / 测试和优化
    - Test all API integrations / 测试所有 API 集成
    - Test authentication flow end-to-end / 端到端测试认证流程
    - Test real-time chat functionality / 测试实时聊天功能
    - Optimize bundle size and loading performance / 优化包大小和加载性能
    - Add error boundaries for better error handling / 添加错误边界以更好地处理错误
    - Test responsive design on mobile devices / 在移动设备上测试响应式设计
    - _Requirements: All requirements_

  - [ ] 19.10 Production Build and Deployment / 生产构建和部署
    - Configure production build settings / 配置生产构建设置
    - Update backend to serve frontend build / 更新后端以提供前端构建
    - Test production build locally / 本地测试生产构建
    - Update deployment documentation / 更新部署文档
    - Deploy to production environment / 部署到生产环境
    - _Requirements: All requirements_

## Notes / 注意事项

- Tasks marked with `*` are optional and can be skipped for faster MVP / 标记为 `*` 的任务是可选的，可以跳过以加快 MVP 开发
- Each task references specific requirements for traceability / 每个任务引用特定需求以便追溯
- Checkpoints ensure incremental validation / 检查点确保增量验证
- Property tests validate universal correctness properties / 属性测试验证通用正确性属性
- Unit tests validate specific examples and edge cases / 单元测试验证特定示例和边界情况
- All code should be written in TypeScript with proper type definitions / 所有代码应使用 TypeScript 编写，并具有适当的类型定义
- Follow Node.js and Express.js best practices / 遵循 Node.js 和 Express.js 最佳实践
- Use modern JavaScript/TypeScript features (async/await, ES modules) / 使用现代 JavaScript/TypeScript 功能（async/await、ES 模块）
- Maintain compatibility with existing database schema and models / 保持与现有数据库架构和模型的兼容性

## Implementation Progress Summary / 实施进度摘要

**Completed (Tasks 1-14) / 已完成（任务 1-14）:**
- ✅ Core infrastructure and database (14 tables with full CRUD operations)
- ✅ Authentication system (Google OAuth, JWT, university email verification)
- ✅ Product management (CRUD, search, filtering, image upload, status management)
- ✅ Multi-language support (Translation API, localization for EN/TH/ZH)
- ✅ Real-time chat (Socket.IO, message translation, notifications)
- ✅ User reputation system (bidirectional ratings, reputation calculation)
- ✅ Location and privacy management (privacy-focused location handling)
- ✅ Transaction management (deal creation, tracking, history)
- ✅ Content moderation (sensitive word filtering, reporting system)
- ✅ User favorites system (add/remove, synchronization)
- ✅ Administrative tools (admin authentication, moderation APIs, audit logging)
- ✅ Data integrity and security (error handling, validation, authorization)

**Remaining (Tasks 15-18) / 剩余（任务 15-18）:**
- ✅ Frontend implementation (main pages, chat UI, user profiles, admin dashboard) - REPLACED BY TASK 19
- ⏳ Integration and testing (E2E integration, performance optimization, security hardening)
- ⏳ Deployment preparation (production config, documentation, final validation)

**New Task 19: Modern Frontend Integration / 新任务 19：现代前端集成**
- ⏳ Replace existing frontend with modern React + TypeScript + Vite frontend
- ⏳ Create API service layer to connect frontend with backend
- ⏳ Integrate authentication, products, chat, and all backend features
- ⏳ Test and optimize for production deployment

**Next Steps / 下一步:**
1. Start with Task 19.1: Setup and Configuration - Move new frontend to project root
2. Implement Task 19.2: Create API Service Layer - Build connection to backend
3. Continue with Tasks 19.3-19.10: Complete integration of all features
4. Final testing and deployment