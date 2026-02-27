/**
 * UI Module for Uniy Market
 * UI模块
 */

const UI = {
    init() {
        this.setupToastContainer();
        this.setupModalHandlers();
        window.log('UI module initialized');
    },

    setupToastContainer() {
        if (!document.getElementById('toastContainer')) {
            const container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(container);
        }
    },

    setupModalHandlers() {
        // Close modal when clicking the close button
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => this.hideModal());
        }

        // Close modal when clicking outside
        const modal = document.getElementById('modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal();
                }
            });
        }
    },

    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            background: ${this.getToastColor(type)};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 300px;
            animation: slideIn 0.3s ease;
            cursor: pointer;
        `;
        
        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <i class="${icon}"></i>
            <span style="flex: 1;">${message}</span>
            <button style="background: none; border: none; color: white; cursor: pointer; padding: 0; font-size: 16px;" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(toast);

        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);

        // Add click to dismiss
        toast.addEventListener('click', () => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        });
    },

    getToastIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    },

    getToastColor(type) {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        return colors[type] || colors.info;
    },

    showModal(title, content, actions = []) {
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modalBody');
        
        if (!modal || !modalBody) return;

        modalBody.innerHTML = `
            <h3 style="margin-top: 0;">${title}</h3>
            <div class="modal-content-body" style="margin: 20px 0;">${content}</div>
            <div class="modal-actions" style="display: flex; gap: 10px; justify-content: flex-end;">
                ${actions.map(action => `
                    <button class="btn ${action.class || 'btn-secondary'}" 
                            onclick="${action.onclick || 'UI.hideModal()'}">
                        ${action.text}
                    </button>
                `).join('')}
            </div>
        `;

        modal.style.display = 'block';
    },

    hideModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.style.display = 'none';
        }
    },

    confirm(message, callback) {
        this.showModal('Confirm', message, [
            {
                text: 'Cancel',
                class: 'btn-secondary',
                onclick: 'UI.hideModal()'
            },
            {
                text: 'Confirm',
                class: 'btn-primary',
                onclick: `UI.hideModal(); (${callback.toString()})()`
            }
        ]);
    },

    navigateTo(page) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        // Show target page
        const targetPage = document.getElementById(page + 'Page');
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        window.log('Navigated to:', page);
    },

    showLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = 'block';
        }
    },

    hideLoading() {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = 'none';
        }
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    },

    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        
        return date.toLocaleDateString();
    }
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize UI when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});

// Export UI for global access
window.UI = UI;