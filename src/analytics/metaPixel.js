/**
 * Meta Pixel (Facebook Pixel) Dynamic Loader & Event Service (Fail-Safe)
 */

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;
const IS_ENABLED = import.meta.env.VITE_ANALYTICS_ENABLED !== 'false';

let isPixelInitialized = false;

/**
 * Initializes Meta Pixel snippet asynchronously.
 */
export const initMetaPixel = () => {
  try {
    if (!IS_ENABLED || !PIXEL_ID || isPixelInitialized || typeof window === 'undefined') {
      return;
    }

    /* eslint-disable */
    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      if (s && s.parentNode) {
        s.parentNode.insertBefore(t, s);
      } else if (b.head) {
        b.head.appendChild(t);
      }
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */

    if (window.fbq) {
      window.fbq('init', PIXEL_ID);
      isPixelInitialized = true;
    }
  } catch (err) {
    console.error('[Meta Pixel Init Error]', err);
  }
};

/**
 * Tracks a standard Meta Pixel event with optional eventID for Meta CAPI deduplication.
 */
export const trackPixel = (eventName, payload = {}, eventId = null) => {
  try {
    if (typeof window === 'undefined' || !window.fbq) return;

    const options = eventId ? { eventID: eventId } : undefined;

    if (options) {
      window.fbq('track', eventName, payload, options);
    } else if (Object.keys(payload).length > 0) {
      window.fbq('track', eventName, payload);
    } else {
      window.fbq('track', eventName);
    }

    if (import.meta.env.DEV) {
      console.log('[Meta Pixel Track]', { eventName, payload, options });
    }
  } catch (err) {
    console.error('[Meta Pixel Track Error]', err);
  }
};

/**
 * Tracks a custom Meta Pixel event.
 */
export const trackCustomPixel = (customEventName, payload = {}, eventId = null) => {
  try {
    if (typeof window === 'undefined' || !window.fbq) return;

    const options = eventId ? { eventID: eventId } : undefined;

    if (options) {
      window.fbq('trackCustom', customEventName, payload, options);
    } else if (Object.keys(payload).length > 0) {
      window.fbq('trackCustom', customEventName, payload);
    } else {
      window.fbq('trackCustom', customEventName);
    }

    if (import.meta.env.DEV) {
      console.log('[Meta Custom Pixel Track]', { customEventName, payload, options });
    }
  } catch (err) {
    console.error('[Meta Custom Pixel Track Error]', err);
  }
};
