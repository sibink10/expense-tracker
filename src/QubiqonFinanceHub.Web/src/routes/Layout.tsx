import { useEffect, useState } from "react";
import {
  BanknoteArrowUp,
  BriefcaseBusiness,
  ChevronDown,
  ChevronUp,
  CirclePlus,
  FolderKanban,
  HandCoins,
  LayoutDashboard,
  Menu,
  Network,
  ReceiptText,
  Settings,
  Users,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { C, R } from "../shared/theme";
import { buildNav } from "../shared/nav";
import Modals from "../components/Modals";
import DeepLinkHandler from "../components/DeepLinkHandler";
import { useAppContext } from "../context/AppContext";
import { selectOrganization } from "../shared/api";
import { MODAL_T } from "../shared/constants";
import type { UserRole } from "../types";

const navIcons = {
  dashboard: LayoutDashboard,
  expenses: ReceiptText,
  advances: BanknoteArrowUp,
  vendors: BriefcaseBusiness,
  clients: HandCoins,
  employees: Users,
  organization: Network,
  workspace: FolderKanban,
  settings: Settings,
  payable: TrendingDown,
  receivable: TrendingUp,
} as const;

type NavIconKey = keyof typeof navIcons;
const SIDEBAR_THEME = "#064e3b";
const SIDEBAR_ACTIVE_BG = "#ECFDF5";

function SidebarIcon({ name, color }: { name?: string; color: string }) {
  const Icon = navIcons[(name as NavIconKey) || "dashboard"] ?? CirclePlus;
  return <Icon size={15} strokeWidth={1.8} color={color} />;
}

export default function Layout() {
  const location = useLocation();
  const {
    user,
    setUser,
    instance,
    cfg,
    toast,
    rf,
    setMdl,
    orgs,
    activeOrg,
    setActiveOrg,
  } = useAppContext();

  const navigate = useNavigate();
  const [orgOpen, setOrgOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null | undefined>(undefined);
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

  const handleAddPath = (addPath: string) => {
    if (addPath === "/advances/add") {
      setMdl({ t: MODAL_T.ADV_REQUEST });
      return;
    }
    navigate(addPath);
  };

  useEffect(() => {
    rf();
  }, [location.pathname, rf]);

  const nav = buildNav(cfg);
  const visibleNav = nav
    .map((sec) => ({
      ...sec,
      items: sec.items.filter((n) =>
        n.r.includes(user.role as UserRole)
      ),
    }))
    .filter((sec) => sec.items.length > 0);

  const sidebarWidth = 260;
  const role = user.role as UserRole;
  const isPathActive = (path: string, end?: boolean) =>
    end ? location.pathname === path : location.pathname === path || location.pathname.startsWith(`${path}/`);
  const isItemActive = (item: typeof visibleNav[number]["items"][number]) =>
    isPathActive(item.path, item.end) || (item.addPath ? isPathActive(item.addPath) : false);
  const isSectionActive = (items: typeof visibleNav[number]["items"]) =>
    items.some((item) => isItemActive(item));
  const userInitial = (user.name || user.email || "U").trim()[0]?.toUpperCase() || "U";
  const designation = (user as { designation?: string }).designation || user.dept || "Team member";

  useEffect(() => {
    const activeGroup = visibleNav.find((sec) => !sec.path && isSectionActive(sec.items));
    setOpenSection(activeGroup?.s ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const organizationSummary = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        minWidth: 0,
        maxWidth: isMobile ? "calc(100vw - 120px)" : undefined,
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
      <div style={{ textAlign: "left", minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: "12px", fontWeight: 700, color: C.primary, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {activeOrg?.orgName || "Qubiqon"}
        </div>
        <div style={{ fontSize: "9px", color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {activeOrg?.subName || "Finance Hub"}
        </div>
      </div>
    </div>
  );

  const organizationSelector = (
    <div style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        onClick={() => orgs.length > 0 && setOrgOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          width: "100%",
          padding: "8px",
          borderRadius: R.control,
          border: `1px solid ${C.border}`,
          background: C.surface,
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
        <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: C.primary, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {activeOrg?.orgName || "Qubiqon"}
          </div>
          <div style={{ fontSize: "9px", color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {activeOrg?.subName || "Finance Hub"}
          </div>
        </div>
        {orgs.length > 0 && <ChevronDown size={14} color={C.muted} />}
      </button>
      {orgOpen && orgs.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 4px)",
            left: 0,
            right: 0,
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
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          background: C.white,
          borderBottom: `1px solid ${C.border}`,
          padding: "0 20px",
          height: "50px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {isMobile && (
            <button
              type="button"
              onClick={() => {
                setSidebarOpen((v) => !v);
                setOrgOpen(false);
              }}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: "18px",
                padding: "4px",
              }}
            >
              <Menu size={18} />
            </button>
          )}
          {organizationSummary}
        </div>
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => {
              setProfileOpen((v) => !v);
              setOrgOpen(false);
            }}
            style={{
              width: 34,
              height: 34,
              borderRadius: "999px",
              border: `1px solid ${C.successBg}`,
              background: C.clientAvatarBg,
              color: C.clientAvatarText,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              fontWeight: 800,
              fontFamily: "'Inter', 'Manrope', sans-serif",
              boxShadow: "0 4px 14px rgba(33,146,104,0.15)",
            }}
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            title={user.name}
          >
            {userInitial}
          </button>
          {profileOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: "230px",
                background: "#fff",
                borderRadius: "12px",
                border: `1px solid ${C.border}`,
                boxShadow: "0 14px 34px rgba(15,23,42,0.14)",
                padding: "12px",
                zIndex: 200,
              }}
              role="menu"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "999px",
                    background: C.clientAvatarBg,
                    color: C.clientAvatarText,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {userInitial}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: C.primary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: "11px", color: C.muted, textTransform: "capitalize" }}>{user.role}</div>
                </div>
              </div>
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "10px", display: "grid", gap: "8px" }}>
                <div>
                  <div style={{ fontSize: "10px", color: C.muted, marginBottom: "2px" }}>Designation</div>
                  <div style={{ fontSize: "12px", color: C.primary, fontWeight: 600 }}>{designation}</div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    marginTop: "4px",
                    width: "100%",
                    background: C.clientAvatarBg,
                    border: "none",
                    borderRadius: R.control,
                    padding: "8px 10px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    color: C.clientAvatarText,
                    fontFamily: "'Inter', 'Manrope', sans-serif",
                  }}
                  role="menuitem"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </header>
      <div
        style={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Sidebar */}
        <>
            {isMobile && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(15,23,42,0.45)",
                  zIndex: 90,
                  opacity: sidebarOpen ? 1 : 0,
                  pointerEvents: sidebarOpen ? "auto" : "none",
                  transition: "opacity 0.24s ease",
                }}
                onClick={() => {
                  setSidebarOpen(false);
                  setOrgOpen(false);
                }}
              />
            )}
            <nav
              className="app-sidebar"
              style={{
                position: "fixed",
                top: 50,
                left: 0,
                height: "calc(100vh - 50px)",
                width: sidebarWidth,
                background: "#fff",
                borderRight: `1px solid ${C.border}`,
                padding: "8px",
                overflowY: "auto",
                overscrollBehavior: "contain",
                zIndex: isMobile ? 100 : 10,
                transform: isMobile && !sidebarOpen ? `translateX(-${sidebarWidth}px)` : "translateX(0)",
                transition: "transform 0.24s ease",
                willChange: isMobile ? "transform" : undefined,
                pointerEvents: isMobile && !sidebarOpen ? "none" : "auto",
              }}
            >
              <style>{`
                .app-sidebar .nav-link:not(.active) { background: transparent !important; }
                .app-sidebar .nav-link:not(.active):hover { background: ${SIDEBAR_ACTIVE_BG} !important; }
                .app-sidebar .nav-main-link.active { background: ${SIDEBAR_ACTIVE_BG} !important; color: ${SIDEBAR_THEME} !important; }
                .app-sidebar .nav-sub-link.active { background: ${C.accent} !important; color: #fff !important; }
                .app-sidebar .nav-link .nav-add-btn { opacity: 0 !important; background: transparent; color: inherit; transition: opacity 0.15s; pointer-events: none; }
                .app-sidebar .nav-link:hover .nav-add-btn { opacity: 1 !important; pointer-events: auto; }
                .app-sidebar .nav-link .nav-add-btn:hover { background: rgba(6,78,59,0.08); }
                .app-sidebar .nav-group-btn:hover { background: ${SIDEBAR_ACTIVE_BG}; }
              `}</style>
              <div style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
              <div style={{ flex: 1 }}>
              {visibleNav.map((sec) => {
                const hasChildren = !sec.path && sec.items.length > 1;
                const active = isSectionActive(sec.items);
                const expanded = openSection === undefined ? active : openSection === sec.s;
                const directItem = sec.path ? sec.items[0] : null;

                if (directItem) {
                  const canAdd = directItem.addPath && (directItem.addRoles ?? directItem.r).includes(role);
                  const directActive = isItemActive(directItem);
                  return (
                    <div
                      key={sec.s}
                      style={{
                        position: "relative",
                        marginBottom: "4px",
                        borderLeft: directActive ? `2px solid ${SIDEBAR_THEME}` : "2px solid transparent",
                        transition: "border-color 0.2s ease",
                      }}
                    >
                      <NavLink
                        to={directItem.path}
                        end={directItem.end}
                        className={() => `nav-link nav-main-link${directActive ? " active" : ""}`}
                        onClick={() => isMobile && setSidebarOpen(false)}
                        style={() => ({
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          minHeight: "32px",
                          padding: "7px 10px",
                          borderRadius: 0,
                          color: directActive ? SIDEBAR_THEME : C.primary,
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: directActive ? 600 : 500,
                          width: "100%",
                          textAlign: "left",
                          fontFamily: "'Inter', 'Manrope', sans-serif",
                          transition: "all 0.15s",
                          textDecoration: "none",
                          boxSizing: "border-box",
                        })}
                      >
                        <span style={{ width: "18px", display: "inline-flex", justifyContent: "center", flexShrink: 0 }}>
                          <SidebarIcon name={sec.i} color={directActive ? SIDEBAR_THEME : C.primary} />
                        </span>
                        <span style={{ flex: 1 }}>{sec.s}</span>
                        {canAdd && (
                          <button
                            type="button"
                            className="nav-add-btn"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAddPath(directItem.addPath!);
                              if (isMobile) setSidebarOpen(false);
                            }}
                            style={{
                              marginLeft: "auto",
                              padding: 0,
                              border: "none",
                              color: "inherit",
                              cursor: "pointer",
                              borderRadius: R.control,
                              lineHeight: 0,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            title={`Add ${sec.s.toLowerCase()}`}
                            aria-label={`Add ${sec.s.toLowerCase()}`}
                          >
                            <CirclePlus size={13} />
                          </button>
                        )}
                      </NavLink>
                    </div>
                  );
                }

                return (
                  <div
                    key={sec.s}
                    style={{
                      marginBottom: "4px",
                      borderLeft: expanded ? `2px solid ${SIDEBAR_THEME}` : "2px solid transparent",
                      transition: "border-color 0.2s ease",
                    }}
                  >
                    <button
                      type="button"
                      className="nav-group-btn"
                      onClick={() => setOpenSection(expanded ? null : sec.s)}
                      style={{
                        width: "100%",
                        minHeight: "32px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "7px 10px",
                        border: "none",
                        borderRadius: 0,
                        background: active ? SIDEBAR_ACTIVE_BG : "transparent",
                        color: active ? SIDEBAR_THEME : C.primary,
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: active ? 600 : 500,
                        fontFamily: "'Inter', 'Manrope', sans-serif",
                        textAlign: "left",
                        transition: "all 0.15s",
                      }}
                      aria-expanded={expanded}
                    >
                      <span style={{ width: "18px", display: "inline-flex", justifyContent: "center", flexShrink: 0 }}>
                        <SidebarIcon name={sec.i} color={active ? SIDEBAR_THEME : C.primary} />
                      </span>
                      <span style={{ flex: 1 }}>{sec.s}</span>
                      {hasChildren && (
                        <span
                          style={{
                            display: "inline-flex",
                            color: "inherit",
                          }}
                        >
                          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      )}
                    </button>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateRows: expanded ? "1fr" : "0fr",
                        opacity: expanded ? 1 : 0,
                        transition: "grid-template-rows 0.22s ease, opacity 0.18s ease",
                      }}
                    >
                      <div style={{ overflow: "hidden" }}>
                        <div style={{ display: "grid", gap: "4px", padding: expanded ? "5px 0 2px 28px" : "0 0 0 28px", transition: "padding 0.22s ease" }}>
                        {sec.items.map((item) => {
                          const canAdd = item.addPath && (item.addRoles ?? item.r).includes(role);
                          const itemActive = isItemActive(item);
                          return (
                            <NavLink
                              key={item.path}
                              to={item.path}
                              end={item.end}
                              className={() => `nav-link nav-sub-link${itemActive ? " active" : ""}`}
                              onClick={() => isMobile && setSidebarOpen(false)}
                              style={() => ({
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                minHeight: "30px",
                                padding: "8px 8px",
                                borderRadius: R.control,
                                color: itemActive ? "#fff" : C.muted,
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: itemActive ? 600 : 500,
                                fontFamily: "'Inter', 'Manrope', sans-serif",
                                textDecoration: "none",
                                transition: "all 0.15s",
                              })}
                            >
                              <span style={{ flex: 1 }}>{item.l}</span>
                              {canAdd && (
                                <button
                                  type="button"
                                  className="nav-add-btn"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleAddPath(item.addPath!);
                                    if (isMobile) setSidebarOpen(false);
                                  }}
                                  style={{
                                    padding: 0,
                                    border: "none",
                                    color: "inherit",
                                    cursor: "pointer",
                                    borderRadius: R.control,
                                    lineHeight: 0,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                  title={`Add ${item.l.toLowerCase()}`}
                                  aria-label={`Add ${item.l.toLowerCase()}`}
                                >
                                  <CirclePlus size={12} />
                                </button>
                              )}
                            </NavLink>
                          );
                        })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
              <div
                style={{
                  position: "sticky",
                  bottom: 0,
                  paddingTop: "8px",
                  background: "#fff",
                  borderTop: `1px solid ${C.border}`,
                }}
              >
                {organizationSelector}
              </div>
              </div>
            </nav>
          </>
        <main
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            padding: isMobile ? "16px" : "32px",
            overflowY: "auto",
            overscrollBehavior: "contain",
            marginLeft: !isMobile ? sidebarWidth : 0,
          }}
        >
          <Outlet />
        </main>
      </div>
      <DeepLinkHandler />
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
    </div>
  );
}
