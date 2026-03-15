import { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { setApiTokenGetter, apiScope } from "../shared/api/client";

const MSAL_PLACEHOLDER = "00000000-0000-0000-0000-000000000000";
const isMsalConfigured = () => {
  const id = import.meta.env.VITE_AZURE_CLIENT_ID;
  return id && id !== MSAL_PLACEHOLDER;
};

/**
 * Sets the API token getter so auth/me and other API calls work before user state is set.
 * Must be mounted inside MsalProvider.
 */
export default function InitApiAuth() {
  const { instance } = useMsal();

  useEffect(() => {
    if (!isMsalConfigured()) return;
    setApiTokenGetter(async () => {
      const accounts = instance.getAllAccounts();
      if (accounts.length === 0) return null;
      try {
        const result = await instance.acquireTokenSilent({
          scopes: [apiScope],
          account: accounts[0],
        });
        return result.accessToken ?? null;
      } catch {
        return null;
      }
    });
  }, [instance]);

  return null;
}
