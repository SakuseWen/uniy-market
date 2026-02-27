# Requirements Document / 需求文档

## Introduction / 简介

Uniy Market is a comprehensive university second-hand trading platform designed to facilitate secure, multilingual transactions between verified university students. The platform provides authentication through Google OAuth, real-time chat with translation capabilities, user reputation systems, and administrative moderation tools to ensure a safe and trustworthy trading environment.

Uniy Market 是一个综合性的大学二手交易平台，旨在为经过验证的大学生提供安全、多语言的交易服务。该平台通过 Google OAuth 提供身份验证，具备实时聊天和翻译功能、用户声誉系统以及管理审核工具，确保安全可信的交易环境。

## Glossary / 术语表

- **System / 系统**: The Uniy Market platform including web application, database, and external integrations / Uniy Market 平台，包括网络应用程序、数据库和外部集成
- **User / 用户**: Any authenticated individual using the platform / 任何使用平台的已认证个人
- **Student / 学生**: A verified user with a valid university email address / 拥有有效大学邮箱地址的已验证用户
- **Admin / 管理员**: A user with administrative privileges for content moderation and system management / 拥有内容审核和系统管理权限的用户
- **Product_Listing / 商品列表**: An item posted for sale by a student / 学生发布的待售商品
- **Chat_Channel / 聊天频道**: A communication channel between buyer and seller for a specific product / 买家和卖家针对特定商品的沟通渠道
- **Deal / 交易**: A completed transaction record between buyer and seller / 买家和卖家之间的完成交易记录
- **Reputation_Score / 声誉评分**: A calculated rating based on user reviews and transaction history / 基于用户评价和交易历史计算的评级
- **Translation_Service / 翻译服务**: Google Translate API integration for multilingual support / Google 翻译 API 集成，提供多语言支持
- **University_Whitelist / 大学白名单**: A list of approved university email domains / 已批准的大学邮箱域名列表

## Requirements / 需求

### Requirement 1: User Authentication and Verification / 需求1：用户认证和验证

**User Story / 用户故事:** As a university student, I want to securely authenticate and verify my identity, so that I can access the trading platform with confidence in other users' legitimacy. / 作为大学生，我希望安全地认证和验证我的身份，以便我能够信任其他用户的合法性并访问交易平台。

#### Acceptance Criteria / 验收标准

1. WHEN a user attempts to log in, THE System SHALL authenticate them using Google OAuth 2.0 / 当用户尝试登录时，系统应使用 Google OAuth 2.0 对其进行身份验证
2. WHEN a user registers with a university email, THE System SHALL verify the email domain against the University_Whitelist / 当用户使用大学邮箱注册时，系统应根据大学白名单验证邮箱域名
3. WHEN a user completes authentication, THE System SHALL create a persistent session that remains valid across browser sessions / 当用户完成身份验证时，系统应创建在浏览器会话间保持有效的持久会话
4. WHEN a user's session expires, THE System SHALL redirect them to the authentication page / 当用户会话过期时，系统应将其重定向到身份验证页面
5. WHEN a user logs out, THE System SHALL invalidate their session and clear authentication tokens / 当用户注销时，系统应使其会话无效并清除身份验证令牌

### Requirement 2: Product Listing Management / 需求2：商品列表管理

**User Story / 用户故事:** As a student seller, I want to create, edit, and manage my product listings with images and detailed information, so that I can effectively showcase items for sale. / 作为学生卖家，我希望创建、编辑和管理带有图片和详细信息的商品列表，以便有效展示待售商品。

#### Acceptance Criteria / 验收标准

1. WHEN a verified student creates a product listing, THE System SHALL generate a unique identifier and store the listing with all required information / 当经过验证的学生创建商品列表时，系统应生成唯一标识符并存储包含所有必需信息的列表
2. WHEN a user uploads product images, THE System SHALL validate file types, optimize images, and store them securely / 当用户上传商品图片时，系统应验证文件类型、优化图片并安全存储
3. WHEN a user searches for products, THE System SHALL return relevant results based on keywords, categories, price ranges, and location filters / 当用户搜索商品时，系统应基于关键词、类别、价格范围和位置过滤器返回相关结果
4. WHEN a product listing is displayed, THE System SHALL show title, description, price, condition, images, seller information, and seller reputation / 当显示商品列表时，系统应显示标题、描述、价格、状况、图片、卖家信息和卖家声誉
5. WHEN a product is marked as sold, THE System SHALL update the listing status and remove it from active search results / 当商品标记为已售时，系统应更新列表状态并从活跃搜索结果中移除

### Requirement 3: Multi-Language Support / 需求3：多语言支持

**User Story / 用户故事:** As an international student, I want to use the platform in my preferred language and communicate with others regardless of language barriers, so that I can participate fully in the marketplace. / 作为国际学生，我希望使用我偏好的语言使用平台，并与他人沟通而不受语言障碍影响，以便我能够充分参与市场交易。

#### Acceptance Criteria / 验收标准

1. WHEN a user selects a language preference, THE System SHALL display the interface in English, Thai, or Chinese / 当用户选择语言偏好时，系统应以英语、泰语或中文显示界面
2. WHEN a user sends a chat message, THE Translation_Service SHALL automatically translate it to the recipient's preferred language / 当用户发送聊天消息时，翻译服务应自动将其翻译为接收者的偏好语言
3. WHEN translation is performed, THE System SHALL preserve the original message and display both original and translated versions / 当执行翻译时，系统应保留原始消息并显示原文和翻译版本
4. WHEN a user changes their language preference, THE System SHALL update the interface immediately without requiring a page refresh / 当用户更改语言偏好时，系统应立即更新界面而无需刷新页面
5. WHEN product listings contain text in different languages, THE System SHALL provide translation options for product descriptions / 当商品列表包含不同语言的文本时，系统应为商品描述提供翻译选项

### Requirement 4: Real-Time Chat System / 需求4：实时聊天系统

**User Story / 用户故事:** As a buyer or seller, I want to communicate in real-time with other users about products, so that I can negotiate prices and arrange transactions efficiently. / 作为买家或卖家，我希望与其他用户实时沟通商品信息，以便高效地协商价格和安排交易。

#### Acceptance Criteria / 验收标准

1. WHEN a buyer contacts a seller about a product, THE System SHALL create a Chat_Channel between the two users / 当买家就商品联系卖家时，系统应在两个用户之间创建聊天频道
2. WHEN a user sends a message, THE System SHALL deliver it in real-time to the recipient using WebSocket connections / 当用户发送消息时，系统应使用 WebSocket 连接实时传递给接收者
3. WHEN a message is sent, THE System SHALL support both text and image message types / 当发送消息时，系统应支持文本和图片消息类型
4. WHEN messages are exchanged in different languages, THE System SHALL automatically translate them based on user preferences / 当用不同语言交换消息时，系统应根据用户偏好自动翻译
5. WHEN a chat becomes inactive, THE System SHALL allow users to delete the chat history / 当聊天变为非活跃状态时，系统应允许用户删除聊天历史
6. WHEN a user receives a message, THE System SHALL send real-time notifications / 当用户收到消息时，系统应发送实时通知
7. WHEN a chat is deleted, THE System SHALL remove all associated messages and notify both participants / 当聊天被删除时，系统应移除所有相关消息并通知双方参与者

### Requirement 5: User Reputation System / 需求5：用户声誉系统

**User Story / 用户故事:** As a platform user, I want to rate other users and view reputation scores, so that I can make informed decisions about who to trade with. / 作为平台用户，我希望评价其他用户并查看声誉评分，以便我能够明智地决定与谁交易。

#### Acceptance Criteria / 验收标准

1. WHEN a transaction is completed, THE System SHALL allow both buyer and seller to rate each other on a 1-5 scale / 当交易完成时，系统应允许买家和卖家在1-5分范围内互相评价
2. WHEN a user submits a rating, THE System SHALL require the rating to be between 1 and 5 and optionally include a text comment / 当用户提交评价时，系统应要求评分在1到5之间，并可选择包含文本评论
3. WHEN calculating reputation, THE System SHALL compute average ratings separately for buying and selling activities / 当计算声誉时，系统应分别计算购买和销售活动的平均评分
4. WHEN displaying user profiles, THE System SHALL show overall reputation score, total number of reviews, and completed transaction count / 当显示用户资料时，系统应显示总体声誉评分、评价总数和完成交易数量
5. WHEN a user views another user's profile, THE System SHALL display comprehensive reputation information including buyer and seller ratings / 当用户查看其他用户资料时，系统应显示包括买家和卖家评分在内的综合声誉信息

### Requirement 6: Location and Privacy Management / 需求6：位置和隐私管理

**User Story / 用户故事:** As a user concerned about privacy, I want to share my general location for meetups while protecting my exact address, so that I can arrange safe transactions. / 作为关心隐私的用户，我希望分享我的大概位置以便见面，同时保护我的确切地址，以便我能够安排安全的交易。

#### Acceptance Criteria / 验收标准

1. WHEN a user enters location information, THE System SHALL allow input of general area descriptions rather than exact addresses / 当用户输入位置信息时，系统应允许输入大概区域描述而非确切地址
2. WHEN displaying product locations, THE System SHALL show approximate areas using Google Maps integration / 当显示商品位置时，系统应使用 Google 地图集成显示大概区域
3. WHEN a user views a product, THE System SHALL display the general location area on an interactive map / 当用户查看商品时，系统应在交互式地图上显示大概位置区域
4. WHEN location data is stored, THE System SHALL ensure no precise coordinates or exact addresses are retained / 当存储位置数据时，系统应确保不保留精确坐标或确切地址
5. WHEN users arrange meetups, THE System SHALL facilitate location sharing through the chat system while maintaining privacy controls / 当用户安排见面时，系统应通过聊天系统促进位置共享，同时保持隐私控制

### Requirement 7: Advanced Search and Filtering / 需求7：高级搜索和筛选

**User Story / 用户故事:** As a buyer, I want to search and filter products efficiently, so that I can quickly find items that match my specific needs and budget. / 作为买家，我希望高效地搜索和筛选商品，以便快速找到符合我特定需求和预算的商品。

#### Acceptance Criteria / 验收标准

1. WHEN a user performs a search, THE System SHALL support keyword matching against product titles and descriptions / 当用户执行搜索时，系统应支持对商品标题和描述进行关键词匹配
2. WHEN applying filters, THE System SHALL allow filtering by category, price range, condition, and location / 当应用筛选器时，系统应允许按类别、价格范围、状况和位置进行筛选
3. WHEN displaying search results, THE System SHALL support sorting by price (ascending/descending) and date posted / 当显示搜索结果时，系统应支持按价格（升序/降序）和发布日期排序
4. WHEN no search results are found, THE System SHALL display appropriate messaging and suggest alternative search terms / 当未找到搜索结果时，系统应显示适当的消息并建议替代搜索词
5. WHEN search results are displayed, THE System SHALL implement pagination to handle large result sets efficiently / 当显示搜索结果时，系统应实现分页以高效处理大型结果集

### Requirement 8: System Architecture and Performance / 需求8：系统架构和性能

**User Story / 用户故事:** As a system architect, I want a scalable and maintainable platform architecture, so that the system can handle growth and remain reliable. / 作为系统架构师，我希望有一个可扩展和可维护的平台架构，以便系统能够处理增长并保持可靠。

#### Acceptance Criteria / 验收标准

1. WHEN the system processes requests, THE System SHALL use TypeScript for type safety and maintainability / 当系统处理请求时，系统应使用 TypeScript 以确保类型安全和可维护性
2. WHEN handling file uploads, THE System SHALL implement secure file storage with appropriate validation and optimization / 当处理文件上传时，系统应实现安全的文件存储，具有适当的验证和优化
3. WHEN managing data, THE System SHALL use a relational database with proper indexing and foreign key constraints / 当管理数据时，系统应使用具有适当索引和外键约束的关系数据库
4. WHEN serving content, THE System SHALL implement appropriate caching strategies for optimal performance / 当提供内容时，系统应实现适当的缓存策略以获得最佳性能
5. WHEN errors occur, THE System SHALL log them appropriately and provide meaningful error messages to users / 当发生错误时，系统应适当记录并向用户提供有意义的错误消息

### Requirement 9: Transaction Management / 需求9：交易管理

**User Story / 用户故事:** As a user completing transactions, I want to track deal progress and maintain transaction history, so that I have records of my trading activity. / 作为完成交易的用户，我希望跟踪交易进度并维护交易历史，以便我有交易活动的记录。

#### Acceptance Criteria / 验收标准

1. WHEN a buyer and seller agree on a transaction, THE System SHALL create a Deal record with transaction details / 当买家和卖家就交易达成一致时，系统应创建包含交易详情的交易记录
2. WHEN a product is sold, THE System SHALL update the product status and link it to the Deal record / 当商品售出时，系统应更新商品状态并将其链接到交易记录
3. WHEN viewing transaction history, THE System SHALL display all completed deals with dates, products, and involved parties / 当查看交易历史时，系统应显示所有已完成的交易，包括日期、商品和相关方
4. WHEN a deal is created, THE System SHALL track the transaction status (pending, completed, cancelled) / 当创建交易时，系统应跟踪交易状态（待处理、已完成、已取消）
5. WHEN deals are completed, THE System SHALL update user transaction counts for reputation calculation / 当交易完成时，系统应更新用户交易计数以进行声誉计算

### Requirement 10: Content Moderation and Safety / 需求10：内容审核和安全

**User Story / 用户故事:** As a platform administrator, I want to moderate content and ensure user safety, so that the platform maintains high quality and trustworthiness. / 作为平台管理员，我希望审核内容并确保用户安全，以便平台保持高质量和可信度。

#### Acceptance Criteria / 验收标准

1. WHEN content is posted, THE System SHALL filter it against a database of sensitive words in multiple languages / 当发布内容时，系统应根据多语言敏感词数据库对其进行过滤
2. WHEN inappropriate content is detected, THE System SHALL flag it for review and optionally block posting / 当检测到不当内容时，系统应标记以供审查并可选择阻止发布
3. WHEN users report content or users, THE System SHALL create Report records with categorized reasons / 当用户举报内容或用户时，系统应创建带有分类原因的举报记录
4. WHEN reports are submitted, THE System SHALL allow reporting for inappropriate content, spam, fraud, harassment, and other reasons / 当提交举报时，系统应允许举报不当内容、垃圾信息、欺诈、骚扰和其他原因
5. WHEN administrators review reports, THE System SHALL provide tools to take appropriate moderation actions / 当管理员审查举报时，系统应提供工具以采取适当的审核行动

### Requirement 11: User Favorites System / 需求11：用户收藏系统

**User Story / 用户故事:** As a buyer, I want to save interesting products to a favorites list, so that I can easily return to items I'm considering purchasing. / 作为买家，我希望将感兴趣的商品保存到收藏列表中，以便我能够轻松返回到我正在考虑购买的商品。

#### Acceptance Criteria / 验收标准

1. WHEN a user views a product, THE System SHALL provide an option to add it to their favorites list / 当用户查看商品时，系统应提供将其添加到收藏列表的选项
2. WHEN a user adds a favorite, THE System SHALL store the relationship and provide immediate visual feedback / 当用户添加收藏时，系统应存储关系并提供即时视觉反馈
3. WHEN viewing favorites, THE System SHALL display all saved products with current status and availability / 当查看收藏时，系统应显示所有已保存的商品及其当前状态和可用性
4. WHEN a favorited product's status changes, THE System SHALL update the favorites list to reflect current availability / 当收藏商品的状态发生变化时，系统应更新收藏列表以反映当前可用性
5. WHEN a user removes a favorite, THE System SHALL immediately update the favorites list and provide confirmation / 当用户移除收藏时，系统应立即更新收藏列表并提供确认

### Requirement 12: Administrative Management / 需求12：管理员管理

**User Story / 用户故事:** As a system administrator, I want comprehensive management tools, so that I can effectively moderate the platform and maintain system integrity. / 作为系统管理员，我希望有全面的管理工具，以便我能够有效地审核平台并维护系统完整性。

#### Acceptance Criteria / 验收标准

1. WHEN administrators access the admin panel, THE System SHALL require proper authentication and authorization / 当管理员访问管理面板时，系统应要求适当的身份验证和授权
2. WHEN reviewing reports, THE System SHALL provide interfaces to view, categorize, and resolve user reports / 当审查举报时，系统应提供界面来查看、分类和解决用户举报
3. WHEN taking moderation actions, THE System SHALL allow administrators to suspend users, remove content, and manage violations / 当采取审核行动时，系统应允许管理员暂停用户、删除内容和管理违规行为
4. WHEN administrative actions are performed, THE System SHALL log all actions with timestamps and administrator identification / 当执行管理操作时，系统应记录所有操作及其时间戳和管理员身份
5. WHEN managing the platform, THE System SHALL provide tools for user management, content oversight, and system monitoring / 当管理平台时，系统应提供用户管理、内容监督和系统监控的工具

### Requirement 13: Data Integrity and Security / 需求13：数据完整性和安全

**User Story / 用户故事:** As a system stakeholder, I want robust data integrity and security measures, so that user data is protected and the system operates reliably. / 作为系统利益相关者，我希望有强大的数据完整性和安全措施，以便用户数据得到保护，系统运行可靠。

#### Acceptance Criteria / 验收标准

1. WHEN storing data, THE System SHALL enforce foreign key constraints and referential integrity / 当存储数据时，系统应强制执行外键约束和引用完整性
2. WHEN users are deleted, THE System SHALL handle cascading deletions appropriately to maintain data consistency / 当删除用户时，系统应适当处理级联删除以维护数据一致性
3. WHEN sensitive operations are performed, THE System SHALL implement proper authorization checks / 当执行敏感操作时，系统应实施适当的授权检查
4. WHEN handling user data, THE System SHALL comply with privacy protection requirements / 当处理用户数据时，系统应符合隐私保护要求
5. WHEN the system operates, THE System SHALL maintain audit logs for security and compliance purposes / 当系统运行时，系统应维护审计日志以用于安全和合规目的