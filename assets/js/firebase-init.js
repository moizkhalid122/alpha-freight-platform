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

    (function () {
        const AB = window.AlphaBrokrage = window.AlphaBrokrage || {};
        if (!('indexedDB' in window)) return;

        const DB_NAME = 'ab_upload_queue_v1';
        const STORE = 'items';

        function openDb() {
            return new Promise((resolve, reject) => {
                const req = indexedDB.open(DB_NAME, 1);
                req.onupgradeneeded = function () {
                    const db = req.result;
                    if (!db.objectStoreNames.contains(STORE)) {
                        db.createObjectStore(STORE, { keyPath: 'id' });
                    }
                };
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error || new Error('idb_open_failed'));
            });
        }

        function txDone(tx) {
            return new Promise((resolve, reject) => {
                tx.oncomplete = () => resolve();
                tx.onabort = () => reject(tx.error || new Error('idb_tx_abort'));
                tx.onerror = () => reject(tx.error || new Error('idb_tx_error'));
            });
        }

        function safeName(name, fallback) {
            const n = String(name || '').trim();
            const out = n.replace(/[^\w.\-]+/g, '_').slice(0, 80);
            return out || fallback;
        }

        function readAsDataUrl(file) {
            return new Promise((resolve, reject) => {
                const r = new FileReader();
                r.onload = () => resolve(String(r.result || ''));
                r.onerror = () => reject(new Error('read_failed'));
                r.readAsDataURL(file);
            });
        }

        function canvasToBlob(canvas, type, quality) {
            return new Promise((resolve) => {
                if (canvas && typeof canvas.toBlob === 'function') {
                    canvas.toBlob((b) => resolve(b), type, quality);
                } else {
                    resolve(null);
                }
            });
        }

        async function compressIfNeeded(file) {
            const type = String(file && file.type || '').toLowerCase();
            if (!type.startsWith('image/')) return file;
            if (file.size && file.size <= 650 * 1024) return file;

            const dataUrl = await readAsDataUrl(file);
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('image_load_failed'));
                img.src = dataUrl;
            });

            const maxSide = 1600;
            const w = img.naturalWidth || img.width || 0;
            const h = img.naturalHeight || img.height || 0;
            if (!w || !h) return file;

            const ratio = Math.min(1, maxSide / Math.max(w, h));
            const nw = Math.max(1, Math.round(w * ratio));
            const nh = Math.max(1, Math.round(h * ratio));

            const canvas = document.createElement('canvas');
            canvas.width = nw;
            canvas.height = nh;
            const ctx = canvas.getContext('2d');
            if (!ctx) return file;
            ctx.drawImage(img, 0, 0, nw, nh);

            const blob = await canvasToBlob(canvas, 'image/jpeg', 0.82);
            if (!blob) return file;
            const newName = safeName(String(file.name || '').replace(/\.[a-z0-9]+$/i, '') + '.jpg', 'image.jpg');
            try {
                return new File([blob], newName, { type: 'image/jpeg' });
            } catch (e) {
                blob.name = newName;
                return blob;
            }
        }

        async function enqueueSupplierDocs(input) {
            const supplierId = String(input && input.supplierId || '');
            const authUid = String(input && input.authUid || '');
            const docs = Array.isArray(input && input.docs) ? input.docs : [];
            if (!supplierId || !authUid || docs.length === 0) return 0;

            const db = await openDb();
            const tx = db.transaction(STORE, 'readwrite');
            const store = tx.objectStore(STORE);
            const now = Date.now();

            for (let i = 0; i < docs.length; i++) {
                const d = docs[i] || {};
                const file = d.file;
                if (!file) continue;
                const docKey = String(d.docKey || '').trim();
                if (!docKey) continue;
                const id = `${authUid}_${docKey}_${now}_${Math.random().toString(16).slice(2)}`;
                store.put({
                    id,
                    supplierId,
                    authUid,
                    docKey,
                    file,
                    fileName: file.name || null,
                    contentType: file.type || null,
                    size: file.size || null,
                    attempts: 0,
                    createdAt: new Date().toISOString()
                });
            }

            await txDone(tx);
            try { db.close(); } catch (e) {}
            return docs.length;
        }

        async function listAll() {
            const db = await openDb();
            const tx = db.transaction(STORE, 'readonly');
            const store = tx.objectStore(STORE);
            const req = store.getAll();
            const items = await new Promise((resolve, reject) => {
                req.onsuccess = () => resolve(req.result || []);
                req.onerror = () => reject(req.error || new Error('idb_getall_failed'));
            });
            await txDone(tx);
            try { db.close(); } catch (e) {}
            return items;
        }

        async function updateItem(id, patch) {
            const db = await openDb();
            const tx = db.transaction(STORE, 'readwrite');
            const store = tx.objectStore(STORE);
            const req = store.get(id);
            const item = await new Promise((resolve, reject) => {
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => reject(req.error || new Error('idb_get_failed'));
            });
            if (item) {
                store.put(Object.assign({}, item, patch || {}));
            }
            await txDone(tx);
            try { db.close(); } catch (e) {}
        }

        async function deleteItem(id) {
            const db = await openDb();
            const tx = db.transaction(STORE, 'readwrite');
            tx.objectStore(STORE).delete(id);
            await txDone(tx);
            try { db.close(); } catch (e) {}
        }

        function uploadWithProgress(ref, file) {
            return new Promise((resolve, reject) => {
                const task = ref.put(file);
                let lastProgressAt = Date.now();
                let lastBytes = 0;
                const stallMs = 120000;
                const maxMs = 900000;

                const stallTimer = setInterval(() => {
                    const now = Date.now();
                    if (now - lastProgressAt > stallMs) {
                        try { task.cancel(); } catch (e) {}
                        clearInterval(stallTimer);
                        clearTimeout(maxTimer);
                        reject(new Error('upload_stalled'));
                    }
                }, 1500);

                const maxTimer = setTimeout(() => {
                    try { task.cancel(); } catch (e) {}
                    clearInterval(stallTimer);
                    reject(new Error('upload_timeout'));
                }, maxMs);

                task.on('state_changed', (snap) => {
                    lastProgressAt = Date.now();
                    const transferred = snap && typeof snap.bytesTransferred === 'number' ? snap.bytesTransferred : 0;
                    if (transferred !== lastBytes) lastBytes = transferred;
                }, (err) => {
                    clearInterval(stallTimer);
                    clearTimeout(maxTimer);
                    reject(err || new Error('upload_failed'));
                }, async () => {
                    clearInterval(stallTimer);
                    clearTimeout(maxTimer);
                    try {
                        const url = await task.snapshot.ref.getDownloadURL();
                        resolve(url);
                    } catch (e) {
                        reject(e || new Error('url_failed'));
                    }
                });
            });
        }

        async function processQueue() {
            if (AB.__uploadQueueRunning) return;
            AB.__uploadQueueRunning = true;
            try {
                const authSdk = AB.firebaseAuth;
                const db = AB.firebaseDb;
                if (!authSdk || !db || typeof firebase.storage !== 'function') return;
                const user = authSdk.currentUser;
                if (!user || !user.uid) return;
                const authUid = String(user.uid);
                const items = (await listAll()).filter(it => it && String(it.authUid || '') === authUid);
                if (!items.length) return;
                items.sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
                const storage = firebase.storage();

                for (let i = 0; i < items.length; i++) {
                    const it = items[i];
                    const id = String(it.id || '');
                    if (!id) continue;
                    const attempts = Number(it.attempts || 0);
                    if (attempts >= 5) continue;
                    const supplierId = String(it.supplierId || '');
                    const docKey = String(it.docKey || '');
                    const original = it.file;
                    if (!supplierId || !docKey || !original) continue;
                    try {
                        await updateItem(id, { attempts: attempts + 1, lastAttemptAt: new Date().toISOString() });
                        const uploadFile = await compressIfNeeded(original);
                        const ts = Date.now();
                        const fileName = safeName((uploadFile && uploadFile.name) || it.fileName || '', `${docKey}_${ts}`);
                        const ref = storage.ref().child(`kyc/suppliers/${supplierId}/${docKey}_${ts}_${fileName}`);
                        const url = await uploadWithProgress(ref, uploadFile);
                        const doc = {
                            url,
                            name: it.fileName || null,
                            type: it.contentType || null,
                            size: it.size || null,
                            uploadedAt: new Date().toISOString()
                        };
                        await db.ref('suppliers/' + supplierId + '/verificationDocs/' + docKey).set(doc);
                        await db.ref('suppliers/' + supplierId).update({ kycUpdatedAt: new Date().toISOString(), kycStatus: 'submitted' });
                        await deleteItem(id);
                    } catch (e) {}
                }
            } finally {
                AB.__uploadQueueRunning = false;
            }
        }

        AB.uploadQueue = AB.uploadQueue || {};
        AB.uploadQueue.enqueueSupplierDocs = enqueueSupplierDocs;
        AB.uploadQueue.process = processQueue;

        try {
            if (AB.firebaseAuth && typeof AB.firebaseAuth.onAuthStateChanged === 'function') {
                AB.firebaseAuth.onAuthStateChanged(() => { processQueue().catch(() => {}); });
            } else {
                setTimeout(() => { processQueue().catch(() => {}); }, 1200);
            }
        } catch (e) {}
    })();
})(window);

