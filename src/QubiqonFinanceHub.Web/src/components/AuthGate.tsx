import { useState, useEffect, useRef } from "react";
import { C, R } from "../shared/theme";
import { getAuthMe } from "../shared/api/auth";
import { fetchAppToken, logoutSession, TokenForbiddenError } from "../shared/auth/sessionAuth";
import Login from "./Login";
import type { AppUser } from "../types";

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
        fontFamily: "'Inter', 'Manrope', sans-serif",
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
      <p
        style={{
          color: "rgba(255,255,255,0.8)",
          margin: 0,
          fontSize: "14px",
          textAlign: "center",
          maxWidth: "360px",
        }}
      >
        Your account is not authorized to use this application. Contact your administrator to get access.
      </p>
      <button
        onClick={onSignOut}
        type="button"
        style={{
          padding: "12px 24px",
          background: "rgba(255,255,255,0.2)",
          border: "1px solid rgba(255,255,255,0.4)",
          borderRadius: R.control,
          color: "#fff",
          fontSize: "14px",
          fontWeight: 600,
          fontFamily: "'Inter', 'Manrope', sans-serif",
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
        background: "#fff",
        fontFamily: "'Inter', 'Manrope', sans-serif",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          border: "3px solid rgba(23, 168, 108, 0.18)",
          borderTopColor: "#17A86C",
          borderRadius: "50%",
          animation: "authSpin 0.8s linear infinite",
        }}
      />
      <div style={{ color: "#1F2937", fontSize: "14px", fontWeight: 500 }}>{message}</div>
      <style>{`@keyframes authSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

interface AuthGateProps {
  onAuth: (user: AppUser) => void;
}

export default function AuthGate({ onAuth }: AuthGateProps) {
  const [checking, setChecking] = useState(true);
  const [noAccess, setNoAccess] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetchAppToken()
      .then((token) => {
        if (!token) return null;
        return getAuthMe();
      })
      .then((user) => {
        if (user) onAuth(user);
      })
      .catch((err) => {
        if (err instanceof TokenForbiddenError) setNoAccess(true);
        else setNoAccess(true);
      })
      .finally(() => setChecking(false));
  }, [onAuth]);

  const handleSignOut = async () => {
    await logoutSession();
    setNoAccess(false);
  };

  if (noAccess) {
    return <NoAccessScreen onSignOut={handleSignOut} />;
  }

  if (checking) {
    return <LoadingScreen message="Checking login status…" />;
  }

  return <Login />;
}
