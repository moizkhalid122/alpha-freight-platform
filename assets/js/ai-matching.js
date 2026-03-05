/**
 * AI-Powered Matching System
 * Automatically matches loads with carriers based on multiple factors
 * 
 * Factors considered:
 * - Location proximity (pickup/delivery)
 * - Vehicle type compatibility
 * - Carrier rating
 * - Price compatibility
 * - Timing/availability
 * - Previous successful matches
 */

class AIMatchingSystem {
    constructor() {
        this.matchHistory = this.loadMatchHistory();
    }

    /**
     * Calculate distance between two locations (Haversine formula)
     * @param {string} location1 - First location (e.g., "London, UK")
     * @param {string} location2 - Second location (e.g., "Manchester, UK")
     * @returns {number} Distance in miles
     */
    calculateDistance(location1, location2) {
        // Simple approximation - in production, use geocoding API
        // For now, we'll use a simplified distance calculation
        // This is a placeholder - should be replaced with actual geocoding
        
        // Extract city names (basic parsing)
        const city1 = location1.split(',')[0].trim().toLowerCase();
        const city2 = location2.split(',')[0].trim().toLowerCase();
        
        // UK city distance approximations (miles)
        const cityDistances = {
            'london': { 'manchester': 200, 'birmingham': 120, 'liverpool': 210, 'leeds': 200, 'sheffield': 160, 'bristol': 120, 'cardiff': 150, 'edinburgh': 400, 'glasgow': 410 },
            'manchester': { 'birmingham': 90, 'liverpool': 35, 'leeds': 40, 'sheffield': 40, 'bristol': 180, 'london': 200 },
            'birmingham': { 'liverpool': 100, 'leeds': 120, 'sheffield': 80, 'bristol': 90, 'london': 120 },
            'liverpool': { 'leeds': 70, 'sheffield': 75, 'manchester': 35 },
            'leeds': { 'sheffield': 35, 'manchester': 40 },
            'sheffield': { 'leeds': 35, 'manchester': 40 }
        };
        
        if (cityDistances[city1] && cityDistances[city1][city2]) {
            return cityDistances[city1][city2];
        }
        if (cityDistances[city2] && cityDistances[city2][city1]) {
            return cityDistances[city2][city1];
        }
        
        // Default: estimate based on string similarity or return medium distance
        return 150; // Default 150 miles if cities not in lookup
    }

    /**
     * Get carrier profile data
     * @param {string} carrierId - Carrier user ID
     * @returns {object} Carrier profile
     */
    getCarrierProfile(carrierId) {
        try {
            const carrierProfiles = JSON.parse(localStorage.getItem('carrierProfiles') || '[]');
            return carrierProfiles.find(p => p.userId === carrierId || p.id === carrierId) || null;
        } catch (e) {
            console.error('Error getting carrier profile:', e);
            return null;
        }
    }

    /**
     * Get carrier vehicles
     * @param {string} carrierId - Carrier user ID
     * @returns {array} Array of vehicles
     */
    getCarrierVehicles(carrierId) {
        try {
            const allVehicles = JSON.parse(localStorage.getItem('globalVehicles') || '[]');
            return allVehicles.filter(v => 
                (v.carrierId === carrierId || v.userId === carrierId) && 
                v.status === 'available'
            );
        } catch (e) {
            console.error('Error getting carrier vehicles:', e);
            return [];
        }
    }

    /**
     * Get carrier rating
     * @param {string} carrierId - Carrier user ID
     * @returns {number} Rating (0-5)
     */
    getCarrierRating(carrierId) {
        try {
            const profile = this.getCarrierProfile(carrierId);
            if (profile && profile.rating) {
                return parseFloat(profile.rating) || 0;
            }
            
            // Calculate from completed loads
            const completedLoads = JSON.parse(localStorage.getItem('globalLoads') || '[]')
                .filter(load => 
                    load.status === 'completed' && 
                    (load.carrierId === carrierId || load.acceptedBy === carrierId)
                );
            
            if (completedLoads.length === 0) return 3.5; // Default rating for new carriers
            
            const ratings = completedLoads
                .map(load => load.carrierRating)
                .filter(r => r && r > 0);
            
            if (ratings.length === 0) return 3.5;
            
            return ratings.reduce((a, b) => a + b, 0) / ratings.length;
        } catch (e) {
            console.error('Error getting carrier rating:', e);
            return 3.5; // Default rating
        }
    }

    /**
     * Get previous match success rate
     * @param {string} carrierId - Carrier user ID
     * @param {string} supplierId - Supplier user ID
     * @returns {number} Success rate (0-1)
     */
    getPreviousMatchSuccess(carrierId, supplierId) {
        try {
            const history = this.matchHistory.filter(m => 
                m.carrierId === carrierId && m.supplierId === supplierId
            );
            
            if (history.length === 0) return 0.5; // Neutral for new matches
            
            const successful = history.filter(m => m.successful).length;
            return successful / history.length;
        } catch (e) {
            return 0.5;
        }
    }

    /**
     * Check vehicle type compatibility
     * @param {string} requiredVehicle - Required vehicle type
     * @param {array} carrierVehicles - Carrier's available vehicles
     * @returns {number} Compatibility score (0-1)
     */
    checkVehicleCompatibility(requiredVehicle, carrierVehicles) {
        if (!carrierVehicles || carrierVehicles.length === 0) return 0;
        
        const vehicleHierarchy = {
            'van': ['van'],
            '7.5t': ['van', '7.5t'],
            '18t': ['7.5t', '18t'],
            'artic': ['7.5t', '18t', 'artic'],
            'refrigerated': ['refrigerated'],
            'flatbed': ['flatbed'],
            'curtainside': ['curtainside', 'artic']
        };
        
        const compatibleTypes = vehicleHierarchy[requiredVehicle] || [requiredVehicle];
        
        const hasCompatible = carrierVehicles.some(v => {
            const vehicleType = (v.vehicleType || v.type || '').toLowerCase();
            return compatibleTypes.some(type => 
                vehicleType.includes(type.toLowerCase())
            );
        });
        
        return hasCompatible ? 1 : 0;
    }

    /**
     * Calculate location match score
     * @param {string} loadPickup - Load pickup location
     * @param {string} loadDelivery - Load delivery location
     * @param {string} carrierLocation - Carrier's current/base location
     * @returns {number} Location score (0-1)
     */
    calculateLocationScore(loadPickup, loadDelivery, carrierLocation) {
        if (!carrierLocation) return 0.5; // Neutral if location unknown
        
        const pickupDistance = this.calculateDistance(loadPickup, carrierLocation);
        const deliveryDistance = this.calculateDistance(loadDelivery, carrierLocation);
        
        // Prefer carriers closer to pickup location
        // Score decreases as distance increases
        let score = 1;
        
        if (pickupDistance <= 20) {
            score = 1.0; // Very close
        } else if (pickupDistance <= 50) {
            score = 0.9; // Close
        } else if (pickupDistance <= 100) {
            score = 0.7; // Medium distance
        } else if (pickupDistance <= 200) {
            score = 0.5; // Far
        } else {
            score = 0.3; // Very far
        }
        
        // Bonus if delivery location is near carrier's return route
        if (deliveryDistance <= 50) {
            score += 0.1; // Bonus for return trip opportunity
        }
        
        return Math.min(score, 1.0);
    }

    /**
     * Calculate price compatibility score
     * @param {number} loadPrice - Load price
     * @param {number} carrierMinPrice - Carrier's minimum acceptable price
     * @returns {number} Price score (0-1)
     */
    calculatePriceScore(loadPrice, carrierMinPrice) {
        if (!carrierMinPrice) return 0.8; // Neutral if no preference
        
        if (loadPrice >= carrierMinPrice) {
            // Price meets or exceeds minimum
            const ratio = loadPrice / carrierMinPrice;
            if (ratio >= 1.2) return 1.0; // 20%+ above minimum
            if (ratio >= 1.1) return 0.9; // 10-20% above
            return 0.8; // Meets minimum
        } else {
            // Price below minimum
            const ratio = loadPrice / carrierMinPrice;
            if (ratio >= 0.9) return 0.7; // Close to minimum
            if (ratio >= 0.8) return 0.5; // 20% below
            return 0.3; // Too low
        }
    }

    /**
     * Calculate timing compatibility
     * @param {string} loadPickupDate - Load pickup date
     * @param {string} loadPickupTime - Load pickup time
     * @param {object} carrierAvailability - Carrier availability data
     * @returns {number} Timing score (0-1)
     */
    calculateTimingScore(loadPickupDate, loadPickupTime, carrierAvailability) {
        // For now, assume all carriers are available
        // In production, check carrier's calendar/availability
        return 0.8; // Default good timing score
    }

    /**
     * Calculate overall match score
     * @param {object} load - Load object
     * @param {object} carrier - Carrier object
     * @returns {object} Match result with score and details
     */
    calculateMatchScore(load, carrier) {
        const carrierId = carrier.userId || carrier.id || carrier.carrierId;
        const supplierId = load.supplierId || load.userId;
        
        // Get carrier data
        const carrierProfile = this.getCarrierProfile(carrierId);
        const carrierVehicles = this.getCarrierVehicles(carrierId);
        const carrierRating = this.getCarrierRating(carrierId);
        const previousSuccess = this.getPreviousMatchSuccess(carrierId, supplierId);
        
        // Calculate individual scores
        const locationScore = this.calculateLocationScore(
            load.pickupLocation || load.pickup_location,
            load.deliveryLocation || load.delivery_location,
            carrierProfile?.location || carrierProfile?.baseLocation || carrier.location
        );
        
        const vehicleScore = this.checkVehicleCompatibility(
            load.vehicleType || load.vehicle_type,
            carrierVehicles
        );
        
        const ratingScore = carrierRating / 5; // Normalize to 0-1
        
        const priceScore = this.calculatePriceScore(
            load.totalCost || load.total_cost || load.price,
            carrierProfile?.minPrice || carrierProfile?.minimumPrice
        );
        
        const timingScore = this.calculateTimingScore(
            load.pickupDate || load.pickup_date,
            load.pickupTime || load.pickup_time,
            carrierProfile?.availability
        );
        
        // Weighted scoring system
        const weights = {
            location: 0.25,      // 25% - Location is very important
            vehicle: 0.20,        // 20% - Must have right vehicle
            rating: 0.20,         // 20% - Quality matters
            price: 0.15,          // 15% - Price compatibility
            timing: 0.10,         // 10% - Availability
            previous: 0.10        // 10% - Previous success
        };
        
        // Calculate weighted score
        let totalScore = 
            (locationScore * weights.location) +
            (vehicleScore * weights.vehicle) +
            (ratingScore * weights.rating) +
            (priceScore * weights.price) +
            (timingScore * weights.timing) +
            (previousSuccess * weights.previous);
        
        // Bonus for perfect vehicle match
        if (vehicleScore === 1 && locationScore >= 0.7) {
            totalScore += 0.05;
        }
        
        // Bonus for high rating
        if (ratingScore >= 0.9) {
            totalScore += 0.03;
        }
        
        // Cap at 1.0
        totalScore = Math.min(totalScore, 1.0);
        
        return {
            carrierId: carrierId,
            carrierName: carrierProfile?.companyName || carrierProfile?.fullName || carrier.name || 'Unknown Carrier',
            score: totalScore,
            percentage: Math.round(totalScore * 100),
            details: {
                location: Math.round(locationScore * 100),
                vehicle: Math.round(vehicleScore * 100),
                rating: Math.round(ratingScore * 100),
                price: Math.round(priceScore * 100),
                timing: Math.round(timingScore * 100),
                previous: Math.round(previousSuccess * 100)
            },
            vehicleType: load.vehicleType || load.vehicle_type,
            rating: carrierRating,
            vehicles: carrierVehicles.length
        };
    }

    /**
     * Find best matching carriers for a load
     * @param {object} load - Load object
     * @param {number} limit - Maximum number of matches to return
     * @returns {array} Array of match results sorted by score
     */
    findMatches(load, limit = 10) {
        try {
            // Get all carriers
            const carrierProfiles = JSON.parse(localStorage.getItem('carrierProfiles') || '[]');
            const carrierAuth = JSON.parse(localStorage.getItem('carrierAuth') || '{}');
            
            // Get active carriers (those who are logged in or have profiles)
            const activeCarriers = carrierProfiles.filter(c => {
                // Check if carrier is active (has profile and potentially logged in)
                return c && (c.userId || c.id);
            });
            
            if (activeCarriers.length === 0) {
                console.warn('No carriers found for matching');
                return [];
            }
            
            // Calculate match scores for all carriers
            const matches = activeCarriers.map(carrier => 
                this.calculateMatchScore(load, carrier)
            );
            
            // Filter out matches with very low scores (< 30%)
            const validMatches = matches.filter(m => m.score >= 0.3);
            
            // Sort by score (highest first)
            validMatches.sort((a, b) => b.score - a.score);
            
            // Return top matches
            return validMatches.slice(0, limit);
            
        } catch (e) {
            console.error('Error finding matches:', e);
            return [];
        }
    }

    /**
     * Find best matching loads for a carrier
     * @param {string} carrierId - Carrier user ID
     * @param {number} limit - Maximum number of matches to return
     * @returns {array} Array of load matches sorted by score
     */
    findLoadsForCarrier(carrierId, limit = 10) {
        try {
            const carrierProfile = this.getCarrierProfile(carrierId);
            if (!carrierProfile) {
                console.warn('Carrier profile not found');
                return [];
            }
            
            // Get all active loads
            const allLoads = JSON.parse(localStorage.getItem('globalLoads') || '[]');
            const activeLoads = allLoads.filter(load => load.status === 'active');
            
            if (activeLoads.length === 0) {
                return [];
            }
            
            // Calculate match scores for all loads
            const matches = activeLoads.map(load => {
                const match = this.calculateMatchScore(load, carrierProfile);
                return {
                    ...match,
                    load: load,
                    loadId: load.id
                };
            });
            
            // Filter out matches with very low scores (< 30%)
            const validMatches = matches.filter(m => m.score >= 0.3);
            
            // Sort by score (highest first)
            validMatches.sort((a, b) => b.score - a.score);
            
            // Return top matches
            return validMatches.slice(0, limit);
            
        } catch (e) {
            console.error('Error finding loads for carrier:', e);
            return [];
        }
    }

    /**
     * Save match history
     * @param {string} loadId - Load ID
     * @param {string} carrierId - Carrier ID
     * @param {boolean} successful - Whether match was successful
     */
    saveMatchHistory(loadId, carrierId, supplierId, successful) {
        try {
            const history = this.matchHistory;
            history.push({
                loadId,
                carrierId,
                supplierId,
                successful,
                timestamp: new Date().toISOString()
            });
            
            // Keep only last 1000 matches
            if (history.length > 1000) {
                history.shift();
            }
            
            localStorage.setItem('aiMatchHistory', JSON.stringify(history));
            this.matchHistory = history;
        } catch (e) {
            console.error('Error saving match history:', e);
        }
    }

    /**
     * Load match history from storage
     * @returns {array} Match history
     */
    loadMatchHistory() {
        try {
            return JSON.parse(localStorage.getItem('aiMatchHistory') || '[]');
        } catch (e) {
            return [];
        }
    }

    /**
     * Get match quality label
     * @param {number} score - Match score (0-1)
     * @returns {string} Quality label
     */
    getMatchQualityLabel(score) {
        if (score >= 0.9) return 'Perfect Match';
        if (score >= 0.8) return 'Excellent Match';
        if (score >= 0.7) return 'Very Good Match';
        if (score >= 0.6) return 'Good Match';
        if (score >= 0.5) return 'Fair Match';
        return 'Low Match';
    }

    /**
     * Get match quality color
     * @param {number} score - Match score (0-1)
     * @returns {string} CSS color
     */
    getMatchQualityColor(score) {
        if (score >= 0.8) return '#28a745'; // Green
        if (score >= 0.6) return '#ffc107'; // Yellow
        return '#dc3545'; // Red
    }
}

// Create global instance
window.AIMatchingSystem = AIMatchingSystem;
window.aiMatching = new AIMatchingSystem();

