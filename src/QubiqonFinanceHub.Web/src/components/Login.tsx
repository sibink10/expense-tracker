import { useState } from "react";
import { useMsal } from "@azure/msal-react";
import { C } from "../shared/theme";
import { Av } from "./ui";
import { USERS } from "../shared/mockData";
import type { AppUser } from "../types";

const MSAL_PLACEHOLDER = "00000000-0000-0000-0000-000000000000";
const isMsalConfigured = () => {
  const id = import.meta.env.VITE_AZURE_CLIENT_ID;
  return id && id !== MSAL_PLACEHOLDER;
};

interface LoginProps {
  onLogin: (u: AppUser) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const { instance } = useMsal();
  const [sel, setSel] = useState<number | null>(null);
  const [ld, setLd] = useState(false);
  const [msalError, setMsalError] = useState<string | null>(null);

  const handleMsalLogin = () => {
    setLd(true);
    setMsalError(null);
    instance
      .loginRedirect({
        scopes: [import.meta.env.VITE_API_SCOPE],
      })
      .catch((err) => {
        setLd(false);
        setMsalError(err?.message || "Sign-in failed");
      });
  };

  const handleDevLogin = (u: AppUser) => {
    setSel(u.id);
    setLd(true);
    setTimeout(() => onLogin(u), 400);
  };

  const useDevPicker = !isMsalConfigured();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(160deg, ${C.primary} 0%, #2C3E6A 50%, ${C.accent} 100%)`,
        fontFamily: "'DM Sans'",
        padding: "16px",
      }}
    >
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <svg width="48" height="48" viewBox="0 0 40 40" style={{ marginBottom: "12px" }}>
            <rect width="40" height="40" rx="10" fill="rgba(255,255,255,0.15)" />
            <text x="20" y="27" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="700" fontFamily="'DM Sans'">
              Q
            </text>
          </svg>
          <h1 style={{ color: "#fff", fontSize: "24px", fontWeight: 700, margin: "0 0 4px" }}>
            Qubiqon Finance Hub
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", margin: 0, fontSize: "12px" }}>
            Expenses · Vendor Payments · Invoicing
          </p>
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.97)",
            borderRadius: "16px",
            padding: "24px 20px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
          }}
        >
          {msalError && (
            <div
              style={{
                padding: "10px 14px",
                background: C.dangerBg,
                borderRadius: "8px",
                marginBottom: "16px",
                fontSize: "12px",
                color: C.danger,
              }}
            >
              {msalError}
            </div>
          )}

          {useDevPicker ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 14px",
                  background: C.surface,
                  borderRadius: "8px",
                  marginBottom: "16px",
                  border: `1px solid ${C.border}`,
                }}
              >
                <span style={{ fontSize: "11px", color: C.muted }}>Dev mode (MSAL not configured)</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {USERS.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleDevLogin(u)}
                    disabled={ld}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 12px",
                      background: sel === u.id ? `${C.accent}10` : "#fff",
                      border: `1.5px solid ${sel === u.id ? C.accent : "transparent"}`,
                      borderRadius: "8px",
                      cursor: ld ? "wait" : "pointer",
                      width: "100%",
                      textAlign: "left",
                      fontFamily: "'DM Sans'",
                      transition: "all 0.2s",
                    }}
                  >
                    <Av n={u.name} sz={32} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: C.primary }}>{u.name}</div>
                      <div style={{ fontSize: "10px", color: C.muted }}>
                        {u.email} ·{" "}
                        <span
                          style={{
                            textTransform: "capitalize",
                            fontWeight: 500,
                            color:
                              u.role === "approver" ? C.info : u.role === "finance" ? C.success : u.role === "admin" ? C.vendor : C.muted,
                          }}
                        >
                          {u.role}
                        </span>
                      </div>
                    </div>
                    {sel === u.id && ld && (
                      <div
                        style={{
                          width: "14px",
                          height: "14px",
                          border: `2px solid ${C.border}`,
                          borderTopColor: C.accent,
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite",
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 14px",
                  background: C.surface,
                  borderRadius: "8px",
                  marginBottom: "16px",
                  border: `1px solid ${C.border}`,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                </svg>
                <span style={{ fontSize: "11px", color: C.muted }}>Microsoft Entra ID SSO</span>
              </div>
              <button
                onClick={handleMsalLogin}
                disabled={ld}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  padding: "12px 20px",
                  width: "100%",
                  border: `1.5px solid ${C.border}`,
                  borderRadius: "8px",
                  background: "#fff",
                  cursor: ld ? "wait" : "pointer",
                  fontFamily: "'DM Sans'",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: C.primary,
                  transition: "all 0.2s",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                </svg>
                {ld ? "Signing in…" : "Sign in with Microsoft"}
              </button>
            </>
          )}
        </div>
        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "9px", marginTop: "16px" }}>
          © 2026 Qubiqon Consulting India Ltd.
        </p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
