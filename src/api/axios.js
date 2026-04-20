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
