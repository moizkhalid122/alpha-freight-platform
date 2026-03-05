/**
 * GPS Live Location Tracking System
 * Alpha Freight - Comprehensive GPS Integration for Carriers
 * Features: Auto-tracking, Route History, ETA Calculation, Geofencing
 */

class GPSTracking {
    constructor() {
        this.watchId = null;
        this.trackingInterval = null;
        this.isTracking = false;
        this.currentLocation = null;
        this.routeHistory = [];
        this.firebaseDb = null;
        this.locationUpdateInterval = 10000; // Update every 10 seconds
        this.carrierId = null;
        this.supplierId = null;
        this.loadId = null;
        this.pickupLocation = null;
        this.deliveryLocation = null;
        this.geofenceRadius = 500; // meters
        this.onLocationUpdateCallbacks = [];
        this.onGeofenceEnterCallbacks = [];
    }

    // Initialize GPS tracking system
    async init(options = {}) {
        try {
            // Initialize Firebase
            if (window.firebase && window.firebase.database) {
                this.firebaseDb = window.firebase.database();
            } else {
                console.warn('⚠️ Firebase not initialized');
            }

            // Get carrier authentication
            const auth = JSON.parse(localStorage.getItem('carrierAuth') || '{}');
            if (!auth.carrierId && !auth.id) {
                console.warn('⚠️ Carrier not authenticated');
                return false;
            }

            this.carrierId = auth.carrierId || auth.id;
            this.supplierId = options.supplierId || null;
            this.loadId = options.loadId || null;
            this.pickupLocation = options.pickupLocation || null;
            this.deliveryLocation = options.deliveryLocation || null;
            this.locationUpdateInterval = options.updateInterval || 10000;

            // Check geolocation support
            if (!navigator.geolocation) {
                console.error('❌ Geolocation not supported');
                return false;
            }

            console.log('✅ GPS Tracking initialized');
            return true;
        } catch (error) {
            console.error('❌ GPS Tracking initialization error:', error);
            return false;
        }
    }

    // Start automatic location tracking
    async startTracking(options = {}) {
        if (this.isTracking) {
            console.warn('⚠️ Tracking already active');
            return;
        }

        if (!this.carrierId) {
            const auth = JSON.parse(localStorage.getItem('carrierAuth') || '{}');
            this.carrierId = auth.carrierId || auth.id;
            if (!this.carrierId) {
                console.error('❌ Carrier ID not found');
                return;
            }
        }

        this.isTracking = true;
        const trackingOptions = {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 5000
        };

        // Get initial position
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.handleLocationUpdate(position);
            },
            (error) => {
                // handleLocationError will handle logging appropriately
                this.handleLocationError(error);
            },
            trackingOptions
        );

        // Watch position changes
        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.handleLocationUpdate(position);
            },
            (error) => {
                // handleLocationError will handle logging appropriately
                this.handleLocationError(error);
            },
            trackingOptions
        );

        // Periodic updates for Firebase sync
        this.trackingInterval = setInterval(() => {
            if (this.currentLocation) {
                this.saveLocationToFirebase(this.currentLocation);
            }
        }, this.locationUpdateInterval);

        console.log('✅ GPS Tracking started');
        this.triggerEvent('trackingStarted');
    }

    // Handle location update
    handleLocationUpdate(position) {
        const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || null,
            speed: position.coords.speed || 0,
            heading: position.coords.heading || null,
            timestamp: Date.now(),
            timestampISO: new Date().toISOString()
        };

        this.currentLocation = location;

        // Add to route history
        this.routeHistory.push({
            ...location,
            distance: this.calculateDistanceFromLast(location)
        });

        // Limit route history to last 1000 points
        if (this.routeHistory.length > 1000) {
            this.routeHistory.shift();
        }

        // Save to localStorage for offline access
        this.saveLocationToLocalStorage(location);

        // Save to Firebase
        this.saveLocationToFirebase(location);

        // Check geofencing
        this.checkGeofencing(location);

        // Calculate ETA if destination is set
        if (this.deliveryLocation) {
            const eta = this.calculateETA(location, this.deliveryLocation);
            location.eta = eta;
        }

        // Trigger callbacks
        this.onLocationUpdateCallbacks.forEach(callback => {
            try {
                callback(location);
            } catch (error) {
                console.error('Error in location update callback:', error);
            }
        });

        // Trigger custom event
        this.triggerEvent('locationUpdate', location);
    }

    // Calculate distance from last location
    calculateDistanceFromLast(currentLocation) {
        if (this.routeHistory.length === 0) return 0;

        const lastLocation = this.routeHistory[this.routeHistory.length - 1];
        return this.calculateDistance(
            lastLocation.latitude,
            lastLocation.longitude,
            currentLocation.latitude,
            currentLocation.longitude
        );
    }

    // Calculate distance between two coordinates (Haversine formula)
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }

    // Calculate ETA to destination
    calculateETA(currentLocation, destination) {
        if (!destination || !currentLocation) return null;

        // Parse destination if it's a string (address)
        let destLat, destLon;
        if (typeof destination === 'string') {
            // If it's an address, we'd need geocoding - for now return null
            return null;
        } else if (destination.latitude && destination.longitude) {
            destLat = destination.latitude;
            destLon = destination.longitude;
        } else {
            return null;
        }

        const distance = this.calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            destLat,
            destLon
        );

        // Calculate ETA based on current speed or average speed
        const currentSpeed = currentLocation.speed || 0; // m/s
        const averageSpeed = currentSpeed > 0 ? currentSpeed : 13.89; // Default 50 km/h = 13.89 m/s
        const timeInSeconds = distance / averageSpeed;
        const timeInMinutes = Math.round(timeInSeconds / 60);

        return {
            distance: (distance / 1000).toFixed(2) + ' km',
            distanceMeters: Math.round(distance),
            etaMinutes: timeInMinutes,
            eta: timeInMinutes > 60 
                ? Math.floor(timeInMinutes / 60) + 'h ' + (timeInMinutes % 60) + 'm'
                : timeInMinutes + ' min',
            currentSpeed: (currentSpeed * 3.6).toFixed(1) + ' km/h' // Convert m/s to km/h
        };
    }

    // Check geofencing (proximity to pickup/delivery locations)
    checkGeofencing(location) {
        if (!this.pickupLocation && !this.deliveryLocation) return;

        // Check pickup location
        if (this.pickupLocation) {
            const pickupDistance = this.getDistanceToLocation(location, this.pickupLocation);
            if (pickupDistance <= this.geofenceRadius) {
                this.triggerGeofenceEvent('pickup', location, pickupDistance);
            }
        }

        // Check delivery location
        if (this.deliveryLocation) {
            const deliveryDistance = this.getDistanceToLocation(location, this.deliveryLocation);
            if (deliveryDistance <= this.geofenceRadius) {
                this.triggerGeofenceEvent('delivery', location, deliveryDistance);
            }
        }
    }

    // Get distance to a location (supports both coordinates and address strings)
    getDistanceToLocation(currentLocation, targetLocation) {
        if (typeof targetLocation === 'string') {
            // Address string - would need geocoding
            return null;
        }

        if (targetLocation.latitude && targetLocation.longitude) {
            return this.calculateDistance(
                currentLocation.latitude,
                currentLocation.longitude,
                targetLocation.latitude,
                targetLocation.longitude
            );
        }

        return null;
    }

    // Trigger geofence event
    triggerGeofenceEvent(type, location, distance) {
        const event = {
            type: type, // 'pickup' or 'delivery'
            location: location,
            distance: distance,
            timestamp: Date.now()
        };

        this.onGeofenceEnterCallbacks.forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                console.error('Error in geofence callback:', error);
            }
        });

        this.triggerEvent('geofenceEnter', event);
    }

    // Save location to Firebase
    async saveLocationToFirebase(location) {
        if (!this.firebaseDb || !this.carrierId) return;

        try {
            const auth = JSON.parse(localStorage.getItem('carrierAuth') || '{}');
            const locationData = {
                latitude: location.latitude,
                longitude: location.longitude,
                accuracy: location.accuracy,
                speed: location.speed,
                heading: location.heading,
                timestamp: location.timestamp,
                timestampISO: location.timestampISO,
                carrierId: this.carrierId,
                carrierName: (auth.firstName && auth.lastName) 
                    ? `${auth.firstName} ${auth.lastName}` 
                    : (auth.name || 'Carrier'),
                companyName: auth.companyName || 'Carrier',
                supplierId: this.supplierId,
                loadId: this.loadId,
                isActive: true,
                routeHistory: this.routeHistory.slice(-50) // Last 50 points
            };

            // Save to carrier locations
            await this.firebaseDb.ref(`carrierLocations/${this.carrierId}`).set(locationData);

            // Save to supplier tracking if supplier ID exists
            if (this.supplierId) {
                await this.firebaseDb.ref(`supplierLocationTracking/${this.supplierId}/${this.carrierId}`).set({
                    latitude: location.latitude,
                    longitude: location.longitude,
                    speed: location.speed,
                    timestamp: location.timestamp,
                    carrierId: this.carrierId,
                    carrierName: locationData.carrierName,
                    companyName: locationData.companyName,
                    loadId: this.loadId,
                    isActive: true,
                    eta: location.eta || null
                });
            }

            // Save location history
            if (this.loadId) {
                const historyRef = this.firebaseDb.ref(`carrierLocationHistory/${this.carrierId}/${this.loadId}`);
                await historyRef.push({
                    latitude: location.latitude,
                    longitude: location.longitude,
                    timestamp: location.timestamp,
                    speed: location.speed
                });
            }

        } catch (error) {
            console.error('❌ Error saving location to Firebase:', error);
        }
    }

    // Save location to localStorage
    saveLocationToLocalStorage(location) {
        try {
            const locationHistory = JSON.parse(
                localStorage.getItem('carrierLocationHistory') || '[]'
            );

            locationHistory.push({
                ...location,
                carrierId: this.carrierId,
                loadId: this.loadId
            });

            // Keep only last 100 locations
            if (locationHistory.length > 100) {
                locationHistory.shift();
            }

            localStorage.setItem('carrierLocationHistory', JSON.stringify(locationHistory));
            localStorage.setItem('carrierCurrentLocation', JSON.stringify(location));
        } catch (error) {
            console.error('Error saving location to localStorage:', error);
        }
    }

    // Stop tracking
    stopTracking() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }

        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
        }

        this.isTracking = false;

        // Update Firebase to mark as inactive
        if (this.firebaseDb && this.carrierId) {
            this.firebaseDb.ref(`carrierLocations/${this.carrierId}`).update({
                isActive: false,
                lastUpdate: Date.now()
            });
        }

        console.log('🛑 GPS Tracking stopped');
        this.triggerEvent('trackingStopped');
    }

    // Get current location
    getCurrentLocation() {
        return this.currentLocation;
    }

    // Get route history
    getRouteHistory() {
        return this.routeHistory;
    }

    // Clear route history
    clearRouteHistory() {
        this.routeHistory = [];
    }

    // Set destination for ETA calculation
    setDestination(pickupLocation, deliveryLocation) {
        this.pickupLocation = pickupLocation;
        this.deliveryLocation = deliveryLocation;
    }

    // Set geofence radius
    setGeofenceRadius(radius) {
        this.geofenceRadius = radius;
    }

    // Add callback for location updates
    onLocationUpdate(callback) {
        if (typeof callback === 'function') {
            this.onLocationUpdateCallbacks.push(callback);
        }
    }

    // Add callback for geofence events
    onGeofenceEnter(callback) {
        if (typeof callback === 'function') {
            this.onGeofenceEnterCallbacks.push(callback);
        }
    }

    // Trigger custom event
    triggerEvent(eventName, data = null) {
        const event = new CustomEvent(`gpsTracking:${eventName}`, {
            detail: data
        });
        window.dispatchEvent(event);
    }

    // Handle location error
    handleLocationError(error) {
        let errorMessage = 'Unknown error';
        
        switch(error.code) {
            case error.PERMISSION_DENIED:
                errorMessage = 'Location permission denied';
                // Don't spam console with permission denied errors
                if (!this._permissionDeniedLogged) {
                    console.warn('⚠️ Location permission denied. Please enable location access in browser settings.');
                    this._permissionDeniedLogged = true;
                }
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location unavailable';
                console.warn('⚠️ Location unavailable');
                break;
            case error.TIMEOUT:
                errorMessage = 'Location request timeout';
                // Don't log timeout errors repeatedly
                if (!this._timeoutLogged) {
                    console.warn('⚠️ Location request timeout');
                    this._timeoutLogged = true;
                }
                break;
        }

        // Only log critical errors
        if (error.code !== error.PERMISSION_DENIED && error.code !== error.TIMEOUT) {
            console.error(`❌ Location error: ${errorMessage}`);
        }
        
        this.triggerEvent('locationError', { error, message: errorMessage });
    }

    // Get total distance traveled
    getTotalDistanceTraveled() {
        if (this.routeHistory.length < 2) return 0;

        let totalDistance = 0;
        for (let i = 1; i < this.routeHistory.length; i++) {
            const prev = this.routeHistory[i - 1];
            const curr = this.routeHistory[i];
            totalDistance += this.calculateDistance(
                prev.latitude,
                prev.longitude,
                curr.latitude,
                curr.longitude
            );
        }

        return totalDistance;
    }

    // Get average speed
    getAverageSpeed() {
        if (this.routeHistory.length === 0) return 0;

        const speeds = this.routeHistory
            .filter(point => point.speed > 0)
            .map(point => point.speed);

        if (speeds.length === 0) return 0;

        const sum = speeds.reduce((a, b) => a + b, 0);
        return sum / speeds.length;
    }
}

// Export to window
window.GPSTracking = GPSTracking;

// Auto-initialize if carrier is logged in
document.addEventListener('DOMContentLoaded', () => {
    const auth = JSON.parse(localStorage.getItem('carrierAuth') || '{}');
    if (auth.isLoggedIn && auth.carrierId) {
        console.log('📍 GPS Tracking System loaded');
    }
});

