# 需求文档：聊天功能增强（Chat Enhancement）

## 简介

本文档描述为 Uniy Market 大学二手市场平台新增的一系列聊天功能增强需求。
现有平台已具备基础的聊天路由（`chat.ts`）、数据模型（`ChatModel.ts`、`MessageModel.ts`）、通知服务（`NotificationService.ts`）及翻译服务（`TranslationService.ts`），但前端 `ChatPage.tsx` 仍使用静态 mock 数据，`MyPage.tsx` 的聊天历史仅有示例条目，`Header.tsx` 的铃铛图标尚未接入动态数据。

本次增强目标：
- 将前端聊天页面接入真实 WebSocket 实时通信
- 实现基于 `[BuyerID + SellerID + ProductID]` 的唯一房间 ID 机制
- 完善全局通知徽章与消息预览
- 优化聊天 UI（移除无用控件、激活图片上传）
- 实现对话管理（隐藏/永久删除）
- 集成 Gemini API 消息翻译
- 修复 MyPage 聊天历史 Tab 的导航状态保持问题

---

## 词汇表

- **ChatSystem**：前后端聊天功能的整体系统
- **ChatPage**：前端聊天对话页面组件（`ChatPage.tsx`）
- **MyPage**：前端个人中心页面组件（`MyPage.tsx`），包含聊天历史 Tab
- **Header**：全局顶部导航栏组件（`Header.tsx`）
- **ProductPage**：前端商品详情页面组件（`ProductDetailPage.tsx`），包含"联系卖家"按钮
- **ProductCard**：前端商品卡片组件（`ProductCard.tsx`），在列表页展示商品缩略信息及操作入口
- **ChatModel**：后端聊天数据模型（`ChatModel.ts`）
- **MessageModel**：后端消息数据模型（`MessageModel.ts`）
- **NotificationService**：后端通知服务（`NotificationService.ts`）
- **TranslationService**：后端翻译服务（`TranslationService.ts`），使用 Google Cloud Translation API
- **WebSocketService**：后端 WebSocket 服务，负责实时消息推送
- **RoomID**：由 `[BuyerID + SellerID + ProductID]` 组合生成的唯一聊天房间标识符，对应数据库中的 `chatID`
- **Buyer**：发起购买咨询的用户（买家）
- **Seller**：发布商品的用户（卖家）
- **SelfChatGuard**：防止卖家对自己发布的商品发起聊天的双重防线机制（前端 UI 层 + 后端 API 层）
- **UnreadBadge**：Header 铃铛图标上显示的未读消息数量徽章
- **ConversationList**：MyPage 聊天历史 Tab 中展示的对话列表
- **GoogleCloudTranslationAPI**：Google Cloud Translation API（`@google-cloud/translate` v2），用于消息翻译
- **HideAction**：对话管理中的"隐藏/关闭"操作，仅从列表 UI 移除，保留数据库记录
- **HardDeleteAction**：对话管理中的"永久删除"操作，从数据库彻底清除所有消息记录
- **GOOGLE_TRANSLATE_API_KEY**：存储于 `.env` 环境变量文件中的 Google Cloud Translation API 密钥，通过 `process.env['GOOGLE_TRANSLATE_API_KEY']` 读取，不得硬编码在源代码中

---

## 需求列表

### 需求 1：聊天 UI 工具栏精简

**用户故事：** 作为用户，我希望聊天输入区域只保留有用的功能按钮，以便界面更简洁、操作更直观。

#### 验收标准

1. THE ChatPage SHALL 在底部输入工具栏中移除"回形针（Paperclip）"附件图标及其关联的点击事件。
2. THE ChatPage SHALL 在底部输入工具栏中保留"图片（Image）"图标。
3. WHEN 用户点击"图片（Image）"图标时，THE ChatPage SHALL 触发本地文件选择器（`<input type="file" accept="image/*">`），允许用户选择图片文件。
4. THE ChatPage SHALL 在顶部 Header 区域移除"三点菜单（MoreVertical）"图标及其所有关联的下拉菜单内容（包含 viewProfile、viewListings、blockUser、report 等选项）。
5. WHILE 顶部 Header 区域不含三点菜单时，THE ChatPage SHALL 保持该区域布局整洁，不留空白占位元素。
6. THE ChatPage SHALL 严格保持现有的颜色方案、CSS 类名和整体视觉框架不变。

---

### 需求 2：唯一 RoomID 生成与聊天房间访问控制（含禁止自开启聊天）

**用户故事：** 作为买家，我希望针对每个商品与卖家建立独立的聊天房间，以便不同商品的对话互不干扰；作为卖家，我希望能进入买家发起的聊天房间进行回复，同时系统应通过前后端双重防线，防止卖家对自己发布的商品发起聊天（Anti-Self-Chat Logic）。

#### 验收标准

1. WHEN Buyer 点击商品详情页的"联系卖家"按钮时，THE ChatSystem SHALL 以 `[BuyerID + SellerID + ProductID]` 为组合键，通过后端 `POST /api/chats` 接口创建或获取唯一的 RoomID（即 `chatID`）。
2. THE ChatSystem SHALL 确保同一 Buyer 与同一 Seller 针对不同 ProductID 生成不同的 RoomID，针对相同 ProductID 复用已有的 RoomID。
3. WHEN Seller 访问其商品对应的聊天房间时，THE ChatSystem SHALL 验证该 Seller 是该 RoomID 对应商品的所有者，并允许其进入房间。
4. **【前端防线 — ProductPage】** IF 当前登录用户是商品的 Seller（即 `currentUser.id === product.seller.id`），THEN THE ProductPage SHALL 隐藏"联系卖家"按钮，并在原位置渲染"编辑商品"按钮，作为 SelfChatGuard 的第一道防线。
5. **【前端防线 — ProductCard】** IF 当前登录用户是商品的 Seller（即 `currentUser.id === product.seller.id`），THEN THE ProductCard SHALL 隐藏"联系卖家"入口（如有），不向 Seller 展示任何可主动发起聊天的操作按钮。
6. **【后端防线 — API 校验】** WHEN `POST /api/chats` 接口收到请求时，IF 请求中的 `buyerID` 等于 `sellerID`，THEN THE ChatSystem SHALL 拒绝创建对话，返回 HTTP 403 Forbidden 及错误信息 `"Cannot create a chat with yourself"`，禁止在数据库中写入 `buyerID === sellerID` 的无效对话记录，作为 SelfChatGuard 的第二道防线。
7. THE ChatPage SHALL 使用从后端获取的真实 `chatID` 作为 WebSocket 房间标识符，替换现有的静态 `example-seller` 路由参数。
8. IF 后端返回 403 错误（自开启聊天被拒绝），THEN THE ChatPage SHALL 向用户展示相应的错误提示，不执行页面跳转。
9. WHEN Seller 通过 URL 直接输入其商品对应的 RoomID 访问聊天页面时，THE ChatSystem SHALL 查询数据库，验证该 RoomID 下是否存在由 Buyer 发起的消息记录。
10. IF 该 RoomID 在数据库中存在且包含至少一条 Buyer 发送的消息，THEN THE ChatSystem SHALL 允许 Seller 进入该聊天房间并进行回复。
11. IF 该 RoomID 在数据库中不存在，或存在但不包含任何 Buyer 消息（即 Seller 试图自行创建对话），THEN THE ChatSystem SHALL 拒绝访问，向用户展示"未授权（Unauthorized）"提示，并将页面重定向至 Seller 的个人中心页面（MyPage）。
12. **【Bug Fix — MainPage Contact Seller】** WHEN 用户在主页（All Products 页面）点击商品卡片上的"Contact Seller"按钮时，THE MainPage SHALL 调用 `chatService.createOrGetChat(listingID, sellerID)` 获取 `chatID`，并直接 `navigate('/chat/${chatID}')`，禁止跳转至 Chat History 列表页。
13. **【Bug Fix — MainPage Contact Seller】** THE `ProductCard` 组件的 `onContact` prop SHALL 同时接收 `product.id`（listingID）和 `product.seller.id`（sellerID）两个参数，而非仅传入 `sellerId`，以便正确调用 `createOrGetChat`。
14. WHILE 主页"Contact Seller"按钮正在获取 chatID 时，THE MainPage SHALL 显示按钮加载状态（loading），防止用户重复点击。
15. IF 主页"Contact Seller"获取 chatID 失败，THEN THE MainPage SHALL 通过 toast 向用户展示错误提示。

---

### 需求 3：实时双向消息通信

**用户故事：** 作为用户，我希望发送的消息能立即出现在对方的界面上，无需刷新页面，以便实现流畅的实时对话体验。

#### 验收标准

1. WHEN ChatPage 组件挂载时，THE ChatPage SHALL 通过 Socket.io 客户端连接到后端 WebSocket 服务，并加入以 `chatID` 命名的房间。
2. WHEN 用户发送消息时，THE ChatPage SHALL 通过 `POST /api/chats/:chatId/messages` 接口将消息持久化到数据库，并同时通过 WebSocket 广播给房间内的其他参与者。
3. WHEN WebSocketService 收到来自对方的新消息事件（`new_message`）时，THE ChatPage SHALL 在不刷新页面的情况下，将新消息实时追加到消息列表末尾。
4. WHEN ChatPage 组件卸载时，THE ChatPage SHALL 断开 WebSocket 连接，离开对应的聊天房间，防止内存泄漏。
5. WHEN ChatPage 初始化时，THE ChatPage SHALL 通过 `GET /api/chats/:chatId/messages` 接口加载历史消息记录。
6. IF WebSocket 连接失败，THEN THE ChatPage SHALL 向用户展示连接失败的提示，并提供重试机制。
7. **【Bug Fix】** THE `useChatSocket` hook 中的 `onNewMessage` 回调 SHALL 通过 `useRef` 持有最新回调引用，确保每次收到 `new_message` 事件时不因闭包捕获初始空数组而丢失已有消息。
8. **【Bug Fix】** THE ChatPage 中的 `handleNewMessage` 函数 SHALL 使用函数式更新形式（`setMessages(prev => [...prev, msg])`），避免闭包陷阱导致消息追加失败。
9. WHEN 两个用户处于同一聊天房间时，WHILE 用户 A 发送消息后，THE ChatPage SHALL 在用户 B 的界面上无需刷新即可显示该消息。

---

### 需求 4：全局通知徽章与消息预览

**用户故事：** 作为用户，我希望在任意页面都能看到未读消息数量，并能快速预览最新消息内容，以便及时响应对话。

#### 验收标准

1. THE Header SHALL 通过调用后端 `GET /api/chats/unread/count` 接口，获取当前登录用户的未读消息总数，并将其显示在铃铛图标的 UnreadBadge 上。
2. WHEN 未读消息数量大于 0 时，THE Header SHALL 在铃铛图标右上角（CSS 绝对定位）显示红色数字徽章（UnreadBadge），数字内容为实际未读数量。
3. WHEN 未读消息数量为 0 时，THE Header SHALL 隐藏 UnreadBadge，不显示"0"。
4. **【计数规则】** THE UnreadBadge 数字 SHALL 按"独立对话框"数量计数，而非消息总条数。示例：商品 A 有 1 人咨询（1 条未读），商品 B 有 2 人咨询（各 1 条未读），铃铛数字应显示为 3（3 个独立对话有未读消息）。
5. WHEN 用户将鼠标悬停在铃铛图标上时，THE Header SHALL 展示一个弹出预览面板，其中列出**所有有未读消息的对话**缩略图（最多显示 5 条），每条包含对方头像、姓名、最新消息预览文本及时间戳。
6. **【点击即消失】** WHEN 用户点击预览面板中的某条对话时，THE Header SHALL 依次执行：① 导航至该对话对应的 ChatPage；② 前端立即从铃铛预览列表中物理移除该条缩略图；③ 铃铛总数立即减 1；④ 后端异步调用 `PUT /api/chats/:chatId/read` 标记已读，确保刷新页面后该消息不再出现。
7. WHEN 用户进入某个 ChatPage 时，THE ChatPage SHALL 自动调用 `PUT /api/chats/:chatId/read` 将该房间的消息标记为已读，并通知 Header 更新 UnreadBadge 数量。
8. WHERE 用户已登录，THE Header SHALL 以不超过 30 秒的轮询间隔或通过 WebSocket 推送事件，定期刷新 UnreadBadge 的数量。
9. **【Bug Fix — 铃铛通知清除】** WHEN 用户点击铃铛 Popover 中某条对话时，THE Header SHALL 调用 `chatService.markAsRead(chatId)`，并将该对话的 `unreadCount` 从全局 `unreadCount` 中立即减去（最小值为 0）。
10. **【Bug Fix — 铃铛通知清除】** WHEN 用户点击铃铛 Popover 中某条对话后，THE Header SHALL 立即将该对话从 `previewChats` 列表中移除，使其从预览面板 UI 中消失；若其他对话仍有未读消息，则继续显示。
11. WHEN 用户直接进入 ChatPage 时，THE ChatPage SHALL 通过 Context 或事件机制通知 Header 刷新 `previewChats` 列表和 `unreadCount`，确保铃铛面板内容与已读状态同步。
12. THE Header SHALL 在标记已读后立即过滤 `previewChats` 状态，移除已读对话，不等待下一次轮询刷新。
13. **【UI 细化 — 徽章位置】** THE Header SHALL 确保铃铛图标的父容器设置 `position: relative`（Tailwind: `relative`），红色 UnreadBadge 使用 `position: absolute`（Tailwind: `absolute`）定位，通过 `-top-1 -right-1` 精确放置在铃铛图标右上角叠加处，不得使用 flex/grid 布局导致徽章偏移至底部或中央。
14. **【UI 细化 — 徽章样式】** THE UnreadBadge SHALL 渲染为圆形药丸状徽章：红色背景（`bg-red-500`）、白色文字（`text-white`）、完全圆角（`rounded-full`）、固定最小尺寸（单个数字时呈圆形，多位数时自动拉宽），不得显示为纯红色文字或无背景样式。
15. **【UI 细化 — 预览消息文本】** THE Header SHALL 在 Popover 预览面板的每条对话条目中，除对方用户名和商品标题外，还必须显示该对话最新消息内容（`lastMessageText`）的预览文本；若预览文本超出容器宽度，THE Header SHALL 使用 `truncate`（`text-overflow: ellipsis`）样式截断并以"..."结尾。
16. **【UI 细化 — 点击移除】** WHEN 用户点击 Popover 中某条对话摘要时，THE Header SHALL 立即从下拉列表中物理移除该条目（不等待 API 响应），同时减少铃铛徽章计数，然后跳转到对应 ChatPage。

---

### 需求 5：MyPage 聊天历史 Tab 导航状态保持

**用户故事：** 作为用户，我希望从聊天历史进入某个对话后，点击"返回"时仍停留在聊天历史 Tab，而不是跳转到默认的"我的商品"Tab，以便保持操作连贯性。

#### 验收标准

1. THE MyPage SHALL 将当前激活的 Tab 值（`chat-history` 或 `my-products`）存储在 URL 查询参数（如 `?tab=chat-history`）或 React 状态中，确保导航返回后可恢复。
2. WHEN 用户从 MyPage 的聊天历史 Tab 点击某条对话进入 ChatPage 时，THE ChatPage SHALL 在导航时携带来源 Tab 信息（如通过 `state` 或 URL 参数传递 `from=chat-history`）。
3. WHEN 用户在 ChatPage 点击"返回"按钮时，THE ChatPage SHALL 导航回 MyPage 并激活聊天历史 Tab（`?tab=chat-history`），而非默认 Tab。
4. THE MyPage SHALL 在组件初始化时读取 URL 查询参数或导航 state，将 Tabs 组件的默认激活值设置为对应的 Tab。
5. IF URL 中不含 Tab 参数，THEN THE MyPage SHALL 默认激活"我的商品（my-products）"Tab，保持现有行为不变。

---

### 需求 6：对话管理（隐藏 / 永久删除）

**用户故事：** 作为用户，我希望能灵活管理聊天历史列表，可以选择隐藏对话（保留记录）或永久删除对话（清除所有数据），以便维护整洁的对话列表。

#### 验收标准

1. WHEN 用户点击 ConversationList 中某条对话的"删除"图标时，THE MyPage SHALL 展示一个包含三个选项的操作菜单弹窗（Modal）：**隐藏/关闭（Hide）**、**永久删除（Permanent Delete）**、**取消（Cancel）**。
2. WHEN 用户在弹窗中选择"隐藏/关闭（Hide）"时，THE ChatSystem SHALL 调用后端 `DELETE /api/chats/:chatId`（软删除，将 `status` 设为 `'closed'`），将该对话从 ConversationList 的 UI 中移除，但保留数据库中的消息记录。
3. WHEN 被隐藏的对话收到新消息时，THE ChatSystem SHALL 将该对话重新显示在 ConversationList 中（后端 `ChatModel.createChat` 已支持重新激活 `closed` 状态的聊天）。
4. WHEN 用户在弹窗中选择"永久删除（Permanent Delete）"时，THE ChatSystem SHALL 调用后端 `DELETE /api/chats/:chatId/hard`（硬删除），从数据库中彻底清除该对话的所有消息记录及聊天记录。
5. WHEN 用户在弹窗中选择"取消（Cancel）"时，THE MyPage SHALL 关闭弹窗，不执行任何操作，对话列表保持不变。
6. THE MyPage SHALL 在执行永久删除前，展示二次确认提示，告知用户此操作不可撤销。
7. IF 删除操作失败（网络错误或权限不足），THEN THE MyPage SHALL 向用户展示错误提示，并保持对话列表不变。

---

### 需求 7：翻译服务（Google Cloud Translation API v2 REST）

**用户故事：** 作为用户，我希望能将聊天消息翻译为当前界面语言（中文/英文/泰文），以便跨语言沟通更顺畅；同时希望 API Key 以安全方式管理，不暴露在源代码中；翻译按钮 UI 应简洁不拥挤。

#### 验收标准

1. THE TranslationService SHALL 从环境变量 `process.env['GOOGLE_TRANSLATE_API_KEY']` 读取 Google Cloud Translation API Key，不得将 API Key 硬编码在任何源代码文件中。
2. THE ChatSystem SHALL 在项目根目录的 `.env` 文件中以 `GOOGLE_TRANSLATE_API_KEY=<your_key>` 格式存储 API Key，并确保 `.env` 文件已被添加至 `.gitignore`，不提交至版本控制系统。
3. IF 启动时 `process.env['GOOGLE_TRANSLATE_API_KEY']` 为空或未定义，THEN THE TranslationService SHALL 记录错误日志并拒绝处理翻译请求，向调用方返回配置缺失的错误信息。
4. **【REST API 规范】** THE TranslationService SHALL 使用原生 `fetch` 直接调用 Google Cloud Translation API v2 REST 端点 `https://translation.googleapis.com/language/translate/v2`，不依赖 `@google-cloud/translate` SDK，以避免 SDK 版本兼容性问题。
5. **【REST API 规范】** THE TranslationService SHALL 使用 HTTP POST 方法调用翻译端点，请求体包含：`q`（待翻译文本）、`target`（目标语言代码）、`format: 'text'`（避免响应中包含 HTML 实体），API Key 通过 URL 查询参数 `?key=` 传递。
6. **【REST API 规范】** THE TranslationService SHALL 解析标准 Google v2 JSON 响应结构：`data.translations[0].translatedText`，提取翻译结果。
7. **【错误处理】** IF Google Translation API 返回 HTTP 403 或 400 错误，THEN THE TranslationService SHALL 记录具体的错误消息（通常表示计费未启用或 API Key 限制问题），并向调用方抛出包含状态码的错误。
8. WHEN 调用翻译时，THE TranslationService SHALL 直接传入目标语言代码：`zh` → `'zh-CN'`，`en` → `'en'`，`th` → `'th'`。
9. THE TranslationService SHALL 保留现有的 `cache`、`getCacheKey`、`getFromCache`、`saveToCache` 缓存机制及 `translateBatch`、`detectLanguage` 接口签名，不改变对外接口。
10. WHEN 用户将鼠标悬停（hover）在 PC 端消息气泡上时，THE ChatPage SHALL 在消息气泡旁显示一个轻量级"翻译"按钮（样式：`border border-gray-200 rounded px-2 py-0.5 text-xs`），提供"翻译/Translate/แปล"操作入口（根据当前 UI 语言动态显示对应文字）。
11. WHEN 用户在移动端对消息气泡执行长按（long-press，持续时间 ≥ 500ms）或点击操作时，THE ChatPage SHALL 显示包含"翻译/Translate/แปล"选项的操作菜单。
12. WHEN 用户触发翻译操作时，THE ChatPage SHALL 调用后端 `POST /api/chats/:chatId/messages/:messageId/translate` 接口，目标语言为当前 UI 语言（`language` 上下文中的值）。
13. WHEN 翻译结果返回时，THE ChatPage SHALL 将翻译文本显示在原始消息文本的正下方，使用 `text-xs text-gray-400 italic` 样式加以区分，不替换原始文本。
14. IF 翻译请求失败（API 错误或网络超时），THEN THE ChatPage SHALL 向用户展示翻译失败的提示，原始消息内容保持不变。
15. THE TranslationService SHALL 保留现有的内存缓存机制，对相同文本和目标语言的翻译结果进行缓存，避免重复调用 Google Cloud Translation API。
16. WHEN 图片类型消息被悬停或长按时，THE ChatPage SHALL 不显示翻译操作入口，仅对文本消息（`messageType === 'text'`）提供翻译功能。
17. **【UI 优化】** THE ChatPage SHALL 在原消息文本框与"翻译"按钮之间增加垂直间距（`mt-2`），避免翻译按钮紧贴消息文字造成视觉拥挤。

---

### 需求 8：图片消息发送

**用户故事：** 作为用户，我希望能在聊天中发送图片，以便更直观地展示商品细节或交流信息。

#### 验收标准

1. WHEN 用户通过图片图标选择本地图片文件后，THE ChatPage SHALL 将图片以 `multipart/form-data` 格式通过 `POST /api/chats/:chatId/messages` 接口（`messageType: 'image'`）上传至后端。
2. WHEN 图片上传成功后，THE ChatPage SHALL 在消息列表中以缩略图形式展示该图片消息。
3. IF 选择的文件不是图片格式（非 jpeg/jpg/png/gif/webp），THEN THE ChatPage SHALL 向用户展示文件格式不支持的提示，不执行上传。
4. IF 选择的图片文件大小超过 5MB，THEN THE ChatPage SHALL 向用户展示文件过大的提示，不执行上传。
5. WHILE 图片正在上传时，THE ChatPage SHALL 在消息列表中显示上传进度指示器（loading 状态），防止用户重复提交。
6. THE ChatPage SHALL 以限制最大宽度（max-width）和 `object-fit: contain` 样式渲染图片消息，防止超大图片撑破消息气泡布局。
7. WHEN 用户点击图片消息时，THE ChatPage SHALL 以全屏预览模式（Lightbox/Dialog）展示原图，允许用户查看完整图片内容。

---

### 需求 9：MyPage 聊天历史列表接入真实数据

**用户故事：** 作为用户，我希望在"我的页面"的聊天历史 Tab 中看到真实的对话列表，而不是静态示例数据，以便管理所有进行中的对话。

#### 验收标准

1. WHEN MyPage 的聊天历史 Tab 被激活时，THE MyPage SHALL 调用后端 `GET /api/chats` 接口，获取当前登录用户的真实对话列表。
2. THE MyPage SHALL 在 ConversationList 中为每条对话展示：对方用户头像、对方用户名、关联商品名称、最新消息预览（截断至 50 字符）、最后消息时间戳，以及未读消息数量徽章（`unreadCount > 0` 时显示）。
3. WHEN 对话列表为空时，THE MyPage SHALL 展示空状态提示文案，替代现有的静态示例条目。
4. IF 获取对话列表失败，THEN THE MyPage SHALL 向用户展示加载失败的提示，并提供重试按钮。
5. **【UI 细化 — 消息预览】** THE MyPage SHALL 在 ConversationList 的每条对话行中显示该对话的最新消息内容预览（`lastMessageText`），不能仅显示用户名和商品名称；消息预览文本 SHALL 使用 `truncate`（`text-overflow: ellipsis`）样式，在截断前尽可能显示容器宽度允许的最多文本。
6. **【UI 细化 — 布局层级】** THE MyPage SHALL 在每条对话条目中按以下信息层级排列：① 对方用户名 + 时间戳（同行）；② 商品名称（小字，蓝色）；③ 最新消息预览（灰色，`truncate`）；消息摘要为必填展示项，不可省略。
7. **【UI 细化 — 未读徽章样式】** THE MyPage SHALL 将 ConversationList 中的红色未读数字徽章渲染为"药丸状"（pill shape），CSS 要求增加水平内边距（`px-2`）或设置最小宽度（`min-w-[1.5rem]`），使徽章更宽、更清晰易读。
8. **【数据来源】** THE ChatSystem SHALL 确保后端 `GET /api/chats` 接口返回的 `ChatSummary` 对象包含 `lastMessageText` 字段（最新一条消息的文本内容）；IF 该字段当前缺失，THEN THE ChatModel.getChatsByUser() 查询 SHALL 通过子查询补充该字段，获取每个对话最新一条消息的 `messageText`。
9. **【前端类型同步】** THE `ChatSummary` 前端接口（`chatService.ts`）SHALL 包含可选字段 `lastMessageText?: string`，与后端返回数据保持同步。

---

### 需求 10：卖家准入逻辑（Seller Access Path）

**用户故事：** 作为平台运营方，我希望卖家进入聊天的唯一合法路径是"我的页面 → 聊天记录"，以便防止卖家主动骚扰用户，保障平台交流秩序；作为买家，我希望只有我主动发起咨询后，卖家才能回复我，而不会被卖家主动联系。

#### 验收标准

1. THE ChatSystem SHALL 规定卖家进入聊天房间的唯一合法路径为：MyPage → 聊天历史 Tab（ConversationList）→ 点击已有对话条目进入 ChatPage。
2. THE ProductPage SHALL 对已登录的 Seller 不展示任何可主动发起聊天的入口（包括"联系卖家"按钮及任何等效的聊天触发控件），确保 Seller 在商品详情页无法主动联系 Buyer。
3. THE ProductCard SHALL 对已登录的 Seller 不展示任何可主动发起聊天的入口，确保 Seller 在商品列表页同样无法主动联系 Buyer。
4. WHEN Seller 通过直接输入 URL（如 `/chat/:chatId`）访问某个聊天房间时，THE ChatSystem SHALL 在后端验证该 chatID 对应的对话中是否存在至少一条由 Buyer 发送的消息记录。
5. IF 该对话中存在至少一条 Buyer 发送的消息，THEN THE ChatSystem SHALL 允许 Seller 访问该聊天房间，以便 Seller 进行回复。
6. IF 该对话中不存在任何 Buyer 发送的消息（即对话为空或仅含系统消息），THEN THE ChatSystem SHALL 拒绝 Seller 的访问请求，返回 HTTP 403 Forbidden，并将前端页面重定向至 Seller 的 MyPage，同时展示提示文案"请等待买家发起咨询后再进入对话"。
7. WHILE Seller 处于 ConversationList 页面时，THE MyPage SHALL 仅展示包含至少一条 Buyer 消息的对话条目，不向 Seller 展示空对话或仅由系统创建的对话记录。
8. THE ChatSystem SHALL 确保上述卖家准入校验逻辑在后端执行，不依赖前端路由守卫作为唯一防线，防止通过直接调用 API 绕过限制。
