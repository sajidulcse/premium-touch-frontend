import axios from 'axios';

const getApiBaseUrl = () => {
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }
    if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
        return `${window.location.origin}/api`;
    }
    return 'http://localhost/premium_touch/premium-touch-backend/api';
};

export const BASE_URL = getApiBaseUrl();

export const getStorageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    if (path.startsWith('/photo/') || path.startsWith('photo/')) return path;

    const root = BASE_URL.replace(/\/api$/, '');
    let cleanPath = path.replace(/^\//, '');

    if (cleanPath.startsWith('public/')) {
        cleanPath = cleanPath.replace(/^public\//, '');
    }

    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1'));
    const prefix = isLocalhost ? '/public/' : '/';

    if (cleanPath.startsWith('uploads/')) {
        return `${root}${prefix}${cleanPath}`;
    }

    if (cleanPath.startsWith('storage/')) {
        return `${root}${prefix}${cleanPath}`;
    }

    return `${root}${prefix}storage/${cleanPath}`;
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

const getCachedData = async (key, endpoint, sessionKey, isArray = false) => {
    if (cache[key] && (!isArray || Array.isArray(cache[key]))) return cache[key];

    const cached = sessionStorage.getItem(sessionKey);
    if (cached) {
        try {
            let parsed = JSON.parse(cached);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Array.isArray(parsed.data)) {
                parsed = parsed.data;
            }
            if (!isArray || Array.isArray(parsed)) {
                cache[key] = isArray && !Array.isArray(parsed) ? [] : parsed;
                return cache[key];
            }
        } catch (e) {
            sessionStorage.removeItem(sessionKey);
        }
    }

    try {
        const res = await api.get(endpoint);
        let freshData = res.data;
        if (freshData && typeof freshData === 'object' && !Array.isArray(freshData) && Array.isArray(freshData.data)) {
            freshData = freshData.data;
        }
        if (!isArray || Array.isArray(freshData)) {
            cache[key] = isArray && !Array.isArray(freshData) ? [] : freshData;
            sessionStorage.setItem(sessionKey, JSON.stringify(cache[key]));
            return cache[key];
        }
        return isArray ? [] : freshData;
    } catch (err) {
        return isArray ? [] : {};
    }
};

export const getSiteInfo = () => getCachedData('siteInfo', '/site-info', 'premium_touch_site_info', false);
export const getCategories = () => getCachedData('categories', '/categories', 'premium_touch_categories', true);
export const getServices = () => getCachedData('services', '/services', 'premium_touch_services', true);
export const getFooter = () => getCachedData('footer', '/footer', 'premium_touch_footer', true);

// Clear cache when settings are saved in admin panel (or globally)
export const clearClientCache = () => {
    cache = { siteInfo: null, categories: null, services: null, footer: null };
    sessionStorage.removeItem('premium_touch_site_info');
    sessionStorage.removeItem('premium_touch_categories');
    sessionStorage.removeItem('premium_touch_services');
    sessionStorage.removeItem('premium_touch_footer');
};

// Add interceptor to include Sanctum Bearer Token
api.interceptors.request.use(config => {
    const token = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add interceptor to handle 401 Unauthorized and redirect for admin panel requests
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('admin');
            localStorage.removeItem('admin_token');
            sessionStorage.removeItem('admin');
            sessionStorage.removeItem('admin_token');
            // Only redirect if navigating an admin page
            if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin-login') {
                window.location.href = '/admin-login';
            }
        }
        return Promise.reject(error);
    }
);


export default api;
