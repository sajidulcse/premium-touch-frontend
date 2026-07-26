/**
 * Google Tag Manager (GTM) Dynamic Loader & DataLayer Service (Fail-Safe)
 */

const GTM_ID = import.meta.env.VITE_GTM_ID;
const IS_ENABLED = import.meta.env.VITE_ANALYTICS_ENABLED !== 'false';

let isGtmInitialized = false;

/**
 * Initializes Google Tag Manager asynchronously without blocking render/Core Web Vitals.
 */
export const initGTM = (dynamicId = null, dynamicEnabled = null) => {
  try {
    const gtmId = dynamicId !== null ? dynamicId : GTM_ID;
    const isEnabled = dynamicEnabled !== null ? dynamicEnabled : IS_ENABLED;

    if (!isEnabled || !gtmId || isGtmInitialized || typeof window === 'undefined') {
      return;
    }

    // Ensure window.dataLayer exists
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js'
    });

    // Inject GTM script tag asynchronously
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
    
    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else if (document.head) {
      document.head.appendChild(script);
    }

    isGtmInitialized = true;
  } catch (err) {
    console.error('[GTM Init Error]', err);
  }
};

/**
 * Safely pushes an event object into GTM dataLayer.
 * @param {Object} payload 
 */
export const pushToDataLayer = (payload) => {
  try {
    if (typeof window === 'undefined') return;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
    
    if (import.meta.env.DEV) {
      console.log('[GTM DataLayer Event]', payload);
    }
  } catch (err) {
    console.error('[GTM DataLayer Push Error]', err);
  }
};
