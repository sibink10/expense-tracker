import { useState } from "react";
import { useMsal } from "@azure/msal-react";
import { C } from "../shared/theme";
import { Av } from "./ui";
import { MicrosoftIcon } from "./icons";
import { USERS } from "../shared/mockData";
import type { AppUser } from "../types";
import loginImage from "../assets/login_image.png";
import qubiqonLogo from "../assets/qubiqon.png";

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
  const [sel, setSel] = useState<number | string | null>(null);
  const [ld, setLd] = useState(false);
  const [msalError, setMsalError] = useState<string | null>(null);

  const handleMsalLogin = () => {
    setLd(true);
    setMsalError(null);
    instance
      .loginRedirect({
        scopes: [import.meta.env.VITE_API_SCOPE!],
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
      className="login-shell"
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(420px, 1fr)",
        background: "#f7f8fa",
        fontFamily: "'Inter', 'Manrope', sans-serif",
      }}
    >
      <section
        className="login-hero"
        style={{
          position: "relative",
          minHeight: "100vh",
          overflow: "hidden",
          background: "#003a31",
        }}
      >
        <img
          src={loginImage}
          alt="Finance dashboard preview"
          style={{
            width: "100%",
            height: "100%",
            minHeight: "100vh",
            display: "block",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
      </section>

      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 20px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ width: "100%", maxWidth: "380px" }}>
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <img
              src={qubiqonLogo}
              alt="Qubiqon"
              style={{
                width: "100%",
                maxWidth: "200px",
                height: "auto",
                display: "inline-block",
              }}
            />
          </div>

          <div
            style={{
              background: "#fff",
              border: "1px solid #e7eaee",
              borderRadius: "12px",
              padding: "32px",
              boxShadow: "0 10px 24px rgba(18, 38, 63, 0.05)",
            }}
          >
            <h2 style={{ color: "#111827", fontSize: "18px", fontWeight: 700, margin: "0 0 6px" }}>
              Sign in
            </h2>
            <p style={{ color: C.muted, fontSize: "12px", lineHeight: 1.5, margin: "0 0 18px" }}>
              Welcome back. Please enter your credentials.
            </p>

            {msalError && (
              <div
                style={{
                  padding: "8px 10px",
                  background: C.dangerBg,
                  borderRadius: "8px",
                  marginBottom: "12px",
                  fontSize: "11px",
                  color: C.danger,
                }}
              >
                {msalError}
              </div>
            )}

            <button
              type="button"
              onClick={useDevPicker ? undefined : handleMsalLogin}
              disabled={ld || useDevPicker}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                padding: "11px 14px",
                width: "100%",
                border: "1px solid #d7dce2",
                borderRadius: "8px",
                background: useDevPicker ? "#f8fafc" : "#fff",
                cursor: ld ? "wait" : useDevPicker ? "not-allowed" : "pointer",
                fontFamily: "'Inter', 'Manrope', sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                color: useDevPicker ? C.muted : "#2d3748",
                transition: "all 0.2s",
              }}
            >
              <MicrosoftIcon />
              Continue with Microsoft
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "#a0a8b3",
                fontSize: "11px",
                fontWeight: 700,
                margin: "18px 0",
              }}
            >
              <span style={{ flex: 1, height: "1px", background: "#edf0f3" }} />
              OR
              <span style={{ flex: 1, height: "1px", background: "#edf0f3" }} />
            </div>

            {useDevPicker ? (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 10px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    marginBottom: "12px",
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <span style={{ fontSize: "10px", color: C.muted }}>Dev mode (MSAL not configured)</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {USERS.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleDevLogin(u)}
                      disabled={ld}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 12px",
                        background: sel === u.id ? `${C.accent}10` : "#fff",
                        border: `1.5px solid ${sel === u.id ? C.accent : "transparent"}`,
                        borderRadius: "8px",
                        cursor: ld ? "wait" : "pointer",
                        width: "100%",
                        textAlign: "left",
                        fontFamily: "'Inter', 'Manrope', sans-serif",
                        transition: "all 0.2s",
                      }}
                    >
                      <Av n={u.name} sz={28} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "11px", fontWeight: 600, color: C.primary }}>{u.name}</div>
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
                <label
                  style={{
                    display: "block",
                    color: "#2d3748",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  disabled={ld}
                  style={{
                    width: "100%",
                    height: "42px",
                    border: "1px solid #e4e8ed",
                    borderRadius: "8px",
                    padding: "0 12px",
                    fontSize: "13px",
                    color: "#111827",
                    boxSizing: "border-box",
                    outline: "none",
                    marginBottom: "16px",
                  }}
                />
                <label
                  style={{
                    display: "block",
                    color: "#2d3748",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  placeholder="********"
                  disabled={ld}
                  style={{
                    width: "100%",
                    height: "42px",
                    border: "1px solid #e4e8ed",
                    borderRadius: "8px",
                    padding: "0 12px",
                    fontSize: "13px",
                    color: "#111827",
                    boxSizing: "border-box",
                    outline: "none",
                    marginBottom: "18px",
                  }}
                />
                <button
                  onClick={handleMsalLogin}
                  disabled={ld}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "9px 18px",
                    width: "100%",
                    border: "none",
                    borderRadius: "8px",
                    background: "#10a879",
                    cursor: ld ? "wait" : "pointer",
                    fontFamily: "'Inter', 'Manrope', sans-serif",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#fff",
                    transition: "all 0.2s",
                    minHeight: "42px",
                  }}
                >
                  {ld ? "Signing in..." : "Sign in"}
                </button>
              </>
            )}
          </div>
          <p style={{ textAlign: "center", color: "#a0a8b3", fontSize: "9px", marginTop: "16px" }}>
            © 2026 Project Management. All rights reserved.
          </p>
        </div>
      </main>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @media (max-width: 820px) {
          .login-shell {
            grid-template-columns: 1fr !important;
          }
          .login-hero {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
