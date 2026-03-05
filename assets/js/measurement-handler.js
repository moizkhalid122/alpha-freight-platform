(function (window) {
    'use strict';

    // Countries using metric system
    const metricCountries = [
        'UK', 'DE', 'Germany', 'FR', 'France', 'IT', 'Italy', 'ES', 'Spain',
        'PL', 'Poland', 'RO', 'Romania', 'UA', 'Ukraine', 'TR', 'Turkey',
        'RU', 'Russia', 'NL', 'Netherlands', 'BE', 'Belgium', 'AT', 'Austria',
        'CH', 'Switzerland', 'SE', 'Sweden', 'NO', 'Norway', 'DK', 'Denmark',
        'FI', 'Finland', 'PT', 'Portugal', 'GR', 'Greece', 'IE', 'Ireland',
        'AU', 'Australia', 'NZ', 'New Zealand', 'JP', 'Japan', 'CN', 'China',
        'IN', 'India', 'PK', 'Pakistan', 'BD', 'Bangladesh', 'SA', 'Saudi Arabia',
        'AE', 'UAE', 'SG', 'Singapore', 'MY', 'Malaysia', 'TH', 'Thailand',
        'PH', 'Philippines', 'ID', 'Indonesia', 'VN', 'Vietnam', 'KR', 'South Korea',
        'BR', 'Brazil', 'MX', 'Mexico', 'AR', 'Argentina', 'ZA', 'South Africa',
        'EG', 'Egypt', 'NG', 'Nigeria', 'KE', 'Kenya'
    ];

    // Countries using imperial system (USA, Canada, Liberia, Myanmar)
    const imperialCountries = ['USA', 'US', 'CA', 'Canada'];

    /**
     * Check if country uses metric system
     * @param {string} countryCode - Country code
     * @returns {boolean} True if metric, false if imperial
     */
    function usesMetricSystem(countryCode) {
        if (!countryCode) return true; // Default to metric
        if (imperialCountries.includes(countryCode)) return false;
        return true; // Most countries use metric
    }

    /**
     * Convert weight from kg to lbs or vice versa
     * @param {number} value - Weight value
     * @param {string} fromUnit - Source unit ('kg' or 'lbs')
     * @param {string} toUnit - Target unit ('kg' or 'lbs')
     * @returns {number} Converted weight
     */
    function convertWeight(value, fromUnit, toUnit) {
        if (!value || isNaN(value)) return 0;
        
        const numValue = parseFloat(value);
        
        if (fromUnit === toUnit) return numValue;
        
        if (fromUnit === 'kg' && toUnit === 'lbs') {
            return numValue * 2.20462; // 1 kg = 2.20462 lbs
        } else if (fromUnit === 'lbs' && toUnit === 'kg') {
            return numValue / 2.20462;
        }
        
        return numValue;
    }

    /**
     * Convert distance from km to miles or vice versa
     * @param {number} value - Distance value
     * @param {string} fromUnit - Source unit ('km' or 'miles')
     * @param {string} toUnit - Target unit ('km' or 'miles')
     * @returns {number} Converted distance
     */
    function convertDistance(value, fromUnit, toUnit) {
        if (!value || isNaN(value)) return 0;
        
        const numValue = parseFloat(value);
        
        if (fromUnit === toUnit) return numValue;
        
        if (fromUnit === 'km' && toUnit === 'miles') {
            return numValue * 0.621371; // 1 km = 0.621371 miles
        } else if (fromUnit === 'miles' && toUnit === 'km') {
            return numValue / 0.621371;
        }
        
        return numValue;
    }

    /**
     * Format weight according to country's system
     * @param {number} value - Weight value (assumed in kg)
     * @param {string} countryCode - Country code
     * @param {object} options - Formatting options
     * @returns {string} Formatted weight string
     */
    function formatWeight(value, countryCode, options = {}) {
        if (!value || isNaN(value)) return '0';
        
        const numValue = parseFloat(value);
        const isMetric = usesMetricSystem(countryCode);
        const decimals = options.decimals !== undefined ? options.decimals : 2;
        
        if (isMetric) {
            const formatted = numValue.toFixed(decimals);
            return `${formatted} ${options.unit || 'kg'}`;
        } else {
            const lbs = convertWeight(numValue, 'kg', 'lbs');
            const formatted = lbs.toFixed(decimals);
            return `${formatted} ${options.unit || 'lbs'}`;
        }
    }

    /**
     * Format distance according to country's system
     * @param {number} value - Distance value (assumed in km)
     * @param {string} countryCode - Country code
     * @param {object} options - Formatting options
     * @returns {string} Formatted distance string
     */
    function formatDistance(value, countryCode, options = {}) {
        if (!value || isNaN(value)) return '0';
        
        const numValue = parseFloat(value);
        const isMetric = usesMetricSystem(countryCode);
        const decimals = options.decimals !== undefined ? options.decimals : 2;
        
        if (isMetric) {
            const formatted = numValue.toFixed(decimals);
            return `${formatted} ${options.unit || 'km'}`;
        } else {
            const miles = convertDistance(numValue, 'km', 'miles');
            const formatted = miles.toFixed(decimals);
            return `${formatted} ${options.unit || 'miles'}`;
        }
    }

    /**
     * Get weight unit for country
     * @param {string} countryCode - Country code
     * @returns {string} 'kg' or 'lbs'
     */
    function getWeightUnit(countryCode) {
        return usesMetricSystem(countryCode) ? 'kg' : 'lbs';
    }

    /**
     * Get distance unit for country
     * @param {string} countryCode - Country code
     * @returns {string} 'km' or 'miles'
     */
    function getDistanceUnit(countryCode) {
        return usesMetricSystem(countryCode) ? 'km' : 'miles';
    }

    /**
     * Parse weight input and convert to standard (kg)
     * @param {string|number} input - User input
     * @param {string} countryCode - Country code
     * @returns {number} Weight in kg
     */
    function parseWeightInput(input, countryCode) {
        if (!input) return 0;
        
        const str = String(input).toLowerCase().trim();
        const numValue = parseFloat(str.replace(/[^\d.]/g, ''));
        
        if (isNaN(numValue)) return 0;
        
        // Check if input contains lbs or pounds
        if (str.includes('lb') || str.includes('pound')) {
            return convertWeight(numValue, 'lbs', 'kg');
        }
        
        // If country uses imperial, assume input is in lbs
        if (!usesMetricSystem(countryCode)) {
            return convertWeight(numValue, 'lbs', 'kg');
        }
        
        // Otherwise assume kg
        return numValue;
    }

    /**
     * Parse distance input and convert to standard (km)
     * @param {string|number} input - User input
     * @param {string} countryCode - Country code
     * @returns {number} Distance in km
     */
    function parseDistanceInput(input, countryCode) {
        if (!input) return 0;
        
        const str = String(input).toLowerCase().trim();
        const numValue = parseFloat(str.replace(/[^\d.]/g, ''));
        
        if (isNaN(numValue)) return 0;
        
        // Check if input contains miles
        if (str.includes('mile')) {
            return convertDistance(numValue, 'miles', 'km');
        }
        
        // If country uses imperial, assume input is in miles
        if (!usesMetricSystem(countryCode)) {
            return convertDistance(numValue, 'miles', 'km');
        }
        
        // Otherwise assume km
        return numValue;
    }

    // Export to window
    window.MeasurementHandler = {
        usesMetricSystem,
        convertWeight,
        convertDistance,
        formatWeight,
        formatDistance,
        getWeightUnit,
        getDistanceUnit,
        parseWeightInput,
        parseDistanceInput
    };

})(window);

