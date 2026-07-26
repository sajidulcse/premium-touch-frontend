/**
 * React Router SPA Page View Tracker Hook
 * Safe, fail-proof page view tracking hook.
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from './analyticsService';

export const useAnalyticsTracker = () => {
  let location;
  try {
    location = useLocation();
  } catch (e) {
    return;
  }

  const lastPathname = useRef(null);

  useEffect(() => {
    try {
      if (!location || !location.pathname) return;
      const currentPath = location.pathname;

      // Ignore administrative and authentication panel routes
      if (currentPath.startsWith('/admin') || currentPath === '/admin-login') {
        return;
      }

      // Prevent duplicate page_view tracking if pathname hasn't changed
      if (lastPathname.current === currentPath) {
        return;
      }

      lastPathname.current = currentPath;

      // Short timeout to allow document.title to update dynamically on page load
      const timeoutId = setTimeout(() => {
        try {
          trackPageView(currentPath, typeof document !== 'undefined' ? document.title : '');
        } catch (err) {
          console.error('[Analytics Track Error]', err);
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    } catch (err) {
      console.error('[Analytics Hook Error]', err);
    }
  }, [location?.pathname, location?.search]);
};

export default useAnalyticsTracker;
