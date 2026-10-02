/**
 * AdGuard: Anti-Popunder & Click-Hijack Shield
 *
 * Runs BEFORE any ad network script on every page (it is the first <script> in
 * <head>), so the wrappers below are installed in time to intercept the way
 * these networks actually hijack a visitor:
 *
 *   1. window.open()            - the classic "open an ad in a new tab"
 *   2. anchor.click()           - synthetic clicks on injected <a> elements
 *   3. iframe top-navigation    - a hidden iframe that grabs window.top on the
 *                                 visitor's next tap (this is what makes a
 *                                 phone redirect the instant you touch anything)
 *   4. beforeunload             - "open an ad when the user leaves the page"
 *   5. location.assign/replace  - direct top-level navigation to an ad URL
 *   6. injected click overlays  - transparent full-screen link hijacks
 *
 * Ad creatives themselves are explicitly ALLOWED to render. Frames belonging to
 * the ad networks are sandboxed WITHOUT allow-top-navigation, which stops them
 * navigating the page while leaving the creative itself fully functional.
 */
(function() {
  'use strict';

  // 1. Hosts we are willing to let open a window or become the top page.
  const ALLOWED_POPUP_HOSTS = [
    'twitter.com',
    'x.com',
    'api.whatsapp.com',
    'wa.me',
    'facebook.com',
    't.me',
    'youtube.com',
    'youtu.be',
    'messistat.com',
    'localhost'
  ];

  // Known popunder / forced-redirect networks. Used for detection + logging so a
  // new one is obvious instead of silent. Blocking is host-agnostic (everything
  // off-site is blocked above), this list is just evidence.
  const KNOWN_POPUNDER_HOSTS = [
    'highrevenueformat.com',
    'profitableratecpmnetwork.com',
    'adsterra.com',
    'propellerads.com',
    'hilltopads.net',
    'clickadu.com',
    'popads.net',
    'exoclick.com',
    'onclickads.net'
  ];

  function hostOf(url) {
    if (!url) return '';
    try { return new URL(String(url), location.href).hostname.toLowerCase(); }
    catch (_) { return String(url).toLowerCase(); }
  }

  function isAllowedUrl(url) {
    const host = hostOf(url);
    if (!host) return false;
    return ALLOWED_POPUP_HOSTS.some((h) => host === h || host.endsWith('.' + h));
  }

  function describe(url) {
    const host = hostOf(url);
    return KNOWN_POPUNDER_HOSTS.some((h) => host.includes(h))
      ? 'known popunder network'
      : 'off-site';
  }

  // True only for a genuine user gesture, not a synthetic dispatchEvent.
  function fromUserGesture(e) {
    return !!(e && e.isTrusted);
  }

  /* ---------------------------------------------------------------- 2. window.open */
  const nativeWindowOpen = window.open;
  window.open = function(url, target, features) {
    if (isAllowedUrl(url)) {
      return nativeWindowOpen.call(window, url, target, features);
    }
    // Only a real click on a real link may open a new tab off-site. A popup
    // fired from a timer, scroll or synthetic event never may.
    if (fromUserGesture(window.event)) {
      return nativeWindowOpen.call(window, url, target || '_blank', features);
    }
    console.warn('[AdGuard] blocked window.open ->', hostOf(url), '(' + describe(url) + ')');
    return null;
  };

  /* --------------------------------------------- 3. iframe top-navigation hijack */
  // A cross-origin iframe may navigate the top window when it holds user
  // activation - i.e. the visitor's next tap. Re-adding those tags to the ad
  // frames removes that ability without touching the creative.
  const FRAME_SANDBOX = 'allow-scripts allow-same-origin allow-popups-to-escape-sandbox';

  function sandboxFrame(frame) {
    if (!frame || frame.tagName !== 'IFRAME') return;
    if (frame.dataset.adGuardSealed === '1') return;
    const current = frame.getAttribute('sandbox');
    // Never strip a sandbox an author set deliberately.
    if (current && current !== 'allow-scripts allow-same-origin') return;
    frame.setAttribute('sandbox', FRAME_SANDBOX);
    frame.dataset.adGuardSealed = '1';
  }

  // Catch frames built with document.createElement, which is how the ad scripts
  // inject them.
  const nativeCreateElement = document.createElement.bind(document);
  document.createElement = function(tag, ...rest) {
    const el = nativeCreateElement(tag, ...rest);
    if (typeof tag === 'string' && tag.toLowerCase() === 'iframe') sandboxFrame(el);
    return el;
  };

  // ...and frames that arrive via innerHTML / insertAdjacentHTML / parsing.
  function sweepFrames(root) {
    if (!root || typeof root.querySelectorAll !== 'function') return;
    root.querySelectorAll('iframe').forEach(sandboxFrame);
  }

  /* ------------------------------------------------- 4. exit pop (beforeunload) */
  // Registered in the capture phase so it runs before the ad scripts' own
  // handlers and can stop them. This site never uses beforeunload itself.
  window.addEventListener('beforeunload', function(e) {
    e.stopImmediatePropagation();
    console.warn('[AdGuard] suppressed beforeunload exit-pop');
  }, true);

  /* -------------------------------------- 5. location.assign / replace redirects */
  try {
    const loc = window.location;
    const nativeAssign = loc.assign;
    const nativeReplace = loc.replace;
    Object.defineProperty(loc, 'assign', {
      configurable: true,
      writable: true,
      value: function(url) {
        if (isAllowedUrl(url)) return nativeAssign.call(loc, url);
        console.warn('[AdGuard] blocked location.assign ->', hostOf(url), '(' + describe(url) + ')');
      }
    });
    Object.defineProperty(loc, 'replace', {
      configurable: true,
      writable: true,
      value: function(url) {
        if (isAllowedUrl(url)) return nativeReplace.call(loc, url);
        console.warn('[AdGuard] blocked location.replace ->', hostOf(url), '(' + describe(url) + ')');
      }
    });
  } catch (err) {
    console.warn('[AdGuard] location hardening unavailable:', err && err.message);
  }

  /* ------------------------------------------- 6. synthetic anchor click hijack */
  const nativeAnchorClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function() {
    const href = this.href || '';
    if (href && !isAllowedUrl(href)) {
      const insideAd = this.closest(
        '.ad-native-slot, .ad-native-wrap, .ad-banner-slot, .ad-banner-wrap, [id^="container-"]'
      );
      if (!insideAd && !fromUserGesture(window.event)) {
        console.warn('[AdGuard] blocked synthetic anchor click ->', hostOf(href));
        return;
      }
    }
    return nativeAnchorClick.apply(this, arguments);
  };

  /* --------------------------------------------- 7. transparent click overlays */
  const OURS = '.page, .rail, .video-modal-backdrop, .messi-quiz-modal-backdrop, .ad-banner-wrap, .ad-native-wrap';

  function cleanRogueOverlays() {
    try {
      document.querySelectorAll('body > div, body > a, body > span, body > iframe').forEach((el) => {
        if (el.id === 'video-modal' || el.id === 'bday-embed-modal' || el.id === 'banner') return;
        if (el.closest(OURS)) return;
        const cs = getComputedStyle(el);
        if (cs.position !== 'fixed' && cs.position !== 'absolute') return;
        const z = parseInt(cs.zIndex, 10) || 0;
        if (z <= 999) return;
        const r = el.getBoundingClientRect();
        const vw = window.innerWidth || document.documentElement.clientWidth;
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const coversScreen = r.width >= vw * 0.7 && r.height >= vh * 0.7;
        const invisible =
          cs.opacity === '0' ||
          cs.visibility === 'hidden' ||
          cs.backgroundColor === 'rgba(0, 0, 0, 0)';
        // A big invisible click target sitting on top of the page.
        if (coversScreen && invisible) {
          console.warn('[AdGuard] removed invisible click-hijack overlay:', el);
          el.remove();
        }
      });
    } catch (err) { /* never let the guard throw */ }
  }

  /* --------------------------------------------------------------- wiring */
  function init() {
    sweepFrames(document);
    cleanRogueOverlays();

    if (typeof MutationObserver !== 'undefined') {
      const mo = new MutationObserver((muts) => {
        let dirty = false;
        for (const m of muts) {
          if (!m.addedNodes.length) continue;
          dirty = true;
          for (const node of m.addedNodes) {
            if (node && node.nodeType === 1) sweepFrames(node);
          }
        }
        if (dirty) cleanRogueOverlays();
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.body) init();
  else document.addEventListener('DOMContentLoaded', init, { once: true });

  window.addEventListener('load', () => {
    sweepFrames(document);
    cleanRogueOverlays();
    setTimeout(() => { sweepFrames(document); cleanRogueOverlays(); }, 1000);
    setTimeout(() => { sweepFrames(document); cleanRogueOverlays(); }, 3000);
  });

  /* --------------------------------- 8. sandboxed ad-frame auto-height */
  // The /ads/ native frames report their content height so the slot fits the
  // creative instead of clipping it. Accepted only from our own frames, as a
  // plain number inside a sane range. Banner frames are fixed-size and skip this.
  window.addEventListener('message', function (e) {
    try {
      const d = e.data;
      if (!d || typeof d.safeAdHeight !== 'number') return;
      if (e.origin !== 'null' && e.origin !== window.location.origin) return;
      const h = Math.round(d.safeAdHeight);
      if (!(h >= 60 && h <= 1400)) return;
      const frames = document.querySelectorAll('iframe.safe-ad-native');
      for (let i = 0; i < frames.length; i++) {
        if (frames[i].contentWindow === e.source) {
          frames[i].style.height = h + 'px';
        }
      }
    } catch (err) { /* never let the guard throw */ }
  });
})();