import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../shared/theme";
import { Inp, Btn, Toggle } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { getOrganization } from "../shared/api";
import { isEmailListValid, fmtCur } from "../shared/utils";
import { bulkUpsertOrganizationSettings } from "../shared/api/organizationSettings";

const GRID_COLS = { sm: 1, md: 2, lg: 3 };

export default function AdminSettingsPage() {
  const navigate = useNavigate();
  const { cfg, t, orgSettings, refreshOrgSettings, activeOrg, setActiveOrg, is } = useAppContext();
  const [c, setC] = useState(cfg);
  const [ccError, setCcError] = useState<string | null>(null);
  const [cols, setCols] = useState(3);
  const [saving, setSaving] = useState(false);
  const [resettingBalance, setResettingBalance] = useState(false);
  const [openTip, setOpenTip] = useState<string | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const compute = () => {
      if (typeof window === "undefined") return;
      const w = window.innerWidth;
      if (w < 640) setCols(GRID_COLS.sm);
      else if (w < 1024) setCols(GRID_COLS.md);
      else setCols(GRID_COLS.lg);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  useEffect(() => {
    setC(cfg);
  }, [cfg]);

  useEffect(() => {
    void refreshOrgSettings().catch(() => undefined);
  }, [refreshOrgSettings]);

  useEffect(() => {
    if (!activeOrg?.id) return;
    let cancelled = false;
    void getOrganization(activeOrg.id)
      .then((org) => {
        if (cancelled) return;
        setActiveOrg((prev) => ({
          ...(prev ?? {}),
          ...org,
          selected: org.selected ?? prev?.selected,
        }));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [activeOrg?.id, setActiveOrg]);

  useEffect(() => {
    if (!openTip) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (tipRef.current && !tipRef.current.contains(event.target as Node)) {
        setOpenTip(null);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [openTip]);

  const handleSave = async () => {
    setCcError(null);
    const ccStr = c.ccEmails.join(", ");
    if (ccStr.trim() && !isEmailListValid(ccStr)) {
      setCcError("Enter valid email addresses (comma-separated)");
      return;
    }
    const advCapNum = Number(c.advCap) || 0;
    const balanceCapNum = Number(c.balanceCap) || 0;
    if (balanceCapNum > advCapNum) {
      t(`Balance cap cannot exceed the advance cap (${fmtCur(advCapNum)}).`, "no");
      return;
    }
    setSaving(true);
    try {
      await bulkUpsertOrganizationSettings([
        { id: orgSettings.expFmt?.id ?? null, key: "expFmt", value: c.expFmt },
        { id: orgSettings.billFmt?.id ?? null, key: "billFmt", value: c.billFmt },
        { id: orgSettings.advFmt?.id ?? null, key: "advFmt", value: c.advFmt },
        { id: orgSettings.invFmt?.id ?? null, key: "invFmt", value: c.invFmt },
        { id: orgSettings.advEnabled?.id ?? null, key: "advEnabled", value: String(!!c.advEnabled) },
        { id: orgSettings.advCap?.id ?? null, key: "advCap", value: String(c.advCap ?? 0) },
        { id: orgSettings.balanceCap?.id ?? null, key: "balanceCap", value: String(Number(c.balanceCap) || 0) },
        { id: orgSettings.ccEmails?.id ?? null, key: "ccEmails", value: c.ccEmails.join(", ") },
      ]);
      await refreshOrgSettings();
      t("Saved");
    } catch {
      t("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleResetBalanceCap = async () => {
    const cap = c.advCap ?? 0;
    setResettingBalance(true);
    try {
      await bulkUpsertOrganizationSettings([
        {
          id: orgSettings.balanceCap?.id ?? null,
          key: "balanceCap",
          value: String(cap),
        },
      ]);
      await refreshOrgSettings();
      setC((prev) => ({ ...prev, balanceCap: cap }));
      t("Balance cap reset to cap amount");
    } catch {
      t("Failed to reset balance cap");
    } finally {
      setResettingBalance(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    borderRadius: "12px",
    border: `1px solid ${C.border}`,
    padding: "20px",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    height: "100%",
    boxSizing: "border-box",
  };

  const formatAdornment = (label: string, tipId: string, lines: string[]) => (
    <div ref={openTip === tipId ? tipRef : null} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <button
        type="button"
        onClick={() => setOpenTip((prev) => (prev === tipId ? null : tipId))}
        style={{
          width: "18px",
          height: "18px",
          borderRadius: "50%",
          border: `1px solid ${C.border}`,
          background: C.surface,
          color: C.muted,
          fontSize: "10px",
          fontWeight: 700,
          lineHeight: 1,
          cursor: "pointer",
          padding: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'DM Sans'",
        }}
        aria-label={`Format help for ${label}`}
      >
        i
      </button>
      {openTip === tipId && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 10px)",
            right: 0,
            width: "260px",
            padding: "10px 12px",
            borderRadius: "10px",
            background: "#fff",
            border: `1px solid ${C.border}`,
            boxShadow: "0 10px 24px rgba(15,23,42,0.12)",
            color: C.primary,
            fontSize: "11px",
            lineHeight: 1.45,
            zIndex: 2000,
          }}
        >
          {lines.map((line) => (
            <div key={line} style={{ marginBottom: "4px" }}>
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ width: "100%", maxWidth: "100%" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
          <span style={{ color: C.primary }}>⚙</span> Settings
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: "12px", color: C.muted }}>
          Configure code formats, advance limits and email defaults.
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: cols === 1 ? "1fr" : cols === 2 ? "1fr 1fr" : "1fr 1fr 1fr",
          gap: "16px",
        }}
      >
        {/* Code formats */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "20px" }}>📋</span>
            <h3 style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>Code formats</h3>
          </div>
          <Inp
            label="Expense"
            endAdornment={formatAdornment("Expense", "expFmt", [
              "Use placeholders like {YYYY}, {YY} and {SEQ:N}.",
              "{SEQ:N} increases the running count and N sets zero padding.",
              "Example: EXP-{YYYY}-{SEQ:5} -> EXP-2026-00001",
            ])}
            value={c.expFmt}
            onChange={(e) => setC({ ...c, expFmt: e.target.value })}
          />
          <Inp
            label="Bill"
            endAdornment={formatAdornment("Bill", "billFmt", [
              "Use placeholders like {YYYY}, {YY} and {SEQ:N}.",
              "{SEQ:N} increases the running count and N sets zero padding.",
              "Example: BL-{SEQ:3}/{YY}-{YY+1} -> BL-001/26-27",
            ])}
            value={c.billFmt}
            onChange={(e) => setC({ ...c, billFmt: e.target.value })}
          />
          <Inp
            label="Advance"
            endAdornment={formatAdornment("Advance", "advFmt", [
              "Use placeholders like {YYYY}, {YY} and {SEQ:N}.",
              "{SEQ:N} increases the running count and N sets zero padding.",
              "Example: ADV-{YYYY}-{SEQ:4} -> ADV-2026-0001",
            ])}
            value={c.advFmt}
            onChange={(e) => setC({ ...c, advFmt: e.target.value })}
          />
          <Inp
            label="Invoice"
            endAdornment={formatAdornment("Invoice", "invFmt", [
              "Use placeholders like {TYPE}, {YYYY}, {YYMM} and {SEQ:N}.",
              "{TYPE} can be SEZ, DOM or EXP.",
              "{SEQ:N} increases the running count and N sets zero padding.",
              "Example: QINV-{TYPE}-{YYMM}{SEQ:3} -> QINV-DOM-2604001",
            ])}
            value={c.invFmt}
            onChange={(e) => setC({ ...c, invFmt: e.target.value })}
          />
        </div>

        {/* Advance settings */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "20px" }}>⤴</span>
            <h3 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: C.advance }}>Advance settings</h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600 }}>Enabled</span>
            <Toggle checked={c.advEnabled} onChange={(v) => setC({ ...c, advEnabled: v })} />
          </div>
          <Inp
            label="Cap (₹)"
            type="number"
            value={String(c.advCap)}
            onChange={(e) => {
              const n = parseFloat(e.target.value);
              const adv = Number.isFinite(n) ? Math.max(0, n) : 0;
              setC((prev) => ({
                ...prev,
                advCap: adv,
                balanceCap: Math.min(Number(prev.balanceCap) || 0, adv),
              }));
            }}
            min="0"
          />
          <div style={{ marginBottom: "14px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
                marginBottom: "4px",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: C.primary,
                  margin: 0,
                }}
              >
                Balance cap (₹)
              </span>
              <Btn
                sm
                v="secondary"
                onClick={handleResetBalanceCap}
                disabled={resettingBalance || saving}
                sx={{ flexShrink: 0 }}
              >
                {resettingBalance ? "…" : "Reset"}
              </Btn>
            </div>
            <Inp
              type="number"
              value={String(c.balanceCap)}
              onChange={(e) => {
                const n = parseFloat(e.target.value);
                const adv = Number(c.advCap) || 0;
                const raw = Number.isFinite(n) ? Math.max(0, n) : 0;
                setC({ ...c, balanceCap: Math.min(raw, adv) });
              }}
              disabled={!is("admin")}
              min="0"
              max={String(Math.max(0, Number(c.advCap) || 0))}
              hint={
                is("admin")
                  ? `Remaining advance pool for approvals (cannot exceed advance cap ${fmtCur(Number(c.advCap) || 0)}). Save with other settings, or use Reset to match the cap above.`
                  : "Remaining advance pool. Only an administrator can adjust this value."
              }
              style={{ marginBottom: 0 }}
            />
          </div>
        </div>

        {/* Email CC */}
        <div style={{ ...cardStyle, gridColumn: cols === 3 ? "1 / -1" : undefined }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "20px" }}>✉</span>
            <h3 style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>Email CC</h3>
          </div>
          <Inp
            label="Default CC"
            value={c.ccEmails.join(", ")}
            onChange={(e) => {
              setC({ ...c, ccEmails: e.target.value.split(",").map((s) => s.trim()) });
              setCcError(null);
            }}
            onBlur={() => {
              const v = c.ccEmails.join(", ");
              if (v.trim() && !isEmailListValid(v)) setCcError("Enter valid email addresses (comma-separated)");
              else setCcError(null);
            }}
            ph="a@company.com, b@company.com"
            hint="CC'd on all payment emails. Separate multiple addresses with commas."
          />
          {ccError && <div style={{ fontSize: "11px", color: C.danger, marginTop: "-8px" }}>{ccError}</div>}
        </div>
      </div>

      {/* Quick links */}
      <div
        style={{
          marginTop: "24px",
          paddingTop: "20px",
          borderTop: `1px solid ${C.border}`,
        }}
      >
        <h3 style={{ fontSize: "12px", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>
          More settings
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: cols === 1 ? "1fr" : "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "10px",
          }}
        >
          {[
            { path: "/admin/org", icon: "🏢", label: "Organization" },
            { path: "/admin/tax", icon: "📊", label: "Tax config" },
            { path: "/admin/categories", icon: "🏷", label: "Categories" },
            { path: "/admin/email", icon: "✉", label: "Email templates" },
          ].map(({ path, icon, label }) => (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 14px",
                background: "#fff",
                border: `1px solid ${C.border}`,
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 600,
                color: C.primary,
                cursor: "pointer",
                fontFamily: "'DM Sans'",
                textAlign: "left",
              }}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "24px" }}>
        <Btn onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save settings"}</Btn>
      </div>
    </div>
  );
}
