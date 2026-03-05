// Alpha Freight Social Hub - Firebase powered live experience
// This implementation pulls social data (users, posts, notifications) directly
// from the Firebase Realtime Database and removes legacy demo/localStorage stubs.

(function(window, document) {
    'use strict';

    const STORAGE_KEYS = {
        sessionUserId: 'ab.social.sessionUserId'
    };

    const FEED_SETTINGS = {
        weights: {
            followed: 0.6,
            trending: 0.25,
            suggested: 0.15
        },
        maxAdminPinned: 1000,
        priorityTags: ['#freight', '#logistics', '#load'],
        trendingHours: 48,
        timeDecayBase: 100,
        timeDecayPerHour: 3
    };

    const VIEWED_POSTS_KEY = 'ab.social.viewedPosts';

    const storage = window.AlphaBrokrage?.storage || {
        set: function(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (err) {
                console.error('[SocialHub] storage set error', err);
            }
        },
        get: function(key) {
            try {
                const raw = localStorage.getItem(key);
                return raw ? JSON.parse(raw) : null;
            } catch (err) {
                console.error('[SocialHub] storage get error', err);
                return null;
            }
        },
        remove: function(key) {
            try {
                localStorage.removeItem(key);
            } catch (err) {
                console.error('[SocialHub] storage remove error', err);
            }
        }
    };

    const state = {
        users: {},
        posts: {},
        notifications: {},
        ready: {
            users: false,
            posts: false,
            notifications: false
        },
        subscriptionsAttached: false
    };

    let firebaseDb = null;
    const refs = {};
    let profileSelectBound = false;
    let feedViewObserver = null;
    const viewedPosts = new Set();
    const profileSearchState = {
        wrapper: null,
        input: null,
        results: null,
        hideTimeout: null,
        bound: false
    };

    function sanitizeKey(text) {
        return (text || '')
            .toString()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'user';
    }

    function buildAvatarFromText(text) {
        const clean = (text || 'Alpha').split(/\s+/).filter(Boolean).slice(0, 2).join(' ');
        return `https://ui-avatars.com/api/?background=0D6EFD&color=fff&name=${encodeURIComponent(clean || 'AB')}`;
    }

    function tryParseLocal(key, fallback) {
        if (typeof localStorage === 'undefined') return fallback;
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            return JSON.parse(raw);
        } catch (err) {
            return fallback;
        }
    }

    function detectPortalProfile() {
        if (typeof window === 'undefined') return null;

        const supplierAuth = tryParseLocal('supplierAuth', null);
        const carrierAuth = tryParseLocal('carrierAuth', null);
        const adminAuth = tryParseLocal('adminAuth', null);

        let lastRole = '';
        if (typeof localStorage !== 'undefined') {
            try {
                lastRole = (localStorage.getItem('ab.portal.lastRole') || '').toLowerCase();
            } catch (err) {
                lastRole = '';
            }
        }

        const builders = {
            supplier: () => {
                if (!supplierAuth || (!supplierAuth.email && !supplierAuth.supplierId)) return null;
                const company = supplierAuth.companyName || '';
                const name = `${supplierAuth.firstName || ''} ${supplierAuth.lastName || ''}`.trim();
                const location = supplierAuth.city || supplierAuth.address || '';
                const idBase = supplierAuth.supplierId || supplierAuth.email || company;
                const storedPhoto = (typeof localStorage !== 'undefined') ? localStorage.getItem('supplierProfilePhoto') : null;
                return {
                    userId: `supplier-${sanitizeKey(idBase)}`,
                    company: company || name || 'Supplier',
                    name: name || company || 'Supplier Team',
                    location,
                    avatar: storedPhoto || buildAvatarFromText(company || name),
                    roleLabel: 'Supplier',
                    verified: true,
                    loginTime: supplierAuth.loginTime || null
                };
            },
            carrier: () => {
                if (!carrierAuth || (!carrierAuth.email && !carrierAuth.id && !carrierAuth.carrierId)) return null;
                const carriers = tryParseLocal('carriers', []);
                const carrierRecord = carriers.find(c =>
                    (carrierAuth.email && c.email === carrierAuth.email) ||
                    (carrierAuth.id && c.id === carrierAuth.id)
                ) || {};

                const company = carrierRecord.companyName || carrierAuth.companyName || '';
                const name = `${carrierRecord.firstName || carrierAuth.firstName || ''} ${carrierRecord.lastName || carrierAuth.lastName || ''}`.trim();
                const location = carrierRecord.city || carrierRecord.address || carrierAuth.city || carrierAuth.address || '';
                const idBase = carrierAuth.id || carrierAuth.carrierId || carrierAuth.email || company;
                return {
                    userId: `carrier-${sanitizeKey(idBase)}`,
                    company: company || name || 'Carrier',
                    name: name || company || 'Carrier Team',
                    location,
                    avatar: carrierRecord.profilePhoto || buildAvatarFromText(company || name),
                    roleLabel: 'Carrier',
                    verified: true,
                    loginTime: carrierAuth.loginTime || null
                };
            },
            admin: () => {
                if (!adminAuth || (!adminAuth.email && !adminAuth.adminId)) return null;
                const name = adminAuth.name || adminAuth.email || 'Admin';
                const idBase = adminAuth.adminId || adminAuth.email || 'admin';
                return {
                    userId: `admin-${sanitizeKey(idBase)}`,
                    company: 'Alpha Freight Admin',
                    name,
                    location: adminAuth.location || 'United Kingdom',
                    avatar: buildAvatarFromText(name),
                    roleLabel: 'Admin',
                    verified: true,
                    loginTime: adminAuth.loginTime || null
                };
            }
        };

        const rolePriority = [];
        if (lastRole && builders[lastRole]) rolePriority.push(lastRole);
        ['supplier', 'carrier', 'admin'].forEach(role => {
            if (!rolePriority.includes(role)) rolePriority.push(role);
        });

        for (const role of rolePriority) {
            const candidate = builders[role]();
            if (candidate) return candidate;
        }

        return null;
    }

    function syncPortalProfileWithFirebase() {
        const portal = detectPortalProfile();
        if (!portal) return;

        setSessionUserId(portal.userId);

        if (!ensureFirebase()) return;
        if (!refs.users) {
            refs.users = firebaseDb.ref('social/users');
        }

        const userRef = refs.users.child(portal.userId);
        userRef.once('value').then(snapshot => {
            const baseData = {
                name: portal.name,
                company: portal.company,
                role: portal.roleLabel,
                location: portal.location || '',
                avatar: portal.avatar || buildAvatarFromText(portal.company || portal.name),
                verified: portal.verified || false,
                updatedAt: Date.now()
            };
            if (snapshot.exists()) {
                snapshot.ref.update(baseData);
            } else {
                baseData.followers = {};
                baseData.following = {};
                baseData.createdAt = Date.now();
                snapshot.ref.set(baseData);
            }
        }).catch(err => console.error('[SocialHub] portal profile sync error', err));
    }

    function loadViewedPosts() {
        if (typeof localStorage === 'undefined') return;
        try {
            const cached = localStorage.getItem(VIEWED_POSTS_KEY);
            if (!cached) return;
            const list = JSON.parse(cached);
            if (Array.isArray(list)) {
                list.forEach(id => viewedPosts.add(id));
            }
        } catch (err) {
            console.error('[SocialHub] load viewed posts error', err);
        }
    }

    function saveViewedPosts() {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(VIEWED_POSTS_KEY, JSON.stringify(Array.from(viewedPosts)));
        } catch (err) {
            console.error('[SocialHub] save viewed posts error', err);
        }
    }

    function markPostViewed(postId) {
        if (!postId || viewedPosts.has(postId)) return;
        viewedPosts.add(postId);
        saveViewedPosts();
        if (!ensureFirebase()) return;
        if (!refs.posts) {
            refs.posts = firebaseDb.ref('social/posts');
        }
        refs.posts.child(postId).child('views').transaction(current => {
            if (typeof current !== 'number' || current < 0) {
                return 1;
            }
            return current + 1;
        }).catch(err => console.error('[SocialHub] increment views error', err));
    }

    function initFeedViewObserver(feedContainer) {
        if (!feedContainer) return;

        if (feedViewObserver) {
            try { feedViewObserver.disconnect(); } catch (err) { /* ignore */ }
        }

        const cards = feedContainer.querySelectorAll('[data-post]');
        if (!cards.length) return;

        if (!('IntersectionObserver' in window)) {
            cards.forEach(card => markPostViewed(card.dataset.post));
            return;
        }

        feedViewObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.target?.dataset?.post) {
                    markPostViewed(entry.target.dataset.post);
                }
            });
        }, { threshold: 0.6 });

        cards.forEach(card => feedViewObserver.observe(card));
    }

    function ensureFirebase() {
        if (firebaseDb) {
            return true;
        }
        if (window.AlphaBrokrage?.firebaseDb) {
            firebaseDb = window.AlphaBrokrage.firebaseDb;
        } else if (typeof firebase !== 'undefined') {
            firebaseDb = firebase.database();
            window.AlphaBrokrage = window.AlphaBrokrage || {};
            window.AlphaBrokrage.firebaseDb = firebaseDb;
        }
        if (!firebaseDb) {
            console.error('[SocialHub] Firebase database not initialised. Include firebase-init.js before social-hub.js');
            return false;
        }
        return true;
    }

    function attachFirebaseListeners() {
        if (state.subscriptionsAttached) return;
        if (!ensureFirebase()) return;

        refs.users = firebaseDb.ref('social/users');
        refs.posts = firebaseDb.ref('social/posts');
        refs.notifications = firebaseDb.ref('social/notifications');

        refs.users.on('value', snapshot => {
            const value = snapshot.val() || {};
            const normalized = {};
            Object.entries(value).forEach(([id, data]) => {
                normalized[id] = normalizeUserRecord(id, data);
            });
            state.users = normalized;
            state.ready.users = true;
            ensureSessionUserId();
            renderCurrentUserSummary();
            renderFollowSuggestions();
            renderFeed();
            renderProfilePage();
            updateNotificationBadge();
            renderProfileSwitcher();
            refreshProfileSearchResults();
        }, error => console.error('[SocialHub] users listener error', error));

        refs.posts.on('value', snapshot => {
            const value = snapshot.val() || {};
            const normalized = {};
            Object.entries(value).forEach(([id, data]) => {
                normalized[id] = normalizePostRecord(id, data);
            });
            state.posts = normalized;
            state.ready.posts = true;
            renderFeed();
            renderProfilePage();
        }, error => console.error('[SocialHub] posts listener error', error));

        refs.notifications.on('value', snapshot => {
            const value = snapshot.val() || {};
            const normalized = {};
            Object.entries(value).forEach(([userId, notifications]) => {
                const list = [];
                Object.entries(notifications || {}).forEach(([id, data]) => {
                    list.push(normalizeNotificationRecord(id, userId, data));
                });
                list.sort((a, b) => b.createdAt - a.createdAt);
                normalized[userId] = list;
            });
            state.notifications = normalized;
            state.ready.notifications = true;
            renderNotifications();
            updateNotificationBadge();
        }, error => console.error('[SocialHub] notifications listener error', error));

        state.subscriptionsAttached = true;
    }

    function normalizeUserRecord(id, data) {
        const followers = data && data.followers
            ? (Array.isArray(data.followers) ? data.followers.slice() : Object.keys(data.followers))
            : [];
        const following = data && data.following
            ? (Array.isArray(data.following) ? data.following.slice() : Object.keys(data.following))
            : [];
        const tagline = (data?.tagline || data?.headline || '').toString().trim();
        const bio = (data?.bio || data?.description || '').toString().trim();
        return {
            id,
            name: data?.name || 'Freight Partner',
            company: data?.company || data?.name || 'Freight Partner',
            role: data?.role || 'Member',
            avatar: data?.avatar || 'https://via.placeholder.com/120x120.png?text=Profile',
            location: data?.location || '',
            followers,
            following,
            followersCount: followers.length,
            tagline,
            bio,
            verified: Boolean(data?.verified),
            createdAt: Number(data?.createdAt) || null
        };
    }

    function normalizePostRecord(id, data) {
        const likes = data && data.likes && typeof data.likes === 'object'
            ? Object.keys(data.likes)
            : [];
        const comments = Number.isFinite(data?.comments) ? data.comments : 0;
        const shares = Number.isFinite(data?.shares) ? data.shares : 0;
        const views = Number.isFinite(data?.views) ? data.views : 0;

        let tags = [];
        if (Array.isArray(data?.tags)) {
            tags = data.tags;
        } else if (data?.tags && typeof data.tags === 'object') {
            tags = Object.keys(data.tags).map(key => `#${key}`);
        }
        if (!tags.length) {
            tags = extractTagsFromText(data?.text);
        }

        return {
            id,
            authorId: data?.authorId || null,
            text: data?.text || '',
            mediaType: data?.mediaType || null,
            mediaUrl: data?.mediaUrl || null,
            likes,
            comments,
            shares,
            tags: tags.map(tag => tag.toLowerCase()),
            postType: data?.postType || 'standard',
            createdAt: Number(data?.createdAt) || Date.now(),
            views
        };
    }

    function isAdminAccount(user) {
        if (!user) return false;
        const role = (user.role || '').toLowerCase();
        const company = (user.company || '').toLowerCase();
        const id = user.id || '';
        return role.includes('admin') || company.includes('Alpha Freight admin') || id.startsWith('admin-');
    }

    function isVerifiedAccount(user) {
        if (!user) return false;
        if (isAdminAccount(user)) return true;
        const followerIds = Array.isArray(user.followers)
            ? user.followers
            : user.followers && typeof user.followers === 'object'
                ? Object.keys(user.followers)
                : [];
        const followerCount = typeof user.followersCount === 'number'
            ? user.followersCount
            : followerIds.length;
        return followerCount >= 5000;
    }

    function normalizeNotificationRecord(id, userId, data) {
        return {
            id,
            userId,
            type: data?.type || 'info',
            text: data?.text || '',
            createdAt: Number(data?.createdAt) || Date.now(),
            read: Boolean(data?.read)
        };
    }

    function extractTagsFromText(text) {
        if (!text || typeof text !== 'string') return [];
        const matches = text.match(/#\w+/g) || [];
        return matches.map(tag => tag.toLowerCase());
    }

    function ensureSessionUserId() {
        const ids = Object.keys(state.users);
        if (!ids.length) {
            storage.remove(STORAGE_KEYS.sessionUserId);
            return null;
        }
        const current = getSessionUserId();
        if (current) {
            if (ids.includes(current)) {
                return current;
            }
            return current;
        }
        const fallbackId = ids[0];
        setSessionUserId(fallbackId);
        return fallbackId;
    }

    function getSessionUserId() {
        return storage.get(STORAGE_KEYS.sessionUserId);
    }

    function setSessionUserId(id) {
        if (!id) {
            storage.remove(STORAGE_KEYS.sessionUserId);
            return;
        }
        storage.set(STORAGE_KEYS.sessionUserId, id);
    }

    function getSessionUser() {
        const id = getSessionUserId();
        if (!id) return null;
        return state.users[id] || null;
    }

    function getUsers() {
        return Object.values(state.users);
    }

    function getUserById(id) {
        return state.users[id] || null;
    }

    function getPosts() {
        return Object.values(state.posts).sort((a, b) => b.createdAt - a.createdAt);
    }

    function getNotifications(userId) {
        if (!userId) return [];
        return state.notifications[userId] || [];
    }

    function hoursSince(timestamp) {
        return Math.max(0, (Date.now() - timestamp) / (1000 * 60 * 60));
    }

    function calculatePostScore(post, author) {
        if (!post) return 0;
        const likesCount = post.likes.length;
        const commentsCount = post.comments;
        const sharesCount = post.shares;
        const ageHours = hoursSince(post.createdAt);
        const baseScore = (likesCount * 2) + (commentsCount * 3) + (sharesCount * 4);
        const timeDecay = Math.max(0, FEED_SETTINGS.timeDecayBase - (Math.floor(ageHours) * FEED_SETTINGS.timeDecayPerHour));
        const hasPriorityTag = post.tags.some(tag => FEED_SETTINGS.priorityTags.includes(tag));
        const tagBoost = hasPriorityTag ? 5 : 0;
        const verifiedBoost = isVerifiedAccount(author) ? 10 : 0;
        return baseScore + timeDecay + tagBoost + verifiedBoost;
    }

    function calculateTargetCounts(totalSlots, bucketSizes) {
        if (totalSlots <= 0) {
            return { followed: 0, trending: 0, suggested: 0 };
        }
        const followedTarget = Math.min(
            bucketSizes.followed || 0,
            Math.max(0, Math.round(totalSlots * FEED_SETTINGS.weights.followed))
        );
        const trendingTarget = Math.min(
            bucketSizes.trending || 0,
            Math.max(0, Math.round(totalSlots * FEED_SETTINGS.weights.trending))
        );
        let used = followedTarget + trendingTarget;
        let suggestedTarget = Math.max(0, totalSlots - used);
        suggestedTarget = Math.min(bucketSizes.suggested || 0, suggestedTarget);
        return { followed: followedTarget, trending: trendingTarget, suggested: suggestedTarget };
    }

    function takeFromBucket(feedOrder, bucket, limit, reason, usedIds) {
        if (!Array.isArray(bucket) || !limit) return;
        const sorted = bucket.slice().sort((a, b) => b.score - a.score);
        let added = 0;
        for (const item of sorted) {
            if (usedIds.has(item.post.id)) continue;
            feedOrder.push(Object.assign({}, item, { reason }));
            usedIds.add(item.post.id);
            added += 1;
            if (added >= limit) break;
        }
    }

    function collectFeedMeta(currentUser) {
        const posts = getPosts();
        return posts.map(post => {
            const author = getUserById(post.authorId);
            const score = calculatePostScore(post, author);
            const followingIds = currentUser?.following || [];
            return {
                post,
                author,
                score,
                hoursSince: hoursSince(post.createdAt),
                isFollowed: followingIds.includes(post.authorId),
                isSelf: currentUser?.id === post.authorId
            };
        }).sort((a, b) => b.score - a.score);
    }

    function buildPersonalizedFeed(currentUser) {
        const meta = collectFeedMeta(currentUser);

        const adminPosts = meta.filter(item => item.post.postType === 'adminNews');
        const nonAdmin = meta.filter(item => item.post.postType !== 'adminNews');

        const feedOrder = [];
        const usedIds = new Set();

        adminPosts
            .slice()
            .sort((a, b) => b.score - a.score)
            .slice(0, FEED_SETTINGS.maxAdminPinned)
            .forEach(item => {
                feedOrder.push(Object.assign({}, item, { reason: 'admin' }));
                usedIds.add(item.post.id);
            });

        if (nonAdmin.length === 0) {
            return feedOrder;
        }

        const followedPool = nonAdmin.filter(item => item.isFollowed || item.isSelf);
        const trendingPool = nonAdmin.filter(item => item.hoursSince <= FEED_SETTINGS.trendingHours);
        const suggestedPool = nonAdmin.filter(item => !item.isFollowed && !item.isSelf);

        const counts = calculateTargetCounts(nonAdmin.length, {
            followed: followedPool.length,
            trending: trendingPool.length,
            suggested: suggestedPool.length
        });

        takeFromBucket(feedOrder, followedPool, counts.followed, 'followed', usedIds);
        takeFromBucket(feedOrder, trendingPool, counts.trending, 'trending', usedIds);
        takeFromBucket(feedOrder, suggestedPool, counts.suggested, 'suggested', usedIds);

        const fallbackPool = nonAdmin.slice().sort((a, b) => b.score - a.score);
        for (const item of fallbackPool) {
            if (usedIds.has(item.post.id)) continue;
            feedOrder.push(Object.assign({}, item, { reason: 'general' }));
            usedIds.add(item.post.id);
        }

        return feedOrder;
    }

    function setComposerEnabled(isEnabled) {
        const form = document.querySelector('[data-post-form]');
        if (!form) return;
        const submitBtn = form.querySelector('button[type="submit"]');
        const textarea = form.querySelector('textarea[name="postText"]');
        const mediaUrlInput = form.querySelector('input[name="mediaUrl"]');
        const mediaTypeSelect = form.querySelector('select[name="mediaType"]');
        [submitBtn, textarea, mediaUrlInput, mediaTypeSelect].forEach(el => {
            if (el) el.disabled = !isEnabled;
        });
    }

    function renderCurrentUserSummary() {
        const currentUser = getSessionUser();
        if (!state.ready.users) {
            setComposerEnabled(false);
            return;
        }
        if (!currentUser) {
            const fallbackId = ensureSessionUserId();
            const fallbackUser = fallbackId ? state.users[fallbackId] : null;
            if (fallbackUser) {
                renderCurrentUserSummary();
                return;
            }
            document.querySelectorAll('[data-feed-avatar]').forEach(img => {
                img.src = 'https://via.placeholder.com/80x80.png?text=User';
                img.alt = 'Select profile';
            });
            document.querySelectorAll('[data-feed-name]').forEach(el => {
                el.textContent = 'Select a profile';
            });
            document.querySelectorAll('[data-feed-location]').forEach(el => {
                el.textContent = '—';
            });
            document.querySelectorAll('[data-feed-role]').forEach(el => {
                el.textContent = 'Choose a profile to get started';
            });
            document.querySelectorAll('[data-feed-followers]').forEach(el => {
                el.textContent = '0';
            });
            document.querySelectorAll('[data-feed-following]').forEach(el => {
                el.textContent = '0';
            });
            document.querySelectorAll('[data-profile-portal]').forEach(btn => {
                btn.classList.add('d-none');
            });
            setComposerEnabled(false);
            renderProfileSwitcher();
            return;
        }

        document.querySelectorAll('[data-feed-avatar]').forEach(img => {
            img.src = currentUser.avatar;
            img.alt = currentUser.company || currentUser.name || 'Current user';
        });
        document.querySelectorAll('[data-feed-name]').forEach(el => {
            el.textContent = currentUser.company || currentUser.name || 'Freight Partner';
        });
        document.querySelectorAll('[data-feed-location]').forEach(el => {
            el.textContent = currentUser.location || 'Location not shared';
        });
        const roleLabel = `${currentUser.role || 'Member'}${isVerifiedAccount(currentUser) ? ' • Verified' : ''}`;
        document.querySelectorAll('[data-feed-role]').forEach(el => {
            el.textContent = roleLabel;
        });
        document.querySelectorAll('[data-feed-followers]').forEach(el => {
            el.textContent = currentUser.followers.length;
        });
        document.querySelectorAll('[data-feed-following]').forEach(el => {
            el.textContent = currentUser.following.length;
        });
        document.querySelectorAll('[data-profile-portal]').forEach(btn => {
            const role = (currentUser.role || '').toLowerCase();
            let href = null;
            let label = 'Open Profile';
            if (role.includes('carrier')) {
                href = '../carrier/profile.html';
                label = 'Open Carrier Portal';
            } else if (role.includes('supplier')) {
                href = '../supplier/profile.html';
                label = 'Open Supplier Portal';
            } else if (role.includes('broker')) {
                href = '../broker/dashboard.html';
                label = 'Open Broker Portal';
            } else if (role.includes('admin')) {
                href = '../admin/dashboard.html';
                label = 'Open Admin Portal';
            }
            if (href) {
                btn.classList.remove('d-none');
                btn.href = href;
                btn.textContent = label;
            } else {
                btn.classList.add('d-none');
            }
        });
        setComposerEnabled(true);
        renderProfileSwitcher();
    }

    function renderProfileSwitcher() {
        const wrapper = document.querySelector('[data-profile-select-wrapper]');
        if (wrapper) {
            wrapper.remove();
        }
    }

    function initProfileSearch() {
        profileSearchState.wrapper = document.querySelector('[data-profile-search-wrapper]');
        profileSearchState.input = document.querySelector('[data-profile-search-input]');
        profileSearchState.results = document.querySelector('[data-profile-search-results]');

        if (!profileSearchState.input || !profileSearchState.results) return;

        if (!profileSearchState.bound) {
            profileSearchState.input.addEventListener('input', handleProfileSearchInput);
            profileSearchState.input.addEventListener('focus', handleProfileSearchFocus);
            profileSearchState.input.addEventListener('keydown', handleProfileSearchKeydown);
            profileSearchState.results.addEventListener('click', handleProfileSearchResultClick);
            document.addEventListener('click', handleProfileSearchOutsideClick);
            profileSearchState.bound = true;
        }
    }

    function handleProfileSearchInput(event) {
        const query = (event.target.value || '').trim();
        if (!state.ready.users) {
            showProfileSearchLoading();
            return;
        }
        if (query.length < 2) {
            hideProfileSearchResults();
            return;
        }
        const matches = searchProfiles(query);
        renderProfileSearchResults(matches, query);
    }

    function handleProfileSearchFocus(event) {
        const query = (event.target.value || '').trim();
        if (query.length >= 2 && state.ready.users) {
            const matches = searchProfiles(query);
            renderProfileSearchResults(matches, query);
        } else if (!state.ready.users) {
            showProfileSearchLoading();
        }
    }

    function handleProfileSearchKeydown(event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            if (profileSearchState.input) {
                profileSearchState.input.value = '';
            }
            hideProfileSearchResults();
            event.target.blur();
        }
    }

    function handleProfileSearchResultClick(event) {
        const item = event.target.closest('[data-profile-search-item]');
        if (!item) return;
        if (profileSearchState.input) {
            profileSearchState.input.value = '';
        }
        hideProfileSearchResults();
    }

    function handleProfileSearchOutsideClick(event) {
        if (!profileSearchState.wrapper) return;
        if (!profileSearchState.wrapper.contains(event.target)) {
            hideProfileSearchResults();
        }
    }

    function searchProfiles(query) {
        const normalized = query.toLowerCase();
        const users = getUsers();
        const matches = [];
        for (const user of users) {
            if (!user?.id) continue;
            const haystack = `${user.company || ''} ${user.name || ''} ${user.location || ''} ${(user.role || '')}`.toLowerCase();
            if (haystack.includes(normalized)) {
                matches.push(user);
            }
            if (matches.length >= 8) break;
        }
        return matches;
    }

    function renderProfileSearchResults(matches, query) {
        if (!profileSearchState.results) return;
        if (!matches.length) {
            profileSearchState.results.innerHTML = `
                <div class="profile-search-empty">No profiles found for “${escapeHtml(query)}”.</div>
            `;
        } else {
            const list = matches.map(user => {
                const displayName = escapeHtml(user.company || user.name || 'Freight Partner');
                const meta = escapeHtml(user.location || user.role || 'Freight Partner');
                const avatar = escapeHtml(user.avatar || 'https://via.placeholder.com/80x80.png?text=AB');
                return `
                    <a href="profile.html?user=${encodeURIComponent(user.id)}" class="profile-search-item" data-profile-search-item="${encodeURIComponent(user.id)}">
                        <span class="profile-search-avatar">
                            <img src="${avatar}" alt="${displayName}">
                        </span>
                        <span>
                            <span class="profile-search-name">${displayName}</span>
                            <span class="profile-search-meta">${meta}</span>
                        </span>
                    </a>
                `;
            }).join('');
            profileSearchState.results.innerHTML = list;
        }
        profileSearchState.results.classList.remove('d-none');
        profileSearchState.results.classList.add('show');
    }

    function showProfileSearchLoading() {
        if (!profileSearchState.results) return;
        profileSearchState.results.innerHTML = `
            <div class="profile-search-loading">
                <i class="fas fa-circle-notch fa-spin"></i>
                Loading profiles...
            </div>
        `;
        profileSearchState.results.classList.remove('d-none');
        profileSearchState.results.classList.add('show');
    }

    function hideProfileSearchResults() {
        if (!profileSearchState.results) return;
        profileSearchState.results.classList.add('d-none');
        profileSearchState.results.classList.remove('show');
    }

    function refreshProfileSearchResults() {
        if (!profileSearchState.input || !profileSearchState.results) return;
        const query = (profileSearchState.input.value || '').trim();
        if (query.length >= 2 && state.ready.users) {
            const matches = searchProfiles(query);
            renderProfileSearchResults(matches, query);
        } else if (query.length < 2) {
            hideProfileSearchResults();
        }
    }

    function renderFeed() {
        const feedContainer = document.querySelector('[data-feed-list]');
        if (!feedContainer) return;

        if (!state.ready.users || !state.ready.posts) {
            feedContainer.innerHTML = `
                <div class="card border-0 shadow-sm">
                    <div class="card-body text-center py-5 text-muted">
                        <i class="fas fa-circle-notch fa-spin mb-3"></i>
                        <p class="mb-0">Loading latest freight updates...</p>
                    </div>
                </div>
            `;
            renderTrendingWidgets();
            return;
        }

        const currentUser = getSessionUser();
        const feedItems = buildPersonalizedFeed(currentUser);
        const fragment = document.createDocumentFragment();

        if (feedItems.length === 0) {
            feedContainer.innerHTML = `
                <div class="card border-0 shadow-sm">
                    <div class="card-body text-center py-5 text-muted">
                        <i class="fas fa-rss fa-2x mb-3"></i>
                        <p class="mb-0">Abhi tak koi freight update nahi. Pehla post share karein!</p>
                    </div>
                </div>
            `;
            renderTrendingWidgets();
            return;
        }

        const reasonBadges = {
            followed: { label: 'From Following', className: 'bg-success-subtle text-success fw-semibold' },
            trending: { label: 'Trending 48h', className: 'bg-warning-subtle text-warning fw-semibold' },
            suggested: { label: 'Suggested', className: 'bg-info-subtle text-info fw-semibold' }
        };

        feedItems.forEach(item => {
            const { post, author, reason } = item;
            const badgeConfig = reasonBadges[reason];
            const badgeMarkup = badgeConfig ? `<span class="feed-badge badge ${badgeConfig.className}">${badgeConfig.label}</span>` : '';
            const showVerified = Boolean(author && isVerifiedAccount(author));
            const verifiedMarkup = showVerified
                ? `<span class="feed-verified-badge"><img src="../../verified_7641727.png" alt="Verified badge"></span>`
                : '';
            const roleBadgeText = author?.role || 'Member';
            const roleBadge = roleBadgeText && !roleBadgeText.toLowerCase().includes('admin')
                ? `<span class="badge bg-light text-muted">${roleBadgeText}</span>`
                : '';

            const card = document.createElement('article');
            card.className = 'feed-card card border-0 shadow-sm mb-4';
            card.dataset.post = post.id;
            card.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div class="d-flex align-items-center">
                            <div class="feed-avatar rounded-circle overflow-hidden flex-shrink-0">
                                <img src="${author?.avatar || 'https://via.placeholder.com/80'}" alt="${author?.name || 'User'}" class="w-100 h-100 object-fit-cover">
                            </div>
                            <div class="ms-3">
                                <div class="d-flex align-items-center flex-wrap gap-2">
                                    <a href="profile.html?user=${author?.id || ''}" class="feed-author fw-semibold mb-0 text-dark">${author?.company || author?.name || 'Freight Partner'}</a>
                                    ${verifiedMarkup}
                                    ${roleBadge}
                                </div>
                                <p class="text-muted small mb-0">${formatTimeAgo(post.createdAt)}</p>
                            </div>
                        </div>
                        ${badgeMarkup}
                    </div>
                    <p class="feed-text mb-3">${post.text}</p>
                    ${renderMedia(post)}
                    <div class="d-flex align-items-center justify-content-between mt-4">
                        <button class="btn btn-light btn-sm d-flex align-items-center gap-2" data-like="${post.id}">
                            <i class="fas fa-thumbs-up ${currentUser && post.likes.includes(currentUser.id) ? 'text-primary' : 'text-muted'}"></i>
                            <span>${post.likes.length}</span>
                        </button>
                        <button class="btn btn-light btn-sm d-flex align-items-center gap-2" data-share="${post.id}">
                            <i class="fas fa-share text-muted"></i>
                            <span data-share-count>${post.shares || 0}</span>
                        </button>
                    </div>
                    <p class="feed-score mt-3 mb-0">
                        <i class="fas fa-eye text-muted me-2"></i>Views: <span data-view-count>${post.views || 0}</span>
                    </p>
                </div>
            `;
            fragment.appendChild(card);
        });

        feedContainer.innerHTML = '';
        feedContainer.appendChild(fragment);

        feedContainer.querySelectorAll('[data-like]').forEach(btn => {
            btn.addEventListener('click', function() {
                toggleLike(this.dataset.like, getSessionUserId());
            });
        });

        feedContainer.querySelectorAll('[data-share]').forEach(btn => {
            btn.addEventListener('click', function() {
                handleShare(this.dataset.share, this);
            });
        });

        renderTrendingWidgets();
        initFeedViewObserver(feedContainer);
    }

    function renderMedia(post) {
        if (!post.mediaUrl) return '';
        if (post.mediaType === 'video') {
            return `
                <div class="ratio ratio-16x9 rounded-3 overflow-hidden">
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
            } catch (err) {
                // keep original
            }
            return `
                <div class="feed-link p-3 rounded-3 bg-light border">
                    <i class="fas fa-link text-primary me-2"></i>
                    <a href="${safeUrl}" target="_blank" rel="noopener">${display}</a>
                </div>
            `;
        }
        return `
            <div class="feed-media rounded-3 overflow-hidden">
                <img src="${post.mediaUrl}" alt="Post media" class="w-100 h-100 object-fit-cover">
            </div>
        `;
    }

    function handleShare(postId, trigger) {
        if (!postId) return;
        const rawPost = state.posts?.[postId];
        const postListEntry = buildPersonalizedFeed().find(item => item.post.id === postId) || {};
        const postText = rawPost?.text || postListEntry.text || 'Alpha Freight update';
        const shareUrl = buildShareUrl(postId);
        const shareData = {
            title: 'Alpha Freight Update',
            text: postText.length > 120 ? `${postText.slice(0, 117)}...` : postText,
            url: shareUrl
        };

        const runIncrement = () => incrementShareCount(postId, trigger);

        if (navigator.share) {
            navigator.share(shareData)
                .then(runIncrement)
                .catch(err => {
                    if (err?.name === 'AbortError') return;
                    copyToClipboard(shareUrl).then(() => {
                        window.AlphaBrokrage?.showAlert?.('success', 'Link copied to clipboard.');
                        runIncrement();
                    }).catch(() => {
                        window.AlphaBrokrage?.showAlert?.('warning', 'Unable to share automatically. Please copy the link manually.');
                    });
                });
        } else {
            copyToClipboard(shareUrl).then(() => {
                window.AlphaBrokrage?.showAlert?.('success', 'Link copied to clipboard.');
                runIncrement();
            }).catch(() => {
                window.AlphaBrokrage?.showAlert?.('warning', 'Unable to copy share link. Please try manually.');
            });
        }
    }

    function buildShareUrl(postId) {
        const baseUrl = window.location.origin + window.location.pathname;
        const url = new URL(baseUrl, window.location.href);
        url.searchParams.set('post', postId);
        return url.toString();
    }

    function incrementShareCount(postId, trigger) {
        if (!ensureFirebase()) return;
        const button = trigger;
        const countEl = button?.querySelector('[data-share-count]') || document.querySelector(`[data-post="${postId}"] [data-share-count]`);
        firebaseDb.ref(`social/posts/${postId}/shares`).transaction(current => {
            const base = Number(current) || 0;
            return base + 1;
        }).then(result => {
            const newVal = result?.snapshot?.val();
            if (countEl && typeof newVal === 'number') {
                countEl.textContent = newVal.toString();
            }
            if (state.posts && state.posts[postId]) {
                state.posts[postId].shares = Number(newVal) || ((Number(state.posts[postId].shares) || 0) + 1);
            }
        }).catch(err => console.error('[SocialHub] Failed to increment shares', err));
    }

    function copyToClipboard(text) {
        if (navigator.clipboard?.writeText) {
            return navigator.clipboard.writeText(text);
        }
        return new Promise((resolve, reject) => {
            try {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.setAttribute('readonly', '');
                textarea.style.position = 'absolute';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                const selection = document.getSelection();
                const selected = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                if (selected) {
                    selection.removeAllRanges();
                    selection.addRange(selected);
                }
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }

    function renderPostComposer() {
        const form = document.querySelector('[data-post-form]');
        if (!form) return;
        const mediaPreview = form.querySelector('[data-media-preview]');
        const hiddenUrlInput = form.querySelector('input[name="mediaUrl"]');
        const hiddenTypeInput = form.querySelector('input[name="mediaType"]');
        const modeButtons = form.querySelectorAll('[data-media-mode]');
        const mediaBlocks = form.querySelectorAll('[data-media-block]');
        const imageInput = form.querySelector('[data-media-image]');
        const videoInput = form.querySelector('[data-media-video]');
        const linkInput = form.querySelector('[data-media-link]');
        const finalizeModalEl = document.getElementById('postConfirmModal');
        const hashtagInput = finalizeModalEl?.querySelector('[data-hashtag-input]');
        const summaryBox = finalizeModalEl?.querySelector('[data-preview-summary]');
        const confirmBtn = finalizeModalEl?.querySelector('[data-post-confirm]');
        const draftBtn = finalizeModalEl?.querySelector('[data-post-draft]');
        const draftsKey = 'ab.social.drafts';

        let finalizeModal = null;
        let currentMode = 'none';
        let pendingPost = null;
        let draftLoaded = false;

        const showAlert = (type, message) => {
            if (window.AlphaBrokrage?.showAlert) {
                window.AlphaBrokrage.showAlert(type, message);
            } else {
                alert(message);
            }
        };

        const resetPreview = () => {
            if (!mediaPreview) return;
            mediaPreview.innerHTML = '';
            mediaPreview.classList.add('d-none');
        };

        const setPreview = markup => {
            if (!mediaPreview) return;
            mediaPreview.innerHTML = markup;
            mediaPreview.classList.remove('d-none');
        };

        const parseHashtags = input => {
            if (!input) return [];
            return input
                .split(/[,\s]+/)
                .map(tag => tag.trim())
                .filter(Boolean)
                .map(tag => (tag.startsWith('#') ? tag : `#${tag}`))
                .map(tag => tag.replace(/[^#a-zA-Z0-9_-]/g, ''))
                .filter(Boolean);
        };

        const setMode = mode => {
            currentMode = mode;
            form.dataset.mediaMode = mode;
            modeButtons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.mediaMode === mode);
            });
            mediaBlocks.forEach(block => {
                const blockMode = block.getAttribute('data-media-block');
                block.classList.toggle('d-none', blockMode !== mode);
            });
            if (hiddenUrlInput) hiddenUrlInput.value = '';
            if (hiddenTypeInput) hiddenTypeInput.value = '';
            if (imageInput && mode !== 'upload-image') imageInput.value = '';
            if (videoInput && mode !== 'upload-video') videoInput.value = '';
            if (linkInput && mode !== 'link') linkInput.value = '';
            resetPreview();
        };

        const ensureModal = () => {
            if (!finalizeModalEl || typeof bootstrap === 'undefined') return null;
            finalizeModal = finalizeModal || new bootstrap.Modal(finalizeModalEl, { backdrop: 'static' });
            return finalizeModal;
        };

        const generateSummary = payload => {
            if (!payload) return '';
            const lines = [];
            lines.push(`<strong>Caption:</strong> ${payload.text.length > 180 ? `${payload.text.substring(0, 180)}…` : payload.text}`);
            if (payload.mediaType === 'image') {
                lines.push('<strong>Attachment:</strong> Image uploaded');
            } else if (payload.mediaType === 'video') {
                lines.push('<strong>Attachment:</strong> Video uploaded');
            } else if (payload.mediaType === 'link') {
                lines.push(`<strong>Attachment:</strong> <a href="${payload.mediaUrl}" target="_blank" rel="noopener">${payload.mediaUrl}</a>`);
            } else {
                lines.push('<strong>Attachment:</strong> None');
            }
            if (payload.hashtags?.length) {
                lines.push(`<strong>Hashtags:</strong> ${payload.hashtags.join(' ')}`);
            }
            return lines.map(line => `<p class="mb-2">${line}</p>`).join('');
        };

        const saveDraft = (payload, hashtags) => {
            if (typeof localStorage === 'undefined') {
                showAlert('warning', 'Draft save browser storage par depend karta ha.');
                return;
            }
            const userId = getSessionUserId() || 'anonymous';
            const drafts = tryParseLocal(draftsKey, {});
            drafts[userId] = drafts[userId] || [];
            const entry = Object.assign({}, payload, {
                hashtags,
                mode: payload.mode,
                draftId: payload.draftId || Date.now(),
                savedAt: Date.now()
            });
            drafts[userId] = drafts[userId].filter(d => d.draftId !== entry.draftId);
            drafts[userId].unshift(entry);
            drafts[userId] = drafts[userId].slice(0, 10);
            try {
                localStorage.setItem(draftsKey, JSON.stringify(drafts));
                pendingPost = entry;
                showAlert('success', 'Draft save ho gaya ha.');
                ensureModal()?.hide();
            } catch (err) {
                console.error('[SocialHub] draft save error', err);
                showAlert('error', 'Draft save nahi ho saka.');
            }
        };

        const removeDraftById = draftId => {
            if (!draftId || typeof localStorage === 'undefined') return;
            const userId = getSessionUserId() || 'anonymous';
            const drafts = tryParseLocal(draftsKey, {});
            if (!drafts[userId]) return;
            drafts[userId] = drafts[userId].filter(d => d.draftId !== draftId);
            try {
                localStorage.setItem(draftsKey, JSON.stringify(drafts));
            } catch (err) {
                console.error('[SocialHub] draft remove error', err);
            }
        };

        const loadDraftIfAvailable = () => {
            if (draftLoaded || typeof localStorage === 'undefined') return;
            const userId = getSessionUserId();
            if (!userId) return;
            const drafts = tryParseLocal(draftsKey, {});
            const userDrafts = drafts[userId];
            if (!userDrafts || !userDrafts.length) return;
            const draft = userDrafts[0];
            const textArea = form.querySelector('textarea[name="postText"]');
            if (textArea) {
                textArea.value = draft.text || '';
            }
            setMode(draft.mode || (draft.mediaType === 'image' ? 'upload-image' : draft.mediaType === 'video' ? 'upload-video' : draft.mediaType === 'link' ? 'link' : 'none'));
            if (draft.mediaUrl && draft.mediaType) {
                if (hiddenUrlInput) hiddenUrlInput.value = draft.mediaUrl;
                if (hiddenTypeInput) hiddenTypeInput.value = draft.mediaType;
                if (draft.mediaType === 'image') {
                    setPreview(`<img src="${draft.mediaUrl}" alt="Preview" class="w-100 rounded-3">`);
                } else if (draft.mediaType === 'video') {
                    setPreview(`<video src="${draft.mediaUrl}" controls class="w-100 rounded-3"></video>`);
                } else if (draft.mediaType === 'link') {
                    setPreview(`
                        <div class="feed-link p-3 rounded-3 bg-light border">
                            <i class="fas fa-link text-primary me-2"></i>
                            <a href="${draft.mediaUrl}" target="_blank" rel="noopener">${draft.mediaUrl}</a>
                        </div>
                    `);
                }
            } else {
                setMode('none');
            }
            if (hashtagInput) {
                hashtagInput.value = (draft.hashtags || []).join(' ');
            }
            pendingPost = draft;
            draftLoaded = true;
            showAlert('info', 'Draft load ho gaya ha. Aap editing continue kar sakte hain.');
        };

        if (modeButtons.length) {
            modeButtons.forEach(btn => {
                btn.addEventListener('click', () => setMode(btn.dataset.mediaMode));
            });
        }

        setMode('none');
        setComposerEnabled(false);

        if (imageInput) {
            imageInput.addEventListener('change', function() {
                resetPreview();
                if (!this.files || !this.files[0]) {
                    if (hiddenUrlInput) hiddenUrlInput.value = '';
                    if (hiddenTypeInput) hiddenTypeInput.value = '';
                    return;
                }
                const file = this.files[0];
                if (!file.type.startsWith('image/')) {
                    showAlert('warning', 'Sirf image files (PNG/JPG) upload karein.');
                    this.value = '';
                    return;
                }
                if (file.size > 5 * 1024 * 1024) {
                    showAlert('warning', 'Image size 5MB se kam honi chahiye.');
                    this.value = '';
                    return;
                }
                const reader = new FileReader();
                reader.onload = e => {
                    if (hiddenUrlInput) hiddenUrlInput.value = e.target.result;
                    if (hiddenTypeInput) hiddenTypeInput.value = 'image';
                    setPreview(`<img src="${e.target.result}" alt="Preview" class="w-100 rounded-3">`);
                };
                reader.readAsDataURL(file);
            });
        }

        if (videoInput) {
            videoInput.addEventListener('change', function() {
                resetPreview();
                if (!this.files || !this.files[0]) {
                    if (hiddenUrlInput) hiddenUrlInput.value = '';
                    if (hiddenTypeInput) hiddenTypeInput.value = '';
                    return;
                }
                const file = this.files[0];
                if (!file.type.startsWith('video/')) {
                    showAlert('warning', 'Sirf video files (MP4) upload karein.');
                    this.value = '';
                    return;
                }
                if (file.size > 25 * 1024 * 1024) {
                    showAlert('warning', 'Video 25MB se zyada nahi ho sakta.');
                    this.value = '';
                    return;
                }
                const reader = new FileReader();
                reader.onload = e => {
                    if (hiddenUrlInput) hiddenUrlInput.value = e.target.result;
                    if (hiddenTypeInput) hiddenTypeInput.value = 'video';
                    setPreview(`<video src="${e.target.result}" controls class="w-100 rounded-3"></video>`);
                };
                reader.readAsDataURL(file);
            });
        }

        if (linkInput) {
            const updateLink = () => {
                const value = linkInput.value.trim();
                if (hiddenUrlInput) hiddenUrlInput.value = value;
                if (hiddenTypeInput) hiddenTypeInput.value = value ? 'link' : '';
                if (!value) {
                    resetPreview();
                    return;
                }
                let display = value;
                try {
                    const urlObj = new URL(value);
                    display = urlObj.hostname.replace('www.', '') + urlObj.pathname;
                } catch (err) {
                    // keep original
                }
                setPreview(`
                    <div class="feed-link p-3 rounded-3 bg-light border">
                        <i class="fas fa-link text-primary me-2"></i>
                        <a href="${value}" target="_blank" rel="noopener">${display}</a>
                    </div>
                `);
            };
            linkInput.addEventListener('input', updateLink);
            linkInput.addEventListener('blur', updateLink);
        }

        form.addEventListener('submit', function(event) {
            event.preventDefault();
            const currentUser = getSessionUser();
            if (!currentUser?.id) {
                window.AlphaBrokrage?.showAlert?.('warning', 'Apna profile select ya login karain pehlay.');
                return;
            }

            const textArea = form.querySelector('textarea[name="postText"]');
            const text = (textArea?.value || '').trim();
            const mediaUrl = (hiddenUrlInput?.value || '').trim();
            const mediaType = mediaUrl ? (hiddenTypeInput?.value || null) : null;

            if (!text) {
                window.AlphaBrokrage?.showAlert?.('warning', 'Post ka text likhna zaroori ha.');
                return;
            }

            if ((currentMode === 'upload-image' || currentMode === 'upload-video' || currentMode === 'link') && !mediaUrl) {
                window.AlphaBrokrage?.showAlert?.('warning', 'Attachment select ya link paste karein ya No Attachment choose karein.');
                return;
            }

            pendingPost = {
                text,
                mediaUrl,
                mediaType,
                mode: currentMode,
                draftId: pendingPost?.draftId || null
            };

            if (hashtagInput) {
                hashtagInput.value = (pendingPost.hashtags || []).join(' ');
            }
            if (summaryBox) {
                summaryBox.innerHTML = generateSummary(pendingPost);
            }
            ensureModal()?.show();
        });

        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                const currentUser = getSessionUser();
                if (!pendingPost || !currentUser?.id) return;
                const tags = parseHashtags(hashtagInput?.value || '');
                let finalText = pendingPost.text;
                const existingTags = new Set(extractTagsFromText(finalText));
                const newTags = tags.filter(tag => !existingTags.has(tag.toLowerCase()));
                if (newTags.length) {
                    const tagLine = newTags.join(' ');
                    finalText = `${finalText}${finalText.endsWith('\n') ? '' : '\n\n'}${tagLine}`;
                }
                const payload = {
                    text: finalText,
                    mediaUrl: pendingPost.mediaUrl,
                    mediaType: pendingPost.mediaType
                };
                createPost(payload, currentUser.id)
                    .then(() => {
                        ensureModal()?.hide();
                        form.reset();
                        setMode('none');
                        pendingPost && pendingPost.draftId && removeDraftById(pendingPost.draftId);
                        pendingPost = null;
                        if (hashtagInput) hashtagInput.value = '';
                        showAlert('success', 'Aapka update feed men publish ho gaya ha.');
                    })
                    .catch(error => {
                        console.error('[SocialHub] createPost error', error);
                        showAlert('error', 'Post publish kernay men issue aya, dubara koshish karain.');
                    });
            });
        }

        if (draftBtn) {
            draftBtn.addEventListener('click', () => {
                const currentUser = getSessionUser();
                if (!pendingPost || !currentUser?.id) {
                    showAlert('warning', 'Draft save kernay se pehle Post Now button press karein taa-ke summary open ho.');
                    return;
                }
                const tags = parseHashtags(hashtagInput?.value || '');
                pendingPost.hashtags = tags;
                saveDraft(pendingPost, tags);
            });
        }

        document.addEventListener('ab.social.users.update', loadDraftIfAvailable);
        setTimeout(loadDraftIfAvailable, 400);
    }

    function renderProfilePage() {
        const profileRoot = document.querySelector('[data-profile-root]');
        if (!profileRoot || !state.ready.users || !state.ready.posts) return;

        const urlParams = new URLSearchParams(window.location.search);
        const requestedId = urlParams.get('user');
        const currentUser = getSessionUser();
        const profileUser = requestedId ? getUserById(requestedId) : currentUser;
        if (!profileUser) return;

        const avatarEl = profileRoot.querySelector('[data-profile-avatar]');
        if (avatarEl) {
            avatarEl.src = profileUser.avatar;
            avatarEl.alt = profileUser.company || profileUser.name;
        }

        const nameContainer = profileRoot.querySelector('[data-profile-name]');
        const nameTextEl = nameContainer ? nameContainer.querySelector('span') : null;
        const verifiedChip = profileRoot.querySelector('[data-profile-verified]');
        if (nameContainer) {
            const baseName = profileUser.company || profileUser.name;
            if (nameTextEl) nameTextEl.textContent = baseName;
            const isVerified = isVerifiedAccount(profileUser);
            if (verifiedChip) {
                verifiedChip.classList.toggle('d-none', !isVerified);
            }
        }

        profileRoot.querySelectorAll('[data-profile-location]').forEach(el => {
            el.textContent = profileUser.location || 'Location not shared';
        });

        const taglineEl = profileRoot.querySelector('[data-profile-tagline]');
        if (taglineEl) {
            const tagline = (profileUser.tagline || '').trim();
            taglineEl.textContent = tagline;
            taglineEl.classList.toggle('d-none', !tagline);
        }

        const followersEl = profileRoot.querySelector('[data-profile-followers]');
        if (followersEl) {
            const rawFollowers = Array.isArray(profileUser.followers) ? profileUser.followers.length : 0;
            const baseline = 125000;
            const followerCount = isAdminAccount(profileUser)
                ? (rawFollowers >= baseline ? rawFollowers : baseline + rawFollowers)
                : rawFollowers;
            followersEl.textContent = followerCount.toLocaleString();
        }

        const followingEl = profileRoot.querySelector('[data-profile-following]');
        if (followingEl) followingEl.textContent = profileUser.following.length;

        const bioEl = profileRoot.querySelector('[data-profile-bio]');
        if (bioEl) {
            const bio = (profileUser.bio || '').trim();
            bioEl.textContent = bio || 'No description shared yet.';
        }

        const likesEl = profileRoot.querySelector('[data-profile-likes]');
        if (likesEl) {
            const likesCount = getPosts()
                .filter(post => post.authorId === profileUser.id)
                .reduce((total, post) => total + (post.likes?.length || 0), 0);
            likesEl.textContent = likesCount;
        }

        const connectionCard = profileRoot.querySelector('[data-profile-connection-card]');
        const connectionTitle = profileRoot.querySelector('[data-profile-connection-title]');
        const connectionList = profileRoot.querySelector('[data-profile-connection-list]');
        const connectionClose = profileRoot.querySelector('[data-profile-connection-close]');
        const connectionOverlay = profileRoot.querySelector('[data-profile-connection-overlay]');
        const summaryPanel = profileRoot.querySelector('[data-profile-summary]');

        const hideConnections = () => {};
        const showConnections = () => {};

        hideConnections();

        if (connectionClose) {
            connectionClose.onclick = hideConnections;
        }

        if (connectionOverlay) {
            connectionOverlay.onclick = hideConnections;
        }

        const followersTrigger = profileRoot.querySelector('[data-profile-followers-trigger]');
        if (followersTrigger) {
            followersTrigger.onclick = event => showConnections('followers', profileUser.followers, event.currentTarget);
        }

        const followingTrigger = profileRoot.querySelector('[data-profile-following-trigger]');
        if (followingTrigger) {
            followingTrigger.onclick = event => showConnections('following', profileUser.following, event.currentTarget);
        }

        const followBtn = profileRoot.querySelector('[data-follow-button]');
        if (followBtn) {
            if (!currentUser || profileUser.id === currentUser.id) {
                followBtn.classList.add('d-none');
                followBtn.disabled = true;
            } else {
                followBtn.classList.remove('d-none');
                followBtn.disabled = false;
                const isFollowing = currentUser.following.includes(profileUser.id);
                followBtn.textContent = isFollowing ? 'Unfollow' : 'Follow';
                followBtn.classList.toggle('btn-outline-primary', isFollowing);
                followBtn.classList.toggle('btn-primary', !isFollowing);
                followBtn.onclick = function() {
                    toggleFollow(profileUser.id, currentUser.id);
                };
            }
        }

        const postsContainer = profileRoot.querySelector('[data-profile-posts]');
        if (postsContainer) {
            const posts = getPosts().filter(post => post.authorId === profileUser.id);
            if (!posts.length) {
                postsContainer.innerHTML = `
                    <div class="text-center py-5 text-muted">
                        <i class="fas fa-box-open fa-2x mb-3"></i>
                        <p class="mb-0">No updates from this user yet.</p>
                    </div>
                `;
            } else {
                postsContainer.innerHTML = '';
                posts.forEach(post => {
                    const card = document.createElement('div');
                    card.className = 'card border-0 shadow-sm mb-4';
                    card.innerHTML = `
                        <div class="card-body">
                            <p class="small text-muted mb-2">${formatTimeAgo(post.createdAt)}</p>
                            <p class="mb-3">${post.text}</p>
                            ${renderMedia(post)}
                            <div class="d-flex align-items-center gap-3 mt-3">
                                <span class="text-muted small d-flex align-items-center gap-1">
                                    <i class="fas fa-thumbs-up"></i> ${post.likes.length}
                                </span>
                                <span class="text-muted small d-flex align-items-center gap-1">
                                    <i class="fas fa-comment"></i> ${post.comments}
                                </span>
                            </div>
                        </div>
                    `;
                    postsContainer.appendChild(card);
                });
            }
        }
    }

    function renderFollowSuggestions() {
        const container = document.querySelector('[data-suggested-follows]');
        if (!container) return;

        if (!state.ready.users) {
            container.innerHTML = `
                <div class="text-muted small">Loading network suggestions...</div>
            `;
            return;
        }

        const currentUser = getSessionUser();
        if (!currentUser) {
            container.innerHTML = `
                <div class="text-muted small">Login karain taa-ke network suggestions dekhein.</div>
            `;
            return;
        }

        const suggestions = getUsers()
            .filter(user => user.id !== currentUser.id && !currentUser.following.includes(user.id))
            .slice(0, 5);

        if (!suggestions.length) {
            container.innerHTML = `
                <div class="text-muted small">Aap already sab key saath connected hain.</div>
            `;
            return;
        }

        container.innerHTML = '';
        suggestions.forEach(user => {
            const item = document.createElement('div');
            item.className = 'suggestion-item d-flex flex-column align-items-center text-center mb-3';
            item.innerHTML = `
                <div class="suggestion-avatar rounded-circle overflow-hidden flex-shrink-0">
                    <img src="${user.avatar}" alt="${user.company || user.name}" class="w-100 h-100 object-fit-cover">
                </div>
                <div class="suggestion-meta mt-3 w-100">
                    <p class="suggestion-name fw-semibold mb-1">${user.company || user.name}</p>
                    <p class="text-muted small mb-0">${user.location || 'Location not shared'}</p>
                </div>
                <button class="btn btn-gradient follow-pill mt-3 w-100" data-follow-suggest="${user.id}">Follow</button>
            `;
            container.appendChild(item);
        });

        container.querySelectorAll('[data-follow-suggest]').forEach(btn => {
            btn.addEventListener('click', function() {
                const followerId = getSessionUserId();
                if (!followerId) {
                    window.AlphaBrokrage?.showAlert?.('warning', 'Follow kerna kay liye login zaroori ha.');
                    return;
                }
                toggleFollow(this.dataset.followSuggest, followerId);
            });
        });
    }

    function renderTrendingWidgets() {
        const tagsContainer = document.querySelector('[data-trending-tags]');
        const listContainer = document.querySelector('[data-trending-list]');

        if (tagsContainer) {
            if (!state.ready.posts) {
                tagsContainer.innerHTML = `
                    <span class="badge bg-light text-muted">Loading...</span>
                `;
            } else {
                const tagCounts = {};
                getPosts()
                    .filter(post => hoursSince(post.createdAt) <= 72)
                    .forEach(post => {
                        post.tags.forEach(tag => {
                            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                        });
                    });
                const topTags = Object.entries(tagCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6);

                if (!topTags.length) {
                    tagsContainer.innerHTML = `
                        <span class="badge bg-light text-muted">No hashtags yet</span>
                    `;
                } else {
                    tagsContainer.innerHTML = '';
                    topTags.forEach(([tag]) => {
                        const badge = document.createElement('span');
                        badge.className = 'badge bg-primary-subtle text-primary fw-semibold';
                        badge.textContent = tag;
                        tagsContainer.appendChild(badge);
                    });
                }
            }
        }

        if (!listContainer) return;
        if (!state.ready.posts || !state.ready.users) {
            listContainer.innerHTML = `
                <div class="text-center text-muted small py-3">
                    <i class="fas fa-circle-notch fa-spin me-2"></i>Loading trending posts...
                </div>
            `;
            return;
        }

        const currentUser = getSessionUser();
        const meta = collectFeedMeta(currentUser)
            .filter(item => item.post.postType !== 'adminNews')
            .filter(item => item.hoursSince <= FEED_SETTINGS.trendingHours)
            .slice(0, 5);

        if (!meta.length) {
            listContainer.innerHTML = `
                <div class="text-muted small">Abhi tak koi trending post nahi. Activity barhayen!</div>
            `;
            return;
        }

        listContainer.innerHTML = '';
        meta.forEach(item => {
            const row = document.createElement('div');
            row.className = 'd-flex align-items-start';
            row.innerHTML = `
                <div class="flex-shrink-0 me-3">
                    <span class="badge bg-warning-subtle text-warning fw-semibold">
                        ${Math.max(0, Math.round(item.score))}
                    </span>
                </div>
                <div class="flex-grow-1">
                    <div class="d-flex align-items-center gap-2 mb-1">
                        <a href="profile.html?user=${item.author?.id || ''}" class="fw-semibold text-decoration-none text-dark">${item.author?.company || item.author?.name || 'Freight Partner'}</a>
                        ${isVerifiedAccount(item.author) ? '<span class="badge bg-primary-subtle text-primary">Verified</span>' : ''}
                    </div>
                    <p class="text-muted small mb-1">${formatTimeAgo(item.post.createdAt)}</p>
                    <p class="small mb-0 text-muted" style="line-height:1.4; max-height:2.8em; overflow:hidden;">${item.post.text}</p>
                </div>
            `;
            listContainer.appendChild(row);
        });
    }

    function renderNotifications() {
        const container = document.querySelector('[data-notification-list]');
        if (!container) return;

        if (!state.ready.notifications) {
            container.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="fas fa-circle-notch fa-spin mb-3"></i>
                    <p class="mb-0">Notifications are loading...</p>
                </div>
            `;
            return;
        }

        const currentUserId = getSessionUserId();
        const notifications = getNotifications(currentUserId);

        if (!notifications.length) {
            container.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="fas fa-bell-slash fa-2x mb-3"></i>
                    <p class="mb-0">No new notifications.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        notifications.slice(0, 5).forEach(item => {
            const row = document.createElement('div');
            row.className = `notification-item luxe-notification mb-3 ${item.read ? 'is-read' : 'is-unread'}`;
            row.innerHTML = `
                <div class="notification-icon glam-icon">
                    <i class="fas fa-${item.type === 'follow' ? 'user-plus' : item.type === 'comment' ? 'comment-dots' : 'thumbs-up'}"></i>
                </div>
                <div class="notification-body mt-3">
                    <p class="notification-text fw-semibold mb-2">${item.text}</p>
                    <div class="notification-time text-muted small">
                        <i class="fas fa-clock me-1"></i>${formatTimeAgo(item.createdAt)}
                    </div>
                </div>
            `;
            container.appendChild(row);
        });
    }

    function updateNotificationBadge() {
        const badge = document.querySelector('[data-notification-badge]');
        if (!badge) return;

        if (!state.ready.notifications) {
            badge.classList.add('d-none');
            badge.textContent = '0';
            return;
        }

        const currentUserId = getSessionUserId();
        const notifications = getNotifications(currentUserId);
        const unread = notifications.filter(item => !item.read).length;

        badge.textContent = unread > 9 ? '9+' : unread;
        badge.classList.toggle('d-none', unread === 0);
    }

    function bindNotificationBell() {
        const bell = document.querySelector('[data-notification-bell]');
        if (!bell) return;
        bell.addEventListener('click', function() {
            const currentUserId = getSessionUserId();
            if (!currentUserId) return;
            markNotificationsRead(currentUserId);
        });
    }

    function toggleLike(postId, userId) {
        if (!ensureFirebase()) return;
        if (!userId) {
            window.AlphaBrokrage?.showAlert?.('warning', 'Like kernay kay liye login zaroori ha.');
            return;
        }
        const post = state.posts[postId];
        if (!post) return;

        const likeRef = refs.posts.child(postId).child('likes').child(userId);
        const alreadyLiked = post.likes.includes(userId);

        if (alreadyLiked) {
            likeRef.remove().catch(error => console.error('[SocialHub] unlike error', error));
        } else {
            likeRef.set(true)
                .then(() => {
                    if (userId !== post.authorId) {
                        const liker = getUserById(userId);
                        appendNotification({
                            userId: post.authorId,
                            type: 'like',
                            text: `${liker?.company || liker?.name || 'A partner'} liked your post`
                        });
                    }
                })
                .catch(error => console.error('[SocialHub] like error', error));
        }
    }

    function toggleFollow(targetId, followerId) {
        if (!ensureFirebase()) return;
        if (!targetId || !followerId || targetId === followerId) return;

        const follower = state.users[followerId];
        const target = state.users[targetId];
        if (!follower || !target) return;

        const followerFollowingRef = refs.users.child(followerId).child('following').child(targetId);
        const targetFollowersRef = refs.users.child(targetId).child('followers').child(followerId);
        const alreadyFollowing = follower.following.includes(targetId);

        const operations = alreadyFollowing
            ? [followerFollowingRef.remove(), targetFollowersRef.remove()]
            : [followerFollowingRef.set(true), targetFollowersRef.set(true)];

        Promise.all(operations)
            .then(() => {
                if (!alreadyFollowing && followerId !== targetId) {
                    appendNotification({
                        userId: targetId,
                        type: 'follow',
                        text: `${follower.company || follower.name} started following you`
                    });
                }
            })
            .catch(error => console.error('[SocialHub] follow toggle error', error));
    }

    function createPost({ text, mediaUrl, mediaType }, authorId) {
        if (!ensureFirebase()) return Promise.reject(new Error('Firebase not ready'));
        if (!authorId) return Promise.reject(new Error('Author required'));

        const trimmed = (text || '').trim();
        if (!trimmed) return Promise.reject(new Error('Post text required'));

        const postRef = refs.posts.push();
        const createdAt = Date.now();
        const tags = extractTagsFromText(trimmed);
        const tagsMap = {};
        tags.forEach(tag => {
            const normalized = tag
                .toString()
                .trim()
                .replace(/^#+/, '')
                .replace(/[^a-z0-9_-]/gi, '')
                .toLowerCase();
            if (normalized) {
                tagsMap[normalized] = true;
            }
        });

        const payload = {
            authorId,
            text: trimmed,
            comments: 0,
            shares: 0,
            views: 0,
            postType: 'standard',
            createdAt
        };

        if (mediaUrl) {
            payload.mediaUrl = mediaUrl;
            payload.mediaType = mediaType || 'image';
        }

        if (Object.keys(tagsMap).length) {
            payload.tags = tagsMap;
        }

        return postRef.set(payload);
    }

    function markNotificationsRead(userId) {
        if (!ensureFirebase() || !userId) return;
        const notifications = getNotifications(userId);
        const updates = {};
        notifications.forEach(item => {
            if (!item.read) {
                updates[`${item.id}/read`] = true;
            }
        });
        if (!Object.keys(updates).length) return;
        refs.notifications.child(userId).update(updates)
            .catch(error => console.error('[SocialHub] mark notifications error', error));
    }

    function appendNotification(entry) {
        if (!ensureFirebase()) return;
        if (!entry?.userId) return;
        const notifRef = refs.notifications.child(entry.userId).push();
        notifRef.set({
            type: entry.type || 'info',
            text: entry.text || '',
            createdAt: entry.createdAt || Date.now(),
            read: false
        }).catch(error => console.error('[SocialHub] append notification error', error));
    }

    function formatTimeAgo(timestamp) {
        const diff = Date.now() - timestamp;
        const seconds = Math.floor(diff / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        const weeks = Math.floor(days / 7);
        if (weeks < 4) return `${weeks}w ago`;
        const months = Math.floor(days / 30);
        if (months < 12) return `${months}mo ago`;
        const years = Math.floor(days / 365);
        return `${years}y ago`;
    }

    function escapeHtml(text) {
        return (text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    document.addEventListener('DOMContentLoaded', function() {
        loadViewedPosts();
        syncPortalProfileWithFirebase();
        renderCurrentUserSummary();
        renderProfileSwitcher();
        renderFeed();
        renderPostComposer();
        renderProfilePage();
        renderFollowSuggestions();
        renderNotifications();
        updateNotificationBadge();
        bindNotificationBell();
        attachFirebaseListeners();
        initProfileSearch();
        syncPortalProfileWithFirebase();
    });

    window.AlphaBrokrage = window.AlphaBrokrage || {};
    window.AlphaBrokrage.socialHub = {
        getSessionUser,
        setSessionUserId,
        getUsers,
        getPosts,
        toggleLike,
        toggleFollow,
        createPost,
        markNotificationsRead
    };
})(window, document);


