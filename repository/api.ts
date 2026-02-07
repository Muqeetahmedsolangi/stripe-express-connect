import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Platform } from "react-native";
import { store } from "../store";
import {
  refreshTokenFailure,
  refreshTokenStart,
  refreshTokenSuccess,
} from "../store/slices/authSlice";

const BACKEND_API_URL = "https://dresses-software-programming-camps.trycloudflare.com/api";

const api = axios.create({
  baseURL: BACKEND_API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

let isRefreshing = false;
let currentToken: string | null = null;

export const clearCachedToken = async () => {
  currentToken = null;
  if (Platform.OS !== "web") {
    await AsyncStorage.removeItem("authToken");
  } else {
    localStorage.removeItem("authToken");
  }
};

export const updateCachedToken = async (newToken: string) => {
  currentToken = newToken;
  if (Platform.OS !== "web") {
    await AsyncStorage.setItem("authToken", newToken);
  } else {
    localStorage.setItem("authToken", newToken);
  }
};

// Helper to get token from storage
export const getTokenFromStorage = async (): Promise<string | null> => {
  try {
    if (Platform.OS !== "web") {
      return await AsyncStorage.getItem("authToken");
    } else {
      return localStorage.getItem("authToken");
    }
  } catch (error) {
    console.error("Error getting token from storage:", error);
    return null;
  }
};

const getAuthData = async () => {
  try {
    // First try to get token from AsyncStorage directly (fallback)
    let tokenFromStorage: string | null = null;
    if (Platform.OS !== "web") {
      tokenFromStorage = await AsyncStorage.getItem("authToken");
    } else {
      tokenFromStorage = localStorage.getItem("authToken");
    }

    // Try to get from Redux persisted state
    let userFromState = null;
    if (Platform.OS !== "web") {
      const persistedState = await AsyncStorage.getItem("persist:root");
      if (persistedState) {
        const parsedState = JSON.parse(persistedState);
        const authData = JSON.parse(parsedState.auth || "{}");
        userFromState = authData.user || null;
      }
    } else {
      const persistedState = localStorage.getItem("persist:root");
      if (persistedState) {
        const parsedState = JSON.parse(persistedState);
        const authData = JSON.parse(parsedState.auth || "{}");
        userFromState = authData.user || null;
      }
    }

    // Return user from state if available, otherwise create object with token from storage
    if (userFromState) {
      return userFromState;
    } else if (tokenFromStorage) {
      return { token: tokenFromStorage };
    }
  } catch (error) {
    console.error("Error getting auth data:", error);
  }
  return null;
};

api.interceptors.request.use(
  async (config) => {
    try {
      if (__DEV__) {
        console.log(
          `[API Request] ${config.method?.toUpperCase()} ${config.url}`
        );
      }

      const skipAuth =
        (config as any).skipAuth ||
        config.headers?.["X-Skip-Auth"] === true ||
        config.headers?.["X-Skip-Auth"] === "true";

      if (!skipAuth) {
        let token = currentToken;
        if (!token) {
          const authData = await getAuthData();
          token = authData?.token;
          
          // If still no token, try AsyncStorage directly as last resort
          if (!token && Platform.OS !== "web") {
            token = await AsyncStorage.getItem("authToken");
          } else if (!token) {
            token = localStorage.getItem("authToken");
          }
          
          if (token) {
            currentToken = token;
          }
        }

        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
          
          if (__DEV__) {
            console.log(`[API] Adding token to request: ${token.substring(0, 20)}...`);
          }
        } else {
          if (__DEV__) {
            console.warn(`[API] No token found for request: ${config.method?.toUpperCase()} ${config.url}`);
          }
        }
      } else {
        if (config.headers?.Authorization)
          delete (config.headers as any).Authorization;
      }

      return config;
    } catch (error) {
      console.error("Error in request interceptor:", error);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(
        `[API Response] ${
          response.status
        } ${response.config.method?.toUpperCase()} ${response.config.url}`
      );
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (__DEV__) {
      console.error(
        `[API Error] ${error.config?.method?.toUpperCase()} ${
          error.config?.url
        }:`,
        error.response?.data || error.message
      );
    }

    const is401Error = error.response?.status === 401;
    const isAuthError =
      error.response?.data?.errorCode === "AUTH_ERROR" ||
      error.response?.data?.message === "Invalid or expired token";

    const shouldRefresh =
      (is401Error || isAuthError) &&
      !originalRequest._isRetry &&
      !originalRequest.url?.includes("/auth/refresh-token") &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/register");

    if (shouldRefresh) {
      originalRequest._isRetry = true;

      if (isRefreshing) {
        let attempts = 0;
        while (isRefreshing && attempts < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          attempts++;
        }

        if (currentToken) {
          originalRequest.headers.Authorization = `Bearer ${currentToken}`;
          return api(originalRequest);
        }
        return Promise.reject(error);
      }

      isRefreshing = true;

      try {
        const authData = await getAuthData();

        if (!authData?.refreshToken) {
          throw new Error("No refresh token available");
        }

        store.dispatch(refreshTokenStart());

        const refreshResponse = await axios.post(
          `${BACKEND_API_URL}/auth/refresh-token`,
          { refreshToken: authData.refreshToken },
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            timeout: 15000,
          }
        );

        if (refreshResponse.data.success) {
          const { accessToken, refreshToken } = refreshResponse.data;

          currentToken = accessToken;

          api.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${accessToken}`;

          store.dispatch(
            refreshTokenSuccess({
              accessToken,
              refreshToken,
            })
          );

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } else {
          throw new Error("Refresh token response not successful");
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        currentToken = null;
        store.dispatch(refreshTokenFailure());
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export { api };
