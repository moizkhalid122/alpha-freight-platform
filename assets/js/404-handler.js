/**
 * 404 Error Handler
 * Alpha Freight - Automatic 404 Page Redirection
 */

class NotFoundHandler {
    constructor() {
        this.init();
    }

    init() {
        // Check if current page is 404
        this.check404Status();

        // Handle broken links
        this.handleBrokenLinks();

        // Handle fetch errors (404 responses)
        this.handleFetchErrors();
    }

    check404Status() {
        // If page title contains 404 or body has 404 class
        const is404Page = document.title.includes('404') || 
                         document.body.classList.contains('error-404') ||
                         window.location.pathname.includes('404');

        if (is404Page) {
            this.log404Error();
        }
    }

    handleBrokenLinks() {
        // Intercept clicks on links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href]');
            if (!link) return;

            const href = link.getAttribute('href');
            
            // Skip external links, anchors, and special protocols
            if (href.startsWith('http') || 
                href.startsWith('#') || 
                href.startsWith('mailto:') || 
                href.startsWith('tel:') ||
                href.startsWith('javascript:')) {
                return;
            }

            // Check if link exists
            this.checkLinkExists(href, link);
        });
    }

    async checkLinkExists(href, linkElement) {
        try {
            // Only check relative links
            if (href.startsWith('/') || !href.startsWith('http')) {
                const response = await fetch(href, { method: 'HEAD' });
                
                if (response.status === 404) {
                    // Prevent default navigation
                    linkElement.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.redirectTo404(href);
                    }, { once: true });
                }
            }
        } catch (error) {
            // If fetch fails, might be a 404
            console.warn('Link check failed:', href);
        }
    }

    handleFetchErrors() {
        // Override fetch to catch 404 errors
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                
                // If it's a 404 and it's an HTML page request
                if (response.status === 404 && 
                    response.headers.get('content-type')?.includes('text/html')) {
                    this.redirectTo404(args[0]);
                    return response;
                }
                
                return response;
            } catch (error) {
                throw error;
            }
        };
    }

    redirectTo404(originalUrl = null) {
        // Store original URL for reference
        if (originalUrl) {
            sessionStorage.setItem('404_original_url', originalUrl);
        }
        
        // Redirect to 404 page
        window.location.href = '/404.html';
    }

    log404Error() {
        const originalUrl = sessionStorage.getItem('404_original_url') || 
                          document.referrer || 
                          'Direct access';
        
        console.warn('404 Error:', {
            originalUrl: originalUrl,
            currentUrl: window.location.href,
            timestamp: new Date().toISOString()
        });

        // Clear stored URL
        sessionStorage.removeItem('404_original_url');
    }

    // Method to manually trigger 404 redirect
    static redirect(url = null) {
        const handler = new NotFoundHandler();
        handler.redirectTo404(url);
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.NotFoundHandler = new NotFoundHandler();
    });
} else {
    window.NotFoundHandler = new NotFoundHandler();
}

// Export for use in other scripts
window.redirectTo404 = (url) => {
    NotFoundHandler.redirect(url);
};

console.log('🔍 404 Handler loaded');

