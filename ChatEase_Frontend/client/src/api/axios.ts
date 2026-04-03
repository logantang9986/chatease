import axios from 'axios';
import { toast } from 'sonner';

// Determine if running in Electron (by checking userAgent)
const isElectron = navigator.userAgent.toLowerCase().includes(' electron/');

// Determine if running in Development mode (provided by Vite)
const isDev = import.meta.env.DEV;

// Config Logic:
// 1. In Development: Use '' (relative path) to leverage Vite Proxy.
// 2. In Production Electron: Use absolute URL.
//    NOTE: Ensure this matches your Java backend address.
const baseURL = (isElectron && !isDev) ? 'http://localhost:8081' : '';

const api = axios.create({
    baseURL: baseURL
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLoginPage = window.location.pathname === '/login';

        if (error.response && error.response.status === 401) {
            if (!isLoginPage) {
                toast.error('Session expired, please login again', { id: 'session-expired' });
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;