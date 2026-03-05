/**
 * Firebase Complete Integration
 * Alpha Freight - All Firebase Services Connected
 * This file ensures all Firebase services are properly initialized
 */

(function() {
    'use strict';

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        // Initialize Firebase if not already initialized
        if (!window.AlphaBrokrage) {
            window.AlphaBrokrage = {};
        }

        // Initialize Firebase App
        if (typeof firebase !== 'undefined') {
            const firebaseConfig = {
                apiKey: "AIzaSyBdn4T4IpwX_nN2pkhHaBI9yqyZ3faAF6o",
                authDomain: "alpha-brokerage.firebaseapp.com",
                databaseURL: "https://alpha-brokerage-default-rtdb.firebaseio.com",
                projectId: "alpha-brokerage",
                storageBucket: "alpha-brokerage.firebasestorage.app",
                messagingSenderId: "834712514965",
                appId: "1:834712514965:web:5dbe0aa2e4eab3cb16c69c"
            };

            if (!firebase.apps || firebase.apps.length === 0) {
                firebase.initializeApp(firebaseConfig);
            }

            // Store Firebase references
            window.AlphaBrokrage.firebaseApp = firebase.app();
            
            if (firebase.database && typeof firebase.database === 'function') {
                window.AlphaBrokrage.firebaseDb = firebase.database();
            }
            
            if (firebase.storage && typeof firebase.storage === 'function') {
                window.AlphaBrokrage.firebaseStorage = firebase.storage();
            }
            
            // Only initialize auth if firebase.auth is available (auth SDK loaded)
            if (firebase.auth && typeof firebase.auth === 'function') {
                window.AlphaBrokrage.firebaseAuth = firebase.auth();
            } else {
                console.warn('⚠️ Firebase Auth SDK not loaded. Google Sign-In will not work until auth SDK is loaded.');
            }

            console.log('✅ Firebase services initialized');
        }

        // Connect AlphaBrokrage.showAlert to new AlertSystem
        if (window.AlertSystem && !window.AlphaBrokrage.showAlert) {
            window.AlphaBrokrage.showAlert = function(type, message, options = {}) {
                const alertTypes = {
                    'success': () => window.AlertSystem.success(message, options),
                    'error': () => window.AlertSystem.error(message, options),
                    'warning': () => window.AlertSystem.warning(message, options),
                    'info': () => window.AlertSystem.info(message, options)
                };

                const alertFn = alertTypes[type] || alertTypes['info'];
                return alertFn();
            };
        }

        // Backward compatibility - old alert() calls
        if (window.AlertSystem) {
            // Override window.alert for better UX (optional)
            const originalAlert = window.alert;
            window.alert = function(message) {
                // Use new alert system instead of browser alert
                if (window.AlertSystem) {
                    window.AlertSystem.info(message, { duration: 3000 });
                } else {
                    originalAlert(message);
                }
            };
        }

        console.log('✅ Firebase Complete Integration loaded');
    }
})();

