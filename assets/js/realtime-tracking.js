/**
 * Real-time GPS Tracking System
 * Alpha Freight - Live Location Tracking with Google Maps
 * Uses Firebase Realtime Database for live updates
 */

class RealtimeTracking {
    constructor() {
        this.map = null;
        this.markers = {};
        this.carrierLocations = {};
        this.trackingInterval = null;
        this.watchId = null;
        this.firebaseDb = null;
        this.firebaseRefs = {};
    }

    // Initialize tracking system
    async init(mapElementId, options = {}) {
        try {
            // Initialize Firebase
            if (window.AlphaBrokrage && window.AlphaBrokrage.firebaseDb) {
                this.firebaseDb = window.AlphaBrokrage.firebaseDb;
            } else if (window.firebase && window.firebase.database) {
                this.firebaseDb = window.firebase.database();
            } else {
                console.warn('⚠️ Firebase not initialized');
            }

            // Initialize Google Maps
            await this.initGoogleMaps(mapElementId, options);

            // Start location tracking
            await this.startLocationTracking();

            // Subscribe to real-time updates
            await this.subscribeToRealtimeUpdates();

            console.log('✅ Real-time tracking initialized');
            return true;
        } catch (error) {
            console.error('❌ Tracking initialization error:', error);
            return false;
        }
    }

    // Initialize Google Maps
    async initGoogleMaps(mapElementId, options = {}) {
        return new Promise((resolve, reject) => {
            // Check if Google Maps is already loaded
            if (window.google && window.google.maps) {
                this.createMap(mapElementId, options);
                resolve();
                return;
            }

            // Load Google Maps API
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${options.apiKey || 'YOUR_GOOGLE_MAPS_API_KEY'}&libraries=geometry`;
            script.async = true;
            script.defer = true;
            
            script.onload = () => {
                this.createMap(mapElementId, options);
                resolve();
            };
            
            script.onerror = () => {
                reject(new Error('Failed to load Google Maps API'));
            };
            
            document.head.appendChild(script);
        });
    }

    // Create map instance
    createMap(mapElementId, options) {
        const defaultCenter = options.center || { lat: 51.5074, lng: -0.1278 }; // London default
        const defaultZoom = options.zoom || 10;

        this.map = new google.maps.Map(document.getElementById(mapElementId), {
            center: defaultCenter,
            zoom: defaultZoom,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: options.styles || this.getDefaultMapStyles(),
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: true,
            scaleControl: true,
            streetViewControl: false,
            fullscreenControl: true
        });

        // Add custom controls
        this.addMapControls();
    }

    // Get default map styles (dark theme)
    getDefaultMapStyles() {
        return [
            { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
            {
                featureType: 'administrative.locality',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#d59563' }]
            },
            {
                featureType: 'poi',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#d59563' }]
            },
            {
                featureType: 'poi.park',
                elementType: 'geometry',
                stylers: [{ color: '#263c3f' }]
            },
            {
                featureType: 'poi.park',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#6b9a76' }]
            },
            {
                featureType: 'road',
                elementType: 'geometry',
                stylers: [{ color: '#38414e' }]
            },
            {
                featureType: 'road',
                elementType: 'geometry.stroke',
                stylers: [{ color: '#212a37' }]
            },
            {
                featureType: 'road',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#9ca5b3' }]
            },
            {
                featureType: 'road.highway',
                elementType: 'geometry',
                stylers: [{ color: '#746855' }]
            },
            {
                featureType: 'road.highway',
                elementType: 'geometry.stroke',
                stylers: [{ color: '#1f2835' }]
            },
            {
                featureType: 'road.highway',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#f3d19c' }]
            },
            {
                featureType: 'transit',
                elementType: 'geometry',
                stylers: [{ color: '#2f3948' }]
            },
            {
                featureType: 'transit.station',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#d59563' }]
            },
            {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#17263c' }]
            },
            {
                featureType: 'water',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#515c6d' }]
            },
            {
                featureType: 'water',
                elementType: 'labels.text.stroke',
                stylers: [{ color: '#17263c' }]
            }
        ];
    }

    // Add map controls
    addMapControls() {
        // Satellite view toggle
        const satelliteControl = document.createElement('div');
        satelliteControl.className = 'map-control';
        satelliteControl.innerHTML = '<button id="satelliteToggle" class="btn btn-sm btn-light"><i class="fas fa-satellite"></i></button>';
        this.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(satelliteControl);

        document.getElementById('satelliteToggle')?.addEventListener('click', () => {
            const currentType = this.map.getMapTypeId();
            this.map.setMapTypeId(
                currentType === google.maps.MapTypeId.SATELLITE
                    ? google.maps.MapTypeId.ROADMAP
                    : google.maps.MapTypeId.SATELLITE
            );
        });
    }

    // Start location tracking
    async startLocationTracking() {
        if (!navigator.geolocation) {
            console.warn('Geolocation not supported');
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        // Get current position
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.updateMyLocation(position);
            },
            (error) => {
                console.error('Geolocation error:', error);
            },
            options
        );

        // Watch position changes
        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.updateMyLocation(position);
            },
            (error) => {
                console.error('Geolocation watch error:', error);
            },
            options
        );
    }

    // Update my location
    async updateMyLocation(position) {
        const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
        };

        // Update map center if it's the user's own location
        if (this.map) {
            this.map.setCenter(location);
        }

        // Save to Firebase
        await this.saveLocationToFirebase(location);

        // Update marker
        this.updateMarker('my-location', location, {
            title: 'My Location',
            icon: {
                url: 'data:image/svg+xml;base64,' + btoa(`
                    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="16" cy="16" r="8" fill="#1FA9FF" stroke="#fff" stroke-width="2"/>
                        <circle cx="16" cy="16" r="3" fill="#fff"/>
                    </svg>
                `),
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 16)
            }
        });
    }

    // Save location to Firebase
    async saveLocationToFirebase(location) {
        if (!this.firebaseDb) return;

        try {
            const auth = JSON.parse(localStorage.getItem('carrierAuth') || '{}');
            if (!auth.carrierId && !auth.email) return;

            const userId = auth.carrierId || auth.email;
            const locationData = {
                user_id: userId,
                user_type: 'carrier',
                latitude: location.lat,
                longitude: location.lng,
                accuracy: location.accuracy,
                timestamp: location.timestamp,
                updated_at: new Date().toISOString(),
                carrier_name: auth.firstName + ' ' + auth.lastName || 'Carrier'
            };

            // Save to Firebase Realtime Database
            const locationRef = this.firebaseDb.ref(`carrier_locations/${userId}`);
            await locationRef.set(locationData);

            console.log('✅ Location saved to Firebase');
        } catch (error) {
            console.error('Error in saveLocationToFirebase:', error);
        }
    }

    // Subscribe to real-time updates
    async subscribeToRealtimeUpdates() {
        if (!this.firebaseDb) return;

        try {
            // Listen to all carrier locations
            const locationsRef = this.firebaseDb.ref('carrier_locations');
            
            this.firebaseRefs.locations = locationsRef.on('value', (snapshot) => {
                const locations = snapshot.val() || {};
                
                Object.keys(locations).forEach(userId => {
                    const locationData = locations[userId];
                    this.handleLocationUpdate(userId, locationData);
                });
            }, (error) => {
                console.error('Error subscribing to Firebase updates:', error);
            });

            console.log('✅ Subscribed to real-time location updates');
        } catch (error) {
            console.error('Error subscribing to updates:', error);
        }
    }

    // Handle location update from Firebase
    handleLocationUpdate(carrierId, locationData) {
        if (!locationData) return;

        const location = {
            lat: locationData.latitude,
            lng: locationData.longitude,
            accuracy: locationData.accuracy,
            timestamp: locationData.timestamp
        };

        const carrierName = locationData.carrier_name || 'Carrier';

        // Update marker
        this.updateMarker(carrierId, location, {
            title: carrierName,
            icon: {
                url: 'data:image/svg+xml;base64,' + btoa(`
                    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="16" cy="16" r="10" fill="#16a34a" stroke="#fff" stroke-width="2"/>
                        <circle cx="16" cy="16" r="4" fill="#fff"/>
                    </svg>
                `),
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 16)
            }
        });

        // Store location
        this.carrierLocations[carrierId] = location;
    }

    // Update marker on map
    updateMarker(id, location, options = {}) {
        if (!this.map) return;

        // Remove existing marker
        if (this.markers[id]) {
            this.markers[id].setMap(null);
        }

        // Create new marker
        const marker = new google.maps.Marker({
            position: location,
            map: this.map,
            title: options.title || 'Location',
            icon: options.icon,
            animation: google.maps.Animation.DROP
        });

        // Add info window
        if (options.title) {
            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div style="padding: 8px;">
                        <strong>${options.title}</strong><br>
                        <small>Updated: ${new Date(location.timestamp).toLocaleTimeString()}</small>
                    </div>
                `
            });

            marker.addListener('click', () => {
                infoWindow.open(this.map, marker);
            });
        }

        this.markers[id] = marker;
    }

    // Calculate route between two points
    async calculateRoute(origin, destination) {
        if (!this.map || !window.google) return null;

        return new Promise((resolve, reject) => {
            const directionsService = new google.maps.DirectionsService();
            const directionsRenderer = new google.maps.DirectionsRenderer({
                map: this.map,
                suppressMarkers: false
            });

            directionsService.route(
                {
                    origin: origin,
                    destination: destination,
                    travelMode: google.maps.TravelMode.DRIVING
                },
                (result, status) => {
                    if (status === 'OK') {
                        directionsRenderer.setDirections(result);
                        
                        // Calculate distance and ETA
                        const route = result.routes[0];
                        const leg = route.legs[0];
                        
                        resolve({
                            distance: leg.distance.text,
                            duration: leg.duration.text,
                            distanceValue: leg.distance.value, // in meters
                            durationValue: leg.duration.value // in seconds
                        });
                    } else {
                        reject(new Error('Route calculation failed: ' + status));
                    }
                }
            );
        });
    }

    // Get ETA (Estimated Time of Arrival)
    calculateETA(currentLocation, destination, averageSpeed = 50) {
        if (!window.google) return null;

        const distance = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(currentLocation.lat, currentLocation.lng),
            new google.maps.LatLng(destination.lat, destination.lng)
        );

        const timeInHours = distance / 1000 / averageSpeed; // distance in km, speed in km/h
        const timeInMinutes = Math.round(timeInHours * 60);

        return {
            distance: (distance / 1000).toFixed(2) + ' km',
            eta: timeInMinutes + ' minutes',
            etaMinutes: timeInMinutes
        };
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

        // Remove Firebase listeners
        if (this.firebaseRefs.locations) {
            this.firebaseDb?.ref('carrier_locations').off('value', this.firebaseRefs.locations);
            this.firebaseRefs.locations = null;
        }

        console.log('🛑 Tracking stopped');
    }

    // Cleanup
    destroy() {
        this.stopTracking();
        
        // Remove all markers
        Object.values(this.markers).forEach(marker => {
            marker.setMap(null);
        });
        this.markers = {};
        
        this.map = null;
    }
}

// Export
window.RealtimeTracking = RealtimeTracking;

console.log('📍 Real-time Tracking System loaded');

