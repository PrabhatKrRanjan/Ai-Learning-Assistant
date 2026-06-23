import axios from 'axios';
import { BASE_URL } from './apiPaths';

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 80000, // 80 seconds
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

// Request Interceptor - Attach Token
axiosInstance.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem("token");
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            const { status } = error.response;

            if (status === 401) {
                console.error("Session expired. Please login again.");
                // Optional: Redirect to login or clear token
                // localStorage.removeItem("token");
                // window.location.href = "/login";
            } 
            else if (status === 500) {
                console.error("Server error. Please try again later.");
            } 
            else if (status === 403) {
                console.error("You don't have permission to perform this action.");
            }
        } 
        else if (error.code === "ECONNABORTED") {
            console.error("Request timeout. Please try again.");
        } 
        else if (!error.response) {
            console.error("Network error. Please check your internet connection.");
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;