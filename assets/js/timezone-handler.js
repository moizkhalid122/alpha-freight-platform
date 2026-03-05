(function (window) {
    'use strict';

    // Country to Timezone mapping
    const countryTimezoneMap = {
        'UK': 'Europe/London',
        'USA': 'America/New_York',
        'US': 'America/New_York',
        'CA': 'America/Toronto',
        'Canada': 'America/Toronto',
        'DE': 'Europe/Berlin',
        'Germany': 'Europe/Berlin',
        'FR': 'Europe/Paris',
        'France': 'Europe/Paris',
        'IT': 'Europe/Rome',
        'Italy': 'Europe/Rome',
        'ES': 'Europe/Madrid',
        'Spain': 'Europe/Madrid',
        'PL': 'Europe/Warsaw',
        'Poland': 'Europe/Warsaw',
        'RO': 'Europe/Bucharest',
        'Romania': 'Europe/Bucharest',
        'UA': 'Europe/Kyiv',
        'Ukraine': 'Europe/Kyiv',
        'TR': 'Europe/Istanbul',
        'Turkey': 'Europe/Istanbul',
        'RU': 'Europe/Moscow',
        'Russia': 'Europe/Moscow',
        'NL': 'Europe/Amsterdam',
        'Netherlands': 'Europe/Amsterdam',
        'BE': 'Europe/Brussels',
        'Belgium': 'Europe/Brussels',
        'AT': 'Europe/Vienna',
        'Austria': 'Europe/Vienna',
        'CH': 'Europe/Zurich',
        'Switzerland': 'Europe/Zurich',
        'SE': 'Europe/Stockholm',
        'Sweden': 'Europe/Stockholm',
        'NO': 'Europe/Oslo',
        'Norway': 'Europe/Oslo',
        'DK': 'Europe/Copenhagen',
        'Denmark': 'Europe/Copenhagen',
        'FI': 'Europe/Helsinki',
        'Finland': 'Europe/Helsinki',
        'PT': 'Europe/Lisbon',
        'Portugal': 'Europe/Lisbon',
        'GR': 'Europe/Athens',
        'Greece': 'Europe/Athens',
        'IE': 'Europe/Dublin',
        'Ireland': 'Europe/Dublin',
        'AU': 'Australia/Sydney',
        'Australia': 'Australia/Sydney',
        'NZ': 'Pacific/Auckland',
        'New Zealand': 'Pacific/Auckland',
        'JP': 'Asia/Tokyo',
        'Japan': 'Asia/Tokyo',
        'CN': 'Asia/Shanghai',
        'China': 'Asia/Shanghai',
        'IN': 'Asia/Kolkata',
        'India': 'Asia/Kolkata',
        'PK': 'Asia/Karachi',
        'Pakistan': 'Asia/Karachi',
        'BD': 'Asia/Dhaka',
        'Bangladesh': 'Asia/Dhaka',
        'SA': 'Asia/Riyadh',
        'Saudi Arabia': 'Asia/Riyadh',
        'AE': 'Asia/Dubai',
        'UAE': 'Asia/Dubai',
        'SG': 'Asia/Singapore',
        'Singapore': 'Asia/Singapore',
        'MY': 'Asia/Kuala_Lumpur',
        'Malaysia': 'Asia/Kuala_Lumpur',
        'TH': 'Asia/Bangkok',
        'Thailand': 'Asia/Bangkok',
        'PH': 'Asia/Manila',
        'Philippines': 'Asia/Manila',
        'ID': 'Asia/Jakarta',
        'Indonesia': 'Asia/Jakarta',
        'VN': 'Asia/Ho_Chi_Minh',
        'Vietnam': 'Asia/Ho_Chi_Minh',
        'KR': 'Asia/Seoul',
        'South Korea': 'Asia/Seoul',
        'BR': 'America/Sao_Paulo',
        'Brazil': 'America/Sao_Paulo',
        'MX': 'America/Mexico_City',
        'Mexico': 'America/Mexico_City',
        'AR': 'America/Argentina/Buenos_Aires',
        'Argentina': 'America/Argentina/Buenos_Aires',
        'ZA': 'Africa/Johannesburg',
        'South Africa': 'Africa/Johannesburg',
        'EG': 'Africa/Cairo',
        'Egypt': 'Africa/Cairo',
        'NG': 'Africa/Lagos',
        'Nigeria': 'Africa/Lagos',
        'KE': 'Africa/Nairobi',
        'Kenya': 'Africa/Nairobi'
    };

    /**
     * Get timezone for a country
     * @param {string} countryCode - Country code or name
     * @returns {string} IANA timezone string
     */
    function getTimezoneByCountry(countryCode) {
        if (!countryCode) {
            // Try to detect from browser
            return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/London';
        }
        return countryTimezoneMap[countryCode] || countryTimezoneMap['UK'] || 'Europe/London';
    }

    /**
     * Format date/time according to user's locale and timezone
     * @param {Date|string|number} dateInput - Date to format
     * @param {string} countryCode - User's country code
     * @param {object} options - Formatting options
     * @returns {string} Formatted date/time string
     */
    function formatDateTime(dateInput, countryCode, options = {}) {
        if (!dateInput) return '';
        
        const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
        if (isNaN(date.getTime())) return '';

        const timezone = getTimezoneByCountry(countryCode);
        const locale = options.locale || 'en-GB';
        
        const formatOptions = {
            timeZone: timezone,
            ...options
        };

        // Default format options
        if (!options.dateStyle && !options.timeStyle && !options.year && !options.month) {
            formatOptions.year = 'numeric';
            formatOptions.month = 'short';
            formatOptions.day = 'numeric';
            if (options.includeTime) {
                formatOptions.hour = '2-digit';
                formatOptions.minute = '2-digit';
            }
        }

        try {
            return new Intl.DateTimeFormat(locale, formatOptions).format(date);
        } catch (error) {
            console.warn('Timezone formatting error:', error);
            return date.toLocaleString(locale);
        }
    }

    /**
     * Format date only (no time)
     * @param {Date|string|number} dateInput - Date to format
     * @param {string} countryCode - User's country code
     * @param {object} options - Formatting options
     * @returns {string} Formatted date string
     */
    function formatDate(dateInput, countryCode, options = {}) {
        return formatDateTime(dateInput, countryCode, {
            ...options,
            dateStyle: options.dateStyle || 'medium',
            includeTime: false
        });
    }

    /**
     * Format time only (no date)
     * @param {Date|string|number} dateInput - Date to format
     * @param {string} countryCode - User's country code
     * @param {object} options - Formatting options
     * @returns {string} Formatted time string
     */
    function formatTime(dateInput, countryCode, options = {}) {
        return formatDateTime(dateInput, countryCode, {
            ...options,
            timeStyle: options.timeStyle || 'short',
            includeTime: true
        });
    }

    /**
     * Get relative time (e.g., "2 hours ago", "in 3 days")
     * @param {Date|string|number} dateInput - Date to format
     * @param {string} countryCode - User's country code
     * @param {string} locale - Locale code
     * @returns {string} Relative time string
     */
    function formatRelativeTime(dateInput, countryCode, locale = 'en') {
        if (!dateInput) return '';
        
        const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
        if (isNaN(date.getTime())) return '';

        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        try {
            const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
            
            if (Math.abs(diffDays) > 7) {
                return formatDate(dateInput, countryCode, { dateStyle: 'short' });
            } else if (Math.abs(diffDays) > 0) {
                return rtf.format(diffDays, 'day');
            } else if (Math.abs(diffHours) > 0) {
                return rtf.format(diffHours, 'hour');
            } else if (Math.abs(diffMinutes) > 0) {
                return rtf.format(diffMinutes, 'minute');
            } else {
                return rtf.format(diffSeconds, 'second');
            }
        } catch (error) {
            // Fallback for browsers without RelativeTimeFormat
            if (Math.abs(diffDays) > 7) {
                return formatDate(dateInput, countryCode);
            } else if (Math.abs(diffDays) > 0) {
                return `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} ${diffDays > 0 ? 'ago' : 'from now'}`;
            } else if (Math.abs(diffHours) > 0) {
                return `${Math.abs(diffHours)} hour${Math.abs(diffHours) > 1 ? 's' : ''} ${diffHours > 0 ? 'ago' : 'from now'}`;
            } else if (Math.abs(diffMinutes) > 0) {
                return `${Math.abs(diffMinutes)} minute${Math.abs(diffMinutes) > 1 ? 's' : ''} ${diffMinutes > 0 ? 'ago' : 'from now'}`;
            } else {
                return 'just now';
            }
        }
    }

    /**
     * Convert UTC date to user's local timezone
     * @param {Date|string|number} utcDate - UTC date
     * @param {string} countryCode - User's country code
     * @returns {Date} Date in user's timezone
     */
    function convertToLocalTime(utcDate, countryCode) {
        if (!utcDate) return new Date();
        
        const date = utcDate instanceof Date ? utcDate : new Date(utcDate);
        if (isNaN(date.getTime())) return new Date();

        const timezone = getTimezoneByCountry(countryCode);
        
        // Get timezone offset
        const utcTime = date.getTime();
        const localTime = new Date(utcTime);
        
        // Format in target timezone and parse back
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        
        const parts = formatter.formatToParts(date);
        const localDate = new Date(
            parseInt(parts.find(p => p.type === 'year').value),
            parseInt(parts.find(p => p.type === 'month').value) - 1,
            parseInt(parts.find(p => p.type === 'day').value),
            parseInt(parts.find(p => p.type === 'hour').value),
            parseInt(parts.find(p => p.type === 'minute').value),
            parseInt(parts.find(p => p.type === 'second').value)
        );
        
        return localDate;
    }

    /**
     * Get current time in user's timezone
     * @param {string} countryCode - User's country code
     * @returns {Date} Current date/time in user's timezone
     */
    function getCurrentLocalTime(countryCode) {
        return convertToLocalTime(new Date(), countryCode);
    }

    // Export to window
    window.TimezoneHandler = {
        getTimezoneByCountry,
        formatDateTime,
        formatDate,
        formatTime,
        formatRelativeTime,
        convertToLocalTime,
        getCurrentLocalTime
    };

})(window);

