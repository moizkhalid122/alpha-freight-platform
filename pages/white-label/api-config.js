/**
 * White Label System - API Configuration
 * Shared configuration for all pages
 */

// Detect API base URL
const getApiBase = () => {
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // Development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `http://${hostname}:${port || '3000'}/api/white-label`;
    }
    
    // Production - use relative path
    return '/api/white-label';
};

const API_BASE = getApiBase();

// Get auth token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
};

// Make authenticated API request
const apiRequest = async (endpoint, options = {}) => {
    const token = getAuthToken();
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})
        }
    });
    
    if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
        window.location.href = 'signup.html';
        throw new Error('Authentication required');
    }
    
    return response;
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_BASE, getAuthToken, apiRequest };
}
