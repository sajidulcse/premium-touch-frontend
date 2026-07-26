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

    if (cleanPath.startsWith('uploads/')) {
        return `${root}/public/${cleanPath}`;
    }

    if (cleanPath.startsWith('storage/')) {
        return `${root}/public/${cleanPath}`;
    }

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
