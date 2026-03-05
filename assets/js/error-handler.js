/**
 * Global Error Handler
 * Alpha Freight - Comprehensive Error Handling
 */

class ErrorHandler {
    constructor() {
        this.init();
    }

    init() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.handleError(event.error || event.message, 'JavaScript Error');
        });

        // Unhandled promise rejection
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, 'Unhandled Promise Rejection');
        });

        // Network errors
        window.addEventListener('online', () => {
            if (window.Toast) {
                window.Toast.success('Internet connection restored');
            }
        });

        window.addEventListener('offline', () => {
            if (window.Toast) {
                window.Toast.error('No internet connection');
            }
        });
    }

    handleError(error, type = 'Error') {
        console.error(`[${type}]`, error);

        // Show user-friendly message
        const message = this.getUserFriendlyMessage(error);
        if (window.Toast) {
            window.Toast.error(message);
        }

        // Log to console for debugging
        // Check if we're in development mode (browser environment)
        const isDevelopment = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development';
        if (isDevelopment || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.error('Error details:', error);
        }

        // Send to error tracking service (optional)
        // this.sendToErrorTracking(error, type);
    }

    getUserFriendlyMessage(error) {
        if (typeof error === 'string') {
            return error;
        }

        if (error.message) {
            // Network errors
            if (error.message.includes('fetch') || error.message.includes('network')) {
                return 'Network error. Please check your internet connection.';
            }

            // Firebase errors
            if (error.message.includes('permission')) {
                return 'Permission denied. Please check your account access.';
            }

            // Firebase errors
            if (error.message.includes('permission-denied')) {
                return 'Permission denied. Please check your account access.';
            }
            
            if (error.message.includes('unauthenticated') || error.message.includes('auth')) {
                return 'Authentication error. Please login again.';
            }

            // Generic error
            return error.message;
        }

        return 'An unexpected error occurred. Please try again.';
    }

    // Wrapper for async functions
    async wrapAsync(fn, errorMessage = 'Operation failed') {
        try {
            return await fn();
        } catch (error) {
            this.handleError(error, errorMessage);
            throw error;
        }
    }

    // Wrapper for sync functions
    wrapSync(fn, errorMessage = 'Operation failed') {
        try {
            return fn();
        } catch (error) {
            this.handleError(error, errorMessage);
            throw error;
        }
    }
}

// Initialize
window.ErrorHandler = new ErrorHandler();

// Helper function
window.handleError = (error, message) => {
    window.ErrorHandler.handleError(error, message);
};

console.log('🛡️ Error Handler loaded');

