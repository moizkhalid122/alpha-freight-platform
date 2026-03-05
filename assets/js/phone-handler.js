(function (window) {
    'use strict';

    // Country to phone code mapping
    const countryPhoneCodeMap = {
        'UK': '+44', 'GB': '+44',
        'US': '+1', 'USA': '+1', 'CA': '+1', 'Canada': '+1',
        'DE': '+49', 'Germany': '+49',
        'FR': '+33', 'France': '+33',
        'IT': '+39', 'Italy': '+39',
        'ES': '+34', 'Spain': '+34',
        'NL': '+31', 'Netherlands': '+31',
        'BE': '+32', 'Belgium': '+32',
        'AT': '+43', 'Austria': '+43',
        'PT': '+351', 'Portugal': '+351',
        'IE': '+353', 'Ireland': '+353',
        'PL': '+48', 'Poland': '+48',
        'SE': '+46', 'Sweden': '+46',
        'NO': '+47', 'Norway': '+47',
        'DK': '+45', 'Denmark': '+45',
        'CH': '+41', 'Switzerland': '+41',
        'FI': '+358', 'Finland': '+358',
        'GR': '+30', 'Greece': '+30',
        'RO': '+40', 'Romania': '+40',
        'UA': '+380', 'Ukraine': '+380',
        'TR': '+90', 'Turkey': '+90',
        'RU': '+7', 'Russia': '+7',
        'AU': '+61', 'Australia': '+61',
        'NZ': '+64', 'New Zealand': '+64',
        'JP': '+81', 'Japan': '+81',
        'CN': '+86', 'China': '+86',
        'IN': '+91', 'India': '+91',
        'PK': '+92', 'Pakistan': '+92',
        'BD': '+880', 'Bangladesh': '+880',
        'SA': '+966', 'Saudi Arabia': '+966',
        'AE': '+971', 'UAE': '+971',
        'SG': '+65', 'Singapore': '+65',
        'MY': '+60', 'Malaysia': '+60',
        'TH': '+66', 'Thailand': '+66',
        'PH': '+63', 'Philippines': '+63',
        'ID': '+62', 'Indonesia': '+62',
        'VN': '+84', 'Vietnam': '+84',
        'KR': '+82', 'South Korea': '+82',
        'BR': '+55', 'Brazil': '+55',
        'MX': '+52', 'Mexico': '+52',
        'AR': '+54', 'Argentina': '+54',
        'ZA': '+27', 'South Africa': '+27',
        'EG': '+20', 'Egypt': '+20',
        'NG': '+234', 'Nigeria': '+234',
        'KE': '+254', 'Kenya': '+254'
    };

    // Phone number validation patterns by country code
    const phoneValidationPatterns = {
        '+44': { min: 10, max: 10, pattern: /^[0-9]{10}$/, example: '7123456789' }, // UK
        '+1': { min: 10, max: 10, pattern: /^[0-9]{10}$/, example: '5551234567' }, // US/Canada
        '+49': { min: 10, max: 11, pattern: /^[0-9]{10,11}$/, example: '15123456789' }, // Germany
        '+33': { min: 9, max: 9, pattern: /^[0-9]{9}$/, example: '612345678' }, // France
        '+39': { min: 9, max: 10, pattern: /^[0-9]{9,10}$/, example: '3123456789' }, // Italy
        '+34': { min: 9, max: 9, pattern: /^[0-9]{9}$/, example: '612345678' }, // Spain
        '+31': { min: 9, max: 9, pattern: /^[0-9]{9}$/, example: '612345678' }, // Netherlands
        '+32': { min: 9, max: 9, pattern: /^[0-9]{9}$/, example: '471234567' }, // Belgium
        '+43': { min: 10, max: 13, pattern: /^[0-9]{10,13}$/, example: '664123456' }, // Austria
        '+351': { min: 9, max: 9, pattern: /^[0-9]{9}$/, example: '912345678' }, // Portugal
        '+353': { min: 9, max: 9, pattern: /^[0-9]{9}$/, example: '851234567' }, // Ireland
        '+48': { min: 9, max: 9, pattern: /^[0-9]{9}$/, example: '512345678' }, // Poland
        '+971': { min: 9, max: 9, pattern: /^[0-9]{9}$/, example: '501234567' }, // UAE
        '+61': { min: 9, max: 9, pattern: /^[0-9]{9}$/, example: '412345678' }, // Australia
        '+91': { min: 10, max: 10, pattern: /^[0-9]{10}$/, example: '9876543210' } // India
    };

    /**
     * Get phone country code for a country
     * @param {string} countryCode - Country code
     * @returns {string} Phone country code (e.g., '+44')
     */
    function getPhoneCodeByCountry(countryCode) {
        if (!countryCode) return '+44'; // Default to UK
        return countryPhoneCodeMap[countryCode] || countryPhoneCodeMap['UK'] || '+44';
    }

    /**
     * Format phone number according to country's format
     * @param {string} phoneNumber - Phone number (without country code)
     * @param {string} countryCode - Country code
     * @returns {string} Formatted phone number
     */
    function formatPhoneNumber(phoneNumber, countryCode) {
        if (!phoneNumber) return '';
        
        // Remove all non-digit characters
        const digits = phoneNumber.replace(/\D/g, '');
        if (!digits) return '';
        
        const phoneCode = getPhoneCodeByCountry(countryCode);
        const pattern = phoneValidationPatterns[phoneCode];
        
        if (!pattern) {
            // Default formatting
            return phoneNumber;
        }
        
        // Format based on country
        switch (phoneCode) {
            case '+44': // UK: 07123 456789
                if (digits.length >= 6) {
                    return digits.substring(0, digits.length - 6) + ' ' + 
                           digits.substring(digits.length - 6, digits.length - 3) + ' ' + 
                           digits.substring(digits.length - 3);
                }
                break;
                
            case '+1': // US/Canada: (555) 123-4567
                if (digits.length === 10) {
                    return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
                }
                break;
                
            case '+49': // Germany: 0151 23456789
                if (digits.length >= 4) {
                    return digits.substring(0, 4) + ' ' + digits.substring(4);
                }
                break;
                
            case '+91': // India: 98765 43210
                if (digits.length === 10) {
                    return digits.substring(0, 5) + ' ' + digits.substring(5);
                }
                break;
                
            default:
                // Default: space every 3-4 digits
                if (digits.length > 3) {
                    return digits.replace(/(\d{3,4})(?=\d)/g, '$1 ');
                }
        }
        
        return digits;
    }

    /**
     * Validate phone number for a country
     * @param {string} phoneNumber - Phone number (without country code)
     * @param {string} countryCode - Country code
     * @returns {object} { valid: boolean, message: string }
     */
    function validatePhoneNumber(phoneNumber, countryCode) {
        if (!phoneNumber || !phoneNumber.trim()) {
            return { valid: false, message: 'Phone number is required' };
        }
        
        // Remove all non-digit characters
        const digits = phoneNumber.replace(/\D/g, '');
        
        if (!digits) {
            return { valid: false, message: 'Phone number must contain digits' };
        }
        
        const phoneCode = getPhoneCodeByCountry(countryCode);
        const pattern = phoneValidationPatterns[phoneCode];
        
        if (!pattern) {
            // Default validation: 7-15 digits
            if (digits.length >= 7 && digits.length <= 15) {
                return { valid: true, message: '' };
            }
            return { valid: false, message: 'Phone number must be 7-15 digits' };
        }
        
        // Validate against pattern
        if (digits.length < pattern.min || digits.length > pattern.max) {
            return { 
                valid: false, 
                message: `Phone number must be ${pattern.min}-${pattern.max} digits` 
            };
        }
        
        if (pattern.pattern && !pattern.pattern.test(digits)) {
            return { valid: false, message: 'Invalid phone number format' };
        }
        
        return { valid: true, message: '' };
    }

    /**
     * Get formatted phone number with country code
     * @param {string} phoneNumber - Phone number (without country code)
     * @param {string} countryCode - Country code
     * @returns {string} Full phone number with country code
     */
    function getFullPhoneNumber(phoneNumber, countryCode) {
        const phoneCode = getPhoneCodeByCountry(countryCode);
        const digits = phoneNumber.replace(/\D/g, '');
        return phoneCode + digits;
    }

    /**
     * Parse full phone number into country code and number
     * @param {string} fullPhoneNumber - Full phone number with country code
     * @returns {object} { countryCode: string, phoneNumber: string, phoneCode: string }
     */
    function parsePhoneNumber(fullPhoneNumber) {
        if (!fullPhoneNumber) return { countryCode: 'UK', phoneNumber: '', phoneCode: '+44' };
        
        // Try to find matching country code
        const codes = Object.keys(countryPhoneCodeMap);
        for (const country of codes) {
            const phoneCode = countryPhoneCodeMap[country];
            if (fullPhoneNumber.startsWith(phoneCode)) {
                const phoneNumber = fullPhoneNumber.substring(phoneCode.length);
                return { countryCode: country, phoneNumber, phoneCode };
            }
        }
        
        // Default
        return { countryCode: 'UK', phoneNumber: fullPhoneNumber, phoneCode: '+44' };
    }

    /**
     * Format phone number for display
     * @param {string} phoneNumber - Phone number
     * @param {string} countryCode - Country code
     * @param {object} options - Formatting options
     * @returns {string} Formatted phone number for display
     */
    function formatPhoneDisplay(phoneNumber, countryCode, options = {}) {
        const phoneCode = getPhoneCodeByCountry(countryCode);
        const formatted = formatPhoneNumber(phoneNumber, countryCode);
        
        if (options.showCountryCode !== false) {
            return `${phoneCode} ${formatted}`;
        }
        
        return formatted;
    }

    // Export to window
    window.PhoneHandler = {
        getPhoneCodeByCountry,
        formatPhoneNumber,
        validatePhoneNumber,
        getFullPhoneNumber,
        parsePhoneNumber,
        formatPhoneDisplay,
        countryPhoneCodeMap,
        phoneValidationPatterns
    };

})(window);

