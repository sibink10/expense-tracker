import { useEffect, useRef, useState } from "react";
import {
  BanknoteArrowUp,
  BriefcaseBusiness,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CirclePlus,
  FolderKanban,
  HandCoins,
  LayoutDashboard,
  Menu,
  Network,
  ReceiptText,
  Target,
  Settings,
  Users,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { C } from "../shared/theme";

/** Sidebar / shell radii — unchanged from before the 0.75rem app-wide update */
const SIDEBAR_R = {
  control: "4px",
  item: "8px",
  panel: "10px",
  profilePanel: "12px",
} as const;
import { buildNav } from "../shared/nav";
import Modals from "../components/Modals";
import DeepLinkHandler from "../components/DeepLinkHandler";
import { useAppContext } from "../context/AppContext";
import { logoutSession } from "../shared/auth/sessionAuth";
import { selectOrganization } from "../shared/api";
import { MODAL_T } from "../shared/constants";
import type { UserRole } from "../types";

const navIcons = {
  dashboard: LayoutDashboard,
  expenses: ReceiptText,
  forecasts: Target,
  advances: BanknoteArrowUp,
  vendors: BriefcaseBusiness,
  clients: HandCoins,
  employees: Users,
  requests: FolderKanban,
  organization: Network,
  workspace: FolderKanban,
  settings: Settings,
  payable: TrendingDown,
  receivable: TrendingUp,
} as const;

type NavIconKey = keyof typeof navIcons;
const SIDEBAR_THEME = "#064e3b";
const SIDEBAR_ACTIVE_BG = "#ECFDF5";
const SIDEBAR_WIDTH_EXPANDED = 260;
const SIDEBAR_WIDTH_COLLAPSED = 56;
const SIDEBAR_COLLAPSED_KEY = "qfh.sidebarCollapsed";

function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

function SidebarIcon({ name, color }: { name?: string; color: string }) {
  const Icon = navIcons[(name as NavIconKey) || "dashboard"] ?? CirclePlus;
  return <Icon size={15} strokeWidth={1.8} color={color} />;
}

export default function Layout() {
  const location = useLocation();
  const {
    user,
    setUser,
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
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const sidebarNavRef = useRef<HTMLElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed);
  const [navPopover, setNavPopover] = useState<string | null>(null);
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

  const handleLogout = async () => {
    await logoutSession();
    setUser(null);
    window.location.href = "/";
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

  useEffect(() => {
    if (!profileOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [profileOpen]);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
    } catch {
      // ignore storage errors
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    setNavPopover(null);
  }, [location.pathname]);

  useEffect(() => {
    if (!navPopover && !orgOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (sidebarNavRef.current?.contains(event.target as Node)) return;
      setNavPopover(null);
      setOrgOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [navPopover, orgOpen]);

  useEffect(() => {
    if (!navPopover) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavPopover(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [navPopover]);

  const nav = buildNav(cfg);
  const visibleNav = nav
    .map((sec) => ({
      ...sec,
      items: sec.items.filter((n) =>
        n.r.includes(user.role as UserRole)
      ),
    }))
    .filter((sec) => sec.items.length > 0);

  const isCollapsedDesktop = sidebarCollapsed && !isMobile;
  const effectiveSidebarWidth = isMobile
    ? SIDEBAR_WIDTH_EXPANDED
    : sidebarCollapsed
      ? SIDEBAR_WIDTH_COLLAPSED
      : SIDEBAR_WIDTH_EXPANDED;
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

  const renderSubNavItems = (items: typeof visibleNav[number]["items"]) =>
    items.map((item) => {
      const canAdd = item.addPath && (item.addRoles ?? item.r).includes(role);
      const itemActive = isItemActive(item);
      return (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.end}
          className={() => `nav-link nav-sub-link${itemActive ? " active" : ""}`}
          onClick={() => {
            if (isMobile) setSidebarOpen(false);
            setNavPopover(null);
          }}
          style={() => ({
            display: "flex",
            alignItems: "center",
            gap: "6px",
            minHeight: "30px",
            padding: "8px 8px",
            borderRadius: SIDEBAR_R.control,
            color: itemActive ? "#fff" : C.muted,
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: itemActive ? 600 : 500,
            fontFamily: "'Inter', 'Manrope', sans-serif",
            textDecoration: "none",
            transition: "all 0.15s",
          })}
          role="menuitem"
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
                setNavPopover(null);
              }}
              style={{
                padding: 0,
                border: "none",
                color: "inherit",
                cursor: "pointer",
                borderRadius: SIDEBAR_R.control,
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
    });

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
    <div style={{ position: "relative", width: isCollapsedDesktop ? "auto" : "100%" }}>
      <button
        type="button"
        onClick={() => {
          if (orgs.length === 0) return;
          setNavPopover(null);
          setOrgOpen((v) => !v);
        }}
        title={isCollapsedDesktop ? activeOrg?.orgName || "Qubiqon" : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: isCollapsedDesktop ? "center" : undefined,
          gap: "8px",
          width: isCollapsedDesktop ? "40px" : "100%",
          margin: isCollapsedDesktop ? "0 auto" : undefined,
          padding: isCollapsedDesktop ? "6px" : "8px",
          borderRadius: SIDEBAR_R.control,
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
        {!isCollapsedDesktop && (
          <>
            <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: C.primary, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {activeOrg?.orgName || "Qubiqon"}
              </div>
              <div style={{ fontSize: "9px", color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {activeOrg?.subName || "Finance Hub"}
              </div>
            </div>
            {orgs.length > 0 && <ChevronDown size={14} color={C.muted} />}
          </>
        )}
      </button>
      {orgOpen && orgs.length > 0 && (
        <div
          style={{
            position: "absolute",
            ...(isCollapsedDesktop
              ? { left: "calc(100% + 6px)", bottom: 0, width: "220px" }
              : { bottom: "calc(100% + 4px)", left: 0, right: 0 }),
            background: "#fff",
            borderRadius: SIDEBAR_R.panel,
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
                  borderRadius: SIDEBAR_R.item,
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
          {isMobile ? (
            <button
              type="button"
              onClick={() => {
                setSidebarOpen((v) => !v);
                setOrgOpen(false);
              }}
              aria-expanded={sidebarOpen}
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "34px",
                height: "34px",
                border: `1px solid ${C.successBg}`,
                borderRadius: SIDEBAR_R.control,
                background: SIDEBAR_ACTIVE_BG,
                color: SIDEBAR_THEME,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Menu size={18} strokeWidth={2} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSidebarCollapsed((v) => {
                  if (!v) setNavPopover(null);
                  return !v;
                });
                setOrgOpen(false);
              }}
              aria-expanded={!sidebarCollapsed}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "20px",
                height: "20px",
                padding: 0,
                border: `1px solid ${C.successBg}`,
                borderRadius: "50%",
                background: SIDEBAR_ACTIVE_BG,
                color: SIDEBAR_THEME,
                cursor: "pointer",
                flexShrink: 0,
                boxShadow: "0 1px 6px rgba(33,146,104,0.16)",
              }}
            >
              {sidebarCollapsed ? (
                <ChevronRight size={12} strokeWidth={2.4} />
              ) : (
                <ChevronLeft size={12} strokeWidth={2.4} />
              )}
            </button>
          )}
          {organizationSummary}
        </div>
        <div ref={profileMenuRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => {
              setProfileOpen((v) => !v);
              setOrgOpen(false);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: isMobile ? "2px" : "2px 4px 2px 2px",
              border: "none",
              borderRadius: SIDEBAR_R.control,
              background: "transparent",
              cursor: "pointer",
              fontFamily: "'Inter', 'Manrope', sans-serif",
              maxWidth: isMobile ? undefined : "220px",
            }}
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            title={`${user.name} (${user.role})`}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "999px",
                border: `1px solid ${C.successBg}`,
                background: C.clientAvatarBg,
                color: C.clientAvatarText,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                fontWeight: 800,
                flexShrink: 0,
                boxShadow: "0 4px 14px rgba(33,146,104,0.15)",
              }}
            >
              {userInitial}
            </div>
            {!isMobile && (
              <div style={{ textAlign: "left", minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: C.primary,
                    lineHeight: 1.1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user.name || user.email}
                </div>
                <div
                  style={{
                    fontSize: "9px",
                    color: C.muted,
                    textTransform: "capitalize",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user.role}
                </div>
              </div>
            )}
            {!isMobile && <ChevronDown size={14} color={C.muted} style={{ flexShrink: 0 }} />}
          </button>
          {profileOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: "230px",
                background: "#fff",
                borderRadius: SIDEBAR_R.profilePanel,
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
                    borderRadius: SIDEBAR_R.control,
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
              ref={sidebarNavRef}
              className="app-sidebar"
              style={{
                position: "fixed",
                top: 50,
                left: 0,
                height: "calc(100vh - 50px)",
                width: effectiveSidebarWidth,
                background: "#fff",
                borderRight: `1px solid ${C.border}`,
                padding: "8px",
                overflowY: isCollapsedDesktop ? "visible" : "auto",
                overflowX: isCollapsedDesktop ? "visible" : "hidden",
                overscrollBehavior: "contain",
                zIndex: isMobile ? 100 : 10,
                transform: isMobile && !sidebarOpen ? `translateX(-${SIDEBAR_WIDTH_EXPANDED}px)` : "translateX(0)",
                transition: "width 0.22s ease, transform 0.24s ease",
                willChange: isMobile ? "transform" : "width",
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

                  if (isCollapsedDesktop) {
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
                          title={sec.s}
                          className={() => `nav-link nav-main-link${directActive ? " active" : ""}`}
                          style={() => ({
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minHeight: "32px",
                            padding: "7px 4px",
                            borderRadius: 0,
                            color: directActive ? SIDEBAR_THEME : C.primary,
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: directActive ? 600 : 500,
                            width: "100%",
                            fontFamily: "'Inter', 'Manrope', sans-serif",
                            transition: "all 0.15s",
                            textDecoration: "none",
                            boxSizing: "border-box",
                          })}
                        >
                          <SidebarIcon name={sec.i} color={directActive ? SIDEBAR_THEME : C.primary} />
                        </NavLink>
                      </div>
                    );
                  }

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
                              borderRadius: SIDEBAR_R.control,
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

                if (isCollapsedDesktop) {
                  const popoverOpen = navPopover === sec.s;
                  return (
                    <div
                      key={sec.s}
                      style={{
                        position: "relative",
                        marginBottom: "4px",
                        borderLeft: active ? `2px solid ${SIDEBAR_THEME}` : "2px solid transparent",
                        transition: "border-color 0.2s ease",
                      }}
                    >
                      <button
                        type="button"
                        className="nav-group-btn"
                        title={sec.s}
                        aria-expanded={popoverOpen}
                        aria-haspopup="menu"
                        onClick={() => {
                          setOrgOpen(false);
                          setNavPopover(popoverOpen ? null : sec.s);
                        }}
                        style={{
                          width: "100%",
                          minHeight: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "7px 4px",
                          border: "none",
                          borderRadius: 0,
                          background: active ? SIDEBAR_ACTIVE_BG : "transparent",
                          color: active ? SIDEBAR_THEME : C.primary,
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: active ? 600 : 500,
                          fontFamily: "'Inter', 'Manrope', sans-serif",
                          transition: "all 0.15s",
                        }}
                      >
                        <SidebarIcon name={sec.i} color={active ? SIDEBAR_THEME : C.primary} />
                      </button>
                      {popoverOpen && (
                        <div
                          role="menu"
                          style={{
                            position: "absolute",
                            left: "calc(100% + 6px)",
                            top: 0,
                            minWidth: "200px",
                            background: "#fff",
                            borderRadius: SIDEBAR_R.panel,
                            border: `1px solid ${C.border}`,
                            boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                            padding: "6px 4px",
                            zIndex: 200,
                            maxHeight: "320px",
                            overflowY: "auto",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: C.primary,
                              padding: "6px 8px 8px",
                              borderBottom: `1px solid ${C.border}`,
                              marginBottom: "4px",
                            }}
                          >
                            {sec.s}
                          </div>
                          <div style={{ display: "grid", gap: "4px" }}>
                            {renderSubNavItems(sec.items)}
                          </div>
                        </div>
                      )}
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
                        {renderSubNavItems(sec.items)}
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
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            marginLeft: !isMobile ? effectiveSidebarWidth : 0,
            transition: "margin-left 0.22s ease",
          }}
        >
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", width: "100%" }}>
            <Outlet />
          </div>
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
