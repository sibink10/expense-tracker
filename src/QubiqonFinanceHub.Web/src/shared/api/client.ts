import axios, { type AxiosInstance } from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "https://localhost:7201/api";
const apiScope =
  import.meta.env.VITE_API_SCOPE ||
  (import.meta.env.VITE_AZURE_CLIENT_ID
    ? `api://${import.meta.env.VITE_AZURE_CLIENT_ID}/.default`
    : "User.Read");

let tokenGetter: (() => Promise<string | null>) | null = null;

/**
 * Set the function that provides the Bearer token for API requests.
 * Call this from AppProvider with MSAL's acquireTokenSilent.
 */
export function setApiTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter;
}

function createClient(): AxiosInstance {
  const client = axios.create({
    baseURL,
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

  return client;
}

export const apiClient = createClient();
export { apiScope };
