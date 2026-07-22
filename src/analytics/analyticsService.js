/**
 * Unified Analytics Facade (Fail-Safe)
 * Dispatches tracking events to GTM DataLayer and Meta Pixel seamlessly,
 * and handles Meta CAPI deduplication event_id generation.
 */

import { initGTM, pushToDataLayer } from './gtm';
import { initMetaPixel, trackPixel } from './metaPixel';
import { generateEventId } from './uuid';

/**
 * Initializes all client analytics scripts asynchronously.
 */
export const initAnalytics = () => {
  try {
    initGTM();
    initMetaPixel();
  } catch (err) {
    console.error('[Analytics Init Error]', err);
  }
};

/**
 * 1. SPA Page View Tracking
 */
export const trackPageView = (path, title = '') => {
  try {
    const pageTitle = title || (typeof document !== 'undefined' ? document.title : '');
    const pageLocation = typeof window !== 'undefined' ? window.location.href : '';

    // GTM DataLayer
    pushToDataLayer({
      event: 'page_view',
      page_path: path,
      page_title: pageTitle,
      page_location: pageLocation
    });

    // Meta Pixel
    trackPixel('PageView');
  } catch (err) {
    console.error('[Analytics PageView Error]', err);
  }
};

/**
 * 2. Consultation Form Submit Event (Conversion with Deduplication)
 * @returns {string} Unique eventId to submit to backend API for Meta CAPI
 */
export const trackConsultationSubmit = (formData = {}, existingEventId = null) => {
  const eventId = existingEventId || generateEventId('evt_consultation');

  try {
    const payload = {
      content_name: 'Consultation Request',
      category: formData.service_type || 'General Consultation',
      value: 0.00,
      currency: 'BDT'
    };

    pushToDataLayer({
      event: 'consultation_form_submit',
      event_id: eventId,
      form_name: 'Consultation Request',
      ...payload
    });

    trackPixel('Lead', payload, eventId);
  } catch (err) {
    console.error('[Analytics ConsultationSubmit Error]', err);
  }

  return eventId;
};

/**
 * 3. Cost Estimate Generated Event (Conversion with Deduplication)
 * @returns {string} Unique eventId to submit to backend API for Meta CAPI
 */
export const trackEstimateGenerated = (estimateData = {}, existingEventId = null) => {
  const eventId = existingEventId || generateEventId('evt_estimate');

  try {
    const payload = {
      content_name: 'Cost Estimate Generated',
      value: parseFloat(estimateData.grand_total || estimateData.total_cost || 0),
      currency: 'BDT',
      package_name: estimateData.package_name || '',
      rooms_count: estimateData.rooms_count || 0
    };

    pushToDataLayer({
      event: 'estimate_generated',
      event_id: eventId,
      ...payload
    });

    trackPixel('CustomizeProduct', payload, eventId);
  } catch (err) {
    console.error('[Analytics EstimateGenerated Error]', err);
  }

  return eventId;
};

/**
 * 4. WhatsApp Click Event
 */
export const trackWhatsAppClick = (source = 'floating_fab') => {
  try {
    pushToDataLayer({
      event: 'whatsapp_click',
      click_source: source
    });

    trackPixel('Contact', { channel: 'whatsapp', source });
  } catch (err) {
    console.error('[Analytics WhatsAppClick Error]', err);
  }
};

/**
 * 5. Phone Click Event
 */
export const trackPhoneClick = (source = 'contact_page', phoneNumber = '') => {
  try {
    pushToDataLayer({
      event: 'phone_click',
      click_source: source,
      phone_number: phoneNumber
    });

    trackPixel('Contact', { channel: 'phone', source });
  } catch (err) {
    console.error('[Analytics PhoneClick Error]', err);
  }
};

/**
 * 6. Email Click Event
 */
export const trackEmailClick = (source = 'contact_page', emailAddress = '') => {
  try {
    pushToDataLayer({
      event: 'email_click',
      click_source: source,
      email_address: emailAddress
    });

    trackPixel('Contact', { channel: 'email', source });
  } catch (err) {
    console.error('[Analytics EmailClick Error]', err);
  }
};

/**
 * 7. Messenger Click Event
 */
export const trackMessengerClick = (source = 'contact_page') => {
  try {
    pushToDataLayer({
      event: 'messenger_click',
      click_source: source
    });

    trackPixel('Contact', { channel: 'messenger', source });
  } catch (err) {
    console.error('[Analytics MessengerClick Error]', err);
  }
};

/**
 * 8. Portfolio Detail View Event
 */
export const trackPortfolioView = (portfolio = {}) => {
  try {
    const payload = {
      content_type: 'portfolio',
      content_ids: [portfolio.id || portfolio.slug],
      content_name: portfolio.title || portfolio.name,
      content_category: portfolio.category_name || portfolio.category?.name || ''
    };

    pushToDataLayer({
      event: 'portfolio_view',
      ...payload
    });

    trackPixel('ViewContent', payload);
  } catch (err) {
    console.error('[Analytics PortfolioView Error]', err);
  }
};

/**
 * 9. Service Detail View Event
 */
export const trackServiceView = (service = {}) => {
  try {
    const payload = {
      content_type: 'service',
      content_ids: [service.id || service.slug],
      content_name: service.title || service.name,
      content_category: service.category_name || service.category?.name || ''
    };

    pushToDataLayer({
      event: 'service_view',
      ...payload
    });

    trackPixel('ViewContent', payload);
  } catch (err) {
    console.error('[Analytics ServiceView Error]', err);
  }
};

/**
 * 10. Project Detail View Event
 */
export const trackProjectView = (project = {}) => {
  try {
    const payload = {
      content_type: 'project',
      content_ids: [project.id || project.slug],
      content_name: project.title || project.name,
      content_category: project.category_name || project.category?.name || ''
    };

    pushToDataLayer({
      event: 'project_view',
      ...payload
    });

    trackPixel('ViewContent', payload);
  } catch (err) {
    console.error('[Analytics ProjectView Error]', err);
  }
};

/**
 * 11. Blog Article View Event
 */
export const trackBlogView = (blog = {}) => {
  try {
    const payload = {
      content_type: 'blog',
      content_ids: [blog.id || blog.slug],
      content_name: blog.title,
      content_category: blog.category_name || blog.category?.name || ''
    };

    pushToDataLayer({
      event: 'blog_view',
      ...payload
    });

    trackPixel('ViewContent', payload);
  } catch (err) {
    console.error('[Analytics BlogView Error]', err);
  }
};
