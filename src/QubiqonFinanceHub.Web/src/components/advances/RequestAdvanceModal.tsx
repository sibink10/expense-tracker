import { useEffect, useState } from "react";
import { CirclePlus, X } from "lucide-react";
import { C } from "../../shared/theme";
import { fmtCur } from "../../shared/utils";
import { Alert, Av, Btn, Inp, Mdl } from "../ui";
import { useAppContext } from "../../context/AppContext";
import { createAdvance } from "../../shared/api/advance";

export default function RequestAdvanceModal() {
  const { cfg, user, setEmail, setMdl, t, refreshOrgSettings } = useAppContext();
  const [amt, setAmt] = useState("");
  const [pur, setPur] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const balanceCap = cfg.balanceCap ?? 0;
  const parsedAmount = parseFloat(amt);
  const invalidAmount = amt.trim() !== "" && (isNaN(parsedAmount) || parsedAmount <= 0);
  const over = !invalidAmount && parsedAmount > balanceCap;

  useEffect(() => {
    void refreshOrgSettings().catch(() => undefined);
  }, [refreshOrgSettings]);

  const submit = async () => {
    const amount = parseFloat(amt);
    if (isNaN(amount) || amount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }
    if (!pur.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await createAdvance({ amount, purpose: pur.trim() });
      setEmail({ to: "Approvers", subj: `New advance request from ${user.name}` });
      t("Advance submitted");
      setMdl(null);
      window.dispatchEvent(new CustomEvent("advances-refresh"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit advance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Mdl open close={() => !loading && setMdl(null)} title="Request advance">
      <div
        style={{
          background: C.white,
          borderRadius: "12px",
          padding: "4px 0 0",
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
            <div style={{ fontSize: "12px", fontWeight: 600, color: C.primary }}>{user.name}</div>
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
        {error && <Alert sx={{ marginBottom: "14px" }}>{error}</Alert>}
        <div style={{ marginTop: "18px", display: "flex", justifyContent: "flex-end", gap: "8px", flexWrap: "wrap" }}>
          <Btn
            v="secondary"
            sm
            onClick={() => setMdl(null)}
            disabled={loading}
            sx={{ borderRadius: "4px" }}
          >
            <X size={15} strokeWidth={1.8} />
            Cancel
          </Btn>
          <Btn
            v="primary"
            sm
            onClick={submit}
            disabled={!amt || !pur.trim() || invalidAmount || over || loading}
            sx={{ borderRadius: "4px", boxShadow: C.cardShadow }}
          >
            <CirclePlus size={15} strokeWidth={1.8} />
            {loading ? "Submitting..." : "Submit"}
          </Btn>
        </div>
      </div>
    </Mdl>
  );
}
