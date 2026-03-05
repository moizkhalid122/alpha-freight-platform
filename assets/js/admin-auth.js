// Admin Authentication Check
// This script should be included in all admin pages to protect them

(function() {
    'use strict';
    
    // Check admin authentication - RUN IMMEDIATELY
    function checkAdminAuth() {
        // Skip check if already on login page
        const currentPage = window.location.pathname || window.location.href;
        if (currentPage.includes('login.html')) {
            return true;
        }
        
        const adminAuth = JSON.parse(localStorage.getItem('adminAuth') || 'null');
        
        // If not logged in, redirect to login page IMMEDIATELY
        if (!adminAuth || !adminAuth.isLoggedIn) {
            // Get current page path
            const currentPath = window.location.pathname || window.location.href;
            
            // Extract directory path
            let loginPath;
            if (currentPath.includes('/admin/')) {
                // If we're in admin directory
                loginPath = currentPath.substring(0, currentPath.lastIndexOf('/')) + '/login.html';
            } else {
                // Fallback to relative path
                loginPath = 'login.html';
            }
            
            // Redirect to login page IMMEDIATELY (no delay)
            window.location.replace(loginPath);
            return false;
        }
        
        return true;
    }

    // Check authentication IMMEDIATELY (before page loads)
    checkAdminAuth();
    
    // Also check when DOM is ready (in case redirect didn't work)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAdminAuth);
    } else {
        checkAdminAuth();
    }

    // Logout function
    window.adminLogout = function() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('adminAuth');
            try {
                if (localStorage.getItem('ab.portal.lastRole') === 'admin') {
                    localStorage.removeItem('ab.portal.lastRole');
                }
            } catch (err) {}
            // Get current page path to redirect to login
            const currentPath = window.location.pathname || window.location.href;
            let loginPath;
            if (currentPath.includes('/admin/')) {
                loginPath = currentPath.substring(0, currentPath.lastIndexOf('/')) + '/login.html';
            } else {
                loginPath = 'login.html';
            }
            // Use replace instead of href to prevent back button
            window.location.replace(loginPath);
        }
    };

    // Add logout handler to logout links
    document.addEventListener('DOMContentLoaded', function() {
        const logoutLinks = document.querySelectorAll('a[href*="logout"], a[href*="login.html"], a[href="../index.html"]');
        logoutLinks.forEach(link => {
            if (link.textContent.toLowerCase().includes('logout') || 
                link.getAttribute('href').includes('login.html') ||
                link.getAttribute('href').includes('../index.html')) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    adminLogout();
                });
            }
        });
    });
})();

