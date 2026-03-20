/**
 * Beautiful Alert System
 * Alpha Freight - Professional Alert Notifications
 * Firebase-based alerts with beautiful design
 */

class AlertSystem {
    constructor() {
        this.container = null;
        this.alerts = [];
        this.init();
    }

    init() {
        this.container = document.createElement('div');
        this.container.id = 'alertContainer';
        this.container.className = 'alert-container';
        document.body.appendChild(this.container);
        this.addStyles();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .alert-container {
                position: fixed;
                top: 12px;
                left: 12px;
                right: 12px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
                max-width: 100%;
                width: calc(100% - 24px);
                margin: 0 auto;
                box-sizing: border-box;
            }

            .alert {
                background: white;
                border-radius: 14px;
                padding: 14px 16px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
                display: flex;
                align-items: flex-start;
                gap: 12px;
                width: 100%;
                max-width: 100%;
                min-width: 0;
                transform: translateY(-20px);
                opacity: 0;
                transition: all 0.35s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                pointer-events: auto;
                border-left: 4px solid;
                position: relative;
                overflow: hidden;
                box-sizing: border-box;
            }

            .alert::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
                animation: shimmer 2s infinite;
            }

            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }

            .alert.show {
                transform: translateY(0);
                opacity: 1;
            }

            .alert-success {
                border-left-color: #10b981;
                background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
            }

            .alert-error {
                border-left-color: #ef4444;
                background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
            }

            .alert-warning {
                border-left-color: #f59e0b;
                background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%);
            }

            .alert-info {
                border-left-color: #3b82f6;
                background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
            }

            .alert-icon {
                font-size: 24px;
                flex-shrink: 0;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 12px;
                animation: pulse 2s infinite;
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }

            .alert-success .alert-icon {
                color: #10b981;
                background: rgba(16, 185, 129, 0.1);
            }

            .alert-error .alert-icon {
                color: #ef4444;
                background: rgba(239, 68, 68, 0.1);
            }

            .alert-warning .alert-icon {
                color: #f59e0b;
                background: rgba(245, 158, 11, 0.1);
            }

            .alert-info .alert-icon {
                color: #3b82f6;
                background: rgba(59, 130, 246, 0.1);
            }

            .alert-content {
                flex: 1;
                min-width: 0;
            }

            .alert-title {
                font-size: clamp(14px, 3.5vw, 15px);
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 2px;
                line-height: 1.4;
            }

            .alert-message {
                font-size: clamp(13px, 3vw, 14px);
                font-weight: 400;
                color: #6b7280;
                line-height: 1.45;
                word-break: break-word;
            }

            .alert-close {
                background: none;
                border: none;
                color: #9ca3af;
                font-size: 18px;
                cursor: pointer;
                padding: 4px;
                border-radius: 6px;
                transition: all 0.2s ease;
                flex-shrink: 0;
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .alert-close:hover {
                background: rgba(0,0,0,0.05);
                color: #6b7280;
                transform: rotate(90deg);
            }

            .alert-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: rgba(0,0,0,0.05);
                overflow: hidden;
            }

            .alert-progress-bar {
                height: 100%;
                background: currentColor;
                opacity: 0.3;
                animation: progress linear;
            }

            @keyframes progress {
                from { width: 100%; }
                to { width: 0%; }
            }

            @media (min-width: 480px) {
                .alert-container {
                    left: auto;
                    right: 16px;
                    width: auto;
                    max-width: 400px;
                }
            }

            /* Dark mode */
            @media (prefers-color-scheme: dark) {
                .alert {
                    background: #1f2937;
                }

                .alert-title {
                    color: #f9fafb;
                }

                .alert-message {
                    color: #d1d5db;
                }

                .alert-close {
                    color: #9ca3af;
                }

                .alert-close:hover {
                    background: rgba(255,255,255,0.1);
                    color: #d1d5db;
                }
            }
        `;
        document.head.appendChild(style);
    }

    show(message, type = 'info', options = {}) {
        const types = ['error', 'success', 'warning', 'info'];
        if (types.includes(message) && typeof type === 'string' && type.length > 0 && !types.includes(type)) {
            [message, type] = [type, message];
        }
        const title = options.title != null ? options.title : this.getDefaultTitle(type);
        const duration = options.duration != null ? options.duration : (type === 'error' ? 5000 : 4000);
        const container = this.container;
        if (!container) return null;
        container.style.display = 'flex';
        const alertEl = document.createElement('div');
        alertEl.className = 'alert alert-' + type;
        alertEl.innerHTML =
            '<div class="alert-icon">' + this.getIcon(type) + '</div>' +
            '<div class="alert-content">' +
            '<div class="alert-title">' + (title ? this.escapeHtml(title) : '') + '</div>' +
            '<div class="alert-message">' + (message ? this.escapeHtml(message) : '') + '</div>' +
            '</div>' +
            '<button type="button" class="alert-close" aria-label="Close"><i class="fas fa-times"></i></button>';
        if (duration > 0) {
            const progress = document.createElement('div');
            progress.className = 'alert-progress';
            progress.innerHTML = '<div class="alert-progress-bar" style="animation-duration: ' + duration + 'ms"></div>';
            alertEl.appendChild(progress);
        }
        const self = this;
        alertEl.querySelector('.alert-close').addEventListener('click', function () {
            self.remove(alertEl);
        });
        container.appendChild(alertEl);
        this.alerts.push(alertEl);
        requestAnimationFrame(function () {
            alertEl.classList.add('show');
        });
        if (duration > 0) {
            setTimeout(function () {
                self.remove(alertEl);
            }, duration);
        }
        return alertEl;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    success(message, options = {}) {
        return this.show(message, 'success', {
            title: 'Success!',
            ...options
        });
    }

    error(message, options = {}) {
        return this.show(message, 'error', {
            title: 'Error!',
            duration: 5000,
            ...options
        });
    }

    warning(message, options = {}) {
        return this.show(message, 'warning', {
            title: 'Warning!',
            ...options
        });
    }

    info(message, options = {}) {
        return this.show(message, 'info', {
            title: 'Info',
            ...options
        });
    }

    remove(alert) {
        if (!alert || !alert.parentElement) return;
        
        alert.classList.remove('show');
        setTimeout(() => {
            if (alert.parentElement) {
                alert.parentElement.removeChild(alert);
            }
            this.alerts = this.alerts.filter(a => a !== alert);
        }, 400);
    }

    clear() {
        this.alerts.forEach(alert => this.remove(alert));
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

    getDefaultTitle(type) {
        const titles = {
            success: 'Success!',
            error: 'Error!',
            warning: 'Warning!',
            info: 'Info'
        };
        return titles[type] || 'Alert';
    }
}

// Single shared instance (so new AlertSystem() in pages uses the same one)
const _alertInstance = new AlertSystem();
window.AlertSystem = function AlertSystem() { return _alertInstance; };
window.AlertSystem.prototype = AlertSystem.prototype;

// Helper functions for easy access
window.showAlert = (message, type = 'info', options = {}) => {
    _alertInstance.show(message, type, options);
};

window.showSuccess = (message, options = {}) => {
    _alertInstance.success(message, options);
};

window.showError = (message, options = {}) => {
    _alertInstance.error(message, options);
};

window.showWarning = (message, options = {}) => {
    _alertInstance.warning(message, options);
};

window.showInfo = (message, options = {}) => {
    _alertInstance.info(message, options);
};

// Also update AlphaBrokrage namespace for backward compatibility
if (window.AlphaBrokrage) {
    window.AlphaBrokrage.showAlert = (message, type = 'info') => {
        _alertInstance.show(message, type);
    };
}

console.log('✅ Beautiful Alert System loaded');

