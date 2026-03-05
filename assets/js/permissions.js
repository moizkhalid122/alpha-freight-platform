/**
 * Permission Request Manager
 * Automatically requests notification and media permissions when app loads
 */

// Request all necessary permissions
async function requestAllPermissions() {
    const permissions = {
        notification: false,
        media: false
    };

    // Request notification permission
    if ('Notification' in window) {
        if (Notification.permission === 'default') {
            try {
                const permission = await Notification.requestPermission();
                permissions.notification = permission === 'granted';
                console.log('📬 Notification permission:', permission);
            } catch (error) {
                console.error('Error requesting notification permission:', error);
            }
        } else {
            permissions.notification = Notification.permission === 'granted';
            console.log('📬 Notification permission already:', Notification.permission);
        }
    }

    // Request media/camera permission (for image picker)
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            // Try to access camera briefly to trigger permission prompt
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' },
                audio: false 
            });
            // Immediately stop the stream - we just wanted permission
            stream.getTracks().forEach(track => track.stop());
            permissions.media = true;
            console.log('📷 Media/Camera permission granted');
        } catch (error) {
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                console.log('📷 Media/Camera permission denied');
            } else {
                console.log('📷 Media/Camera permission:', error.name);
            }
        }
    }

    // Request file system access (for image picker on some browsers)
    if ('showOpenFilePicker' in window) {
        try {
            // This will prompt for file access permission
            const fileHandle = await window.showOpenFilePicker({
                types: [{
                    description: 'Images',
                    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] }
                }],
                multiple: false
            });
            // Close immediately - we just wanted permission
            if (fileHandle && fileHandle.length > 0) {
                fileHandle[0].close();
            }
            console.log('📁 File system permission granted');
        } catch (error) {
            console.log('📁 File system permission:', error.name);
        }
    }

    return permissions;
}

// Don't auto-request permissions - wait for user interaction
// This is required by browser security policies

// Export for manual use
window.requestPermissions = requestAllPermissions;

// Create permission request button/modal
function showPermissionModal() {
    // Check if modal already exists
    if (document.getElementById('permissionModal')) {
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'permissionModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;

    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 20px;
            padding: 30px;
            max-width: 400px;
            width: 100%;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        ">
            <div style="font-size: 48px; margin-bottom: 20px;">🔔</div>
            <h2 style="margin-bottom: 15px; color: #0A2A4A; font-size: 22px;">Enable Notifications</h2>
            <p style="color: #6b7280; margin-bottom: 25px; line-height: 1.6;">
                Allow notifications to stay updated with new loads, payments, and important updates.
            </p>
            <div style="display: flex; gap: 12px;">
                <button id="allowNotificationsBtn" style="
                    flex: 1;
                    padding: 14px;
                    background: #1FA9FF;
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                ">Allow</button>
                <button id="skipNotificationsBtn" style="
                    flex: 1;
                    padding: 14px;
                    background: #f3f4f6;
                    color: #6b7280;
                    border: none;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                ">Skip</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Allow button
    document.getElementById('allowNotificationsBtn').addEventListener('click', async () => {
        await requestAllPermissions();
        modal.remove();
        localStorage.setItem('permissionsRequested', 'true');
    });

    // Skip button
    document.getElementById('skipNotificationsBtn').addEventListener('click', () => {
        modal.remove();
        localStorage.setItem('permissionsRequested', 'true');
    });
}

// Show permission modal only once and only after user interaction
function initPermissionRequest() {
    // Check if already requested
    if (localStorage.getItem('permissionsRequested') === 'true') {
        return;
    }

    // Check if notification permission already granted
    if ('Notification' in window && Notification.permission !== 'default') {
        localStorage.setItem('permissionsRequested', 'true');
        return;
    }

    // Wait for user interaction (click, touch, etc.)
    const events = ['click', 'touchstart', 'keydown'];
    const requestOnInteraction = () => {
        // Small delay to let page settle
        setTimeout(() => {
            showPermissionModal();
        }, 1000);
        
        // Remove listeners after first interaction
        events.forEach(event => {
            document.removeEventListener(event, requestOnInteraction);
        });
    };

    events.forEach(event => {
        document.addEventListener(event, requestOnInteraction, { once: true });
    });
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPermissionRequest);
} else {
    initPermissionRequest();
}

console.log('🔐 Permission Manager loaded - Waiting for user interaction');

