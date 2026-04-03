import axios from 'axios';
import { message } from 'antd';

// Create Axios instance
const service = axios.create({
    baseURL: 'http://localhost:8081', // Ensure this matches your backend port
    timeout: 10000,
});

// Request Interceptor
service.interceptors.request.use(
    (config) => {
        // Add token to header if it exists
        const token = localStorage.getItem('admin_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Response Interceptor
service.interceptors.response.use(
    (response) => {
        const res = response.data;

        // LOGIC UPDATE START ---------------------------------------
        // We now check for two types of success indicators:
        // 1. Standard Code: res.code === 200
        // 2. Boolean Flag: res.success === true (Your current backend format)
        if (res.code === 200 || res.success === true) {
            // If the response has a 'data' field, return that directly for convenience
            // Otherwise return the whole response
            return res.data !== undefined ? res.data : res;
        }
        // LOGIC UPDATE END -----------------------------------------

        // If execution reaches here, it means business logic failed (e.g., wrong password)
        // We try to find the error message in various common fields
        const errorMessage = res.message || res.msg || res.errorMsg || 'Error';

        message.error(errorMessage);
        return Promise.reject(new Error(errorMessage));
    },
    (error) => {
        // Handle HTTP errors (like 401, 403, 500)
        console.error('Response error:', error);

        let msg = 'Network Error';
        if (error.response) {
            const status = error.response.status;
            if (status === 401) {
                msg = 'Unauthorized: Please log in again.';
                // Optional: clear local storage and redirect to login
                localStorage.removeItem('admin_token');
                // window.location.href = '/login'; 
            } else if (status === 403) {
                msg = 'Forbidden: Access denied.';
            } else if (status === 404) {
                msg = 'Resource not found.';
            } else if (status === 500) {
                msg = 'Server internal error.';
            }
        }

        message.error(msg);
        return Promise.reject(error);
    }
);

export default service;