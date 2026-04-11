const functions = require('firebase-functions');
const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
admin.initializeApp();
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

/**
 * Jab bhi notifications/suppliers/{supplierId} pe naya notification add ho
 * Supplier ke device pe FCM push bhejta hai (app band hone par bhi dikhega)
 */
exports.sendSupplierPush = functions.database
  .ref('notifications/suppliers/{supplierId}/{notifId}')
  .onCreate(async (snap, context) => {
    const notif = snap.val();
    const supplierId = context.params.supplierId;

    // Supplier ka FCM token lo
    const tokenSnap = await admin.database()
      .ref(`suppliers/${supplierId}/fcmToken/token`)
      .once('value');
    const token = tokenSnap.val();

    if (!token) {
      console.log('No FCM token for supplier:', supplierId);
      return null;
    }

    try {
      await admin.messaging().send({
        token,
        notification: {
          title: notif.title || 'Alpha Freight',
          body: notif.message || 'You have a new notification'
        },
        data: {
          type: notif.type || 'notification',
          loadId: notif.loadId || ''
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'default'
          }
        },
        apns: {
          payload: { aps: { sound: 'default' } },
          fcmOptions: {}
        },
        webpush: {
          fcmOptions: {
            link: 'https://alpha-brokerage.web.app/mobile-app/supplier/dashboard.html'
          }
        }
      });
      console.log('Push sent to supplier:', supplierId);
    } catch (err) {
      console.error('Push send error:', err);
    }
    return null;
  });

/**
 * Jab bhi notifications/carriers/{carrierId} pe naya notification add ho
 * Carrier ke device pe FCM push bhejta hai (app band hone par bhi dikhega)
 */
exports.sendCarrierPush = functions.database
  .ref('notifications/carriers/{carrierId}/{notifId}')
  .onCreate(async (snap, context) => {
    const notif = snap.val();
    const carrierId = context.params.carrierId;

    const tokenSnap = await admin.database()
      .ref(`carriers/${carrierId}/fcmToken/token`)
      .once('value');
    const token = tokenSnap.val();

    if (!token) {
      console.log('No FCM token for carrier:', carrierId);
      return null;
    }

    try {
      await admin.messaging().send({
        token,
        notification: {
          title: notif.title || 'Alpha Freight',
          body: notif.message || 'You have a new notification'
        },
        data: {
          type: notif.type || 'notification',
          loadId: notif.loadId || ''
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'default'
          }
        },
        apns: {
          payload: { aps: { sound: 'default' } },
          fcmOptions: {}
        },
        webpush: {
          fcmOptions: {
            link: 'https://alpha-brokerage.web.app/mobile-app/carrier/dashboard.html'
          }
        }
      });
      console.log('Push sent to carrier:', carrierId);
    } catch (err) {
      console.error('Push send error:', err);
    }
    return null;
  });

/**
 * Jab bhi loads/{loadId} create ho, sab carriers jinhon ne FCM token save kiya hua ho
 * unko "New Load Available" push + notification record create karta hai.
 */
exports.notifyCarriersOnNewLoad = functions.database
  .ref('loads/{loadId}')
  .onCreate(async (snap, context) => {
    const loadId = context.params.loadId;
    const load = snap.val() || {};

    const pickup = load.pickupLocation || load.pickup_location || 'Pickup';
    const delivery = load.deliveryLocation || load.delivery_location || 'Delivery';
    const price = load.price || load.maxBudget || load.budget || load.totalAmount || '';
    const priceText = (price !== '' && price !== null && price !== undefined) ? `£${Number(price).toFixed(2)}` : '£TBD';

    const notif = {
      title: 'New Load Available',
      message: `${pickup} → ${delivery} • ${priceText}`,
      type: 'new_load',
      loadId: loadId,
      url: 'https://alpha-brokerage.web.app/mobile-app/carrier/loads.html',
      read: false,
      createdAt: new Date().toISOString()
    };

    try {
      const carriersSnap = await admin.database().ref('carriers').once('value');
      const tasks = [];
      const pushes = [];
      carriersSnap.forEach((carrier) => {
        const c = carrier.val() || {};
        const token = c && c.fcmToken ? c.fcmToken.token : null;
        if (!token) return;
        pushes.push(
          admin.messaging().sendToDevice(token, {
            notification: { title: notif.title, body: notif.message },
            data: {
              type: 'new_load',
              userType: 'carrier',
              userId: String(carrier.key),
              loadId: String(loadId),
              url: '/mobile-app/carrier/loads.html'
            }
          }, { priority: 'high' }).catch(() => null)
        );
        tasks.push(
          admin.database().ref(`notifications/carriers/${carrier.key}`).push(notif)
        );
      });
      await Promise.all(tasks);
      await Promise.all(pushes);
      console.log('New load notified to carriers:', loadId, 'count=', tasks.length);
    } catch (err) {
      console.error('notifyCarriersOnNewLoad error:', err);
    }
    return null;
  });

exports.syncMarketLoads = functions.database
  .ref('loads/{loadId}')
  .onWrite(async (change, context) => {
    const loadId = String(context.params.loadId || '');
    const marketRef = admin.database().ref(`marketLoads/${loadId}`);

    if (!change.after.exists()) {
      try { await marketRef.remove(); } catch (e) {}
      return null;
    }

    const load = change.after.val() || {};
    const statusRaw = String(load.status || '').toLowerCase();
    const status = statusRaw || 'available';

    const carrierAssigned = !!(load.carrierId || load.carrierFirebaseUid || load.assignedCarrier || load.acceptedBy);
    const isTerminal = status === 'completed' || status === 'delivered' || status === 'cancelled' || status === 'canceled';
    const isMarketStatus = status === 'available' || status === 'pending' || status === 'active' || status === 'posted';

    if (!isMarketStatus || carrierAssigned || isTerminal) {
      try { await marketRef.remove(); } catch (e) {}
      return null;
    }

    const pickup = load.pickupLocation || load.pickup_location || '';
    const delivery = load.deliveryLocation || load.delivery_location || '';
    const price = load.price || load.budget || load.maxBudget || load.max_budget || load.totalAmount || load.totalCost || null;
    const createdAt = load.createdAt || load.postedAt || load.timestamp || new Date().toISOString();
    const supplierId = load.supplierId || load.postedBy || load.supplier_id || '';
    const supplierName = load.supplierName || load.companyName || load.supplierCompanyName || load.supplierEmail || '';

    const market = {
      loadId,
      status,
      pickupLocation: pickup,
      deliveryLocation: delivery,
      cargoType: load.cargoType || load.cargo_type || '',
      cargoWeight: load.weight || load.cargoWeight || load.cargo_weight || '',
      vehicleType: load.vehicleType || load.vehicle_type || '',
      pickupDate: load.pickupDate || load.pickup_date || '',
      deliveryDate: load.deliveryDate || load.delivery_date || '',
      price,
      urgent: !!load.urgent,
      supplierId,
      supplierName,
      createdAt
    };

    try {
      await marketRef.set(market);
    } catch (e) {}
    return null;
  });

exports.processNotificationQueue = functions.database
  .ref('notificationQueue/{eventId}')
  .onCreate(async (snap, context) => {
    const ev = snap.val() || {};
    const toUserType = String(ev.toUserType || ev.userType || '').toLowerCase();
    const toUserId = String(ev.toUserId || ev.userId || '');
    const senderUid = String(ev.senderUid || '');
    const createdAt = ev.createdAt || new Date().toISOString();

    if (!toUserId || (toUserType !== 'supplier' && toUserType !== 'carrier') || !senderUid) {
      try {
        await snap.ref.update({ processed: false, rejected: true, processedAt: new Date().toISOString() });
      } catch (e) {}
      return null;
    }

    const notif = {
      title: ev.title || 'Alpha Freight',
      message: ev.message || 'You have a new notification',
      type: ev.type || 'system',
      data: ev.data || {},
      read: false,
      createdAt: createdAt,
      senderUid: senderUid
    };

    const listRef = toUserType === 'supplier'
      ? `notifications/suppliers/${toUserId}`
      : `notifications/carriers/${toUserId}`;

    async function sendPushIfPossible() {
      try {
        const profileRef = toUserType === 'supplier'
          ? admin.database().ref(`suppliers/${toUserId}/fcmToken/token`)
          : admin.database().ref(`carriers/${toUserId}/fcmToken/token`);
        const tokenSnap = await profileRef.once('value');
        const token = tokenSnap.exists() ? String(tokenSnap.val() || '') : '';
        if (!token) return false;

        const data = Object.assign({}, (notif.data || {}), {
          type: String(notif.type || 'system'),
          userType: toUserType,
          userId: toUserId
        });
        if (!data.url && ev.data && ev.data.url) data.url = String(ev.data.url);

        const payload = {
          notification: {
            title: String(notif.title || 'Alpha Freight'),
            body: String(notif.message || 'You have a new notification')
          },
          data: Object.fromEntries(
            Object.entries(data).map(([k, v]) => [String(k), v === null || v === undefined ? '' : String(v)])
          )
        };

        await admin.messaging().sendToDevice(token, payload, {
          priority: 'high'
        });
        return true;
      } catch (e) {
        return false;
      }
    }

    try {
      await admin.database().ref(listRef).push(notif);
      const pushed = await sendPushIfPossible();
      await snap.ref.update({ processed: true, processedAt: new Date().toISOString(), pushSent: !!pushed });
    } catch (e) {
      try {
        await snap.ref.update({ processed: false, processedAt: new Date().toISOString(), error: String(e && e.message ? e.message : e) });
      } catch (e2) {}
    }
    return null;
  });

exports.onLoadPaidAccounting = functions.database
  .ref('loads/{loadId}/paymentStatus/status')
  .onWrite(async (change, context) => {
    const before = String(change.before.val() || '').toLowerCase();
    const after = String(change.after.val() || '').toLowerCase();
    if (after !== 'paid' || before === 'paid') return null;

    const loadId = String(context.params.loadId || '');
    if (!loadId) return null;

    const loadRef = change.after.ref.parent && change.after.ref.parent.parent
      ? change.after.ref.parent.parent
      : admin.database().ref(`loads/${loadId}`);

    let load = {};
    try {
      const loadSnap = await loadRef.once('value');
      load = loadSnap.val() || {};
    } catch (e) {
      return null;
    }

    let carrierId = String(load.carrierId || load.assignedCarrier || '');
    const carrierFirebaseUid = String(load.carrierFirebaseUid || '');
    if (carrierFirebaseUid) {
      let carrierOk = false;
      if (carrierId) {
        try {
          const cSnap = await admin.database().ref(`carriers/${carrierId}`).once('value');
          carrierOk = cSnap.exists();
        } catch (e) { carrierOk = false; }
      }
      if (!carrierOk) {
        try {
          const prof = await findProfileByUid('carrier', carrierFirebaseUid);
          if (prof && prof.key) carrierId = String(prof.key);
        } catch (e) {}
      }
    }
    if (!carrierId) return null;

    const nowIso = new Date().toISOString();
    const now = new Date();
    const year = now.getFullYear();

    let invoiceNumber = String(load.invoiceNumber || '');
    let invoiceSequence = load.invoiceSequence || null;
    if (!invoiceNumber) {
      try {
        const counterRef = admin.database().ref(`counters/invoices/${year}`);
        const txn = await counterRef.transaction((cur) => (cur || 0) + 1);
        if (txn && txn.committed) {
          invoiceSequence = txn.snapshot && txn.snapshot.val ? txn.snapshot.val() : null;
          const seq = Number(invoiceSequence || 0) || 0;
          invoiceNumber = `INV-${year}-${String(seq).padStart(6, '0')}`;
          try {
            await loadRef.update({
              invoiceNumber,
              invoiceSequence: seq,
              invoiceYear: year,
              invoiceGeneratedAt: nowIso
            });
          } catch (e2) {}
        }
      } catch (e) {}
    }

    try {
      const ledgerKey = `load_${loadId}`;
      const ledgerRef = admin.database().ref(`walletLedger/${carrierId}/${ledgerKey}`);
      const ledgerSnap = await ledgerRef.once('value');
      if (!ledgerSnap.exists()) {
        const existingNet = typeof load.carrierNetAmount === 'number'
          ? load.carrierNetAmount
          : parseFloat(load.carrierNetAmount);
        const base = parseFloat(load.commissionBaseAmount || load.price || load.budget || load.maxBudget || load.totalAmount || 0) || 0;
        const commission = parseFloat(load.supplierCommission || load.carrierCommissionAmount || 0) || 0;
        const net = Number.isFinite(existingNet) ? existingNet : Math.round((base - commission) * 100) / 100;
        const pickup = load.pickupLocation || load.pickup_location || '';
        const delivery = load.deliveryLocation || load.delivery_location || '';
        const route = `${pickup} → ${delivery}`.trim();
        const orderRef = load.formattedOrderId || load.orderRef || (`ORD-${String(loadId).substring(0, 8).toUpperCase()}`);

        await ledgerRef.set({
          type: 'earning',
          loadId: loadId,
          orderRef: orderRef,
          route: route,
          amountNet: net,
          status: 'available',
          invoiceNumber: invoiceNumber || null,
          carrierFirebaseUid: carrierFirebaseUid || null,
          createdAt: nowIso
        });
      }
    } catch (e) {}

    return null;
  });

const cors = require('cors')({ origin: true });

function setCors(req, res) {
  const origin = req.get('Origin') || '*';
  res.set('Access-Control-Allow-Origin', origin);
  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.set('Access-Control-Max-Age', '3600');
}

async function getUidFromAuth(req) {
  try {
    const header = String(req.get('Authorization') || '');
    const m = header.match(/^Bearer\s+(.+)$/i);
    if (!m) return null;
    const decoded = await admin.auth().verifyIdToken(m[1]);
    return decoded && decoded.uid ? decoded.uid : null;
  } catch (e) {
    return null;
  }
}


async function findProfileByUid(role, uid) {
  const node = role === 'carrier' ? 'carriers' : 'suppliers';
  const snap = await admin.database().ref(node).orderByChild('firebaseUid').equalTo(uid).limitToFirst(1).once('value');
  let found = null;
  if (snap && snap.exists()) {
    snap.forEach((c) => {
      found = { key: c.key, val: c.val() || {} };
    });
  }
  return found;
}

exports.twoFAStatus = functions.https.onRequest((req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  
  cors(req, res, async () => {
    if (req.method !== 'GET') return res.status(405).json({ error: { message: 'Method not allowed' } });
    const role = String(req.query.role || 'supplier');
    const uid = await getUidFromAuth(req);
    if (!uid) return res.status(401).json({ error: { message: 'Unauthorized' } });
    try {
      const profile = await findProfileByUid(role, uid);
      const twoFA = profile && profile.val ? (profile.val.twoFA || {}) : {};
      const enabled = !!twoFA.enabled;
      const verified = !!twoFA.verified;
      return res.json({ enabled, verified, enforce: enabled && verified });
    } catch (e) {
      return res.json({ enabled: false, verified: false, enforce: false });
    }
  });
});

exports.twoFAStatusPublic = onRequest({ cors: true, invoker: 'public' }, async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: { message: 'Method not allowed' } });
  const role = String(req.query.role || 'supplier');
  const uid = await getUidFromAuth(req);
  if (!uid) return res.status(401).json({ error: { message: 'Unauthorized' } });
  try {
    const profile = await findProfileByUid(role, uid);
    const twoFA = profile && profile.val ? (profile.val.twoFA || {}) : {};
    const enabled = !!twoFA.enabled;
    const verified = !!twoFA.verified;
    return res.json({ enabled, verified, enforce: enabled && verified });
  } catch (e) {
    return res.json({ enabled: false, verified: false, enforce: false });
  }
});

exports.twoFASetup = functions.https.onRequest((req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).send('');

  cors(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).json({ error: { message: 'Method not allowed' } });
    const role = String((req.body && req.body.role) || 'supplier');
    const uid = await getUidFromAuth(req);
    if (!uid) return res.status(401).json({ error: { message: 'Unauthorized' } });
    try {
      const profile = await findProfileByUid(role, uid);
      if (!profile || !profile.key) return res.status(404).json({ error: { message: 'Profile not found' } });
      const email = String(profile.val.email || '');
      const secret = speakeasy.generateSecret({ length: 20, name: `Alpha Freight (${email || uid})` });
      await admin.database().ref(`twoFASecrets/${uid}`).set({
        secretBase32: secret.base32,
        createdAt: new Date().toISOString()
      });
      const node = role === 'carrier' ? 'carriers' : 'suppliers';
      await admin.database().ref(`${node}/${profile.key}/twoFA`).set({
        enabled: true,
        verified: false,
        updatedAt: new Date().toISOString()
      });
      const qr = await QRCode.toDataURL(secret.otpauth_url);
      return res.json({ qr, secretBase32: secret.base32 });
    } catch (e) {
      return res.status(500).json({ error: { message: 'Setup failed' } });
    }
  });
});

exports.twoFASetupPublic = onRequest({ cors: true, invoker: 'public' }, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: { message: 'Method not allowed' } });
  const role = String((req.body && req.body.role) || 'supplier');
  const uid = await getUidFromAuth(req);
  if (!uid) return res.status(401).json({ error: { message: 'Unauthorized' } });
  try {
    const profile = await findProfileByUid(role, uid);
    if (!profile || !profile.key) return res.status(404).json({ error: { message: 'Profile not found' } });
    const email = String(profile.val.email || '');
    const secret = speakeasy.generateSecret({ length: 20, name: `Alpha Freight (${email || uid})` });
    await admin.database().ref(`twoFASecrets/${uid}`).set({
      secretBase32: secret.base32,
      createdAt: new Date().toISOString()
    });
    const node = role === 'carrier' ? 'carriers' : 'suppliers';
    await admin.database().ref(`${node}/${profile.key}/twoFA`).set({
      enabled: true,
      verified: false,
      updatedAt: new Date().toISOString()
    });
    const qr = await QRCode.toDataURL(secret.otpauth_url);
    return res.json({ qr, secretBase32: secret.base32 });
  } catch (e) {
    return res.status(500).json({ error: { message: 'Setup failed' } });
  }
});

exports.twoFAVerify = functions.https.onRequest((req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).send('');

  cors(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).json({ error: { message: 'Method not allowed' } });
    const role = String((req.body && req.body.role) || 'supplier');
    const token = String((req.body && req.body.token) || '');
    const uid = await getUidFromAuth(req);
    if (!uid) return res.status(401).json({ error: { message: 'Unauthorized' } });
    if (!/^\d{6}$/.test(token)) return res.status(400).json({ error: { message: 'Invalid code' } });
    try {
      const profile = await findProfileByUid(role, uid);
      if (!profile || !profile.key) return res.status(404).json({ error: { message: 'Profile not found' } });
      const secretSnap = await admin.database().ref(`twoFASecrets/${uid}/secretBase32`).once('value');
      const secret = String(secretSnap.val() || '');
      if (!secret) return res.status(400).json({ error: { message: '2FA not set up' } });
      const ok = speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });
      if (!ok) return res.status(400).json({ error: { message: 'Invalid code' } });
      const node = role === 'carrier' ? 'carriers' : 'suppliers';
      await admin.database().ref(`${node}/${profile.key}/twoFA`).update({
        enabled: true,
        verified: true,
        lastVerifiedAt: new Date().toISOString()
      });
      return res.json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: { message: 'Verification failed' } });
    }
  });
});

exports.twoFAVerifyPublic = onRequest({ cors: true, invoker: 'public' }, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: { message: 'Method not allowed' } });
  const role = String((req.body && req.body.role) || 'supplier');
  const token = String((req.body && req.body.token) || '');
  const uid = await getUidFromAuth(req);
  if (!uid) return res.status(401).json({ error: { message: 'Unauthorized' } });
  if (!/^\d{6}$/.test(token)) return res.status(400).json({ error: { message: 'Invalid code' } });
  try {
    const profile = await findProfileByUid(role, uid);
    if (!profile || !profile.key) return res.status(404).json({ error: { message: 'Profile not found' } });
    const secretSnap = await admin.database().ref(`twoFASecrets/${uid}/secretBase32`).once('value');
    const secret = String(secretSnap.val() || '');
    if (!secret) return res.status(400).json({ error: { message: '2FA not set up' } });
    const ok = speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });
    if (!ok) return res.status(400).json({ error: { message: 'Invalid code' } });
    const node = role === 'carrier' ? 'carriers' : 'suppliers';
    await admin.database().ref(`${node}/${profile.key}/twoFA`).update({
      enabled: true,
      verified: true,
      lastVerifiedAt: new Date().toISOString()
    });
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: { message: 'Verification failed' } });
  }
});

exports.twoFADisable = functions.https.onRequest((req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).send('');

  cors(req, res, async () => {
    if (req.method !== 'POST') return res.status(405).json({ error: { message: 'Method not allowed' } });
    const role = String((req.body && req.body.role) || 'supplier');
    const token = String((req.body && req.body.token) || '');
    const uid = await getUidFromAuth(req);
    if (!uid) return res.status(401).json({ error: { message: 'Unauthorized' } });
    if (!/^\d{6}$/.test(token)) return res.status(400).json({ error: { message: 'Invalid code' } });
    try {
      const profile = await findProfileByUid(role, uid);
      if (!profile || !profile.key) return res.status(404).json({ error: { message: 'Profile not found' } });
      const secretSnap = await admin.database().ref(`twoFASecrets/${uid}/secretBase32`).once('value');
      const secret = String(secretSnap.val() || '');
      if (!secret) return res.status(400).json({ error: { message: '2FA not set up' } });
      const ok = speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });
      if (!ok) return res.status(400).json({ error: { message: 'Invalid code' } });
      const node = role === 'carrier' ? 'carriers' : 'suppliers';
      await admin.database().ref(`${node}/${profile.key}/twoFA`).set({
        enabled: false,
        verified: false,
        disabledAt: new Date().toISOString()
      });
      await admin.database().ref(`twoFASecrets/${uid}`).remove();
      return res.json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: { message: 'Disable failed' } });
    }
  });
});

exports.twoFADisablePublic = onRequest({ cors: true, invoker: 'public' }, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: { message: 'Method not allowed' } });
  const role = String((req.body && req.body.role) || 'supplier');
  const token = String((req.body && req.body.token) || '');
  const uid = await getUidFromAuth(req);
  if (!uid) return res.status(401).json({ error: { message: 'Unauthorized' } });
  if (!/^\d{6}$/.test(token)) return res.status(400).json({ error: { message: 'Invalid code' } });
  try {
    const profile = await findProfileByUid(role, uid);
    if (!profile || !profile.key) return res.status(404).json({ error: { message: 'Profile not found' } });
    const secretSnap = await admin.database().ref(`twoFASecrets/${uid}/secretBase32`).once('value');
    const secret = String(secretSnap.val() || '');
    if (!secret) return res.status(400).json({ error: { message: '2FA not set up' } });
    const ok = speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });
    if (!ok) return res.status(400).json({ error: { message: 'Invalid code' } });
    const node = role === 'carrier' ? 'carriers' : 'suppliers';
    await admin.database().ref(`${node}/${profile.key}/twoFA`).set({
      enabled: false,
      verified: false,
      disabledAt: new Date().toISOString()
    });
    await admin.database().ref(`twoFASecrets/${uid}`).remove();
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: { message: 'Disable failed' } });
  }
});

// Force redeploy - fixing CORS issue 3

