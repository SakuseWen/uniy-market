/**
 * Authentication Module for Uniy Market
 * 认证模块
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authToken = null;
        this.isAuthenticated = false;
        
        // Initialize from localStorage
        this.loadFromStorage();
        
        // Bind methods
        this.login = this.login.bind(this);
        this.logout = this.logout.bind(this);
        this.checkAuth = this.checkAuth.bind(this);
    }

    // Load authentication state from localStorage
    loadFromStorage() {
        try {
            const userData = localStorage.getItem('currentUser');
            const token = localStorage.getItem('authToken');
            
            if (userData && token) {
                this.currentUser = JSON.parse(userData);
                this.authToken = token;
                this.isAuthenticated = true;
                
                // Update global STATE
                if (window.STATE) {
                    window.STATE.currentUser = this.currentUser;
                    window.STATE.isAuthenticated = true;
                }
                
                window.log('Loaded user from storage:', this.currentUser);
            }
        } catch (error) {
            window.logError('Error loading auth from storage:', error);
            this.clearStorage();
        }
    }

    // Save authentication state to localStorage
    saveToStorage() {
        try {
            if (this.currentUser && this.authToken) {
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                localStorage.setItem('authToken', this.authToken);
            }
        } catch (error) {
            window.logError('Error saving auth to storage:', error);
        }
    }

    // Clear authentication state
    clearStorage() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        this.currentUser = null;
        this.authToken = null;
        this.isAuthenticated = false;
        
        // Clear global STATE
        if (window.STATE) {
            window.STATE.currentUser = null;
            window.STATE.isAuthenticated = false;
        }
    }

    // Check if user is authenticated
    async checkAuth() {
        if (!this.authToken) {
            return false;
        }

        try {
            const response = await fetch(window.getApiUrl('/api/test-auth/me'), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.currentUser = data.user;
                    this.isAuthenticated = true;
                    this.saveToStorage();
                    
                    // Update global STATE
                    if (window.STATE) {
                        window.STATE.currentUser = data.user;
                        window.STATE.isAuthenticated = true;
                    }
                    
                    return true;
                }
            }
            
            // Token is invalid
            this.clearStorage();
            return false;
        } catch (error) {
            window.logError('Auth check failed:', error);
            this.clearStorage();
            return false;
        }
    }

    // Login with test user
    async loginWithTestUser(userId) {
        try {
            const response = await fetch(window.getApiUrl('/api/test-auth/test-login'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ userId })
            });

            const data = await response.json();

            if (data.success) {
                this.currentUser = data.user;
                this.authToken = data.token;
                this.isAuthenticated = true;
                this.saveToStorage();
                
                // Update global STATE
                if (window.STATE) {
                    window.STATE.currentUser = data.user;
                    window.STATE.isAuthenticated = true;
                }
                
                window.log('Login successful:', this.currentUser);
                return { success: true, user: this.currentUser };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            window.logError('Login failed:', error);
            return { success: false, message: 'Login failed. Please try again.' };
        }
    }

    // Google OAuth login (placeholder for future implementation)
    async login() {
        // For now, redirect to test login page
        window.location.href = '/public/test-login.html';
    }

    // Logout
    async logout() {
        try {
            // Call logout endpoint
            await fetch(window.getApiUrl('/api/test-auth/test-logout'), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
        } catch (error) {
            window.logError('Logout request failed:', error);
        }

        // Clear local state regardless of API call result
        this.clearStorage();
        
        // Redirect to home page
        window.location.href = '/public/index.html';
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user has specific role
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }

    // Check if user is admin
    isAdmin() {
        return this.hasRole('admin');
    }

    // Get authorization header
    getAuthHeader() {
        return this.authToken ? `Bearer ${this.authToken}` : null;
    }

    // Get user avatar URL
    getUserAvatar() {
        return this.currentUser?.avatar || 'https://via.placeholder.com/150/6c757d/ffffff?text=User';
    }

    // Get user display name
    getUserDisplayName() {
        return this.currentUser?.name || 'Guest';
    }

    // Update user info
    updateUser(userData) {
        if (this.currentUser) {
            this.currentUser = { ...this.currentUser, ...userData };
            this.saveToStorage();
        }
    }
}

// Create global auth manager instance
window.authManager = new AuthManager();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}

// Backward compatibility - Auth object
window.Auth = {
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
    
    getCurrentUser() {
        return window.authManager.getCurrentUser();
    },
    
    isAuthenticated() {
        return window.authManager.isAuthenticated;
    },
    
    isAdmin() {
        return window.authManager.isAdmin();
    }
};
