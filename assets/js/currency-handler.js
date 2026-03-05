/**
 * Currency Handler - Alpha Freight
 * Global Currency Support System
 * 
 * Handles currency formatting, conversion, and country-based currency selection
 */

// Country to Currency Mapping
const COUNTRY_CURRENCY_MAP = {
    // Major Countries
    'US': { code: 'USD', symbol: '$', name: 'US Dollar', position: 'before' },
    'UK': { code: 'GBP', symbol: '£', name: 'British Pound', position: 'before' },
    'CA': { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', position: 'before' },
    'AU': { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', position: 'before' },
    'NZ': { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', position: 'before' },
    
    // European Countries
    'DE': { code: 'EUR', symbol: '€', name: 'Euro', position: 'before' },
    'FR': { code: 'EUR', symbol: '€', name: 'Euro', position: 'before' },
    'IT': { code: 'EUR', symbol: '€', name: 'Euro', position: 'before' },
    'ES': { code: 'EUR', symbol: '€', name: 'Euro', position: 'before' },
    'NL': { code: 'EUR', symbol: '€', name: 'Euro', position: 'before' },
    'BE': { code: 'EUR', symbol: '€', name: 'Euro', position: 'before' },
    'AT': { code: 'EUR', symbol: '€', name: 'Euro', position: 'before' },
    'PT': { code: 'EUR', symbol: '€', name: 'Euro', position: 'before' },
    'IE': { code: 'EUR', symbol: '€', name: 'Euro', position: 'before' },
    'GR': { code: 'EUR', symbol: '€', name: 'Euro', position: 'before' },
    'FI': { code: 'EUR', symbol: '€', name: 'Euro', position: 'before' },
    'PL': { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', position: 'after' },
    'CZ': { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', position: 'after' },
    'SE': { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', position: 'after' },
    'NO': { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', position: 'after' },
    'DK': { code: 'DKK', symbol: 'kr', name: 'Danish Krone', position: 'after' },
    'CH': { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', position: 'before' },
    
    // Middle East
    'AE': { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', position: 'before' },
    'SA': { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', position: 'before' },
    'QA': { code: 'QAR', symbol: '﷼', name: 'Qatari Riyal', position: 'before' },
    'KW': { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar', position: 'before' },
    'BH': { code: 'BHD', symbol: '.د.ب', name: 'Bahraini Dinar', position: 'before' },
    'OM': { code: 'OMR', symbol: '﷼', name: 'Omani Rial', position: 'before' },
    'JO': { code: 'JOD', symbol: 'د.ا', name: 'Jordanian Dinar', position: 'before' },
    'LB': { code: 'LBP', symbol: '£', name: 'Lebanese Pound', position: 'before' },
    'EG': { code: 'EGP', symbol: '£', name: 'Egyptian Pound', position: 'before' },
    'IL': { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', position: 'before' },
    'TR': { code: 'TRY', symbol: '₺', name: 'Turkish Lira', position: 'before' },
    
    // Asia
    'IN': { code: 'INR', symbol: '₹', name: 'Indian Rupee', position: 'before' },
    'PK': { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', position: 'before' },
    'BD': { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', position: 'before' },
    'CN': { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', position: 'before' },
    'JP': { code: 'JPY', symbol: '¥', name: 'Japanese Yen', position: 'before' },
    'KR': { code: 'KRW', symbol: '₩', name: 'South Korean Won', position: 'before' },
    'SG': { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', position: 'before' },
    'MY': { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', position: 'before' },
    'TH': { code: 'THB', symbol: '฿', name: 'Thai Baht', position: 'before' },
    'ID': { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', position: 'before' },
    'PH': { code: 'PHP', symbol: '₱', name: 'Philippine Peso', position: 'before' },
    'VN': { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', position: 'after' },
    'HK': { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', position: 'before' },
    'TW': { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar', position: 'before' },
    
    // Africa
    'ZA': { code: 'ZAR', symbol: 'R', name: 'South African Rand', position: 'before' },
    'NG': { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', position: 'before' },
    'KE': { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', position: 'before' },
    'GH': { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', position: 'before' },
    
    // South America
    'BR': { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', position: 'before' },
    'MX': { code: 'MXN', symbol: '$', name: 'Mexican Peso', position: 'before' },
    'AR': { code: 'ARS', symbol: '$', name: 'Argentine Peso', position: 'before' },
    'CL': { code: 'CLP', symbol: '$', name: 'Chilean Peso', position: 'before' },
    'CO': { code: 'COP', symbol: '$', name: 'Colombian Peso', position: 'before' },
    'PE': { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', position: 'before' },
    
    // Default fallback
    'DEFAULT': { code: 'USD', symbol: '$', name: 'US Dollar', position: 'before' }
};

// Currency Handler Object
const CurrencyHandler = {
    /**
     * Get currency info for a country
     * @param {string} countryCode - Country code (e.g., 'US', 'UK', 'IN')
     * @returns {object} Currency information
     */
    getCurrencyByCountry(countryCode) {
        if (!countryCode) {
            return COUNTRY_CURRENCY_MAP['DEFAULT'];
        }
        
        const upperCode = countryCode.toUpperCase().trim();
        return COUNTRY_CURRENCY_MAP[upperCode] || COUNTRY_CURRENCY_MAP['DEFAULT'];
    },

    /**
     * Format amount with currency symbol
     * @param {number} amount - Amount to format
     * @param {string} countryCode - Country code
     * @param {object} options - Formatting options
     * @returns {string} Formatted currency string
     */
    formatCurrency(amount, countryCode, options = {}) {
        if (amount === null || amount === undefined || isNaN(amount)) {
            return '0';
        }

        const currency = this.getCurrencyByCountry(countryCode);
        const {
            decimals = 2,
            showSymbol = true,
            showCode = false
        } = options;

        // Format number with decimals
        const formattedAmount = parseFloat(amount).toFixed(decimals);
        
        // Add thousand separators
        const parts = formattedAmount.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        let result = parts.join('.');

        // Add currency symbol
        if (showSymbol) {
            if (currency.position === 'before') {
                result = currency.symbol + result;
            } else {
                result = result + ' ' + currency.symbol;
            }
        }

        // Add currency code if requested
        if (showCode) {
            result += ' (' + currency.code + ')';
        }

        return result;
    },

    /**
     * Get currency symbol for a country
     * @param {string} countryCode - Country code
     * @returns {string} Currency symbol
     */
    getCurrencySymbol(countryCode) {
        const currency = this.getCurrencyByCountry(countryCode);
        return currency.symbol;
    },

    /**
     * Get currency code for a country
     * @param {string} countryCode - Country code
     * @returns {string} Currency code (e.g., 'USD', 'EUR')
     */
    getCurrencyCode(countryCode) {
        const currency = this.getCurrencyByCountry(countryCode);
        return currency.code;
    },

    /**
     * Parse currency string to number
     * @param {string} currencyString - Currency string (e.g., "$1,234.56")
     * @returns {number} Parsed number
     */
    parseCurrency(currencyString) {
        if (!currencyString) return 0;
        
        // Remove currency symbols and spaces
        const cleaned = currencyString
            .replace(/[^\d.,-]/g, '')
            .replace(/,/g, '');
        
        return parseFloat(cleaned) || 0;
    },

    /**
     * Get all supported countries
     * @returns {array} Array of country codes
     */
    getSupportedCountries() {
        return Object.keys(COUNTRY_CURRENCY_MAP).filter(key => key !== 'DEFAULT');
    },

    /**
     * Get all supported currencies
     * @returns {array} Array of unique currency codes
     */
    getSupportedCurrencies() {
        const currencies = new Set();
        Object.values(COUNTRY_CURRENCY_MAP).forEach(currency => {
            currencies.add(currency.code);
        });
        return Array.from(currencies);
    }
};

// Export to window for global access
window.CurrencyHandler = CurrencyHandler;

// Auto-detect user's currency based on browser locale (optional)
if (typeof Intl !== 'undefined') {
    try {
        const userLocale = navigator.language || navigator.userLanguage;
        const localeParts = userLocale.split('-');
        const detectedCountry = localeParts[1] || localeParts[0].toUpperCase();
        
        // Store detected currency (can be used as fallback)
        window.DetectedCurrency = CurrencyHandler.getCurrencyByCountry(detectedCountry);
    } catch (e) {
        console.log('Currency auto-detection not available');
    }
}

console.log('✅ Currency Handler loaded - Global currency support ready');

