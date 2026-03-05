(function(window, document) {
    'use strict';

    const state = {
        users: {},
        posts: {},
        sortMode: 'latest'
    };

    const DEFAULT_ADMIN_AVATAR = 'https://i.pravatar.cc/200?img=68';
    const DEFAULT_ADMIN_TAGLINE = 'Managing community insights, engagement & compliance.';
    const DEFAULT_ADMIN_BIO = 'Driving growth and compliance for the Alpha Freight community.';

    const adminSession = loadAdminSession();
    const adminCandidateIds = new Set(buildAdminCandidateIds(adminSession));

    const adminProfileUI = {
        name: null,
        nameText: null,
        tagline: null,
        bio: null,
        avatar: null,
        avatarPreview: null,
        avatarInput: null,
        avatarFile: null,
        editButton: null,
        form: null,
        submitButton: null,
        modalEl: null
    };

    let adminProfileModal = null;
    let adminProfileSaving = false;
    let adminProfileSubmitOriginal = '';

    let db = null;
    let initialized = false;
    const engagementController = {
        timerId: null
    };

    function loadAdminSession() {
        if (typeof localStorage === 'undefined') return null;
        try {
            const raw = localStorage.getItem('adminAuth');
            return raw ? JSON.parse(raw) : null;
        } catch (err) {
            console.warn('[AdminSocial] Failed to parse adminAuth from localStorage', err);
            return null;
        }
    }

    function buildAdminCandidateIds(session) {
        if (!session) return [];
        const ids = new Set();
        const candidates = [session.adminId, session.email];
        candidates.forEach(identifier => {
            if (!identifier) return;
            const trimmed = identifier.toString().trim();
            if (!trimmed) return;
            const normalized = sanitizeKey(trimmed);
            ids.add(trimmed);
            ids.add(normalized);
            ids.add(`admin-${normalized}`);
        });
        return Array.from(ids);
    }

    function sanitizeKey(value) {
        return (value || '')
            .toString()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function ensureFirebase() {
        if (db) return db;
        if (window.AlphaBrokrage?.firebaseDb) {
            db = window.AlphaBrokrage.firebaseDb;
        } else if (typeof firebase !== 'undefined') {
            db = firebase.database();
        } else {
            console.error('[AdminSocial] Firebase not available');
        }
        return db;
    }

    function init() {
        if (initialized) return;
        if (!ensureFirebase()) return;
        bindControls();
        attachListeners();
        ensureEngagementLoop();
        initialized = true;
    }

    function attachListeners() {
        const database = ensureFirebase();
        if (!database) return;

        database.ref('social/users').on('value', snapshot => {
            const raw = snapshot.val() || {};
            const normalized = {};
            Object.keys(raw).forEach(id => {
                normalized[id] = normalizeUser(raw[id], id);
            });
            state.users = normalized;
            renderUserFilter();
            renderAdminProfile();
            renderPosts();
        });

        database.ref('social/posts').on('value', snapshot => {
            const raw = snapshot.val() || {};
            state.posts = raw;
            renderPosts();
            updateStats();
        });
    }

    function bindControls() {
        const filterSelect = document.querySelector('[data-user-filter]');
        const searchInput = document.querySelector('[data-post-search]');
        const sortSelect = document.querySelector('[data-sort-mode]');
        adminProfileUI.name = document.querySelector('[data-admin-name]');
        adminProfileUI.nameText = adminProfileUI.name ? adminProfileUI.name.querySelector('span') : null;
        adminProfileUI.tagline = document.querySelector('[data-admin-tagline]');
        adminProfileUI.bio = document.querySelector('[data-admin-bio]');
        adminProfileUI.avatar = document.querySelector('[data-admin-avatar]');
        adminProfileUI.editButton = document.querySelector('[data-admin-edit-profile]');
        adminProfileUI.form = document.querySelector('[data-admin-profile-form]');
        adminProfileUI.submitButton = document.querySelector('[data-admin-profile-submit]');
        adminProfileUI.modalEl = document.getElementById('adminProfileModal');
        if (adminProfileUI.form) {
            adminProfileUI.avatarPreview = adminProfileUI.form.querySelector('[data-admin-avatar-preview]');
            adminProfileUI.avatarInput = adminProfileUI.form.querySelector('input[name="avatar"]');
            adminProfileUI.avatarFile = adminProfileUI.form.querySelector('[data-admin-avatar-file]');
        }

        if (filterSelect) {
            filterSelect.addEventListener('change', renderPosts);
        }
        if (searchInput) {
            let debounceTimer = null;
            searchInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(renderPosts, 250);
            });
        }
        if (sortSelect) {
            sortSelect.addEventListener('change', event => {
                state.sortMode = event.target.value || 'latest';
                renderPosts();
            });
        }
        if (adminProfileUI.editButton) {
            adminProfileUI.editButton.addEventListener('click', event => {
                event.preventDefault();
                openAdminProfileEditor();
            });
        }
        if (adminProfileUI.form) {
            adminProfileUI.form.addEventListener('submit', handleAdminProfileSubmit);
        }
        if (adminProfileUI.avatarInput) {
            adminProfileUI.avatarInput.addEventListener('input', () => {
                const value = adminProfileUI.avatarInput.value.trim();
                setAdminAvatarPreview(value || DEFAULT_ADMIN_AVATAR);
            });
        }
        if (adminProfileUI.avatarFile) {
            adminProfileUI.avatarFile.addEventListener('change', handleAdminAvatarFile);
        }
    }

    function normalizeUser(data, id) {
        const followers = data && typeof data.followers === 'object' ? Object.keys(data.followers) : [];
        const following = data && typeof data.following === 'object' ? Object.keys(data.following) : [];
        return {
            id,
            name: data?.name || 'Community Member',
            company: data?.company || data?.name || 'Community Member',
            role: data?.role || 'Member',
            avatar: data?.avatar || 'https://via.placeholder.com/120?text=User',
            location: data?.location || '',
            followersCount: followers.length,
            followingCount: following.length,
            tagline: (data?.tagline || data?.headline || '').toString().trim(),
            bio: (data?.bio || data?.description || '').toString().trim(),
            verified: Boolean(data?.verified)
        };
    }

    function buildPostList() {
        const entries = Object.entries(state.posts || {});
        const posts = entries.map(([id, post]) => {
            const createdAt = Number(post.createdAt) || Date.now();
            const rawLikes = post.likes || {};
            const likesArray = Array.isArray(rawLikes) ? rawLikes : Object.keys(rawLikes);
            const likesMap = Array.isArray(rawLikes) ? arrayToMap(rawLikes) : rawLikes;
            const author = state.users[post.authorId] || {
                id: post.authorId || 'unknown',
                company: 'Unknown Author',
                role: 'Member',
                avatar: 'https://via.placeholder.com/120?text=User',
                verified: false,
                followersCount: 0,
                location: ''
            };
            return {
                id,
                text: post.text || '',
                mediaUrl: post.mediaUrl || null,
                mediaType: post.mediaType || null,
                likes: likesArray,
                likesMap,
                comments: Number(post.comments) || 0,
                views: Number(post.views) || 0,
                createdAt,
                author,
                postType: post.postType || 'standard'
            };
        });

        const sortMode = state.sortMode || 'latest';
        if (sortMode === 'likes') {
            posts.sort((a, b) => (b.likes.length || 0) - (a.likes.length || 0));
        } else {
            posts.sort((a, b) => b.createdAt - a.createdAt);
        }

        return posts;
    }

    function renderPosts() {
        const container = document.querySelector('[data-posts-list]');
        const header = document.querySelector('[data-posts-header]');
        const countBadge = document.querySelector('[data-posts-count]');
        const loadingState = document.querySelector('[data-loading-state]');
        const emptyState = document.querySelector('[data-empty-state]');
        const filterSelect = document.querySelector('[data-user-filter]');
        const searchInput = document.querySelector('[data-post-search]');

        if (!container) return;

        const posts = buildPostList();
        const filterValue = filterSelect ? filterSelect.value : 'all';
        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

        let filtered = posts;
        if (filterValue && filterValue !== 'all') {
            filtered = filtered.filter(post => post.author.id === filterValue);
        }
        if (searchTerm) {
            filtered = filtered.filter(post => {
                const haystack = `${post.text} ${post.author.company} ${post.author.name} ${post.author.location}`.toLowerCase();
                return haystack.includes(searchTerm);
            });
        }

        container.innerHTML = '';
        container.classList.toggle('d-none', filtered.length === 0);
        if (header) header.classList.toggle('d-none', filtered.length === 0);
        if (countBadge) countBadge.textContent = `${filtered.length} post${filtered.length === 1 ? '' : 's'}`;
        if (loadingState) loadingState.classList.add('d-none');
        if (emptyState) emptyState.classList.toggle('d-none', filtered.length !== 0);

        if (!filtered.length) {
            updateStats(filtered);
            return;
        }

        const fragment = document.createDocumentFragment();
        filtered.forEach(post => {
            const card = document.createElement('article');
            card.className = 'post-card';
            card.innerHTML = buildPostMarkup(post);
            fragment.appendChild(card);
        });

        container.appendChild(fragment);
        updateStats(filtered);
    }

    function buildPostMarkup(post) {
        const author = post.author;
        const formattedTime = formatTimeAgo(post.createdAt);
        const likes = post.likes.length || 0;
        const comments = post.comments || 0;
        const views = post.views || 0;
        const verifiedBadge = isVerifiedUser(author) ? '<span class="badge bg-primary-subtle text-primary ms-2">Verified</span>' : '';
        const locationLine = author.location ? `<small class="text-muted">${escapeHtml(author.location)}</small>` : '';

        return `
            <div class="d-flex align-items-start gap-3 mb-3">
                <div class="post-avatar">
                    <img src="${author.avatar}" alt="${escapeHtml(author.company)}" class="w-100 h-100 object-fit-cover">
                </div>
                <div class="flex-grow-1">
                    <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
                        <h6 class="mb-0 fw-semibold">${escapeHtml(author.company)}</h6>
                        <span class="badge-meta">${escapeHtml(author.role)}</span>
                        ${verifiedBadge}
                    </div>
                    ${locationLine}
                    <small class="text-muted d-block">${formattedTime}</small>
                </div>
            </div>
            <p class="mb-3" style="white-space: pre-line;">${escapeHtml(post.text)}</p>
            ${renderMedia(post)}
            <div class="post-stats mt-3 text-muted small">
                <span><i class="fas fa-thumbs-up me-1"></i>${formatNumber(likes)}</span>
                <span><i class="fas fa-comment me-1"></i>${formatNumber(comments)}</span>
                <span><i class="fas fa-eye me-1"></i>${formatNumber(views)}</span>
            </div>
        `;
    }

    function renderMedia(post) {
        if (!post.mediaUrl) return '';
        if (post.mediaType === 'video') {
            return `
                <div class="ratio ratio-16x9 rounded-4 overflow-hidden">
                    <video src="${post.mediaUrl}" controls class="w-100 h-100"></video>
                </div>
            `;
        }
        if (post.mediaType === 'link') {
            const safeUrl = post.mediaUrl;
            let display = safeUrl;
            try {
                const urlObj = new URL(safeUrl);
                display = urlObj.hostname.replace('www.', '') + urlObj.pathname;
            } catch (err) {}
            return `
                <div class="border rounded-4 p-3 d-flex align-items-center gap-2 bg-light">
                    <i class="fas fa-link text-primary"></i>
                    <a href="${safeUrl}" target="_blank" rel="noopener" class="fw-semibold">${escapeHtml(display)}</a>
                </div>
            `;
        }
        return `
            <div class="rounded-4 overflow-hidden mb-2" style="max-height: 340px;">
                <img src="${post.mediaUrl}" alt="Post media" class="w-100 h-100 object-fit-cover">
            </div>
        `;
    }

    function renderUserFilter() {
        const select = document.querySelector('[data-user-filter]');
        if (!select) return;

        const prevValue = select.value || 'all';
        const options = ['<option value="all">All authors</option>'];
        const users = Object.values(state.users).sort((a, b) => (a.company || '').localeCompare(b.company || ''));
        users.forEach(user => {
            options.push(`<option value="${user.id}">${escapeHtml(user.company || user.name)}</option>`);
        });
        select.innerHTML = options.join('');
        select.value = users.some(u => u.id === prevValue) ? prevValue : 'all';
    }

    function isAdminUser(user) {
        if (!user) return false;
        const userId = (user.id || '').toString().trim();
        if (userId) {
            const normalized = sanitizeKey(userId);
            if (adminCandidateIds.has(userId) || adminCandidateIds.has(normalized) || adminCandidateIds.has(`admin-${normalized}`)) {
                return true;
            }
        }
        const role = (user.role || '').toLowerCase();
        const company = (user.company || '').toLowerCase();
        const id = user.id || '';
        return role.includes('admin') || company.includes('Alpha Freight admin') || id.startsWith('admin-');
    }

    function getPrimaryAdminUser() {
        const admins = Object.values(state.users || {}).filter(isAdminUser);
        if (!admins.length) return null;
        admins.sort((a, b) => {
            const followersDelta = (b.followersCount || 0) - (a.followersCount || 0);
            if (followersDelta !== 0) return followersDelta;
            return (a.createdAt || 0) - (b.createdAt || 0);
        });
        return admins[0];
    }

    function renderAdminProfile() {
        const admin = getPrimaryAdminUser();
        if (!admin) {
            if (adminProfileUI.nameText) {
                adminProfileUI.nameText.textContent = 'Alpha Freight Admin';
            }
            if (adminProfileUI.tagline) {
                adminProfileUI.tagline.textContent = DEFAULT_ADMIN_TAGLINE;
                adminProfileUI.tagline.classList.remove('d-none');
            }
            if (adminProfileUI.bio) {
                adminProfileUI.bio.textContent = DEFAULT_ADMIN_BIO;
                adminProfileUI.bio.classList.remove('d-none');
            }
            if (adminProfileUI.avatar) {
                adminProfileUI.avatar.src = DEFAULT_ADMIN_AVATAR;
                adminProfileUI.avatar.alt = 'Alpha Freight Admin';
            }
            setAdminAvatarPreview(adminProfileUI.avatar ? adminProfileUI.avatar.src : DEFAULT_ADMIN_AVATAR);
            return;
        }

        if (adminProfileUI.nameText) {
            adminProfileUI.nameText.textContent = admin.company || admin.name || 'Alpha Freight Admin';
        }
        if (adminProfileUI.tagline) {
            const tagline = admin.tagline || DEFAULT_ADMIN_TAGLINE;
            adminProfileUI.tagline.textContent = tagline;
            adminProfileUI.tagline.classList.remove('d-none');
        }
        if (adminProfileUI.bio) {
            const bio = admin.bio || DEFAULT_ADMIN_BIO;
            adminProfileUI.bio.textContent = bio;
            adminProfileUI.bio.classList.remove('d-none');
        }
        if (adminProfileUI.avatar) {
            const avatar = admin.avatar || DEFAULT_ADMIN_AVATAR;
            adminProfileUI.avatar.src = avatar;
            adminProfileUI.avatar.alt = admin.company || admin.name || 'Admin';
        }
        setAdminAvatarPreview(admin.avatar || DEFAULT_ADMIN_AVATAR);
    }

    function getAdminProfileModal() {
        if (adminProfileModal) return adminProfileModal;
        if (typeof bootstrap === 'undefined') return null;
        if (!adminProfileUI.modalEl) return null;
        adminProfileModal = new bootstrap.Modal(adminProfileUI.modalEl, { backdrop: 'static' });
        adminProfileUI.modalEl.addEventListener('hidden.bs.modal', () => {
            adminProfileSaving = false;
            setAdminProfileSubmitting(false);
        });
        return adminProfileModal;
    }

    function setAdminAvatarPreview(src) {
        if (!adminProfileUI.avatarPreview) return;
        const safe = (src && src.trim()) ? src.trim() : DEFAULT_ADMIN_AVATAR;
        adminProfileUI.avatarPreview.src = safe;
    }

    function setAdminProfileSubmitting(isSubmitting) {
        if (!adminProfileUI.submitButton) return;
        if (isSubmitting) {
            if (!adminProfileSubmitOriginal) {
                adminProfileSubmitOriginal = adminProfileUI.submitButton.innerHTML;
            }
            adminProfileUI.submitButton.disabled = true;
            adminProfileUI.submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...';
        } else {
            adminProfileUI.submitButton.disabled = false;
            if (adminProfileSubmitOriginal) {
                adminProfileUI.submitButton.innerHTML = adminProfileSubmitOriginal;
            }
        }
    }

    function openAdminProfileEditor() {
        const admin = getPrimaryAdminUser();
        if (!admin) {
            alert('Admin profile record not found yet. Please try again once data loads.');
            return;
        }
        const form = adminProfileUI.form;
        if (!form) return;

        form.company.value = admin.company || admin.name || 'Alpha Freight Admin';
        form.role.value = admin.role || 'Community Admin';
        form.location.value = admin.location || '';
        form.avatar.value = admin.avatar || '';
        form.tagline.value = admin.tagline || '';
        form.bio.value = admin.bio || '';
        if (adminProfileUI.avatarFile) {
            adminProfileUI.avatarFile.value = '';
        }
        setAdminAvatarPreview(admin.avatar || DEFAULT_ADMIN_AVATAR);

        setAdminProfileSubmitting(false);

        const modal = getAdminProfileModal();
        if (modal) {
            modal.show();
        }
    }

    function handleAdminProfileSubmit(event) {
        event.preventDefault();
        if (adminProfileSaving) return;
        const admin = getPrimaryAdminUser();
        if (!admin) {
            alert('Admin profile record not found yet.');
            return;
        }
        const form = adminProfileUI.form;
        if (!form) return;

        const formData = new FormData(form);
        const company = (formData.get('company') || '').toString().trim();
        const role = (formData.get('role') || '').toString().trim() || 'Community Admin';
        const location = (formData.get('location') || '').toString().trim();
        const avatarInput = (formData.get('avatar') || '').toString().trim();
        const tagline = (formData.get('tagline') || '').toString().trim();
        const bio = (formData.get('bio') || '').toString().trim();

        if (!company) {
            alert('Display name is required.');
            return;
        }

        const avatar = avatarInput || admin.avatar || DEFAULT_ADMIN_AVATAR;
        const database = ensureFirebase();
        if (!database) {
            alert('Firebase is not ready. Please try again in a moment.');
            return;
        }

        adminProfileSaving = true;
        setAdminProfileSubmitting(true);

        const updates = {
            company,
            name: company,
            role,
            location,
            avatar,
            tagline,
            bio,
            updatedAt: Date.now()
        };

        database.ref(`social/users/${admin.id}`).update(updates).then(() => {
            adminProfileSaving = false;
            setAdminProfileSubmitting(false);
            if (adminProfileUI.avatarFile) {
                adminProfileUI.avatarFile.value = '';
            }
            const modal = getAdminProfileModal();
            if (modal) modal.hide();
            if (window.AlphaBrokrage?.showAlert) {
                window.AlphaBrokrage.showAlert('success', 'Admin profile updated successfully.');
            } else {
                console.log('[AdminSocial] Admin profile updated');
            }
        }).catch(error => {
            adminProfileSaving = false;
            setAdminProfileSubmitting(false);
            console.error('[AdminSocial] Failed to update admin profile', error);
            if (window.AlphaBrokrage?.showAlert) {
                window.AlphaBrokrage.showAlert('error', 'Unable to save changes. Please try again.');
            } else {
                alert('Unable to save changes. Please try again.');
            }
        });
    }

    function handleAdminAvatarFile(event) {
        const file = event.target?.files && event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            if (window.AlphaBrokrage?.showAlert) {
                window.AlphaBrokrage.showAlert('warning', 'Sirf image files (JPG, PNG) upload karein.');
            } else {
                alert('Please select a valid image file (JPG/PNG).');
            }
            event.target.value = '';
            return;
        }
        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
            if (window.AlphaBrokrage?.showAlert) {
                window.AlphaBrokrage.showAlert('warning', 'Image size 2MB se kam honi chahiye.');
            } else {
                alert('Image must be 2MB or smaller.');
            }
            event.target.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = e => {
            const result = e.target?.result;
            if (!result) return;
            if (adminProfileUI.avatarInput) {
                adminProfileUI.avatarInput.value = result;
            }
            setAdminAvatarPreview(result);
        };
        reader.readAsDataURL(file);
    }

    function isVerifiedUser(user) {
        if (!user) return false;
        if (isAdminUser(user)) return true;
        const followerCount = Number(user.followersCount) || 0;
        return followerCount >= 5000;
    }

    function updateStats(filteredPosts) {
        const posts = filteredPosts || buildPostList();
        const totalPostsEl = document.querySelector('[data-stats-total-posts]');
        const uniqueAuthorsEl = document.querySelector('[data-stats-total-authors]');
        const updatedEl = document.querySelector('[data-stats-last-updated]');
        const followersEl = document.querySelector('[data-admin-followers]');
        const likesEl = document.querySelector('[data-stats-total-likes]');
        const commentsEl = document.querySelector('[data-stats-total-comments]');

        if (totalPostsEl) totalPostsEl.textContent = posts.length.toLocaleString();
        if (uniqueAuthorsEl) {
            const authors = new Set(posts.map(p => p.author.id));
            uniqueAuthorsEl.textContent = authors.size.toLocaleString();
        }
        if (followersEl) {
            const adminUsers = Object.values(state.users || {}).filter(isAdminUser);
            const adminFollowers = adminUsers.reduce((max, user) => Math.max(max, user.followersCount || 0), 0);
            const baseline = 125000;
            const displayFollowers = adminFollowers >= baseline ? adminFollowers : baseline + adminFollowers;
            followersEl.textContent = formatNumber(displayFollowers);
        }
        if (likesEl || commentsEl) {
            let totalLikes = 0;
            let totalComments = 0;
            posts.forEach(post => {
                totalLikes += post.likes.length || 0;
                totalComments += post.comments || 0;
            });
            if (likesEl) likesEl.textContent = formatNumber(totalLikes);
            if (commentsEl) commentsEl.textContent = formatNumber(totalComments);
        }
        if (updatedEl) {
            const now = new Date();
            updatedEl.textContent = now.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit' });
        }
    }

    function ensureEngagementLoop() {
        if (engagementController.timerId) return;
        const database = ensureFirebase();
        if (!database) return;
        engagementController.timerId = setInterval(() => {
            runEngagementTick(database);
        }, 5000);
    }

    function runEngagementTick(database) {
        const posts = buildPostList();
        const adminPosts = posts.filter(isAdminPost);
        if (!adminPosts.length) return;
        adminPosts.forEach(post => incrementAdminEngagement(post, database));
    }

    function isAdminPost(post) {
        const role = (post.author.role || '').toLowerCase();
        const company = (post.author.company || '').toLowerCase();
        return role.includes('admin') || company.includes('Alpha Freight') || (post.postType || '').toLowerCase() === 'adminnews';
    }

    function incrementAdminEngagement(post, database) {
        const likesMap = post.likesMap || {};
        const existingLikes = post.likes.length || Object.keys(likesMap).length;
        const likeIncrement = calculateAutoIncrement(existingLikes);
        const viewIncrement = likeIncrement * 2;

        if (likeIncrement > 0) {
            const updates = {};
            let added = 0;
            while (added < likeIncrement) {
                const key = `admin-bot-${post.id}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
                if (!likesMap[key]) {
                    updates[key] = true;
                    likesMap[key] = true;
                    added += 1;
                }
            }
            database.ref(`social/posts/${post.id}/likes`).update(updates).catch(err => {
                console.error('[AdminSocial] Failed to auto-like post', post.id, err);
            });
        }

        if (viewIncrement > 0) {
            const baseViews = Number(state.posts?.[post.id]?.views) || post.views || 0;
            const newViews = baseViews + viewIncrement;
            database.ref(`social/posts/${post.id}/views`).set(newViews).catch(err => {
                console.error('[AdminSocial] Failed to auto-increment views', post.id, err);
            });
            if (state.posts && state.posts[post.id]) {
                state.posts[post.id].views = newViews;
            }
            post.views = newViews;
        }
    }

    function calculateAutoIncrement(currentLikes) {
        if (currentLikes < 0) return 0;
        if (currentLikes < 10000) return 15;
        const ratio = 10000 / Math.max(10000, currentLikes);
        const amount = Math.max(1, Math.round(15 * ratio));
        return amount;
    }

    function arrayToMap(list) {
        return list.reduce((acc, item) => {
            acc[item] = true;
            return acc;
        }, {});
    }

    function formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const MINUTE = 60000;
        const HOUR = MINUTE * 60;
        const DAY = HOUR * 24;
        if (diff < MINUTE) return 'moments ago';
        if (diff < HOUR) {
            const mins = Math.floor(diff / MINUTE);
            return `${mins} min${mins === 1 ? '' : 's'} ago`;
        }
        if (diff < DAY) {
            const hrs = Math.floor(diff / HOUR);
            return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
        }
        const days = Math.floor(diff / DAY);
        if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
        return new Date(timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function formatNumber(value) {
        const num = Number(value) || 0;
        if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
        if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
        return num.toLocaleString();
    }

    function escapeHtml(html) {
        return (html || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    init();

    window.AlphaBrokrage = window.AlphaBrokrage || {};
    window.AlphaBrokrage.adminSocial = {
        refresh: function() {
            renderUserFilter();
            renderAdminProfile();
            renderPosts();
        }
    };

})(window, document);
