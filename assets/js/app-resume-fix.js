/**
 * Footer fix: app band/reopen pe layout kharab – pehle footer force-reapply, phir reload.
 * Infinix (XOS) jaisi devices pe footer bottom: 0 – viewport already nav bar ke upar hota hai.
 */
(function () {
  var loadTime = Date.now();
  var isBottomZero = /Infinix|XOS|TECNO|itel/i.test(navigator.userAgent);
  var noReloadPath = /\/pod\.html(\?|$)/i.test(String(window.location && window.location.pathname ? window.location.pathname : ''));

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
    return isBottomZero ? '0' : '48px';
  }

  function fixFooterInPlace() {
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
    if (isReloadDisabled()) return;
    window.location.reload();
  }

  window.__appResume = function () {
    fixFooterInPlace();
    if (Date.now() - loadTime > 2500) doReload();
  };

  window.addEventListener('appResume', window.__appResume);

  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      fixFooterInPlace();
      doReload();
    }
  });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      fixFooterInPlace();
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
        doReload();
      }
      wasBackground = !state.isActive;
    });
  }
})();
