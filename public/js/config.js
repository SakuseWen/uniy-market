/**
 * Configuration for Uniy Market Frontend
 * 前端配置文件
 */

// API Configuration
const API_CONFIG = {
    BASE_URL: window.location.origin,
    API_BASE: '/api',
    ENDPOINTS: {
        // Authentication
        AUTH: '/api/auth',
        TEST_AUTH: '/api/test-auth',
        
        // Products
        PRODUCTS: '/api/products',
        PRODUCT_SEARCH: '/api/products/search',
        
        // Chat
        CHATS: '/api/chats',
        MESSAGES: '/api/chats/messages',
        
        // User
        PROFILE: '/api/auth/profile',
        REVIEWS: '/api/reviews',
        REPUTATION: '/api/reputation',
        FAVORITES: '/api/favorites',
        
        // Admin
        ADMIN: '/api/admin',
        REPORTS: '/api/reports',
        
        // Other
        LANGUAGE: '/api/language',
        LOCATION: '/api/location',
        DEALS: '/api/deals'
    }
};

// WebSocket Configuration
const WEBSOCKET_CONFIG = {
    URL: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`,
    RECONNECT_INTERVAL: 3000,
    MAX_RECONNECT_ATTEMPTS: 5
};

// Application Configuration
const APP_CONFIG = {
    // Pagination
    PRODUCTS_PER_PAGE: 12,
    MESSAGES_PER_PAGE: 50,
    
    // File Upload
    MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_IMAGES_PER_PRODUCT: 5,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    
    // UI
    TOAST_DURATION: 3000,
    DEBOUNCE_DELAY: 300,
    
    // Features
    ENABLE_TRANSLATION: true,
    ENABLE_NOTIFICATIONS: true,
    ENABLE_GEOLOCATION: false, // Disabled for privacy
    
    // Development
    DEBUG: window.location.hostname === 'localhost',
    TEST_MODE: window.location.pathname.includes('test')
};

// Language Configuration
const LANGUAGE_CONFIG = {
    DEFAULT_LANGUAGE: 'en',
    SUPPORTED_LANGUAGES: ['en', 'th', 'zh'],
    LANGUAGE_NAMES: {
        'en': 'English',
        'th': 'ไทย',
        'zh': '中文'
    }
};

// Global Application State
const STATE = {
    // User state
    currentUser: null,
    isAuthenticated: false,
    
    // Language state
    currentLanguage: localStorage.getItem('language') || LANGUAGE_CONFIG.DEFAULT_LANGUAGE,
    
    // Products state
    products: [],
    currentProduct: null,
    
    // Chat state
    chats: [],
    currentChat: null,
    unreadCount: 0,
    socket: null,
    showTranslation: false,
    
    // UI state
    currentPage: 'home',
    isLoading: false
};

// Export configurations
window.API_CONFIG = API_CONFIG;
window.WEBSOCKET_CONFIG = WEBSOCKET_CONFIG;
window.APP_CONFIG = APP_CONFIG;
window.LANGUAGE_CONFIG = LANGUAGE_CONFIG;
window.STATE = STATE;

// Utility functions
window.getApiUrl = function(endpoint) {
    return API_CONFIG.BASE_URL + endpoint;
};

window.log = function(...args) {
    if (APP_CONFIG.DEBUG) {
        console.log('[Uniy Market]', ...args);
    }
};

window.logError = function(...args) {
    console.error('[Uniy Market Error]', ...args);
};

// Initialize configuration
document.addEventListener('DOMContentLoaded', function() {
    window.log('Configuration loaded:', {
        API_CONFIG,
        WEBSOCKET_CONFIG,
        APP_CONFIG,
        LANGUAGE_CONFIG
    });
});