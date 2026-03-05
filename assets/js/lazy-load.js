/**
 * Lazy Loading System
 * Alpha Freight - Performance Optimization
 */

class LazyLoader {
    constructor() {
        this.imageObserver = null;
        this.contentObserver = null;
        this.init();
    }

    init() {
        // Lazy load images
        this.initImageLazyLoad();

        // Lazy load content
        this.initContentLazyLoad();
    }

    // Initialize image lazy loading
    initImageLazyLoad() {
        if ('IntersectionObserver' in window) {
            this.imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        this.imageObserver.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px'
            });

            // Observe all lazy images
            document.querySelectorAll('img[data-src]').forEach(img => {
                this.imageObserver.observe(img);
            });
        } else {
            // Fallback for old browsers
            document.querySelectorAll('img[data-src]').forEach(img => {
                this.loadImage(img);
            });
        }
    }

    // Load image
    loadImage(img) {
        const src = img.getAttribute('data-src');
        if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            img.classList.add('loaded');
        }
    }

    // Initialize content lazy loading
    initContentLazyLoad() {
        if ('IntersectionObserver' in window) {
            this.contentObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadContent(entry.target);
                        this.contentObserver.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '100px'
            });

            // Observe all lazy content
            document.querySelectorAll('[data-lazy]').forEach(element => {
                this.contentObserver.observe(element);
            });
        }
    }

    // Load content
    loadContent(element) {
        const url = element.getAttribute('data-lazy');
        if (url) {
            fetch(url)
                .then(response => response.text())
                .then(html => {
                    element.innerHTML = html;
                    element.classList.add('loaded');
                })
                .catch(error => {
                    console.error('Error loading lazy content:', error);
                    if (window.Toast) {
                        window.Toast.error('Failed to load content');
                    }
                });
        }
    }

    // Lazy load iframe
    loadIframe(iframe) {
        const src = iframe.getAttribute('data-src');
        if (src) {
            iframe.src = src;
            iframe.removeAttribute('data-src');
        }
    }
}

// Add CSS for lazy loading
const lazyStyle = document.createElement('style');
lazyStyle.textContent = `
    img[data-src] {
        opacity: 0;
        transition: opacity 0.3s ease;
        background: #f0f0f0;
    }

    img[data-src].loaded {
        opacity: 1;
    }

    [data-lazy] {
        min-height: 200px;
        background: #f0f0f0;
    }

    [data-lazy].loaded {
        background: transparent;
    }
`;
document.head.appendChild(lazyStyle);

// Initialize
window.LazyLoader = new LazyLoader();

console.log('🔄 Lazy Loader loaded');

