/**
 * AdGuard: Anti-Popunder & Click-Hijack Shield
 * Protects users on mobile and desktop from intrusive pop-ups, multi-tab spam,
 * and invisible click overlays injected by third-party ad networks.
 */
(function() {
  'use strict';

  // 1. Whitelist of permitted popup/navigation destinations (user sharing & site only)
  const ALLOWED_POPUP_HOSTS = [
    'twitter.com',
    'x.com',
    'api.whatsapp.com',
    'wa.me',
    'facebook.com',
    't.me',
    'messistat.com',
    'localhost'
  ];

  function isAllowedUrl(url) {
    if (!url) return false;
    const str = String(url).toLowerCase();
    return ALLOWED_POPUP_HOSTS.some(host => str.includes(host));
  }

  // 2. Intercept window.open to block rogue popunders and tab spam
  const originalWindowOpen = window.open;
  window.open = function(url, target, features) {
    if (isAllowedUrl(url)) {
      return originalWindowOpen.call(window, url, target, features);
    }
    console.warn('[AdGuard] Blocked unauthorized pop-up / tab spam:', url);
    return null;
  };

  // 3. Intercept programmatic HTMLAnchorElement.prototype.click
  const originalAnchorClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function() {
    const href = this.href || '';
    if (href && !isAllowedUrl(href)) {
      const isInsideAd = this.closest('.ad-native-slot, .ad-native-wrap, [id^="container-"]');
      if (!isInsideAd || this.style.opacity === '0' || this.style.display === 'none' || this.getAttribute('target') === '_blank') {
        const isUserTrusted = typeof event !== 'undefined' && event && event.isTrusted;
        if (!isUserTrusted && !isInsideAd) {
          console.warn('[AdGuard] Blocked programmatic anchor click hijack:', href);
          return;
        }
      }
    }
    return originalAnchorClick.apply(this, arguments);
  };

  // 4. Destroy invisible full-screen click overlays
  function cleanRogueOverlays() {
    try {
      const elements = document.querySelectorAll('body > div, body > a, body > span, body > iframe');
      const vw = window.innerWidth || document.documentElement.clientWidth;
      const vh = window.innerHeight || document.documentElement.clientHeight;

      elements.forEach(el => {
        if (el.id === 'bday-card-modal' || el.id === 'bday-embed-modal' || el.id === 'banner' || el.classList.contains('page') || el.classList.contains('rail')) {
          return;
        }
        const style = window.getComputedStyle(el);
        const isFixedOrAbs = style.position === 'fixed' || style.position === 'absolute';
        const zIndex = parseInt(style.zIndex, 10) || 0;
        const rect = el.getBoundingClientRect();

        const coversScreen = (rect.width >= vw * 0.7 && rect.height >= vh * 0.7);
        const isInvisible = (style.opacity === '0' || style.visibility === 'hidden' || style.backgroundColor.includes('rgba(0, 0, 0, 0)'));

        if (isFixedOrAbs && zIndex > 999 && coversScreen && isInvisible) {
          console.warn('[AdGuard] Removed invisible click-hijack overlay:', el);
          el.remove();
        }
      });
    } catch (err) {}
  }

  // 5. Watch for dynamically injected overlay nodes
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(mutations => {
      let needsClean = false;
      for (const m of mutations) {
        if (m.addedNodes.length > 0) {
          needsClean = true;
          break;
        }
      }
      if (needsClean) cleanRogueOverlays();
    });

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: false });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        if (document.body) {
          observer.observe(document.body, { childList: true, subtree: false });
        }
      });
    }
  }

  // Periodically check in first few seconds after load
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      cleanRogueOverlays();
      setTimeout(cleanRogueOverlays, 1000);
      setTimeout(cleanRogueOverlays, 3000);
    });
  }
})();
