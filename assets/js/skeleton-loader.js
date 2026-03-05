/**
 * Skeleton Loader System
 * Alpha Freight - Loading States for Better UX
 */

class SkeletonLoader {
    // Create skeleton for load cards
    static createLoadCardSkeleton(count = 3) {
        return Array(count).fill(0).map(() => `
            <div class="skeleton-load-card">
                <div class="skeleton-header">
                    <div class="skeleton-avatar"></div>
                    <div class="skeleton-text-group">
                        <div class="skeleton-line skeleton-title"></div>
                        <div class="skeleton-line skeleton-subtitle"></div>
                    </div>
                </div>
                <div class="skeleton-content">
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line skeleton-short"></div>
                    <div class="skeleton-line"></div>
                </div>
                <div class="skeleton-footer">
                    <div class="skeleton-button"></div>
                    <div class="skeleton-button"></div>
                </div>
            </div>
        `).join('');
    }

    // Create skeleton for dashboard stats
    static createStatsSkeleton(count = 4) {
        return Array(count).fill(0).map(() => `
            <div class="skeleton-stat-card">
                <div class="skeleton-icon"></div>
                <div class="skeleton-text-group">
                    <div class="skeleton-line skeleton-short"></div>
                    <div class="skeleton-line skeleton-title"></div>
                </div>
            </div>
        `).join('');
    }

    // Create skeleton for table rows
    static createTableSkeleton(rows = 5, cols = 4) {
        return Array(rows).fill(0).map(() => `
            <tr class="skeleton-table-row">
                ${Array(cols).fill(0).map(() => `
                    <td><div class="skeleton-line"></div></td>
                `).join('')}
            </tr>
        `).join('');
    }

    // Create skeleton for list items
    static createListSkeleton(count = 5) {
        return Array(count).fill(0).map(() => `
            <div class="skeleton-list-item">
                <div class="skeleton-avatar"></div>
                <div class="skeleton-text-group">
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line skeleton-short"></div>
                </div>
            </div>
        `).join('');
    }

    // Create skeleton for map
    static createMapSkeleton() {
        return `
            <div class="skeleton-map">
                <div class="skeleton-map-overlay">
                    <div class="skeleton-map-marker"></div>
                    <div class="skeleton-map-marker"></div>
                </div>
            </div>
        `;
    }

    // Show skeleton in container
    static show(containerId, type = 'load-card', count = 3) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let skeletonHTML = '';
        switch(type) {
            case 'load-card':
                skeletonHTML = this.createLoadCardSkeleton(count);
                break;
            case 'stats':
                skeletonHTML = this.createStatsSkeleton(count);
                break;
            case 'table':
                skeletonHTML = this.createTableSkeleton(count);
                break;
            case 'list':
                skeletonHTML = this.createListSkeleton(count);
                break;
            case 'map':
                skeletonHTML = this.createMapSkeleton();
                break;
            default:
                skeletonHTML = this.createLoadCardSkeleton(count);
        }

        container.innerHTML = skeletonHTML;
    }

    // Hide skeleton
    static hide(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '';
        }
    }
}

// Add CSS styles
const skeletonStyle = document.createElement('style');
skeletonStyle.textContent = `
    /* Skeleton Animation */
    @keyframes skeleton-loading {
        0% {
            background-position: -200px 0;
        }
        100% {
            background-position: calc(200px + 100%) 0;
        }
    }

    .skeleton-base {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s ease-in-out infinite;
        border-radius: 4px;
    }

    /* Load Card Skeleton */
    .skeleton-load-card {
        background: white;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .skeleton-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
    }

    .skeleton-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s ease-in-out infinite;
    }

    .skeleton-text-group {
        flex: 1;
    }

    .skeleton-line {
        height: 12px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s ease-in-out infinite;
        border-radius: 4px;
        margin-bottom: 8px;
    }

    .skeleton-line:last-child {
        margin-bottom: 0;
    }

    .skeleton-title {
        width: 60%;
        height: 16px;
    }

    .skeleton-subtitle {
        width: 40%;
        height: 10px;
        margin-top: 6px;
    }

    .skeleton-short {
        width: 50%;
    }

    .skeleton-content {
        margin-bottom: 16px;
    }

    .skeleton-footer {
        display: flex;
        gap: 8px;
    }

    .skeleton-button {
        width: 100px;
        height: 36px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s ease-in-out infinite;
        border-radius: 8px;
    }

    /* Stats Skeleton */
    .skeleton-stat-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .skeleton-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s ease-in-out infinite;
    }

    /* Table Skeleton */
    .skeleton-table-row td {
        padding: 12px;
    }

    .skeleton-table-row .skeleton-line {
        height: 14px;
    }

    /* List Skeleton */
    .skeleton-list-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: white;
        border-radius: 8px;
        margin-bottom: 8px;
    }

    /* Map Skeleton */
    .skeleton-map {
        width: 100%;
        height: 400px;
        background: linear-gradient(90deg, #e8e8e8 25%, #d0d0d0 50%, #e8e8e8 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s ease-in-out infinite;
        border-radius: 12px;
        position: relative;
        overflow: hidden;
    }

    .skeleton-map-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }

    .skeleton-map-marker {
        position: absolute;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(255,255,255,0.8);
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .skeleton-map-marker:nth-child(1) {
        top: 30%;
        left: 40%;
    }

    .skeleton-map-marker:nth-child(2) {
        top: 60%;
        left: 70%;
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
        .skeleton-base,
        .skeleton-line,
        .skeleton-avatar,
        .skeleton-button,
        .skeleton-icon,
        .skeleton-map {
            background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
            background-size: 200% 100%;
        }

        .skeleton-load-card,
        .skeleton-stat-card,
        .skeleton-list-item {
            background: #1a1a1a;
        }
    }
`;
document.head.appendChild(skeletonStyle);

// Export
window.SkeletonLoader = SkeletonLoader;

console.log('💀 Skeleton Loader System loaded');

