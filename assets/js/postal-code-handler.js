(function (window) {
    'use strict';

    // Postal code validation patterns by country
    const postalCodePatterns = {
        'UK': { 
            pattern: /^[A-Z]{1,2}[0-9R][0-9A-Z]?\s?[0-9][ABD-HJLNP-UW-Z]{2}$/i,
            example: 'SW1A 1AA',
            message: 'UK postcode (e.g., SW1A 1AA)'
        },
        'US': { 
            pattern: /^[0-9]{5}(-[0-9]{4})?$/,
            example: '10001 or 10001-1234',
            message: 'US ZIP code (5 digits or ZIP+4)'
        },
        'USA': { 
            pattern: /^[0-9]{5}(-[0-9]{4})?$/,
            example: '10001 or 10001-1234',
            message: 'US ZIP code (5 digits or ZIP+4)'
        },
        'CA': { 
            pattern: /^[A-Z][0-9][A-Z]\s?[0-9][A-Z][0-9]$/i,
            example: 'K1A 0B1',
            message: 'Canadian postal code (e.g., K1A 0B1)'
        },
        'Canada': { 
            pattern: /^[A-Z][0-9][A-Z]\s?[0-9][A-Z][0-9]$/i,
            example: 'K1A 0B1',
            message: 'Canadian postal code (e.g., K1A 0B1)'
        },
        'DE': { 
            pattern: /^[0-9]{5}$/,
            example: '10115',
            message: 'German postal code (5 digits)'
        },
        'Germany': { 
            pattern: /^[0-9]{5}$/,
            example: '10115',
            message: 'German postal code (5 digits)'
        },
        'FR': { 
            pattern: /^[0-9]{5}$/,
            example: '75001',
            message: 'French postal code (5 digits)'
        },
        'France': { 
            pattern: /^[0-9]{5}$/,
            example: '75001',
            message: 'French postal code (5 digits)'
        },
        'IT': { 
            pattern: /^[0-9]{5}$/,
            example: '00118',
            message: 'Italian postal code (5 digits)'
        },
        'Italy': { 
            pattern: /^[0-9]{5}$/,
            example: '00118',
            message: 'Italian postal code (5 digits)'
        },
        'ES': { 
            pattern: /^[0-9]{5}$/,
            example: '28001',
            message: 'Spanish postal code (5 digits)'
        },
        'Spain': { 
            pattern: /^[0-9]{5}$/,
            example: '28001',
            message: 'Spanish postal code (5 digits)'
        },
        'NL': { 
            pattern: /^[0-9]{4}\s?[A-Z]{2}$/i,
            example: '1012 AB',
            message: 'Dutch postal code (e.g., 1012 AB)'
        },
        'Netherlands': { 
            pattern: /^[0-9]{4}\s?[A-Z]{2}$/i,
            example: '1012 AB',
            message: 'Dutch postal code (e.g., 1012 AB)'
        },
        'PL': { 
            pattern: /^[0-9]{2}-[0-9]{3}$/,
            example: '00-001',
            message: 'Polish postal code (e.g., 00-001)'
        },
        'Poland': { 
            pattern: /^[0-9]{2}-[0-9]{3}$/,
            example: '00-001',
            message: 'Polish postal code (e.g., 00-001)'
        },
        'AU': { 
            pattern: /^[0-9]{4}$/,
            example: '2000',
            message: 'Australian postcode (4 digits)'
        },
        'Australia': { 
            pattern: /^[0-9]{4}$/,
            example: '2000',
            message: 'Australian postcode (4 digits)'
        },
        'IN': { 
            pattern: /^[0-9]{6}$/,
            example: '110001',
            message: 'Indian PIN code (6 digits)'
        },
        'India': { 
            pattern: /^[0-9]{6}$/,
            example: '110001',
            message: 'Indian PIN code (6 digits)'
        },
        'AE': { 
            pattern: /^[0-9]{5}$/,
            example: '00000',
            message: 'UAE postal code (optional, 5 digits if provided)'
        },
        'UAE': { 
            pattern: /^[0-9]{5}$/,
            example: '00000',
            message: 'UAE postal code (optional, 5 digits if provided)'
        },
        'SA': { 
            pattern: /^[0-9]{5}(-[0-9]{4})?$/,
            example: '11564',
            message: 'Saudi postal code (5 digits)'
        },
        'Saudi Arabia': { 
            pattern: /^[0-9]{5}(-[0-9]{4})?$/,
            example: '11564',
            message: 'Saudi postal code (5 digits)'
        }
    };

    /**
     * Validate postal code for a country
     * @param {string} postalCode - Postal code to validate
     * @param {string} countryCode - Country code
     * @returns {object} { valid: boolean, message: string }
     */
    function validatePostalCode(postalCode, countryCode) {
        if (!postalCode || !postalCode.trim()) {
            return { valid: false, message: 'Postal code is required' };
        }
        
        const trimmed = postalCode.trim();
        const pattern = postalCodePatterns[countryCode];
        
        if (!pattern) {
            // Default: accept alphanumeric 3-10 characters
            if (trimmed.length >= 3 && trimmed.length <= 10) {
                return { valid: true, message: '' };
            }
            return { valid: false, message: 'Postal code must be 3-10 characters' };
        }
        
        if (!pattern.pattern.test(trimmed)) {
            return { valid: false, message: `Invalid format. ${pattern.message}` };
        }
        
        return { valid: true, message: '' };
    }

    /**
     * Format postal code according to country format
     * @param {string} postalCode - Postal code to format
     * @param {string} countryCode - Country code
     * @returns {string} Formatted postal code
     */
    function formatPostalCode(postalCode, countryCode) {
        if (!postalCode) return '';
        
        const trimmed = postalCode.trim().toUpperCase();
        const pattern = postalCodePatterns[countryCode];
        
        if (!pattern) return trimmed;
        
        // Format based on country
        switch (countryCode) {
            case 'UK':
            case 'GB':
                // UK: Convert to standard format (SW1A 1AA)
                const ukMatch = trimmed.replace(/\s+/g, '').match(/^([A-Z]{1,2}[0-9R][0-9A-Z]?)([0-9][ABD-HJLNP-UW-Z]{2})$/i);
                if (ukMatch) {
                    return ukMatch[1] + ' ' + ukMatch[2].toUpperCase();
                }
                break;
                
            case 'CA':
            case 'Canada':
                // Canada: K1A 0B1
                const caMatch = trimmed.replace(/\s+/g, '').match(/^([A-Z][0-9][A-Z])([0-9][A-Z][0-9])$/i);
                if (caMatch) {
                    return caMatch[1].toUpperCase() + ' ' + caMatch[2].toUpperCase();
                }
                break;
                
            case 'NL':
            case 'Netherlands':
                // Netherlands: 1012 AB
                const nlMatch = trimmed.replace(/\s+/g, '').match(/^([0-9]{4})([A-Z]{2})$/i);
                if (nlMatch) {
                    return nlMatch[1] + ' ' + nlMatch[2].toUpperCase();
                }
                break;
                
            case 'PL':
            case 'Poland':
                // Poland: 00-001
                const plMatch = trimmed.replace(/[-\s]/g, '').match(/^([0-9]{2})([0-9]{3})$/);
                if (plMatch) {
                    return plMatch[1] + '-' + plMatch[2];
                }
                break;
        }
        
        return trimmed;
    }

    /**
     * Get example postal code for a country
     * @param {string} countryCode - Country code
     * @returns {string} Example postal code
     */
    function getPostalCodeExample(countryCode) {
        const pattern = postalCodePatterns[countryCode];
        return pattern ? pattern.example : '12345';
    }

    /**
     * Get postal code format message for a country
     * @param {string} countryCode - Country code
     * @returns {string} Format message
     */
    function getPostalCodeFormatMessage(countryCode) {
        const pattern = postalCodePatterns[countryCode];
        return pattern ? pattern.message : 'Postal code';
    }

    // Export to window
    window.PostalCodeHandler = {
        validatePostalCode,
        formatPostalCode,
        getPostalCodeExample,
        getPostalCodeFormatMessage,
        postalCodePatterns
    };

})(window);

