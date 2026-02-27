// Main Application
const App = {
    async init() {
        console.log('🚀 [App] Initializing Uniy Market...');
        
        try {
            // Check authentication status
            console.log('🔍 [App] Checking authentication...');
            await window.authManager.checkAuth();
            console.log('✅ [App] Authentication checked');
            
            // Update UI based on auth status
            console.log('🔍 [App] Updating auth UI...');
            this.updateAuthUI();
            console.log('✅ [App] Auth UI updated');
            
            // Initialize internationalization
            if (window.I18n) {
                console.log('🔍 [App] Initializing I18n...');
                window.I18n.init();
                console.log('✅ [App] I18n initialized');
            }
            
            // Initialize products
            if (window.Products) {
                console.log('🔍 [App] Initializing Products module...');
                await window.Products.init();
                console.log('✅ [App] Products module initialized');
            } else {
                console.error('❌ [App] Products module not found!');
            }
            
            // Initialize chat
            if (window.Chat) {
                await window.Chat.init();
            }
            
            // Initialize profile
            if (window.Profile) {
                await window.Profile.init();
            }
            
            // Initialize admin
            if (window.Admin) {
                await window.Admin.init();
            }
            
            // Setup navigation
            this.setupNavigation();
            
            console.log('Uniy Market initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            if (window.UI) {
                window.UI.showToast('Failed to initialize application', 'error');
            }
        }
    },

    updateAuthUI() {
        const loginBtn = document.getElementById('loginBtn');
        const userMenu = document.getElementById('userMenu');
        const postProductBtn = document.getElementById('postProductBtn');
        const chatBtn = document.getElementById('chatBtn');
        const favoritesBtn = document.getElementById('favoritesBtn');
        const adminLink = document.getElementById('adminLink');
        const userAvatarImg = document.getElementById('userAvatarImg');

        if (window.authManager.isAuthenticated) {
            const user = window.authManager.getCurrentUser();
            
            // Hide login button, show user menu
            if (loginBtn) loginBtn.style.display = 'none';
            if (userMenu) userMenu.style.display = 'block';
            if (postProductBtn) postProductBtn.style.display = 'inline-flex';
            if (chatBtn) chatBtn.style.display = 'inline-flex';
            if (favoritesBtn) favoritesBtn.style.display = 'inline-flex';
            
            // Update user avatar
            if (userAvatarImg) {
                userAvatarImg.src = window.authManager.getUserAvatar();
                userAvatarImg.alt = window.authManager.getUserDisplayName();
            }
            
            // Show admin link for admin users
            if (adminLink && window.authManager.isAdmin()) {
                adminLink.style.display = 'block';
            }
            
            window.log('User authenticated:', user);
        } else {
            // Show login button, hide user menu
            if (loginBtn) loginBtn.style.display = 'inline-flex';
            if (userMenu) userMenu.style.display = 'none';
            if (postProductBtn) postProductBtn.style.display = 'none';
            if (chatBtn) chatBtn.style.display = 'none';
            if (favoritesBtn) favoritesBtn.style.display = 'none';
            if (adminLink) adminLink.style.display = 'none';
        }
    },

    setupNavigation() {
        // Login button
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                window.authManager.login();
            });
        }

        // Logout link
        const logoutLink = document.getElementById('logoutLink');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.authManager.logout();
            });
        }

        // Profile link
        const profileLink = document.getElementById('profileLink');
        if (profileLink) {
            profileLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.requireAuth()) {
                    if (window.Profile) {
                        window.Profile.loadProfile(window.authManager.getCurrentUser().id);
                    }
                    this.navigateTo('profile');
                }
            });
        }

        // My Products link
        const myProductsLink = document.getElementById('myProductsLink');
        if (myProductsLink) {
            myProductsLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.requireAuth()) {
                    // Filter products by current user
                    if (window.Products) {
                        window.Products.filterByUser(window.authManager.getCurrentUser().id);
                    }
                    this.navigateTo('home');
                }
            });
        }

        // Transactions link
        const transactionsLink = document.getElementById('transactionsLink');
        if (transactionsLink) {
            transactionsLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.requireAuth()) {
                    if (window.Profile) {
                        window.Profile.loadProfile(window.authManager.getCurrentUser().id);
                    }
                    this.navigateTo('profile');
                }
            });
        }

        // Admin link
        const adminLink = document.getElementById('adminLink');
        if (adminLink) {
            adminLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.requireAuth() && window.authManager.isAdmin()) {
                    if (window.Admin) {
                        window.Admin.loadDashboard();
                    }
                    this.navigateTo('admin');
                }
            });
        }

        // Chat button
        const chatBtn = document.getElementById('chatBtn');
        if (chatBtn) {
            chatBtn.addEventListener('click', () => {
                if (this.requireAuth()) {
                    this.navigateTo('chat');
                }
            });
        }

        // Favorites button
        const favoritesBtn = document.getElementById('favoritesBtn');
        if (favoritesBtn) {
            favoritesBtn.addEventListener('click', async () => {
                if (this.requireAuth()) {
                    try {
                        if (window.API && window.API.favorites) {
                            const response = await window.API.favorites.getAll();
                            if (window.Products) {
                                window.Products.showFavorites(response.favorites);
                            }
                        }
                        this.navigateTo('home');
                    } catch (error) {
                        console.error('Failed to load favorites:', error);
                        if (window.UI) {
                            window.UI.showToast('Failed to load favorites', 'error');
                        }
                    }
                }
            });
        }

        // Post Product button
        const postProductBtn = document.getElementById('postProductBtn');
        if (postProductBtn) {
            postProductBtn.addEventListener('click', () => {
                if (this.requireAuth()) {
                    this.navigateTo('postProduct');
                }
            });
        }

        // Search functionality
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchInput');
        
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', () => {
                this.performSearch();
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
        }

        // Language switcher
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                if (window.I18n) {
                    window.I18n.setLanguage(e.target.value);
                }
            });
        }
    },

    requireAuth() {
        if (!window.authManager.isAuthenticated) {
            if (window.UI) {
                window.UI.showToast('Please login to continue', 'warning');
            }
            window.authManager.login();
            return false;
        }
        return true;
    },

    navigateTo(page) {
        // Hide all pages
        const pages = document.querySelectorAll('.page');
        pages.forEach(p => p.classList.remove('active'));
        
        // Show target page
        const targetPage = document.getElementById(page + 'Page');
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        window.log('Navigated to:', page);
    },

    performSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput && window.Products) {
            const query = searchInput.value.trim();
            if (query) {
                window.Products.search(query);
                this.navigateTo('home');
            }
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Handle authentication callback
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'success') {
        if (window.UI) {
            window.UI.showToast('Login successful!', 'success');
        }
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        // Reload user data
        window.authManager.checkAuth().then(() => {
            App.updateAuthUI();
        });
    } else if (urlParams.get('auth') === 'error') {
        if (window.UI) {
            window.UI.showToast('Login failed. Please try again.', 'error');
        }
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

// Export App for global access
window.App = App;
