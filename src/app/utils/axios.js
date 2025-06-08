import axios from "axios";

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "", // set your base URL if needed
    timeout: 10000, // 10 seconds timeout
    headers: {
        "Content-Type": "application/json",
    },
});

// Optional: Add interceptors for auth token, error logging, etc.
axiosInstance.interceptors.request.use(
    (config) => {
        // Example: You can inject Clerk/JWT tokens here if needed
        // const token = YOUR_AUTH_TOKEN;
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("Axios error:", error.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default axiosInstance;
