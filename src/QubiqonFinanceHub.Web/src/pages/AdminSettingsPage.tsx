import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../shared/theme";
import { Inp, Btn, Toggle } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { isEmailListValid } from "../shared/utils";
import { bulkUpsertOrganizationSettings } from "../shared/api/organizationSettings";

const GRID_COLS = { sm: 1, md: 2, lg: 3 };

export default function AdminSettingsPage() {
  const navigate = useNavigate();
  const { cfg, t, orgSettings, refreshOrgSettings } = useAppContext();
  const [c, setC] = useState(cfg);
  const [ccError, setCcError] = useState<string | null>(null);
  const [cols, setCols] = useState(3);

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

  const handleSave = async () => {
    setCcError(null);
    const ccStr = c.ccEmails.join(", ");
    if (ccStr.trim() && !isEmailListValid(ccStr)) {
      setCcError("Enter valid email addresses (comma-separated)");
      return;
    }
    try {
      await bulkUpsertOrganizationSettings([
        { id: orgSettings.expFmt?.id ?? null, key: "expFmt", value: c.expFmt },
        { id: orgSettings.billFmt?.id ?? null, key: "billFmt", value: c.billFmt },
        { id: orgSettings.advFmt?.id ?? null, key: "advFmt", value: c.advFmt },
        { id: orgSettings.invFmt?.id ?? null, key: "invFmt", value: c.invFmt },
        { id: orgSettings.advEnabled?.id ?? null, key: "advEnabled", value: String(!!c.advEnabled) },
        { id: orgSettings.advCap?.id ?? null, key: "advCap", value: String(c.advCap ?? 0) },
        { id: orgSettings.ccEmails?.id ?? null, key: "ccEmails", value: c.ccEmails.join(", ") },
      ]);
      await refreshOrgSettings();
      t("Saved");
    } catch {
      t("Failed to save settings");
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
            value={c.expFmt}
            onChange={(e) => setC({ ...c, expFmt: e.target.value })}
            hint="{YYYY}, {YY}, {SEQ:N}"
          />
          <Inp label="Bill" value={c.billFmt} onChange={(e) => setC({ ...c, billFmt: e.target.value })} />
          <Inp label="Advance" value={c.advFmt} onChange={(e) => setC({ ...c, advFmt: e.target.value })} />
          <Inp
            label="Invoice"
            value={c.invFmt}
            onChange={(e) => setC({ ...c, invFmt: e.target.value })}
            hint="{TYPE}=SEZ/DOM/EXP, {YYMM}, {SEQ:N}"
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
            onChange={(e) => setC({ ...c, advCap: parseInt(e.target.value) || 0 })}
          />
          <Inp
            label="Balance cap (₹)"
            type="number"
            value={String(c.balanceCap)}
            disabled
            hint="Shown for reference only"
          />
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
            hint="CC'd on all payment emails"
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
        <Btn onClick={handleSave}>Save settings</Btn>
      </div>
    </div>
  );
}
