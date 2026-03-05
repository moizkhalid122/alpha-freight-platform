(function(window, document) {
    'use strict';

    const form = document.querySelector('[data-admin-post-form]');
    if (!form) return;

    const textInput = form.querySelector('[data-post-text]');
    const mediaTypeSelect = form.querySelector('[data-media-type]');
    const mediaUrlInput = form.querySelector('[data-media-url]');
    const previewContainer = form.querySelector('[data-media-preview]');
    const resetBtn = form.querySelector('[data-reset-btn]');

    let db = null;
    let adminProfile = null;

    function ensureFirebase() {
        if (db) return db;
        if (window.AlphaBrokrage?.firebaseDb) {
            db = window.AlphaBrokrage.firebaseDb;
        } else if (typeof firebase !== 'undefined') {
            db = firebase.database();
        } else {
            console.error('[AdminSocialPost] Firebase not available');
        }
        return db;
    }

    function getAdminAuth() {
        try {
            return JSON.parse(localStorage.getItem('adminAuth') || 'null');
        } catch (err) {
            console.error('[AdminSocialPost] Failed to parse adminAuth', err);
            return null;
        }
    }

    function sanitizeKey(text) {
        return (text || 'admin')
            .toString()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'admin';
    }

    function ensureAdminProfileRecord() {
        const database = ensureFirebase();
        if (!database) return;
        const auth = getAdminAuth() || {};
        const baseId = auth.adminId || auth.email || 'alpha-admin';
        const adminId = `admin-${sanitizeKey(baseId)}`;

        adminProfile = {
            id: adminId,
            name: auth.name || 'Alpha Freight Admin',
            company: 'Alpha Freight Admin',
            role: 'Admin',
            avatar: auth.avatar || 'https://i.pravatar.cc/200?img=68',
            location: auth.location || 'Global HQ'
        };

        database.ref(`social/users/${adminId}`).update({
            name: adminProfile.name,
            company: adminProfile.company,
            role: adminProfile.role,
            avatar: adminProfile.avatar,
            location: adminProfile.location,
            verified: true,
            updatedAt: Date.now()
        }).catch(err => console.error('[AdminSocialPost] Failed to ensure admin profile', err));
    }

    function buildPayload() {
        const text = (textInput?.value || '').trim();
        const mediaType = mediaTypeSelect?.value || 'none';
        const mediaUrl = (mediaUrlInput?.value || '').trim();

        if (!text) {
            throw new Error('Post content is required.');
        }

        const payload = {
            text,
            comments: 0,
            shares: 0,
            views: 0,
            createdAt: Date.now(),
            postType: 'adminNews'
        };

        if (mediaType !== 'none' && mediaUrl) {
            payload.mediaUrl = mediaUrl;
            payload.mediaType = mediaType;
        }
        return payload;
    }

    function submitPost(event) {
        event.preventDefault();
        const database = ensureFirebase();
        if (!database) {
            alert('Firebase connection not available. Please refresh and try again.');
            return;
        }

        if (!adminProfile) {
            ensureAdminProfileRecord();
        }

        let payload;
        try {
            payload = buildPayload();
        } catch (err) {
            alert(err.message);
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalLabel = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Publishing...';
        submitBtn.disabled = true;

        const postRef = database.ref('social/posts').push();
        const authorId = adminProfile?.id || 'admin-alpha';
        const postData = Object.assign({}, payload, {
            authorId,
            likes: {
                [`${adminProfile.id}-seed`]: true
            }
        });

        postRef.set(postData).then(() => {
            form.reset();
            mediaUrlInput.disabled = true;
            if (previewContainer) {
                previewContainer.style.display = 'none';
                previewContainer.innerHTML = '';
            }
            submitBtn.innerHTML = originalLabel;
            submitBtn.disabled = false;
            if (window.AlphaBrokrage?.showAlert) {
                window.AlphaBrokrage.showAlert('success', 'Admin update published successfully.');
            } else {
                alert('Admin update published successfully.');
            }
        }).catch(err => {
            console.error('[AdminSocialPost] Failed to publish post', err);
            submitBtn.innerHTML = originalLabel;
            submitBtn.disabled = false;
            alert('Post could not be published. Please try again.');
        });
    }

    function handleMediaTypeChange() {
        const type = mediaTypeSelect?.value || 'none';
        if (!mediaUrlInput) return;
        if (type === 'none') {
            mediaUrlInput.disabled = true;
            mediaUrlInput.value = '';
            if (previewContainer) {
                previewContainer.style.display = 'none';
                previewContainer.innerHTML = '';
            }
            return;
        }
        mediaUrlInput.disabled = false;
        updatePreview();
    }

    function updatePreview() {
        if (!previewContainer) return;
        const type = mediaTypeSelect?.value || 'none';
        const url = (mediaUrlInput?.value || '').trim();
        if (type === 'none' || !url) {
            previewContainer.style.display = 'none';
            previewContainer.innerHTML = '';
            return;
        }
        let markup = '';
        if (type === 'image') {
            markup = `<img src="${url}" alt="Attachment" class="w-100">`;
        } else if (type === 'video') {
            markup = `
                <div class="ratio ratio-16x9">
                    <video src="${url}" class="w-100 h-100" controls></video>
                </div>`;
        } else if (type === 'link') {
            markup = `
                <div class="p-3 bg-light border rounded-4">
                    <i class="fas fa-link text-primary me-2"></i>
                    <a href="${url}" target="_blank" rel="noopener" class="fw-semibold">${url}</a>
                </div>`;
        }
        previewContainer.innerHTML = markup;
        previewContainer.style.display = 'block';
    }

    function resetForm() {
        form.reset();
        mediaUrlInput.disabled = true;
        if (previewContainer) {
            previewContainer.style.display = 'none';
            previewContainer.innerHTML = '';
        }
    }

    ensureFirebase();
    ensureAdminProfileRecord();

    form.addEventListener('submit', submitPost);
    if (mediaTypeSelect) mediaTypeSelect.addEventListener('change', handleMediaTypeChange);
    if (mediaUrlInput) mediaUrlInput.addEventListener('input', updatePreview);
    if (resetBtn) resetBtn.addEventListener('click', resetForm);

})(window, document);
