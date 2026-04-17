/**
 * Footer fix: app band/reopen pe layout kharab – pehle footer force-reapply, phir reload.
 * Infinix (XOS) jaisi devices pe footer bottom: 0 – viewport already nav bar ke upar hota hai.
 */
(function () {
  var loadTime = Date.now();
  var isBottomZero = /Infinix|XOS|TECNO|itel/i.test(navigator.userAgent);
  var noReloadPath = /\/pod\.html(\?|$)/i.test(String(window.location && window.location.pathname ? window.location.pathname : ''));
  var textFixScheduled = false;

  function hasBottomNavPage() {
    try {
      return !!(document && document.body && document.body.classList && document.body.classList.contains('has-bottom-nav'));
    } catch (e) {}
    return false;
  }

  function isReloadDisabled() {
    try {
      if (noReloadPath) return true;
      if (window && window.__AB_DISABLE_RESUME_RELOAD__) return true;
      var el = document && document.documentElement;
      if (el && el.getAttribute && (el.getAttribute('data-no-resume-reload') === '1' || el.getAttribute('data-no-resume-reload') === 'true')) return true;
    } catch (e) {}
    return false;
  }

  if (isBottomZero) {
    document.documentElement.classList.add('footer-bottom-zero');
    var style = document.createElement('style');
    style.textContent = 'html.footer-bottom-zero .bottom-nav, html.footer-bottom-zero .footer { bottom: 0 !important; } html.footer-bottom-zero body.has-bottom-nav { padding-bottom: 80px !important; }';
    (document.head || document.documentElement).appendChild(style);
  }

  function getFooterBottom() {
    return '0px';
  }

  function fixFooterInPlace() {
    if (!hasBottomNavPage()) return;
    var nav = document.querySelector('.bottom-nav') || document.querySelector('.footer');
    if (nav) {
      nav.style.position = 'fixed';
      nav.style.bottom = getFooterBottom();
      nav.style.left = '0';
      nav.style.right = '0';
      nav.style.width = '100%';
      nav.style.display = 'flex';
      nav.style.justifyContent = 'space-around';
      nav.style.alignItems = 'center';
      nav.style.zIndex = '1000';
      nav.style.background = '#fff';
      nav.style.margin = '0';
      nav.offsetHeight;
    }
  }

  function doReload() {
    if (!hasBottomNavPage()) return;
    if (isReloadDisabled()) return;
    window.location.reload();
  }

  function normalizeMojibakeString(input) {
    var s = String(input || '');
    if (!s) return s;

    var fast = s.replace(/Â£/g, '£')
      .replace(/Â°/g, '°')
      .replace(/mÂ³/g, 'm³')
      .replace(/â€“/g, '–')
      .replace(/â€”/g, '—')
      .replace(/â€˜/g, '‘')
      .replace(/â€™/g, '’')
      .replace(/â€œ/g, '“')
      .replace(/â€�/g, '”')
      .replace(/â€¦/g, '…')
      .replace(/â€¢/g, '•')
      .replace(/â†’/g, '→')
      .replace(/â€‘/g, '‑')
      .replace(/Â /g, ' ');

    if (!/[ÃÂâÐðŸ]/.test(fast)) return fast;

    function cp1252Byte(code) {
      switch (code) {
        case 0x20AC: return 0x80;
        case 0x201A: return 0x82;
        case 0x0192: return 0x83;
        case 0x201E: return 0x84;
        case 0x2026: return 0x85;
        case 0x2020: return 0x86;
        case 0x2021: return 0x87;
        case 0x02C6: return 0x88;
        case 0x2030: return 0x89;
        case 0x0160: return 0x8A;
        case 0x2039: return 0x8B;
        case 0x0152: return 0x8C;
        case 0x017D: return 0x8E;
        case 0x2018: return 0x91;
        case 0x2019: return 0x92;
        case 0x201C: return 0x93;
        case 0x201D: return 0x94;
        case 0x2022: return 0x95;
        case 0x2013: return 0x96;
        case 0x2014: return 0x97;
        case 0x02DC: return 0x98;
        case 0x2122: return 0x99;
        case 0x0161: return 0x9A;
        case 0x203A: return 0x9B;
        case 0x0153: return 0x9C;
        case 0x017E: return 0x9E;
        case 0x0178: return 0x9F;
        default: return -1;
      }
    }

    try {
      if (!window.TextDecoder) return fast;
      var bytes = new Uint8Array(fast.length);
      for (var j = 0; j < fast.length; j++) {
        var code = fast.charCodeAt(j);
        if (code <= 0xFF) {
          bytes[j] = code;
        } else {
          var b = cp1252Byte(code);
          if (b < 0) return fast;
          bytes[j] = b;
        }
      }
      var decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      if (!decoded) return fast;
      var before = (fast.match(/[ÃÂâÐðŸ]/g) || []).length;
      var after = (decoded.match(/[ÃÂâÐðŸ]/g) || []).length;
      if (after <= before) return decoded;
    } catch (e) {}
    return fast;
  }

  function fixTextNodesAndAttrs(root) {
    try {
      if (!root || !document || !document.createTreeWalker) return;
      var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
      var node;
      while ((node = walker.nextNode())) {
        var p = node.parentNode;
        if (!p || !p.nodeName) continue;
        var tn = String(p.nodeName).toUpperCase();
        if (tn === 'SCRIPT' || tn === 'STYLE') continue;
        var v = node.nodeValue;
        if (!v) continue;
        if (!/[ÃÂâÐðŸ]/.test(v)) continue;
        var fixed = normalizeMojibakeString(v);
        if (fixed !== v) node.nodeValue = fixed;
      }

      var els = root.querySelectorAll ? root.querySelectorAll('*') : [];
      var attrs = ['placeholder', 'title', 'aria-label', 'aria-placeholder', 'alt'];
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        for (var k = 0; k < attrs.length; k++) {
          var a = attrs[k];
          var cur = el.getAttribute && el.getAttribute(a);
          if (!cur || !/[ÃÂâÐðŸ]/.test(cur)) continue;
          var fx = normalizeMojibakeString(cur);
          if (fx !== cur) el.setAttribute(a, fx);
        }
      }

      var active = null;
      try { active = document.activeElement; } catch (e) {}
      var fields = root.querySelectorAll ? root.querySelectorAll('input, textarea') : [];
      for (var f = 0; f < fields.length; f++) {
        var field = fields[f];
        if (!field || field === active) continue;
        var type = '';
        try { type = String(field.getAttribute('type') || field.type || '').toLowerCase(); } catch (e) {}
        if (type === 'password') continue;
        var val = field.value;
        if (!val) continue;
        if (!/[ÃÂâÐðŸ]/.test(val)) continue;
        var vfx = normalizeMojibakeString(val);
        if (vfx !== val) field.value = vfx;
      }
    } catch (e) {}
  }

  function scheduleTextFix() {
    if (textFixScheduled) return;
    textFixScheduled = true;
    var run = function () {
      textFixScheduled = false;
      fixTextNodesAndAttrs(document.body || document.documentElement);
    };
    if (window.requestAnimationFrame) window.requestAnimationFrame(run);
    else setTimeout(run, 16);
  }

  window.__appResume = function () {
    fixFooterInPlace();
    scheduleTextFix();
    if (Date.now() - loadTime > 2500) doReload();
  };

  window.addEventListener('appResume', window.__appResume);

  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      fixFooterInPlace();
      scheduleTextFix();
      doReload();
    }
  });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      fixFooterInPlace();
      scheduleTextFix();
      var t = parseInt(sessionStorage.getItem('_hiddenAt') || '0', 10);
      if (t && Date.now() - t > 800) doReload();
      sessionStorage.removeItem('_hiddenAt');
    } else {
      sessionStorage.setItem('_hiddenAt', String(Date.now()));
    }
  });

  if (window.Capacitor?.Plugins?.App) {
    var wasBackground = false;
    window.Capacitor.Plugins.App.addListener('appStateChange', function (state) {
      if (wasBackground && state.isActive) {
        fixFooterInPlace();
        scheduleTextFix();
        doReload();
      }
      wasBackground = !state.isActive;
    });
  }

  if (document && document.addEventListener) {
    document.addEventListener('DOMContentLoaded', function () {
      fixFooterInPlace();
      scheduleTextFix();
      try {
        var mo = new MutationObserver(function () { scheduleTextFix(); });
        mo.observe(document.body || document.documentElement, { childList: true, subtree: true, characterData: true });
      } catch (e) {}
    });
  }

  try {
    document.addEventListener('blur', function (e) {
      var t = e && e.target;
      if (!t) return;
      var tag = '';
      try { tag = String(t.tagName || '').toUpperCase(); } catch (err) {}
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') return;
      var type = '';
      try { type = String(t.getAttribute('type') || t.type || '').toLowerCase(); } catch (err2) {}
      if (type === 'password') return;
      var val = t.value;
      if (!val || !/[ÃÂâÐðŸ]/.test(val)) return;
      var fixed = normalizeMojibakeString(val);
      if (fixed !== val) t.value = fixed;
    }, true);
  } catch (e) {}

  try {
    if (document && document.readyState && document.readyState !== 'loading') {
      fixFooterInPlace();
      scheduleTextFix();
    }
  } catch (e) {}
})();
