// Chat Module
const Chat = {
    currentChatId: null,
    typingTimeout: null,
    socket: null,

    async init() {
        this.setupEventListeners();
        this.initializeSocket();
    },

    setupEventListeners() {
        // Chat button in nav
        const chatBtn = document.getElementById('chatBtn');
        if (chatBtn) {
            chatBtn.addEventListener('click', () => {
                if (Auth.requireAuth()) {
                    this.loadChats();
                    UI.navigateTo('chat');
                }
            });
        }
    },

    initializeSocket() {
        if (!window.STATE.currentUser) return;

        // Initialize Socket.IO connection
        this.socket = io(window.WEBSOCKET_CONFIG.URL, {
            auth: {
                token: document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1]
            }
        });

        this.socket.on('connect', () => {
            console.log('Socket connected');
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        this.socket.on('new_message', (data) => {
            this.handleNewMessage(data);
        });

        this.socket.on('message_read', (data) => {
            this.handleMessageRead(data);
        });

        this.socket.on('user_typing', (data) => {
            this.handleUserTyping(data);
        });

        this.socket.on('chat_deleted', (data) => {
            this.handleChatDeleted(data);
        });

        window.STATE.socket = this.socket;
    },

    async loadChats() {
        try {
            UI.showLoading();
            const response = await API.chats.getAll();
            window.STATE.chats = response.chats || [];
            this.renderChatList();
        } catch (error) {
            console.error('Failed to load chats:', error);
            UI.showToast('Failed to load chats', 'error');
        } finally {
            UI.hideLoading();
        }
    },

    renderChatList() {
        const chatContent = document.getElementById('chatContent');
        if (!chatContent) return;

        // Calculate unread count
        window.STATE.unreadCount = window.STATE.chats.reduce((count, chat) => {
            return count + (chat.unread_count || 0);
        }, 0);

        // Update badge
        const chatBadge = document.getElementById('chatBadge');
        if (chatBadge) {
            if (window.STATE.unreadCount > 0) {
                chatBadge.textContent = window.STATE.unreadCount;
                chatBadge.style.display = 'block';
            } else {
                chatBadge.style.display = 'none';
            }
        }

        chatContent.innerHTML = `
            <div class="chat-container">
                <div class="chat-sidebar">
                    <div class="chat-header">
                        <h2 data-i18n="chat.messages">Messages</h2>
                        <span class="chat-count">${window.STATE.chats.length} chat${window.STATE.chats.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="chat-list" id="chatList">
                        ${window.STATE.chats.length === 0 ? `
                            <div class="no-chats">
                                <i class="fas fa-comments"></i>
                                <p data-i18n="chat.noMessages">No messages yet</p>
                            </div>
                        ` : window.STATE.chats.map(chat => this.createChatListItem(chat)).join('')}
                    </div>
                </div>
                <div class="chat-main" id="chatMain">
                    <div class="chat-empty">
                        <i class="fas fa-comments"></i>
                        <p>Select a chat to start messaging</p>
                    </div>
                </div>
            </div>
        `;

        // Update translations
        I18n.updateTranslations();
    },

    createChatListItem(chat) {
        const otherUser = chat.buyer_id === window.STATE.currentUser.id ? chat.seller : chat.buyer;
        const lastMessage = chat.last_message || {};
        const unreadClass = chat.unread_count > 0 ? 'unread' : '';
        
        return `
            <div class="chat-item ${unreadClass}" onclick="Chat.openChat(${chat.id})">
                <img src="${otherUser?.profile_picture || '/public/images/default-avatar.png'}" 
                     alt="${UI.escapeHtml(otherUser?.name || 'User')}" 
                     class="chat-avatar">
                <div class="chat-item-content">
                    <div class="chat-item-header">
                        <h4>${UI.escapeHtml(otherUser?.name || 'User')}</h4>
                        <span class="chat-time">${lastMessage.created_at ? UI.formatRelativeTime(lastMessage.created_at) : ''}</span>
                    </div>
                    <div class="chat-item-message">
                        <p>${lastMessage.content ? UI.truncate(UI.escapeHtml(lastMessage.content), 50) : 'No messages yet'}</p>
                        ${chat.unread_count > 0 ? `<span class="unread-badge">${chat.unread_count}</span>` : ''}
                    </div>
                    ${chat.product ? `
                        <div class="chat-product">
                            <i class="fas fa-box"></i>
                            <span>${UI.escapeHtml(chat.product.title)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    async openChat(chatId) {
        try {
            this.currentChatId = chatId;
            
            // Join chat room via socket
            if (this.socket) {
                this.socket.emit('join_chat', { chatId });
            }

            // Load chat messages
            const response = await API.chats.getMessages(chatId);
            const chat = window.STATE.chats.find(c => c.id === chatId);
            
            if (!chat) {
                UI.showToast('Chat not found', 'error');
                return;
            }

            this.renderChatWindow(chat, response.messages || []);
            
            // Mark messages as read
            this.markChatAsRead(chatId);
        } catch (error) {
            console.error('Failed to open chat:', error);
            UI.showToast('Failed to load chat', 'error');
        }
    },

    renderChatWindow(chat, messages) {
        const chatMain = document.getElementById('chatMain');
        if (!chatMain) return;

        const otherUser = chat.buyer_id === window.STATE.currentUser.id ? chat.seller : chat.buyer;

        chatMain.innerHTML = `
            <div class="chat-window">
                <div class="chat-window-header">
                    <div class="chat-user-info">
                        <img src="${otherUser?.profile_picture || '/public/images/default-avatar.png'}" 
                             alt="${UI.escapeHtml(otherUser?.name || 'User')}" 
                             class="chat-avatar">
                        <div>
                            <h3>${UI.escapeHtml(otherUser?.name || 'User')}</h3>
                            ${chat.product ? `
                                <p class="chat-product-title">
                                    <i class="fas fa-box"></i>
                                    ${UI.escapeHtml(chat.product.title)}
                                </p>
                            ` : ''}
                        </div>
                    </div>
                    <div class="chat-actions">
                        <button class="btn btn-icon" onclick="Chat.toggleTranslation()" title="Toggle Translation">
                            <i class="fas fa-language"></i>
                        </button>
                        <button class="btn btn-icon" onclick="Chat.deleteChat(${chat.id})" title="Delete Chat">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="chat-messages" id="chatMessages">
                    ${messages.length === 0 ? `
                        <div class="no-messages">
                            <i class="fas fa-comments"></i>
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    ` : messages.map(msg => this.createMessageBubble(msg)).join('')}
                </div>
                
                <div class="typing-indicator" id="typingIndicator" style="display: none;">
                    <span>${UI.escapeHtml(otherUser?.name || 'User')} is typing</span>
                    <div class="typing-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
                
                <div class="chat-input-container">
                    <button class="btn btn-icon" onclick="Chat.attachImage()" title="Attach Image">
                        <i class="fas fa-image"></i>
                    </button>
                    <input type="file" id="chatImageInput" accept="image/*" style="display: none;" onchange="Chat.handleImageAttach(event)">
                    <input type="text" 
                           id="chatMessageInput" 
                           placeholder="Type a message..." 
                           class="chat-input"
                           onkeypress="Chat.handleKeyPress(event)"
                           oninput="Chat.handleTyping()">
                    <button class="btn btn-primary" onclick="Chat.sendMessage()">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;

        // Scroll to bottom
        this.scrollToBottom();
    },

    createMessageBubble(message) {
        const isMine = message.sender_id === window.STATE.currentUser.id;
        const messageClass = isMine ? 'message-mine' : 'message-theirs';
        const showTranslation = window.STATE.showTranslation && message.translated_text;

        return `
            <div class="message-bubble ${messageClass}">
                ${message.type === 'image' ? `
                    <img src="${message.content}" alt="Image" class="message-image" onclick="UI.showModal('<img src=\\'${message.content}\\' style=\\'max-width: 100%\\'>')">
                ` : `
                    <div class="message-text">${UI.escapeHtml(message.content)}</div>
                    ${showTranslation ? `
                        <div class="message-translation">
                            <i class="fas fa-language"></i>
                            ${UI.escapeHtml(message.translated_text)}
                        </div>
                    ` : ''}
                `}
                <div class="message-meta">
                    <span class="message-time">${UI.formatRelativeTime(message.created_at)}</span>
                    ${isMine && message.is_read ? '<i class="fas fa-check-double"></i>' : ''}
                </div>
            </div>
        `;
    },

    async sendMessage() {
        const input = document.getElementById('chatMessageInput');
        if (!input || !input.value.trim()) return;

        const content = input.value.trim();
        input.value = '';

        try {
            // Send via API
            await API.chats.sendMessage(this.currentChatId, content, 'text');

            // Emit via socket for real-time delivery
            if (this.socket) {
                this.socket.emit('send_message', {
                    chatId: this.currentChatId,
                    content,
                    type: 'text'
                });
            }

            // Reload messages
            await this.reloadCurrentChat();
        } catch (error) {
            console.error('Failed to send message:', error);
            UI.showToast('Failed to send message', 'error');
        }
    },

    handleKeyPress(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    },

    handleTyping() {
        if (!this.socket || !this.currentChatId) return;

        // Clear previous timeout
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        // Emit typing event
        this.socket.emit('typing', { chatId: this.currentChatId });

        // Stop typing after 2 seconds
        this.typingTimeout = setTimeout(() => {
            this.socket.emit('stop_typing', { chatId: this.currentChatId });
        }, 2000);
    },

    attachImage() {
        const input = document.getElementById('chatImageInput');
        if (input) input.click();
    },

    async handleImageAttach(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!window.APP_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
            UI.showToast('Invalid image type', 'error');
            return;
        }

        if (file.size > window.APP_CONFIG.MAX_IMAGE_SIZE) {
            UI.showToast('Image size too large (max 5MB)', 'error');
            return;
        }

        try {
            // Convert to base64
            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64 = e.target.result;
                
                // Send image message
                await API.chats.sendMessage(this.currentChatId, base64, 'image');

                // Emit via socket
                if (this.socket) {
                    this.socket.emit('send_message', {
                        chatId: this.currentChatId,
                        content: base64,
                        type: 'image'
                    });
                }

                // Reload messages
                await this.reloadCurrentChat();
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Failed to send image:', error);
            UI.showToast('Failed to send image', 'error');
        }
    },

    toggleTranslation() {
        window.STATE.showTranslation = !window.STATE.showTranslation;
        this.reloadCurrentChat();
    },

    async reloadCurrentChat() {
        if (!this.currentChatId) return;

        try {
            const response = await API.chats.getMessages(this.currentChatId);
            const chat = window.STATE.chats.find(c => c.id === this.currentChatId);
            
            if (chat) {
                this.renderChatWindow(chat, response.messages || []);
            }
        } catch (error) {
            console.error('Failed to reload chat:', error);
        }
    },

    async deleteChat(chatId) {
        if (!confirm('Are you sure you want to delete this chat?')) return;

        try {
            await API.chats.delete(chatId);
            UI.showToast('Chat deleted successfully', 'success');
            
            // Remove from state
            window.STATE.chats = window.STATE.chats.filter(c => c.id !== chatId);
            
            // Reload chat list
            this.renderChatList();
        } catch (error) {
            console.error('Failed to delete chat:', error);
            UI.showToast('Failed to delete chat', 'error');
        }
    },

    async markChatAsRead(chatId) {
        const chat = window.STATE.chats.find(c => c.id === chatId);
        if (chat) {
            chat.unread_count = 0;
            
            // Update badge
            const chatBadge = document.getElementById('chatBadge');
            window.STATE.unreadCount = window.STATE.chats.reduce((count, c) => count + (c.unread_count || 0), 0);
            
            if (chatBadge) {
                if (window.STATE.unreadCount > 0) {
                    chatBadge.textContent = window.STATE.unreadCount;
                    chatBadge.style.display = 'block';
                } else {
                    chatBadge.style.display = 'none';
                }
            }
        }
    },

    scrollToBottom() {
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 100);
        }
    },

    // Socket event handlers
    handleNewMessage(data) {
        if (data.chatId === this.currentChatId) {
            // Reload current chat
            this.reloadCurrentChat();
        } else {
            // Update chat list
            this.loadChats();
            
            // Show notification
            UI.showToast('New message received', 'info');
        }
    },

    handleMessageRead(data) {
        if (data.chatId === this.currentChatId) {
            this.reloadCurrentChat();
        }
    },

    handleUserTyping(data) {
        if (data.chatId === this.currentChatId) {
            const indicator = document.getElementById('typingIndicator');
            if (indicator) {
                indicator.style.display = 'flex';
                
                // Hide after 3 seconds
                setTimeout(() => {
                    indicator.style.display = 'none';
                }, 3000);
            }
        }
    },

    handleChatDeleted(data) {
        if (data.chatId === this.currentChatId) {
            UI.showToast('Chat was deleted', 'warning');
            this.currentChatId = null;
        }
        
        // Reload chat list
        this.loadChats();
    }
};

// Initialize showTranslation state
if (window.STATE) {
    window.STATE.showTranslation = false;
}
