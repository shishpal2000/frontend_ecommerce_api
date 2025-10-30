import BaseUrl from "@/BaseUrl";
import axios from "axios";
import { saveTokenData, clearTokenData } from "@/utils/tokenManager";

const axiosInstance = axios.create({
  baseURL: BaseUrl(),
  timeout: 1000000,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
};

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.headers && !config.headers["Content-Type"]) {
      // Check if data is FormData (for file uploads)
      if (config.data instanceof FormData) {
        // Don't set Content-Type for FormData - let browser set it with boundary
        delete config.headers["Content-Type"];
      } else {
        // Set JSON content type for regular requests
        config.headers["Content-Type"] = "application/json";
      }
    }

    // Always set Accept header
    if (config.headers) {
      config.headers["Accept"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => {
    if (response.data?.error_status === true) {
      return Promise.reject(new Error(response.data.message || "API Error"));
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      console.error("Network error:", error.message);
      return Promise.reject(
        new Error("Network error. Please check your connection.")
      );
    }

    if (error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refresh");

      if (!refreshToken) {
        clearTokenData();
        window.location.href = "/";
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${BaseUrl()}/authentication/refresh-token/`,
          {
            refresh: refreshToken,
          }
        );

        if (response.data.error_status === false && response.data.data) {
          const tokenData = response.data.data;
          saveTokenData(tokenData);

          originalRequest.headers.Authorization = `Bearer ${tokenData.access}`;
          processQueue(null, tokenData.access);
          isRefreshing = false;

          return axiosInstance(originalRequest);
        } else {
          throw new Error("Token refresh failed");
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        clearTokenData();
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    const errorMessage =
      error.response?.data?.message || error.message || "An error occurred";
    return Promise.reject(new Error(errorMessage));
  }
);

export default axiosInstance;
