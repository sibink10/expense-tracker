import { useEffect } from "react";
import { setApiTokenGetter } from "../shared/api/client";
import { getAppAccessToken } from "../shared/auth/sessionAuth";

/**
 * Wires the API token getter before user state is set.
 */
export default function InitApiAuth() {
  useEffect(() => {
    setApiTokenGetter(getAppAccessToken);
  }, []);

  return null;
}
