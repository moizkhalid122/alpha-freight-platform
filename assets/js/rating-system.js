// Alpha Freight - Rating & Review System
// Complete rating and review functionality for carriers and suppliers

class RatingSystem {
    constructor() {
        this.db = null;
        this.initFirebase();
    }

    initFirebase() {
        if (window.AlphaBrokrage && window.AlphaBrokrage.firebaseDb) {
            this.db = window.AlphaBrokrage.firebaseDb;
        } else if (typeof firebase !== 'undefined' && firebase.database) {
            this.db = firebase.database();
        } else {
            console.warn('Firebase not initialized for rating system');
        }
    }

    // Submit rating for a carrier (by supplier after load completion)
    async submitCarrierRating(loadId, carrierId, rating, review, supplierId) {
        if (!this.db) {
            console.error('Database not initialized');
            return { success: false, error: 'Database not initialized' };
        }

        if (!rating || rating < 1 || rating > 5) {
            return { success: false, error: 'Rating must be between 1 and 5' };
        }

        try {
            const ratingData = {
                loadId: loadId,
                carrierId: carrierId,
                supplierId: supplierId,
                rating: parseInt(rating),
                review: review || '',
                timestamp: new Date().toISOString(),
                type: 'carrier_rating'
            };

            // Save rating
            const ratingRef = this.db.ref('ratings').push(ratingData);
            
            // Update load with rating
            await this.db.ref(`loads/${loadId}/carrierRating`).set(rating);
            await this.db.ref(`loads/${loadId}/carrierReview`).set(review || '');
            await this.db.ref(`loads/${loadId}/carrierRatedAt`).set(new Date().toISOString());

            // Update carrier's average rating
            await this.updateCarrierAverageRating(carrierId);

            return { success: true, ratingId: ratingRef.key };
        } catch (error) {
            console.error('Error submitting carrier rating:', error);
            return { success: false, error: error.message };
        }
    }

    // Submit rating for a supplier (by carrier after load completion)
    async submitSupplierRating(loadId, supplierId, rating, review, carrierId) {
        if (!this.db) {
            console.error('Database not initialized');
            return { success: false, error: 'Database not initialized' };
        }

        if (!rating || rating < 1 || rating > 5) {
            return { success: false, error: 'Rating must be between 1 and 5' };
        }

        try {
            const ratingData = {
                loadId: loadId,
                supplierId: supplierId,
                carrierId: carrierId,
                rating: parseInt(rating),
                review: review || '',
                timestamp: new Date().toISOString(),
                type: 'supplier_rating'
            };

            // Save rating
            const ratingRef = this.db.ref('ratings').push(ratingData);
            
            // Update load with rating
            await this.db.ref(`loads/${loadId}/supplierRating`).set(rating);
            await this.db.ref(`loads/${loadId}/supplierReview`).set(review || '');
            await this.db.ref(`loads/${loadId}/supplierRatedAt`).set(new Date().toISOString());

            // Update supplier's average rating
            await this.updateSupplierAverageRating(supplierId);

            return { success: true, ratingId: ratingRef.key };
        } catch (error) {
            console.error('Error submitting supplier rating:', error);
            return { success: false, error: error.message };
        }
    }

    // Get carrier average rating
    async getCarrierRating(carrierId, callback) {
        if (!this.db) {
            if (callback) callback({ rating: 0, count: 0 });
            return { rating: 0, count: 0 };
        }

        try {
            const snapshot = await this.db.ref('ratings')
                .orderByChild('carrierId')
                .equalTo(carrierId)
                .once('value');

            const ratings = [];
            snapshot.forEach((child) => {
                const data = child.val();
                if (data.type === 'carrier_rating' && data.rating) {
                    ratings.push(data.rating);
                }
            });

            const result = {
                rating: ratings.length > 0 
                    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
                    : '0.0',
                count: ratings.length
            };

            if (callback) callback(result);
            return result;
        } catch (error) {
            console.error('Error getting carrier rating:', error);
            const result = { rating: '0.0', count: 0 };
            if (callback) callback(result);
            return result;
        }
    }

    // Get supplier average rating
    async getSupplierRating(supplierId, callback) {
        if (!this.db) {
            if (callback) callback({ rating: 0, count: 0 });
            return { rating: 0, count: 0 };
        }

        try {
            const snapshot = await this.db.ref('ratings')
                .orderByChild('supplierId')
                .equalTo(supplierId)
                .once('value');

            const ratings = [];
            snapshot.forEach((child) => {
                const data = child.val();
                if (data.type === 'supplier_rating' && data.rating) {
                    ratings.push(data.rating);
                }
            });

            const result = {
                rating: ratings.length > 0 
                    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
                    : '0.0',
                count: ratings.length
            };

            if (callback) callback(result);
            return result;
        } catch (error) {
            console.error('Error getting supplier rating:', error);
            const result = { rating: '0.0', count: 0 };
            if (callback) callback(result);
            return result;
        }
    }

    // Get all reviews for a carrier
    async getCarrierReviews(carrierId, callback) {
        if (!this.db) {
            if (callback) callback([]);
            return [];
        }

        try {
            const snapshot = await this.db.ref('ratings')
                .orderByChild('carrierId')
                .equalTo(carrierId)
                .once('value');

            const reviews = [];
            snapshot.forEach((child) => {
                const data = child.val();
                if (data.type === 'carrier_rating' && data.review) {
                    reviews.push({
                        id: child.key,
                        rating: data.rating,
                        review: data.review,
                        timestamp: data.timestamp,
                        loadId: data.loadId
                    });
                }
            });

            // Sort by timestamp (newest first)
            reviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            if (callback) callback(reviews);
            return reviews;
        } catch (error) {
            console.error('Error getting carrier reviews:', error);
            if (callback) callback([]);
            return [];
        }
    }

    // Get all reviews for a supplier
    async getSupplierReviews(supplierId, callback) {
        if (!this.db) {
            if (callback) callback([]);
            return [];
        }

        try {
            const snapshot = await this.db.ref('ratings')
                .orderByChild('supplierId')
                .equalTo(supplierId)
                .once('value');

            const reviews = [];
            snapshot.forEach((child) => {
                const data = child.val();
                if (data.type === 'supplier_rating' && data.review) {
                    reviews.push({
                        id: child.key,
                        rating: data.rating,
                        review: data.review,
                        timestamp: data.timestamp,
                        loadId: data.loadId
                    });
                }
            });

            // Sort by timestamp (newest first)
            reviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            if (callback) callback(reviews);
            return reviews;
        } catch (error) {
            console.error('Error getting supplier reviews:', error);
            if (callback) callback([]);
            return [];
        }
    }

    // Update carrier average rating
    async updateCarrierAverageRating(carrierId) {
        if (!this.db) return;

        try {
            const ratingData = await this.getCarrierRating(carrierId);
            await this.db.ref(`carriers/${carrierId}/averageRating`).set(ratingData.rating);
            await this.db.ref(`carriers/${carrierId}/ratingCount`).set(ratingData.count);
        } catch (error) {
            console.error('Error updating carrier average rating:', error);
        }
    }

    // Update supplier average rating
    async updateSupplierAverageRating(supplierId) {
        if (!this.db) return;

        try {
            const ratingData = await this.getSupplierRating(supplierId);
            await this.db.ref(`suppliers/${supplierId}/averageRating`).set(ratingData.rating);
            await this.db.ref(`suppliers/${supplierId}/ratingCount`).set(ratingData.count);
        } catch (error) {
            console.error('Error updating supplier average rating:', error);
        }
    }

    // Generate star HTML
    generateStarHTML(rating, size = 'sm') {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let html = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            html += `<i class="fas fa-star text-warning"></i>`;
        }
        
        // Half star
        if (hasHalfStar) {
            html += `<i class="fas fa-star-half-alt text-warning"></i>`;
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            html += `<i class="far fa-star text-warning"></i>`;
        }
        
        return html;
    }

    // Check if user can rate (load must be completed)
    async canRateLoad(loadId, userId, userType) {
        if (!this.db) return false;

        try {
            const loadSnapshot = await this.db.ref(`loads/${loadId}`).once('value');
            const load = loadSnapshot.val();

            if (!load || load.status !== 'completed') {
                return false;
            }

            // Check if already rated
            if (userType === 'supplier') {
                if (load.carrierRating) {
                    return false; // Already rated
                }
                return load.supplierId === userId;
            } else if (userType === 'carrier') {
                if (load.supplierRating) {
                    return false; // Already rated
                }
                return load.carrierId === userId;
            }

            return false;
        } catch (error) {
            console.error('Error checking if can rate:', error);
            return false;
        }
    }
}

// Initialize global instance
window.RatingSystem = new RatingSystem();

console.log('✅ Rating System loaded');

