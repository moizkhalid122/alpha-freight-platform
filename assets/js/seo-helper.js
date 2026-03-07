/**
 * Alpha Freight Solutions - SEO Helper Script
 * Adds performance optimizations and SEO enhancements
 */

(function() {
    'use strict';

    // ============================================
    // 1. LAZY LOADING FOR IMAGES
    // ============================================
    function initLazyLoading() {
        // Add loading="lazy" to all images that don't have it
        const images = document.querySelectorAll('img:not([loading])');
        images.forEach(img => {
            img.setAttribute('loading', 'lazy');
            img.setAttribute('decoding', 'async');
        });

        // Add loading="lazy" to iframes
        const iframes = document.querySelectorAll('iframe:not([loading])');
        iframes.forEach(iframe => {
            iframe.setAttribute('loading', 'lazy');
        });
    }

    // ============================================
    // 2. ADD ALT TEXT TO IMAGES WITHOUT IT
    // ============================================
    function addMissingAltText() {
        const images = document.querySelectorAll('img:not([alt]), img[alt=""]');
        images.forEach((img, index) => {
            // Try to derive alt text from filename or nearby text
            let altText = '';
            
            // Check for parent figure with figcaption
            const figcaption = img.closest('figure')?.querySelector('figcaption');
            if (figcaption) {
                altText = figcaption.textContent.trim();
            }
            
            // Check for nearby heading
            if (!altText) {
                const heading = img.closest('section')?.querySelector('h1, h2, h3');
                if (heading) {
                    altText = heading.textContent.trim() + ' image';
                }
            }
            
            // Derive from src filename
            if (!altText && img.src) {
                const filename = img.src.split('/').pop().split('.')[0];
                altText = filename.replace(/[-_]/g, ' ').replace(/\d+/g, '').trim();
                if (altText.length < 3) altText = 'Alpha Freight image ' + (index + 1);
            }
            
            // Fallback
            if (!altText) {
                altText = 'Alpha Freight Solutions - UK Freight Brokerage Platform';
            }
            
            img.setAttribute('alt', altText);
        });
    }

    // ============================================
    // 3. EXTERNAL LINKS - ADD REL ATTRIBUTES
    // ============================================
    function secureExternalLinks() {
        const externalLinks = document.querySelectorAll('a[href^="http"]:not([href*="alphafreightuk.com"]):not([href*="localhost"])');
        externalLinks.forEach(link => {
            link.setAttribute('rel', 'noopener noreferrer');
            if (!link.hasAttribute('target')) {
                link.setAttribute('target', '_blank');
            }
        });
    }

    // ============================================
    // 4. IMPROVE HEADING HIERARCHY
    // ============================================
    function validateHeadingHierarchy() {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let h1Count = 0;
        
        headings.forEach(heading => {
            if (heading.tagName === 'H1') {
                h1Count++;
                if (h1Count > 1) {
                    console.warn('SEO Warning: Multiple H1 tags found. Consider using only one H1 per page.');
                }
            }
        });
        
        if (h1Count === 0) {
            console.warn('SEO Warning: No H1 tag found on this page.');
        }
    }

    // ============================================
    // 5. ADD STRUCTURED DATA FOR BREADCRUMBS
    // ============================================
    function addBreadcrumbSchema() {
        const breadcrumb = document.querySelector('.breadcrumb, [aria-label="breadcrumb"]');
        if (breadcrumb && !document.querySelector('script[type="application/ld+json"][data-breadcrumb]')) {
            const items = breadcrumb.querySelectorAll('a, .breadcrumb-item');
            const breadcrumbItems = [];
            
            items.forEach((item, index) => {
                const link = item.tagName === 'A' ? item : item.querySelector('a');
                const name = (link || item).textContent.trim();
                const url = link ? link.href : window.location.href;
                
                breadcrumbItems.push({
                    "@type": "ListItem",
                    "position": index + 1,
                    "name": name,
                    "item": url
                });
            });
            
            if (breadcrumbItems.length > 0) {
                const schema = {
                    "@context": "https://schema.org",
                    "@type": "BreadcrumbList",
                    "itemListElement": breadcrumbItems
                };
                
                const script = document.createElement('script');
                script.type = 'application/ld+json';
                script.setAttribute('data-breadcrumb', 'true');
                script.textContent = JSON.stringify(schema);
                document.head.appendChild(script);
            }
        }
    }

    // ============================================
    // 6. TRACK CORE WEB VITALS
    // ============================================
    function trackWebVitals() {
        if ('web-vitals' in window || typeof webVitals !== 'undefined') {
            return; // Already loaded
        }
        
        // Simple performance tracking
        window.addEventListener('load', function() {
            setTimeout(() => {
                const timing = performance.timing;
                const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
                const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
                
                // Log to console for debugging
                console.log('Page Performance:', {
                    'Page Load Time': pageLoadTime + 'ms',
                    'DOM Content Loaded': domContentLoaded + 'ms'
                });
                
                // Send to Google Analytics if available
                if (typeof gtag === 'function') {
                    gtag('event', 'page_timing', {
                        'page_load_time': pageLoadTime,
                        'dom_content_loaded': domContentLoaded
                    });
                }
            }, 100);
        });
    }

    // ============================================
    // 7. PRELOAD CRITICAL RESOURCES
    // ============================================
    function preloadCriticalResources() {
        // Preload logo image
        const logo = document.querySelector('.header-logo img, .navbar-brand img');
        if (logo && logo.src) {
            const preload = document.createElement('link');
            preload.rel = 'preload';
            preload.as = 'image';
            preload.href = logo.src;
            document.head.appendChild(preload);
        }
    }

    // ============================================
    // 8. ADD SKIP TO MAIN CONTENT LINK (Accessibility)
    // ============================================
    function addSkipLink() {
        if (document.querySelector('.skip-link')) return;
        
        const main = document.querySelector('main, [role="main"], #main, .main-content');
        if (main && !main.id) {
            main.id = 'main-content';
        }
        
        if (main) {
            const skipLink = document.createElement('a');
            skipLink.href = '#' + (main.id || 'main-content');
            skipLink.className = 'skip-link';
            skipLink.textContent = 'Skip to main content';
            skipLink.style.cssText = 'position:absolute;top:-40px;left:0;background:#000;color:#fff;padding:8px;z-index:100000;transition:top 0.3s;';
            
            skipLink.addEventListener('focus', () => {
                skipLink.style.top = '0';
            });
            
            skipLink.addEventListener('blur', () => {
                skipLink.style.top = '-40px';
            });
            
            document.body.insertBefore(skipLink, document.body.firstChild);
        }
    }

    // ============================================
    // 9. OPTIMIZE FONT LOADING
    // ============================================
    function optimizeFontLoading() {
        // Add font-display: swap to @font-face if not already set
        const styleSheets = document.styleSheets;
        // Note: This is limited due to CORS, works for inline styles
    }

    // ============================================
    // INITIALIZE ALL SEO ENHANCEMENTS
    // ============================================
    function init() {
        // Run on DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', runEnhancements);
        } else {
            runEnhancements();
        }
    }

    function runEnhancements() {
        initLazyLoading();
        addMissingAltText();
        secureExternalLinks();
        validateHeadingHierarchy();
        addBreadcrumbSchema();
        trackWebVitals();
        preloadCriticalResources();
        addSkipLink();
        
        console.log('✅ Alpha Freight SEO Helper initialized');
    }

    // Auto-initialize
    init();

    // Export for manual use if needed
    window.AlphaFreightSEO = {
        initLazyLoading,
        addMissingAltText,
        secureExternalLinks,
        validateHeadingHierarchy,
        init: runEnhancements
    };

})();
