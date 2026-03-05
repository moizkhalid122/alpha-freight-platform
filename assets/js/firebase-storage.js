/**
 * Firebase Storage Helper
 * Alpha Freight - File Upload with CORS Fix
 * Handles all file uploads to Firebase Storage
 */

class FirebaseStorageHelper {
    constructor() {
        this.storage = null;
        this.init();
    }

    init() {
        // Initialize Firebase Storage
        if (window.firebase && window.firebase.storage) {
            try {
                const firebaseApp = window.AlphaBrokrage?.firebaseApp || firebase.app();
                this.storage = firebase.storage();
                console.log('✅ Firebase Storage initialized');
            } catch (error) {
                console.error('❌ Firebase Storage initialization failed:', error);
            }
        } else {
            console.warn('⚠️ Firebase Storage SDK not loaded');
        }
    }

    /**
     * Upload file to Firebase Storage
     * @param {File} file - File to upload
     * @param {string} folder - Folder path (e.g., 'documents', 'vehicles', 'profiles')
     * @param {string} userId - User ID for organizing files
     * @param {Function} onProgress - Progress callback
     * @returns {Promise} Upload result with URL
     */
    async uploadFile(file, folder = 'documents', userId = null, onProgress = null) {
        if (!this.storage) {
            throw new Error('Firebase Storage not initialized');
        }

        if (!file) {
            throw new Error('No file provided');
        }

        try {
            // Generate unique filename
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(7);
            const fileExtension = file.name.split('.').pop();
            const fileName = `${timestamp}_${randomStr}.${fileExtension}`;
            
            // Create storage path
            let storagePath;
            if (userId) {
                storagePath = `${folder}/${userId}/${fileName}`;
            } else {
                storagePath = `${folder}/${fileName}`;
            }

            // Create storage reference
            const storageRef = this.storage.ref(storagePath);

            // Show upload progress
            showInfo('Uploading file...', { duration: 2000 });

            // Upload file
            const uploadTask = storageRef.put(file);

            // Monitor upload progress
            if (onProgress) {
                uploadTask.on('state_changed', 
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        onProgress(progress);
                    },
                    (error) => {
                        console.error('Upload error:', error);
                        showError('File upload failed: ' + error.message);
                    },
                    async () => {
                        // Upload complete
                        try {
                            const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                            showSuccess('File uploaded successfully!');
                            
                            if (onProgress) {
                                onProgress(100);
                            }

                            return {
                                success: true,
                                url: downloadURL,
                                path: storagePath,
                                fileName: file.name,
                                size: file.size,
                                type: file.type
                            };
                        } catch (error) {
                            console.error('Error getting download URL:', error);
                            showError('Failed to get file URL');
                            throw error;
                        }
                    }
                );
            } else {
                // Wait for upload to complete
                await uploadTask;
                
                // Get download URL
                const downloadURL = await storageRef.getDownloadURL();
                
                showSuccess('File uploaded successfully!');
                
                return {
                    success: true,
                    url: downloadURL,
                    path: storagePath,
                    fileName: file.name,
                    size: file.size,
                    type: file.type
                };
            }

        } catch (error) {
            console.error('Upload error:', error);
            showError('File upload failed: ' + error.message);
            throw error;
        }
    }

    /**
     * Upload multiple files
     * @param {FileList|Array} files - Files to upload
     * @param {string} folder - Folder path
     * @param {string} userId - User ID
     * @returns {Promise} Array of upload results
     */
    async uploadMultipleFiles(files, folder = 'documents', userId = null) {
        const uploadPromises = Array.from(files).map(file => 
            this.uploadFile(file, folder, userId)
        );

        try {
            const results = await Promise.all(uploadPromises);
            showSuccess(`${results.length} files uploaded successfully!`);
            return results;
        } catch (error) {
            console.error('Multiple upload error:', error);
            showError('Some files failed to upload');
            throw error;
        }
    }

    /**
     * Delete file from Firebase Storage
     * @param {string} filePath - Storage path or URL
     * @returns {Promise} Delete result
     */
    async deleteFile(filePath) {
        if (!this.storage) {
            throw new Error('Firebase Storage not initialized');
        }

        try {
            // If URL provided, extract path
            let storagePath = filePath;
            if (filePath.startsWith('https://')) {
                // Extract path from Firebase Storage URL
                const urlParts = filePath.split('/o/');
                if (urlParts.length > 1) {
                    storagePath = decodeURIComponent(urlParts[1].split('?')[0]);
                }
            }

            const storageRef = this.storage.ref(storagePath);
            await storageRef.delete();
            
            showSuccess('File deleted successfully');
            return { success: true };
        } catch (error) {
            console.error('Delete error:', error);
            showError('Failed to delete file: ' + error.message);
            throw error;
        }
    }

    /**
     * Get file download URL
     * @param {string} filePath - Storage path
     * @returns {Promise} Download URL
     */
    async getDownloadURL(filePath) {
        if (!this.storage) {
            throw new Error('Firebase Storage not initialized');
        }

        try {
            const storageRef = this.storage.ref(filePath);
            const url = await storageRef.getDownloadURL();
            return url;
        } catch (error) {
            console.error('Get URL error:', error);
            throw error;
        }
    }

    /**
     * Validate file before upload
     * @param {File} file - File to validate
     * @param {Object} options - Validation options
     * @returns {Object} Validation result
     */
    validateFile(file, options = {}) {
        const {
            maxSize = 10 * 1024 * 1024, // 10MB default
            allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
            allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf']
        } = options;

        const errors = [];

        // Check file size
        if (file.size > maxSize) {
            errors.push(`File size exceeds ${(maxSize / 1024 / 1024).toFixed(2)}MB limit`);
        }

        // Check file type
        if (!allowedTypes.includes(file.type)) {
            errors.push('File type not allowed');
        }

        // Check file extension
        const extension = file.name.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(extension)) {
            errors.push(`File extension .${extension} not allowed`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// Initialize global instance
window.FirebaseStorage = new FirebaseStorageHelper();

// Helper functions
window.uploadFile = async (file, folder, userId) => {
    return await window.FirebaseStorage.uploadFile(file, folder, userId);
};

window.uploadMultipleFiles = async (files, folder, userId) => {
    return await window.FirebaseStorage.uploadMultipleFiles(files, folder, userId);
};

window.deleteFile = async (filePath) => {
    return await window.FirebaseStorage.deleteFile(filePath);
};

console.log('📦 Firebase Storage Helper loaded');

