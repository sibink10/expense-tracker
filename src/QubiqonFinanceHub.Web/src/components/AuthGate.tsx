import { useState, useEffect, useRef } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { C } from "../shared/theme";
import { getAuthMe } from "../shared/api/auth";
import type { AppUser } from "../types";

const MSAL_PLACEHOLDER = "00000000-0000-0000-0000-000000000000";
const isMsalConfigured = () => {
  const id = import.meta.env.VITE_AZURE_CLIENT_ID;
  return id && id !== MSAL_PLACEHOLDER;
};

function NoAccessScreen({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
        background: `linear-gradient(160deg, ${C.primary} 0%, #2C3E6A 50%, ${C.accent} 100%)`,
        fontFamily: "'DM Sans'",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "28px",
        }}
      >
        🚫
      </div>
      <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: 700, margin: 0 }}>No access</h1>
      <p style={{ color: "rgba(255,255,255,0.8)", margin: 0, fontSize: "14px", textAlign: "center", maxWidth: "360px" }}>
        Your account is not authorized to use this application. Contact your administrator to get access.
      </p>
      <button
        onClick={onSignOut}
        type="button"
        style={{
          padding: "12px 24px",
          background: "rgba(255,255,255,0.2)",
          border: "1px solid rgba(255,255,255,0.4)",
          borderRadius: "10px",
          color: "#fff",
          fontSize: "14px",
          fontWeight: 600,
          fontFamily: "'DM Sans'",
          cursor: "pointer",
        }}
      >
        Sign out
      </button>
    </div>
  );
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
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [mounted, setMounted] = useState(false);
  const [fetchingMe, setFetchingMe] = useState(false);
  const [noAccess, setNoAccess] = useState(false);
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
      setNoAccess(false);
      getAuthMe()
        .then((user) => onAuth(user))
        .catch(() => setNoAccess(true))
        .finally(() => setFetchingMe(false));
    }
  }, [useDevPicker, mounted, isAuthenticated, accounts, onAuth]);

  const handleSignOut = () => {
    instance.logoutRedirect();
  };

  if (noAccess) {
    return <NoAccessScreen onSignOut={handleSignOut} />;
  }

  if (isCheckingAuth || fetchingMe) {
    return <LoadingScreen message={fetchingMe ? "Loading profile…" : "Checking login status…"} />;
  }

  return <>{renderLogin(onAuth)}</>;
}
