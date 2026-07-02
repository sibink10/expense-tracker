import { useState } from "react";
import { C, R } from "../shared/theme";
import { MicrosoftIcon } from "./icons";
import { redirectToLogin } from "../shared/auth/sessionAuth";
import { branding } from "../shared/branding";
import loginImage from "../assets/login_image.png";

export default function Login() {
  const [loading, setLoading] = useState(false);

  const handleMicrosoftLogin = () => {
    setLoading(true);
    redirectToLogin();
  };

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
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0) 100%)",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "56px",
            left: "56px",
            zIndex: 2,
            color: "#fff",
            maxWidth: "460px",
            paddingRight: "12px",
          }}
        >
          <div style={{ fontSize: "44px", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            Your finances.
            <br />
            All in one place.
          </div>
          <div style={{ width: "38px", height: "3px", background: "#18c08b", borderRadius: "999px", margin: "18px 0 16px" }} />
          <div style={{ fontSize: "13px", lineHeight: 1.55, color: "rgba(255,255,255,0.82)" }}>
            Track accounts, budgets, investments,
            <br />
            and spending — in real time.
            <br />
            Make smarter financial decisions
            <br />
            with clarity and confidence.
          </div>
        </div>
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
            position: "relative",
            zIndex: 0,
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
              src={branding.loginLogo}
              alt={branding.loginLogoAlt}
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
              borderRadius: R.control,
              padding: "32px",
              boxShadow: "0 10px 24px rgba(18, 38, 63, 0.05)",
            }}
          >
            <h2 style={{ color: "#111827", fontSize: "18px", fontWeight: 700, margin: "0 0 6px" }}>
              Sign in
            </h2>
            <p style={{ color: C.muted, fontSize: "12px", lineHeight: 1.5, margin: "0 0 24px" }}>
              Use your organization Microsoft account to continue.
            </p>

            <button
              type="button"
              onClick={handleMicrosoftLogin}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                padding: "11px 14px",
                width: "100%",
                border: "1px solid #d7dce2",
                borderRadius: R.control,
                background: "#fff",
                cursor: loading ? "wait" : "pointer",
                fontFamily: "'Inter', 'Manrope', sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                color: "#2d3748",
                transition: "all 0.2s",
              }}
            >
              <MicrosoftIcon />
              {loading ? "Redirecting…" : "Continue with Microsoft"}
            </button>
          </div>
          <p style={{ textAlign: "center", color: "#a0a8b3", fontSize: "9px", marginTop: "16px" }}>
            {branding.copyright}
          </p>
        </div>
      </main>
      <style>{`
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
