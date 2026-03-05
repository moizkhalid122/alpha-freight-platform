/**
 * Toast Notification System
 * Alpha Freight - Beautiful Toast Messages
 */

class ToastNotification {
    constructor() {
        this.container = null;
        this.toasts = [];
        this.init();
    }

    init() {
        // Create toast container
        this.container = document.createElement('div');
        this.container.id = 'toastContainer';
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = this.getIcon(type);
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        this.container.appendChild(toast);

        // Trigger animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.remove(toast);
            }, duration);
        }

        return toast;
    }

    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 4000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 3500) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }

    remove(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300);
    }

    getIcon(type) {
        const icons = {
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            warning: '<i class="fas fa-exclamation-triangle"></i>',
            info: '<i class="fas fa-info-circle"></i>'
        };
        return icons[type] || icons.info;
    }
}

// Add CSS styles
const toastStyle = document.createElement('style');
toastStyle.textContent = `
    .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
    }

    .toast {
        background: white;
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 300px;
        max-width: 400px;
        transform: translateX(400px);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        pointer-events: auto;
        border-left: 4px solid;
    }

    .toast.show {
        transform: translateX(0);
        opacity: 1;
    }

    .toast-success {
        border-left-color: #10b981;
    }

    .toast-error {
        border-left-color: #ef4444;
    }

    .toast-warning {
        border-left-color: #f59e0b;
    }

    .toast-info {
        border-left-color: #3b82f6;
    }

    .toast-icon {
        font-size: 20px;
        flex-shrink: 0;
    }

    .toast-success .toast-icon {
        color: #10b981;
    }

    .toast-error .toast-icon {
        color: #ef4444;
    }

    .toast-warning .toast-icon {
        color: #f59e0b;
    }

    .toast-info .toast-icon {
        color: #3b82f6;
    }

    .toast-content {
        flex: 1;
    }

    .toast-message {
        font-size: 14px;
        font-weight: 500;
        color: #1f2937;
        line-height: 1.5;
    }

    .toast-close {
        background: none;
        border: none;
        color: #9ca3af;
        font-size: 16px;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
        flex-shrink: 0;
    }

    .toast-close:hover {
        background: #f3f4f6;
        color: #6b7280;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
        .toast-container {
            top: 10px;
            right: 10px;
            left: 10px;
        }

        .toast {
            min-width: auto;
            max-width: 100%;
        }
    }

    /* Dark mode */
    @media (prefers-color-scheme: dark) {
        .toast {
            background: #1f2937;
        }

        .toast-message {
            color: #f9fafb;
        }

        .toast-close {
            color: #9ca3af;
        }

        .toast-close:hover {
            background: #374151;
            color: #d1d5db;
        }
    }
`;
document.head.appendChild(toastStyle);

// Initialize global instance
window.Toast = new ToastNotification();

// Helper functions
window.showToast = (message, type = 'info') => {
    window.Toast.show(message, type);
};

window.showSuccess = (message) => {
    window.Toast.success(message);
};

window.showError = (message) => {
    window.Toast.error(message);
};

window.showWarning = (message) => {
    window.Toast.warning(message);
};

window.showInfo = (message) => {
    window.Toast.info(message);
};

console.log('🍞 Toast Notification System loaded');

