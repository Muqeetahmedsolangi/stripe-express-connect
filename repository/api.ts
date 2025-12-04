import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Platform } from "react-native";
import { store } from "../store";
import {
  refreshTokenFailure,
  refreshTokenStart,
  refreshTokenSuccess,
} from "../store/slices/authSlice";

const BACKEND_API_URL = "https://indicators-wealth-grill-open.trycloudflare.com/api";

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

export const clearCachedToken = () => {
  currentToken = null;
};

export const updateCachedToken = (newToken: string) => {
  currentToken = newToken;
};

const getAuthData = async () => {
  try {
    if (Platform.OS !== "web") {
      const persistedState = await AsyncStorage.getItem("persist:root");
      if (persistedState) {
        const parsedState = JSON.parse(persistedState);
        const authData = JSON.parse(parsedState.auth || "{}");
        return authData.user || null;
      }
    } else {
      const persistedState = localStorage.getItem("persist:root");
      if (persistedState) {
        const parsedState = JSON.parse(persistedState);
        const authData = JSON.parse(parsedState.auth || "{}");
        return authData.user || null;
      }
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
          currentToken = token;
        }

        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
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
