// Shared Firebase initialization for Alpha Freight web app
(function(window) {
    'use strict';

    const firebaseConfig = {
        apiKey: "AIzaSyBdn4T4IpwX_nN2pkhHaBI9yqyZ3faAF6o",
        authDomain: "alpha-brokerage.firebaseapp.com",
        databaseURL: "https://alpha-brokerage-default-rtdb.firebaseio.com",
        projectId: "alpha-brokerage",
        storageBucket: "alpha-brokerage.firebasestorage.app",
        messagingSenderId: "834712514965",
        appId: "1:834712514965:web:5dbe0aa2e4eab3cb16c69c"
    };

    if (typeof firebase === 'undefined') {
        console.error('[AlphaBrokrage] Firebase SDK not loaded. Please include firebase-app.js before firebase-init.js');
        return;
    }

    if (!firebase.apps || firebase.apps.length === 0) {
        firebase.initializeApp(firebaseConfig);
    }

    window.AlphaBrokrage = window.AlphaBrokrage || {};
    window.AlphaBrokrage.firebaseApp = firebase.app();
    
    // Safely initialize database only if SDK is loaded
    if (typeof firebase.database === 'function') {
        window.AlphaBrokrage.firebaseDb = firebase.database();
    }

    if (typeof firebase.auth === 'function') {
        window.AlphaBrokrage.firebaseAuth = firebase.auth();
    }
    
    // Safely initialize firestore only if SDK is loaded
    if (typeof firebase.firestore === 'function') {
        window.AlphaBrokrage.firebaseFirestore = firebase.firestore();
    }
})(window);

