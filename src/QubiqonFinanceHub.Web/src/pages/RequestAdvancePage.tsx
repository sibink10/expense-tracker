import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../shared/theme";
import { fmtCur } from "../shared/utils";
import { Inp, Btn, Av } from "../components/ui";
import { useAppContext } from "../context/AppContext";
import { createAdvance } from "../shared/api/advance";

export default function RequestAdvancePage() {
  const navigate = useNavigate();
  const { cfg, user, setEmail, t, refreshOrgSettings } = useAppContext();
  const [amt, setAmt] = useState("");
  const [pur, setPur] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const balanceCap = cfg.balanceCap ?? 0;
  const over = parseFloat(amt) > balanceCap;

  useEffect(() => {
    void refreshOrgSettings().catch(() => undefined);
  }, [refreshOrgSettings]);

  const submit = async () => {
    const amount = parseFloat(amt);
    if (isNaN(amount) || amount <= 0 || !pur) return;

    setLoading(true);
    setError(null);
    try {
      await createAdvance({ amount, purpose: pur });
      setEmail({ to: "Approvers", subj: `New advance request from ${user.name}` });
      t("Advance submitted");
      navigate("/advances");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit advance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "500px" }}>
      <h1
        style={{
          fontSize: "20px",
          fontWeight: 700,
          margin: "0 0 20px",
          color: C.advance,
        }}
      >
        Request advance
      </h1>
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "20px",
          border: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px 14px",
            background: C.advanceBg,
            borderRadius: "8px",
            marginBottom: "14px",
          }}
        >
          <Av n={user.name} sz={32} />
          <div>
            <div style={{ fontSize: "12px", fontWeight: 600 }}>{user.name}</div>
            <div style={{ fontSize: "10px", color: C.muted }}>
              {user.dept} · Balance cap: {fmtCur(balanceCap)}
            </div>
          </div>
        </div>
        <Inp
          label="Amount (₹)"
          type="number"
          value={amt}
          onChange={(e) => setAmt(e.target.value)}
          req
          min="1"
          ph={`Max ${fmtCur(balanceCap)}`}
        />
        {over && (
          <div
            style={{
              fontSize: "11px",
              color: C.danger,
              marginTop: "-10px",
              marginBottom: "14px",
            }}
          >
            ⚠ Exceeds balance cap
          </div>
        )}
        <Inp
          label="Purpose"
          type="textarea"
          value={pur}
          onChange={(e) => setPur(e.target.value)}
          req
          ph="Why do you need this advance?"
        />
        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: C.dangerBg,
              color: C.danger,
              borderRadius: "8px",
              fontSize: "12px",
              marginBottom: "14px",
            }}
          >
            {error}
          </div>
        )}
        <Btn
          v="advance"
          onClick={submit}
          disabled={!amt || !pur || over || loading}
        >
          {loading ? "Submitting..." : "Submit"}
        </Btn>
      </div>
    </div>
  );
}
