import { useState, useEffect, useRef } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { C } from "../shared/theme";
import { findUserByEmail } from "../shared/mockData";
import { getAuthMe } from "../shared/api/auth";
import type { AppUser } from "../types";

const MSAL_PLACEHOLDER = "00000000-0000-0000-0000-000000000000";
const isMsalConfigured = () => {
  const id = import.meta.env.VITE_AZURE_CLIENT_ID;
  return id && id !== MSAL_PLACEHOLDER;
};

/** Map MSAL account to AppUser. Unknown users default to Employee. */
function msalAccountToAppUser(account: { username?: string; name?: string; preferred_username?: string }): AppUser {
  const email = account.username || account.preferred_username || "";
  const matched = findUserByEmail(email);
  if (matched) return matched;
  // Not in USERS list → default to Employee
  const name = account.name || email.split("@")[0] || "User";
  const initials = name.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase() || "?";
  return {
    id: 0,
    name,
    email,
    role: "employee",
    dept: "General",
    av: initials,
  };
}

export function LoadingScreen({ message = "Checking login…" }: { message?: string }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "20px",
        background: `linear-gradient(160deg, ${C.primary} 0%, #2C3E6A 50%, ${C.accent} 100%)`,
        fontFamily: "'DM Sans'",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          border: "3px solid rgba(255,255,255,0.2)",
          borderTopColor: "#fff",
          borderRadius: "50%",
          animation: "authSpin 0.8s linear infinite",
        }}
      />
      <div style={{ color: "rgba(255,255,255,0.9)", fontSize: "14px", fontWeight: 500 }}>{message}</div>
      <style>{`@keyframes authSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

interface AuthGateProps {
  onAuth: (user: AppUser) => void;
  renderLogin: (onLogin: (u: AppUser) => void) => React.ReactNode;
}

export default function AuthGate({ onAuth, renderLogin }: AuthGateProps) {
  const { accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [mounted, setMounted] = useState(false);
  const [fetchingMe, setFetchingMe] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const useDevPicker = !isMsalConfigured();
  const isCheckingAuth = useDevPicker ? false : inProgress !== InteractionStatus.None;

  useEffect(() => {
    if (!useDevPicker && mounted && isAuthenticated && accounts[0] && !fetchedRef.current) {
      fetchedRef.current = true;
      setFetchingMe(true);
      getAuthMe()
        .then((user) => onAuth(user))
        .catch(() => onAuth(msalAccountToAppUser(accounts[0])))
        .finally(() => setFetchingMe(false));
    }
  }, [useDevPicker, mounted, isAuthenticated, accounts, onAuth]);

  if (isCheckingAuth || fetchingMe) {
    return <LoadingScreen message={fetchingMe ? "Loading profile…" : "Checking login status…"} />;
  }

  return <>{renderLogin(onAuth)}</>;
}
