import axios from 'axios';

export const BASE_URL = 'http://localhost/premium_touch/premium-touch-backend/api';

export const getStorageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;

    // Use current BASE_URL to derive the public storage path
    // For your setup: http://localhost/premium_touch/premium-touch-backend/public/storage/
    const root = BASE_URL.replace(/\/api$/, '');
    const cleanPath = path.replace(/^\//, '');

    return `${root}/public/storage/${cleanPath}`;
};

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
    },
});

// Cache structures
let cache = {
    siteInfo: null,
    categories: null,
    services: null,
    footer: null
};

const getCachedData = async (key, endpoint, sessionKey) => {
    if (cache[key]) return cache[key];

    const cached = sessionStorage.getItem(sessionKey);
    if (cached) {
        cache[key] = JSON.parse(cached);
        // Refresh quietly in background
        api.get(endpoint).then(res => {
            cache[key] = res.data;
            sessionStorage.setItem(sessionKey, JSON.stringify(res.data));
        }).catch(err => console.warn(`Silent refresh failed for ${endpoint}:`, err));
        
        return cache[key];
    }

    const res = await api.get(endpoint);
    cache[key] = res.data;
    sessionStorage.setItem(sessionKey, JSON.stringify(res.data));
    return cache[key];
};

export const getSiteInfo = () => getCachedData('siteInfo', '/site-info', 'premium_touch_site_info');
export const getCategories = () => getCachedData('categories', '/categories', 'premium_touch_categories');
export const getServices = () => getCachedData('services', '/services', 'premium_touch_services');
export const getFooter = () => getCachedData('footer', '/footer', 'premium_touch_footer');

// Clear cache when settings are saved in admin panel (or globally)
export const clearClientCache = () => {
    cache = { siteInfo: null, categories: null, services: null, footer: null };
    sessionStorage.removeItem('premium_touch_site_info');
    sessionStorage.removeItem('premium_touch_categories');
    sessionStorage.removeItem('premium_touch_services');
    sessionStorage.removeItem('premium_touch_footer');
};

// Add interceptor to include admin token/ID if stored
api.interceptors.request.use(config => {
    const admin = localStorage.getItem('admin');
    if (admin) {
        // Since we are using a simplified session (localstorage), 
        // we can add a custom header if the backend checks it.
        // For now, we'll just keep it simple.
    }
    return config;
});

export default api;
