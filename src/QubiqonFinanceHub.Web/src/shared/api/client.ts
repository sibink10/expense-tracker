import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { fetchAppToken, getAppAccessToken } from "../auth/sessionAuth";

const baseURL = import.meta.env.VITE_API_BASE_URL || "https://localhost:7201/api";

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let tokenGetter: (() => Promise<string | null>) | null = null;

/**
 * Set the function that provides the Bearer token for API requests.
 */
export function setApiTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter;
}

function createClient(): AxiosInstance {
  const client = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  });

  client.interceptors.request.use(
    async (config) => {
      if (tokenGetter) {
        const token = await tokenGetter();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      if (config.data instanceof FormData) {
        delete config.headers["Content-Type"];
      }
      return config;
    },
    (err) => Promise.reject(err)
  );

  client.interceptors.response.use(
    (response) => response,
    async (err: unknown) => {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const config = err.config as RetryableRequestConfig | undefined;

        if (status === 401 && config && !config._retry) {
          config._retry = true;
          const token = await fetchAppToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            return client.request(config);
          }
          window.location.assign("/");
        }

        const data = err.response?.data as
          | {
              message?: string;
              title?: string;
              detail?: string;
              error?: { message?: string } | string;
              errors?: Record<string, string[] | string>;
            }
          | undefined;

        const nestedError =
          typeof data?.error === "string"
            ? data.error
            : data?.error && typeof data.error === "object"
              ? data.error.message
              : undefined;

        const validationError = data?.errors
          ? Object.values(data.errors)
              .flatMap((value) => (Array.isArray(value) ? value : [value]))
              .find((value) => typeof value === "string" && value.trim())
          : undefined;

        const problemDetail = data?.detail?.trim() || data?.title?.trim();

        const message =
          nestedError?.trim() ||
          problemDetail ||
          data?.message?.trim() ||
          validationError?.trim() ||
          err.message ||
          "Request failed";

        return Promise.reject(new Error(message));
      }

      return Promise.reject(err);
    }
  );

  return client;
}

export const apiClient = createClient();

/** Message from axios error interceptor, or fallback (e.g. for non-Error throws). */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  return fallback;
}
