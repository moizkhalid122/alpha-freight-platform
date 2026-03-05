// Alpha Freight - Analytics Data Handler
// Fetches real data from Firebase for analytics pages

class AnalyticsData {
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
            console.warn('Firebase not initialized for analytics');
        }
    }

    // Get dashboard statistics
    async getDashboardStats(callback) {
        if (!this.db) {
            if (callback) callback(this.getDefaultStats());
            return this.getDefaultStats();
        }

        try {
            const [loadsSnapshot, carriersSnapshot, suppliersSnapshot, paymentsSnapshot] = await Promise.all([
                this.db.ref('loads').once('value'),
                this.db.ref('carriers').once('value'),
                this.db.ref('suppliers').once('value'),
                this.db.ref('payments').once('value')
            ]);

            const loads = loadsSnapshot.val() || {};
            const carriers = carriersSnapshot.val() || {};
            const suppliers = suppliersSnapshot.val() || {};
            const payments = paymentsSnapshot.val() || {};

            // Calculate stats
            const totalLoads = Object.keys(loads).length;
            const activeLoads = Object.values(loads).filter(l => l.status === 'active' || l.status === 'in_transit').length;
            const completedLoads = Object.values(loads).filter(l => l.status === 'completed').length;
            const pendingLoads = Object.values(loads).filter(l => l.status === 'pending').length;

            const totalCarriers = Object.keys(carriers).length;
            const verifiedCarriers = Object.values(carriers).filter(c => c.verificationStatus === 'verified').length;
            const pendingCarriers = Object.values(carriers).filter(c => c.verificationStatus === 'pending').length;

            const totalSuppliers = Object.keys(suppliers).length;
            const verifiedSuppliers = Object.values(suppliers).filter(s => s.verificationStatus === 'verified').length;
            const pendingSuppliers = Object.values(suppliers).filter(s => s.verificationStatus === 'pending').length;

            const totalPayments = Object.values(payments).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
            const completedPayments = Object.values(payments).filter(p => p.status === 'completed').length;
            const pendingPayments = Object.values(payments).filter(p => p.status === 'pending').length;

            const stats = {
                loads: {
                    total: totalLoads,
                    active: activeLoads,
                    completed: completedLoads,
                    pending: pendingLoads
                },
                carriers: {
                    total: totalCarriers,
                    verified: verifiedCarriers,
                    pending: pendingCarriers
                },
                suppliers: {
                    total: totalSuppliers,
                    verified: verifiedSuppliers,
                    pending: pendingSuppliers
                },
                payments: {
                    total: totalPayments,
                    completed: completedPayments,
                    pending: pendingPayments
                }
            };

            if (callback) callback(stats);
            return stats;
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            const defaultStats = this.getDefaultStats();
            if (callback) callback(defaultStats);
            return defaultStats;
        }
    }

    // Get load statistics by date range
    async getLoadStatsByDateRange(startDate, endDate, callback) {
        if (!this.db) {
            if (callback) callback([]);
            return [];
        }

        try {
            const snapshot = await this.db.ref('loads').once('value');
            const loads = snapshot.val() || {};
            
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            const filteredLoads = Object.values(loads).filter(load => {
                const loadDate = new Date(load.createdAt || load.timestamp);
                return loadDate >= start && loadDate <= end;
            });

            // Group by date
            const dailyStats = {};
            filteredLoads.forEach(load => {
                const date = new Date(load.createdAt || load.timestamp).toISOString().split('T')[0];
                if (!dailyStats[date]) {
                    dailyStats[date] = { date, total: 0, active: 0, completed: 0, revenue: 0 };
                }
                dailyStats[date].total++;
                if (load.status === 'active' || load.status === 'in_transit') dailyStats[date].active++;
                if (load.status === 'completed') {
                    dailyStats[date].completed++;
                    dailyStats[date].revenue += parseFloat(load.price || load.totalCost || 0);
                }
            });

            const result = Object.values(dailyStats).sort((a, b) => new Date(a.date) - new Date(b.date));
            if (callback) callback(result);
            return result;
        } catch (error) {
            console.error('Error getting load stats by date range:', error);
            if (callback) callback([]);
            return [];
        }
    }

    // Get revenue statistics
    async getRevenueStats(callback) {
        if (!this.db) {
            if (callback) callback({ total: 0, monthly: [], byStatus: {} });
            return { total: 0, monthly: [], byStatus: {} };
        }

        try {
            const [loadsSnapshot, paymentsSnapshot] = await Promise.all([
                this.db.ref('loads').once('value'),
                this.db.ref('payments').once('value')
            ]);

            const loads = loadsSnapshot.val() || {};
            const payments = paymentsSnapshot.val() || {};

            // Calculate total revenue from completed loads
            let totalRevenue = 0;
            const monthlyRevenue = {};
            const byStatus = { completed: 0, pending: 0, cancelled: 0 };

            Object.values(loads).forEach(load => {
                if (load.status === 'completed') {
                    const revenue = parseFloat(load.price || load.totalCost || 0);
                    totalRevenue += revenue;
                    byStatus.completed += revenue;

                    const month = new Date(load.completedAt || load.createdAt).toISOString().substring(0, 7);
                    if (!monthlyRevenue[month]) monthlyRevenue[month] = 0;
                    monthlyRevenue[month] += revenue;
                } else if (load.status === 'pending') {
                    byStatus.pending += parseFloat(load.price || load.totalCost || 0);
                } else if (load.status === 'cancelled') {
                    byStatus.cancelled += parseFloat(load.price || load.totalCost || 0);
                }
            });

            // Add payments data
            Object.values(payments).forEach(payment => {
                if (payment.status === 'completed') {
                    const amount = parseFloat(payment.amount || 0);
                    totalRevenue += amount;
                }
            });

            const monthlyArray = Object.entries(monthlyRevenue)
                .map(([month, revenue]) => ({ month, revenue }))
                .sort((a, b) => a.month.localeCompare(b.month));

            const result = {
                total: totalRevenue,
                monthly: monthlyArray,
                byStatus: byStatus
            };

            if (callback) callback(result);
            return result;
        } catch (error) {
            console.error('Error getting revenue stats:', error);
            const defaultResult = { total: 0, monthly: [], byStatus: {} };
            if (callback) callback(defaultResult);
            return defaultResult;
        }
    }

    // Get user growth statistics
    async getUserGrowthStats(callback) {
        if (!this.db) {
            if (callback) callback([]);
            return [];
        }

        try {
            const [carriersSnapshot, suppliersSnapshot] = await Promise.all([
                this.db.ref('carriers').once('value'),
                this.db.ref('suppliers').once('value')
            ]);

            const carriers = carriersSnapshot.val() || {};
            const suppliers = suppliersSnapshot.val() || {};

            // Group by month
            const monthlyStats = {};

            Object.values(carriers).forEach(carrier => {
                const month = new Date(carrier.createdAt || carrier.timestamp).toISOString().substring(0, 7);
                if (!monthlyStats[month]) {
                    monthlyStats[month] = { month, carriers: 0, suppliers: 0, total: 0 };
                }
                monthlyStats[month].carriers++;
                monthlyStats[month].total++;
            });

            Object.values(suppliers).forEach(supplier => {
                const month = new Date(supplier.createdAt || supplier.timestamp).toISOString().substring(0, 7);
                if (!monthlyStats[month]) {
                    monthlyStats[month] = { month, carriers: 0, suppliers: 0, total: 0 };
                }
                monthlyStats[month].suppliers++;
                monthlyStats[month].total++;
            });

            const result = Object.values(monthlyStats)
                .sort((a, b) => a.month.localeCompare(b.month));

            if (callback) callback(result);
            return result;
        } catch (error) {
            console.error('Error getting user growth stats:', error);
            if (callback) callback([]);
            return [];
        }
    }

    // Get default stats (fallback)
    getDefaultStats() {
        return {
            loads: { total: 0, active: 0, completed: 0, pending: 0 },
            carriers: { total: 0, verified: 0, pending: 0 },
            suppliers: { total: 0, verified: 0, pending: 0 },
            payments: { total: 0, completed: 0, pending: 0 }
        };
    }

    // Format currency
    formatCurrency(amount, currency = 'GBP') {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    // Format number
    formatNumber(num) {
        return new Intl.NumberFormat('en-GB').format(num);
    }
}

// Initialize global instance
window.AnalyticsData = new AnalyticsData();

console.log('✅ Analytics Data Handler loaded');

