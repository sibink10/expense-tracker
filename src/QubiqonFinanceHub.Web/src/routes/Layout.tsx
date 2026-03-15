import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { C } from "../shared/theme";
import { Av, EmailBanner } from "../components/ui";
import { buildNav } from "../shared/nav";
import Modals from "../components/Modals";
import { useAppContext } from "../context/AppContext";

export default function Layout() {
  const location = useLocation();
  const {
    user,
    setUser,
    instance,
    cfg,
    email,
    toast,
    pendExp,
    pendAdv,
    payableExp,
    rf,
  } = useAppContext();

  const isMsalConfigured =
    import.meta.env.VITE_AZURE_CLIENT_ID &&
    import.meta.env.VITE_AZURE_CLIENT_ID !== "00000000-0000-0000-0000-000000000000";

  const handleLogout = () => {
    if (isMsalConfigured) {
      instance.logoutRedirect();
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    rf();
  }, [location.pathname, rf]);

  const nav = buildNav(cfg, user.role, {
    pendExp,
    pendAdv,
    payableExp: payableExp.length,
  });

  return (
    <>
      <header
        style={{
          background: "#fff",
          borderBottom: `1px solid ${C.border}`,
          padding: "0 20px",
          height: "50px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="28" height="28" viewBox="0 0 40 40">
            <defs>
              <linearGradient id="ql" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={C.primary} />
                <stop offset="100%" stopColor={C.accent} />
              </linearGradient>
            </defs>
            <rect width="40" height="40" rx="8" fill="url(#ql)" />
            <text x="20" y="27" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="700" fontFamily="'DM Sans'">
              Q
            </text>
          </svg>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: C.primary, lineHeight: 1 }}>Qubiqon</div>
            <div style={{ fontSize: "8px", color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Finance Hub
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", fontWeight: 600 }}>{user.name}</div>
            <div style={{ fontSize: "9px", color: C.muted, textTransform: "capitalize" }}>
              {user.role} · {user.dept}
            </div>
          </div>
          <Av n={user.name} sz={30} />
          <button
            onClick={handleLogout}
            style={{
              background: "none",
              border: `1.5px solid ${C.border}`,
              borderRadius: "6px",
              padding: "4px 10px",
              fontSize: "10px",
              fontWeight: 600,
              cursor: "pointer",
              color: C.muted,
              fontFamily: "'DM Sans'",
            }}
          >
            Out
          </button>
        </div>
      </header>
      <div style={{ display: "flex", minHeight: "calc(100vh - 50px)" }}>
        <nav
          style={{
            width: "210px",
            background: "#fff",
            borderRight: `1px solid ${C.border}`,
            padding: "8px",
            flexShrink: 0,
            overflowY: "auto",
          }}
        >
          {nav.map((sec, si) => (
            <div key={si}>
              <div
                style={{
                  fontSize: "8px",
                  fontWeight: 700,
                  color: sec.c || C.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  padding: "8px 12px 3px",
                  marginTop: si > 0 ? "2px" : 0,
                  borderTop: si > 0 ? `1px solid ${C.border}` : "none",
                }}
              >
                {sec.s}
              </div>
              {sec.items
                .filter((n) => n.r.includes(user.role as "employee" | "approver" | "finance" | "admin"))
                .map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    style={({ isActive }) => ({
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "7px 12px",
                      borderRadius: "7px",
                      border: "none",
                      background: isActive ? `${(sec.c || C.accent)}12` : "transparent",
                      color: isActive ? (sec.c || C.accent) : C.muted,
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: isActive ? 600 : 500,
                      width: "100%",
                      textAlign: "left",
                      fontFamily: "'DM Sans'",
                      transition: "all 0.15s",
                      textDecoration: "none",
                    })}
                  >
                    <span style={{ fontSize: "13px", width: "18px", textAlign: "center" }}>{item.i}</span>
                    {item.l}
                    {item.b != null && item.b > 0 && (
                      <span
                        style={{
                          marginLeft: "auto",
                          background: sec.c || C.accent,
                          color: "#fff",
                          fontSize: "9px",
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: "6px",
                        }}
                      >
                        {item.b}
                      </span>
                    )}
                  </NavLink>
                ))}
            </div>
          ))}
        </nav>
        <main style={{ flex: 1, padding: "20px 24px", overflow: "auto" }}>
          {email && <EmailBanner to={email.to} cc={email.cc} subj={email.subj} />}
          <Outlet />
        </main>
      </div>
      <Modals />
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "16px",
            right: "16px",
            zIndex: 2000,
            padding: "10px 18px",
            borderRadius: "8px",
            background: toast.type === "error" ? C.danger : C.success,
            color: "#fff",
            fontSize: "12px",
            fontWeight: 600,
            boxShadow: "0 6px 24px rgba(0,0,0,0.15)",
          }}
        >
          {toast.m}
        </div>
      )}
    </>
  );
}
