import { useState } from "react";
import { C } from "../shared/theme";
import { Inp, Btn } from "../components/ui";
import { useAppContext } from "../context/AppContext";

export default function AdminSettingsPage() {
  const { cfg, setCfg, t } = useAppContext();
  const [c, setC] = useState(cfg);

  return (
    <div style={{ maxWidth: "560px" }}>
      <h1 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 20px" }}>⚙ Settings</h1>
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          border: `1px solid ${C.border}`,
          marginBottom: "16px",
        }}
      >
        <h3 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 12px" }}>Code formats</h3>
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
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          border: `1px solid ${C.border}`,
          marginBottom: "16px",
        }}
      >
        <h3
          style={{
            fontSize: "14px",
            fontWeight: 700,
            margin: "0 0 12px",
            color: C.advance,
          }}
        >
          Advance settings
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600 }}>Enabled</span>
          <button
            onClick={() => setC({ ...c, advEnabled: !c.advEnabled })}
            style={{
              width: "40px",
              height: "22px",
              borderRadius: "11px",
              border: "none",
              background: c.advEnabled ? C.advance : C.border,
              cursor: "pointer",
              position: "relative",
            }}
          >
            <div
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                background: "#fff",
                position: "absolute",
                top: "2px",
                left: c.advEnabled ? "20px" : "2px",
                transition: "left 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }}
            />
          </button>
        </div>
        <Inp
          label="Cap (₹)"
          type="number"
          value={String(c.advCap)}
          onChange={(e) => setC({ ...c, advCap: parseInt(e.target.value) || 0 })}
        />
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          border: `1px solid ${C.border}`,
          marginBottom: "16px",
        }}
      >
        <h3 style={{ fontSize: "14px", fontWeight: 700, margin: "0 0 12px" }}>Email CC</h3>
        <Inp
          label="Default CC"
          value={c.ccEmails.join(", ")}
          onChange={(e) =>
            setC({ ...c, ccEmails: e.target.value.split(",").map((s) => s.trim()) })
          }
          hint="CC'd on all payment emails"
        />
      </div>
      <Btn
        onClick={() => {
          setCfg(c);
          t("Saved");
        }}
      >
        Save settings
      </Btn>
    </div>
  );
}
