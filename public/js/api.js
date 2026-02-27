// API Helper Functions
const API = {
    // Generic request handler
    async request(endpoint, options = {}) {
        const url = window.getApiUrl(endpoint);
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies for authentication
        };

        const config = { ...defaultOptions, ...options };
        
        // Don't set Content-Type for FormData
        if (options.body instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Authentication
    auth: {
        async getUser() {
            return API.request('/api/auth/user');
        },
        
        async logout() {
            return API.request('/api/auth/logout', { method: 'POST' });
        },
        
        loginWithGoogle() {
            window.location.href = window.getApiUrl('/api/auth/google');
        }
    },

    // Products
    products: {
        async getAll(params = {}) {
            const queryString = new URLSearchParams(params).toString();
            return API.request(`/api/products${queryString ? '?' + queryString : ''}`);
        },
        
        async getById(id) {
            return API.request(`/api/products/${id}`);
        },
        
        async create(formData) {
            return API.request('/api/products', {
                method: 'POST',
                body: formData
            });
        },
        
        async update(id, formData) {
            return API.request(`/api/products/${id}`, {
                method: 'PUT',
                body: formData
            });
        },
        
        async delete(id) {
            return API.request(`/api/products/${id}`, {
                method: 'DELETE'
            });
        },
        
        async markAsSold(id) {
            return API.request(`/api/products/${id}/mark-sold`, {
                method: 'POST'
            });
        },
        
        async search(params) {
            const queryString = new URLSearchParams(params).toString();
            return API.request(`/api/products?${queryString}`);
        }
    },

    // Language
    language: {
        async setPreference(language) {
            return API.request('/api/language/preference', {
                method: 'POST',
                body: JSON.stringify({ language })
            });
        },
        
        async translate(text, targetLanguage) {
            return API.request('/api/language/translate', {
                method: 'POST',
                body: JSON.stringify({ text, targetLanguage })
            });
        }
    },

    // Chats
    chats: {
        async getAll() {
            return API.request('/api/chats');
        },
        
        async getById(id) {
            return API.request(`/api/chats/${id}`);
        },
        
        async create(productId, sellerId) {
            return API.request('/api/chats', {
                method: 'POST',
                body: JSON.stringify({ productId, sellerId })
            });
        },
        
        async delete(id) {
            return API.request(`/api/chats/${id}`, {
                method: 'DELETE'
            });
        },
        
        async getMessages(chatId) {
            return API.request(`/api/chats/${chatId}/messages`);
        },
        
        async sendMessage(chatId, content, type = 'text') {
            return API.request(`/api/chats/${chatId}/messages`, {
                method: 'POST',
                body: JSON.stringify({ content, type })
            });
        }
    },

    // Favorites
    favorites: {
        async getAll() {
            return API.request('/api/favorites');
        },
        
        async add(productId) {
            return API.request('/api/favorites', {
                method: 'POST',
                body: JSON.stringify({ productId })
            });
        },
        
        async remove(productId) {
            return API.request(`/api/favorites/${productId}`, {
                method: 'DELETE'
            });
        }
    },

    // Reviews
    reviews: {
        async create(data) {
            return API.request('/api/reviews', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },
        
        async getByUser(userId) {
            return API.request(`/api/reviews/user/${userId}`);
        }
    },

    // Reputation
    reputation: {
        async get(userId) {
            return API.request(`/api/reputation/${userId}`);
        }
    },

    // Deals
    deals: {
        async create(data) {
            return API.request('/api/deals', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },
        
        async getByUser(userId) {
            return API.request(`/api/deals/user/${userId}`);
        },
        
        async complete(dealId) {
            return API.request(`/api/deals/${dealId}/complete`, {
                method: 'PATCH'
            });
        }
    },

    // Reports
    reports: {
        async create(data) {
            return API.request('/api/reports', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }
    },

    // Admin
    admin: {
        async getReports(params = {}) {
            const queryString = new URLSearchParams(params).toString();
            return API.request(`/admin/reports${queryString ? '?' + queryString : ''}`);
        },
        
        async updateReport(reportId, data) {
            return API.request(`/admin/reports/${reportId}`, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });
        },
        
        async getStats() {
            return API.request('/admin/stats');
        },
        
        async getAuditLogs(params = {}) {
            const queryString = new URLSearchParams(params).toString();
            return API.request(`/admin/audit-logs${queryString ? '?' + queryString : ''}`);
        }
    }
};

// Export API for global access
window.API = API;

// Backward compatibility - CONFIG object
window.CONFIG = {
    API_BASE_URL: window.location.origin,
    MAX_IMAGES: window.APP_CONFIG?.MAX_IMAGES_PER_PRODUCT || 5,
    MAX_IMAGE_SIZE: window.APP_CONFIG?.MAX_IMAGE_SIZE || 5 * 1024 * 1024,
    SUPPORTED_IMAGE_TYPES: window.APP_CONFIG?.ALLOWED_IMAGE_TYPES || ['image/jpeg', 'image/png', 'image/webp']
};
