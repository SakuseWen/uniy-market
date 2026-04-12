# 实现计划：聊天功能增强（Chat Enhancement）

## 概述

基于已有的后端路由（`chat.ts`）、数据模型（`ChatModel`、`MessageModel`）、`WebSocketService` 和 `TranslationService`，本计划将前端聊天页面接入真实数据，补全缺失的后端端点，并完成全部 UI 重构。

任务按依赖顺序排列：环境配置 → 后端补全 → 前端服务层 → UI 组件重构 → 属性测试。

---

## 任务列表

- [x] 1. 环境变量与基础配置
  - [x] 1.1 后端 `.env` 新增 `GEMINI_API_KEY`
    - 在 `uniy-market/.env` 中追加 `GEMINI_API_KEY=your-gemini-api-key`
    - 确认 `.env` 已在 `.gitignore` 中（已有，无需修改）
    - _需求：7.1, 7.2_

  - [ ] 1.1b 后端 `.env` 新增 `GOOGLE_TRANSLATE_API_KEY`（替换 Gemini）
    - 在 `uniy-market/.env` 中追加 `GOOGLE_TRANSLATE_API_KEY=your-google-translate-api-key`
    - 移除或注释掉 `GEMINI_API_KEY` 条目
    - 同步更新 `uniy-market/.env.example`，添加 `GOOGLE_TRANSLATE_API_KEY=` 占位条目
    - _需求：7.1, 7.2_

  - [x] 1.2 前端 `.env` 新增 `VITE_SOCKET_URL`
    - 在 `Product Retrieval Main Page/.env`（若不存在则创建）中追加 `VITE_SOCKET_URL=http://localhost:3000`
    - _需求：3.1_

  - [x] 1.3 更新根目录 `.env.example`
    - 在 `uniy-market/.env.example` 中追加 `GEMINI_API_KEY=` 和 `VITE_SOCKET_URL=` 占位条目
    - _需求：7.2_

- [x] 2. 后端补全
  - [x] 2.1 将 `TranslationService.ts` 替换为 Gemini API 实现
    - 移除 `@google-cloud/translate` 依赖，改用原生 `fetch`
    - 从 `process.env['GEMINI_API_KEY']` 读取密钥；若未配置则记录错误并抛出异常
    - 实现语言代码映射：`zh`/`zh-CN` → `"Simplified Chinese"`，`en` → `"English"`，`th` → `"Thai"`
    - Prompt 格式：`"Translate the following message into [Language]. Return only the translated text without any explanation:\n\n[Text]"`
    - 保留现有 `cache`、`getCacheKey`、`getFromCache`、`saveToCache` 逻辑及 `translateBatch`、`detectLanguage` 接口签名（`detectLanguage` 可降级为基于 Prompt 的实现）
    - _需求：7.1, 7.3, 7.4, 7.5, 7.6, 7.12_
    - _依赖：1.1_

  - [ ] 2.1b 将 `TranslationService.ts` 切换回 Google Cloud Translation API（替换 Gemini）
    - 恢复使用 `@google-cloud/translate` 包的 `v2.Translate` 客户端
    - 从 `process.env['GOOGLE_TRANSLATE_API_KEY']` 读取密钥；若未配置则记录错误并抛出异常
    - 移除 Gemini API 相关代码（`GEMINI_API_URL`、`LANG_NAMES` 映射、Prompt 构造逻辑）
    - 保留现有 `cache`、`getCacheKey`、`getFromCache`、`saveToCache` 缓存机制及 `translateBatch`、`detectLanguage` 接口签名不变
    - _需求：7.1, 7.3, 7.4, 7.5, 7.6, 7.12_
    - _依赖：1.1b_

  - [ ]* 2.2 为 `TranslationService` 编写属性测试
    - **Property 7：翻译缓存命中（Translation Cache Hit）**
    - **Validates: 需求 7.12**
    - **Property 8：Gemini Prompt 格式化（Gemini Prompt Formatting）**
    - **Validates: 需求 7.5, 7.6**
    - _依赖：2.1_

  - [x] 2.3 `MessageModel` 新增 `hasBuyerMessage()` 方法
    - 在 `uniy-market/src/models/MessageModel.ts` 末尾添加：
      ```typescript
      async hasBuyerMessage(chatID: string, buyerID: string): Promise<boolean>
      ```
    - SQL：`SELECT 1 FROM Message WHERE chatID = ? AND senderID = ? LIMIT 1`
    - _需求：2.9, 10.4_

  - [x] 2.4 `chat.ts` 新增 `DELETE /api/chats/:chatId/hard` 端点
    - 在现有 `DELETE /:chatId` 路由之后插入新路由
    - 校验参与者身份（`isUserInChat`），非参与者返回 403
    - 调用已有的 `chatModel.hardDeleteChat(chatId)`
    - 通过 WebSocket 通知对方（`chat_deleted` 事件）
    - _需求：6.4_
    - _依赖：无（`hardDeleteChat` 已在 `ChatModel` 中实现）_

  - [x] 2.5 `chat.ts` 的 `GET /api/chats/:chatId` 增强卖家直访校验
    - 在 `isUserInChat` 校验通过后，判断当前用户是否为 `sellerID`
    - 若是卖家，调用 `messageModel.hasBuyerMessage(chatId, chat.buyerID)`
    - 若无 Buyer 消息，返回 HTTP 403 及消息 `"请等待买家发起咨询后再进入对话"`
    - _需求：2.9, 2.10, 2.11, 10.4, 10.5, 10.6_
    - _依赖：2.3_

  - [x] 2.6 `chat.ts` 的 `POST /api/chats` 自聊天防护改为返回 403
    - 当前实现返回 400，需改为 HTTP 403 并将错误消息改为 `"Cannot create a chat with yourself"`
    - _需求：2.6_

  - [ ]* 2.7 为后端端点编写属性测试
    - **Property 1：聊天房间幂等性（Chat Room Idempotency）**
    - **Validates: 需求 2.1, 2.2**
    - **Property 2：自聊天防护（Self-Chat Guard）**
    - **Validates: 需求 2.6**
    - **Property 3：卖家访问控制（Seller Access Control）**
    - **Validates: 需求 2.9, 2.10, 2.11, 10.4, 10.5, 10.6**
    - **Property 6：软删除不丢失数据（Soft Delete Preserves Data）**
    - **Validates: 需求 6.2, 6.4**
    - _依赖：2.4, 2.5, 2.6_

- [ ] 3. 检查点 — 后端补全验证
  - 确保所有后端测试通过，验证新端点可正常响应，询问用户是否有疑问。

- [x] 4. 前端基础服务层
  - [x] 4.1 新增 `chatService.ts`（封装所有聊天 API）
    - 路径：`Product Retrieval Main Page/src/services/chatService.ts`
    - 导出 `ChatSummary`、`MessageDetail` 接口
    - 实现 `chatService` 对象，包含：`createOrGetChat`、`getChatById`、`getChats`、`getMessages`、`sendTextMessage`、`sendImageMessage`、`markAsRead`、`getUnreadCount`、`hideChat`、`hardDeleteChat`、`translateMessage`
    - 所有方法通过已有的 `apiClient` 调用，统一错误处理
    - _需求：3.2, 3.5, 4.1, 6.2, 6.4, 7.9_

  - [x] 4.2 新增 `useChatSocket.ts` hook（封装 Socket.IO 连接）
    - 路径：`Product Retrieval Main Page/src/hooks/useChatSocket.ts`
    - 从 `import.meta.env.VITE_SOCKET_URL` 读取服务器地址
    - 从 `sessionStorage.getItem('authToken')` 获取 JWT
    - 组件挂载时连接并 `emit('join_chat', { chatId })`
    - 监听 `new_message` 事件，调用 `onNewMessage` 回调
    - 组件卸载时 `emit('leave_chat', { chatId })` 并 `disconnect()`
    - 暴露 `emitTyping(isTyping: boolean)` 方法
    - 连接失败时通过回调通知调用方
    - _需求：3.1, 3.3, 3.4, 3.6_
    - _依赖：1.2_

  - [x] 4.3 前端路由变更：`/chat/:sellerId` → `/chat/:chatId`
    - 修改 `Product Retrieval Main Page/src/routes.ts`，将路径改为 `/chat/:chatId`
    - _需求：2.7_
    - _依赖：4.1_

- [x] 5. SelfChatGuard（前端双组件）
  - [x] 5.1 `ProductPage.tsx` / `ProductDetailPage.tsx`：Seller 身份时隐藏联系卖家、显示编辑商品
    - 在 `ProductPage.tsx` 中获取 `user` 并判断 `isSeller = user?.userID === product?.seller?.id`
    - 将 `isSeller` 传递给 `ProductDetailPage` 组件（或在 `ProductDetailPage` 内部直接判断）
    - 当 `isSeller === true` 时：隐藏"联系卖家"按钮，在原位置渲染"编辑商品"按钮（导航至 `/edit-product/:productId`）
    - 当 `isSeller === false` 时：联系卖家按钮调用 `chatService.createOrGetChat(listingID, sellerID)` 获取 `chatID`，再 `navigate('/chat/:chatID')`
    - _需求：2.1, 2.4, 10.2_
    - _依赖：4.1, 4.3_

  - [x] 5.2 `ProductCard.tsx`：Seller 身份时隐藏联系卖家入口
    - 新增 `currentUserId?: string` prop
    - 当 `currentUserId === product.seller.id` 时，不渲染联系卖家按钮
    - 在调用 `ProductCard` 的父组件中传入 `currentUserId={user?.userID}`
    - _需求：2.5, 10.3_

- [x] 6. `ChatPage.tsx` 重构
  - [x] 6.1 移除 `Paperclip` 图标和 `MoreVertical` 三点菜单
    - 删除 `Paperclip` 按钮及其 import
    - 删除 `MoreVertical` 按钮及其 `DropdownMenu`（含 viewProfile、viewListings、blockUser、report 选项）
    - 保留语言切换下拉菜单和 Phone/Video 按钮（或按设计保留布局）
    - _需求：1.1, 1.4, 1.5, 1.6_

  - [x] 6.2 接入真实 `chatId` 和历史消息加载
    - 将 `useParams` 中的 `sellerId` 改为 `chatId`
    - 移除所有 mock 数据（`mockProducts`、静态 `messages` 初始值）
    - 组件挂载时并行调用 `chatService.getMessages(chatId)`、`chatService.getChatById(chatId)`、`chatService.markAsRead(chatId)`
    - 加载中显示 loading 状态；加载失败显示错误提示
    - _需求：3.5, 4.6, 2.7_
    - _依赖：4.1, 4.3_

  - [x] 6.3 接入 WebSocket 实时消息
    - 使用 `useChatSocket(chatId, onNewMessage)` hook
    - `onNewMessage` 回调将新消息追加到 `messages` 列表末尾
    - WebSocket 连接失败时展示重连提示和重试按钮
    - _需求：3.1, 3.3, 3.4, 3.6_
    - _依赖：4.2, 6.2_

  - [x] 6.4 激活图片上传（含格式/大小校验）
    - 图片按钮绑定隐藏的 `<input type="file" accept="image/*" ref={imageInputRef}>`
    - 选择文件后校验：MIME 类型须在 `{jpeg, jpg, png, gif, webp}` 内，大小 ≤ 5MB
    - 格式不符时 toast 提示 `"仅支持 jpeg/jpg/png/gif/webp 格式"`；超大时提示 `"图片不能超过 5MB"`
    - 校验通过后调用 `chatService.sendImageMessage(chatId, file)`，上传中显示 loading 状态
    - _需求：8.1, 8.3, 8.4, 8.5_
    - _依赖：6.2_

  - [ ]* 6.5 为图片上传校验编写属性测试
    - **Property 9：图片上传验证（Image Upload Validation）**
    - **Validates: 需求 8.3, 8.4**
    - _依赖：6.4_

  - [x] 6.6 图片消息渲染（max-width + object-contain + 全屏预览 Dialog）
    - 当 `msg.messageType === 'image'` 时，渲染 `<img>` 而非文本
    - 样式：`max-w-[240px] max-h-[240px] rounded-lg object-contain cursor-pointer`
    - 点击图片时设置 `previewImage` 状态，打开全屏 `Dialog`
    - Dialog 内图片样式：`w-full h-full object-contain max-h-[90vh]`，背景 `bg-black/90`
    - _需求：8.2, 8.6, 8.7_
    - _依赖：6.2_

  - [x] 6.7 翻译功能（PC hover 显示图标，移动端长按显示菜单）
    - 仅对 `messageType === 'text'` 的消息气泡启用翻译入口
    - PC 端：消息气泡 `onMouseEnter`/`onMouseLeave` 控制翻译图标显示
    - 移动端：消息气泡 `onTouchStart`（≥500ms）触发操作菜单，含"翻译"选项
    - 触发翻译时调用 `chatService.translateMessage(chatId, messageId, language)`
    - 翻译结果显示在原始消息正下方，使用较小字号和灰色样式
    - 翻译失败时 toast 提示 `"翻译失败，请稍后重试"`
    - _需求：7.7, 7.8, 7.9, 7.10, 7.11, 7.13_
    - _依赖：6.2, 4.1_

  - [x] 6.8 返回按钮导航至 MyPage 聊天历史 Tab
    - 将顶部返回按钮的 `onClick` 改为 `navigate('/my-page?tab=chat-history')`
    - _需求：5.3_
    - _依赖：4.3_

  - [ ]* 6.9 为消息发送完整性编写属性测试
    - **Property 4：消息发送完整性（Message Send Integrity）**
    - **Validates: 需求 3.2, 3.5**
    - _依赖：6.2_

- [ ] 7. 检查点 — ChatPage 重构验证
  - 确保所有 ChatPage 相关测试通过，验证消息收发、图片上传、翻译功能正常，询问用户是否有疑问。

- [x] 8. `MyPage.tsx` 重构
  - [x] 8.1 Tab 状态通过 URL 查询参数持久化
    - 引入 `useSearchParams`，将 `activeTab` 绑定到 `?tab=` 参数
    - `handleTabChange` 调用 `setSearchParams({ tab: value })`
    - 组件初始化时读取 `searchParams.get('tab') || 'my-products'` 作为默认值
    - _需求：5.1, 5.4, 5.5_

  - [ ]* 8.2 为 Tab 状态持久化编写属性测试
    - **Property 10：Tab 状态持久化（Tab State Persistence）**
    - **Validates: 需求 5.1, 5.4**
    - _依赖：8.1_

  - [x] 8.3 聊天历史 Tab 接入真实数据（`chatService.getChats()`）
    - 移除静态 `showChat` 状态和 `example-seller` mock 条目
    - Tab 激活时调用 `chatService.getChats()` 获取真实对话列表
    - 每条对话展示：对方头像、对方用户名、关联商品名、最新消息预览（截断至 50 字符）、时间戳、未读数徽章
    - 列表为空时展示空状态提示；加载失败时展示错误提示和重试按钮
    - 点击对话条目导航至 `/chat/:chatID`
    - _需求：9.1, 9.2, 9.3, 9.4_
    - _依赖：4.1, 8.1_

  - [x] 8.4 删除操作改为三选项弹窗（隐藏/永久删除/取消）
    - 点击删除图标时打开 Modal，展示三个选项：**隐藏/关闭**、**永久删除**、**取消**
    - 选择"隐藏"：调用 `chatService.hideChat(chatId)`（软删除），从列表移除该条目
    - 选择"永久删除"：先展示二次确认提示（"此操作不可撤销"），确认后调用 `chatService.hardDeleteChat(chatId)`
    - 选择"取消"：关闭弹窗，列表不变
    - 操作失败时 toast 错误提示，列表保持不变
    - _需求：6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
    - _依赖：4.1, 8.3_

- [x] 9. `Header.tsx` 通知徽章
  - [x] 9.1 动态 `unreadCount`（30 秒轮询 + WebSocket 事件）
    - 用户已登录时，调用 `chatService.getUnreadCount()` 初始化 `unreadCount`
    - 设置 30 秒 `setInterval` 定期刷新；组件卸载时清除定时器
    - 监听 WebSocket `notification` 事件（`type === 'new_message'`）时递增 `unreadCount`
    - `unreadCount > 0` 时显示红色数字徽章；为 0 时隐藏
    - _需求：4.1, 4.2, 4.3, 4.7_
    - _依赖：4.1_

  - [ ]* 9.2 为未读徽章一致性编写属性测试
    - **Property 5：未读徽章一致性（Unread Badge Consistency）**
    - **Validates: 需求 4.1, 4.2, 4.3, 4.6**
    - _依赖：9.1_

  - [x] 9.3 hover Popover 展示真实对话预览（最多 5 条）
    - 铃铛图标 `onMouseEnter` 时调用 `chatService.getChats(1, 5)` 获取最近 5 条对话
    - Popover 内每条展示：对方头像、姓名、最新消息预览、时间戳
    - _需求：4.4_
    - _依赖：4.1, 9.1_

  - [x] 9.4 点击预览导航至对应 ChatPage 并标记已读
    - 点击 Popover 中某条对话时，调用 `chatService.markAsRead(chatId)` 并 `navigate('/chat/:chatId')`
    - `unreadCount` 立即递减对应数量
    - _需求：4.5_
    - _依赖：9.3_

  - [ ] 9.5 铃铛徽章定位优化（UI 细化）
    - 将铃铛容器徽章的定位 CSS 从 `-top-1 -right-1` 改为 `absolute -top-2 -right-2`
    - 确保红色徽章视觉上叠加在铃铛图标右上角正上方，而非紧贴图标边缘
    - _需求：4.13_
    - _依赖：9.1_

  - [ ] 9.6 Popover 预览条目新增 `lastMessageText` 显示（UI 细化）
    - 在 Popover 每条对话条目中，在商品标题下方新增一行显示 `chat.lastMessageText`
    - 样式：`text-xs text-gray-500 truncate`，超出容器宽度时以"..."截断
    - 若 `lastMessageText` 为空则显示空字符串（不报错）
    - _需求：4.14_
    - _依赖：9.3, 15.1_

  - [ ] 9.7 Popover 点击对话立即物理移除（UI 细化）
    - 修改 `handleChatClick`：先同步执行 `setPreviewChats` 移除 + `setUnreadCount` 递减 + `navigate`，再异步调用 `chatService.markAsRead`（不阻断导航）
    - 确保点击后该条目立即从 Popover 列表消失，不等待 API 响应
    - _需求：4.15_
    - _依赖：9.4_

- [x] 10. 最终检查点 — 全功能验证

---

## Bug Fix 任务（新增）

- [ ] 11. WebSocket 实时消息接收修复（闭包陷阱）
  - [ ] 11.1 修复 `useChatSocket.ts` 中的 `onNewMessage` 闭包问题
    - 在 `useChatSocket` hook 中新增 `onNewMessageRef = useRef(onNewMessage)`
    - 在 `useEffect` 中同步更新 ref：`useEffect(() => { onNewMessageRef.current = onNewMessage; }, [onNewMessage])`
    - 将 `socket.on('new_message', onNewMessage)` 改为 `socket.on('new_message', (msg) => onNewMessageRef.current(msg))`
    - 确保 `useEffect` 依赖数组仅包含 `[chatId]`，不包含 `onNewMessage`（避免重复连接）
    - _需求：3.7, 3.8_
    - _依赖：4.2_

  - [ ] 11.2 修复 `ChatPage.tsx` 中的 `handleNewMessage` 函数式更新
    - 将内联回调 `(msg) => setMessages(prev => [...prev, msg])` 提取为 `useCallback` 包裹的 `handleNewMessage`
    - 确保 `setMessages` 使用函数式更新形式：`setMessages(prev => [...prev, msg])`
    - 将 `handleNewMessage` 传入 `useChatSocket(chatId!, handleNewMessage)`
    - _需求：3.8, 3.9_
    - _依赖：11.1_

- [ ] 12. 主页 "Contact Seller" 跳转逻辑修复
  - [ ] 12.1 修复 `MainPage.tsx` 中的 `handleContact` 函数
    - 移除直接跳转到 Chat History 的逻辑
    - 改为调用 `chatService.createOrGetChat(listingID, sellerID)` 获取 `chatID`
    - 获取成功后执行 `navigate(\`/chat/${chatID}\`)`
    - 新增 `contactingId` 状态管理按钮 loading，防止重复点击
    - 失败时通过 toast 展示错误提示
    - _需求：2.12, 2.14, 2.15_
    - _依赖：4.1_

  - [ ] 12.2 更新 `ProductCard.tsx` 的 `onContact` prop 签名
    - 将 `onContact?: (sellerId: string) => void` 改为 `onContact?: (listingID: string, sellerID: string) => void`
    - 更新按钮 `onClick` 调用：`onContact?.(product.id, product.seller.id)`
    - 新增 `isContactLoading?: boolean` prop，用于显示按钮 loading 状态
    - _需求：2.13_
    - _依赖：12.1_

- [ ] 13. 铃铛通知清除逻辑优化
  - [ ] 13.1 修复 `Header.tsx` 中点击 Popover 对话后的状态更新
    - 点击 Popover 中某条对话时，调用 `chatService.markAsRead(chatId)`
    - 立即执行 `setPreviewChats(prev => prev.filter(c => c.chatID !== chat.chatID))` 从列表移除
    - 立即执行 `setUnreadCount(prev => Math.max(0, prev - chat.unreadCount))` 更新徽章数
    - _需求：4.8, 4.9, 4.11_
    - _依赖：9.3, 9.4_

  - [ ] 13.2 实现 ChatPage 进入时通知 Header 刷新的机制
    - 新建 `ChatNotificationContext.tsx`（或在现有 Context 中扩展），提供 `refreshUnread()` 方法
    - 在 `Header.tsx` 中实现 `refreshUnread`：重新调用 `chatService.getUnreadCount()` 和 `chatService.getChats(1, 5)` 刷新状态
    - 在 `ChatPage.tsx` 的 `useEffect` 中调用 `refreshUnread()`，在进入聊天页时触发 Header 刷新
    - _需求：4.10_
    - _依赖：13.1_

- [ ] 14. 翻译服务切换回 Google Cloud Translation API + UI 优化
  - [ ] 14.1 后端：将 `TranslationService.ts` 切换回 Google Cloud Translation API
    - 恢复 `@google-cloud/translate` 包的 `v2.Translate` 客户端（确认包已安装，否则执行 `npm install @google-cloud/translate`）
    - 从 `process.env['GOOGLE_TRANSLATE_API_KEY']` 读取密钥
    - 移除 Gemini API 相关代码（fetch 调用、Prompt 构造、`LANG_NAMES` 映射）
    - 保留现有缓存机制（`cache`、`getCacheKey`、`getFromCache`、`saveToCache`）和接口签名（`translateBatch`、`detectLanguage`）不变
    - _需求：7.1, 7.3, 7.4, 7.6, 7.12_
    - _依赖：1.1b_

  - [ ] 14.2 后端：更新 `.env` 配置
    - 在 `uniy-market/.env` 中添加 `GOOGLE_TRANSLATE_API_KEY=your-api-key`
    - 移除或注释 `GEMINI_API_KEY` 条目
    - 同步更新 `uniy-market/.env.example`
    - _需求：7.2_

  - [ ] 14.3 前端：优化 `ChatPage.tsx` 翻译按钮 UI
    - 将翻译入口改为轻量级按钮组件，样式：`border border-gray-200 rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-50`
    - 在原消息文本框与翻译按钮之间增加 `mt-2` 垂直间距
    - 翻译结果保持 `text-xs text-gray-400 italic` 样式，显示在原文正下方
    - _需求：7.7, 7.14, 7.15_
    - _依赖：6.7_

---

## 新增 UI/UX 细化任务

- [ ] 15. 消息预览数据补全（后端 + 前端类型同步）
  - [ ] 15.1 后端：`ChatModel.getChatsByUser()` 补充 `lastMessageText` 子查询
    - 在 `uniy-market/src/models/ChatModel.ts` 的 `getChatsByUser` 方法 SQL 中，新增相关子查询字段：
      ```sql
      (SELECT m.messageText FROM Message m WHERE m.chatID = c.chatID ORDER BY m.timestamp DESC LIMIT 1) AS lastMessageText
      ```
    - 确保返回的 `ChatSummary` 对象包含 `lastMessageText` 字段（可为 `null`）
    - _需求：9.8_

  - [ ] 15.2 前端：`ChatSummary` 接口新增 `lastMessageText` 字段
    - 在 `Product Retrieval Main Page/src/services/chatService.ts` 的 `ChatSummary` 接口中添加：
      ```typescript
      lastMessageText?: string; // 最新消息预览文本 / Latest message preview text
      ```
    - _需求：9.9_
    - _依赖：15.1_

- [ ] 16. MyPage 聊天历史列表 UI 细化
  - [ ] 16.1 消息预览行：将 `preview` 变量改为读取 `chat.lastMessageText`
    - 在 `MyPage.tsx` 的对话列表渲染中，将 `const preview = (chat.productTitle || '').slice(0, 50)` 改为 `const preview = chat.lastMessageText ?? ''`
    - 确保消息预览行使用 `truncate` 样式（`text-sm text-gray-500 truncate`），不做硬截断
    - _需求：9.5_
    - _依赖：15.2_

  - [ ] 16.2 对话条目布局调整为三层信息层级
    - 确认每条对话条目的渲染顺序为：① 对方用户名 + 时间戳（同行）；② 商品名称（`text-xs text-blue-500 truncate`）；③ 最新消息预览（`text-sm text-gray-500 truncate`）
    - 若当前布局已符合，仅需验证；若不符合，调整 JSX 结构
    - _需求：9.6_
    - _依赖：16.1_

  - [ ] 16.3 未读数徽章改为药丸状样式
    - 将 `MyPage.tsx` 中对话列表的未读数 `Badge` 组件 CSS 从 `px-1.5 py-0.5` 改为 `px-2 min-w-[1.5rem] h-5 flex items-center justify-center rounded-full`
    - 确保徽章在数字为个位数时也呈现足够宽的药丸形状
    - _需求：9.7_

## 备注

- 标有 `*` 的子任务为可选测试任务，可在 MVP 阶段跳过
- 每个任务均标注了对应的需求编号，便于追溯
- 属性测试使用 **fast-check** 库，每个属性最少运行 100 次迭代
- 每个属性测试注释格式：`// Feature: chat-enhancement, Property {N}: {property_text}`
- 后端测试文件建议放在 `uniy-market/src/__tests__/` 目录下
- 前端测试文件建议放在 `Product Retrieval Main Page/src/__tests__/` 目录下
