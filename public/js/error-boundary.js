/**
 * Frontend Error Boundary
 * Handles errors in the frontend application
 */

class ErrorBoundary {
    constructor() {
        this.setupGlobalErrorHandlers();
        this.setupNetworkErrorHandlers();
    }

    /**
     * Setup global error handlers
     */
    setupGlobalErrorHandlers() {
        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            console.error('Uncaught error:', event.error);
            
            // Don't show error dialog in development mode, just log it
            if (window.APP_CONFIG && window.APP_CONFIG.DEBUG) {
                console.error('Error prevented from showing dialog in DEBUG mode');
                event.preventDefault();
                return;
            }
            
            this.handleError(event.error);
            event.preventDefault();
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            
            // Don't show error dialog in development mode, just log it
            if (window.APP_CONFIG && window.APP_CONFIG.DEBUG) {
                console.error('Promise rejection prevented from showing dialog in DEBUG mode');
                event.preventDefault();
                return;
            }
            
            this.handleError(event.reason);
            event.preventDefault();
        });
    }

    /**
     * Setup network error handlers
     */
    setupNetworkErrorHandlers() {
        // Monitor online/offline status
        window.addEventListener('online', () => {
            this.showNotification('Connection restored', 'success');
            // Retry failed requests
            this.retryFailedRequests();
        });

        window.addEventListener('offline', () => {
            this.showNotification('No internet connection', 'error');
        });
    }

    /**
     * Handle errors
     */
    handleError(error) {
        // Log error for debugging
        if (window.APP_CONFIG && window.APP_CONFIG.DEBUG) {
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString(),
            });
        }

        // Determine error type and show appropriate message
        if (error.message?.includes('fetch') || error.message?.includes('network')) {
            this.showNotification('Network error. Please check your connection.', 'error');
        } else if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
            this.showNotification('Session expired. Please log in again.', 'warning');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
            this.showNotification('Access denied.', 'error');
        } else if (error.message?.includes('404')) {
            this.showNotification('Resource not found.', 'error');
        } else if (error.message?.includes('500')) {
            this.showNotification('Server error. Please try again later.', 'error');
        } else {
            // Log the actual error for debugging
            console.error('Unexpected error:', error);
            this.showNotification('An unexpected error occurred.', 'error');
        }
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        if (typeof UI !== 'undefined' && UI.showToast) {
            UI.showToast(message, type);
        } else if (typeof window.UI !== 'undefined' && window.UI.showToast) {
            window.UI.showToast(message, type);
        } else {
            // Fallback to alert if UI is not available
            alert(message);
        }
    }

    /**
     * Retry failed requests
     */
    retryFailedRequests() {
        // This would be implemented with a request queue
        // For now, just reload the page if needed
        if (window.location.pathname !== '/') {
            window.location.reload();
        }
    }

    /**
     * Wrap async functions with error handling
     */
    static wrap(fn) {
        return async function(...args) {
            try {
                return await fn.apply(this, args);
            } catch (error) {
                console.error('Error in wrapped function:', error);
                if (window.errorBoundary) {
                    window.errorBoundary.handleError(error);
                }
                throw error;
            }
        };
    }

    /**
     * Safe execution of functions
     */
    static safeExecute(fn, fallback = null) {
        try {
            return fn();
        } catch (error) {
            console.error('Error in safe execution:', error);
            if (window.errorBoundary) {
                window.errorBoundary.handleError(error);
            }
            return fallback;
        }
    }
}

// Initialize error boundary
window.errorBoundary = new ErrorBoundary();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorBoundary;
}
