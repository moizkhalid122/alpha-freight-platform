/**
 * MULTI-TENANT ROUTING SYSTEM
 * 
 * Handles tenant detection, configuration loading, and branding application
 * for Alpha Freight's white-label platform.
 */

/**
 * 1. Detect tenant from URL
 * Checks if URL is custom domain or extracts subdomain from tenant.alphafreightuk.com
 * Returns tenantId or null
 */
function detectTenantFromURL() {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    
    // Check if it's a subdomain (e.g., swift.alphafreightuk.com)
    if (parts.length >= 3 && parts[parts.length - 2] === 'alphafreightuk') {
        const subdomain = parts[0];
        // Skip www, app, admin, etc.
        if (subdomain && !['www', 'app', 'admin', 'api'].includes(subdomain)) {
            return {
                type: 'subdomain',
                tenantId: subdomain,
                domain: hostname
            };
        }
    }
    
    // Check if it's a custom domain
    // Backend would verify this against registered custom domains
    // For now, return the full domain as identifier
    if (parts.length === 2 || (parts.length === 3 && parts[0] === 'www')) {
        const domain = parts[0] === 'www' ? parts.slice(1).join('.') : hostname;
        return {
            type: 'custom',
            tenantId: domain,
            domain: hostname
        };
    }
    
    return null;
}

/**
 * 2. Load tenant configuration from Firebase
 * Fetches tenant branding configuration
 * Returns config object or null if tenant not found
 */
async function loadTenantConfig(tenantId) {
    try {
        // Backend API call
        // GET /api/tenant/config?tenantId=swift OR ?domain=swiftlogistics.com
        const response = await fetch(`/api/white-label/tenant/config?tenantId=${encodeURIComponent(tenantId)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                console.warn('Tenant not found:', tenantId);
                return null;
            }
            throw new Error(`Failed to load tenant config: ${response.statusText}`);
        }
        
        const config = await response.json();
        
        // Return structured config object
        return {
            tenantId: config.tenantId,
            companyName: config.companyName || 'Freight Platform',
            logo: {
                full: config.logo?.full || '/default-logo.png',
                small: config.logo?.small || '/default-logo-small.png',
                favicon: config.logo?.favicon || '/default-favicon.ico',
                loginBg: config.logo?.loginBg || null,
                emailLogo: config.logo?.emailLogo || null,
                pdfLogo: config.logo?.pdfLogo || null,
                heroImage: config.logo?.heroImage || null,
                ogImage: config.logo?.ogImage || null
            },
            colors: {
                primary: config.colors?.primary || '#635bff',
                secondary: config.colors?.secondary || '#7c3aed',
                success: config.colors?.success || '#10b981',
                danger: config.colors?.danger || '#ef4444',
                bg: config.colors?.bg || '#ffffff',
                cardBg: config.colors?.cardBg || '#f9fafb',
                textPrimary: config.colors?.textPrimary || '#1f2937',
                textSecondary: config.colors?.textSecondary || '#6b7280'
            },
            fonts: {
                primary: config.fonts?.primary || 'Inter',
                heading: config.fonts?.heading || 'Plus Jakarta Sans',
                googleFontsUrl: config.fonts?.googleFontsUrl || ''
            },
            general: config.general || {},
            email: config.email || {},
            advanced: config.advanced || {},
            customDomain: config.customDomain || null,
            status: config.status || 'active' // active, pending, suspended
        };
    } catch (error) {
        console.error('Error loading tenant config:', error);
        return null;
    }
}

/**
 * 3. Apply tenant styles to page
 * Sets CSS variables, updates document title, favicon, and meta tags
 */
function applyTenantStyles(config) {
    if (!config) {
        console.warn('No config provided to applyTenantStyles');
        return;
    }
    
    // Set CSS variables for colors
    const root = document.documentElement;
    root.style.setProperty('--tenant-primary', config.colors.primary);
    root.style.setProperty('--tenant-secondary', config.colors.secondary);
    root.style.setProperty('--tenant-success', config.colors.success);
    root.style.setProperty('--tenant-danger', config.colors.danger);
    root.style.setProperty('--text-dark', config.colors.textPrimary || '#1f2937');
    root.style.setProperty('--text-medium', config.colors.textSecondary || '#4b5563');
    root.style.setProperty('--bg-white', config.colors.bg || '#ffffff');
    root.style.setProperty('--bg-gray', config.colors.cardBg || '#f9fafb');
    
    // Update document title
    const siteTitle = (config.general?.siteTitle || '').trim();
    document.title = siteTitle || `${config.companyName} - Freight Platform`;
    
    // Update favicon
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
    }
    favicon.href = config.logo.favicon;
    
    // Update meta tags
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
    }
    metaDescription.content = (config.general?.metaDescription || config.general?.tagline || `${config.companyName} - Connect with verified carriers across the UK`).trim();
    
    // Update logo elements
    const logoElements = document.querySelectorAll('.tenant-logo, .logo');
    logoElements.forEach(element => {
        if (element.tagName === 'IMG') {
            element.src = config.logo.full;
            element.alt = config.companyName;
        } else {
            element.textContent = config.companyName;
        }
    });
    
    // Load custom fonts if provided
    if (config.fonts.googleFontsUrl) {
        const existingFontLink = document.querySelector(`link[href="${config.fonts.googleFontsUrl}"]`);
        if (!existingFontLink) {
            const fontLink = document.createElement('link');
            fontLink.href = config.fonts.googleFontsUrl;
            fontLink.rel = 'stylesheet';
            document.head.appendChild(fontLink);
        }
        
        // Apply font family
        root.style.setProperty('--tenant-font', config.fonts.primary);
        document.body.style.fontFamily = `${config.fonts.primary}, Inter, system-ui, sans-serif`;
    }

    if (config.fonts.heading) {
        const id = 'wl-tenant-heading-font';
        let styleTag = document.getElementById(id);
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = id;
            document.head.appendChild(styleTag);
        }
        styleTag.textContent = `h1,h2,h3,h4,h5,h6{font-family:${config.fonts.heading},'Plus Jakarta Sans',Inter,system-ui,sans-serif;}`;
    }
    
    // Update footer company name
    const footerCompanyNames = document.querySelectorAll('#footerCompanyName, #footerCompanyNameBottom');
    footerCompanyNames.forEach(element => {
        if (element) {
            element.textContent = config.companyName;
        }
    });
    
    // Update hero title if exists
    const heroTitle = document.getElementById('heroTitle');
    if (heroTitle) {
        heroTitle.textContent = `${config.companyName} - Your Trusted Freight Partner`;
    }

    const heroSubtitle = document.getElementById('heroSubtitle');
    if (heroSubtitle) {
        heroSubtitle.textContent = (config.general?.tagline || 'Connect with verified carriers across the UK').trim();
    }

    const socialIcons = document.querySelectorAll('.social-icons a');
    if (socialIcons.length) {
        const facebook = (config.general?.socialFacebook || '').trim();
        const x = (config.general?.socialX || '').trim();
        const linkedin = (config.general?.socialLinkedIn || '').trim();
        if (socialIcons[0]) socialIcons[0].href = facebook || '#';
        if (socialIcons[1]) socialIcons[1].href = x || '#';
        if (socialIcons[2]) socialIcons[2].href = linkedin || '#';
    }
    
    console.log('Tenant styles applied:', config.companyName);
}

/**
 * 4. Route to tenant page
 * Keeps tenant context in URL and loads appropriate tenant page
 * Preserves tenantId in session
 */
function routeToTenantPage(path) {
    const tenantInfo = detectTenantFromURL();
    
    if (!tenantInfo) {
        console.warn('No tenant detected, cannot route to tenant page');
        return;
    }
    
    // Store tenantId in sessionStorage for API calls
    sessionStorage.setItem('tenantId', tenantInfo.tenantId);
    sessionStorage.setItem('tenantType', tenantInfo.type);
    
    // Construct URL with tenant context
    let baseUrl = '';
    if (tenantInfo.type === 'subdomain') {
        baseUrl = `https://${tenantInfo.tenantId}.alphafreightuk.com`;
    } else {
        baseUrl = `https://${tenantInfo.domain}`;
    }
    
    // Navigate to tenant page
    const fullPath = path.startsWith('/') ? path : `/${path}`;
    window.location.href = `${baseUrl}${fullPath}`;
}

/**
 * 5. Handle custom domain
 * Verifies domain ownership and sets up SSL redirects
 */
async function handleCustomDomain(domain) {
    try {
        // Backend API call to verify domain ownership
        const response = await fetch('/api/tenant/verify-domain', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                domain: domain,
                tenantId: sessionStorage.getItem('tenantId')
            })
        });
        
        if (!response.ok) {
            throw new Error('Domain verification failed');
        }
        
        const result = await response.json();
        
        if (result.verified) {
            // Domain is verified, set up SSL redirects
            // Backend handles SSL certificate provisioning
            console.log('Domain verified:', domain);
            
            // Update tenant config with custom domain
            return {
                success: true,
                domain: domain,
                sslStatus: result.sslStatus || 'pending',
                dnsInstructions: result.dnsInstructions || []
            };
        } else {
            return {
                success: false,
                message: 'Domain verification failed. Please check DNS settings.',
                dnsInstructions: result.dnsInstructions || []
            };
        }
    } catch (error) {
        console.error('Error handling custom domain:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * Initialize tenant routing on page load
 * Automatically detects tenant and applies branding
 */
async function initTenantRouting() {
    // Detect tenant from URL
    const tenantInfo = detectTenantFromURL();
    
    if (!tenantInfo) {
        // Not a tenant page, use default Alpha Freight branding
        console.log('No tenant detected, using default branding');
        return;
    }
    
    // Store tenant info
    sessionStorage.setItem('tenantId', tenantInfo.tenantId);
    sessionStorage.setItem('tenantType', tenantInfo.type);
    
    // Load tenant configuration
    const config = await loadTenantConfig(tenantInfo.tenantId);
    
    if (!config) {
        // Tenant not found
        console.error('Tenant not found:', tenantInfo.tenantId);
        
        // Show error message or redirect
        if (document.body) {
            document.body.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; flex-direction: column; gap: 1rem; padding: 2rem;">
                    <h1 style="font-size: 2rem; font-weight: 700;">Platform Not Found</h1>
                    <p style="color: #6b7280;">The platform you're looking for doesn't exist or has been suspended.</p>
                    <a href="/pages/white-label.html" style="color: #635bff; text-decoration: none; font-weight: 600;">Back to Home</a>
                </div>
            `;
        }
        return;
    }
    
    // Check tenant status
    if (config.status === 'pending') {
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; flex-direction: column; gap: 1rem; padding: 2rem;">
                <h1 style="font-size: 2rem; font-weight: 700;">Platform Setup In Progress</h1>
                <p style="color: #6b7280;">Your platform is being configured. You'll receive an email when it's ready.</p>
            </div>
        `;
        return;
    }
    
    if (config.status === 'suspended') {
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; flex-direction: column; gap: 1rem; padding: 2rem;">
                <h1 style="font-size: 2rem; font-weight: 700;">Platform Suspended</h1>
                <p style="color: #6b7280;">Your platform has been suspended. Please contact support.</p>
            </div>
        `;
        return;
    }
    
    // Apply tenant branding
    applyTenantStyles(config);
    
    // Store config globally for use in other scripts
    window.tenantConfig = config;
    window.tenantId = config.tenantId;
    
    // Update API endpoints to include tenant context
    updateAPIEndpoints(config.tenantId);
    
    console.log('Tenant routing initialized:', config.companyName);
}

/**
 * Update API endpoints to include tenant context
 * Intercepts fetch calls and adds tenant header
 */
function updateAPIEndpoints(tenantId) {
    const originalFetch = window.fetch;
    
    window.fetch = async function(url, options = {}) {
        // Add tenant header to all API requests
        if (url.startsWith('/api/tenant/') || url.includes('/api/tenant/')) {
            options.headers = {
                ...options.headers,
                'X-Tenant-ID': tenantId,
                'Content-Type': 'application/json'
            };
        }
        
        return originalFetch(url, options);
    };
}

// Auto-initialize on page load if this is a tenant page
if (typeof window !== 'undefined') {
    // Check if current page is a tenant page
    const isTenantPage = window.location.pathname.includes('tenant-') || 
                        window.location.pathname.includes('/tenant/') ||
                        detectTenantFromURL() !== null;
    
    if (isTenantPage) {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initTenantRouting);
        } else {
            initTenantRouting();
        }
    }
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        detectTenantFromURL,
        loadTenantConfig,
        applyTenantStyles,
        routeToTenantPage,
        handleCustomDomain,
        initTenantRouting
    };
}

// Usage Example:
/*
// 1. Detect tenant
const tenantInfo = detectTenantFromURL();
console.log(tenantInfo); // { type: 'subdomain', tenantId: 'swift', domain: 'swift.alphafreightuk.com' }

// 2. Load config
const config = await loadTenantConfig('swift');
console.log(config); // { companyName: 'Swift Logistics', colors: {...}, logo: {...} }

// 3. Apply styles
applyTenantStyles(config);

// 4. Route to tenant page
routeToTenantPage('tenant-loads.html');

// 5. Handle custom domain
const result = await handleCustomDomain('swiftlogistics.com');
console.log(result); // { success: true, domain: 'swiftlogistics.com', sslStatus: 'active' }
*/
