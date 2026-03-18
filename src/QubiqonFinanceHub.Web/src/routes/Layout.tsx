import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { C } from "../shared/theme";
import { Av } from "../components/ui";
import { buildNav } from "../shared/nav";
import Modals from "../components/Modals";
import { useAppContext } from "../context/AppContext";
import { selectOrganization } from "../shared/api";

export default function Layout() {
  const location = useLocation();
  const {
    user,
    setUser,
    instance,
    cfg,
    toast,
    pendExp,
    pendAdv,
    payableExp,
    rf,
    orgs,
    activeOrg,
    setActiveOrg,
  } = useAppContext();

  const [orgOpen, setOrgOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {isMobile && (
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: "18px",
                padding: "4px",
              }}
            >
              ☰
            </button>
          )}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => orgs.length > 0 && setOrgOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: 0,
              borderRadius: 0,
              border: "none",
              background: "transparent",
              cursor: orgs.length > 0 ? "pointer" : "default",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "999px",
                background: C.surface,
                border: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {activeOrg?.logoUrl ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <img src={activeOrg.logoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: "16px", fontWeight: 700, color: C.invoice }}>
                  {(activeOrg?.orgName || "Qubiqon").trim()[0]}
                </span>
              )}
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: C.primary, lineHeight: 1.1 }}>
                {activeOrg?.orgName || "Qubiqon"}
              </div>
              <div style={{ fontSize: "9px", color: C.muted }}>
                {activeOrg?.subName || "Finance Hub"}
              </div>
            </div>
          </button>
          {orgOpen && orgs.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                minWidth: "220px",
                background: "#fff",
                borderRadius: "10px",
                border: `1px solid ${C.border}`,
                boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                padding: "6px 4px",
                zIndex: 200,
                maxHeight: "260px",
                overflowY: "auto",
              }}
            >
              {orgs.map((o) => {
                const isActive = activeOrg?.id === o.id;
                return (
                  <button
                    key={o.id ?? o.orgName}
                    type="button"
                    onClick={async () => {
                      setActiveOrg(o);
                      setOrgOpen(false);
                      if (o.id) {
                        try {
                          await selectOrganization(o.id);
                        } catch {
                          // ignore select error, still reload to reflect context
                        }
                      }
                      window.location.reload();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      width: "100%",
                      padding: "6px 8px",
                      border: "none",
                      background: isActive ? `${C.invoice}10` : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      borderRadius: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "999px",
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      {o.logoUrl ? (
                        // eslint-disable-next-line jsx-a11y/alt-text
                        <img src={o.logoUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: "13px", fontWeight: 700, color: C.invoice }}>
                          {(o.orgName || "Q")[0]}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: C.primary,
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                        }}
                      >
                        {o.orgName}
                      </div>
                      {o.subName && (
                        <div
                          style={{
                            fontSize: "9px",
                            color: C.muted,
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                          }}
                        >
                          {o.subName}
                        </div>
                      )}
                    </div>
                    {isActive && (
                      <span style={{ fontSize: "10px", color: C.invoice, fontWeight: 700 }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
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
        {/* Sidebar */}
        {(sidebarOpen || !isMobile) && (
          <>
            {isMobile && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(15,23,42,0.45)",
                  zIndex: 90,
                }}
                onClick={() => setSidebarOpen(false)}
              />
            )}
            <nav
              style={{
                position: isMobile ? "fixed" : "relative",
                top: isMobile ? 50 : 0,
                left: 0,
                height: isMobile ? "calc(100vh - 50px)" : "auto",
                width: "210px",
                background: "#fff",
                borderRight: `1px solid ${C.border}`,
                padding: "8px",
                flexShrink: 0,
                overflowY: "auto",
                zIndex: isMobile ? 100 : 0,
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
                        onClick={() => isMobile && setSidebarOpen(false)}
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
          </>
        )}
        <main style={{ flex: 1, padding: "20px 24px", overflow: "auto" }}><Outlet /></main>
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
